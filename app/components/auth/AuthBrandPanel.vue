<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  mode: 'signin' | 'signup'
}>()

const content = computed(() => {
  if (props.mode === 'signin') {
    return {
      headlineParts: ['Smarter studying.', 'Better results.'],
      description: 'Planify AI helps you organize your study life, stay productive, and achieve your goals with AI.',
      features: [
        {
          icon: 'i-lucide-sparkles',
          title: 'AI-powered planning',
          description: 'Get personalized plans and smart suggestions.',
          tone: 'ai' as const
        },
        {
          icon: 'i-lucide-calendar',
          title: 'Stay organized',
          description: 'Manage classes, tasks, exams, and files in one place.',
          tone: 'success' as const
        },
        {
          icon: 'i-lucide-trending-up',
          title: 'Track your progress',
          description: 'Analyze productivity and build better habits.',
          tone: 'warning' as const
        }
      ]
    }
  }

  return {
    headlineParts: ['Study smarter.', 'Achieve more.'],
    description: 'Join thousands of students using AI to plan, study, and succeed every day.',
    features: [
      {
        icon: 'i-lucide-sparkles',
        title: 'AI-powered study plans',
        description: 'Get personalized plans that adapt to your courses, goals, and schedule.',
        tone: 'ai' as const
      },
      {
        icon: 'i-lucide-book-open',
        title: 'Summarize & understand',
        description: 'Instant AI summaries help you learn faster and focus on what matters.',
        tone: 'success' as const
      },
      {
        icon: 'i-lucide-check-circle',
        title: 'Smart task organization',
        description: 'Keep track of deadlines, tasks, and priorities in one focused workspace.',
        tone: 'warning' as const
      }
    ]
  }
})
</script>

<template>
  <div class="h-full flex flex-col justify-center max-w-xl mx-auto py-12 px-6 lg:px-12 w-full">
    <!-- Brand -->
    <div class="flex items-center gap-2 mb-10">
      <div class="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white shadow-sm">
        <UIcon name="i-lucide-sparkles" class="w-5 h-5" />
      </div>
      <span class="text-xl font-bold tracking-tight text-[var(--color-text)]">Planify AI</span>
    </div>

    <!-- Hero Text -->
    <div class="mb-10 animate-slide-up" style="animation-delay: 100ms">
      <h1 class="text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-text)] leading-tight mb-4">
        {{ content.headlineParts[0] }}<br />
        <span class="text-[var(--color-primary)]">{{ content.headlineParts[1] }}</span>
      </h1>
      <p class="text-lg text-[var(--color-text-muted)] max-w-md leading-relaxed">
        {{ content.description }}
      </p>
    </div>

    <!-- Preview Card -->
    <div class="mb-12 animate-slide-up" style="animation-delay: 200ms">
      <AuthPreviewCard />
    </div>

    <!-- Benefits -->
    <div class="flex flex-col gap-6 animate-slide-up" style="animation-delay: 300ms">
      <AuthFeatureItem 
        v-for="(feature, idx) in content.features" 
        :key="idx"
        :icon="feature.icon"
        :title="feature.title"
        :description="feature.description"
        :tone="feature.tone"
      />
    </div>
  </div>
</template>
