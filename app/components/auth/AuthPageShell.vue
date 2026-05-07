<script setup lang="ts">
defineProps<{
  mode: 'signin' | 'signup'
  title: string
  subtitle: string
  align?: 'center' | 'start'
}>()
</script>

<template>
  <div class="mx-auto flex min-h-screen w-full max-w-[1460px]">
    <div class="relative hidden w-1/2 border-r border-[color-mix(in_srgb,var(--color-primary)_6%,transparent)] lg:flex">
      <div class="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-soft)] via-transparent to-transparent opacity-70" />
      <div class="relative z-10 w-full">
        <AuthBrandPanel :mode="mode" />
      </div>
    </div>

    <div
      class="flex w-full flex-1 justify-center px-6 py-8 sm:px-8 lg:w-1/2 lg:px-10 xl:px-14"
      :class="align === 'start' ? 'items-start lg:pt-8' : 'items-center'"
    >
      <div
        class="w-full animate-slide-up"
        :class="mode === 'signin' ? 'max-w-[560px]' : 'max-w-[530px]'"
      >
        <div class="mb-7 flex items-center justify-center gap-3 lg:hidden">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white shadow-sm">
            <UIcon name="i-lucide-sparkles" class="h-5 w-5" />
          </div>
          <span class="text-2xl font-bold tracking-tight text-[var(--color-text)]">Planify AI</span>
        </div>

        <div
          class="border border-[var(--color-border)] bg-[var(--color-card-bg)] shadow-[var(--shadow-card)]"
          :class="mode === 'signin' ? 'auth-card-signin' : 'rounded-[1.8rem] px-7 py-7 sm:px-10 sm:py-9'"
        >
          <div
            class="text-center"
            :class="mode === 'signin' ? 'auth-card-heading-signin' : 'mb-6 sm:mb-7'"
          >
            <h1
              class="font-extrabold leading-none text-[var(--color-text)]"
              :class="mode === 'signin' ? 'auth-title-signin' : 'mb-2 text-[1.8rem] sm:text-[2.35rem]'"
            >
              {{ title }}
            </h1>
            <p
              class="text-[var(--color-text-muted)]"
              :class="mode === 'signin' ? 'auth-subtitle-signin' : 'text-[0.92rem]'"
            >
              {{ subtitle }}
            </p>
          </div>

          <slot />
        </div>

        <slot name="after-card" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-card-signin {
  border-radius: 18px;
  padding: 52px 54px 48px;
}

.auth-card-heading-signin {
  margin-bottom: 34px;
}

.auth-title-signin {
  margin-bottom: 12px;
  font-size: 34px;
}

.auth-subtitle-signin {
  font-size: 16px;
}

@media (max-width: 640px) {
  .auth-card-signin {
    padding: 34px 24px;
  }

  .auth-title-signin {
    font-size: 30px;
  }
}
</style>
