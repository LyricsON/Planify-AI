<script setup lang="ts">
const items = [
  [
    {
      label: 'My Profile',
      icon: 'i-lucide-user',
      to: '/settings/profile'
    },
    {
      label: 'Security',
      icon: 'i-lucide-shield',
      to: '/settings/security'
    },
    {
      label: 'Notifications',
      icon: 'i-lucide-bell',
      to: '/settings/notifications'
    },
    {
      label: 'Study Preferences',
      icon: 'i-lucide-settings-2',
      to: '/settings/study-preferences'
    },
    {
      label: 'Billing',
      icon: 'i-lucide-credit-card',
      to: '/settings/billing'
    }
  ],
  [
    {
      label: 'Sign out',
      icon: 'i-lucide-log-out',
      color: 'error'
    }
  ]
] as any
</script>

<template>
  <UDropdownMenu :items="items">
    <button class="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pr-2 transition hover:bg-slate-50">
      <UAvatar
        src="https://i.pravatar.cc/100?img=12"
        alt="Yassine"
        size="sm"
      />

      <UIcon
        name="i-lucide-chevron-down"
        class="size-4 text-slate-500"
      />
    </button>
  </UDropdownMenu>
</template>
