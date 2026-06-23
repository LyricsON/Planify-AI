<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const { get } = useApi()
const route = useRoute()
const router = useRouter()

const user = ref<any>(null)
const tokenBalance = ref<number | null>(null)
const plan = ref<any>(null)

function toNumber(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

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
  const [basePath, query] = path.split('?')
  const q = new URLSearchParams(query || '')
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
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})

onMounted(async () => {
  try {
    const [meRes, tokenRes, subRes] = await Promise.all([
      get<any>('/auth/me'),
      get<any>('/tokens/balance'),
      get<any>('/subscriptions/me')
    ])

    const meData = meRes.success ? (meRes.data as any) : null
    const subData = subRes.success ? (subRes.data as any) : null
    const tokenData = tokenRes.success ? (tokenRes.data as any) : null

    user.value = meData?.user || meData?.data || meData || null

    tokenBalance.value = toNumber(
      tokenData?.tokenBalance
      ?? tokenData?.balance
      ?? tokenData?.available
      ?? tokenData?.tokens
    )

    plan.value = subData?.planName || subData?.plan || subData?.name || 'Free'
  } catch (err) {
    console.error('Sidebar fetch error', err)
  }
})
</script>

<template>
  <aside class="fixed left-0 top-0 z-40 h-screen w-[260px] border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto sidebar-scroll">
    <div class="px-4 py-8 flex flex-col min-h-full">
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
        <span class="text-[24px] font-bold text-[#312e81] dark:text-indigo-400 tracking-tight">
          Planify AI
        </span>
      </NuxtLink>

      <nav class="space-y-1.5 flex-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="relative flex items-center gap-2 rounded-[12px] px-2 py-3 text-[13px] font-semibold transition text-slate-800"
          :class="isRouteActive(item.to) ? 'bg-[#f5f4fd] text-[#534bfa] dark:bg-indigo-900/40 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#534bfa] dark:hover:text-slate-200'"
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
        <!-- Upgrade Plan Card -->
        <div class="rounded-[14px] bg-gradient-to-br from-[#4f46e5] via-[#6366f1] to-[#7c3aed] p-5 text-white relative overflow-hidden flex flex-col items-start shadow-sm">
          <!-- Decorative Stars -->
          <div class="absolute right-6 top-[35%] -translate-y-1/2 flex items-center justify-center opacity-90 pointer-events-none">
            <!-- Small Blue Star -->
            <svg
              class="absolute -left-3 top-5 w-[16px] h-[16px]"
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
            <!-- Large Orange/Pink Star -->
            <svg
              class="w-[36px] h-[36px]"
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

          <p class="plan-card text-[13px] font-semibold relative z-10 !text-white tracking-wide">
            Upgrade your plan
          </p>
          <p class="plan-card text-[11px] leading-[1.6] !text-white opacity-80 pr-12 relative z-10 font-medium">
            Unlock unlimited AI features and more productivity.
          </p>
          <button
            class="mt-2 text-[12px] text-[#534bfa] font-bold bg-white hover:bg-slate-50 rounded-[8px] px-4 py-1.5 relative z-10 transition-colors"
          >
            Upgrade Now
          </button>
        </div>

        <!-- Tokens Card -->
        <div class="rounded-[16px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
          <p class="text-[12px] font-bold text-slate-800 dark:text-slate-200">
            Your Tokens
          </p>
          <div class="mt-3 flex items-center gap-2.5">
            <div class="size-[24px] flex items-center justify-center rounded-full bg-[#fbbf24] shadow-sm shadow-amber-200 dark:shadow-none">
              <UIcon
                name="i-lucide-database"
                class="size-3.5 text-white"
              />
            </div>
            <span
              v-if="tokenBalance !== null"
              class="text-[24px] font-bold text-slate-900 dark:text-white leading-none"
            >{{ tokenBalance.toLocaleString() }}</span>
            <UIcon
              v-else
              name="i-lucide-loader-2"
              class="size-5 animate-spin text-slate-400"
            />
          </div>
          <NuxtLink
            to="/settings/billing"
            class="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#4338ca] dark:text-indigo-400 hover:text-indigo-700 transition"
          >
            Buy Tokens
            <UIcon
              name="i-lucide-arrow-right"
              class="size-3.5"
            />
          </NuxtLink>
        </div>

        <!-- Profile Card & Custom Dropdown -->
        <div class="relative w-full">
          <!-- Dropdown Panel -->
          <div
            v-if="isOpen"
            ref="dropdownRef"
            class="absolute bottom-[calc(100%+8px)] left-0 right-0 z-50 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[14px] shadow-[0_4px_16px_rgba(15,23,42,0.08)] p-1.5 flex flex-col gap-0.5"
            role="menu"
            aria-label="User profile menu"
          >
            <button
              v-for="item in menuItems"
              :key="item.label"
              class="flex items-center gap-2.5 px-3 rounded-[10px] text-[13px] font-semibold text-slate-700 dark:text-slate-350 hover:bg-[#f5f4fd] dark:hover:bg-indigo-950/30 hover:text-[#534bfa] dark:hover:text-indigo-400 transition-colors w-full text-left h-[38px] focus:outline-none"
              :class="{ 'text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400': item.label === 'Sign out' }"
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

          <!-- Profile Card -->
          <div
            @click="router.push('/settings/profile')"
            class="flex items-center gap-3 rounded-[16px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]"
          >
            <UAvatar
              v-if="user"
              :src="user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`"
              :alt="user.name"
              size="sm"
              class="rounded-full size-[36px]"
            />
            <UAvatar
              v-else
              size="sm"
              icon="i-lucide-user"
              class="rounded-full size-[36px]"
            />

            <div class="min-w-0 flex-1 pl-1">
              <p class="truncate text-[13px] font-bold text-[#312e81] dark:text-white leading-tight">
                {{ user ? user.name : 'Loading...' }}
              </p>
              <p class="text-[11px] font-bold text-slate-500 dark:text-slate-400 capitalize truncate mt-0.5">
                {{ plan ? `${plan} Plan` : 'Free Plan' }}
              </p>
            </div>

            <button
              ref="chevronButtonRef"
              @click.stop="isOpen = !isOpen"
              class="size-6 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors focus:outline-none"
              aria-expanded="isOpen"
              aria-haspopup="menu"
              aria-label="Toggle user profile menu"
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
