<script setup lang="ts">
import { computed, ref } from 'vue'

interface Plan {
  id: string
  name: string
  price: string
  priceSub?: string
  description?: string
  features: string[]
  isPopular?: boolean
}

interface Props {
  plan: Plan
  currentPlanId: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  (e: 'action', planId: string): void
}>()

const planValues: Record<string, number> = {
  'free': 0,
  'student': 1,
  'pro': 2,
  'enterprise': 3
}

const actionType = computed<'current' | 'upgrade' | 'downgrade' | 'contact'>(() => {
  if (props.plan.id === 'enterprise') return 'contact'
  
  const currentVal = planValues[props.currentPlanId] ?? 0
  const targetVal = planValues[props.plan.id] ?? 0
  
  if (currentVal === targetVal) return 'current'
  if (targetVal > currentVal) return 'upgrade'
  return 'downgrade'
})

const isCurrent = computed(() => props.plan.id === props.currentPlanId)

// Define card classes
const cardClasses = computed(() => {
  return [
    'flex flex-col rounded-2xl bg-white border shadow-sm transition-all duration-300 relative',
    isCurrent.value 
      ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/10 shadow-lg shadow-[var(--color-primary)]/5 z-10' 
      : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:shadow-lg',
  ]
})

// Define button classes
const buttonClasses = computed(() => {
  const type = actionType.value
  
  if (type === 'current') {
    return 'bg-white border-2 border-[var(--color-primary)] text-[var(--color-primary)] cursor-default'
  }
  if (type === 'upgrade' || type === 'contact') {
    return 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-md transition-colors'
  }
  if (type === 'downgrade') {
    return 'bg-white border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors'
  }
  return 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-md'
})

// Feature expansion logic
const isExpanded = ref(false)
const visibleFeatures = computed(() => props.plan.features.slice(0, 5))
const hiddenFeatures = computed(() => props.plan.features.slice(5))
const hasHiddenFeatures = computed(() => hiddenFeatures.value.length > 0)
</script>

<template>
  <article :class="cardClasses">
    
    <!-- Card Header Section -->
    <div class="p-6 pb-6 rounded-t-2xl border-b border-[var(--color-border)] relative overflow-hidden">
      <!-- Header Top Row: Title & Badges -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold tracking-tight text-[var(--color-text)]">
          {{ plan.name }}
        </h3>
        
        <!-- Header Badges -->
        <div class="flex gap-2">
          <span 
            v-if="isCurrent" 
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold ring-1 ring-inset ring-emerald-600/20"
          >
            <UIcon name="i-lucide-check" class="size-3" />
            Current
          </span>
          <span 
            v-if="plan.isPopular" 
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold shadow-sm"
          >
            <UIcon name="i-lucide-star" class="size-3" />
            Popular
          </span>
        </div>
      </div>
      
      <!-- Description -->
      <p class="text-sm text-[var(--color-text-soft)] leading-relaxed">
        {{ plan.description }}
      </p>

      <!-- Price -->
      <div class="mt-6 flex items-baseline gap-1">
        <span class="text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
          {{ plan.price }}
        </span>
        <span v-if="plan.priceSub" class="text-sm font-semibold text-[var(--color-text-muted)]">
          {{ plan.priceSub }}
        </span>
      </div>
    </div>

    <!-- Features & Button Section -->
    <div class="p-6 pt-6 flex flex-col flex-1">
      
      <!-- CTA Button -->
      <button
        class="w-full h-11 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 mb-8"
        :class="buttonClasses"
        :disabled="actionType === 'current' || loading"
        @click="emit('action', plan.id)"
      >
        <UIcon v-if="loading && actionType !== 'current'" name="i-lucide-loader-2" class="size-4 animate-spin" />
        <span v-if="actionType === 'current'">Current Plan</span>
        <span v-else-if="actionType === 'upgrade'">Upgrade</span>
        <span v-else-if="actionType === 'downgrade'">Downgrade</span>
        <span v-else>Contact Sales</span>
      </button>

      <!-- Features List -->
      <div class="flex-1 flex flex-col space-y-3">
        <ul class="space-y-3 text-sm text-[var(--color-text-soft)]">
          <li v-for="feature in visibleFeatures" :key="feature" class="flex items-start gap-3">
            <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]" />
            <span class="font-medium text-[var(--color-text)]">{{ feature }}</span>
          </li>
        </ul>
        
        <!-- Expandable Features -->
        <div v-if="hasHiddenFeatures" class="overflow-hidden transition-all duration-500 ease-in-out" :class="isExpanded ? 'max-h-[500px] opacity-100 mt-3' : 'max-h-0 opacity-0 m-0'">
          <ul class="space-y-3 text-sm text-[var(--color-text-soft)]">
            <li v-for="feature in hiddenFeatures" :key="feature" class="flex items-start gap-3">
              <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]" />
              <span class="font-medium text-[var(--color-text)]">{{ feature }}</span>
            </li>
          </ul>
        </div>
        
        <!-- Toggle Button -->
        <button 
          v-if="hasHiddenFeatures"
          @click="isExpanded = !isExpanded"
          class="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-[var(--color-primary)] transition-colors self-start"
        >
          <span>{{ isExpanded ? 'Hide features' : 'See all features' }}</span>
          <UIcon :name="isExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-3" />
        </button>
      </div>
      
    </div>
  </article>
</template>
