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
      <h3 class="text-base font-semibold text-[var(--color-text)] mb-1">
        {{ title }}
      </h3>
      <p class="text-sm text-[var(--color-text-muted)] leading-relaxed">
        {{ description }}
      </p>
    </div>
  </div>
</template>
