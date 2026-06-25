<script setup lang="ts">
import type { StudyGoal } from '~/types/profile'

defineProps<{
  goals: StudyGoal[]
}>()

const emit = defineEmits<{
  addGoal: []
  editGoal: [goal: StudyGoal]
  deleteGoal: [id: string]
}>()

const toneBar = {
  success: 'bg-[var(--color-success)]',
  danger: 'bg-[var(--color-danger)]',
  primary: 'bg-[var(--color-primary)]',
  warning: 'bg-[var(--color-warning)]',
  info: 'bg-[var(--color-info)]'
}

function toLocalDateLabel(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
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
    </div>

    <div
      v-if="goals.length"
      class="space-y-4"
    >
      <div
        v-for="goal in goals"
        :key="goal.id"
        class="group relative rounded-2xl border border-[var(--color-border)] p-4 transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]/10"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <h4 class="font-semibold text-sm text-[var(--color-text)] truncate">
              {{ goal.title }}
            </h4>
            <p v-if="goal.description" class="mt-0.5 text-xs text-[var(--color-text-muted)] line-clamp-2">
              {{ goal.description }}
            </p>
          </div>
          <!-- Edit / Delete actions -->
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              class="rounded-lg p-1 text-[var(--color-text-soft)] hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-primary)]"
              title="Edit goal"
              @click="emit('editGoal', goal)"
            >
              <UIcon name="i-lucide-pencil" class="size-4" />
            </button>
            <button
              type="button"
              class="rounded-lg p-1 text-[var(--color-text-soft)] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
              title="Delete goal"
              @click="emit('deleteGoal', goal.id)"
            >
              <UIcon name="i-lucide-trash-2" class="size-4" />
            </button>
          </div>
        </div>

        <!-- Progress Bar and percentage -->
        <div class="mt-3 flex items-center justify-between text-xs font-semibold text-[var(--color-text-soft)]">
          <span>{{ goal.currentValue }} / {{ goal.targetValue }} {{ goal.unit || 'units' }}</span>
          <span>{{ goal.progress }}%</span>
        </div>
        <div class="mt-1.5 h-2 rounded-full bg-[var(--color-bg-soft)] overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="toneBar[goal.tone]"
            :style="{ width: `${goal.progress}%` }"
          />
        </div>

        <!-- Deadline / Status if available -->
        <div class="mt-2.5 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span v-if="goal.deadline" class="flex items-center gap-1">
            <UIcon name="i-lucide-calendar" class="size-3.5" />
            Due {{ toLocalDateLabel(goal.deadline) }}
          </span>
          <span v-else></span>
          
          <span
            class="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold"
            :class="{
              'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300': goal.status === 'completed',
              'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300': goal.status === 'active',
              'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300': goal.status === 'archived',
            }"
          >
            {{ goal.status }}
          </span>
        </div>
      </div>
    </div>
    <p
      v-else
      class="text-sm text-muted"
    >
      No study goals added yet.
    </p>

    <button
      type="button"
      class="mt-6 inline-flex items-center gap-2 rounded-xl border border-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
      @click="emit('addGoal')"
    >
      <UIcon
        name="i-lucide-plus"
        class="size-4"
      />
      Add New Goal
    </button>
  </section>
</template>
