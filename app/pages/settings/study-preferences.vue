<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { StudyPreferences } from '~/types/settings'

definePageMeta({ layout: 'dashboard' })

const settingsStore = useSettingsStore()
const { studyPreferences, loading, error, usingMockData } = storeToRefs(settingsStore)
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

watch(studyPreferences, (value) => {
  Object.assign(form, JSON.parse(JSON.stringify(value)))
}, { immediate: true, deep: true })

onMounted(async () => {
  await settingsStore.fetchPreferences()
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
    <header class="space-y-2">
      <h1 class="text-4xl font-semibold tracking-tight text-[var(--color-text)]">
        Profile Settings
      </h1>
      <p class="text-base text-muted">
        Manage your account, preferences, and subscription.
      </p>
    </header>

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
      v-if="loading"
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
      class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]"
    >
      <div class="space-y-6">
        <SettingsSectionCard
          title="Customize Your Study Experience"
          description="Set your preferences to help Planify AI create the perfect study plan for you."
        >
          <div class="grid gap-4 md:grid-cols-2">
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
              <div class="flex flex-wrap gap-2 rounded-2xl border border-[var(--color-border)] p-3">
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
          <div class="grid gap-3 md:grid-cols-2">
            <PreferenceToggle
              v-model="form.autoScheduleSessions"
              title="Auto-schedule sessions"
              description="Allow AI to automatically schedule sessions."
              icon="i-lucide-clock-3"
            />
            <PreferenceToggle
              v-model="form.includeBufferTime"
              title="Include buffer time"
              description="Add buffer between back-to-back sessions."
              icon="i-lucide-hourglass"
            />
            <PreferenceToggle
              v-model="form.smartRescheduling"
              title="Smart rescheduling"
              description="Automatically adjust when plans change."
              icon="i-lucide-wand-sparkles"
            />
            <PreferenceToggle
              v-model="form.weekendStudy"
              title="Weekend study"
              description="Include weekends in my schedule."
              icon="i-lucide-calendar-days"
            />
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
              class="rounded-xl bg-[var(--color-primary)] px-8 py-4 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
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

      <div class="space-y-6">
        <section class="section-card">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h3 class="text-2xl font-semibold text-[var(--color-text)]">
              Your Current Study Profile
            </h3>
            <span class="status-badge status-info">Balanced Learner</span>
          </div>

          <div class="space-y-3">
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
            <div class="profile-row">
              <span>Exam Mode</span><strong>{{ form.examPreparationMode }}</strong>
            </div>
          </div>

          <button
            type="button"
            class="mt-6 w-full rounded-xl border border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]"
          >
            Edit Preferences
          </button>
        </section>

        <section class="section-card">
          <h3 class="mb-4 text-2xl font-semibold text-[var(--color-text)]">
            Recommended by AI
          </h3>
          <p class="mb-4 text-sm text-muted">
            Personalized suggestions to optimize your learning.
          </p>
          <div class="space-y-3">
            <div
              v-for="item in aiRecommendations"
              :key="item.title"
              class="rounded-2xl border border-[var(--color-border)] px-4 py-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-[var(--color-text)]">
                    {{ item.title }}
                  </p>
                  <p class="mt-1 text-sm text-muted">
                    {{ item.description }}
                  </p>
                </div>
                <span class="status-badge status-neutral">{{ item.badge }}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]"
          >
            View all suggestions
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4"
            />
          </button>
        </section>

        <section class="section-card">
          <h3 class="mb-4 text-2xl font-semibold text-[var(--color-text)]">
            AI Study Summary
          </h3>
          <p class="mb-4 text-sm text-muted">
            How we'll personalize your experience.
          </p>
          <div class="space-y-3">
            <div
              v-for="item in aiSummary"
              :key="item"
              class="flex items-start gap-3"
            >
              <div class="icon-box icon-box-success mt-0.5">
                <UIcon
                  name="i-lucide-check"
                  class="size-4"
                />
              </div>
              <p class="text-sm text-[var(--color-text-soft)]">
                {{ item }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]"
          >
            Learn more about personalization
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4"
            />
          </button>
        </section>
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

.theme-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: 1rem;
  transition: border-color var(--transition-fast) var(--ease-out), background var(--transition-fast) var(--ease-out);
}

.theme-card--active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.profile-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--color-border);
  padding: 0.875rem 0;
  color: var(--color-text-soft);
}

.profile-row strong {
  text-align: right;
  color: var(--color-text);
}
</style>
