<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { ChangePasswordPayload } from '~/types/settings'

definePageMeta({ layout: 'dashboard' })

const settingsStore = useSettingsStore()
const { security, sessions, loginHistory, trustedDevices, recoveryMethods, additionalSecurity, securityTips, loading, error, usingMockData } = storeToRefs(settingsStore)
const feedback = ref<{ tone: 'success' | 'warning' | 'error' | 'info', text: string } | null>(null)

const passwordForm = reactive<ChangePasswordPayload>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const showPassword = reactive({
  current: false,
  next: false,
  confirm: false
})

onMounted(async () => {
  await settingsStore.fetchSecurityData()
})

async function submitPassword() {
  const saved = await settingsStore.changePassword({ ...passwordForm })

  feedback.value = {
    tone: saved ? 'success' : 'error',
    text: saved ? 'Your new password has been applied.' : (error.value || 'Please review the form and try again.')
  }

  if (saved) {
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  }
}

async function toggleTwoFactor(enabled: boolean) {
  const saved = await settingsStore.toggleTwoFactor(enabled)

  feedback.value = {
    tone: saved ? 'success' : 'warning',
    text: saved ? `Two-factor authentication ${enabled ? 'enabled' : 'disabled'}.` : (error.value || 'Backend unavailable. Local state updated.')
  }
}

