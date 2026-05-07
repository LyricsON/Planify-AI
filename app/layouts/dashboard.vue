<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900">
    <div class="flex">
      <AppSidebar />

      <main class="min-h-screen flex-1 pl-64">
        <AppTopbar />

        <div class="p-6">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>