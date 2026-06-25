<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  subtitle?: string
  icon?: string
  compact?: boolean
}>(), {
  subtitle: '',
  icon: '',
  compact: false
})
</script>

<template>
  <section
    class="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
    :class="compact ? 'p-4 sm:p-5' : 'p-5 sm:p-6'"
  >
    <header class="mb-3 flex items-center justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2.5">
          <div
            v-if="icon"
            class="flex size-8 items-center justify-center rounded-[10px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
          >
            <UIcon
              :name="icon"
              class="size-4"
            />
          </div>
          <div class="min-w-0">
            <h2 class="truncate !text-[14px] font-semibold text-[var(--color-text)] sm:!text-[14px]">
              {{ title }}
            </h2>
            <p
              v-if="subtitle"
              class="mt-1 text-[11px] leading-5 text-[var(--color-text-muted)]"
            >
              {{ subtitle }}
            </p>
          </div>
        </div>
      </div>

      <div class="shrink-0">
        <slot name="action" />
      </div>
    </header>

    <div class="min-w-0">
      <slot />
    </div>
  </section>
</template>
