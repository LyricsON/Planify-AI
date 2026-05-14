<script setup lang="ts">
import WorkloadBalanceCard from './WorkloadBalanceCard.vue'
import UpcomingDeadlinesCard from './UpcomingDeadlinesCard.vue'
import CalendarLegendCard from './CalendarLegendCard.vue'

const props = defineProps<{ events?: any[] }>()
</script>

<template>
  <div class="grid gap-5 xl:grid-cols-[1fr_340px] items-stretch mt-5">
    <!-- Left Column (matches Calendar width) -->
    <div class="grid gap-5 grid-cols-1 md:grid-cols-2">
      <WorkloadBalanceCard :events="events" />
      <UpcomingDeadlinesCard />
    </div>

    <!-- Right Column (matches Sidebar width) -->
    <div>
      <CalendarLegendCard />
    </div>
  </div>
</template>
