<script setup lang="ts">
interface Props {
  text: string
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'neutral'
}

withDefaults(defineProps<Props>(), {
  variant: 'primary'
})
</script>

<template>
  <span
    class="status-badge px-3 py-1 text-xs font-bold shadow-sm"
    :class="{
      'status-info !bg-[var(--color-primary-soft)] !text-[var(--color-primary)] !border-[var(--color-primary)]/20': variant === 'primary',
      'status-success': variant === 'success',
      'status-warning': variant === 'warning',
      'status-info': variant === 'info',
      'status-neutral': variant === 'neutral'
    }"
  >
    {{ text }}
  </span>
</template>
