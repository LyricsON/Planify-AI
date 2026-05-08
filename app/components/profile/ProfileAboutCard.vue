<script setup lang="ts">
import type { ProfileDetails } from '~/types/profile'

defineProps<{
  profile: ProfileDetails
}>()
</script>

<template>
  <section class="section-card">
    <div class="mb-5 flex items-center gap-3">
      <div class="icon-box icon-box-primary">
        <UIcon
          name="i-lucide-user-round"
          class="size-4"
        />
      </div>
      <h3 class="text-xl font-semibold text-[var(--color-text)]">
        About Me
      </h3>
    </div>

    <p class="text-base leading-7 text-[var(--color-text-soft)]">
      {{ profile.bio }}
    </p>

    <div class="mt-6 flex flex-wrap gap-2">
      <span
        v-for="tag in profile.tags"
        :key="tag"
        class="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]"
      >
        {{ tag }}
      </span>
    </div>
  </section>
</template>
