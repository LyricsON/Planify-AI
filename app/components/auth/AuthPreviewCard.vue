<script setup lang="ts">
// AuthPreviewCard.vue - Displays the static image preview of the dashboard
</script>

<template>
  <div class="group relative mx-0 w-full max-w-[540px] animate-fade-in">
    <!-- Light Mode Image -->
    <img
      src="/images/signLight.png"
      alt="Planify AI Dashboard Preview Light"
      class="h-auto w-full rounded-[1.5rem] border border-[var(--color-border)] object-cover shadow-[var(--shadow-floating)] transition-transform duration-500 group-hover:-translate-y-2 dark:hidden"
    >

    <!-- Dark Mode Image -->
    <img
      src="/images/signDark.png"
      alt="Planify AI Dashboard Preview Dark"
      class="hidden h-auto w-full rounded-[1.5rem] border border-[var(--color-border)] object-cover shadow-[var(--shadow-floating)] transition-transform duration-500 group-hover:-translate-y-2 dark:block"
    >
  </div>
</template>
