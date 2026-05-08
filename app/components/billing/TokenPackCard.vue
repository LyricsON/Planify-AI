<script setup lang="ts">
import type { TokenPack } from '~/types/billing'

defineProps<{
  pack: TokenPack
  loading?: boolean
}>()

const emit = defineEmits<{
  buy: [id: string]
}>()
</script>

<template>
  <article
    class="relative rounded-2xl border bg-[var(--color-surface)] p-5 text-center transition"
    :class="pack.popular ? 'border-[var(--color-primary)] shadow-[var(--shadow-md)]' : 'border-[var(--color-border)] shadow-[var(--shadow-sm)]'"
  >
    <span
      v-if="pack.popular"
      class="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]"
    >
      Popular
    </span>

    <div
      class="mx-auto mb-4 flex size-10 items-center justify-center rounded-full text-[var(--color-warning)]"
      style="background: color-mix(in srgb, var(--color-warning) 14%, transparent)"
    >
      <UIcon
        name="i-lucide-coins"
        class="size-4"
      />
    </div>
    <p class="text-lg font-semibold text-[var(--color-text)]">
      {{ pack.name }}
    </p>
    <p class="mt-1 text-sm text-muted">
      {{ pack.tokens.toLocaleString() }} tokens
    </p>
    <p class="mt-4 text-3xl font-semibold text-[var(--color-text)]">
      ${{ pack.price.toFixed(2) }}
    </p>

    <button
      type="button"
      class="mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold transition"
      :class="pack.popular ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]' : 'border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]'"
      @click="emit('buy', pack.id)"
    >
      {{ loading ? 'Processing...' : 'Buy Now' }}
    </button>
  </article>
</template>
