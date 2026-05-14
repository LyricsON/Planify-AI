<script setup lang="ts">
import { useScheduleStore } from '~/stores/schedule'

const scheduleStore = useScheduleStore()
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col h-full relative">
    <h3 class="text-[14px] font-bold text-slate-800 mb-5">Calendar Legend</h3>

    <div class="flex-1 grid grid-cols-2 gap-x-4 gap-y-3">
      <div v-for="item in scheduleStore.legendItems" :key="item.id" class="flex items-start gap-3">
        <div class="size-4 rounded-[4px] mt-0.5 flex-shrink-0" :class="item.color"></div>
        <div>
          <div class="text-[12px] font-bold text-slate-800 leading-tight">{{ item.label }}</div>
          <div class="text-[11px] font-medium text-slate-400 leading-tight mt-1">{{ item.description }}</div>
        </div>
      </div>
    </div>

    <!-- Footer Text -->
    <div class="flex items-center gap-2 mt-6 pt-4 text-[12px] font-medium text-slate-500">
      <UIcon name="i-lucide-mouse-pointer-click" class="size-4 text-slate-400" />
      <span>Drag events to reschedule</span>
    </div>
  </div>
</template>
