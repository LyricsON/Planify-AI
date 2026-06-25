<script setup lang="ts">
import type { ActivityItem } from '~/types/profile'

const props = defineProps<{
  activity: ActivityItem[]
}>()

const showAllActivityModal = ref(false)
const MAX_ITEMS = 6

const visibleActivity = computed(() => {
  return props.activity.slice(0, MAX_ITEMS)
})

const canExpand = computed(() => props.activity.length > MAX_ITEMS)

const toneClass = {
  success: 'text-emerald-500',
  info: 'text-blue-500',
  primary: 'text-indigo-500',
  warning: 'text-amber-500'
}
</script>

<template>
  <section class="section-card">
    <div class="mb-3 flex items-center justify-between gap-3">
      <h3 class="text-lg font-semibold text-[var(--color-text)]">
        Recent Activity
      </h3>
      <button
        v-if="canExpand"
        type="button"
        class="text-sm font-semibold text-[var(--color-primary)] hover:opacity-85 transition"
        @click="showAllActivityModal = true"
      >
        View all
      </button>
    </div>

    <div
      v-if="props.activity.length"
      class="space-y-2"
    >
      <div
        v-for="item in visibleActivity"
        :key="item.id"
        class="activity-row"
      >
        <div class="flex min-w-0 items-center gap-2.5">
          <UIcon
            :name="item.icon"
            :class="['size-4 shrink-0', toneClass[item.color]]"
          />
          <p class="truncate text-sm font-medium text-[var(--color-text-soft)]">
            {{ item.label }}
          </p>
        </div>
        <span class="whitespace-nowrap text-sm font-medium text-[var(--color-text-muted)]">{{ item.timeAgo }}</span>
      </div>
    </div>
    <p
      v-else
      class="text-sm text-muted"
    >
      No recent activity yet.
    </p>

    <UModal
      v-model:open="showAllActivityModal"
      :ui="{
        wrapper: 'z-[120]',
        width: 'sm:max-w-2xl',
        rounded: 'rounded-[20px]',
        shadow: 'shadow-2xl',
        background: 'bg-white dark:bg-slate-900',
        ring: 'ring-1 ring-[var(--color-border)]',
        overlay: { background: 'bg-slate-900/40 backdrop-blur-[2px]' }
      }"
    >
      <template #content>
        <div class="p-5 sm:p-6">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h4 class="text-lg font-semibold text-[var(--color-text)]">All Recent Activity</h4>
            <button
              type="button"
              class="rounded-lg p-1.5 text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-text)]"
              @click="showAllActivityModal = false"
            >
              <UIcon name="i-lucide-x" class="size-4" />
            </button>
          </div>

          <div v-if="props.activity.length" class="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            <div
              v-for="item in props.activity"
              :key="`modal-${item.id}`"
              class="activity-row"
            >
              <div class="flex min-w-0 items-center gap-2.5">
                <UIcon
                  :name="item.icon"
                  :class="['size-4 shrink-0', toneClass[item.color]]"
                />
                <p class="truncate text-sm font-medium text-[var(--color-text-soft)]">
                  {{ item.label }}
                </p>
              </div>
              <span class="whitespace-nowrap text-sm font-medium text-[var(--color-text-muted)]">{{ item.timeAgo }}</span>
            </div>
          </div>
          <p v-else class="text-sm text-muted">No recent activity yet.</p>
        </div>
      </template>
    </UModal>
  </section>
</template>

<style scoped>
.activity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 2rem;
}

@media (max-width: 768px) {
  .activity-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>
