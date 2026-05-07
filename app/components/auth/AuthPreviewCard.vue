<script setup lang="ts">
// AuthPreviewCard.vue - Displays the static image preview of the dashboard
</script>

<template>
  <div class="animate-fade-in w-full max-w-[450px] mx-auto relative group">
    <!-- Light Mode Image -->
    <img 
      src="/images/signLight.png" 
      alt="Planify AI Dashboard Preview Light" 
      class="w-full h-auto rounded-xl shadow-[var(--shadow-floating)] border border-[var(--color-border)] transition-transform duration-500 group-hover:-translate-y-2 dark:hidden object-cover" 
    />
    
    <!-- Dark Mode Image -->
    <img 
      src="/images/signDark.png" 
      alt="Planify AI Dashboard Preview Dark" 
      class="w-full h-auto rounded-xl shadow-[var(--shadow-floating)] border border-[var(--color-border)] transition-transform duration-500 group-hover:-translate-y-2 hidden dark:block object-cover" 
    />
  </div>
</template>

<style scoped>
/* Any additional specific overrides */
</style>
