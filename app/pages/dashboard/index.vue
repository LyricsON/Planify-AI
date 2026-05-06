<script setup lang="ts">
definePageMeta({
  layout: 'dashboard'
})

const stats = [
  {
    title: 'Classes Today',
    value: '3',
    subtitle: 'Next: Math - 10:00 AM',
    icon: 'i-lucide-book-open',
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  {
    title: 'Tasks Pending',
    value: '7',
    subtitle: '4 high priority',
    icon: 'i-lucide-list-checks',
    color: 'text-orange-600',
    bg: 'bg-orange-50'
  },
  {
    title: 'Exams',
    value: '2',
    subtitle: 'Next: 18 May 2024',
    icon: 'i-lucide-calendar-check',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50'
  },
  {
    title: 'Productivity Score',
    value: '78%',
    subtitle: 'Good job!',
    icon: 'i-lucide-trending-up',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  }
]
</script>

<template>
  <section>
    <div>
      <h1 class="text-3xl font-bold text-slate-900">
        Good morning, Yassine! 👋
      </h1>

      <p class="mt-2 text-slate-500">
        Let's make today productive and focused.
      </p>
    </div>

    <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="stat in stats"
        :key="stat.title"
        class="soft-card rounded-2xl p-5"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500">
              {{ stat.title }}
            </p>

            <p class="mt-3 text-3xl font-bold text-slate-900">
              {{ stat.value }}
            </p>

            <p class="mt-2 text-sm text-slate-500">
              {{ stat.subtitle }}
            </p>
          </div>

          <div :class="[stat.bg, stat.color]" class="flex size-11 items-center justify-center rounded-2xl">
            <UIcon :name="stat.icon" class="size-5" />
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
      <div class="soft-card rounded-2xl p-6">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-900">
            Today's Plan
          </h2>

          <p class="text-sm text-slate-500">
            Tuesday, 14 May 2024
          </p>
        </div>

        <div class="mt-6 space-y-4">
          <div class="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
            <span class="w-16 text-sm font-medium text-slate-500">08:00</span>
            <div class="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UIcon name="i-lucide-book-open" class="size-5" />
            </div>
            <div>
              <p class="font-semibold text-slate-900">Algorithms Course</p>
              <p class="text-sm text-slate-500">Room A23</p>
            </div>
          </div>

          <div class="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
            <span class="w-16 text-sm font-medium text-slate-500">10:00</span>
            <div class="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UIcon name="i-lucide-calculator" class="size-5" />
            </div>
            <div>
              <p class="font-semibold text-slate-900">Mathematics TD</p>
              <p class="text-sm text-slate-500">Room B12</p>
            </div>
          </div>

          <div class="flex items-center gap-4 rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/40 p-4">
            <span class="w-16 text-sm font-medium text-slate-500">17:00</span>
            <div class="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <UIcon name="i-lucide-sparkles" class="size-5" />
            </div>
            <div>
              <p class="font-semibold text-indigo-700">Study Session</p>
              <p class="text-sm text-indigo-500">AI Suggested</p>
            </div>
          </div>
        </div>
      </div>

      <div class="soft-card rounded-2xl p-6">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-sparkles" class="size-5 text-indigo-600" />
          <h2 class="text-lg font-bold text-slate-900">
            AI Assistant
          </h2>
        </div>

        <p class="mt-4 text-sm text-slate-500">
          Hi Yassine! How can I help you today?
        </p>

        <div class="mt-5 space-y-3">
          <UButton block variant="outline" color="neutral" icon="i-lucide-file-text">
            Summarize my course
          </UButton>

          <UButton block variant="outline" color="neutral" icon="i-lucide-calendar-plus">
            Create a study plan
          </UButton>

          <UButton block variant="outline" color="neutral" icon="i-lucide-pencil">
            Generate exercises
          </UButton>

          <UButton block variant="outline" color="neutral" icon="i-lucide-message-circle">
            What should I study today?
          </UButton>
        </div>
      </div>
    </div>
  </section>
</template>