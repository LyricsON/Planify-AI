<script setup lang="ts">
import type { StudyGoal } from '~/types/profile'

defineProps<{
  goals: StudyGoal[]
}>()

const toneBar = {
  success: 'bg-[var(--color-success)]',
  danger: 'bg-[var(--color-danger)]',
  primary: 'bg-[var(--color-primary)]',
  warning: 'bg-[var(--color-warning)]',
  info: 'bg-[var(--color-info)]'
}
</script>

<template>
  <section class="section-card">
    <div class="mb-5 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="icon-box icon-box-success">
          <UIcon
            name="i-lucide-target"
            class="size-4"
          />
        </div>
        <h3 class="text-xl font-semibold text-[var(--color-text)]">
          Study Goals
        </h3>
      </div>
      <button
        type="button"
        class="text-sm font-semibold text-[var(--color-primary)]"
      >
        View all
      </button>
    </div>

    <div class="space-y-4">
      <div
        v-for="goal in goals"
        :key="goal.id"
      >
        <div class="mb-2 flex items-center justify-between gap-3">
          <p class="text-sm font-medium text-[var(--color-text)]">
            {{ goal.title }}
          </p>
          <span class="text-sm font-semibold text-[var(--color-text-soft)]">{{ goal.progress }}%</span>
        </div>
        <div class="h-2 rounded-full bg-[var(--color-bg-soft)]">
          <div
            class="h-full rounded-full"
            :class="toneBar[goal.tone]"
            :style="{ width: `${goal.progress}%` }"
          />
        </div>
      </div>
    </div>

    <button
      type="button"
      class="mt-6 inline-flex items-center gap-2 rounded-xl border border-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
    >
      <UIcon
        name="i-lucide-plus"
        class="size-4"
      />
      Add New Goal
    </button>
  </section>
</template>