async function revokeSession(id: string) {
  await settingsStore.revokeSession(id)
  feedback.value = {
    tone: 'info',
    text: 'The selected session has been signed out.'
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
        name="i-lucide-shield-alert"
        class="size-4 text-[var(--color-primary)]"
      />
      <span>{{ error || 'Backend unavailable. Showing mock security data.' }}</span>
    </div>

    <div
      v-if="feedback"
      class="rounded-2xl px-4 py-3 text-sm font-medium"
      :class="feedback.tone === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : feedback.tone === 'error' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : feedback.tone === 'warning' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'"
    >
      {{ feedback.text }}
    </div>

    <div
      v-if="loading"
      class="grid gap-6 xl:grid-cols-[1fr_360px]"
    >
      <div class="grid gap-6 lg:grid-cols-2">
        <div
          v-for="item in 6"
          :key="item"
          class="h-72 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]"
        />
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
      class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
    >
      <div class="space-y-6">
        <div class="grid gap-6 lg:grid-cols-2">
          <SettingsSectionCard
            title="Change Password"
            description="Update your password regularly to keep your account secure."
          >
            <div class="space-y-4">
              <SettingsField label="Current Password">
                <div class="field-wrap">
                  <input
                    v-model="passwordForm.currentPassword"
                    :type="showPassword.current ? 'text' : 'password'"
                    class="field-control field-control--with-icon"
                    placeholder="Enter current password"
                  >
                  <button
                    type="button"
                    class="field-icon"
                    @click="showPassword.current = !showPassword.current"
                  >
                    <UIcon
                      :name="showPassword.current ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                      class="size-4"
                    />
                  </button>
                </div>
              </SettingsField>

              <SettingsField label="New Password">
                <div class="field-wrap">
                  <input
                    v-model="passwordForm.newPassword"
                    :type="showPassword.next ? 'text' : 'password'"
                    class="field-control field-control--with-icon"
                    placeholder="Enter new password"
                  >
                  <button
                    type="button"
                    class="field-icon"
                    @click="showPassword.next = !showPassword.next"
                  >
                    <UIcon
                      :name="showPassword.next ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                      class="size-4"
                    />
                  </button>
                </div>
              </SettingsField>

              <SettingsField label="Confirm New Password">
                <div class="field-wrap">
                  <input
                    v-model="passwordForm.confirmPassword"
                    :type="showPassword.confirm ? 'text' : 'password'"
                    class="field-control field-control--with-icon"
                    placeholder="Confirm new password"
                  >
                  <button
                    type="button"
                    class="field-icon"
                    @click="showPassword.confirm = !showPassword.confirm"
                  >
                    <UIcon
                      :name="showPassword.confirm ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                      class="size-4"
                    />
                  </button>
                </div>
              </SettingsField>
            </div>

            <div class="mt-6 flex justify-end">
              <button
                type="button"
                class="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
                @click="submitPassword"
              >
                Update Password
              </button>
            </div>
          </SettingsSectionCard>

          <SettingsSectionCard
            title="Two-Factor Authentication"
            description="Add an extra layer of security to your account."
          >
            <div class="mb-5 flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-[var(--color-text-soft)]">Status</span>
                <span :class="['status-badge', security.twoFactorEnabled ? 'status-success' : 'status-neutral']">
                  {{ security.twoFactorEnabled ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
              <button
                type="button"
                class="relative inline-flex h-7 w-12 rounded-full transition"
                :class="security.twoFactorEnabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'"
                @click="toggleTwoFactor(!security.twoFactorEnabled)"
              >
                <span
                  class="absolute top-1 size-5 rounded-full bg-white transition"
                  :class="security.twoFactorEnabled ? 'left-6' : 'left-1'"
                />
              </button>
            </div>

            <div class="space-y-4">
              <div class="rounded-2xl border border-[var(--color-border)] p-4">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <div class="icon-box icon-box-primary">
                      <UIcon
                        name="i-lucide-smartphone"
                        class="size-4"
                      />
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-[var(--color-text)]">
                        {{ security.twoFactorMethod }}
                      </p>
                      <p class="mt-1 text-sm text-muted">
                        Using Google Authenticator
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="rounded-xl border border-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-[var(--color-primary)]"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div class="rounded-2xl border border-[var(--color-border)] p-4">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold text-[var(--color-text)]">
                      Backup Codes
                    </p>
                    <p class="mt-1 text-sm text-muted">
                      Use backup codes to access your account if you lose your device.
                    </p>
                  </div>
                  <button
                    type="button"
                    class="rounded-xl border border-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-[var(--color-primary)]"
                  >
                    View Codes
                  </button>
                </div>
              </div>
            </div>
          </SettingsSectionCard>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <SettingsSectionCard
            title="Active Sessions"
            description="These are devices and locations where you're currently signed in."
          >
            <template #header>
              <button
                type="button"
                class="text-sm font-semibold text-[var(--color-danger)]"
                @click="settingsStore.signOutAllSessions()"
              >
                Sign out all
              </button>
            </template>

            <div class="space-y-3">
              <div
                v-for="session in sessions"
                :key="session.id"
                class="rounded-2xl border border-[var(--color-border)] p-4"
              >
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div class="flex items-start gap-3">
                    <div class="icon-box icon-box-primary">
                      <UIcon
                        :name="session.device.toLowerCase().includes('iphone') ? 'i-lucide-smartphone' : 'i-lucide-monitor'"
                        class="size-4"
                      />
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <p class="text-sm font-semibold text-[var(--color-text)]">
                          {{ session.device }} - {{ session.browser }}
                        </p>
                        <span
                          v-if="session.current"
                          class="status-badge status-info"
                        >Current Session</span>
                      </div>
                      <p class="mt-1 text-sm text-muted">
                        {{ session.location }} | IP: {{ session.ipAddress }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-sm text-muted">{{ session.lastSeen }}</span>
                    <button
                      v-if="!session.current"
                      type="button"
                      class="text-sm font-semibold text-[var(--color-danger)]"
                      @click="revokeSession(session.id)"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </SettingsSectionCard>

          <SettingsSectionCard
            title="Login History"
            description="Review your recent account activity."
          >
            <template #header>
              <button
                type="button"
                class="text-sm font-semibold text-[var(--color-primary)]"
              >
                View all
              </button>
            </template>

            <div class="space-y-3">
              <div
                v-for="entry in loginHistory"
                :key="entry.id"
                class="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] px-4 py-4"
              >
                <div>
                  <p class="text-sm font-semibold text-[var(--color-text)]">
                    {{ entry.timeLabel }}
                  </p>
                  <p class="mt-1 text-sm text-muted">
                    {{ entry.location }}
                  </p>
                </div>
                <span :class="['status-badge', entry.status === 'Success' ? 'status-success' : 'status-warning']">{{ entry.status }}</span>
              </div>
            </div>
          </SettingsSectionCard>
        </div>

        <div class="grid gap-6 lg:grid-cols-3">
          <SettingsSectionCard
            title="Trusted Devices"
            description="Devices you trust and do not want to verify on every login."
          >
            <template #header>
              <button
                type="button"
                class="text-sm font-semibold text-[var(--color-primary)]"
              >
                Manage
              </button>
            </template>
            <div class="space-y-3">
              <div
                v-for="device in trustedDevices"
                :key="device.id"
                class="rounded-2xl border border-[var(--color-border)] px-4 py-4"
              >
                <div class="flex items-center gap-3">
                  <div class="icon-box icon-box-info">
                    <UIcon
                      :name="device.icon"
                      class="size-4"
                    />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-[var(--color-text)]">
                      {{ device.name }}
                    </p>
                    <p class="mt-1 text-sm text-muted">
                      {{ device.addedOn }}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                class="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]"
              >
                <UIcon
                  name="i-lucide-plus"
                  class="size-4"
                />
                Add Trusted Device
              </button>
            </div>
          </SettingsSectionCard>

          <SettingsSectionCard
            title="Account Recovery"
            description="Manage your recovery options."
          >
            <div class="space-y-3">
              <div
                v-for="method in recoveryMethods"
                :key="method.id"
                class="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] px-4 py-4"
              >
                <div class="flex items-center gap-3">
                  <div class="icon-box icon-box-success">
                    <UIcon
                      :name="method.icon"
                      class="size-4"
                    />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-[var(--color-text)]">
                      {{ method.label }}
                    </p>
                    <p class="mt-1 text-sm text-muted">
                      {{ method.value }}
                    </p>
                  </div>
                </div>
                <span class="status-badge status-success">{{ method.status }}</span>
              </div>
            </div>
          </SettingsSectionCard>

          <SettingsSectionCard
            title="Additional Security"
            description="Extra protection for your account."
          >
            <div class="space-y-3">
              <div
                v-for="item in additionalSecurity"
                :key="item.id"
                class="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] px-4 py-4"
              >
                <div>
                  <p class="text-sm font-semibold text-[var(--color-text)]">
                    {{ item.label }}
                  </p>
                  <p class="mt-1 text-sm text-muted">
                    {{ item.description }}
                  </p>
                </div>
                <button
                  v-if="item.type === 'toggle'"
                  type="button"
                  class="relative inline-flex h-7 w-12 rounded-full transition"
                  :class="item.enabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'"
                  @click="item.enabled = !item.enabled"
                >
                  <span
                    class="absolute top-1 size-5 rounded-full bg-white transition"
                    :class="item.enabled ? 'left-6' : 'left-1'"
                  />
                </button>
                <UIcon
                  v-else
                  name="i-lucide-chevron-right"
                  class="size-4 text-[var(--color-text-muted)]"
                />
              </div>
            </div>
          </SettingsSectionCard>
        </div>
      </div>

      <div class="space-y-6">
        <section class="section-card">
          <h3 class="mb-6 text-2xl font-semibold text-[var(--color-text)]">
            Security Score
          </h3>
          <div class="flex flex-col items-center gap-5 border-b border-[var(--color-border)] pb-6 text-center">
            <div
              class="flex size-36 items-center justify-center rounded-full border-[10px] border-[var(--color-primary-soft)] text-center"
              :style="{ borderTopColor: 'var(--color-primary)', borderRightColor: 'var(--color-primary)' }"
            >
              <div>
                <p class="text-5xl font-semibold text-[var(--color-text)]">
                  {{ security.score }}
                </p>
                <p class="text-sm text-muted">
                  /100
                </p>
              </div>
            </div>
            <div>
              <p class="text-2xl font-semibold text-[var(--color-text)]">
                Great job!
              </p>
              <p class="mt-2 text-sm text-muted">
                Your account is well protected. Follow the recommendations below to make it even stronger.
              </p>
            </div>
          </div>

          <div class="mt-6 space-y-3">
            <div
              v-for="check in security.checks"
              :key="check.id"
              class="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] px-4 py-3"
            >
              <div class="flex items-center gap-3">
                <div class="icon-box icon-box-success">
                  <UIcon
                    name="i-lucide-check"
                    class="size-4"
                  />
                </div>
                <span class="text-sm font-medium text-[var(--color-text)]">{{ check.label }}</span>
              </div>
              <span class="text-sm text-[var(--color-text-soft)]">{{ check.status }}</span>
            </div>
          </div>

          <button
            type="button"
            class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]"
          >
            View full security check
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4"
            />
          </button>
        </section>

        <section class="section-card">
          <h3 class="mb-4 text-2xl font-semibold text-[var(--color-text)]">
            Security Tips
          </h3>
          <div class="space-y-4">
            <div
              v-for="tip in securityTips"
              :key="tip.id"
              class="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] px-4 py-4"
            >
              <div class="icon-box icon-box-primary">
                <UIcon
                  :name="tip.icon"
                  class="size-4"
                />
              </div>
              <div>
                <p class="text-sm font-semibold text-[var(--color-text)]">
                  {{ tip.title }}
                </p>
                <p class="mt-1 text-sm text-muted">
                  {{ tip.description }}
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]"
          >
            Learn more about account security
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
.field-wrap {
  position: relative;
}

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

.field-control--with-icon {
  padding-right: 3rem;
}

.field-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-soft);
}

.field-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
}
</style>
