<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { StudyPreferences } from '~/types/settings'

definePageMeta({ layout: 'dashboard' })

const settingsStore = useSettingsStore()
const { studyPreferences, studyLoading, error, usingMockData } = storeToRefs(settingsStore)
const feedback = ref<{ tone: 'success' | 'warning', text: string } | null>(null)

const form = reactive<StudyPreferences>({
  preferredStudyHours: 'Morning (8AM - 12PM)',
  preferredDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  focusSessionLength: 90,
  revisionStyle: 'Spaced Repetition',
  breakLength: 15,
  language: 'English (US)',
  difficultyPreference: 'Balanced',
  calendarDefaultView: 'Schedule View',
  aiAssistantTone: 'Encouraging & Friendly',
  examPreparationMode: 'Balanced (Learn & Practice)',
  autoScheduleSessions: true,
  includeBufferTime: true,
  smartRescheduling: true,
  weekendStudy: false,
  themePreference: 'light'
})

const aiRecommendations = [
  { title: 'Try extending focus sessions', description: 'Students like you perform 12% better with 105 min focus sessions.', badge: 'Try it' },
  { title: 'Add weekend sessions', description: 'Adding weekend study can improve retention by up to 18%.', badge: 'Recommended' },
  { title: 'Use Active Recall', description: 'Switching to Active Recall can boost long-term memory.', badge: 'Popular' }
]

const aiSummary = [
  'We\'ll schedule your toughest topics in your peak hours.',
  'You\'ll get spaced revision reminders automatically.',
  'AI will suggest resources matching your difficulty preference.',
  'Your exam prep will balance learning and practice.'
]

// Sync form whenever the store state changes (e.g. after fetch completes)
watch(studyPreferences, (value) => {
  Object.assign(form, JSON.parse(JSON.stringify(value)))
}, { immediate: true, deep: true })

onMounted(async () => {
  await settingsStore.fetchStudyPreferences()
})

function toggleDay(day: string) {
  const days = new Set(form.preferredDays)

  if (days.has(day)) {
    days.delete(day)
  } else {
    days.add(day)
  }

  form.preferredDays = Array.from(days)
}

async function savePreferences() {
  const saved = await settingsStore.updateStudyPreferences({ ...form })

  feedback.value = {
    tone: saved ? 'success' : 'warning',
    text: saved ? 'Your study profile has been updated.' : (error.value || 'Backend unavailable. Local study preferences remain active.')
  }
}
</script>

