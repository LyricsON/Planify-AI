<script setup lang="ts">
import { reactive, ref } from 'vue'

definePageMeta({
  layout: 'auth'
})

const { post } = useApi()
const { saveAuthToken } = useAuth()

const form = reactive({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'Student',
  terms: false
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const roleOptions = ['Student', 'Worker', 'Freelancer', 'Entrepreneur']

const onSubmit = async () => {
  if (!form.fullName || !form.email || !form.password || !form.confirmPassword || isLoading.value) return

  errorMessage.value = ''

  if (form.password !== form.confirmPassword) {
    errorMessage.value = 'Passwords don\'t match.'
    return
  }

  if (form.password.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters.'
    return
  }

  if (!form.terms) {
    errorMessage.value = 'Please agree to the Terms of Service and Privacy Policy.'
    return
  }

  isLoading.value = true
  try {
    const response = await post('/auth/register', {
      name: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password
    })

    if (!response.success || !response.token) {
      errorMessage.value = response.message || 'Unable to create your account. Please try again.'
      return
    }

    saveAuthToken(response.token)
    await navigateTo('/dashboard')
  } catch {
    errorMessage.value = 'Unable to reach the server. Check that the backend is running and try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AuthPageShell
    mode="signup"
    title="Create your account"
    subtitle="Start your journey to smarter studying."
    align="start"
  >
    <form @submit.prevent="onSubmit" class="space-y-4">
      <div
        v-if="errorMessage"
        class="flex items-start gap-3 rounded-[1rem] border border-[color-mix(in_srgb,var(--color-danger)_24%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--color-card-bg))] px-4 py-3 text-[14px] leading-6 text-[color-mix(in_srgb,var(--color-danger)_78%,var(--color-text))]"
      >
        <UIcon name="i-lucide-circle-alert" class="mt-1 h-4 w-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <label class="block space-y-2.5">
        <span class="text-[13px] font-semibold text-[var(--color-text)]">Full name</span>
        <div class="flex h-12 items-center gap-3 rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-input-bg)] px-4">
          <UIcon name="i-lucide-user" class="h-5 w-5 text-[var(--color-text-muted)]" />
          <input
            v-model="form.fullName"
            type="text"
            required
            placeholder="Enter your full name"
            class="h-full w-full border-0 bg-transparent text-[15px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
          >
        </div>
      </label>

      <label class="block space-y-2.5">
        <span class="text-[13px] font-semibold text-[var(--color-text)]">Email address</span>
        <div class="flex h-12 items-center gap-3 rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-input-bg)] px-4">
          <UIcon name="i-lucide-mail" class="h-5 w-5 text-[var(--color-text-muted)]" />
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="Enter your email"
            class="h-full w-full border-0 bg-transparent text-[15px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
          >
        </div>
      </label>

      <label class="block space-y-2.5">
        <span class="text-[13px] font-semibold text-[var(--color-text)]">Password</span>
        <div class="flex h-12 items-center gap-3 rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-input-bg)] px-4">
          <UIcon name="i-lucide-lock" class="h-5 w-5 text-[var(--color-text-muted)]" />
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            required
            placeholder="Create a password"
            class="h-full w-full border-0 bg-transparent text-[15px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
          >
          <button
            type="button"
            class="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
            @click="showPassword = !showPassword"
          >
            <UIcon :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="h-5 w-5" />
          </button>
        </div>
        <p class="text-[12px] leading-[1.45] text-[var(--color-text-muted)]">Use at least 8 characters with a mix of letters, numbers &amp; symbols.</p>
      </label>

      <label class="block space-y-2.5">
        <span class="text-[13px] font-semibold text-[var(--color-text)]">Confirm password</span>
        <div class="flex h-12 items-center gap-3 rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-input-bg)] px-4">
          <UIcon name="i-lucide-lock" class="h-5 w-5 text-[var(--color-text-muted)]" />
          <input
            v-model="form.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            required
            placeholder="Confirm your password"
            class="h-full w-full border-0 bg-transparent text-[15px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
          >
          <button
            type="button"
            class="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <UIcon :name="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="h-5 w-5" />
          </button>
        </div>
      </label>

      <label class="block space-y-2.5">
        <span class="text-[13px] font-semibold text-[var(--color-text)]">I'm a...</span>
        <div class="flex h-12 items-center gap-3 rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-input-bg)] px-4">
          <UIcon name="i-lucide-graduation-cap" class="h-5 w-5 text-[var(--color-text-muted)]" />
          <select
            v-model="form.role"
            class="h-full w-full appearance-none border-0 bg-transparent text-[15px] text-[var(--color-text)] outline-none"
          >
            <option v-for="option in roleOptions" :key="option" :value="option">{{ option }}</option>
          </select>
          <UIcon name="i-lucide-chevron-down" class="h-5 w-5 text-[var(--color-text-muted)]" />
        </div>
      </label>

      <label class="flex items-start gap-3 pt-1 text-[14px] leading-6 text-[var(--color-text)]">
        <input
          v-model="form.terms"
          type="checkbox"
          required
          class="mt-1 h-5 w-5 rounded-[6px] border border-[var(--color-border-strong)] accent-[var(--color-primary)]"
        >
        <span>
          I agree to the
          <a href="#" class="text-[var(--color-primary)] hover:underline">Terms of Service</a>
          and
          <a href="#" class="text-[var(--color-primary)] hover:underline">Privacy Policy</a>
        </span>
      </label>

      <button
        type="submit"
        class="flex h-12 w-full items-center justify-center gap-3 rounded-[1rem] bg-[linear-gradient(90deg,#5c61f4_0%,#6b4df6_100%)] px-6 text-[0.96rem] font-semibold text-white shadow-[0_18px_40px_rgba(92,97,244,0.25)] transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-70"
        :disabled="isLoading"
      >
        <UIcon name="i-lucide-sparkles" class="h-5 w-5" />
        <span>{{ isLoading ? 'Creating account...' : 'Create account' }}</span>
      </button>

      <div class="relative my-0.5 flex items-center">
        <div class="flex-grow border-t border-[var(--color-border)]" />
        <span class="mx-5 flex-shrink-0 text-sm text-[var(--color-text-muted)]">or</span>
        <div class="flex-grow border-t border-[var(--color-border)]" />
      </div>

      <button
        type="button"
        disabled
        class="flex h-12 w-full items-center justify-center gap-3 rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-input-bg)] px-6 text-[14px] font-semibold text-[var(--color-text)] opacity-70 transition-colors hover:bg-[var(--color-bg-soft)] disabled:cursor-not-allowed"
      >
        <UIcon name="i-simple-icons-google" class="h-5 w-5" />
        <span>Google sign-up coming soon</span>
      </button>

      <p class="pt-0.5 text-center text-[14px] text-[var(--color-text-muted)]">
        Already have an account?
        <NuxtLink to="/auth/signin" class="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
          Sign in
        </NuxtLink>
      </p>
    </form>

    <template #after-card>
      <div class="mt-4 rounded-[1.65rem] border border-[color-mix(in_srgb,var(--color-ai)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-card-bg)_80%,transparent)] px-5 py-4 shadow-[0_16px_50px_rgba(120,92,255,0.08)] backdrop-blur-sm">
        <div class="relative flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(120,92,255,0.18)] bg-[rgba(120,92,255,0.08)] text-[var(--color-ai)]">
            <UIcon name="i-lucide-gift" class="h-6 w-6" />
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="text-[0.97rem] font-bold text-[var(--color-text)]">
              Start free for 1 month
            </h4>
            <p class="mt-1 text-[0.86rem] leading-[1.45] text-[var(--color-text-soft)]">
              Get full access to all AI features and 10,000 starter tokens.
            </p>
          </div>
          <UIcon name="i-lucide-sparkles" class="absolute right-1 top-1 h-5 w-5 text-[var(--color-ai)]/30" />
          <UIcon name="i-lucide-sparkles" class="absolute bottom-0 right-10 h-4 w-4 text-[var(--color-ai)]/20" />
        </div>
      </div>
    </template>
  </AuthPageShell>
</template>
