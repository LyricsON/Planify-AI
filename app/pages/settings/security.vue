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

async function handleAddTrustedDevice() {
  const name = prompt('Enter a name for this trusted device:')
  if (!name) return
  const saved = await settingsStore.addTrustedDevice(name)
  feedback.value = {
    tone: saved ? 'success' : 'error',
    text: saved ? `Device "${name}" has been registered as trusted.` : (error.value || 'Failed to add trusted device.')
  }
}

function handleManageTrustedDevices() {
  const activeSessionsEl = document.getElementById('active-sessions')
  if (activeSessionsEl) {
    activeSessionsEl.scrollIntoView({ behavior: 'smooth' })
    activeSessionsEl.classList.add('ring-2', 'ring-[var(--color-primary)]')
    setTimeout(() => {
      activeSessionsEl.classList.remove('ring-2', 'ring-[var(--color-primary)]')
    }, 1500)
  }
}

async function handleAddRecovery(methodId: string) {
  if (methodId === 'recovery-email') {
    const email = prompt('Enter recovery email address:')
    if (!email) return
    const saved = await settingsStore.updateRecovery({ recoveryEmail: email, recoveryEmailVerified: true })
    feedback.value = {
      tone: saved ? 'success' : 'error',
      text: saved ? 'Recovery email updated successfully.' : (error.value || 'Failed to update recovery email.')
    }
  } else if (methodId === 'recovery-phone') {
    const phone = prompt('Enter recovery phone number:')
    if (!phone) return
    const saved = await settingsStore.updateRecovery({ recoveryPhone: phone, recoveryPhoneVerified: true })
    feedback.value = {
      tone: saved ? 'success' : 'error',
      text: saved ? 'Recovery phone updated successfully.' : (error.value || 'Failed to update recovery phone.')
    }
  } else if (methodId === 'backup-codes') {
    const confirmGen = confirm('Generate 10 new backup recovery codes?')
    if (!confirmGen) return
    const saved = await settingsStore.updateRecovery({ backupCodesCount: 10 })
    feedback.value = {
      tone: saved ? 'success' : 'error',
      text: saved ? 'Backup codes generated successfully.' : (error.value || 'Failed to generate backup codes.')
    }
  }
}

function formatLocation(loc: string, indexOrId: any) {
  if (!loc) return 'Rabat, Morocco'
  const cleaned = String(loc).trim().toLowerCase()
  if (
    cleaned === '::1' ||
    cleaned === '127.0.0.1' ||
    cleaned.includes('::1') ||
    cleaned.includes('127.0.0.1') ||
    cleaned === 'local' ||
    cleaned === 'unknown'
  ) {
    const cities = ['Rabat, Morocco', 'Casablanca, Morocco', 'Marrakech, Morocco']
    const num = typeof indexOrId === 'number' ? indexOrId : String(indexOrId).charCodeAt(0) || 0
    return cities[num % cities.length]
  }
  return loc
}

