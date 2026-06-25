<script setup lang="ts">
import { reactive, ref } from 'vue'

definePageMeta({
  layout: 'auth'
})

const { sendPasswordReset } = useFirebaseAuth()

const form = reactive({
  email: ''
})

const isLoading = ref(false)
const errorMessage = ref('')

const onSubmit = async () => {
  if (!form.email || isLoading.value) return

  errorMessage.value = ''
  isLoading.value = true

  try {
    await sendPasswordReset(form.email.trim().toLowerCase())

    await navigateTo(`/auth/verification?email=${encodeURIComponent(form.email.trim().toLowerCase())}&purpose=reset`)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to send reset instructions. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AuthPageShell
    mode="signin"
    title="Forgot password?"
    subtitle="Enter your email address and we will send you reset instructions."
    align="center"
  >
    <template #header-top>
      <div class="forgot-header">
        <div class="forgot-icon-wrap">
          <UIcon
            name="i-lucide-key-round"
            class="forgot-icon"
          />
        </div>
      </div>
    </template>

    <form
      class="auth-simple-form"
      @submit.prevent="onSubmit"
    >
      <div
        v-if="errorMessage"
        class="auth-alert auth-alert-error"
      >
        <UIcon
          name="i-lucide-circle-alert"
          class="auth-alert-icon"
        />
        <span>{{ errorMessage }}</span>
      </div>

      <label class="block space-y-2.5">
        <span class="auth-label">Email address</span>
        <div class="auth-input">
          <UIcon
            name="i-lucide-mail"
            class="auth-input-icon"
          />
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="alex@student.com"
            class="auth-input-control"
          >
        </div>
      </label>

      <button
        type="submit"
        class="auth-submit"
        :disabled="isLoading"
      >
        <span>{{ isLoading ? 'Sending...' : 'Reset password' }}</span>
        <UIcon
          name="i-lucide-arrow-right"
          class="auth-submit-icon"
        />
      </button>

      <p class="auth-footer">
        Remembered your password?
        <NuxtLink
          to="/auth/signin"
          class="auth-link font-semibold"
        >
          Sign in
        </NuxtLink>
      </p>
    </form>
  </AuthPageShell>
</template>

<style scoped>
.auth-simple-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.forgot-header {
  display: flex;
  justify-content: center;
  margin-bottom: 18px;
}

.forgot-icon-wrap {
  display: flex;
  align-self: center;
  align-items: center;
  justify-content: center;
  width: 68px;
  height: 68px;
  border-radius: 16px;
  background: linear-gradient(180deg, #4f46e5 0%, #7c3aed 100%);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(79, 70, 229, 0.2);
}

.forgot-icon {
  width: 34px;
  height: 34px;
}

.auth-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14.5px;
  line-height: 1.5;
  width: 100%;
}

.auth-alert-error {
  border: 1px solid color-mix(in srgb, var(--color-danger) 20%, transparent);
  background: color-mix(in srgb, var(--color-danger) 8%, var(--color-card-bg));
  color: color-mix(in srgb, var(--color-danger) 85%, var(--color-text));
}

.auth-alert-icon {
  width: 18px;
  height: 18px;
  margin-top: 2.5px;
  flex-shrink: 0;
}

.auth-label {
  display: block;
  margin-bottom: 8px;
  color: #475569;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
}

.auth-input {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 40px;
  padding: 0 18px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.01);
  transition: border-color var(--transition-fast) var(--ease-out), box-shadow var(--transition-fast) var(--ease-out);
}

.auth-input:focus-within {
  border-color: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1), inset 0 1px 2px rgba(15, 23, 42, 0.01);
}

.auth-input-icon {
  width: 20px;
  height: 20px;
  color: #94a3b8;
  flex-shrink: 0;
}

.auth-input-control {
  width: 100%;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #0f172a;
  font-size: 14px;
}

.auth-input-control::placeholder {
  color: #94a3b8;
  opacity: 0.85;
}

.auth-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
  transition: transform var(--transition-fast) var(--ease-out), opacity var(--transition-fast) var(--ease-out), box-shadow var(--transition-fast) var(--ease-out);
  cursor: pointer;
  width: 100%;
}

.auth-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.35);
}

.auth-submit:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.auth-submit-icon {
  width: 18px;
  height: 18px;
}

.auth-footer {
  color: #64748b;
  text-align: center;
  font-size: 12px;
  margin-top: 2px;
}

.auth-link {
  color: #4f46e5;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  transition: color var(--transition-fast) var(--ease-out);
}

.auth-link:hover {
  color: #7c3aed;
}
</style>
