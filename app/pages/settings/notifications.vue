<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { NotificationPreferences } from '~/types/settings'

definePageMeta({ layout: 'dashboard' })

const settingsStore = useSettingsStore()
const { preferences, loading, error, usingMockData } = storeToRefs(settingsStore)
const feedback = ref<{ tone: 'success' | 'warning' | 'info', text: string } | null>(null)

const form = reactive<NotificationPreferences>({
  generalNotifications: true,
  aiStudyReminders: true,
  examAlerts: true,
  deadlineReminders: true,
  weeklySummaries: true,
  productivityInsights: true,
  emailNotifications: true,
  emailAddress: '',
  emailFrequency: 'digest',
  pushNotifications: true,
  webPush: true,
  mobilePush: true,
  inAppNotifications: true,
  inAppDisplayStyle: 'banner',
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  timezone: '(GMT+01:00) Casablanca',
  quietHoursApplyTo: ['push', 'email', 'in-app'],
  notificationFrequency: 'important'
})

const notificationCards = [
  { key: 'generalNotifications', label: 'General Notifications', description: 'Important updates, announcements, and product news.', icon: 'i-lucide-bell' },
  { key: 'aiStudyReminders', label: 'AI Study Reminders', description: 'Reminders for your study sessions and activities.', icon: 'i-lucide-sparkles' },
  { key: 'examAlerts', label: 'Exam Alerts', description: 'Get notified about upcoming exams and results.', icon: 'i-lucide-calendar-range' },
  { key: 'deadlineReminders', label: 'Deadline Reminders', description: 'Stay on track with assignment and task deadlines.', icon: 'i-lucide-clock-3' },
  { key: 'weeklySummaries', label: 'Weekly Summaries', description: 'Receive a weekly summary of your study progress.', icon: 'i-lucide-calendar-fold' },
  { key: 'productivityInsights', label: 'Productivity Insights', description: 'Receive insights and tips to improve your productivity.', icon: 'i-lucide-chart-column' }
] as const

watch(preferences, (value) => {
  Object.assign(form, JSON.parse(JSON.stringify(value)))
}, { immediate: true, deep: true })

onMounted(async () => {
  await settingsStore.fetchPreferences()
})

function toggleQuietHoursChannel(channel: 'push' | 'email' | 'in-app') {
  const set = new Set(form.quietHoursApplyTo)

  if (set.has(channel)) {
    set.delete(channel)
  } else {
    set.add(channel)
  }

  form.quietHoursApplyTo = Array.from(set)
}

async function savePreferences() {
  const saved = await settingsStore.updateNotifications({ ...form })

  feedback.value = {
    tone: saved ? 'success' : 'warning',
    text: saved ? 'Notification settings updated successfully.' : (error.value || 'Backend unavailable. Preferences are stored locally for now.')
  }
}

async function testNotifications() {
  const ok = await settingsStore.testNotification()

  feedback.value = {
    tone: ok ? 'info' : 'warning',
    text: ok ? 'Check your enabled channels for the test message.' : (error.value || 'Backend unavailable. This confirms the UI flow is wired.')
  }
}
</script>

