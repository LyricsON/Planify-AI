<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const dashboard = useDashboardSummary()
const route = useRoute()
const router = useRouter()

const user = computed(() => dashboard.summary.value?.user ?? null)
const tokenBalance = computed(() => dashboard.summary.value?.user.tokenBalance ?? null)
const planLabel = computed(() => dashboard.summary.value?.user.planLabel ?? 'Free Plan')

const navItems = [
  { label: 'Home', icon: 'i-lucide-home', to: '/dashboard' },
  { label: 'Schedule', icon: 'i-lucide-calendar-days', to: '/dashboard/schedule' },
  { label: 'Courses', icon: 'i-lucide-book-open', to: '/dashboard/courses' },
  { label: 'Files', icon: 'i-lucide-file-text', to: '/dashboard/files' },
  { label: 'Exams', icon: 'i-lucide-circle-check', to: '/dashboard/exams?tab=overview' },
  { label: 'Tasks', icon: 'i-lucide-square-check-big', to: '/dashboard/tasks' },
  { label: 'AI Assistant', icon: 'i-lucide-sparkles', to: '/dashboard/assistant' },
  { label: 'Analytics', icon: 'i-lucide-chart-column', to: '/dashboard/analytics' }
]

const isRouteActive = (path: string) => {
  const [rawBasePath, rawQuery] = path.split('?')
  const basePath = rawBasePath || ''
  const q = new URLSearchParams(rawQuery || '')
  const targetTab = q.get('tab')

  if (path === '/dashboard') {
    return route.path === '/dashboard' || route.path === '/' || route.path === '/home'
  }

  if (basePath === '/dashboard/tasks' && targetTab) {
    return route.path === '/dashboard/tasks' && String(route.query.tab || '') === targetTab
  }

  if (basePath === '/dashboard/tasks' && !targetTab) {
    return route.path === '/dashboard/tasks' && !route.query.tab
  }

  if (basePath === '/dashboard/exams') {
    return route.path === '/dashboard/exams'
  }

  return route.path.startsWith(basePath)
}

const { logout } = useAuth()
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const chevronButtonRef = ref<HTMLElement | null>(null)
const isLoggingOut = ref(false)

const menuItems = [
  { label: 'My Profile', icon: 'i-lucide-user', click: () => { isOpen.value = false; router.push('/settings/profile') } },
  { label: 'Security', icon: 'i-lucide-shield', click: () => { isOpen.value = false; router.push('/settings/security') } },
  { label: 'Notifications', icon: 'i-lucide-bell', click: () => { isOpen.value = false; router.push('/settings/notifications') } },
  { label: 'Study Preferences', icon: 'i-lucide-settings-2', click: () => { isOpen.value = false; router.push('/settings/study-preferences') } },
  { label: 'Billing', icon: 'i-lucide-credit-card', click: () => { isOpen.value = false; router.push('/settings/billing') } },
  { label: 'Sign out', icon: 'i-lucide-log-out', click: handleSignOutClick }
]

async function handleSignOutClick(event: Event) {
  event.preventDefault()
  event.stopPropagation()
  if (isLoggingOut.value) return
  isLoggingOut.value = true
  isOpen.value = false
  try {
    await logout()
  } catch (err) {
    console.error('Logout error:', err)
  } finally {
    isLoggingOut.value = false
  }
}

