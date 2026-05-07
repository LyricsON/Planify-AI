<script setup lang="ts">
import AvatarDropdown from './AvatarDropdown.vue'
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-6 py-4 backdrop-blur-xl">
    <div class="flex items-center justify-end gap-4">
      <UInput
        icon="i-lucide-search"
        placeholder="Search anything..."
        class="w-80"
      />

      <UButton
        icon="i-lucide-bell"
        color="neutral"
        variant="ghost"
        square
      />

      <UButton
        icon="i-lucide-calendar-days"
        color="neutral"
        variant="ghost"
        square
      />

      <AvatarDropdown />
    </div>
  </header>
</template>