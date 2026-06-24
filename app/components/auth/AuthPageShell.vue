<script setup lang="ts">
defineProps<{
  mode: 'signin' | 'signup'
  title: string
  subtitle: string
  align?: 'center' | 'start'
}>()
</script>

<template>
  <div class="flex min-h-screen w-full flex-col">
    <div class="grid flex-1 grid-cols-1 lg:grid-cols-2">
      <!-- Left Column (Visuals/Marketing) -->
      <div class="relative hidden border-r border-[#cbd5e1]/40 bg-gradient-to-br from-[#f7f5ff] via-[#eef2ff] to-[#fafbff] lg:flex">
        <div class="relative z-10 flex h-full w-full flex-col px-8 pt-6">
          <div class="flex items-center gap-3 pb-0">
            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white shadow-sm">
              <UIcon
                name="i-lucide-sparkles"
                class="h-6 w-6"
              />
            </div>
            <span class="text-[1.75rem] font-bold tracking-tight text-[#0f172a]">
              Planify AI
            </span>
          </div>

          <div class="relative flex flex-1 items-center justify-center">
            <!-- Subtle decorative background shapes -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
              <div class="absolute top-[20%] left-[10%] w-72 h-72 bg-purple-200/25 rounded-full filter blur-3xl" />
              <div class="absolute bottom-[20%] right-[10%] w-96 h-96 bg-indigo-100/30 rounded-full filter blur-3xl" />
              <div class="absolute top-1/4 right-1/4 w-2 h-2 bg-purple-400/40 rounded-full filter blur-sm animate-pulse" />
              <div class="absolute bottom-1/3 left-1/3 w-3.5 h-3.5 bg-indigo-300/30 rounded-full filter blur-xs" />
            </div>
            <AuthBrandPanel :mode="mode" />
          </div>
        </div>
      </div>

      <!-- Right Column (Forms) -->
      <div
        class="flex w-full justify-center bg-[#fafbff] px-8 py-8 sm:px-10 lg:px-12 xl:px-16"
        :class="align === 'start' ? 'items-start lg:pt-12 lg:pb-12' : 'items-center'"
      >
        <div
          class="w-full animate-slide-up px-6 sm:px-12 lg:px-14 xl:px-18"
          :class="mode === 'signin' ? 'max-w-[680px]' : 'max-w-[680px]'"
        >
          <div
            class="text-center"
            :class="mode === 'signin' ? 'auth-card-heading-signin' : 'auth-card-heading-signin'"
          >
            <slot name="header-top" />
            <h1
              class="font-extrabold text-[#0f172a]"
              :class="mode === 'signin' ? 'auth-title-signin' : 'auth-title-signin'"
            >
              {{ title }}
            </h1>
            <p
              class="text-[#475569]"
              :class="mode === 'signin' ? 'auth-subtitle-signin' : 'auth-subtitle-signin'"
            >
              {{ subtitle }}
            </p>
          </div>

          <slot />

          <slot name="after-card" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-card-signin {
  border-radius: 0;
  padding: 0;
}

.auth-card-heading-signin {
  margin-bottom: 30px;
}

.auth-title-signin {
  margin-bottom: 4px;
  font-size: 2rem;
  letter-spacing: -0.5px;
}

.auth-subtitle-signin {
  font-size: 1rem;
  line-height: 1.45;
}

@media (max-width: 640px) {
  .auth-title-signin {
    font-size: 2.125rem;
  }
}
</style>
