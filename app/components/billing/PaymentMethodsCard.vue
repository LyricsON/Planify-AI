<script setup lang="ts">
import type { PaymentMethod } from '~/types/billing'

defineProps<{
  methods: PaymentMethod[]
}>()

const emit = defineEmits<{
  add: []
  remove: [id: string]
}>()

function brandIcon(brand: string) {
  if (brand.toLowerCase().includes('visa')) {
    return 'i-simple-icons-visa'
  }

  return 'i-simple-icons-mastercard'
}
</script>

<template>
  <section class="section-card">
    <div class="mb-5 flex items-center justify-between gap-3">
      <div>
        <h3 class="text-xl font-semibold text-[var(--color-text)]">
          Payment Methods
        </h3>
        <p class="mt-1 text-sm text-muted">
          Manage your saved payment methods.
        </p>
      </div>
      <button
        type="button"
        class="rounded-xl border border-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
        @click="emit('add')"
      >
        Add Payment Method
      </button>
    </div>

    <div class="space-y-3">
      <div
        v-for="method in methods"
        :key="method.id"
        class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] px-4 py-4"
      >
        <div class="flex items-center gap-3">
          <div class="icon-box icon-box-warning">
            <UIcon
              :name="brandIcon(method.brand)"
              class="size-4"
            />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold text-[var(--color-text)]">
                {{ method.label }}
              </p>
              <span
                v-if="method.isDefault"
                class="status-badge status-success"
              >Default</span>
            </div>
            <p class="mt-1 text-sm text-muted">
              Expires {{ method.expiry }}
            </p>
          </div>
        </div>
        <button
          type="button"
          class="text-sm font-semibold text-[var(--color-danger)]"
          @click="emit('remove', method.id)"
        >
          Remove
        </button>
      </div>
    </div>
  </section>
</template>
