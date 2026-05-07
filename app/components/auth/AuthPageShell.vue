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
      <div class="w-full max-w-[530px] animate-slide-up">
        <div class="mb-7 flex items-center justify-center gap-3 lg:hidden">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white shadow-sm">
            <UIcon name="i-lucide-sparkles" class="h-5 w-5" />
          </div>
          <span class="text-2xl font-bold tracking-tight text-[var(--color-text)]">Planify AI</span>
        </div>

        <div class="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card-bg)] px-7 py-8 shadow-[var(--shadow-card)] sm:px-11 sm:py-10">
          <div class="mb-7 text-center sm:mb-8">
            <h1 class="mb-2 text-[1.85rem] font-extrabold leading-none text-[var(--color-text)] sm:text-[2.45rem]">{{ title }}</h1>
            <p class="text-[0.94rem] text-[var(--color-text-muted)]">{{ subtitle }}</p>
          </div>

          <slot />
        </div>

        <slot name="after-card" />
      </div>
    </div>
  </div>
</template>
