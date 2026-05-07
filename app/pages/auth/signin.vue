<script setup lang="ts">
import { ref, reactive } from 'vue'

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
  // Mock API call
  await new Promise(resolve => setTimeout(resolve, 500))
  console.log('Sign in payload:', form)
  isLoading.value = false
}
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Left Panel (Brand & Info) -->
    <div class="hidden lg:flex w-[48%] relative">
      <!-- Background pattern/gradient -->
      <div class="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-bg)] opacity-50 z-0"></div>
      
      <!-- Content -->
      <div class="relative z-10 w-full">
        <AuthBrandPanel mode="signin" />
      </div>
    </div>

    <!-- Right Panel (Form) -->
    <div class="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 w-full lg:w-[52%]">
      
      <!-- Mobile Logo -->
      <div class="lg:hidden flex items-center gap-2 mb-8">
        <div class="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white shadow-sm">
          <UIcon name="i-lucide-sparkles" class="w-5 h-5" />
        </div>
        <span class="text-xl font-bold tracking-tight text-[var(--color-text)]">Planify AI</span>
      </div>

      <div class="w-full max-w-[440px] animate-slide-up">
        <div class="soft-card p-8 sm:p-10">
          
          <div class="mb-8 text-center">
            <h2 class="text-2xl font-bold text-[var(--color-text)] mb-2">Welcome back</h2>
            <p class="text-sm text-[var(--color-text-muted)]">Sign in to continue to Planify AI</p>
          </div>

          <form @submit.prevent="onSubmit" class="space-y-5">
            <!-- Email -->
            <UFormGroup label="Email address" name="email">
              <UInput 
                v-model="form.email" 
                type="email" 
                icon="i-lucide-mail" 
                placeholder="you@example.com" 
                required 
                size="md"
                class="w-full"
              />
            </UFormGroup>

            <!-- Password -->
            <UFormGroup label="Password" name="password">
              <UInput 
                v-model="form.password" 
                :type="showPassword ? 'text' : 'password'" 
                icon="i-lucide-lock" 
                placeholder="••••••••" 
                required
                size="md"
                class="w-full"
                :ui="{ icon: { trailing: { pointer: '' } } }"
              >
                <template #trailing>
                  <UButton
                    color="gray"
                    variant="link"
                    :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    :padded="false"
                    @click="showPassword = !showPassword"
                    class="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  />
                </template>
              </UInput>
            </UFormGroup>

            <!-- Options -->
            <div class="flex items-center justify-between mt-2">
              <UCheckbox v-model="form.remember" label="Remember me" name="remember" />
              <NuxtLink to="/auth/forgot-password" class="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors">
                Forgot password?
              </NuxtLink>
            </div>

            <!-- Submit -->
            <UButton 
              type="submit" 
              color="primary" 
              block 
              size="lg" 
              class="mt-6 font-semibold"
              :loading="isLoading"
              trailing-icon="i-lucide-arrow-right"
            >
              Sign in
            </UButton>

            <!-- Divider -->
            <div class="relative my-6 flex items-center">
              <div class="flex-grow border-t border-[var(--color-border)]"></div>
              <span class="flex-shrink-0 mx-4 text-xs text-[var(--color-text-muted)] uppercase tracking-wider">or</span>
              <div class="flex-grow border-t border-[var(--color-border)]"></div>
            </div>

            <!-- Google Sign In -->
            <UButton 
              color="white" 
              variant="outline" 
              block 
              size="lg" 
              icon="i-simple-icons-google"
              class="font-medium text-[var(--color-text)] bg-white dark:bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-bg-soft)] dark:hover:bg-[var(--color-surface-soft)]"
            >
              Continue with Google
            </UButton>

          </form>

        </div>

        <!-- Footer link -->
        <p class="text-center mt-6 text-sm text-[var(--color-text-muted)]">
          Don't have an account? 
          <NuxtLink to="/auth/signup" class="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors">
            Sign up
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
