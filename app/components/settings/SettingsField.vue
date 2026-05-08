<script setup lang="ts">
defineProps<{
  label: string
  hint?: string
}>()
</script>

<template>
  <label class="block">
    <span class="mb-2 block text-sm font-medium text-[var(--color-text-soft)]">{{ label }}</span>
    <slot />
    <span
      v-if="hint"
      class="mt-1 block text-xs text-muted"
    >{{ hint }}</span>
  </label>
</template>
