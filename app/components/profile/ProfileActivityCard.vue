<script setup lang="ts">
import type { ActivityItem } from '~/types/profile'

defineProps<{
  activity: ActivityItem[]
}>()

const toneClass = {
  success: 'icon-box-success',
  info: 'icon-box-info',
  primary: 'icon-box-primary',
  warning: 'icon-box-warning'
}
</script>

<template>
  <section class="section-card">
    <div class="mb-5 flex items-center justify-between gap-3">
      <h3 class="text-xl font-semibold text-[var(--color-text)]">
        Recent Activity
      </h3>
      <button
        type="button"
        class="text-sm font-semibold text-[var(--color-primary)]"
      >
        View all
      </button>
    </div>

    <div class="space-y-4">
      <div
        v-for="item in activity"
        :key="item.id"
        class="flex items-start justify-between gap-4 rounded-2xl border border-[var(--color-border)] px-4 py-4"
      >
        <div class="flex items-start gap-3">
          <div :class="['icon-box', toneClass[item.tone]]">
            <UIcon
              :name="item.icon"
              class="size-4"
            />
          </div>
          <p class="text-sm font-medium text-[var(--color-text)]">
            {{ item.title }}
          </p>
        </div>
        <span class="whitespace-nowrap text-sm text-muted">{{ item.timeAgo }}</span>
      </div>
    </div>
  </section>
</template>
