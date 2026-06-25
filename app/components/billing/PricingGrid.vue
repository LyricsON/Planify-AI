<script setup lang="ts">
import PlanCard from './PlanCard.vue'

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
  plans: Plan[]
  currentPlanId: string
  loading?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'action', planId: string): void
}>()
</script>

<template>
  <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-4 items-stretch py-2 w-full">
    <PlanCard
      v-for="plan in plans"
      :key="plan.id"
      :plan="plan"
      :current-plan-id="currentPlanId"
      :loading="loading"
      @action="emit('action', $event)"
    />
  </div>
</template>
