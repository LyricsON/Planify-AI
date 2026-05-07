<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
</script>

<template>
  <div class="h-screen flex bg-slate-50 dark:bg-slate-900 overflow-hidden">
    <AppSidebar />

    <main class="flex-1 pl-64 h-screen overflow-y-auto">
      <AppTopbar />

      <div class="p-6">
        <slot />
      </div>
    </main>
  </div>
</template>