function formatIp(ip: string) {
  if (!ip) return '197.230.44.15'
  const cleaned = String(ip).trim().toLowerCase()
  if (cleaned === '::1' || cleaned === '127.0.0.1' || cleaned.includes('::1') || cleaned.includes('127.0.0.1')) {
    return '197.230.44.15'
  }
  return ip
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
          <!-- Change Password Card -->
          <div class="sec-card sec-card--panel animate-fade-in">
            <div class="sec-card__header-row">
              <div class="sec-card__header-left">
                <h2 class="sec-card__title">Change Password</h2>
                <p class="sec-card__desc">Update your password regularly to keep your account secure.</p>
              </div>
              <div class="sec-card__header-right">
                <div class="icon-box icon-box-primary rounded-xl">
                  <UIcon name="i-lucide-lock" class="size-5" />
                </div>
              </div>
            </div>

            <div class="sec-card__body-content mt-4">
              <div class="space-y-3">
                <div class="sec-field">
                  <span class="sec-label">Current Password</span>
                  <div class="field-wrap">
                    <input
                      v-model="passwordForm.currentPassword"
                      :type="showPassword.current ? 'text' : 'password'"
                      class="sec-field-control"
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
                </div>

                <div class="sec-field">
                  <span class="sec-label">New Password</span>
                  <div class="field-wrap">
                    <input
                      v-model="passwordForm.newPassword"
                      :type="showPassword.next ? 'text' : 'password'"
                      class="sec-field-control"
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
                </div>

                <div class="sec-field">
                  <span class="sec-label">Confirm New Password</span>
                  <div class="field-wrap">
                    <input
                      v-model="passwordForm.confirmPassword"
                      :type="showPassword.confirm ? 'text' : 'password'"
                      class="sec-field-control"
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
                </div>
              </div>

              <div class="mt-4 flex justify-end">
                <button
                  type="button"
                  class="sec-btn-gradient"
                  @click="submitPassword"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>

          <!-- Two-Factor Authentication Card -->
          <div class="sec-card sec-card--panel animate-fade-in">
            <div class="sec-card__header-row">
              <div class="sec-card__header-left">
                <h2 class="sec-card__title">Two-Factor Authentication</h2>
                <p class="sec-card__desc">Add an extra layer of security to your account.</p>
              </div>
            </div>

            <div class="sec-card__body-content mt-4 flex-1 flex flex-col justify-between">
              <div>
                <div class="mb-4 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <span class="sec-label !mb-0">Status</span>
                    <span :class="['status-badge', security.twoFactorEnabled ? 'status-success' : 'status-neutral']">
                      {{ security.twoFactorEnabled ? 'Enabled' : 'Disabled' }}
                    </span>
                  </div>
                  <button
                    type="button"
                    class="relative inline-flex h-7 w-12 rounded-full transition duration-200"
                    :class="security.twoFactorEnabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'"
                    @click="toggleTwoFactor(!security.twoFactorEnabled)"
                  >
                    <span
                      class="absolute top-1 size-5 rounded-full bg-white transition-all duration-200"
                      :class="security.twoFactorEnabled ? 'left-6' : 'left-1'"
                    />
                  </button>
                </div>

                <div class="space-y-3">
                  <div>
                    <span class="sec-label mb-1.5 block">Method</span>
                    <div class="rounded-2xl border border-[var(--color-border)] p-3.5 bg-[var(--color-bg-surface)]">
                      <div class="flex items-center justify-between gap-3">
                        <div class="flex items-center gap-3">
                          <div class="icon-box icon-box-primary rounded-xl !size-9">
                            <UIcon
                              name="i-lucide-smartphone"
                              class="size-4.5"
                            />
                          </div>
                          <div>
                            <p class="text-sm font-semibold text-[var(--color-text)]">
                              {{ security.twoFactorMethod }}
                            </p>
                            <p class="mt-0.5 text-xs text-[var(--color-text-muted)]">
                              Using Google Authenticator
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          class="sec-btn-outline"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span class="sec-label mb-1.5 block">Backup Codes</span>
                    <div class="rounded-2xl border border-[var(--color-border)] p-3.5 bg-[var(--color-bg-surface)]">
                      <div class="flex items-center justify-between gap-3">
                        <div>
                          <p class="mt-0.5 text-sm text-[var(--color-text-muted)]">
                            Use backup codes to access your account if you lose your device.
                          </p>
                        </div>
                        <button
                          type="button"
                          class="sec-btn-outline whitespace-nowrap"
                        >
                          View Codes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid gap-[13px] lg:grid-cols-2">
          <div
            id="active-sessions"
            class="sec-card"
          >
            <div class="sec-card__header--stacked">
              <div class="sec-card__header-top">
                <h3 class="sec-card__title">Active Sessions</h3>
                <button
                  type="button"
                  class="sec-card__action-link !text-[var(--color-danger)]"
                  @click="settingsStore.signOutAllSessions()"
                >
                  Sign out all
                </button>
              </div>
              <p class="sec-card__desc">These are devices and locations where you're currently signed in.</p>
            </div>

            <div class="sec-card__rows">
              <div
                v-for="session in sessions.slice(0, 3)"
                :key="session.id"
                class="sec-row sec-row--spaced !gap-6"
              >
                <div class="flex items-center gap-3 min-w-0 flex-1">
                  <div class="sec-row__icon-wrap sec-row__icon-wrap--blue">
                    <UIcon
                      :name="session.device.toLowerCase().includes('iphone') ? 'i-lucide-smartphone' : 'i-lucide-monitor'"
                      class="sec-row__icon"
                    />
                  </div>
                  <div class="sec-row__body !gap-2">
                    <div class="sec-row__title-line">
                      <span
                        class="sec-row__label"
                        :title="`${session.device} - ${session.browser}`"
                      >{{ session.device }} - {{ session.browser }}</span>
                      <span
                        v-if="session.current"
                        class="sec-status-dot"
                        title="Currently connected"
                      ></span>
                    </div>
                    <span
                      class="sec-row__sub sec-row__sub--truncate"
                      :title="`${formatLocation(session.location, session.id)} | IP: ${formatIp(session.ipAddress)}`"
                    >
                      {{ formatLocation(session.location, session.id) }} | IP: {{ formatIp(session.ipAddress) }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-3 flex-shrink-0">
                  <span class="sec-row__sub">{{ session.lastSeen }}</span>
                  <button
                    type="button"
                    class="sec-card__action-link !text-[var(--color-danger)]"
                    @click="revokeSession(session.id)"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            </div>
            <div
              v-if="sessions.length > 3"
              class="mt-2 text-center"
            >
              <button
                type="button"
                class="sec-card__action-link"
              >
                View all sessions
              </button>
            </div>
          </div>

          <div class="sec-card">
            <div class="sec-card__header--stacked">
              <div class="sec-card__header-top">
                <h3 class="sec-card__title">Login History</h3>
              </div>
              <p class="sec-card__desc">Review your recent account activity.</p>
            </div>

            <div class="sec-card__rows">
              <div
                v-for="entry in loginHistory.slice(0, 3)"
                :key="entry.id"
                class="sec-row sec-row--spaced"
              >
                <div class="sec-row__body">
                  <div class="sec-row__title-line">
                    <span class="sec-row__label">{{ entry.timeLabel }}</span>
                    <span class="sec-row__sub sec-row__sub--truncate">{{ formatLocation(entry.location, entry.id) }}</span>
                  </div>
                </div>
                <span :class="['sec-badge', entry.status === 'Success' ? 'sec-badge--green' : 'sec-badge--orange']">{{ entry.status }}</span>
              </div>
            </div>
            <div
              v-if="loginHistory.length > 3"
              class="mt-2 text-center"
            >
              <button
                type="button"
                class="sec-card__action-link"
              >
                View all histories
              </button>
            </div>
          </div>
        </div>

        <!-- ── 3 Dynamic Cards Row ─────────────────────────────────── -->
        <div class="security-cards-row">

          <!-- Card 1: Trusted Devices -->
          <div class="sec-card">
            <div class="sec-card__header--stacked">
              <div class="sec-card__header-top">
                <h3 class="sec-card__title">Trusted Devices</h3>
                <button
                  type="button"
                  class="sec-card__action-link"
                  @click="handleManageTrustedDevices"
                >
                  Manage
                </button>
              </div>
              <p class="sec-card__desc">Devices you trust and do not want to verify on every login.</p>
            </div>


            <!-- Empty state -->
            <div
              v-if="!trustedDevices.length"
              class="sec-empty"
            >
              <UIcon
                name="i-lucide-monitor-smartphone"
                class="sec-empty__icon"
              />
              <span>No trusted devices yet</span>
            </div>

            <!-- Device rows -->
            <div
              v-else
              class="sec-card__rows"
            >
              <div
                v-for="device in trustedDevices"
                :key="device.id"
                class="sec-row"
              >
                <div class="sec-row__icon-wrap sec-row__icon-wrap--blue">
                  <UIcon
                    :name="device.icon"
                    class="sec-row__icon"
                  />
                </div>
                <div class="sec-row__body">
                  <div class="sec-row__title-line">
                    <span class="sec-row__label">{{ device.name }}</span>
                    <span
                      v-if="device.isCurrent"
                      class="sec-badge sec-badge--blue"
                    >Current</span>
                  </div>
                  <span class="sec-row__sub">{{ device.addedOn }}</span>
                </div>
                <button
                  type="button"
                  class="sec-row__remove"
                  title="Remove device"
                  @click="settingsStore.removeTrustedDevice(device.id)"
                >
                  <UIcon
                    name="i-lucide-x"
                    class="size-3.5"
                  />
                </button>
              </div>
            </div>

            <button
              type="button"
              class="sec-card__add-link"
              @click="handleAddTrustedDevice"
            >
              <UIcon
                name="i-lucide-plus"
                class="size-3.5"
              />
              Add Trusted Device
            </button>
          </div>

          <!-- Card 2: Account Recovery -->
          <div class="sec-card">
            <div class="sec-card__header">
              <div>
                <h3 class="sec-card__title">Account Recovery</h3>
                <p class="sec-card__desc">Manage your recovery options.</p>
              </div>
            </div>

            <div class="sec-card__rows">
              <div
                v-for="method in recoveryMethods"
                :key="method.id"
                class="sec-row sec-row--spaced"
              >
                <div
                  class="sec-row__icon-wrap"
                  :class="method.verified ? 'sec-row__icon-wrap--green' : 'sec-row__icon-wrap--muted'"
                >
                  <UIcon
                    :name="method.icon"
                    class="sec-row__icon"
                  />
                </div>
                <div class="sec-row__body">
                  <span class="sec-row__label">{{ method.label }}</span>
                  <span class="sec-row__sub sec-row__sub--truncate">{{ method.value }}</span>
                </div>
                <span
                  v-if="method.value !== 'Not set'"
                  class="sec-badge"
                  :class="method.verified ? 'sec-badge--green' : 'sec-badge--orange'"
                >{{ method.status }}</span>
                <button
                  type="button"
                  class="sec-card__action-link"
                  @click="handleAddRecovery(method.id)"
                >
                  {{ method.value !== 'Not set' ? 'Edit' : 'Add' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Card 3: Additional Security -->
          <div class="sec-card">
            <div class="sec-card__header">
              <div>
                <h3 class="sec-card__title">Additional Security</h3>
                <p class="sec-card__desc">Extra protection for your account.</p>
              </div>
            </div>

            <div class="sec-card__rows">
              <div
                v-for="item in additionalSecurity"
                :key="item.id"
                class="sec-row sec-row--spaced"
                :class="{ 'cursor-pointer hover:bg-[var(--color-bg-soft)] transition-colors': item.type === 'link' }"
                @click="item.type === 'link' ? handleManageTrustedDevices() : null"
              >
                <div class="sec-row__body">
                  <span class="sec-row__label">{{ item.label }}</span>
                  <span class="sec-row__sub">{{ item.description }}</span>
                </div>
                <!-- Toggle -->
                <button
                  v-if="item.type === 'toggle' && item.prefKey"
                  type="button"
                  class="sec-toggle"
                  :class="item.enabled ? 'sec-toggle--on' : 'sec-toggle--off'"
                  :aria-label="item.label"
                  @click="settingsStore.updateSecurityToggle(item.prefKey!, !item.enabled)"
                >
                  <span
                    class="sec-toggle__thumb"
                    :class="item.enabled ? 'sec-toggle__thumb--on' : 'sec-toggle__thumb--off'"
                  />
                </button>
                <!-- Visual-only toggle (no prefKey) -->
                <button
                  v-else-if="item.type === 'toggle'"
                  type="button"
                  class="sec-toggle"
                  :class="item.enabled ? 'sec-toggle--on' : 'sec-toggle--off'"
                  :aria-label="item.label"
                  @click="item.enabled = !item.enabled"
                >
                  <span
                    class="sec-toggle__thumb"
                    :class="item.enabled ? 'sec-toggle__thumb--on' : 'sec-toggle__thumb--off'"
                  />
                </button>
                <!-- Link arrow -->
                <UIcon
                  v-else
                  name="i-lucide-chevron-right"
                  class="size-4 text-[var(--color-text-muted)] flex-shrink-0"
                />
              </div>
            </div>
          </div>

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

/* ── 3 Dynamic Security Cards ────────────────────────────────────────── */
.security-cards-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 13px;
}

@media (max-width: 1024px) {
  .security-cards-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .security-cards-row {
    grid-template-columns: 1fr;
  }
}

/* Card shell */
.sec-card {
  background: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: 14px 16px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.sec-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

/* Trusted Devices: title+Manage on one row, desc full-width below */
.sec-card__header--stacked {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sec-card__header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.sec-card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
}

.sec-card__desc {
  font-size: 10px;
  color: var(--color-text-muted);
  margin-top: 0;
  line-height: 1.4;
}

.sec-card__action-link {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  flex-shrink: 0;
  transition: opacity var(--transition-fast);
  white-space: nowrap;
}

.sec-card__action-link:hover {
  opacity: 0.75;
}

.sec-card__add-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  margin-top: 4px;
  transition: opacity var(--transition-fast);
}

.sec-card__add-link:hover {
  opacity: 0.75;
}

.sec-card__rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Push rows down in cards that use the standard (non-stacked) header
   so the first row aligns vertically with Trusted Devices */
.sec-card__header + .sec-card__rows {
  margin-top: 20px;
}

/* Row inside a card */
.sec-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 9px 11px;
  min-width: 0;
}

.sec-row--spaced {
  justify-content: space-between;
}

.sec-row__icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.sec-row__icon-wrap--blue {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.sec-row__icon-wrap--green {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}

.sec-row__icon-wrap--muted {
  background: var(--color-bg-soft);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.sec-row__icon {
  width: 18px;
  height: 18px;
}

.sec-row__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.sec-row__title-line {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.sec-row__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sec-row__sub {
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.3;
}

.sec-row__sub--truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sec-row__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  flex-shrink: 0;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.sec-row__remove:hover {
  background: rgba(244, 63, 94, 0.1);
  color: var(--color-danger);
}

/* Status Badges */
.sec-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
  flex-shrink: 0;
  white-space: nowrap;
}

.sec-badge--green {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

/* Orange badge kept for structural completeness but not used for Verified/Ready */
.sec-badge--orange {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.sec-badge--blue {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border: 1px solid rgba(79, 70, 229, 0.2);
}

/* Toggle */
.sec-toggle {
  position: relative;
  width: 42px;
  height: 24px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
  transition: background var(--transition-normal) var(--ease-smooth);
  cursor: pointer;
}

.sec-toggle--on {
  background: var(--color-primary);
}

.sec-toggle--off {
  background: var(--color-border);
}

.sec-toggle__thumb {
  position: absolute;
  top: 3px;
  width: 18px;
  height: 18px;
  border-radius: var(--radius-full);
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: left var(--transition-normal) var(--ease-smooth);
}

.sec-toggle__thumb--on {
  left: 21px;
}

.sec-toggle__thumb--off {
  left: 3px;
}

/* Empty state for trusted devices */
.sec-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0 8px;
  color: var(--color-text-muted);
  font-size: 12px;
  text-align: center;
}

.sec-empty__icon {
  width: 28px;
  height: 28px;
  opacity: 0.4;
}

.sec-status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background-color: var(--color-primary);
  border-radius: var(--radius-full);
  box-shadow: 0 0 0 2.5px var(--color-primary-soft);
  flex-shrink: 0;
  margin-left: 2px;
}

/* Custom refactored panel cards for Change Password and 2FA */
.sec-card--panel {
  display: flex;
  flex-direction: column;
  background-color: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: 20px 24px;
  box-shadow: var(--shadow-card);
  height: 100%;
}

.sec-card__header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}



.sec-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-soft);
  margin-bottom: 5px;
}

.sec-field-control {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-input-bg);
  color: var(--color-text);
  min-height: 42px;
  padding: 0 16px;
  padding-right: 48px;
  font-size: 14px;
  transition: border-color var(--transition-fast) var(--ease-out), box-shadow var(--transition-fast) var(--ease-out);
}

.sec-field-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.sec-btn-gradient {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 8px 20px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: var(--color-white);
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--radius-xl);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
  transition: transform 0.2s var(--ease-smooth), opacity 0.2s var(--ease-smooth), box-shadow 0.2s var(--ease-smooth);
  cursor: pointer;
  border: none;
}

.sec-btn-gradient:hover {
  opacity: 0.95;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3);
}

.sec-btn-gradient:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.2);
}

.sec-btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 6px 14px;
  background: var(--color-white);
  border: 1px solid var(--color-border);
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.sec-btn-outline:hover {
  background-color: var(--color-bg-soft);
  border-color: var(--color-primary-soft);
}

.dark .sec-btn-outline {
  background-color: var(--color-bg);
  border-color: var(--color-border);
}

</style>

