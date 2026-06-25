<script setup lang="ts">
import type { DashboardStat } from '~/types/dashboard'

defineProps<{
  stats: DashboardStat[]
  loading?: boolean
}>()

const toneClasses: Record<DashboardStat['tone'], string> = {
  primary: 'bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[var(--color-primary)]',
  success: 'bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] text-[var(--color-success)]',
  info: 'bg-[color-mix(in_srgb,var(--color-info)_10%,transparent)] text-[var(--color-info)]',
  warning: 'bg-[color-mix(in_srgb,var(--color-warning)_12%,transparent)] text-[var(--color-warning)]'
}

function captionClass(stat: DashboardStat) {
  if (stat.id === 'tasks-pending') return 'text-[#ef4444] dark:text-[#fca5a5]'
  if (stat.id === 'classes-today' || stat.id === 'productivity') return 'text-[#10b981] dark:text-[#86efac]'
  return 'text-[var(--color-text-muted)]'
}

function captionStyle(stat: DashboardStat) {
  if (stat.id === 'tasks-pending') return { color: '#ef4444' }
  if (stat.id === 'classes-today' || stat.id === 'productivity') return { color: '#10b981' }
  return undefined
}
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <article
      v-for="stat in stats"
      :key="stat.id"
      class="min-h-[108px] rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 shadow-[var(--shadow-card)]"
    >
      <div class="flex items-start gap-2.5">
        <div
          class="flex size-[34px] shrink-0 items-center justify-center rounded-[10px]"
          :class="toneClasses[stat.tone]"
        >
          <UIcon
            :name="stat.icon"
            class="size-4"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-[11px] font-medium text-[var(--color-text-muted)]">
            {{ stat.label }}
          </p>
          <p class="mt-1.5 text-[26px] font-semibold leading-none text-[var(--color-text)]">
            <span v-if="loading" class="inline-flex h-9 w-16 animate-pulse rounded bg-[var(--color-bg-soft)]" />
            <span v-else>{{ stat.value }}</span>
          </p>
          <p
            class="mt-1.5 text-[12px] font-medium"
            :class="captionClass(stat)"
            :style="captionStyle(stat)"
          >
            {{ stat.caption }}
          </p>
        </div>
      </div>
    </article>
  </div>
</template>
