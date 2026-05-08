<script setup lang="ts">
import type { ProfileStat } from '~/types/profile'

defineProps<{
  stats: ProfileStat[]
}>()

const toneClass = {
  primary: 'icon-box-primary',
  success: 'icon-box-success',
  info: 'icon-box-info',
  ai: 'icon-box-ai'
}
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <article
      v-for="stat in stats"
      :key="stat.id"
      class="metric-card hover-lift"
    >
      <div class="flex items-start justify-between gap-3">
        <div :class="['icon-box', toneClass[stat.tone]]">
          <UIcon
            :name="stat.icon"
            class="size-4"
          />
        </div>
        <span
          v-if="stat.trend"
          class="text-sm font-semibold text-[var(--color-success)]"
        >{{ stat.trend }}</span>
      </div>
      <div>
        <p class="text-sm text-muted">
          {{ stat.label }}
        </p>
        <p class="mt-2 text-3xl font-semibold text-[var(--color-text)]">
          {{ stat.value }}
        </p>
        <p class="mt-1 text-sm text-[var(--color-text-soft)]">
          {{ stat.caption }}
        </p>
      </div>
    </article>
  </div>
</template>