<template>
  <section class="mx-auto max-w-[1440px] space-y-6 pb-10">
        <SettingsTabs />

    <div
      v-if="usingMockData"
      class="glass-card flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[var(--color-text-soft)]"
    >
      <UIcon
        name="i-lucide-bot"
        class="size-4 text-[var(--color-primary)]"
      />
      <span>{{ error || 'Backend unavailable. Showing mock study preferences.' }}</span>
    </div>

    <div
      v-if="feedback"
      class="rounded-2xl px-4 py-3 text-sm font-medium"
      :class="feedback.tone === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'"
    >
      {{ feedback.text }}
    </div>

    <div
      v-if="studyLoading"
      class="grid gap-6 xl:grid-cols-[1fr_420px]"
    >
      <div class="space-y-6">
        <div class="h-[34rem] animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]" />
        <div class="h-72 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]" />
      </div>
      <div class="space-y-6">
        <div
          v-for="item in 3"
          :key="item"
          class="h-72 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]"
        />
      </div>
    </div>

    <div
      v-else
      class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]"
    >
      <div class="space-y-5">
        <SettingsSectionCard
          title="Customize Your Study Experience"
          description="Set your preferences to help Planify AI create the perfect study plan for you."
        >
          <div class="grid gap-3 md:grid-cols-2">
            <SettingsField
              label="Preferred Study Hours"
              hint="When do you study best?"
            >
              <select
                v-model="form.preferredStudyHours"
                class="field-control"
              >
                <option>Morning (8AM - 12PM)</option>
                <option>Afternoon (12PM - 4PM)</option>
                <option>Evening (4PM - 8PM)</option>
                <option>Night (8PM - 11PM)</option>
              </select>
            </SettingsField>

            <SettingsField
              label="Preferred Days"
              hint="Days you typically study"
            >
              <div class="flex flex-wrap gap-1.5 rounded-xl border border-[var(--color-border)] p-2">
                <button
                  v-for="day in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
                  :key="day"
                  type="button"
                  class="toggle-chip"
                  :class="{ 'toggle-chip--active': form.preferredDays.includes(day) }"
                  @click="toggleDay(day)"
                >
                  {{ day }}
                </button>
              </div>
            </SettingsField>

            <SettingsField
              label="Focus Session Length"
              hint="Duration for focused study sessions"
            >
              <select
                v-model="form.focusSessionLength"
                class="field-control"
              >
                <option :value="60">
                  60 minutes
                </option>
                <option :value="90">
                  90 minutes
                </option>
                <option :value="105">
                  105 minutes
                </option>
                <option :value="120">
                  120 minutes
                </option>
              </select>
            </SettingsField>

            <SettingsField
              label="Revision Style"
              hint="How do you prefer to revise?"
            >
              <select
                v-model="form.revisionStyle"
                class="field-control"
              >
                <option>Spaced Repetition</option>
                <option>Active Recall</option>
                <option>Practice Tests</option>
              </select>
            </SettingsField>

            <SettingsField
              label="Break Length"
              hint="Short breaks between sessions"
            >
              <select
                v-model="form.breakLength"
                class="field-control"
              >
                <option :value="10">
                  10 minutes
                </option>
                <option :value="15">
                  15 minutes
                </option>
                <option :value="20">
                  20 minutes
                </option>
              </select>
            </SettingsField>

            <SettingsField
              label="Language"
              hint="Select your preferred language"
            >
              <select
                v-model="form.language"
                class="field-control"
              >
                <option>English (US)</option>
                <option>French</option>
                <option>Arabic</option>
              </select>
            </SettingsField>

            <SettingsField
              label="Difficulty Preference"
              hint="How do you like to learn new topics?"
            >
              <select
                v-model="form.difficultyPreference"
                class="field-control"
              >
                <option>Balanced</option>
                <option>Challenging</option>
                <option>Step-by-step</option>
              </select>
            </SettingsField>

            <SettingsField
              label="Calendar Default View"
              hint="Choose your default calendar view"
            >
              <select
                v-model="form.calendarDefaultView"
                class="field-control"
              >
                <option>Schedule View</option>
                <option>Weekly View</option>
                <option>Agenda View</option>
              </select>
            </SettingsField>

            <SettingsField
              label="AI Assistant Tone"
              hint="How should Planify AI communicate?"
            >
              <select
                v-model="form.aiAssistantTone"
                class="field-control"
              >
                <option>Encouraging & Friendly</option>
                <option>Direct & Concise</option>
                <option>Coach-like</option>
              </select>
            </SettingsField>

            <SettingsField
              label="Exam Preparation Mode"
              hint="How should we prioritize your plan?"
            >
              <select
                v-model="form.examPreparationMode"
                class="field-control"
              >
                <option>Balanced (Learn & Practice)</option>
                <option>Practice Heavy</option>
                <option>Revision Sprint</option>
              </select>
            </SettingsField>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Scheduling Preferences"
          description="Set how Planify AI schedules and organizes your study plan."
        >
          <!-- Row 1 ─ top pair -->
          <div class="sched-row sched-row--sep">
            <!-- Auto-schedule sessions -->
            <div class="sched-item">
              <div class="sched-left">
                <div class="icon-box icon-box-primary !size-8 flex-shrink-0">
                  <UIcon name="i-lucide-calendar-clock" class="size-4" />
                </div>
                <div class="min-w-0">
                  <p class="sched-title">Auto-schedule sessions</p>
                  <p class="sched-desc">Allow AI to automatically generate study sessions.</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                :aria-checked="form.autoScheduleSessions"
                class="sched-toggle"
                :class="{ 'sched-toggle--on': form.autoScheduleSessions }"
                @click="form.autoScheduleSessions = !form.autoScheduleSessions"
              >
                <span class="sched-toggle-thumb" />
              </button>
            </div>

            <!-- Include buffer time -->
            <div class="sched-item">
              <div class="sched-left">
                <div class="icon-box icon-box-primary !size-8 flex-shrink-0">
                  <UIcon name="i-lucide-clock-3" class="size-4" />
                </div>
                <div class="min-w-0">
                  <p class="sched-title">Include buffer time</p>
                  <p class="sched-desc">Automatically leave free time between consecutive sessions.</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                :aria-checked="form.includeBufferTime"
                class="sched-toggle"
                :class="{ 'sched-toggle--on': form.includeBufferTime }"
                @click="form.includeBufferTime = !form.includeBufferTime"
              >
                <span class="sched-toggle-thumb" />
              </button>
            </div>
          </div>

          <!-- Row 2 ─ bottom pair -->
          <div class="sched-row">
            <!-- Smart rescheduling -->
            <div class="sched-item">
              <div class="sched-left">
                <div class="icon-box icon-box-primary !size-8 flex-shrink-0">
                  <UIcon name="i-lucide-refresh-cw" class="size-4" />
                </div>
                <div class="min-w-0">
                  <p class="sched-title">Smart rescheduling</p>
                  <p class="sched-desc">Automatically reorganize sessions when deadlines change.</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                :aria-checked="form.smartRescheduling"
                class="sched-toggle"
                :class="{ 'sched-toggle--on': form.smartRescheduling }"
                @click="form.smartRescheduling = !form.smartRescheduling"
              >
                <span class="sched-toggle-thumb" />
              </button>
            </div>

            <!-- Weekend study -->
            <div class="sched-item">
              <div class="sched-left">
                <div class="icon-box icon-box-primary !size-8 flex-shrink-0">
                  <UIcon name="i-lucide-calendar-days" class="size-4" />
                </div>
                <div class="min-w-0">
                  <p class="sched-title">Weekend study</p>
                  <p class="sched-desc">Allow AI to schedule study sessions during weekends.</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                :aria-checked="form.weekendStudy"
                class="sched-toggle"
                :class="{ 'sched-toggle--on': form.weekendStudy }"
                @click="form.weekendStudy = !form.weekendStudy"
              >
                <span class="sched-toggle-thumb" />
              </button>
            </div>
          </div>
        </SettingsSectionCard>

        <div class="grid gap-6 lg:grid-cols-[1fr_auto]">
          <SettingsSectionCard
            title="Theme Preference"
            description="Choose your preferred theme."
          >
            <div class="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                class="theme-card"
                :class="{ 'theme-card--active': form.themePreference === 'light' }"
                @click="form.themePreference = 'light'"
              >
                <UIcon
                  name="i-lucide-sun-medium"
                  class="size-5 text-[var(--color-primary)]"
                />
                <div class="text-left">
                  <p class="text-sm font-semibold text-[var(--color-text)]">
                    Light Mode
                  </p>
                  <p class="text-sm text-muted">
                    Clean and bright experience
                  </p>
                </div>
              </button>
              <button
                type="button"
                class="theme-card"
                :class="{ 'theme-card--active': form.themePreference === 'dark' }"
                @click="form.themePreference = 'dark'"
              >
                <UIcon
                  name="i-lucide-moon-star"
                  class="size-5 text-[var(--color-primary)]"
                />
                <div class="text-left">
                  <p class="text-sm font-semibold text-[var(--color-text)]">
                    Dark Mode
                  </p>
                  <p class="text-sm text-muted">
                    Easy on the eyes
                  </p>
                </div>
              </button>
            </div>
          </SettingsSectionCard>

          <div class="flex flex-col items-end justify-end gap-3">
            <button
              type="button"
              class="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
              @click="savePreferences"
            >
              Save Preferences
            </button>
            <p class="text-sm text-muted">
              Your preferences are saved automatically.
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-5">
        <section class="section-card">
          <div class="mb-3 flex items-center justify-between gap-3">
            <h3 class="text-xl font-semibold text-[var(--color-text)]">
              Your Current Study Profile
            </h3>
            <span class="status-badge status-info">Balanced Learner</span>
          </div>

          <div class="space-y-0">
            <div class="profile-row">
              <span>Study Hours</span><strong>{{ form.preferredStudyHours }}</strong>
            </div>
            <div class="profile-row">
              <span>Focus Session</span><strong>{{ form.focusSessionLength }} minutes</strong>
            </div>
            <div class="profile-row">
              <span>Break Length</span><strong>{{ form.breakLength }} minutes</strong>
            </div>
            <div class="profile-row">
              <span>Study Days</span><strong>{{ form.preferredDays.join(', ') }}</strong>
            </div>
            <div class="profile-row">
              <span>Revision Style</span><strong>{{ form.revisionStyle }}</strong>
            </div>
            <div class="profile-row">
              <span>Difficulty</span><strong>{{ form.difficultyPreference }}</strong>
            </div>
            <div class="profile-row profile-row--last">
              <span>Exam Mode</span><strong>{{ form.examPreparationMode }}</strong>
            </div>
          </div>
        </section>

        <section class="section-card">
          <h3 class="mb-1 text-xl font-semibold text-[var(--color-text)]">
            Recommended by AI
          </h3>
          <p class="mb-4 text-sm text-muted">
            Personalized suggestions to optimize your learning.
          </p>
          <div class="space-y-2.5">
            <div
              v-for="item in aiRecommendations"
              :key="item.title"
              class="rounded-xl border border-[var(--color-border)] px-3.5 py-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-[var(--color-text)]">
                    {{ item.title }}
                  </p>
                  <p class="mt-0.5 text-xs text-muted">
                    {{ item.description }}
                  </p>
                </div>
                <span class="status-badge status-neutral flex-shrink-0">{{ item.badge }}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)]"
          >
            View all suggestions
            <UIcon
              name="i-lucide-arrow-right"
              class="size-3.5"
            />
          </button>
        </section>

        <section class="section-card">
          <h3 class="mb-1 text-xl font-semibold text-[var(--color-text)]">
            AI Study Summary
          </h3>
          <p class="mb-4 text-sm text-muted">
            How we'll personalize your experience.
          </p>
          <div class="space-y-2.5">
            <div
              v-for="item in aiSummary"
              :key="item"
              class="flex items-start gap-3"
            >
              <div class="icon-box icon-box-success mt-0.5 !size-8">
                <UIcon
                  name="i-lucide-check"
                  class="size-3.5"
                />
              </div>
              <p class="text-sm text-[var(--color-text-soft)]">
                {{ item }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)]"
          >
            Learn more about personalization
            <UIcon
              name="i-lucide-arrow-right"
              class="size-3.5"
            />
          </button>
        </section>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ── Form Controls ─────────────────────────────────────────────────────────── */
