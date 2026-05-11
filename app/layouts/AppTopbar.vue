<script setup lang="ts">
import AvatarDropdown from './AvatarDropdown.vue'

const { get } = useApi()
const user = ref<any>(null)
const route = useRoute()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

const pageHeaders: Record<string, { title: string; subtitle: string }> = {
  '/dashboard/schedule': {
    title: 'Schedule',
    subtitle: 'Plan your week. Stay consistent. Achieve your goals.',
  },
  '/dashboard/courses': {
    title: 'Courses',
    subtitle: 'Organize, access and study your course materials.',
  },
  '/dashboard/files': {
    title: 'Files',
    subtitle: 'Manage, organize and access all your study materials in one place.',
  },
  '/dashboard/tasks': {
    title: 'Tasks & Exams',
    subtitle: 'Stay on top of your deadlines and focus on what matters.',
  },
  '/dashboard/exams': {
    title: 'Tasks & Exams',
    subtitle: 'Stay on top of your deadlines and focus on what matters.',
  },
  '/dashboard/assistant': {
    title: 'AI Assistant',
    subtitle: 'Your smart study companion.',
  },
  '/dashboard/analytics': {
    title: 'Analytics',
    subtitle: 'Track your progress and discover insights to study smarter.',
  },
}

const currentHeader = computed(() => pageHeaders[route.path] ?? null)

onMounted(async () => {
  try {
    const res = await get<any>('/auth/me')
    if (res.success && res.data) user.value = res.data
  } catch {}
})
</script>

<template>
  <header class="sticky top-0 z-30 bg-slate-50 dark:bg-slate-950 px-8 py-3">
    <div class="flex items-center justify-between gap-4">
      <!-- Left: Dynamic page header or greeting -->
      <div>
        <template v-if="currentHeader">
          <h1 class="text-[24px] font-bold text-slate-900 dark:text-white leading-tight">
            {{ currentHeader.title }}
          </h1>
          <p class="text-[14px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {{ currentHeader.subtitle }}
          </p>
        </template>
        <template v-else>
          <h1 class="text-[24px] font-bold text-slate-900 dark:text-white leading-tight">
            {{ greeting }}, {{ user?.name?.split(' ')[0] || 'User' }}! 👋
          </h1>
          <p class="text-[14px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
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
