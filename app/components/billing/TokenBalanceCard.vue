<script setup lang="ts">
import type { TokenBalance } from '~/types/billing'

defineProps<{
  tokenBalance: TokenBalance
}>()

const emit = defineEmits<{
  buy: []
}>()
</script>

<template>
  <section class="section-card">
    <div class="mb-4 flex items-center justify-between gap-3">
      <h3 class="text-xl font-semibold text-[var(--color-text)]">
        Your Tokens Balance
      </h3>
      <div class="icon-box icon-box-warning">
        <UIcon
          name="i-lucide-coins"
          class="size-4"
        />
      </div>
    </div>

    <div class="flex items-end gap-2">
      <p class="text-4xl font-semibold text-[var(--color-text)]">
        {{ tokenBalance.balance.toLocaleString() }}
      </p>
      <p class="pb-1 text-sm text-muted">
        tokens
      </p>
    </div>

    <div class="mt-6">
      <div class="mb-2 flex items-center justify-between gap-3 text-sm">
        <span class="text-muted">{{ tokenBalance.usedPercentage }}% used</span>
        <span class="text-[var(--color-text-soft)]">{{ tokenBalance.used.toLocaleString() }} / {{ tokenBalance.limit.toLocaleString() }} tokens</span>
      </div>
      <div class="h-2 rounded-full bg-[var(--color-bg-soft)]">
        <div
          class="h-full rounded-full bg-[var(--color-success)]"
          :style="{ width: `${tokenBalance.usedPercentage}%` }"
        />
      </div>
    </div>

    <button
      type="button"
      class="mt-6 w-full rounded-xl border border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
      @click="emit('buy')"
    >
      Buy More Tokens
    </button>
  </section>
</template>
