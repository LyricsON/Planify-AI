<script setup lang="ts">
import { storeToRefs } from 'pinia'
definePageMeta({ layout: 'dashboard' })

const profileStore = useProfileStore()
const { user, profile, stats, goals, achievements, recentActivity, subscription, tokenUsage, aiPreferences, quickActions, loading, error } = storeToRefs(profileStore)

const router = useRouter()

const feedback = ref<{ tone: 'success' | 'warning' | 'info', text: string } | null>(null)

onMounted(async () => {
  await profileStore.fetchProfile()
})

function goToPersonalInfo() {
  router.push('/settings/personal-info')
}

function toLocalDateLabel(value?: string) {
  if (!value) return 'Not available'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'Not available'
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
}

function managePlan() {
  router.push('/settings/billing')
}
</script>

<template>
  <section class="mx-auto max-w-[1440px] space-y-5 pb-10">
    <SettingsTabs />

    <div
      v-if="feedback"
      class="rounded-2xl px-4 py-3 text-sm font-medium"
      :class="feedback.tone === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : feedback.tone === 'warning' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'"
    >
      {{ feedback.text }}
    </div>

    <div
      v-if="error"
      class="glass-card rounded-2xl px-4 py-3 text-sm text-[var(--color-text-soft)]"
    >
      {{ error }}
    </div>

    <div
      v-if="loading"
      class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div class="space-y-5">
        <div class="h-64 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]" />
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="item in 4"
            :key="item"
            class="h-32 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]"
          />
        </div>
      </div>
      <div class="space-y-5">
        <div
          v-for="item in 4"
          :key="item"
          class="h-44 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]"
        />
      </div>
    </div>

    <div
      v-else-if="user && profile && subscription && tokenUsage"
      class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div class="space-y-5">
        <ProfileHeaderCard
          :user="user"
          :profile="profile"
          :subscription="subscription"
          @edit="goToPersonalInfo"
        />

        <ProfileStatsGrid :stats="stats" />

        <div class="grid gap-5 lg:grid-cols-2">
          <ProfileAboutCard :profile="profile" />

          <section class="section-card">
            <div class="mb-4 flex items-center gap-3">
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
                <span class="font-semibold text-[var(--color-text)]">{{ profile.academic.university || 'Not added yet' }}</span>
              </div>
              <div class="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
                <span class="text-muted">Program</span>
                <span class="font-semibold text-[var(--color-text)]">{{ profile.academic.fieldOfStudy || 'Not added yet' }}</span>
              </div>
              <div class="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
                <span class="text-muted">Year</span>
                <span class="font-semibold text-[var(--color-text)]">{{ profile.academic.academicYear || 'Not added yet' }}</span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="text-muted">GPA</span>
                <span class="font-semibold text-[var(--color-text)]">{{ profile.academic.gpa || 'Not added yet' }}</span>
              </div>
            </div>
          </section>
        </div>

        <div class="grid gap-5 lg:grid-cols-2">
          <ProfileGoalsCard :goals="goals" />
          <ProfileAchievementsCard :achievements="achievements" />
        </div>

        <ProfileActivityCard :activity="recentActivity" />
      </div>

      <div class="space-y-5">
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
            {{ toLocalDateLabel(subscription.nextBillingDate) }}
          </p>
          <button
            type="button"
            class="mt-5 w-full rounded-xl border border-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
            @click="managePlan"
          >
            Manage Plan
          </button>
        </section>

        <section class="section-card">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h3 class="text-xl font-semibold text-[var(--color-text)]">
              Token Usage
            </h3>
            <span
              v-if="typeof tokenUsage.usedPercentage === 'number'"
              class="text-sm font-semibold text-[var(--color-text-soft)]"
            >{{ tokenUsage.usedPercentage }}%</span>
          </div>
          <p class="text-3xl font-semibold text-[var(--color-text)]">
            {{ tokenUsage.balance.toLocaleString() }}
            <span
              v-if="tokenUsage.limit"
              class="text-base text-muted"
            >/ {{ tokenUsage.limit.toLocaleString() }} tokens</span>
            <span
              v-else
              class="text-base text-muted"
            >tokens available</span>
          </p>

          <div
            v-if="tokenUsage.limit && typeof tokenUsage.usedPercentage === 'number'"
            class="mt-4 h-2 rounded-full bg-[var(--color-bg-soft)]"
          >
            <div
              class="h-full rounded-full bg-[var(--color-primary)]"
              :style="{ width: `${tokenUsage.usedPercentage}%` }"
            />
          </div>

          <p
            v-if="tokenUsage.resetDate"
            class="mt-3 text-sm text-muted"
          >
            Resets on {{ toLocalDateLabel(tokenUsage.resetDate) }}
          </p>
        </section>

        <section class="section-card">
          <h3 class="mb-4 text-xl font-semibold text-[var(--color-text)]">
            Quick Actions
          </h3>
          <div class="space-y-2.5">
            <NuxtLink
              v-for="action in quickActions"
              :key="action.id"
              :to="action.to"
              class="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-3.5 py-3 transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]/40"
            >
              <div class="flex items-center gap-3">
                <div class="icon-box icon-box-primary !size-8">
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
          <div class="space-y-2.5">
            <div
              v-for="item in aiPreferences"
              :key="item.id"
              class="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-3.5 py-3"
            >
              <div class="flex items-center gap-3">
                <div class="icon-box icon-box-ai !size-8">
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
            class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
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

    <section
      v-else
      class="section-card"
    >
      <h3 class="text-lg font-semibold text-[var(--color-text)]">
        Unable to load profile
      </h3>
      <p class="mt-2 text-sm text-muted">
        Please refresh this page or sign in again.
      </p>
    </section>
  </section>
</template>
