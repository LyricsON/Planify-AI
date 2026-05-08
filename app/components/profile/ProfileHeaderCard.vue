<script setup lang="ts">
import type { ProfileDetails, ProfileSubscription, ProfileUser } from '~/types/profile'

defineProps<{
  user: ProfileUser
  profile: ProfileDetails
  subscription: ProfileSubscription
}>()

const emit = defineEmits<{
  edit: []
}>()
</script>

<template>
  <section class="section-card">
    <div class="grid gap-6 xl:grid-cols-[1.3fr_.9fr]">
      <div class="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div class="relative mx-auto sm:mx-0">
          <UAvatar
            :src="user.avatar"
            :alt="user.name"
            class="size-28 ring-4 ring-[var(--color-primary-soft)]"
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
            <span class="status-badge status-info">{{ user.role }}</span>
          </div>
          <p class="mt-2 text-lg text-[var(--color-text-soft)]">
            {{ profile.headline }}
          </p>
          <div class="mt-4 flex flex-col gap-2 text-sm text-muted">
            <div class="flex items-center justify-center gap-2 sm:justify-start">
              <UIcon
                name="i-lucide-map-pin"
                class="size-4 text-[var(--color-primary)]"
              />
              <span>{{ user.location }}</span>
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
            <span
              class="flex size-5 items-center justify-center rounded-full border"
              :class="item.completed ? 'border-[var(--color-success)] text-[var(--color-success)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'"
              :style="item.completed ? 'background: color-mix(in srgb, var(--color-success) 12%, transparent)' : undefined"
            >
              <UIcon
                :name="item.completed ? 'i-lucide-check' : 'i-lucide-plus'"
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
