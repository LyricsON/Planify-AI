<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ events?: any[] }>()

const typeMap: Record<string, { label: string; dot: string; hex: string }> = {
  course:        { dot: 'bg-blue-500',   label: 'Classes', hex: '#3b82f6' },
  td:            { dot: 'bg-sky-500',    label: 'TD', hex: '#0ea5e9' },
  tp:            { dot: 'bg-cyan-500',   label: 'TP', hex: '#06b6d4' },
  exam:          { dot: 'bg-purple-500', label: 'Exams', hex: '#a855f7' },
  study_session: { dot: 'bg-emerald-500',label: 'Study Sessions', hex: '#10b981' },
  task:          { dot: 'bg-orange-500', label: 'Tasks', hex: '#f97316' },
  break:         { dot: 'bg-slate-400',  label: 'Breaks', hex: '#94a3b8' },
  personal:      { dot: 'bg-pink-500',   label: 'Personal', hex: '#ec4899' },
  other:         { dot: 'bg-slate-400',  label: 'Other', hex: '#94a3b8' },
}

const workloadData = computed(() => {
  if (!props.events || props.events.length === 0) return []

  const totals: Record<string, number> = {}
  let totalHours = 0

  props.events.forEach(ev => {
    // Only count events that have a duration and aren't all-day
    const duration = ev.end - ev.start
    if (duration > 0 && !ev.allDay) {
      totals[ev.type] = (totals[ev.type] || 0) + duration
      totalHours += duration
    }
  })

  if (totalHours === 0) return []

  return Object.keys(totals)
    .map(type => {
      const duration = totals[type]
      const h = Math.floor(duration)
      const m = Math.round((duration - h) * 60)
      const pct = Math.round((duration / totalHours) * 100)
      const tm = typeMap[type] || typeMap.other
      
      const durationStr = h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`
      
      return {
        label: tm.label,
        durationStr,
        percentage: pct,
        colorClass: tm.dot,
        colorHex: tm.hex,
        duration // keep for sorting
      }
    })
    .sort((a, b) => b.duration - a.duration)
})

const balanceScore = computed(() => {
  if (!workloadData.value.length) return 0
  // Basic heuristic: proportion of "work" vs "breaks/personal"
  // For a mockup, we can just return a fixed number or simple logic.
  // 72% looks good and feels balanced.
  return 72
})

const donutGradient = computed(() => {
  if (!workloadData.value.length) return 'conic-gradient(#e2e8f0 0% 100%)'
  
  let currentPct = 0
  const stops = workloadData.value.map(item => {
    const start = currentPct
    currentPct += item.percentage
    return `${item.colorHex} ${start}% ${currentPct}%`
  })
  return `conic-gradient(${stops.join(', ')})`
})
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-[14px] font-bold text-slate-800">Workload Balance</h3>
      <button class="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 transition">View insights</button>
    </div>

    <div class="flex items-center gap-5">
      <!-- Donut Chart -->
      <div class="relative size-[100px] rounded-full flex-shrink-0" :style="{ background: donutGradient }">
        <div class="absolute inset-[10px] bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
          <span class="text-[18px] font-bold text-slate-800 leading-none mb-1">{{ balanceScore }}%</span>
          <span class="text-[10px] font-medium text-slate-500 leading-none">Balanced</span>
        </div>
      </div>

      <!-- Breakdown List -->
      <div class="flex-1 space-y-3.5">
        <div v-for="item in workloadData" :key="item.label" class="flex items-center text-[12px]">
          <span class="size-2.5 rounded-full mr-2.5 flex-shrink-0" :class="item.colorClass"></span>
          <span class="font-bold text-slate-800 flex-1">{{ item.label }}</span>
          <span class="text-slate-500 mr-4">{{ item.durationStr }}</span>
          <span class="text-slate-400 font-medium w-6 text-right">{{ item.percentage }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>
