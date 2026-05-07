<script setup lang="ts">
import { ref, reactive } from 'vue'

definePageMeta({
  layout: 'auth'
})

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

const roleOptions = ['Student', 'Worker', 'Freelancer', 'Entrepreneur']

const onSubmit = async () => {
  if (!form.fullName || !form.email || !form.password || !form.confirmPassword) return
  if (form.password !== form.confirmPassword) {
    alert("Passwords don't match")
    return
  }
  if (!form.terms) {
    alert("Please agree to the Terms of Service")
    return
  }
  
  isLoading.value = true
  // Mock API call
  await new Promise(resolve => setTimeout(resolve, 500))
  console.log('Sign up payload:', form)
  isLoading.value = false
}
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Left Panel (Brand & Info) -->
    <div class="hidden lg:flex w-[48%] relative">
      <div class="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-bg)] opacity-50 z-0"></div>
      <div class="relative z-10 w-full">
        <AuthBrandPanel mode="signup" />
      </div>
    </div>

    <!-- Right Panel (Form) -->
    <div class="flex-1 flex flex-col justify-center items-center p-6 sm:p-8 w-full lg:w-[52%] overflow-y-auto">
      
      <!-- Mobile Logo -->
      <div class="lg:hidden flex items-center gap-2 mb-6 mt-4">
        <div class="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white shadow-sm">
          <UIcon name="i-lucide-sparkles" class="w-5 h-5" />
        </div>
        <span class="text-xl font-bold tracking-tight text-[var(--color-text)]">Planify AI</span>
      </div>

      <div class="w-full max-w-[440px] animate-slide-up mt-4 mb-8 lg:my-8">
        
        <!-- Registration Form Card -->
        <div class="soft-card p-8 sm:p-10 mb-6">
          <div class="mb-8 text-center">
            <h2 class="text-2xl font-bold text-[var(--color-text)] mb-2">Create your account</h2>
            <p class="text-sm text-[var(--color-text-muted)]">Start your journey to smarter studying.</p>
          </div>

          <form @submit.prevent="onSubmit" class="space-y-4">
            <!-- Full Name -->
            <UFormGroup label="Full name" name="fullName">
              <UInput 
                v-model="form.fullName" 
                icon="i-lucide-user" 
                placeholder="Enter your full name" 
                required 
                size="md"
              />
            </UFormGroup>

            <!-- Email -->
            <UFormGroup label="Email address" name="email">
              <UInput 
                v-model="form.email" 
                type="email" 
                icon="i-lucide-mail" 
                placeholder="Enter your email" 
                required 
                size="md"
              />
            </UFormGroup>

            <!-- Password -->
            <UFormGroup 
              label="Password" 
              name="password"
              hint="Use at least 8 characters with a mix of letters, numbers & symbols."
              :ui="{ hint: 'text-[11px] text-[var(--color-text-muted)] mt-1 block w-full leading-tight' }"
            >
              <UInput 
                v-model="form.password" 
                :type="showPassword ? 'text' : 'password'" 
                icon="i-lucide-lock" 
                placeholder="Create a password" 
                required
                size="md"
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

            <!-- Confirm Password -->
            <UFormGroup label="Confirm password" name="confirmPassword">
              <UInput 
                v-model="form.confirmPassword" 
                :type="showConfirmPassword ? 'text' : 'password'" 
                icon="i-lucide-lock" 
                placeholder="Confirm your password" 
                required
                size="md"
                :ui="{ icon: { trailing: { pointer: '' } } }"
              >
                <template #trailing>
                  <UButton
                    color="gray"
                    variant="link"
                    :icon="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    :padded="false"
                    @click="showConfirmPassword = !showConfirmPassword"
                    class="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  />
                </template>
              </UInput>
            </UFormGroup>

            <!-- Role Select -->
            <UFormGroup label="I'm a..." name="role">
              <USelect 
                v-model="form.role" 
                :options="roleOptions"
                size="md"
                icon="i-lucide-briefcase"
              />
            </UFormGroup>

            <!-- Terms -->
            <div class="pt-2">
              <UCheckbox v-model="form.terms" name="terms" required>
                <template #label>
                  <span class="text-sm text-[var(--color-text)]">
                    I agree to the <a href="#" class="text-[var(--color-primary)] hover:underline">Terms of Service</a> and <a href="#" class="text-[var(--color-primary)] hover:underline">Privacy Policy</a>
                  </span>
                </template>
              </UCheckbox>
            </div>

            <!-- Submit -->
            <UButton 
              type="submit" 
              color="primary" 
              block 
              size="lg" 
              class="mt-6 font-semibold"
              :loading="isLoading"
              icon="i-lucide-sparkles"
            >
              Create account
            </UButton>

            <!-- Divider -->
            <div class="relative my-5 flex items-center">
              <div class="flex-grow border-t border-[var(--color-border)]"></div>
              <span class="flex-shrink-0 mx-4 text-xs text-[var(--color-text-muted)] uppercase tracking-wider">or</span>
              <div class="flex-grow border-t border-[var(--color-border)]"></div>
            </div>

            <!-- Google Sign Up -->
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

          <!-- Footer link -->
          <p class="text-center mt-6 text-sm text-[var(--color-text-muted)]">
            Already have an account? 
            <NuxtLink to="/auth/signin" class="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors">
              Sign in
            </NuxtLink>
          </p>
        </div>

        <!-- Free Trial Banner -->
        <div class="ai-card p-5 bg-[var(--color-surface)] flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-[var(--color-ai)]/10 flex items-center justify-center flex-shrink-0 text-[var(--color-ai)]">
            <UIcon name="i-lucide-gift" class="w-5 h-5" />
          </div>
          <div class="flex-1">
            <h4 class="text-sm font-bold text-[var(--color-text)] mb-0.5">Start free for 1 month</h4>
            <p class="text-xs text-[var(--color-text-muted)]">Get full access to all AI features and 10,000 starter tokens.</p>
          </div>
          <UIcon name="i-lucide-sparkles" class="w-4 h-4 text-[var(--color-ai)]/40 absolute bottom-3 right-3" />
          <UIcon name="i-lucide-sparkles" class="w-6 h-6 text-[var(--color-ai)]/20 absolute top-2 right-6" />
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles */
</style>
