<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { StudyGoal } from '~/types/profile'
definePageMeta({ layout: 'dashboard' })

const profileStore = useProfileStore()
const { user, profile, stats, goals, achievements, recentActivity, subscription, tokenUsage, aiPreferences, quickActions, loading, error } = storeToRefs(profileStore)

const router = useRouter()

const feedback = ref<{ tone: 'success' | 'warning' | 'info', text: string } | null>(null)

/** Controls Edit Profile modal + breadcrumb */
const isEditModalOpen = ref(false)

/** Controls Add/Edit Goal modal */
const isGoalModalOpen = ref(false)
const activeGoal = ref<StudyGoal | null>(null)

let relativeTimeTimer: any = null

onMounted(async () => {
  await profileStore.fetchProfile()
  relativeTimeTimer = setInterval(() => {
    profileStore.updateRelativeTimes()
  }, 60000)
})

onBeforeUnmount(() => {
  if (relativeTimeTimer) {
    clearInterval(relativeTimeTimer)
  }
})

function openEditModal() {
  isEditModalOpen.value = true
}

function closeEditModal() {
  isEditModalOpen.value = false
}

async function onProfileSaved() {
  isEditModalOpen.value = false
  // Re-fetch everything so avatar, stats, completion, and sidebar all update
  await profileStore.fetchProfile()
  feedback.value = { tone: 'success', text: 'Your profile has been updated.' }
}

function openAddGoalModal() {
  activeGoal.value = null
  isGoalModalOpen.value = true
}

function openEditGoalModal(goal: StudyGoal) {
  activeGoal.value = goal
  isGoalModalOpen.value = true
}

async function handleDeleteGoal(id: string) {
  if (confirm('Are you sure you want to delete this study goal?')) {
    const res = await profileStore.deleteStudyGoal(id)
    if (res.success) {
      feedback.value = { tone: 'success', text: 'Study goal deleted successfully.' }
    } else {
      feedback.value = { tone: 'warning', text: res.error || 'Failed to delete study goal.' }
    }
  }
}

async function onGoalSaved() {
  isGoalModalOpen.value = false
  activeGoal.value = null
  feedback.value = { tone: 'success', text: 'Study goal saved successfully.' }
}

function handleChecklistClick(id: string) {
  if (id === 'picture' || id === 'bio' || id === 'academic') {
    openEditModal()
  } else if (id === 'goals') {
    const el = document.getElementById('profile-goals-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
      el.classList.add('ring-2', 'ring-[var(--color-primary)]')
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-[var(--color-primary)]')
      }, 2000)
    }
  } else if (id === 'calendar') {
    router.push('/settings/study-preferences')
  }
}

function handleQuickAction(action: { id: string; to?: string; action?: string }) {
  if (action.action === 'edit-profile') {
    openEditModal()
  } else if (action.action === 'download-data') {
    profileStore.downloadData()
  } else if (action.to) {
    router.push(action.to)
  }
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

    <!-- Breadcrumb — minimal, premium, reactive -->
    <nav
      aria-label="Profile breadcrumb"
      class="flex items-center gap-1.5 px-0.5 text-sm"
    >
      <span class="font-medium text-[var(--color-text-muted)]">Profile</span>
      <template v-if="isEditModalOpen">
        <UIcon
          name="i-lucide-chevron-right"
          class="size-3.5 shrink-0 text-[var(--color-text-muted)]"
        />
        <span class="font-semibold text-[var(--color-primary)]">Edit Profile</span>
      </template>
    </nav>

    <!-- Success / info feedback banner -->
    <div
      v-if="feedback"
      class="rounded-2xl px-4 py-3 text-sm font-medium"
      :class="feedback.tone === 'success'
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
        : feedback.tone === 'warning'
          ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
          : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'"
    >
      {{ feedback.text }}
    </div>



    <!-- Loading Spinner -->
    <div
      v-if="loading || (!user && !error)"
      class="flex items-center justify-center py-20"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-indigo-600"
      />
    </div>

    <!-- Main content (loaded) -->
    <div
      v-else-if="user && profile && subscription && tokenUsage"
      class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"
    >
      <!-- ─── Left Column ─── -->
      <div class="space-y-5">
        <!-- Profile Hero -->
        <ProfileHeaderCard
          :user="user"
          :profile="profile"
          :subscription="subscription"
          @edit="openEditModal"
          @click-checklist="handleChecklistClick"
        />

        <!-- Stats Grid -->
        <ProfileStatsGrid :stats="stats" />

        <div class="grid gap-5 lg:grid-cols-2">
          <!-- About Me -->
          <ProfileAboutCard :profile="profile" />

          <!-- Academic Information -->
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
              <div
                v-if="profile.academic.semester"
                class="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3"
              >
                <span class="text-muted">Semester</span>
                <span class="font-semibold text-[var(--color-text)]">{{ profile.academic.semester }}</span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="text-muted">GPA</span>
                <span class="font-semibold text-[var(--color-text)]">{{ profile.academic.gpa || 'Not added yet' }}</span>
              </div>
            </div>
          </section>
        </div>

        <div class="grid gap-5 lg:grid-cols-2">
          <ProfileGoalsCard
            :goals="goals"
            id="profile-goals-section"
            class="transition-all duration-300"
            @add-goal="openAddGoalModal"
            @edit-goal="openEditGoalModal"
            @delete-goal="handleDeleteGoal"
          />
          <ProfileAchievementsCard :achievements="achievements" />
        </div>

        <ProfileActivityCard :activity="recentActivity" />
      </div>

      <!-- ─── Right Column ─── -->
      <div class="space-y-5">
        <!-- Subscription Card -->
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
          <template v-if="subscription.name && !subscription.name.toLowerCase().includes('free') && subscription.nextBillingDate">
            <p class="mt-3 text-sm text-muted">
              Next billing date
            </p>
            <p class="mt-1 text-sm font-semibold text-[var(--color-text)]">
              {{ toLocalDateLabel(subscription.nextBillingDate) }}
            </p>
          </template>
          <button
            type="button"
            class="mt-5 w-full rounded-xl border border-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
            @click="managePlan"
          >
            Manage Plan
          </button>
        </section>

        <!-- Token Usage -->
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

        <!-- Quick Actions -->
        <section class="section-card">
          <h3 class="mb-4 text-xl font-semibold text-[var(--color-text)]">
            Quick Actions
          </h3>
          <div class="space-y-2.5">
            <component
              :is="action.to ? 'NuxtLink' : 'button'"
              v-for="action in quickActions"
              :key="action.id"
              :to="action.to"
              type="button"
              class="flex w-full items-center justify-between rounded-xl border border-[var(--color-border)] px-3.5 py-3 transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]/40"
              @click="action.action ? handleQuickAction(action) : undefined"
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
            </component>
          </div>
        </section>

        <!-- AI Preferences -->
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

    <!-- Empty / error state -->
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

    <!-- Edit Profile Modal (rendered outside grid so it overlays correctly) -->
    <ProfileEditModal
      v-if="isEditModalOpen"
      @close="closeEditModal"
      @saved="onProfileSaved"
    />

    <!-- Add/Edit Goal Modal -->
    <ProfileGoalModal
      v-if="isGoalModalOpen"
      :goal="activeGoal"
      @close="isGoalModalOpen = false"
      @saved="onGoalSaved"
    />
  </section>
</template>
