<script setup lang="ts">
import { reactive, ref } from 'vue'

definePageMeta({
  layout: 'auth'
})

const form = reactive({
  email: '',
  password: '',
  remember: false
})

const showPassword = ref(false)
const isLoading = ref(false)

const onSubmit = async () => {
  if (!form.email || !form.password) return

  isLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
  console.log('Sign in payload:', form)
  isLoading.value = false
}
</script>

<template>
  <AuthPageShell
    mode="signin"
    title="Welcome back"
    subtitle="Sign in to continue to Planify AI"
    align="center"
  >
    <form @submit.prevent="onSubmit" class="space-y-6">
      <label class="block space-y-3">
        <span class="text-[14px] font-semibold text-[var(--color-text)]">Email address</span>
        <div class="flex h-14 items-center gap-3 rounded-[1.05rem] border border-[var(--color-border)] bg-[var(--color-input-bg)] px-4">
          <UIcon name="i-lucide-mail" class="h-5 w-5 text-[var(--color-text-muted)]" />
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="you@example.com"
            class="h-full w-full border-0 bg-transparent text-[15px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
          >
        </div>
      </label>

      <label class="block space-y-3">
        <span class="text-[14px] font-semibold text-[var(--color-text)]">Password</span>
        <div class="flex h-14 items-center gap-3 rounded-[1.05rem] border border-[var(--color-border)] bg-[var(--color-input-bg)] px-4">
          <UIcon name="i-lucide-lock" class="h-5 w-5 text-[var(--color-text-muted)]" />
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            required
            placeholder=".............."
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
      </label>

      <div class="flex items-center justify-between gap-4">
        <label class="flex items-center gap-3 text-[14px] text-[var(--color-text)]">
          <input
            v-model="form.remember"
            type="checkbox"
            class="h-5 w-5 rounded-[6px] border border-[var(--color-border-strong)] accent-[var(--color-primary)]"
          >
          <span>Remember me</span>
        </label>

        <NuxtLink
          to="/auth/forgot-password"
          class="text-[14px] font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]"
        >
          Forgot password?
        </NuxtLink>
      </div>

      <button
        type="submit"
        class="flex h-14 w-full items-center justify-center gap-3 rounded-[1.05rem] bg-[linear-gradient(90deg,#5c61f4_0%,#6b4df6_100%)] px-6 text-[0.98rem] font-semibold text-white shadow-[0_18px_40px_rgba(92,97,244,0.25)] transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-70"
        :disabled="isLoading"
      >
        <span>{{ isLoading ? 'Signing in...' : 'Sign in' }}</span>
        <UIcon name="i-lucide-arrow-right" class="h-5 w-5" />
      </button>

      <div class="relative flex items-center">
        <div class="flex-grow border-t border-[var(--color-border)]" />
        <span class="mx-5 flex-shrink-0 text-sm text-[var(--color-text-muted)]">or</span>
        <div class="flex-grow border-t border-[var(--color-border)]" />
      </div>

      <button
        type="button"
        class="flex h-12 w-full items-center justify-center gap-3 rounded-[1.05rem] border border-[var(--color-border)] bg-[var(--color-input-bg)] px-6 text-[14px] font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-soft)]"
      >
        <UIcon name="i-simple-icons-google" class="h-5 w-5" />
        <span>Continue with Google</span>
      </button>

      <p class="pt-0.5 text-center text-[14px] text-[var(--color-text-muted)]">
        Don't have an account?
        <NuxtLink to="/auth/signup" class="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
          Sign up
        </NuxtLink>
      </p>
    </form>
  </AuthPageShell>
</template>
