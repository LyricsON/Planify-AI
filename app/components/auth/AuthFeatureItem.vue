<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  icon: string
  title: string
  description: string
  tone?: 'primary' | 'success' | 'warning' | 'info' | 'ai'
}>()

const iconBoxClass = computed(() => {
  const tone = props.tone || 'primary'
  return `icon-box icon-box-${tone}`
})
</script>

<template>
  <div class="flex items-start gap-4">
    <div :class="iconBoxClass">
      <UIcon :name="icon" class="w-5 h-5" />
    </div>
    <div>
      <h3 class="mb-1 text-[0.98rem] font-semibold text-[var(--color-text)]">
        {{ title }}
      </h3>
      <p class="max-w-[23rem] text-[0.88rem] leading-[1.65] text-[var(--color-text-muted)]">
        {{ description }}
      </p>
    </div>
  </div>
</template>
