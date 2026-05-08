<script setup lang="ts">
const route = useRoute()

const tabs = [
  { label: 'Personal Info', icon: 'i-lucide-user', to: '/settings/profile' },
  { label: 'Security', icon: 'i-lucide-shield', to: '/settings/security' },
  { label: 'Notifications', icon: 'i-lucide-bell', to: '/settings/notifications' },
  { label: 'Study Preferences', icon: 'i-lucide-book-open-check', to: '/settings/study-preferences' },
  { label: 'Billing', icon: 'i-lucide-credit-card', to: '/settings/billing' }
]

const isActive = (path: string) => route.path === path
</script>

<template>
  <div class="overflow-x-auto sidebar-scroll border-b border-[var(--color-border)]">
    <nav class="flex min-w-max items-center gap-2 sm:gap-4">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="relative inline-flex items-center gap-2 px-4 py-4 text-sm font-semibold transition"
        :class="isActive(tab.to) ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-soft)] hover:text-[var(--color-text)]'"
      >
        <UIcon
          :name="tab.icon"
          class="size-4"
        />
        <span class="whitespace-nowrap">{{ tab.label }}</span>
        <span
          class="absolute inset-x-3 bottom-0 h-0.5 rounded-full transition"
          :class="isActive(tab.to) ? 'bg-[var(--color-primary)] opacity-100' : 'bg-transparent opacity-0'"
        />
      </NuxtLink>
    </nav>
  </div>
</template>
