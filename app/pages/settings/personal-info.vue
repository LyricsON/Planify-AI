<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { ProfilePayload } from '~/types/profile'

definePageMeta({ layout: 'dashboard' })

const profileStore = useProfileStore()
const billingStore = useBillingStore()

const { user, profile, loading, error } = storeToRefs(profileStore)
const { subscription, tokenBalance, paymentHistory } = storeToRefs(billingStore)

const feedback = ref<{ tone: 'success' | 'warning', text: string } | null>(null)
const saving = ref(false)

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

const avatarInput = ref<HTMLInputElement | null>(null)

function syncForm() {
  if (!user.value || !profile.value) return
  form.name = user.value.name || ''
  form.email = user.value.email || ''
  form.phone = user.value.phone || ''
  form.location = user.value.location || ''
  form.bio = profile.value.bio || ''
  form.university = profile.value.academic.university || ''
  form.fieldOfStudy = profile.value.academic.fieldOfStudy || ''
  form.academicYear = profile.value.academic.academicYear || ''
  form.studentId = profile.value.academic.studentId || ''
}

watch([user, profile], syncForm, { immediate: true })

onMounted(async () => {
  await Promise.all([
    profileStore.fetchProfile(),
    billingStore.fetchBilling()
  ])
})

function openAvatarPicker() {
  avatarInput.value?.click()
}

async function onAvatarSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  await profileStore.updateAvatar(file)
  feedback.value = {
    tone: 'success',
    text: 'Profile photo updated.'
  }
}

async function savePersonalInfo() {
  saving.value = true
  const ok = await profileStore.updateProfile({ ...form })
  feedback.value = {
    tone: ok ? 'success' : 'warning',
    text: ok ? 'Your profile changes have been stored.' : (error.value || 'Unable to save profile changes.')
  }
  saving.value = false
}

function formatDate(value?: string) {
  if (!value) return 'Not available'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'Not available'
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <section class="mx-auto max-w-[1440px] space-y-6 pb-10">
    <SettingsTabs />

    <div
      v-if="feedback"
      class="rounded-2xl px-4 py-3 text-sm font-medium"
      :class="feedback.tone === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'"
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

    <div
      v-else-if="user && profile"
      class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]"
    >
      <div class="space-y-6">
        <SettingsSectionCard
          title="Personal Information"
          description="Update your personal details and academic information."
        >
          <div class="grid gap-4 md:grid-cols-[128px_minmax(0,1fr)]">
            <div class="space-y-3">
              <div class="relative">
                <AppAvatar
                  :src="user.avatar"
                  :name="user.name"
                  size="xl"
                  class="ring-4 ring-[var(--color-primary-soft)]"
                />
                <button
                  type="button"
                  class="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm"
                  @click="openAvatarPicker"
                >
                  <UIcon name="i-lucide-camera" class="size-4" />
                </button>
              </div>
              <input
                ref="avatarInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="onAvatarSelected"
              >
              <p class="text-xs text-muted">
                JPG, PNG up to 2MB
              </p>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <SettingsField label="Full Name">
                <input v-model="form.name" class="field-control" type="text" placeholder="Full name">
              </SettingsField>

              <SettingsField label="Email Address">
                <input v-model="form.email" class="field-control" type="email" placeholder="Email address">
              </SettingsField>

              <div class="sm:col-span-2">
                <SettingsField label="Phone Number">
                  <input v-model="form.phone" class="field-control" type="text" placeholder="Phone number">
                </SettingsField>
              </div>

              <SettingsField label="University">
                <input v-model="form.university" class="field-control" type="text" placeholder="University">
              </SettingsField>

              <SettingsField label="Field of Study">
                <input v-model="form.fieldOfStudy" class="field-control" type="text" placeholder="Field of study">
              </SettingsField>

              <SettingsField label="Academic Year">
                <input v-model="form.academicYear" class="field-control" type="text" placeholder="Academic year">
              </SettingsField>

              <SettingsField label="Student ID (Optional)">
                <input v-model="form.studentId" class="field-control" type="text" placeholder="Student ID">
              </SettingsField>

              <div class="sm:col-span-2">
                <SettingsField label="Bio">
                  <textarea v-model="form.bio" class="field-control min-h-28 resize-none py-3" placeholder="Add a short bio" />
                </SettingsField>
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <button
              type="button"
              class="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="saving"
              @click="savePersonalInfo"
            >
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Study Preferences"
          description="Quick access to your study preference settings."
        >
          <NuxtLink
            to="/settings/study-preferences"
            class="inline-flex items-center gap-2 rounded-xl border border-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
          >
            <UIcon name="i-lucide-sliders-horizontal" class="size-4" />
            Open Study Preferences
          </NuxtLink>
        </SettingsSectionCard>
      </div>

      <div class="space-y-6">
        <section class="section-card">
          <h3 class="text-xl font-semibold text-[var(--color-text)]">
            Billing & Subscription
          </h3>
          <p class="mt-1 text-sm text-muted">
            Manage your plan, tokens, and payment details.
          </p>

          <div class="mt-5 rounded-2xl border border-[var(--color-border)] p-4">
            <span class="status-badge status-info">Current Plan</span>
            <p class="mt-3 text-2xl font-semibold text-[var(--color-text)]">
              {{ subscription?.name || 'Free Plan' }}
            </p>
            <p
              v-if="subscription?.name && !subscription.name.toLowerCase().includes('free') && subscription.nextBillingDate"
              class="mt-1 text-sm text-muted"
            >
              Next billing date: {{ formatDate(subscription?.nextBillingDate) }}
            </p>
            <NuxtLink
              to="/settings/billing"
              class="mt-4 inline-flex rounded-xl border border-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
            >
              Manage Plan
            </NuxtLink>
          </div>

          <div class="mt-4 rounded-2xl border border-[var(--color-border)] p-4">
            <p class="text-sm text-muted">
              Your Tokens
            </p>
            <p class="mt-1 text-3xl font-semibold text-[var(--color-text)]">
              {{ tokenBalance?.balance?.toLocaleString?.() || '0' }}
            </p>
            <p
              v-if="tokenBalance?.limit"
              class="mt-1 text-sm text-muted"
            >
              {{ tokenBalance.used?.toLocaleString?.() || 0 }} / {{ tokenBalance.limit.toLocaleString() }} used
            </p>
          </div>
        </section>

        <section class="section-card">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-xl font-semibold text-[var(--color-text)]">
              Recent Payments
            </h3>
            <NuxtLink to="/settings/billing" class="text-sm font-semibold text-[var(--color-primary)]">
              View all
            </NuxtLink>
          </div>
          <div class="space-y-3">
            <div
              v-for="payment in paymentHistory.slice(0, 4)"
              :key="payment.id"
              class="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-3 py-2.5"
            >
              <div>
                <p class="text-sm font-semibold text-[var(--color-text)]">
                  {{ payment.description }}
                </p>
                <p class="text-xs text-muted">
                  {{ payment.date }}
                </p>
              </div>
              <p class="text-sm font-semibold text-[var(--color-text)]">
                {{ payment.amount }}
              </p>
            </div>
            <p
              v-if="!paymentHistory.length"
              class="text-sm text-muted"
            >
              No payment records yet.
            </p>
          </div>
        </section>
      </div>
    </div>

    <section
      v-else
      class="section-card"
    >
      <h3 class="text-lg font-semibold text-[var(--color-text)]">Unable to load personal info</h3>
      <p class="mt-2 text-sm text-muted">Please refresh this page or sign in again.</p>
    </section>
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
