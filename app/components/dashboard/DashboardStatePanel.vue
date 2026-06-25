<script setup lang="ts">
defineProps<{
  title: string
  description: string
  icon: string
  tone?: 'info' | 'warning' | 'danger' | 'success'
}>()

const toneClasses: Record<string, string> = {
  info: 'bg-[color-mix(in_srgb,var(--color-info)_10%,transparent)] text-[var(--color-info)]',
  warning: 'bg-[color-mix(in_srgb,var(--color-warning)_10%,transparent)] text-[var(--color-warning)]',
  danger: 'bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] text-[var(--color-danger)]',
  success: 'bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] text-[var(--color-success)]'
}
</script>

<template>
  <div class="rounded-[16px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-soft)] p-5 text-center">
    <div
      class="mx-auto flex size-11 items-center justify-center rounded-[14px]"
      :class="toneClasses[tone || 'info']"
    >
      <UIcon
        :name="icon"
        class="size-5"
      />
    </div>
    <h3 class="mt-4 text-[14px] font-semibold text-[var(--color-text)]">
      {{ title }}
    </h3>
    <p class="mt-1 text-[12px] leading-5 text-[var(--color-text-muted)]">
      {{ description }}
    </p>
  </div>
</template>