.field-control {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-input-bg);
  color: var(--color-text);
  font-size: 0.9375rem; /* 15px */
  font-weight: 500;
  min-height: 42px;
  padding: 0 0.875rem;
  transition: border-color var(--transition-fast) var(--ease-out),
    box-shadow var(--transition-fast) var(--ease-out);
}

.field-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

/* ── Day-of-week Chips ─────────────────────────────────────────────────────── */
.toggle-chip {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem; /* 13px */
  font-weight: 600;
  color: var(--color-text-soft);
  transition: background var(--transition-fast) var(--ease-out),
    color var(--transition-fast) var(--ease-out),
    border-color var(--transition-fast) var(--ease-out);
}

.toggle-chip--active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

/* ── Theme Cards ───────────────────────────────────────────────────────────── */
.theme-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 0.75rem;
  transition: border-color var(--transition-fast) var(--ease-out),
    background var(--transition-fast) var(--ease-out);
}

.theme-card--active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

/* ── Study Profile Summary Rows ────────────────────────────────────────────── */
.profile-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid var(--color-border);
  padding: 0.5rem 0;
  font-size: 0.875rem; /* 14px */
  color: var(--color-text-soft);
}

.profile-row--last {
  border-bottom: none;
}

.profile-row strong {
  text-align: right;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text);
}