function handleClickOutside(event: MouseEvent) {
  if (
    isOpen.value &&
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target as Node) &&
    chevronButtonRef.value &&
    !chevronButtonRef.value.contains(event.target as Node)
  ) {
    isOpen.value = false
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
  void dashboard.ensureLoaded()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <aside class="sidebar-scroll fixed left-0 top-0 z-40 h-screen w-[260px] overflow-y-auto border-r border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
    <div class="flex min-h-full flex-col px-4 py-8">
      <NuxtLink
        to="/dashboard"
        class="mb-10 flex flex-shrink-0 items-center gap-3"
      >
        <div class="flex size-[38px] items-center justify-center rounded-[12px] bg-[#4338ca] text-white shadow-sm shadow-indigo-200 dark:shadow-none">
          <UIcon
            name="i-lucide-box"
            class="size-5 fill-white/20"
          />
        </div>
        <span class="text-[24px] font-bold tracking-tight text-[#312e81] dark:text-indigo-400">
          Planify AI
        </span>
      </NuxtLink>

      <nav class="flex-1 space-y-1.5">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="relative flex items-center gap-2 rounded-[12px] px-2 py-3 text-[13px] font-semibold transition"
          :class="isRouteActive(item.to) ? 'bg-[#f5f4fd] text-[#534bfa] dark:bg-indigo-900/40 dark:text-indigo-400' : 'text-slate-800 hover:bg-slate-50 hover:text-[#534bfa] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'"
        >
          <div
            v-if="isRouteActive(item.to)"
            class="absolute -left-6 top-1.5 bottom-1.5 w-[5px] rounded-r-[6px] bg-[#534bfa] dark:bg-indigo-400"
          />
          <UIcon
            :name="item.icon"
            class="size-[20px]"
            :class="isRouteActive(item.to) ? 'text-[#534bfa] dark:text-indigo-400' : 'text-slate-800 dark:text-slate-400'"
          />
          <span :class="isRouteActive(item.to) ? 'text-[#534bfa] dark:text-indigo-400' : 'text-slate-800 dark:text-slate-400'">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="mt-8 flex-shrink-0 space-y-6">
        <div class="relative overflow-hidden rounded-[14px] bg-gradient-to-br from-[#4f46e5] via-[#6366f1] to-[#7c3aed] p-5 text-white shadow-sm">
          <div class="pointer-events-none absolute right-6 top-[35%] -translate-y-1/2 flex items-center justify-center opacity-90">
            <svg
              class="absolute -left-3 top-5 h-[16px] w-[16px]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="grad-blue"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stop-color="#818cf8"
                  />
                  <stop
                    offset="100%"
                    stop-color="#38bdf8"
                  />
                </linearGradient>
              </defs>
              <path
                d="M12 0C12 8 20 12 24 12C20 12 12 16 12 24C12 16 4 12 0 12C4 12 12 8 12 0Z"
                fill="url(#grad-blue)"
              />
            </svg>
            <svg
              class="h-[36px] w-[36px]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="grad-orange"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stop-color="#fba861"
                  />
                  <stop
                    offset="100%"
                    stop-color="#eb568e"
                  />
                </linearGradient>
              </defs>
              <path
                d="M12 0C12 8 20 12 24 12C20 12 12 16 12 24C12 16 4 12 0 12C4 12 12 8 12 0Z"
                fill="url(#grad-orange)"
              />
            </svg>
          </div>

          <p class="plan-card relative z-10 text-[13px] font-semibold tracking-wide !text-white">
            Upgrade your plan
          </p>
          <p class="plan-card relative z-10 pr-12 text-[11px] font-medium leading-[1.6] !text-white opacity-80">
            Unlock unlimited AI features and more productivity.
          </p>
          <button class="relative z-10 mt-2 rounded-[8px] bg-white px-4 py-1.5 text-[12px] font-bold text-[#534bfa] transition-colors hover:bg-slate-50">
            Upgrade Now
          </button>
        </div>

        <div class="rounded-[16px] border border-slate-100 bg-white p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] dark:border-slate-800 dark:bg-slate-900">
          <p class="text-[12px] font-bold text-slate-800 dark:text-slate-200">
            Your Tokens
          </p>
          <div class="mt-3 flex items-center gap-2.5">
            <div class="flex size-[24px] items-center justify-center rounded-full bg-[#fbbf24] shadow-sm shadow-amber-200 dark:shadow-none">
              <UIcon
                name="i-lucide-database"
                class="size-3.5 text-white"
              />
            </div>
            <span
              v-if="tokenBalance !== null"
              class="text-[24px] font-bold leading-none text-slate-900 dark:text-white"
            >
              {{ tokenBalance.toLocaleString() }}
            </span>
            <UIcon
              v-else
              name="i-lucide-loader-2"
              class="size-5 animate-spin text-slate-400"
            />
          </div>
          <NuxtLink
            to="/settings/billing"
            class="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#4338ca] transition hover:text-indigo-700 dark:text-indigo-400"
          >
            Buy Tokens
            <UIcon
              name="i-lucide-arrow-right"
              class="size-3.5"
            />
          </NuxtLink>
        </div>

        <div class="relative w-full">
          <div
            v-if="isOpen"
            ref="dropdownRef"
            class="absolute bottom-[calc(100%+8px)] left-0 right-0 z-50 flex flex-col gap-0.5 rounded-[14px] border border-slate-100 bg-white p-1.5 shadow-[0_4px_16px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950"
            role="menu"
            aria-label="User profile menu"
          >
            <button
              v-for="item in menuItems"
              :key="item.label"
              class="flex h-[38px] w-full items-center gap-2.5 rounded-[10px] px-3 text-left text-[13px] font-semibold text-slate-700 transition-colors hover:bg-[#f5f4fd] hover:text-[#534bfa] dark:text-slate-350 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
              :class="{ 'text-rose-600 hover:bg-rose-50 hover:text-rose-600 dark:text-rose-450 dark:hover:bg-rose-950/20 dark:hover:text-rose-400': item.label === 'Sign out' }"
              role="menuitem"
              @click="item.click"
            >
              <UIcon
                :name="item.icon"
                class="size-[16px] flex-shrink-0"
                :class="item.label === 'Sign out' ? 'text-rose-500 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'"
              />
              <span>{{ item.label }}</span>
            </button>
          </div>

          <div
            class="flex cursor-pointer items-center gap-3 rounded-[16px] border border-slate-100 bg-white p-3 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
            @click="router.push('/settings/profile')"
          >
            <AppAvatar
              :src="user?.avatar || undefined"
              :name="user?.name"
              size="sm"
            />

            <div class="min-w-0 flex-1 pl-1">
              <p class="truncate text-[13px] font-bold leading-tight text-[#312e81] dark:text-white">
                {{ user ? user.name : 'Loading...' }}
              </p>
              <p class="mt-0.5 truncate text-[11px] font-bold capitalize text-slate-500 dark:text-slate-400">
                {{ planLabel }}
              </p>
            </div>

            <button
              ref="chevronButtonRef"
              class="flex size-6 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors hover:text-slate-650 focus:outline-none dark:bg-slate-800 dark:hover:text-slate-200"
              :aria-expanded="isOpen"
              aria-haspopup="menu"
              aria-label="Toggle user profile menu"
              @click.stop="isOpen = !isOpen"
            >
              <UIcon
                name="i-lucide-chevron-up"
                class="size-3.5 transition-transform duration-250 ease-out"
                :class="{ 'rotate-180': isOpen }"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
p {
  margin: 0;
}

.plan-card {
  margin-bottom: 6px;
}
</style>
