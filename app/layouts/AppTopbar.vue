<script setup lang="ts">
const { get } = useApi()
const user = ref<any>(null)
const route = useRoute()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

const pageHeaders: Record<string, { title: string; subtitle: string; icon?: string; iconClass?: string }> = {
  '/dashboard/schedule': {
    title: 'Schedule',
    subtitle: 'Plan your week. Stay consistent. Achieve your goals.',
    icon: 'i-lucide-calendar-days',
    iconClass: 'schedule-icon-container',
  },
  '/dashboard/courses': {
    title: 'Courses',
    subtitle: 'Organize, access and study your course materials.',
    icon: 'i-lucide-book-open',
    iconClass: 'courses-icon-container',
  },
  '/dashboard/files': {
    title: 'Files',
    subtitle: 'Manage, organize and access all your study materials in one place.',
    icon: 'i-lucide-file-text',
    iconClass: 'files-icon-container',
  },
  '/dashboard/tasks': {
    title: 'Exams & Tasks',
    subtitle: 'Stay on top of your deadlines and focus on what matters.',
    icon: 'i-lucide-square-check-big',
    iconClass: 'tasks-icon-container',
  },
  '/dashboard/exams': {
    title: 'Exams & Tasks',
    subtitle: 'Stay on top of your deadlines and focus on what matters.',
    icon: 'i-lucide-circle-check',
    iconClass: 'exams-icon-container',
  },
  '/dashboard/assistant': {
    title: 'AI Assistant',
    subtitle: 'Your smart study companion.',
    icon: 'i-lucide-sparkles',
    iconClass: 'sparkle-icon-container',
  },
  '/dashboard/analytics': {
    title: 'Analytics',
    subtitle: 'Track your progress and discover insights to study smarter.',
    icon: 'i-lucide-chart-column',
    iconClass: 'analytics-icon-container',
  },
  '/settings/profile': {
    title: 'Profile',
    subtitle: 'Manage your account, preferences and track your progress.',
  },
  '/settings/personal-info': {
    title: 'Profile Settings',
    subtitle: 'Manage your account, preferences, and subscription.',
  },
  '/settings/security': {
    title: 'Security',
    subtitle: 'Manage your account security and active sessions.',
  },
  '/settings/notifications': {
    title: 'Notifications',
    subtitle: 'Control your alerts and communication preferences.',
  },
  '/settings/study-preferences': {
    title: 'Study Preferences',
    subtitle: 'Customize your learning and assistant preferences.',
  },
  '/settings/billing': {
    title: 'Billing',
    subtitle: 'Manage your plan, payments and token usage.',
  },
}

const currentHeader = computed(() => {
  if (route.path === '/dashboard/tasks') {
    const q = String(route.query.tab || '')
    if (q === 'overview' || q === 'exams' || q === 'tasks') {
      return {
        title: 'Exams & Tasks',
        subtitle: 'Stay on top of your deadlines and focus on what matters.',
        icon: q === 'exams' ? 'i-lucide-circle-check' : 'i-lucide-square-check-big',
        iconClass: q === 'exams' ? 'exams-icon-container' : 'tasks-icon-container',
      }
    }
    return {
      title: 'Tasks',
      subtitle: 'Track assignments, progress, and deadlines.',
      icon: 'i-lucide-square-check-big',
      iconClass: 'tasks-icon-container',
    }
  }
  return pageHeaders[route.path] ?? null
})

onMounted(async () => {
  try {
    const res = await get<any>('/auth/me')
    if (res.success && res.data) user.value = res.data
  } catch {}
})
</script>

<template>
  <header class="sticky top-0 z-30 bg-slate-50 dark:bg-slate-950 px-5 pt-3 pb-6">
    <div class="flex items-center justify-between gap-4">
      <!-- Left: Dynamic page header or greeting -->
      <div>
        <template v-if="currentHeader">
          <div>
            <div class="flex items-center gap-2">
              <div v-if="currentHeader.icon" :class="currentHeader.iconClass || 'default-icon-container'">
                <UIcon :name="currentHeader.icon" class="size-5" />
              </div>
              <h1 class="text-[24px] font-bold text-slate-900 dark:text-white leading-tight">
                {{ currentHeader.title }}
              </h1>
            </div>
            <p class="topbar-subtitle mb-0 text-[14px] text-slate-500 dark:text-slate-400 font-medium mt-1.5">
              {{ currentHeader.subtitle }}
            </p>
          </div>
        </template>
        <template v-else>
          <h1 class="text-[24px] font-bold text-slate-900 dark:text-white leading-tight">
            {{ greeting }}, {{ user?.name?.split(' ')[0] || 'User' }}! 👋
          </h1>
          <p class="topbar-subtitle mb-0 text-[14px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Let's make today productive and focused.
          </p>
        </template>
      </div>

      <!-- Right: Search + Actions -->
      <div class="flex items-center gap-3">
        <!-- Search -->
        <div class="relative">
          <UIcon
            name="i-lucide-search"
            class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none"
          />
          <input
            placeholder="Search anything..."
            class="h-[38px] w-[240px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[10px] pl-9 pr-4 text-[13px] font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 transition"
          >
        </div>

        <!-- Notifications -->
        <button class="relative size-[38px] flex items-center justify-center rounded-[10px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
          <UIcon
            name="i-lucide-bell"
            class="size-4 text-slate-600 dark:text-slate-300"
          />
          <span class="absolute top-1.5 right-1.5 size-[7px] rounded-full bg-indigo-500" />
        </button>

        <!-- Calendar -->
        <button class="size-[38px] flex items-center justify-center rounded-[10px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
          <UIcon
            name="i-lucide-calendar-days"
            class="size-4 text-slate-600 dark:text-slate-300"
          />
        </button>

      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar-subtitle {
  margin-bottom: 0 !important;
}

.sparkle-icon-container,
.schedule-icon-container,
.courses-icon-container,
.files-icon-container,
.tasks-icon-container,
.exams-icon-container,
.analytics-icon-container,
.default-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.sparkle-icon-container {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.schedule-icon-container {
  background: rgba(14, 165, 233, 0.12); /* sky soft */
  color: #0ea5e9; /* sky */
}
.dark .schedule-icon-container {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}

.courses-icon-container {
  background: rgba(16, 185, 129, 0.12); /* success/emerald soft */
  color: #10b981; /* success/emerald */
}

.files-icon-container {
  background: rgba(244, 63, 94, 0.12); /* danger/rose soft */
  color: #f43f5e; /* danger/rose */
}

.tasks-icon-container {
  background: rgba(139, 92, 246, 0.12); /* violet/ai soft */
  color: #8b5cf6; /* violet/ai */
}
.dark .tasks-icon-container {
  background: rgba(167, 139, 250, 0.15);
  color: #a78bfa;
}

.exams-icon-container {
  background: rgba(245, 158, 11, 0.12); /* warning/amber soft */
  color: #f59e0b; /* warning/amber */
}
.dark .exams-icon-container {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.analytics-icon-container {
  background: rgba(59, 130, 246, 0.12); /* info/blue soft */
  color: #3b82f6; /* info/blue */
}

.default-icon-container {
  background: var(--color-bg-soft);
  color: var(--color-text-muted);
}
</style>
