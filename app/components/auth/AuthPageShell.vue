<script setup lang="ts">
defineProps<{
  mode: 'signin' | 'signup'
  title: string
  subtitle: string
  align?: 'center' | 'start'
}>()
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-5 min-h-screen w-full">
    <!-- Left Column (Visuals/Marketing) - 60% Width -->
    <div class="lg:col-span-3 relative hidden border-r border-[#cbd5e1]/40 lg:flex bg-gradient-to-br from-[#f7f5ff] via-[#eef2ff] to-[#fafbff]">
      <!-- Subtle decorative background shapes -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-[20%] left-[10%] w-72 h-72 bg-purple-200/25 rounded-full filter blur-3xl" />
        <div class="absolute bottom-[20%] right-[10%] w-96 h-96 bg-indigo-100/30 rounded-full filter blur-3xl" />
        <div class="absolute top-1/4 right-1/4 w-2 h-2 bg-purple-400/40 rounded-full filter blur-sm animate-pulse" />
        <div class="absolute bottom-1/3 left-1/3 w-3.5 h-3.5 bg-indigo-300/30 rounded-full filter blur-xs" />
      </div>
      <div class="relative z-10 w-full flex justify-center items-center">
        <AuthBrandPanel :mode="mode" />
      </div>
    </div>

    <!-- Right Column (Forms) - 40% Width -->
    <div
      class="lg:col-span-2 flex w-full justify-center px-6 py-8 sm:px-8 lg:px-10 xl:px-14 bg-[#fafbff]"
      :class="align === 'start' ? 'items-start lg:pt-12 lg:pb-16' : 'items-center'"
    >
      <div
        class="w-full animate-slide-up"
        :class="mode === 'signin' ? 'max-w-[540px]' : 'max-w-[530px]'"
      >
        <!-- Card container -->
        <div
          class="border border-[#e5e7eb] bg-white shadow-[0_10px_35px_rgba(15,23,42,0.03)]"
          :class="mode === 'signin' ? 'auth-card-signin' : 'rounded-[1.8rem] px-7 py-7 sm:px-10 sm:py-9'"
        >
          <div
            class="text-center"
            :class="mode === 'signin' ? 'auth-card-heading-signin' : 'mb-6 sm:mb-7'"
          >
            <!-- Planify AI Logo at the top of the card for signin mode -->
            <div v-if="mode === 'signin'" class="mb-6 flex items-center justify-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white shadow-sm">
                <UIcon
                  name="i-lucide-sparkles"
                  class="w-5 h-5"
                />
              </div>
              <span class="text-xl font-bold tracking-tight text-[#0f172a]">Planify AI</span>
            </div>

            <!-- Page Title -->
            <h1
              class="font-extrabold text-[#0f172a]"
              :class="mode === 'signin' ? 'auth-title-signin' : 'mb-2 text-[1.8rem] sm:text-[2.35rem]'"
            >
              {{ title }}
            </h1>
            
            <!-- Subtitle -->
            <p
              class="text-[#475569]"
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
  border-radius: 30px;
  padding: 44px 48px;
}

.auth-card-heading-signin {
  margin-bottom: 30px;
}

.auth-title-signin {
  margin-bottom: 10px;
  font-size: 32px;
  letter-spacing: -0.5px;
}

.auth-subtitle-signin {
  font-size: 15px;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .auth-card-signin {
    padding: 30px 24px;
    border-radius: 24px;
  }

  .auth-title-signin {
    font-size: 26px;
  }
}
</style>
