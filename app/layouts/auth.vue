<template>
  <div class="auth-layout min-h-screen text-[var(--color-text)]">
    <slot />
  </div>
</template>

<style scoped>
.auth-layout {
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 34%),
    radial-gradient(circle at bottom left, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 22%),
    var(--color-bg);
}

:global(.dark) .auth-layout {
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--color-primary) 14%, transparent), transparent 34%),
    radial-gradient(circle at bottom left, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 22%),
    var(--color-bg);
}
</style>
