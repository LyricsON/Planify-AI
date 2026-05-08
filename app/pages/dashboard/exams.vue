<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
// Exams are now part of the unified Tasks & Exams page
</script>
<template>
  <div>
    <NuxtLink to="/dashboard/tasks" replace />
  </div>
</template>