<script setup lang="ts">
import type { SubscriptionPlan } from '~/types/billing'

defineProps<{
  subscription: SubscriptionPlan
}>()
</script>

<template>
  <section class="section-card">
    <div class="mb-5 flex items-center justify-between gap-3">
      <h3 class="text-xl font-semibold text-[var(--color-text)]">
        Current Subscription
      </h3>
      <span class="status-badge status-info">{{ subscription.status }}</span>
    </div>

    <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div class="flex items-center gap-4">
        <div class="icon-box icon-box-primary size-14 rounded-2xl">
          <UIcon
            name="i-lucide-graduation-cap"
            class="size-6"
          />
        </div>
        <div>
          <p class="text-2xl font-semibold text-[var(--color-text)]">
            {{ subscription.name }}
          </p>
          <p class="mt-1 text-sm text-muted">
            {{ subscription.description }}
          </p>
        </div>
      </div>

      <div class="mt-6 grid gap-4 border-t border-[var(--color-border)] pt-4 sm:grid-cols-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">
            Next Billing Date
          </p>
          <p class="mt-1 text-sm font-semibold text-[var(--color-text)]">
            {{ subscription.nextBillingDate }}
          </p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">
            Billing Cycle
          </p>
          <p class="mt-1 text-sm font-semibold text-[var(--color-text)]">
            {{ subscription.billingCycle }}
          </p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">
            Subscription Fee
          </p>
          <p class="mt-1 text-sm font-semibold text-[var(--color-text)]">
            {{ subscription.feeLabel }}
          </p>
        </div>
      </div>
    </div>

    <div class="mt-5 grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        class="rounded-xl border border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
      >
        Change Plan
      </button>
      <button
        type="button"
        class="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
      >
        Manage Subscription
      </button>
    </div>
  </section>
</template>
