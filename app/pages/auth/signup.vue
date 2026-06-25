<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

definePageMeta({
  layout: 'auth'
})

const { saveAuthToken } = useAuth()
const { signUpWithEmail, signInWithGoogle } = useFirebaseAuth()

const form = reactive({
  fullName: '',
  email: '',
  password: '',
  role: 'Student',
  terms: false
})

const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')
const passwordFocused = ref(false)
const passwordInteracted = ref(false)
const passwordWrapRef = ref<HTMLElement | null>(null)
const roleMenuOpen = ref(false)
const roleWrapRef = ref<HTMLElement | null>(null)

const roleOptions = ['Student', 'Worker', 'Freelancer', 'Entrepreneur']

const passwordStrength = computed(() => {
  const value = form.password
  let score = 0

  if (value.length >= 10) score += 1
  if (/[a-z]/.test(value)) score += 1
  if (/[A-Z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1

  if (!value) {
    return { label: '', width: '0%', tone: 'neutral' as const }
  }

  if (score <= 2) return { label: 'Weak', width: '35%', tone: 'danger' as const }
  if (score === 3) return { label: 'Medium', width: '68%', tone: 'warning' as const }
  return { label: 'Strong', width: '100%', tone: 'success' as const }
})

const passwordChecks = computed(() => [
  { label: 'At least 10 characters', ok: form.password.length >= 10 },
  { label: 'One lowercase letter', ok: /[a-z]/.test(form.password) },
  { label: 'One uppercase letter', ok: /[A-Z]/.test(form.password) },
  { label: 'One number', ok: /\d/.test(form.password) }
])

const showPasswordDropdown = computed(() => {
  return passwordInteracted.value && passwordFocused.value && form.password.length > 0
})

const closePasswordDropdown = (event: MouseEvent | PointerEvent) => {
  const target = event.target

  if (!(target instanceof Node)) return
  if (passwordWrapRef.value?.contains(target)) return

  passwordFocused.value = false
}

const handlePasswordFocusOut = (event: FocusEvent) => {
  const nextTarget = event.relatedTarget

  if (nextTarget instanceof Node && passwordWrapRef.value?.contains(nextTarget)) {
    return
  }

  passwordFocused.value = false
}

const closeRoleMenu = (event: MouseEvent | PointerEvent) => {
  const target = event.target

  if (!(target instanceof Node)) return
  if (roleWrapRef.value?.contains(target)) return

  roleMenuOpen.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', closePasswordDropdown)
  document.addEventListener('pointerdown', closeRoleMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closePasswordDropdown)
  document.removeEventListener('pointerdown', closeRoleMenu)
})

const onGoogleClick = async () => {
  errorMessage.value = ''
  infoMessage.value = ''
  isLoading.value = true

  try {
    const response = await signInWithGoogle(true)
    saveAuthToken(response.token)
    await navigateTo('/dashboard')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to sign up with Google.'
  } finally {
    isLoading.value = false
  }
}

const onSubmit = async () => {
  if (!form.fullName || !form.email || !form.password || isLoading.value) return

  errorMessage.value = ''

  if (form.password.length < 10) {
    errorMessage.value = 'Password must be at least 10 characters.'
    return
  }

  if (!form.terms) {
    errorMessage.value = 'Please agree to the Terms of Service and Privacy Policy.'
    return
  }

  isLoading.value = true
  try {
    const response = await signUpWithEmail(
      form.email.trim().toLowerCase(),
      form.password,
      form.fullName,
      true
    )
    saveAuthToken(response.token)
    await navigateTo('/dashboard')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to create your account. Please try again.'
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
    <form
      class="signup-form"
      @submit.prevent="onSubmit"
    >
      <div
        v-if="errorMessage"
        class="signup-alert signup-alert-error"
      >
        <UIcon
          name="i-lucide-circle-alert"
          class="signup-alert-icon"
        />
        <span>{{ errorMessage }}</span>
      </div>

      <div
        v-if="infoMessage"
        class="signup-alert signup-alert-info animate-fade-in"
      >
        <UIcon
          name="i-lucide-info"
          class="signup-alert-icon"
        />
        <span>{{ infoMessage }}</span>
      </div>

      <label class="block space-y-2.5">
        <span class="signup-label">Full name</span>
        <div class="signup-input">
          <UIcon
            name="i-lucide-user"
            class="signup-input-icon"
          />
          <input
            v-model="form.fullName"
            type="text"
            required
            placeholder="Enter your full name"
            class="signup-input-control"
          >
        </div>
      </label>

      <label class="block space-y-2.5">
        <span class="signup-label">Email address</span>
        <div class="signup-input">
          <UIcon
            name="i-lucide-mail"
            class="signup-input-icon"
          />
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="Enter your email"
            class="signup-input-control"
          >
        </div>
      </label>

      <label class="block space-y-2.5">
        <span class="signup-label">Password</span>
        <div
          ref="passwordWrapRef"
          class="signup-password-wrap"
          @pointerdown="passwordInteracted = true"
          @focusin="passwordFocused = true"
          @focusout="handlePasswordFocusOut"
        >
          <div class="signup-input">
            <UIcon
              name="i-lucide-lock"
              class="signup-input-icon"
            />
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
              placeholder="Create a password"
              class="signup-input-control"
            >
            <button
              type="button"
              class="signup-icon-button"
              @mousedown.prevent
              @click="showPassword = !showPassword"
            >
              <UIcon
                :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                class="signup-input-icon"
              />
            </button>
          </div>

          <Transition name="password-dropdown">
            <div
              v-if="showPasswordDropdown"
              class="signup-password-card"
            >
              <div class="signup-password-head">
                <span>Choose a password</span>
                <span
                  class="signup-password-label"
                  :class="`is-${passwordStrength.tone}`"
                >
                  {{ passwordStrength.label || 'Typing...' }}
                </span>
              </div>
              <div class="signup-password-bar">
                <div
                  class="signup-password-bar-fill"
                  :class="`is-${passwordStrength.tone}`"
                  :style="{ width: passwordStrength.width }"
                />
              </div>
              <p class="signup-password-subtitle">
                Suggestions
              </p>
              <ul class="signup-password-list">
                <li
                  v-for="check in passwordChecks"
                  :key="check.label"
                  :class="check.ok ? 'is-ok' : ''"
                >
                  {{ check.label }}
                </li>
              </ul>
            </div>
          </Transition>
        </div>
      </label>

      <label class="block space-y-2.5">
        <span class="signup-label">I'm a...</span>
        <div
          ref="roleWrapRef"
          class="signup-input signup-select-wrap"
        >
          <UIcon
            name="i-lucide-graduation-cap"
            class="signup-input-icon"
          />
          <button
            type="button"
            class="signup-select-trigger"
            :aria-expanded="roleMenuOpen"
            aria-haspopup="listbox"
            @click="roleMenuOpen = !roleMenuOpen"
          >
            <span class="signup-select-value">{{ form.role }}</span>
            <UIcon
              name="i-lucide-chevron-down"
              class="signup-select-chevron"
            />
          </button>

          <Transition name="role-dropdown">
            <div
              v-if="roleMenuOpen"
              class="signup-role-menu"
              role="listbox"
              aria-label="Select your role"
            >
              <button
                v-for="option in roleOptions"
                :key="option"
                type="button"
                class="signup-role-option"
                :class="{ 'is-active': form.role === option }"
                role="option"
                :aria-selected="form.role === option"
                @click="form.role = option; roleMenuOpen = false"
              >
                {{ option }}
              </button>
            </div>
          </Transition>
        </div>
      </label>

      <label class="signup-terms">
        <input
          v-model="form.terms"
          type="checkbox"
          required
          class="signup-checkbox"
        >
        <span>
          I agree to the
          <a
            href="#"
            class="text-[var(--color-primary)] hover:underline"
          >Terms of Service</a>
          and
          <a
            href="#"
            class="text-[var(--color-primary)] hover:underline"
          >Privacy Policy</a>
        </span>
      </label>

      <button
        type="submit"
        class="signup-submit"
        :disabled="isLoading"
      >
        <UIcon
          name="i-lucide-sparkles"
          class="signup-submit-icon"
        />
        <span>{{ isLoading ? 'Creating account...' : 'Create account' }}</span>
      </button>

      <div class="signup-divider">
        <div />
        <span>or</span>
        <div />
      </div>

      <button
        type="button"
        class="signup-google"
        :disabled="isLoading"
        @click="onGoogleClick"
      >
        <svg
          class="signup-google-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M21.805 12.226c0-.783-.07-1.536-.198-2.266H12v4.293h5.507a4.714 4.714 0 0 1-2.047 3.094v2.569h3.31c1.934-1.782 3.035-4.41 3.035-7.69z"
          />
          <path
            fill="#34A853"
            d="M12 22c2.77 0 5.094-.918 6.792-2.486l-3.31-2.569c-.918.616-2.093.983-3.482.983-2.67 0-4.935-1.802-5.742-4.226H2.825v2.654A10 10 0 0 0 12 22z"
          />
          <path
            fill="#FBBC05"
            d="M6.258 13.702A5.99 5.99 0 0 1 6.1 12c0-.592.102-1.165.286-1.702V7.644H2.825A10 10 0 0 0 2 12c0 1.594.38 3.1 1.044 4.456l3.214-2.754z"
          />
          <path
            fill="#EA4335"
            d="M12 5.982c1.508 0 2.86.518 3.927 1.536l2.944-2.944C17.09 2.905 14.767 2 12 2a9.97 9.97 0 0 0-9.175 5.644l3.433 2.656C7.065 7.784 9.33 5.982 12 5.982z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      <p class="pt-0.5 text-center text-[12px] text-[var(--color-text-muted)]">
        Already have an account?
        <NuxtLink
          to="/auth/signin"
          class="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
        >
          Sign in
        </NuxtLink>
      </p>
    </form>
  </AuthPageShell>
</template>

<style scoped>
.signup-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.signup-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14.5px;
  line-height: 1.5;
}

.signup-alert-error {
  border: 1px solid color-mix(in srgb, var(--color-danger) 20%, transparent);
  background: color-mix(in srgb, var(--color-danger) 8%, var(--color-card-bg));
  color: color-mix(in srgb, var(--color-danger) 85%, var(--color-text));
}

.signup-alert-info {
  border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
  background: color-mix(in srgb, var(--color-primary) 8%, var(--color-card-bg));
  color: var(--color-primary);
}

.signup-alert-icon {
  width: 18px;
  height: 18px;
  margin-top: 2.5px;
  flex-shrink: 0;
}

.signup-label {
  display: block;
  margin-bottom: 8px;
  color: #475569;
  font-size: 14px;
  font-weight: 600;
}

.signup-input {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  padding: 0 18px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.01);
  transition: border-color var(--transition-fast) var(--ease-out), box-shadow var(--transition-fast) var(--ease-out);
}

.signup-input:focus-within {
  border-color: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1), inset 0 1px 2px rgba(15, 23, 42, 0.01);
}

