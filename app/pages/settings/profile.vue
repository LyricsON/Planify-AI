<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { ProfilePayload } from '~/types/profile'

definePageMeta({ layout: 'dashboard' })

const profileStore = useProfileStore()
const { user, profile, stats, goals, achievements, recentActivity, subscription, tokenUsage, aiPreferences, quickActions, loading, error, usingMockData } = storeToRefs(profileStore)
const feedback = ref<{ tone: 'success' | 'warning' | 'info', text: string } | null>(null)

const form = reactive<ProfilePayload>({
  name: '',
  email: '',
  phone: '',
  location: '',
  bio: '',
  university: '',
  fieldOfStudy: '',
  academicYear: '',
  studentId: ''
})

const syncForm = () => {
  if (!user.value || !profile.value) {
    return
  }

  form.name = user.value.name
  form.email = user.value.email
  form.phone = user.value.phone
  form.location = user.value.location
  form.bio = profile.value.bio
  form.university = profile.value.academic.university
  form.fieldOfStudy = profile.value.academic.fieldOfStudy
  form.academicYear = profile.value.academic.academicYear
  form.studentId = profile.value.academic.studentId
}

watch([user, profile], syncForm, { immediate: true })

onMounted(async () => {
  await profileStore.fetchProfile()
})

async function saveProfile() {
  const saved = await profileStore.updateProfile({ ...form })

  feedback.value = {
    tone: saved ? 'success' : 'warning',
    text: saved ? 'Your profile changes have been stored.' : (error.value || 'Changes were applied locally while the backend is unavailable.')
  }
}

async function handleAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  await profileStore.updateAvatar(file)
  feedback.value = {
    tone: 'info',
    text: 'Avatar preview updated locally. Connect the upload endpoint when ready.'
  }
}
</script>

