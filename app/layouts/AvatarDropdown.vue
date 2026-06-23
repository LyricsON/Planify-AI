<script setup lang="ts">
const { logout } = useAuth()

const items = [
  [
    {
      label: 'My Profile',
      icon: 'i-lucide-user',
      to: '/settings/profile'
    },
    {
      label: 'Settings',
      icon: 'i-lucide-settings-2',
      to: '/settings/security'
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
      color: 'error',
      onSelect: async () => {
        await logout()
      }
    }
  ]
] as any
</script>

<template>
  <UDropdownMenu :items="items">
    <button class="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pr-2 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
      <UAvatar
        size="sm"
      />

      <UIcon
        name="i-lucide-chevron-down"
        class="size-4 text-slate-500"
      />
    </button>
  </UDropdownMenu>
</template>