.signup-input-icon {
  width: 20px;
  height: 20px;
  color: #94a3b8;
  flex-shrink: 0;
}

.signup-input-control {
  width: 100%;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #0f172a;
  font-size: 14px;
}

.signup-input-control::placeholder {
  color: #94a3b8;
  opacity: 0.85;
}

.signup-select-wrap {
  position: relative;
  overflow: visible;
}

.signup-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 0;
  background: transparent;
  color: #0f172a;
  cursor: pointer;
  text-align: left;
}

.signup-select-value {
  min-width: 0;
  flex: 1;
  font-size: 14px;
  color: #0f172a;
}

.signup-select-chevron {
  width: 18px;
  height: 18px;
  color: #94a3b8;
  flex-shrink: 0;
  pointer-events: none;
}

.signup-role-menu {
  position: absolute;
  left: -1px;
  right: -1px;
  top: calc(100% + 2px);
  z-index: 40;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  border-radius: 0 0 10px 10px;
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.14);
}

.signup-role-option {
  display: flex;
  width: 100%;
  align-items: center;
  min-height: 36px;
  padding: 8px 18px;
  color: #0f172a;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.signup-role-option:hover,
.signup-role-option.is-active {
  background: #dbeafe;
  color: #1d4ed8;
}

.role-dropdown-enter-active,
.role-dropdown-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}

