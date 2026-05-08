<script setup lang="ts">
import type { Achievement } from '~/types/profile'

defineProps<{
  achievements: Achievement[]
}>()

const toneClass = {
  warning: 'icon-box-warning',
  primary: 'icon-box-primary',
  info: 'icon-box-info',
  success: 'icon-box-success'
}
</script>

<template>
  <section class="section-card">
    <div class="mb-5 flex items-center justify-between gap-3">
      <h3 class="text-xl font-semibold text-[var(--color-text)]">
        Achievements
      </h3>
      <button
        type="button"
        class="text-sm font-semibold text-[var(--color-primary)]"
      >
        View all
      </button>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="achievement in achievements"
        :key="achievement.id"
        class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center"
      >
        <div :class="['mx-auto mb-3 icon-box', toneClass[achievement.tone]]">
          <UIcon
            :name="achievement.icon"
            class="size-4"
          />
        </div>
        <p class="text-sm font-semibold text-[var(--color-text)]">
          {{ achievement.title }}
        </p>
        <p class="mt-1 text-xs text-muted">
          {{ achievement.description }}
        </p>
      </article>
    </div>
  </section>
</template>