/* ── Scheduling Preferences ─────────────────────────────────────────────────── */
.sched-row {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .sched-row {
    grid-template-columns: 1fr 1fr;
    gap: 0 1.5rem;
  }
}

.sched-row--sep {
  border-bottom: 1px solid var(--color-border);
}

.sched-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.875rem;
  padding: 0.875rem 0;
}

/* On mobile, stack items with individual separators */
@media (max-width: 767px) {
  .sched-row--sep .sched-item {
    border-bottom: 1px solid var(--color-border);
  }
  .sched-row--sep .sched-item:last-child {
    border-bottom: none;
  }
  .sched-row:not(.sched-row--sep) .sched-item:not(:last-child) {
    border-bottom: 1px solid var(--color-border);
  }
}

.sched-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1;
}

.sched-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
  margin: 0;
}

.sched-desc {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  line-height: 1.4;
  margin: 0.125rem 0 0;
}

/* ── Pill Toggle Switch ──────────────────────────────────────────────────────── */
.sched-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 24px;
  border-radius: 9999px;
  background: var(--color-border);
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
  padding: 0;
}

.sched-toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.sched-toggle--on {
  background: var(--color-primary);
}

.sched-toggle-thumb {
  position: absolute;
  left: 2px;
  top: 2px;
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
  transition: transform 0.2s ease;
  pointer-events: none;
}

.sched-toggle--on .sched-toggle-thumb {
  transform: translateX(20px);
}
</style>