.role-dropdown-enter-from,
.role-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.role-dropdown-enter-to,
.role-dropdown-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.signup-icon-button {
  display: inline-flex;
  padding: 4px;
  color: #94a3b8;
  transition: color var(--transition-fast) var(--ease-out);
}

.signup-icon-button:hover {
  color: #475569;
}

.signup-password-card {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 30;
  border: 1px solid #e2e8f0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-radius: 0 0 14px 14px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  padding: 14px 16px 16px;
}

.signup-password-wrap {
  position: relative;
  overflow: visible;
}

.signup-password-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
}

.signup-password-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.signup-password-label.is-danger {
  color: #dc2626;
}

.signup-password-label.is-warning {
  color: #d97706;
}

.signup-password-label.is-success {
  color: #16a34a;
}

.signup-password-label.is-neutral {
  color: #64748b;
}

.signup-password-bar {
  margin-top: 10px;
  height: 8px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.signup-password-bar-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 180ms ease, background-color 180ms ease;
}

.signup-password-bar-fill.is-danger {
  background: linear-gradient(90deg, #ef4444, #fb7185);
}

.signup-password-bar-fill.is-warning {
  background: linear-gradient(90deg, #f59e0b, #facc15);
}

.signup-password-bar-fill.is-success {
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
}

.signup-password-subtitle {
  margin-top: 12px;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
}

.signup-password-list {
  margin: 8px 0 0;
  padding-left: 18px;
  color: #1e293b;
  font-size: 13px;
  line-height: 1.55;
}

.signup-password-list li {
  margin-top: 2px;
}

.signup-password-list li.is-ok {
  color: #16a34a;
}

.password-dropdown-enter-active,
.password-dropdown-leave-active {
  transition: opacity 140ms ease, transform 140ms ease;
}

.password-dropdown-enter-from,
.password-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scaleY(0.98);
}

.password-dropdown-enter-to,
.password-dropdown-leave-from {
  opacity: 1;
  transform: translateY(0) scaleY(1);
}

.signup-terms {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-top: 4px;
  color: #0f172a;
  font-size: 14px;
  line-height: 1.5;
}

.signup-checkbox {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  border-radius: 6px;
  accent-color: #4f46e5;
  cursor: pointer;
  flex-shrink: 0;
}

.signup-submit {
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
}

.signup-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.35);
}

.signup-submit:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.signup-submit-icon {
  width: 18px;
  height: 18px;
}

.signup-divider {
  display: flex;
  align-items: center;
  gap: 20px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
}

.signup-divider div {
  height: 1px;
  flex: 1;
  background: #e2e8f0;
}

.signup-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 40px;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast) var(--ease-out), border-color var(--transition-fast) var(--ease-out), color var(--transition-fast) var(--ease-out), box-shadow var(--transition-fast) var(--ease-out), transform var(--transition-fast) var(--ease-out);
}

.signup-google:hover {
  background: linear-gradient(90deg, rgba(79, 70, 229, 0.06), rgba(124, 58, 237, 0.06));
  border-color: #7c3aed;
  color: #4f46e5;
  box-shadow: 0 8px 18px rgba(79, 70, 229, 0.12);
}

.signup-google-icon {
  width: 21px;
  height: 21px;
  flex-shrink: 0;
}
</style>
