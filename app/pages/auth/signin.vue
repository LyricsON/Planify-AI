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
const infoMessage = ref('')

const onSubmit = async () => {
  if (!form.email || !form.password || isLoading.value) return

  errorMessage.value = ''
  infoMessage.value = ''
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

const onGoogleClick = () => {
  errorMessage.value = ''
  infoMessage.value = 'Google sign-in is coming soon.'
  setTimeout(() => {
    if (infoMessage.value === 'Google sign-in is coming soon.') {
      infoMessage.value = ''
    }
  }, 4000)
}
</script>

<template>
  <AuthPageShell
    mode="signin"
    title="Welcome back"
    subtitle="Sign in to continue planning smarter study sessions."
    align="center"
  >
    <form
      class="signin-form"
      @submit.prevent="onSubmit"
    >
      <!-- Alert Message (Error) -->
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

      <!-- Alert Message (Info / Google Toast) -->
      <div
        v-if="infoMessage"
        class="signin-alert signin-alert-info animate-fade-in"
      >
        <UIcon
          name="i-lucide-info"
          class="signin-alert-icon"
        />
        <span>{{ infoMessage }}</span>
      </div>

      <!-- Email Field -->
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
            placeholder="alex@student.com"
            class="signin-input-control"
          >
        </div>
      </label>

      <!-- Password Field -->
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
            placeholder="••••••••••••"
            class="signin-input-control"
          >
          <button
            type="button"
            class="signin-icon-button"
            aria-label="Toggle password visibility"
            @click="showPassword = !showPassword"
          >
            <UIcon
              :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              class="signin-input-icon"
            />
          </button>
        </div>
      </label>

      <!-- Options Row -->
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

      <!-- Sign In Button -->
      <button
        type="submit"
        class="signin-submit"
        :disabled="isLoading"
      >
        <span>{{ isLoading ? 'Signing in...' : 'Sign In' }}</span>
        <UIcon
          name="i-lucide-arrow-right"
          class="signin-submit-icon"
        />
      </button>

      <!-- Divider -->
      <div class="signin-divider">
        <div />
        <span>or</span>
        <div />
      </div>

      <!-- Google Button -->
      <button
        type="button"
        class="signin-google"
        @click="onGoogleClick"
      >
        <UIcon
          name="i-simple-icons-google"
          class="signin-google-icon"
        />
        <span>Continue with Google</span>
      </button>

      <!-- Footer Sign Up Link -->
      <p class="signin-footer">
        Don't have an account?
        <NuxtLink
          to="/auth/signup"
          class="signin-link font-semibold"
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
  gap: 20px;
}

.signin-field {
  display: block;
}

.signin-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14.5px;
  line-height: 1.5;
}

.signin-alert-error {
  border: 1px solid color-mix(in srgb, var(--color-danger) 20%, transparent);
  background: color-mix(in srgb, var(--color-danger) 8%, var(--color-card-bg));
  color: color-mix(in srgb, var(--color-danger) 85%, var(--color-text));
}

.signin-alert-info {
  border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
  background: color-mix(in srgb, var(--color-primary) 8%, var(--color-card-bg));
  color: var(--color-primary);
}

.signin-alert-icon {
  width: 18px;
  height: 18px;
  margin-top: 2.5px;
  flex-shrink: 0;
}

.signin-label {
  display: block;
  margin-bottom: 8px;
  color: #475569;
  font-size: 14px;
  font-weight: 600;
}

.signin-input {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 58px;
  padding: 0 18px;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.01);
  transition: border-color var(--transition-fast) var(--ease-out), box-shadow var(--transition-fast) var(--ease-out);
}

.signin-input:focus-within {
  border-color: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1), inset 0 1px 2px rgba(15, 23, 42, 0.01);
}

.signin-input-icon {
  width: 20px;
  height: 20px;
  color: #94a3b8;
  flex-shrink: 0;
}

.signin-input-control {
  width: 100%;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #0f172a;
  font-size: 15.5px;
}

.signin-input-control::placeholder {
  color: #94a3b8;
  opacity: 0.85;
}

/* Chrome autofill overrides */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
  -webkit-text-fill-color: #0f172a !important;
  transition: background-color 5000s ease-in-out 0s;
}

.signin-icon-button {
  display: inline-flex;
  padding: 4px;
  color: #94a3b8;
  transition: color var(--transition-fast) var(--ease-out);
}

.signin-icon-button:hover {
  color: #475569;
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
  gap: 8px;
  color: #475569;
  font-size: 14.5px;
  cursor: pointer;
  user-select: none;
}

.signin-checkbox {
  width: 17px;
  height: 17px;
  border-radius: 4px;
  accent-color: #4f46e5;
  cursor: pointer;
}

.signin-link {
  color: #4f46e5;
  font-size: 14.5px;
  font-weight: 600;
  text-decoration: none;
  transition: color var(--transition-fast) var(--ease-out);
}

.signin-link:hover {
  color: #7c3aed;
}

.signin-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  height: 58px;
  border-radius: 14px;
  background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%);
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
  transition: transform var(--transition-fast) var(--ease-out), opacity var(--transition-fast) var(--ease-out), box-shadow var(--transition-fast) var(--ease-out);
  cursor: pointer;
}

.signin-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.35);
}

.signin-submit:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.signin-submit-icon {
  position: absolute;
  right: 22px;
  width: 18px;
  height: 18px;
  transition: transform var(--transition-fast) var(--ease-out);
}

.signin-submit:hover:not(:disabled) .signin-submit-icon {
  transform: translateX(4px);
}

.signin-divider {
  display: flex;
  align-items: center;
  gap: 20px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
}

.signin-divider div {
  height: 1px;
  flex: 1;
  background: #e2e8f0;
}

.signin-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 58px;
  border: 1.5px solid #cbd5e1;
  border-radius: 14px;
  background: #ffffff;
  color: #0f172a;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast) var(--ease-out), border-color var(--transition-fast) var(--ease-out), transform var(--transition-fast) var(--ease-out);
}

.signin-google:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.signin-google:active {
  transform: translateY(0);
}

.signin-google-icon {
  width: 20px;
  height: 20px;
}

.signin-footer {
  color: #64748b;
  text-align: center;
  font-size: 14.5px;
  margin-top: 4px;
}
</style>
