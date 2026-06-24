<script setup lang="ts">
import { computed } from 'vue'

definePageMeta({
  layout: 'auth'
})

const route = useRoute()

const email = computed(() => {
  const value = route.query.email
  return typeof value === 'string' && value.trim() ? value : 'your email address'
})
</script>

<template>
  <AuthPageShell
    mode="signin"
    title="Check your inbox"
    subtitle="We sent a verification link to your email address."
    align="start"
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

    <div class="verification-wrap">
      <h2 class="verification-title">
        Verify your inbox
      </h2>

      <p class="verification-copy">
        An email has been sent to <strong>{{ email }}</strong>. Follow the instructions in that message to continue.
      </p>

      <p class="verification-copy verification-copy-soft">
        If you do not see it, check your spam folder or request a new link.
      </p>

      <div class="verification-actions">
        <button
          type="button"
          class="verification-link"
        >
          Resend link
        </button>

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
.verification-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
  padding-top: 4px;
}

.verification-icon {
  display: flex;
  height: 56px;
  width: 56px;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: linear-gradient(180deg, #4f46e5 0%, #7c3aed 100%);
  box-shadow: 0 8px 18px rgba(79, 70, 229, 0.2);
}

.verification-icon-mark {
  width: 28px;
  height: 28px;
  color: #ffffff;
}

.verification-title {
  color: #0f172a;
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.verification-copy {
  max-width: 34rem;
  color: #0f172a;
  font-size: 0.98rem;
  line-height: 1.45;
}

.verification-copy-soft {
  color: #334155;
}

.verification-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding-top: 12px;
}

.verification-link {
  color: #0f4fe0;
  font-size: 0.98rem;
  font-weight: 600;
  transition: color var(--transition-fast) var(--ease-out);
}

.verification-link:hover {
  color: #7c3aed;
}

.verification-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 8px;
  border: 1.5px solid #0f4fe0;
  color: #0f4fe0;
  font-weight: 600;
  transition: background var(--transition-fast) var(--ease-out), color var(--transition-fast) var(--ease-out), border-color var(--transition-fast) var(--ease-out);
}

.verification-back:hover {
  background: rgba(15, 79, 224, 0.06);
  border-color: #7c3aed;
  color: #7c3aed;
}
</style>
