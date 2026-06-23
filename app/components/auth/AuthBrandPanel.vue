<script setup lang="ts">
import { computed } from 'vue'
import AuthWorkspaceIllustration from './AuthWorkspaceIllustration.vue'

const props = defineProps<{
  mode: 'signin' | 'signup'
}>()

const features = [
  {
    icon: 'i-lucide-sparkles',
    title: 'AI Study Plans',
    description: 'Personalized plans that adapt to you.',
    bgClass: 'bg-gradient-to-br from-indigo-500 to-purple-600'
  },
  {
    icon: 'i-lucide-calendar',
    title: 'Smart Scheduling',
    description: 'Optimize your time with intelligent slots.',
    bgClass: 'bg-gradient-to-br from-blue-500 to-indigo-600'
  },
  {
    icon: 'i-lucide-target',
    title: 'Stay Focused',
    description: 'Built-in focus timers and progress tracking.',
    bgClass: 'bg-gradient-to-br from-pink-500 to-rose-600'
  },
  {
    icon: 'i-lucide-bar-chart-3',
    title: 'Track Progress',
    description: 'See insights and improve every day.',
    bgClass: 'bg-gradient-to-br from-cyan-500 to-blue-600'
  }
]
</script>

<template>
  <div class="flex h-full w-full flex-col justify-between py-12 px-8 lg:px-12 xl:py-16 xl:px-20 text-[var(--color-text)]">
    <!-- Top Hero Text -->
    <div class="w-full flex flex-col">
      <div class="animate-slide-up" style="animation-delay: 100ms">
        <h1 class="text-[2.6rem] font-extrabold leading-[1.1] tracking-tight text-[var(--color-text)] xl:text-[3.25rem]">
          <span class="text-[var(--color-primary)]">Smarter</span> planning.<br>
          <span class="text-[var(--color-primary)] font-extrabold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-ai)] bg-clip-text text-transparent">Better</span> results.
        </h1>
        <p class="mt-4 max-w-[28rem] text-[0.95rem] leading-[1.6] text-[var(--color-text-muted)] xl:text-[1.05rem]">
          Planify AI helps students plan, focus, and achieve more with AI-powered study plans.
        </p>
      </div>
    </div>

    <!-- Middle: Features List & Workspace Illustration split -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-8 items-center mt-6 w-full h-full relative">
      <!-- Features List (Left 5 cols on large desktop) -->
      <div class="xl:col-span-5 flex flex-col gap-6 animate-slide-up" style="animation-delay: 200ms">
        <div v-for="(feature, idx) in features" :key="idx" class="flex items-start gap-4">
          <div :class="['w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm shrink-0', feature.bgClass]">
            <UIcon :name="feature.icon" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-[0.98rem] font-semibold text-[var(--color-text)]">{{ feature.title }}</h3>
            <p class="text-[0.88rem] leading-[1.5] text-[var(--color-text-muted)] mt-0.5">{{ feature.description }}</p>
          </div>
        </div>
      </div>

      <!-- Workspace Illustration (Right 7 cols on large desktop) -->
      <div class="xl:col-span-7 flex justify-center items-center w-full h-full relative min-h-[480px] xl:min-h-0 animate-slide-up" style="animation-delay: 300ms">
        <AuthWorkspaceIllustration />
      </div>
    </div>
  </div>
</template>
