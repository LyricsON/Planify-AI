<script setup lang="ts">
import type { DashboardFile, DashboardNotification, DashboardRecommendation, DashboardScheduleItem } from '~/types/dashboard'

definePageMeta({
  layout: 'dashboard'
})

const dashboard = useDashboardSummary()

const summary = computed(() => dashboard.summary.value)
const user = computed(() => summary.value?.user)
const subscription = computed(() => summary.value?.subscription)
const stats = computed(() => summary.value?.stats ?? [])
const todaySchedule = computed(() => summary.value?.todaySchedule ?? [])
const weeklyProgress = computed(() => summary.value?.weeklyProgress)
const recommendations = computed(() => summary.value?.recommendations ?? [])
const upcomingEvents = computed(() => summary.value?.upcomingEvents ?? [])
const recentFiles = computed(() => summary.value?.recentFiles ?? [])
const recentCourses = computed(() => summary.value?.recentCourses ?? [])
const notifications = computed(() => summary.value?.notifications ?? [])
const isLoading = computed(() => dashboard.loading.value && !dashboard.hasData.value)
const isEmpty = computed(() => !dashboard.loading.value && !dashboard.error.value && !dashboard.hasData.value)
const assistantPrompt = ref('')
const assistantPromptField = ref<HTMLTextAreaElement | null>(null)

const currentDateLabel = computed(() => {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date())
})

const greetingTitle = computed(() => {
  const name = user.value?.firstName || 'User'
  return summary.value?.greeting ? `${summary.value.greeting}, ${name}!` : `Good day, ${name}!`
})

const tokenStatus = computed(() => {
  const tokenBalance = user.value?.tokenBalance ?? 0
  const limit = subscription.value?.tokenLimit ?? 0
  if (!limit) return `${tokenBalance.toLocaleString()} tokens available`
  return `${tokenBalance.toLocaleString()} / ${limit.toLocaleString()} tokens`
})

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatMonthDay(value: string) {
  const date = new Date(value)
  return {
    day: date.getDate(),
    month: date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
  }
}

function daysUntil(value: string) {
  const diffMs = new Date(value).getTime() - Date.now()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  return `In ${diffDays} days`
}

function daysUntilClass(value: string) {
  const diffMs = new Date(value).getTime() - Date.now()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 1) return 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300'
  if (diffDays <= 3) return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300'
  return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
}

function eventToneClasses(tone: DashboardRecommendation['tone'] | DashboardScheduleItem['type'] | DashboardNotification['tone']) {
  const map: Record<string, string> = {
    primary: 'bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[var(--color-primary)]',
    success: 'bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] text-[var(--color-success)]',
    info: 'bg-[color-mix(in_srgb,var(--color-info)_10%,transparent)] text-[var(--color-info)]',
    warning: 'bg-[color-mix(in_srgb,var(--color-warning)_12%,transparent)] text-[var(--color-warning)]',
    ai: 'bg-[color-mix(in_srgb,var(--color-ai)_10%,transparent)] text-[var(--color-ai)]',
    danger: 'bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] text-[var(--color-danger)]'
  }

  return map[tone] || map.primary
}

function fileTone(type?: string) {
  const fileType = String(type || '').toLowerCase()
  if (fileType === 'pdf') return 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300'
  if (fileType === 'docx') return 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300'
  if (fileType === 'xlsx') return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
  if (fileType === 'pptx') return 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300'
  if (fileType === 'image') return 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-300'
  return 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300'
}

function fileIcon(type?: string) {
  const fileType = String(type || '').toLowerCase()
  if (fileType === 'pdf') return 'i-lucide-file-text'
  if (fileType === 'docx') return 'i-lucide-file-type'
  if (fileType === 'xlsx') return 'i-lucide-sheet'
  if (fileType === 'pptx') return 'i-lucide-presentation'
  if (fileType === 'image') return 'i-lucide-image'
  return 'i-lucide-file'
}

function resizeAssistantPrompt() {
  const el = assistantPromptField.value
  if (!el) return

  el.style.height = 'auto'
  const lineHeight = 20
  const maxHeight = lineHeight * 3 + 18
  el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
}

function courseBarStyle(progress: number, color?: string | null) {
  const value = Math.max(0, Math.min(100, Number(progress) || 0))
  return {
    width: `${value}%`,
    background: color || 'var(--color-success)'
  }
}