<template>
  <section class="mx-auto max-w-[1440px] space-y-6 pb-10">
    <header class="space-y-2">
      <h1 class="text-4xl font-semibold tracking-tight text-[var(--color-text)]">
        Profile
      </h1>
      <p class="text-base text-muted">
        Manage your account, preferences and track your progress.
      </p>
    </header>

    <SettingsTabs />

    <div
      v-if="usingMockData"
      class="glass-card flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[var(--color-text-soft)]"
    >
      <UIcon
        name="i-lucide-database-zap"
        class="size-4 text-[var(--color-primary)]"
      />
      <span>{{ error || 'Backend unavailable. Showing mock profile data.' }}</span>
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
      class="grid gap-6 xl:grid-cols-[1fr_320px]"
    >
      <div class="space-y-6">
        <div class="h-72 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]" />
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="item in 4"
            :key="item"
            class="h-36 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]"
          />
        </div>
        <div class="grid gap-6 lg:grid-cols-2">
          <div
            v-for="item in 4"
            :key="item"
            class="h-72 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]"
          />
        </div>
      </div>
      <div class="space-y-6">
        <div
          v-for="item in 4"
          :key="item"
          class="h-48 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]"
        />
      </div>
    </div>

    <div
      v-else-if="user && profile && subscription && tokenUsage"
      class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div class="space-y-6">
        <ProfileHeaderCard
          :user="user"
          :profile="profile"
          :subscription="subscription"
          @edit="saveProfile"
        />
        <ProfileStatsGrid :stats="stats" />

        <div class="grid gap-6 lg:grid-cols-2">
          <ProfileAboutCard :profile="profile" />

          <section class="section-card">
            <div class="mb-5 flex items-center gap-3">
              <div class="icon-box icon-box-info">
                <UIcon
                  name="i-lucide-building-2"
                  class="size-4"
                />
              </div>
              <h3 class="text-xl font-semibold text-[var(--color-text)]">
                Academic Information
              </h3>
            </div>

            <div class="space-y-4 text-sm">
              <div class="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
                <span class="text-muted">University</span>
                <span class="font-semibold text-[var(--color-text)]">{{ profile.academic.university }}</span>
              </div>
              <div class="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
                <span class="text-muted">Program</span>
                <span class="font-semibold text-[var(--color-text)]">{{ profile.academic.fieldOfStudy }}</span>
              </div>
              <div class="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
                <span class="text-muted">Year</span>
                <span class="font-semibold text-[var(--color-text)]">{{ profile.academic.academicYear }}</span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="text-muted">GPA</span>
                <span class="font-semibold text-[var(--color-text)]">{{ profile.academic.gpa }}</span>
              </div>
            </div>
          </section>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <ProfileGoalsCard :goals="goals" />
          <ProfileAchievementsCard :achievements="achievements" />
        </div>

        <ProfileActivityCard :activity="recentActivity" />

        <SettingsSectionCard
          title="Personal Information"
          description="Update your personal details and academic profile."
        >
          <div class="grid gap-4 md:grid-cols-2">
            <SettingsField
              label="Avatar Upload"
              hint="JPG, PNG up to 2MB"
            >
              <div class="flex items-center gap-4 rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-soft)] p-4">
                <UAvatar
                  :src="user.avatar"
                  :alt="user.name"
                  class="size-16"
                />
                <div class="space-y-2">
                  <input
                    class="block text-sm text-[var(--color-text-soft)] file:mr-3 file:rounded-xl file:border-0 file:bg-[var(--color-primary-soft)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--color-primary)]"
                    type="file"
                    accept="image/*"
                    @change="handleAvatarChange"
                  >
                  <p class="text-xs text-muted">
                    This updates the local preview now and is ready for backend upload later.
                  </p>
                </div>
              </div>
            </SettingsField>

            <SettingsField label="Full Name">
              <input
                v-model="form.name"
                class="field-control"
                type="text"
                placeholder="Full name"
              >
            </SettingsField>

            <SettingsField label="Email Address">
              <input
                v-model="form.email"
                class="field-control"
                type="email"
                placeholder="Email address"
              >
            </SettingsField>

            <SettingsField label="Phone Number">
              <input
                v-model="form.phone"
                class="field-control"
                type="tel"
                placeholder="Phone number"
              >
            </SettingsField>

            <SettingsField label="Location">
              <input
                v-model="form.location"
                class="field-control"
                type="text"
                placeholder="City, country"
              >
            </SettingsField>

            <SettingsField label="University">
              <input
                v-model="form.university"
                class="field-control"
                type="text"
                placeholder="University"
              >
            </SettingsField>

            <SettingsField label="Field of Study">
              <input
                v-model="form.fieldOfStudy"
                class="field-control"
                type="text"
                placeholder="Field of study"
              >
            </SettingsField>

            <SettingsField label="Academic Year">
              <input
                v-model="form.academicYear"
                class="field-control"
                type="text"
                placeholder="Academic year"
              >
            </SettingsField>

            <SettingsField label="Student ID">
              <input
                v-model="form.studentId"
                class="field-control"
                type="text"
                placeholder="Student ID"
              >
            </SettingsField>

            <div class="md:col-span-2">
              <SettingsField label="About You">
                <textarea
                  v-model="form.bio"
                  class="field-control min-h-32 resize-none py-3"
                  placeholder="Share a short bio"
                />
              </SettingsField>
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <button
              type="button"
              class="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
              @click="saveProfile"
            >
              Save Changes
            </button>
          </div>
        </SettingsSectionCard>
      </div>

      <div class="space-y-6">
        <section class="section-card">
          <div class="mb-5 flex items-center justify-between gap-3">
            <h3 class="text-xl font-semibold text-[var(--color-text)]">
              Subscription
            </h3>
            <span class="status-badge status-info">{{ subscription.status }}</span>
          </div>
          <p class="text-2xl font-semibold text-[var(--color-text)]">
            {{ subscription.name }}
          </p>
          <p class="mt-3 text-sm text-muted">
            Next billing date
          </p>
          <p class="mt-1 text-sm font-semibold text-[var(--color-text)]">
            {{ subscription.nextBillingDate }}
          </p>
          <button
            type="button"
            class="mt-6 w-full rounded-xl border border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
          >
            Manage Plan
          </button>
        </section>

        <section class="section-card">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h3 class="text-xl font-semibold text-[var(--color-text)]">
              Token Usage
            </h3>
            <span class="text-sm font-semibold text-[var(--color-text-soft)]">{{ tokenUsage.usedPercentage }}%</span>
          </div>
          <p class="text-3xl font-semibold text-[var(--color-text)]">
            {{ tokenUsage.balance.toLocaleString() }} <span class="text-base text-muted">/ {{ tokenUsage.limit.toLocaleString() }} tokens</span>
          </p>
          <div class="mt-4 h-2 rounded-full bg-[var(--color-bg-soft)]">
            <div
              class="h-full rounded-full bg-[var(--color-primary)]"
              :style="{ width: `${tokenUsage.usedPercentage}%` }"
            />
          </div>
          <p class="mt-3 text-sm text-muted">
            Resets on {{ tokenUsage.resetDate }}
          </p>
          <NuxtLink
            to="/settings/billing"
            class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]"
          >
            Buy more tokens
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4"
            />
          </NuxtLink>
        </section>

        <section class="section-card">
          <h3 class="mb-4 text-xl font-semibold text-[var(--color-text)]">
            Quick Actions
          </h3>
          <div class="space-y-3">
            <NuxtLink
              v-for="action in quickActions"
              :key="action.id"
              :to="action.to"
              class="flex items-center justify-between rounded-2xl border border-[var(--color-border)] px-4 py-3 transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]/40"
            >
              <div class="flex items-center gap-3">
                <div class="icon-box icon-box-primary">
                  <UIcon
                    :name="action.icon"
                    class="size-4"
                  />
                </div>
                <span class="text-sm font-medium text-[var(--color-text)]">{{ action.label }}</span>
              </div>
              <UIcon
                name="i-lucide-chevron-right"
                class="size-4 text-[var(--color-text-muted)]"
              />
            </NuxtLink>
          </div>
        </section>

        <section class="section-card">
          <h3 class="mb-4 text-xl font-semibold text-[var(--color-text)]">
            AI Preferences
          </h3>
          <div class="space-y-3">
            <div
              v-for="item in aiPreferences"
              :key="item.id"
              class="flex items-center justify-between rounded-2xl border border-[var(--color-border)] px-4 py-3"
            >
              <div class="flex items-center gap-3">
                <div class="icon-box icon-box-ai">
                  <UIcon
                    :name="item.icon"
                    class="size-4"
                  />
                </div>
                <span class="text-sm font-medium text-[var(--color-text)]">{{ item.label }}</span>
              </div>
              <span class="text-sm font-semibold text-[var(--color-text-soft)]">{{ item.value }}</span>
            </div>
          </div>
          <NuxtLink
            to="/settings/study-preferences"
            class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
          >
            <UIcon
              name="i-lucide-sliders-horizontal"
              class="size-4"
            />
            Customize Preferences
          </NuxtLink>
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
</style>