<template>
  <section class="mx-auto max-w-[1440px] space-y-6 pb-10">
    <header class="space-y-2">
      <h1 class="text-4xl font-semibold tracking-tight text-[var(--color-text)]">
        Notification Settings
      </h1>
      <p class="text-base text-muted">
        Choose how and when you want to be notified.
      </p>
    </header>

    <SettingsTabs />

    <div
      v-if="usingMockData"
      class="glass-card flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[var(--color-text-soft)]"
    >
      <UIcon
        name="i-lucide-badge-info"
        class="size-4 text-[var(--color-primary)]"
      />
      <span>{{ error || 'Backend unavailable. Showing mock notification data.' }}</span>
    </div>

    <div
      v-if="feedback"
      class="rounded-2xl px-4 py-3 text-sm font-medium"
      :class="feedback.tone === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : feedback.tone === 'warning' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'"
    >
      {{ feedback.text }}
    </div>

    <div
      v-if="loading"
      class="grid gap-6 xl:grid-cols-[1fr_420px]"
    >
      <div class="space-y-6">
        <div class="h-[36rem] animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]" />
        <div class="grid gap-6 md:grid-cols-3">
          <div
            v-for="item in 3"
            :key="item"
            class="h-72 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]"
          />
        </div>
      </div>
      <div class="space-y-6">
        <div
          v-for="item in 2"
          :key="item"
          class="h-80 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]"
        />
      </div>
    </div>

    <div
      v-else
      class="space-y-6"
    >
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <SettingsSectionCard
          title="Notification Preferences"
          description="Customize the types of notifications you want to receive."
        >
          <div class="space-y-3">
            <PreferenceToggle
              v-for="item in notificationCards"
              :key="item.key"
              v-model="form[item.key]"
              :title="item.label"
              :description="item.description"
              :icon="item.icon"
            />
          </div>
        </SettingsSectionCard>

        <div class="space-y-6">
          <SettingsSectionCard
            title="Email Notifications"
            description="Receive notifications via email."
          >
            <template #header>
              <button
                type="button"
                class="relative inline-flex h-7 w-12 rounded-full transition"
                :class="form.emailNotifications ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'"
                @click="form.emailNotifications = !form.emailNotifications"
              >
                <span
                  class="absolute top-1 size-5 rounded-full bg-white transition"
                  :class="form.emailNotifications ? 'left-6' : 'left-1'"
                />
              </button>
            </template>

            <div class="space-y-4">
              <SettingsField label="Email Address">
                <input
                  v-model="form.emailAddress"
                  class="field-control"
                  type="email"
                  placeholder="Email address"
                >
              </SettingsField>

              <div>
                <p class="mb-3 text-sm font-medium text-[var(--color-text-soft)]">
                  Email Frequency
                </p>
                <div class="space-y-3">
                  <label class="radio-row">
                    <input
                      v-model="form.emailFrequency"
                      type="radio"
                      value="instant"
                      class="radio-input"
                    >
                    <div>
                      <p class="text-sm font-semibold text-[var(--color-text)]">Instant</p>
                      <p class="text-sm text-muted">Receive emails instantly.</p>
                    </div>
                  </label>
                  <label class="radio-row">
                    <input
                      v-model="form.emailFrequency"
                      type="radio"
                      value="digest"
                      class="radio-input"
                    >
                    <div>
                      <p class="text-sm font-semibold text-[var(--color-text)]">Digest (Recommended)</p>
                      <p class="text-sm text-muted">Receive a daily summary.</p>
                    </div>
                  </label>
                  <label class="radio-row">
                    <input
                      v-model="form.emailFrequency"
                      type="radio"
                      value="weekly"
                      class="radio-input"
                    >
                    <div>
                      <p class="text-sm font-semibold text-[var(--color-text)]">Weekly</p>
                      <p class="text-sm text-muted">Receive a weekly summary.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </SettingsSectionCard>

          <SettingsSectionCard
            title="Push Notifications"
            description="Receive notifications on your browser and mobile device."
          >
            <template #header>
              <button
                type="button"
                class="relative inline-flex h-7 w-12 rounded-full transition"
                :class="form.pushNotifications ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'"
                @click="form.pushNotifications = !form.pushNotifications"
              >
                <span
                  class="absolute top-1 size-5 rounded-full bg-white transition"
                  :class="form.pushNotifications ? 'left-6' : 'left-1'"
                />
              </button>
            </template>

            <div class="space-y-3">
              <label class="checkbox-row">
                <input
                  v-model="form.webPush"
                  type="checkbox"
                  class="checkbox-input"
                >
                <div>
                  <p class="text-sm font-semibold text-[var(--color-text)]">Web Push</p>
                  <p class="text-sm text-muted">Receive push notifications in your browser.</p>
                </div>
              </label>
              <label class="checkbox-row">
                <input
                  v-model="form.mobilePush"
                  type="checkbox"
                  class="checkbox-input"
                >
                <div>
                  <p class="text-sm font-semibold text-[var(--color-text)]">Mobile Push</p>
                  <p class="text-sm text-muted">Receive push notifications on your mobile device.</p>
                </div>
              </label>
            </div>
          </SettingsSectionCard>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-3">
        <SettingsSectionCard
          title="In-App Notifications"
          description="Show notifications inside the Planify AI app."
        >
          <template #header>
            <button
              type="button"
              class="relative inline-flex h-7 w-12 rounded-full transition"
              :class="form.inAppNotifications ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'"
              @click="form.inAppNotifications = !form.inAppNotifications"
            >
              <span
                class="absolute top-1 size-5 rounded-full bg-white transition"
                :class="form.inAppNotifications ? 'left-6' : 'left-1'"
              />
            </button>
          </template>

          <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_120px]">
            <div class="space-y-3">
              <label class="radio-row">
                <input
                  v-model="form.inAppDisplayStyle"
                  type="radio"
                  value="banner"
                  class="radio-input"
                >
                <div>
                  <p class="text-sm font-semibold text-[var(--color-text)]">Banner</p>
                  <p class="text-sm text-muted">Show notifications as banners.</p>
                </div>
              </label>
              <label class="radio-row">
                <input
                  v-model="form.inAppDisplayStyle"
                  type="radio"
                  value="toast"
                  class="radio-input"
                >
                <div>
                  <p class="text-sm font-semibold text-[var(--color-text)]">Toast</p>
                  <p class="text-sm text-muted">Show notifications as toasts.</p>
                </div>
              </label>
              <label class="radio-row">
                <input
                  v-model="form.inAppDisplayStyle"
                  type="radio"
                  value="modal"
                  class="radio-input"
                >
                <div>
                  <p class="text-sm font-semibold text-[var(--color-text)]">Modal</p>
                  <p class="text-sm text-muted">Show notifications as pop-ups.</p>
                </div>
              </label>
            </div>

            <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4">
              <div class="space-y-3">
                <div class="h-4 rounded-full bg-white/70" />
                <div class="h-4 rounded-full bg-white/60" />
                <div class="rounded-xl bg-[var(--color-primary-soft)] p-3 text-xs font-semibold text-[var(--color-primary)]">
                  {{ form.inAppDisplayStyle }}
                </div>
                <div class="h-4 rounded-full bg-white/60" />
              </div>
            </div>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Quiet Hours"
          description="Pause non-urgent notifications during this time."
        >
          <template #header>
            <button
              type="button"
              class="relative inline-flex h-7 w-12 rounded-full transition"
              :class="form.quietHoursEnabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'"
              @click="form.quietHoursEnabled = !form.quietHoursEnabled"
            >
              <span
                class="absolute top-1 size-5 rounded-full bg-white transition"
                :class="form.quietHoursEnabled ? 'left-6' : 'left-1'"
              />
            </button>
          </template>

          <div class="grid gap-4 md:grid-cols-2">
            <SettingsField label="Start Time">
              <input
                v-model="form.quietHoursStart"
                class="field-control"
                type="time"
              >
            </SettingsField>
            <SettingsField label="End Time">
              <input
                v-model="form.quietHoursEnd"
                class="field-control"
                type="time"
              >
            </SettingsField>
          </div>

          <div class="mt-4">
            <SettingsField label="Time Zone">
              <select
                v-model="form.timezone"
                class="field-control"
              >
                <option>(GMT+01:00) Casablanca</option>
                <option>(GMT+01:00) Lagos</option>
                <option>(GMT+00:00) London</option>
              </select>
            </SettingsField>
          </div>

          <div class="mt-4">
            <p class="mb-3 text-sm font-medium text-[var(--color-text-soft)]">
              Apply To
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="toggle-chip"
                :class="{ 'toggle-chip--active': form.quietHoursApplyTo.includes('push') }"
                @click="toggleQuietHoursChannel('push')"
              >
                Push
              </button>
              <button
                type="button"
                class="toggle-chip"
                :class="{ 'toggle-chip--active': form.quietHoursApplyTo.includes('email') }"
                @click="toggleQuietHoursChannel('email')"
              >
                Email
              </button>
              <button
                type="button"
                class="toggle-chip"
                :class="{ 'toggle-chip--active': form.quietHoursApplyTo.includes('in-app') }"
                @click="toggleQuietHoursChannel('in-app')"
              >
                In-App
              </button>
            </div>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Notification Frequency"
          description="Control how often you receive non-urgent notifications."
        >
          <div class="space-y-3">
            <label class="radio-row">
              <input
                v-model="form.notificationFrequency"
                type="radio"
                value="all"
                class="radio-input"
              >
              <div>
                <p class="text-sm font-semibold text-[var(--color-text)]">All Notifications</p>
                <p class="text-sm text-muted">Receive all notifications as they happen.</p>
              </div>
            </label>
            <label class="radio-row">
              <input
                v-model="form.notificationFrequency"
                type="radio"
                value="important"
                class="radio-input"
              >
              <div>
                <p class="text-sm font-semibold text-[var(--color-text)]">Important Only</p>
                <p class="text-sm text-muted">Receive only important notifications.</p>
              </div>
            </label>
            <label class="radio-row">
              <input
                v-model="form.notificationFrequency"
                type="radio"
                value="custom"
                class="radio-input"
              >
              <div>
                <p class="text-sm font-semibold text-[var(--color-text)]">Custom</p>
                <p class="text-sm text-muted">Choose which notifications to receive.</p>
              </div>
            </label>
          </div>
        </SettingsSectionCard>
      </div>

      <div class="gradient-card flex flex-col gap-4 rounded-2xl px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-start gap-3">
          <div class="icon-box icon-box-primary">
            <UIcon
              name="i-lucide-bell-ring"
              class="size-4"
            />
          </div>
          <p class="text-sm font-medium text-[var(--color-text-soft)]">
            You will still receive critical alerts for account security and important system updates, even during quiet hours.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="rounded-xl border border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
            @click="testNotifications"
          >
            Test Notifications
          </button>
          <button
            type="button"
            class="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
            @click="savePreferences"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.field-control {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-input-bg);
  color: var(--color-text);
  min-height: 48px;
  padding: 0 1rem;
  transition: border-color var(--transition-fast) var(--ease-out), box-shadow var(--transition-fast) var(--ease-out);
}

.field-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-soft);
}

.radio-row,
.checkbox-row {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 0.875rem 1rem;
}

.radio-input,
.checkbox-input {
  margin-top: 0.2rem;
  accent-color: var(--color-primary);
}

.toggle-chip {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-soft);
  transition: background var(--transition-fast) var(--ease-out), color var(--transition-fast) var(--ease-out), border-color var(--transition-fast) var(--ease-out);
}

.toggle-chip--active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}
</style>