function scheduleIcon(type: string) {
  if (type === 'course') return 'i-lucide-book-open'
  if (type === 'td' || type === 'tp') return 'i-lucide-calculator'
  if (type === 'study_session') return 'i-lucide-sparkles'
  if (type === 'exam') return 'i-lucide-clipboard-check'
  if (type === 'task') return 'i-lucide-square-check-big'
  return 'i-lucide-calendar'
}

function scheduleTone(type: string) {
  if (type === 'course') return 'info'
  if (type === 'td' || type === 'tp') return 'success'
  if (type === 'study_session') return 'ai'
  if (type === 'exam' || type === 'task') return 'warning'
  return 'primary'
}

function avatarLabelClass() {
  return 'rounded-[999px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-text-soft)] shadow-[var(--shadow-sm)]'
}

function retryLoad() {
  void dashboard.refresh(true)
}

onMounted(() => {
  void dashboard.ensureLoaded()
})
</script>

<template>
  <section class="mx-auto max-w-[1600px] pb-10">
    <div
      v-if="dashboard.error.value"
      class="mb-6 rounded-[16px] border border-rose-200 bg-rose-50 p-4 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-sm font-semibold">
            Dashboard failed to load
          </p>
          <p class="mt-1 text-sm opacity-90">
            {{ dashboard.error.value }}
          </p>
        </div>
        <button
          class="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 dark:bg-slate-950 dark:text-rose-200 dark:hover:bg-slate-900"
          @click="retryLoad"
        >
          <UIcon
            name="i-lucide-refresh-cw"
            class="size-4"
          />
          Retry
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="space-y-6">
      <div class="space-y-3">
        <div class="h-9 w-80 animate-pulse rounded bg-[var(--color-bg-soft)]" />
        <div class="h-5 w-[34rem] animate-pulse rounded bg-[var(--color-bg-soft)]" />
      </div>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="n in 4"
          :key="n"
          class="h-[120px] animate-pulse rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)]"
        />
      </div>
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div class="space-y-6">
          <div class="h-[560px] animate-pulse rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)]" />
          <div class="h-[220px] animate-pulse rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)]" />
          <div class="h-[220px] animate-pulse rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)]" />
        </div>
        <div class="space-y-6">
          <div class="h-[650px] animate-pulse rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)]" />
        </div>
      </div>
    </div>

    <div v-else-if="isEmpty">
      <DashboardStatePanel
        title="No dashboard data yet"
        description="Add courses, tasks, files, and schedule items to populate this home page."
        icon="i-lucide-layout-dashboard"
        tone="info"
      />
    </div>

    <div v-else class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-5">
        <DashboardStatGrid
          :stats="stats"
          :loading="dashboard.loading.value"
        />

        <section class="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-calendar-days"
                class="size-3.5 text-[var(--color-text)]"
              />
              <h2 class="text-[14px] font-semibold text-[var(--color-text)]">
                Today's Plan
              </h2>
            </div>
            <p class="text-[11px] font-medium text-[var(--color-text-muted)]">
              {{ currentDateLabel }}
            </p>
          </div>

          <div class="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)]">
            <div class="min-w-0">
              <div class="relative pl-[52px]">
                <div class="absolute left-[44px] top-4 bottom-4 w-[2px] rounded-full bg-[var(--color-border)]" />

                <div v-if="todaySchedule.length === 0" class="py-10">
                  <DashboardStatePanel
                    title="Nothing scheduled yet"
                    description="Your schedule will appear here once classes, tasks, or study blocks are added."
                    icon="i-lucide-calendar-plus"
                    tone="info"
                  />
                </div>

                <div v-else class="space-y-3.5">
                  <article
                    v-for="item in todaySchedule"
                    :key="item.id"
                    class="relative flex items-center gap-3.5"
                  >
                    <div class="absolute -left-[60px] w-[42px] text-right text-[11px] font-medium text-[var(--color-text-soft)]">
                      {{ item.time }}
                    </div>

                    <div class="absolute -left-[14px] flex items-center justify-center bg-[var(--color-surface)] py-1">
                      <div class="size-[10px] rounded-full border-2 border-white dark:border-slate-800" :class="eventToneClasses(scheduleTone(item.type))" />
                    </div>

                    <div
                      class="flex flex-1 items-center gap-3.5 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 shadow-[var(--shadow-sm)]"
                      :class="item.aiSuggested ? 'border-dashed border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)]' : ''"
                    >
                      <div
                        class="flex size-9 flex-shrink-0 items-center justify-center rounded-[10px]"
                        :class="eventToneClasses(scheduleTone(item.type))"
                      >
                        <UIcon
                          :name="scheduleIcon(item.type)"
                          class="size-3.5"
                        />
                      </div>

                      <div class="min-w-0 flex-1">
                        <p class="truncate text-[12px] font-semibold text-[var(--color-text)]">
                          {{ item.title }}
                        </p>
                        <p class="mt-0.5 truncate text-[10px] text-[var(--color-text-muted)]">
                          {{ item.location || item.course?.title || item.type.toUpperCase() }}
                        </p>
                      </div>

                      <div
                        v-if="item.aiSuggested"
                        class="flex size-[26px] items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-primary)]"
                      >
                        <UIcon
                          name="i-lucide-plus"
                          class="size-3"
                        />
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            </div>

            <div class="rounded-[14px] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-surface))] p-5">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-sparkles"
                  class="size-4 text-[var(--color-primary)]"
                />
                <h3 class="text-[15px] font-semibold text-[var(--color-primary)]">
                  AI Suggestion for You
                </h3>
              </div>
              <p class="mt-3 text-[13px] leading-6 text-[var(--color-text-soft)]">
                Based on your courses and exams, here's your optimal plan for today.
              </p>

              <div class="mt-5 space-y-3">
                <NuxtLink
                  v-for="item in recommendations.slice(0, 3)"
                  :key="item.id"
                  :to="item.href"
                  class="flex items-center gap-3 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-sm)] transition hover:-translate-y-[1px] hover:shadow-[var(--shadow-md)]"
                >
                  <div
                    class="flex size-8 flex-shrink-0 items-center justify-center rounded-[10px]"
                    :class="eventToneClasses(item.tone)"
                  >
                    <UIcon
                      :name="item.icon"
                      class="size-4"
                    />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-[13px] font-semibold text-[var(--color-text)]">
                      {{ item.title }}
                    </p>
                    <p class="mt-0.5 truncate text-[11px] text-[var(--color-text-muted)]">
                      {{ item.description }}
                    </p>
                  </div>
                  <UIcon
                    name="i-lucide-arrow-right"
                    class="size-4 text-[var(--color-text-muted)]"
                  />
                </NuxtLink>
              </div>

              <button class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-[var(--color-primary)] px-4 py-3 text-[13px] font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]">
                <UIcon
                  name="i-lucide-refresh-cw"
                  class="size-4"
                />
                Generate new plan
              </button>
            </div>
          </div>
        </section>

        <section class="rounded-[18px] bg-gradient-to-br from-[#4d3fd4] via-[#5a49dc] to-[#6b49e8] px-6 py-5 text-white shadow-[var(--shadow-card)]">
          <div class="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center">
            <div>
              <p class="text-[13px] font-medium !text-white/75">
                Focus Plan
              </p>
              <h3 class="mt-3 max-w-md text-[28px] font-semibold leading-[1.15] tracking-tight !text-white sm:text-[32px]">
                Stay consistent, achieve your goals.
              </h3>
              <p class="mt-4 max-w-md text-[14px] leading-6 !text-white/80">
                Your success is built one day at a time.
              </p>
            </div>

            <div class="grid gap-6 lg:grid-cols-[140px_minmax(0,1fr)] lg:items-center">
              <div class="flex flex-col items-center justify-center">
                <div class="relative flex size-[104px] items-center justify-center">
                  <svg
                    class="absolute inset-0 -rotate-90"
                    viewBox="0 0 120 120"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="44"
                      stroke="rgba(255,255,255,0.18)"
                      stroke-width="8"
                      fill="none"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="44"
                      stroke="rgba(124, 240, 190, 0.95)"
                      stroke-width="8"
                      fill="none"
                      stroke-linecap="round"
                      :stroke-dasharray="276.46"
                      :stroke-dashoffset="276.46 - ((weeklyProgress?.percent ?? 0) / 100) * 276.46"
                    />
                  </svg>
                  <div class="relative text-center">
                    <div class="text-[30px] font-semibold leading-none !text-white">
                      {{ weeklyProgress?.percent ?? 0 }}%
                    </div>
                  </div>
                </div>
                <p class="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] !text-white/80">
                  Great progress!
                </p>
              </div>

              <div class="flex items-end justify-between gap-2">
                <div
                  v-for="day in weeklyProgress?.days || []"
                  :key="day.label"
                  class="flex flex-1 flex-col items-center gap-2"
                >
                  <div class="flex h-[92px] items-end">
                    <div
                      class="w-[10px] rounded-full"
                      :style="{
                        height: `${day.height}px`,
                        background: day.highlight ? '#7df0c2' : 'rgba(255,255,255,0.55)',
                        boxShadow: day.highlight ? '0 0 18px rgba(125,240,194,0.4)' : 'none'
                      }"
                    />
                  </div>
                  <span class="text-[10px] font-semibold uppercase tracking-wide !text-white/70">
                    {{ day.label }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <DashboardSectionCard
          title="Recent Files"
          subtitle=""
          :compact="true"
        >
          <template #action>
            <NuxtLink
              to="/dashboard/files"
              class="text-[12px] font-semibold text-[var(--color-primary)]"
            >
              View all
            </NuxtLink>
          </template>

          <div v-if="recentFiles.length === 0" class="py-3">
            <DashboardStatePanel
              title="No recent files"
              description="Upload study materials to see them here."
              icon="i-lucide-file-up"
              tone="info"
            />
          </div>

          <div v-else class="grid gap-4 md:grid-cols-3">
            <article
              v-for="file in recentFiles"
              :key="file.id"
              class="flex min-w-0 items-center gap-3 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]"
            >
              <div
                class="flex size-11 flex-shrink-0 items-center justify-center rounded-[12px]"
                :class="fileTone(file.type)"
              >
                <UIcon
                  :name="fileIcon(file.type)"
                  class="size-[18px]"
                />
              </div>

              <div class="min-w-0 flex-1">
                <p class="truncate text-[13px] font-semibold text-[var(--color-text)]">
                  {{ file.name }}
                </p>
                <p class="mt-1 text-[11px] font-medium text-[var(--color-text-muted)]">
                  {{ String(file.type || 'file').toUpperCase() }} | {{ file.sizeLabel }}
                </p>
              </div>
            </article>
          </div>
        </DashboardSectionCard>
      </div>

      <div class="space-y-6">
        <div class="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-sparkles"
                class="size-[13px] shrink-0 text-[var(--color-primary)]"
              />
              <span
                class="font-semibold leading-none text-[var(--color-primary)] !text-[14px]"
                style="font-size: 14px; line-height: 1; color: var(--color-primary);"
              >
                AI Assistant
              </span>
            </div>
            <button class="flex size-7 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)]">
              <UIcon
                name="i-lucide-more-horizontal"
                class="size-4"
              />
            </button>
          </div>

          <p class="text-[12px] font-medium leading-5 text-[var(--color-text-muted)]">
            Hi {{ user?.firstName || 'User' }}! How can I help you today?
          </p>

          <div class="mt-4 space-y-2.5">
            <button
              v-for="item in recommendations.slice(0, 4)"
              :key="item.id"
              type="button"
              class="flex w-full items-center gap-3 rounded-[11px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-left shadow-[var(--shadow-sm)] transition hover:-translate-y-[1px] hover:shadow-[var(--shadow-md)]"
              @click="$router.push(item.href)"
            >
              <div
                class="flex size-[30px] flex-shrink-0 items-center justify-center rounded-[9px]"
                :class="eventToneClasses(item.tone)"
              >
                <UIcon
                  :name="item.icon"
                  class="size-3.5"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-[12px] font-semibold text-[var(--color-text)]">
                  {{ item.title }}
                </p>
              </div>
            </button>
          </div>

          <div class="mt-4 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 shadow-[var(--shadow-sm)]">
            <div class="relative flex items-center rounded-[14px] border border-[var(--color-border)] bg-white px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] dark:bg-[var(--color-surface)]">
              <textarea
                ref="assistantPromptField"
                v-model="assistantPrompt"
                rows="1"
                placeholder="Ask anything..."
                class="max-h-[72px] w-full resize-none border-none bg-transparent py-1.5 pl-0 pr-9 text-[12px] font-medium leading-[18px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                @input="resizeAssistantPrompt"
              />
              <button class="absolute right-2 top-1/2 flex size-[32px] -translate-y-1/2 items-center justify-center rounded-[10px] bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)] transition hover:brightness-110">
                <UIcon
                  name="i-lucide-send"
                  class="size-3.5"
                />
              </button>
            </div>

            <div class="mt-2.5 flex items-center justify-between gap-3 px-0.5">
              <p class="text-[10px] font-medium text-[var(--color-text-muted)]">
                {{ tokenStatus }}
              </p>
              <p class="text-[10px] font-medium text-[var(--color-text-muted)]">
                View history
              </p>
            </div>
          </div>

          <div class="mt-4 border-t border-[var(--color-border)] pt-3.5">
            <div class="mb-3 flex items-center justify-between gap-3">
              <p class="text-[12px] font-semibold text-[var(--color-text)]">
                Notifications
              </p>
              <span class="text-[10px] font-medium text-[var(--color-primary)]">
                {{ notifications.filter((item) => !item.read).length }} unread
              </span>
            </div>

            <div v-if="notifications.length === 0" class="rounded-[12px] border border-dashed border-[var(--color-border)] p-3 text-[11px] text-[var(--color-text-muted)]">
              No recent notifications.
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="item in notifications.slice(0, 3)"
                :key="item.id"
                class="flex items-start gap-3 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 shadow-[var(--shadow-sm)]"
              >
                <div
                  class="mt-0.5 flex size-[30px] items-center justify-center rounded-[9px]"
                  :class="eventToneClasses(item.tone)"
                >
                  <UIcon
                    :name="item.read ? 'i-lucide-bell' : 'i-lucide-bell-ring'"
                    class="size-3.5"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-[12px] font-semibold text-[var(--color-text)]">
                    {{ item.title }}
                  </p>
                  <p class="mt-0.5 line-clamp-2 text-[10px] leading-[1.15] text-[var(--color-text-muted)]">
                    {{ item.message }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DashboardSectionCard
          title="Upcoming"
          subtitle=""
          :compact="true"
        >
          <template #action>
            <NuxtLink
              to="/dashboard/schedule"
              class="text-[12px] font-semibold text-[var(--color-primary)]"
            >
              View all
            </NuxtLink>
          </template>

          <div v-if="upcomingEvents.length === 0" class="py-3">
            <DashboardStatePanel
              title="No upcoming events"
              description="Schedule tasks, classes, or exams to populate this list."
              icon="i-lucide-calendar-plus"
              tone="info"
            />
          </div>

          <div v-else class="space-y-4">
            <article
              v-for="item in upcomingEvents"
              :key="item.id"
              class="flex items-center gap-3"
            >
              <div class="flex w-[44px] flex-shrink-0 flex-col justify-center border-r border-[var(--color-border)] pr-3 text-center">
                <span class="text-[18px] font-semibold leading-none text-[var(--color-text)]">
                  {{ formatMonthDay(item.date).day }}
                </span>
                <span class="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  {{ formatMonthDay(item.date).month }}
                </span>
              </div>

              <div class="min-w-0 flex-1">
                <p class="truncate text-[13px] font-semibold text-[var(--color-text)]">
                  {{ item.title }}
                </p>
                <p class="mt-0.5 text-[11px] font-medium text-[var(--color-text-muted)]">
                  {{ item.subtitle }} | {{ item.time }}
                </p>
              </div>

              <span
                class="whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                :class="daysUntilClass(item.date)"
              >
                {{ daysUntil(item.date) }}
              </span>
            </article>
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Recent Courses"
          subtitle=""
          :compact="true"
        >
          <template #action>
            <NuxtLink
              to="/dashboard/courses"
              class="text-[12px] font-semibold text-[var(--color-primary)]"
            >
              View all
            </NuxtLink>
          </template>

          <div v-if="recentCourses.length === 0" class="py-3">
            <DashboardStatePanel
              title="No recent courses"
              description="Add courses to track progress and teacher details here."
              icon="i-lucide-book-plus"
              tone="info"
            />
          </div>

          <div v-else class="space-y-4">
            <article
              v-for="course in recentCourses"
              :key="course.id"
              class="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]"
            >
              <div class="flex items-start gap-3">
                <div class="flex size-11 flex-shrink-0 items-center justify-center rounded-[12px] bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[var(--color-primary)]">
                  <UIcon
                    name="i-lucide-book-open"
                    class="size-4"
                  />
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="truncate text-[13px] font-semibold text-[var(--color-text)]">
                        {{ course.title }}
                      </p>
                      <p class="mt-1 text-[11px] text-[var(--color-text-muted)]">
                        {{ course.teacher || 'Instructor not set' }} | {{ course.semester || 'Semester not set' }}
                      </p>
                    </div>
                    <span class="text-[12px] font-semibold text-[var(--color-text-muted)]">
                      {{ course.progress }}%
                    </span>
                  </div>

                  <div class="mt-3 h-[5px] overflow-hidden rounded-full bg-[var(--color-border)]">
                    <div
                      class="h-full rounded-full"
                      :style="courseBarStyle(course.progress, course.color)"
                    />
                  </div>
                </div>
              </div>
            </article>
          </div>
        </DashboardSectionCard>

      </div>
    </div>
  </section>
</template>
