<script setup lang="ts">
import { onMounted } from 'vue'
import { useScheduleStore } from '~/stores/schedule'

const scheduleStore = useScheduleStore()

onMounted(() => {
  scheduleStore.fetchDeadlines()
})

const getBadgeStyle = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'bg-red-50 text-red-600 border-red-100'
    case 'medium':
      return 'bg-amber-50 text-amber-600 border-amber-100'
    case 'low':
      return 'bg-emerald-50 text-emerald-600 border-emerald-100'
    default:
      return 'bg-slate-50 text-slate-600 border-slate-100'
  }
}
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
    <div class="flex items-center justify-between mb-5">
      <h3 class="text-[14px] font-bold text-slate-800">Upcoming Deadlines</h3>
      <button class="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 transition">View all</button>
    </div>

    <div v-if="scheduleStore.isLoadingDeadlines" class="flex-1 flex items-center justify-center py-8">
      <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-indigo-500"/>
    </div>
    <div v-else-if="scheduleStore.deadlines.length === 0" class="flex-1 flex items-center justify-center py-8">
      <div class="text-[13px] text-slate-500 font-medium">No upcoming deadlines.</div>
    </div>
    <div v-else class="flex-0 flex flex-col justify-center space-y-4">
      <div v-for="deadline in scheduleStore.deadlines" :key="deadline.id" class="flex items-center gap-4">
        <!-- Date Block -->
        <div class="flex flex-col items-center justify-center w-[46px] h-[46px] rounded-xl border border-slate-200 bg-white shadow-sm flex-shrink-0">
          <span class="text-[14px] font-bold text-slate-800 leading-none">{{ deadline.day }}</span>
          <span class="text-[9px] font-bold text-slate-400 mt-1 uppercase">{{ deadline.month }}</span>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="text-[13px] font-bold text-slate-800 truncate leading-tight">{{ deadline.title }}</div>
          <div class="text-[11px] font-medium text-slate-400 truncate mt-1">{{ deadline.subtitle }}</div>
        </div>

        <!-- Badge -->
        <div class="flex-shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-lg border" :class="getBadgeStyle(deadline.priority)">
          {{ deadline.priority }}
        </div>
      </div>
    </div>
  </div>
</template>
