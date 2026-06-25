<script setup lang="ts">
import { computed, ref } from 'vue'

definePageMeta({
  layout: 'auth'
})

const route = useRoute()
const { resendEmailVerification, sendPasswordReset } = useFirebaseAuth()

const email = computed(() => {
  const value = route.query.email
  return typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : ''
})

const purpose = computed(() => {
  const value = route.query.purpose
  return value === 'reset' ? 'reset' : 'verification'
})

const title = computed(() => (purpose.value === 'reset' ? 'Check your inbox' : 'Check your inbox'))
const subtitle = computed(() => (
  purpose.value === 'reset'
    ? ''
    : 'We sent a verification link to your email address.'
))
const message = computed(() => (
  purpose.value === 'reset'
    ? 'An email has been sent to your inbox. Please check your email and follow the instructions to complete your password reset.'
    : 'An email has been sent to your inbox. Please check your email and follow the instructions to complete your registration.'
))
const reminderMessage = computed(() => (
  purpose.value === 'reset'
    ? 'This email should arrive within the next five minutes. Please also check your spam folder.'
    : 'This email should arrive within the next five minutes. Please also check your spam folder.'
))

const isResending = ref(false)
const statusMessage = ref('')
const errorMessage = ref('')

const onResend = async () => {
  if (isResending.value) return

  errorMessage.value = ''
  statusMessage.value = ''
  isResending.value = true

  try {
    if (purpose.value === 'reset') {
      if (!email.value) {
        throw new Error('Please enter your email address again.')
      }

      await sendPasswordReset(email.value)
    } else {
      await resendEmailVerification()
    }

    statusMessage.value = purpose.value === 'reset'
      ? 'Reset email sent again.'
      : 'Verification email sent again.'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to resend the email. Please try again.'
  } finally {
    isResending.value = false
  }
}
</script>

<template>
  <AuthPageShell
    mode="signin"
    :title="title"
    :subtitle="subtitle"
    align="center"
  >
    <template #header-top>
      <div class="verification-header">
        <div class="verification-icon">
          <UIcon
            name="i-lucide-mail-open"
            class="verification-icon-mark"
          />
        </div>
      </div>
    </template>

    <div class="verification-panel">
      <p class="verification-copy">
        {{ message }}
      </p>

      <p class="verification-copy verification-copy-soft">
        {{ reminderMessage }}
      </p>

      <div
        v-if="errorMessage"
        class="verification-alert verification-alert-error"
      >
        <UIcon
          name="i-lucide-circle-alert"
          class="verification-alert-icon"
        />
        <span>{{ errorMessage }}</span>
      </div>

      <div
        v-if="statusMessage"
        class="verification-alert verification-alert-success"
      >
        <UIcon
          name="i-lucide-circle-check"
          class="verification-alert-icon"
        />
        <span>{{ statusMessage }}</span>
      </div>

      <div class="verification-actions">
        <p class="verification-resend-copy">
          <span>{{ purpose === 'reset' ? "Didn't get the link?" : "Didn't get the link?" }}</span>
          <button
            type="button"
            class="verification-resend-link"
            :disabled="isResending"
            @click="onResend"
          >
            {{ purpose === 'reset' ? 'Resend' : 'Resend' }}
          </button>
        </p>

        <NuxtLink
          to="/auth/signin"
          class="verification-back"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="h-4 w-4"
          />
          <span>Back to sign in</span>
        </NuxtLink>
      </div>
    </div>
  </AuthPageShell>
</template>

<style scoped>
.verification-header {
  display: flex;
  justify-content: center;
  margin-bottom: 18px;
}

.verification-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: #b8dcff;
  color: #2e86ff;
  box-shadow: none;
}

.verification-icon-mark {
  width: 42px;
  height: 42px;
}

.verification-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 44rem;
  margin: 0 auto;
}

.verification-copy {
  color: #111827;
  font-size: 0.95rem;
  line-height: 1.4;
  text-align: center;
}

.verification-copy-soft {
  color: #374151;
  max-width: 38rem;
  margin: 0 auto;
}

.verification-resend-copy {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 6px;
  color: #111827;
  font-size: 0.92rem;
  line-height: 1.4;
}

.verification-resend-link {
  color: #2e86ff;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
  font-size: inherit;
  font-weight: 400;
  cursor: pointer;
}

.verification-resend-link:hover {
  cursor: pointer;
}

.verification-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14.5px;
  line-height: 1.5;
}

.verification-alert-error {
  border: 1px solid color-mix(in srgb, var(--color-danger) 20%, transparent);
  background: color-mix(in srgb, var(--color-danger) 8%, var(--color-card-bg));
  color: color-mix(in srgb, var(--color-danger) 85%, var(--color-text));
}

.verification-alert-success {
  border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
  background: color-mix(in srgb, var(--color-primary) 8%, var(--color-card-bg));
  color: var(--color-primary);
}

.verification-alert-icon {
  width: 18px;
  height: 18px;
  margin-top: 2.5px;
  flex-shrink: 0;
}

.verification-actions {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-top: 8px;
}

.verification-resend,
.verification-back {
  display: inline-flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  border-radius: 10px;
  font-weight: 700;
  transition: transform var(--transition-fast) var(--ease-out), opacity var(--transition-fast) var(--ease-out), box-shadow var(--transition-fast) var(--ease-out), border-color var(--transition-fast) var(--ease-out), background var(--transition-fast) var(--ease-out), color var(--transition-fast) var(--ease-out);
}

.verification-resend {
  display: none;
}

.verification-resend:hover:not(:disabled) {
  transform: none;
}

.verification-resend:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.verification-back {
  border: 1px solid #2e86ff;
  background: transparent;
  color: #2e86ff;
  font-size: 0.92rem;
}

.verification-back:hover {
  border-color: #2e86ff;
  color: #2e86ff;
  transform: translateY(-1px);
}
</style>
