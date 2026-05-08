<script setup lang="ts">
import { reactive, ref } from 'vue'

definePageMeta({
  layout: 'auth'
})

const { post } = useApi()
const { saveAuthToken, getAuthRedirect } = useAuth()

const form = reactive({
  email: '',
  password: '',
  remember: false
})

const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const onSubmit = async () => {
  if (!form.email || !form.password || isLoading.value) return

  errorMessage.value = ''
  isLoading.value = true

  try {
    const response = await post('/auth/login', {
      email: form.email.trim().toLowerCase(),
      password: form.password
    })

    if (!response.success || !response.token) {
      errorMessage.value = response.message || 'Unable to sign in. Please try again.'
      return
    }

    saveAuthToken(response.token)
    await navigateTo(getAuthRedirect())
  } catch {
    errorMessage.value = 'Unable to reach the server. Check that the backend is running and try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AuthPageShell
    mode="signin"
    title="Welcome back"
    subtitle="Sign in to continue to Planify AI"
    align="center"
  >
    <form
      class="signin-form"
      @submit.prevent="onSubmit"
    >
      <div
        v-if="errorMessage"
        class="signin-alert signin-alert-error"
      >
        <UIcon
          name="i-lucide-circle-alert"
          class="signin-alert-icon"
        />
        <span>{{ errorMessage }}</span>
      </div>

      <label class="signin-field">
        <span class="signin-label">Email address</span>
        <div class="signin-input">
          <UIcon
            name="i-lucide-mail"
            class="signin-input-icon"
          />
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="you@example.com"
            class="signin-input-control"
          >
        </div>
      </label>

      <label class="signin-field">
        <span class="signin-label">Password</span>
        <div class="signin-input">
          <UIcon
            name="i-lucide-lock"
            class="signin-input-icon"
          />
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            required
            placeholder=".............."
            class="signin-input-control"
          >
          <button
            type="button"
            class="signin-icon-button"
            @click="showPassword = !showPassword"
          >
            <UIcon
              :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              class="signin-input-icon"
            />
          </button>
        </div>
      </label>

      <div class="signin-options">
        <label class="signin-check">
          <input
            v-model="form.remember"
            type="checkbox"
            class="signin-checkbox"
          >
          <span>Remember me</span>
        </label>

        <NuxtLink
          to="/auth/forgot-password"
          class="signin-link"
        >
          Forgot password?
        </NuxtLink>
      </div>

      <button
        type="submit"
        class="signin-submit"
        :disabled="isLoading"
      >
        <span>{{ isLoading ? 'Signing in...' : 'Sign in' }}</span>
        <UIcon
          name="i-lucide-arrow-right"
          class="signin-submit-icon"
        />
      </button>

      <div class="signin-divider">
        <div />
        <span>or</span>
        <div />
      </div>

      <button
        type="button"
        class="signin-google"
        disabled
      >
        <UIcon
          name="i-simple-icons-google"
          class="signin-google-icon"
        />
        <span>Google sign-in coming soon</span>
      </button>

      <p class="signin-footer">
        Don't have an account?
        <NuxtLink
          to="/auth/signup"
          class="signin-link"
        >
          Sign up
        </NuxtLink>
      </p>
    </form>
  </AuthPageShell>
</template>

<style scoped>
.signin-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.signin-field {
  display: block;
}

.signin-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.5;
}

.signin-alert-error {
  border: 1px solid color-mix(in srgb, var(--color-danger) 24%, transparent);
  background: color-mix(in srgb, var(--color-danger) 10%, var(--color-card-bg));
  color: color-mix(in srgb, var(--color-danger) 78%, var(--color-text));
}

.signin-alert-icon {
  width: 18px;
  height: 18px;
  margin-top: 1px;
  flex-shrink: 0;
}

.signin-label {
  display: block;
  margin-bottom: 10px;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 700;
}

.signin-input {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 60px;
  padding: 0 18px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-input-bg);
}

.signin-input-icon {
  width: 20px;
  height: 20px;
  color: var(--color-text-muted);
}

.signin-input-control {
  width: 100%;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text);
  font-size: 16px;
}

.signin-input-control::placeholder {
  color: var(--color-text-muted);
}

.signin-icon-button {
  display: inline-flex;
  color: var(--color-text-muted);
  transition: color var(--transition-fast) var(--ease-out);
}

.signin-icon-button:hover {
  color: var(--color-text);
}

.signin-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.signin-check {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text);
  font-size: 15px;
}

.signin-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  accent-color: var(--color-primary);
}

.signin-link {
  color: var(--color-primary);
  font-size: 15px;
  font-weight: 500;
  transition: color var(--transition-fast) var(--ease-out);
}

.signin-link:hover {
  color: var(--color-primary-hover);
}

.signin-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  height: 58px;
  border-radius: 14px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-ai));
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 18px 40px color-mix(in srgb, var(--color-primary) 25%, transparent);
  transition: transform var(--transition-fast) var(--ease-out), opacity var(--transition-fast) var(--ease-out);
}

.signin-submit:hover {
  transform: translateY(-1px);
}

.signin-submit:disabled {
  opacity: 0.72;
}

.signin-submit-icon {
  width: 20px;
  height: 20px;
}

.signin-divider {
  display: flex;
  align-items: center;
  gap: 26px;
  color: var(--color-text-muted);
  font-size: 14px;
}

.signin-divider div {
  height: 1px;
  flex: 1;
  background: var(--color-border);
}

.signin-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 54px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-input-bg);
  color: var(--color-text);
  font-size: 15px;
  font-weight: 600;
  transition: background var(--transition-fast) var(--ease-out);
}

.signin-google:hover {
  background: var(--color-bg-soft);
}

.signin-google:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.signin-google-icon {
  width: 18px;
  height: 18px;
}

.signin-footer {
  color: var(--color-text-muted);
  text-align: center;
  font-size: 14px;
}
</style>
