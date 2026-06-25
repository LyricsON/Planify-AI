<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  isOpen: boolean
  planId: string
  planName: string
  action: 'upgrade' | 'downgrade' | 'contact' | ''
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'close'): void
}>()

const title = computed(() => {
  if (props.action === 'contact') return 'Contact Sales'
  if (props.action === 'upgrade') return 'Confirm Upgrade'
  if (props.action === 'downgrade') return 'Confirm Downgrade'
  return 'Change Plan'
})

const description = computed(() => {
  if (props.action === 'contact') {
    return 'For custom enterprise integrations, shared team workspaces, and priority support, please reach out directly. Our team will configure a custom plan tailored to your needs.'
  }
  
  const actionWord = props.action === 'upgrade' ? 'upgrade to' : 'downgrade to'
  return `Are you sure you want to change your current plan and ${actionWord} the **${props.planName}** plan? This will update your subscription and billable tokens immediately.`
})
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div 
        class="w-full max-w-md rounded-3xl bg-[var(--color-card-bg)] border border-[var(--color-border)] p-6 shadow-floating transform transition-all duration-300 scale-100"
        role="dialog"
        aria-modal="true"
      >
        <!-- Title -->
        <h3 class="text-xl font-extrabold text-[var(--color-text)] flex items-center gap-2">
          <UIcon 
            v-if="action === 'contact'" 
            name="i-lucide-building-2" 
            class="size-5 text-[var(--color-primary)]" 
          />
          <UIcon 
            v-else 
            name="i-lucide-arrow-right-left" 
            class="size-5 text-[var(--color-primary)]" 
          />
          {{ title }}
        </h3>

        <!-- Description -->
        <p class="mt-4 text-sm text-[var(--color-text-soft)] leading-relaxed">
          <span v-if="action === 'contact'">
            {{ description }}
          </span>
          <span v-else>
            Are you sure you want to change your current plan and {{ action === 'upgrade' ? 'upgrade' : 'downgrade' }} to the <strong class="text-[var(--color-text)] font-semibold">{{ planName }}</strong> plan? This will update your subscription instantly.
          </span>
        </p>

        <!-- Enterprise contact info -->
        <div 
          v-if="action === 'contact'" 
          class="mt-4 p-4 rounded-2xl bg-[var(--color-bg-soft)] border border-[var(--color-border)] text-xs text-[var(--color-text-soft)] space-y-2"
        >
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-mail" class="size-4 text-[var(--color-primary)]" />
            <span class="font-semibold">sales@planify.ai</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-phone" class="size-4 text-[var(--color-primary)]" />
            <span class="font-semibold">+216 71 000 000</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-6 flex justify-end gap-3">
          <button
            class="h-10 rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-soft)] transition disabled:opacity-50"
            :disabled="loading"
            @click="emit('close')"
          >
            Cancel
          </button>
          
          <a
            v-if="action === 'contact'"
            href="mailto:sales@planify.ai?subject=Planify%20AI%20Enterprise%20Inquiry"
            class="h-10 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition flex items-center justify-center"
            @click="emit('close')"
          >
            Email Sales
          </a>
          
          <button
            v-else
            class="h-10 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition flex items-center justify-center gap-2 disabled:opacity-50"
            :disabled="loading"
            @click="emit('confirm')"
          >
            <UIcon 
              v-if="loading" 
              name="i-lucide-loader-2" 
              class="size-4 animate-spin" 
            />
            Confirm
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
