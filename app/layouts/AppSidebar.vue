<script setup lang="ts">
const navItems = [
  {
    label: 'Home',
    icon: 'i-lucide-home',
    to: '/dashboard'
  },
  {
    label: 'Schedule',
    icon: 'i-lucide-calendar-days',
    to: '/dashboard/schedule'
  },
  {
    label: 'Courses',
    icon: 'i-lucide-book-open',
    to: '/dashboard/courses'
  },
  {
    label: 'Files',
    icon: 'i-lucide-file-text',
    to: '/dashboard/files'
  },
  {
    label: 'Exams',
    icon: 'i-lucide-clipboard-check',
    to: '/dashboard/exams'
  },
  {
    label: 'Tasks',
    icon: 'i-lucide-check-square',
    to: '/dashboard/tasks'
  },
  {
    label: 'AI Assistant',
    icon: 'i-lucide-sparkles',
    to: '/dashboard/assistant'
  },
  {
    label: 'Analytics',
    icon: 'i-lucide-chart-column',
    to: '/dashboard/analytics'
  }
]
</script>

<template>
  <aside class="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white px-4 py-5">
    <NuxtLink to="/dashboard" class="mb-10 flex items-center gap-3">
      <div class="flex size-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
        <UIcon name="i-lucide-sparkles" class="size-5" />
      </div>

      <span class="text-xl font-bold text-indigo-600">
        Planify AI
      </span>
    </NuxtLink>

    <nav class="space-y-1">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"
        active-class="bg-indigo-50 text-indigo-600"
      >
        <UIcon :name="item.icon" class="size-5" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <div class="absolute bottom-5 left-4 right-4 space-y-4">
      <div class="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-4 text-white shadow-lg shadow-indigo-200">
        <p class="text-sm font-semibold">
          Upgrade your plan
        </p>

        <p class="mt-2 text-xs leading-5 text-indigo-100">
          Unlock unlimited AI features and more productivity.
        </p>

        <UButton
          size="xs"
          color="neutral"
          variant="solid"
          class="mt-4"
        >
          Upgrade Now
        </UButton>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-4">
        <p class="text-xs text-slate-500">
          Your Tokens
        </p>

        <div class="mt-2 flex items-center gap-2">
          <UIcon name="i-lucide-coins" class="size-5 text-amber-500" />
          <span class="text-2xl font-bold text-slate-900">8,750</span>
        </div>

        <NuxtLink to="/settings/billing" class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
          Buy Tokens
          <UIcon name="i-lucide-arrow-right" class="size-4" />
        </NuxtLink>
      </div>

      <div class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
        <UAvatar
          src="https://i.pravatar.cc/100?img=12"
          alt="Yassine"
          size="sm"
        />

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-slate-900">
            Yassine
          </p>

          <p class="text-xs text-slate-500">
            Student Plan
          </p>
        </div>

        <UIcon name="i-lucide-chevron-down" class="size-4 text-slate-400" />
      </div>
    </div>
  </aside>
</template>