<template>
  <div class="flex w-full justify-start">
    <div class="flex max-w-[min(92%,46rem)] gap-3">
      <div class="mt-1.5 flex size-9 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-indigo-600 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <UIcon name="i-lucide-sparkles" class="size-4" />
      </div>

      <div class="rounded-[26px] border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <div class="flex items-center gap-1.5" aria-hidden="true">
          <span class="typing-dot" />
          <span class="typing-dot delay-150" />
          <span class="typing-dot delay-300" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.typing-dot {
  width: 7px;
  height: 7px;
  border-radius: 9999px;
  background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
  animation: typingBounce 1s ease-in-out infinite;
  opacity: 0.75;
}

.delay-150 {
  animation-delay: 150ms;
}

.delay-300 {
  animation-delay: 300ms;
}

@keyframes typingBounce {
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.45;
  }
  40% {
    transform: translateY(-4px);
    opacity: 1;
  }
}
</style>
