<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
</script>

<template>
  <div class="h-screen flex bg-slate-50 dark:bg-slate-900 overflow-hidden">
    <AppSidebar />

    <main class="flex-1 pl-[260px] h-screen overflow-y-auto bg-slate-50 dark:bg-slate-950 sidebar-scroll">
      <AppTopbar />
      <div class="px-8 pb-8">
        <slot />
      </div>
    </main>
  </div>
</template>
