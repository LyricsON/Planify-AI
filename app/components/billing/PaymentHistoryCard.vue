<script setup lang="ts">
import type { PaymentHistoryItem } from '~/types/billing'

defineProps<{
  history: PaymentHistoryItem[]
}>()
</script>

<template>
  <section class="section-card">
    <div class="mb-5 flex items-center justify-between gap-3">
      <div>
        <h3 class="text-xl font-semibold text-[var(--color-text)]">
          Payment History
        </h3>
        <p class="mt-1 text-sm text-muted">
          View your invoices and payment history.
        </p>
      </div>
      <button
        type="button"
        class="text-sm font-semibold text-[var(--color-primary)]"
      >
        View All Invoices
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full text-left text-sm">
        <thead>
          <tr class="border-b border-[var(--color-border)] text-[var(--color-text-soft)]">
            <th class="pb-3 font-semibold">
              Invoice ID
            </th>
            <th class="pb-3 font-semibold">
              Date
            </th>
            <th class="pb-3 font-semibold">
              Description
            </th>
            <th class="pb-3 font-semibold">
              Amount
            </th>
            <th class="pb-3 font-semibold">
              Status
            </th>
            <th class="pb-3 text-right font-semibold">
              Receipt
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in history"
            :key="row.id"
            class="border-b border-[var(--color-border)]"
          >
            <td class="py-4 font-medium text-[var(--color-text)]">
              {{ row.invoiceId }}
            </td>
            <td class="py-4 text-muted">
              {{ row.date }}
            </td>
            <td class="py-4 text-[var(--color-text)]">
              {{ row.description }}
            </td>
            <td class="py-4 font-semibold text-[var(--color-text)]">
              {{ row.amount }}
            </td>
            <td class="py-4">
              <span class="status-badge status-success">{{ row.status }}</span>
            </td>
            <td class="py-4 text-right">
              <button
                type="button"
                class="text-[var(--color-primary)]"
              >
                <UIcon
                  name="i-lucide-download"
                  class="size-4"
                />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
