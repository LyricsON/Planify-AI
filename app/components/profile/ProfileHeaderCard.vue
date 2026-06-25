<script setup lang="ts">
import type { ProfileDetails, ProfileSubscription, ProfileUser } from '~/types/profile'

defineProps<{
  user: ProfileUser
  profile: ProfileDetails
  subscription: ProfileSubscription
}>()

const emit = defineEmits<{
  edit: []
  'click-checklist': [id: string]
}>()

function getTooltipText(id: string): string {
  switch (id) {
    case 'picture':
      return 'Add profile picture'
    case 'bio':
      return 'Add your bio'
    case 'academic':
      return 'Add academic info'
    case 'goals':
      return 'Set study goals'
    case 'calendar':
      return 'Connect calendar'
    default:
      return 'Complete item'
  }
}
</script>

<template>
  <section class="section-card">
    <div class="grid gap-6 xl:grid-cols-[1.3fr_.9fr]">
      <div class="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div class="relative mx-auto sm:mx-0">
          <AppAvatar
            :src="user.avatar"
            :name="user.name"
            size="2xl"
            class="ring-4 ring-[var(--color-primary-soft)]"
          />
          <button
            type="button"
            class="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm"
            @click="emit('edit')"
          >
            <UIcon
              name="i-lucide-camera"
              class="size-4"
            />
          </button>
        </div>

        <div class="min-w-0 flex-1 text-center sm:text-left">
          <div class="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <h2 class="text-3xl font-semibold text-[var(--color-text)]">
              {{ user.name }}
            </h2>
            <span class="status-badge status-info">{{ user.role || 'Student' }}</span>
          </div>
          <p class="mt-2 text-lg text-[var(--color-text-soft)]">
            {{ profile.headline || 'Student' }}
          </p>
          <div class="mt-4 flex flex-col gap-2 text-sm text-muted">
            <div class="flex items-center justify-center gap-2 sm:justify-start">
              <UIcon
                name="i-lucide-map-pin"
                class="size-4 text-[var(--color-primary)]"
              />
              <span>{{ user.location || 'Location not added yet' }}</span>
            </div>
            <div class="flex items-center justify-center gap-2 sm:justify-start">
              <UIcon
                name="i-lucide-mail"
                class="size-4 text-[var(--color-primary)]"
              />
              <span class="truncate">{{ user.email }}</span>
            </div>
          </div>

          <button
            type="button"
            class="mt-5 inline-flex items-center gap-2 rounded-xl border border-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
            @click="emit('edit')"
          >
            <UIcon
              name="i-lucide-pencil-line"
              class="size-4"
            />
            Edit Profile
          </button>
        </div>
      </div>

      <div class="border-t border-[var(--color-border)] pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
        <div class="mb-3 flex items-center justify-between gap-3">
          <p class="text-sm font-semibold text-[var(--color-text)]">
            Profile Completion
          </p>
          <span class="text-sm font-semibold text-[var(--color-text)]">{{ profile.completion }}%</span>
        </div>
        <div class="h-2 rounded-full bg-[var(--color-bg-soft)]">
          <div
            class="h-full rounded-full bg-[var(--color-primary)]"
            :style="{ width: `${profile.completion}%` }"
          />
        </div>

        <div class="mt-5 space-y-3">
          <div
            v-for="item in profile.checklist"
            :key="item.id"
            class="flex items-center gap-3 text-sm"
          >
            <button
              v-if="!item.completed"
              type="button"
              class="relative group flex size-5 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] transition-all duration-200 hover:scale-110 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-soft)]"
              @click="emit('click-checklist', item.id)"
            >
              <UIcon
                name="i-lucide-plus"
                class="size-3"
              />
              <!-- Custom premium hover tooltip -->
              <span class="absolute bottom-6 left-1/2 -translate-x-1/2 scale-95 opacity-0 pointer-events-none transition-all duration-150 ease-out group-hover:scale-100 group-hover:opacity-100 bg-slate-900 dark:bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl font-medium border border-slate-700/50 whitespace-nowrap z-50">
                {{ getTooltipText(item.id) }}
                <span class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
              </span>
            </button>
            <span
              v-else
              class="flex size-5 items-center justify-center rounded-full border border-[var(--color-success)] text-[var(--color-success)]"
              style="background: color-mix(in srgb, var(--color-success) 12%, transparent)"
            >
              <UIcon
                name="i-lucide-check"
                class="size-3"
              />
            </span>
            <span :class="item.completed ? 'text-[var(--color-text-soft)]' : 'text-muted'">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
