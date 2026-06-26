<script setup lang="ts">
import { onMounted } from 'vue'
import SettingsTabs from '~/components/settings/SettingsTabs.vue'
import PlansSelector from '~/components/billing/PlansSelector.vue'

definePageMeta({ layout: 'dashboard' })

const billingStore = useBillingStore()

onMounted(async () => {
  await billingStore.loadBillingData()
})
</script>

<template>
  <section class="mx-auto max-w-[1440px] space-y-6 pb-10">
    <SettingsTabs />

    <!-- Breadcrumbs (Left aligned) -->
    <nav class="flex items-center gap-2 text-sm font-semibold text-muted mb-2">
      <NuxtLink to="/settings/billing" class="hover:text-[var(--color-primary)] transition-colors">Billing</NuxtLink>
      <UIcon name="i-lucide-chevron-right" class="size-4" />
      <span class="text-[var(--color-text)]">Plans</span>
    </nav>

    <PlansSelector />
  </section>
</template>
