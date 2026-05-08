<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard' })

const billingStore = useBillingStore()
const { subscription, tokenBalance, tokenUsage, tokenPacks, paymentMethods, paymentHistory, pricingPlans, loading, error, usingMockData } = storeToRefs(billingStore)
const feedback = ref<{ tone: 'success' | 'warning' | 'info', text: string } | null>(null)

onMounted(async () => {
  await billingStore.fetchBilling()
})

async function buyPack(id: string) {
  const ok = await billingStore.buyTokenPack(id)

  feedback.value = {
    tone: ok ? 'success' : 'warning',
    text: ok ? 'Your token balance has been updated.' : (error.value || 'Backend unavailable. The local balance was updated for demo flow.')
  }
}

async function addPaymentMethod() {
  await billingStore.addPaymentMethod({
    brand: 'Visa',
    label: 'Visa ending in 3030',
    expiry: '12/28'
  })

  feedback.value = {
    tone: 'info',
    text: 'A demo payment method was added to the list.'
  }
}

async function removePaymentMethod(id: string) {
  await billingStore.removePaymentMethod(id)
  feedback.value = {
    tone: 'info',
    text: 'The selected payment method was removed.'
  }
}
</script>

<template>
  <section class="mx-auto max-w-[1440px] space-y-6 pb-10">
    <header class="space-y-2">
      <h1 class="text-4xl font-semibold tracking-tight text-[var(--color-text)]">
        Billing
      </h1>
      <p class="text-base text-muted">
        Manage your subscription, payment methods, and billing history.
      </p>
    </header>

    <SettingsTabs />

    <div
      v-if="usingMockData"
      class="glass-card flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[var(--color-text-soft)]"
    >
      <UIcon
        name="i-lucide-wallet-cards"
        class="size-4 text-[var(--color-primary)]"
      />
      <span>{{ error || 'Backend unavailable. Showing mock billing data.' }}</span>
    </div>

    <div
      v-if="feedback"
      class="rounded-2xl px-4 py-3 text-sm font-medium"
      :class="feedback.tone === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : feedback.tone === 'warning' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'"
    >
      {{ feedback.text }}
    </div>

    <div
      v-if="loading"
      class="grid gap-6 xl:grid-cols-[1fr_340px]"
    >
      <div class="space-y-6">
        <div class="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div
            v-for="item in 2"
            :key="item"
            class="h-80 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]"
          />
        </div>
        <div class="h-72 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]" />
        <div class="h-80 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]" />
      </div>
      <div class="space-y-6">
        <div
          v-for="item in 3"
          :key="item"
          class="h-72 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]"
        />
      </div>
    </div>

    <div
      v-else-if="subscription && tokenBalance"
      class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
    >
      <div class="space-y-6">
        <div class="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <SubscriptionCard :subscription="subscription" />
          <TokenBalanceCard
            :token-balance="tokenBalance"
            @buy="buyPack(tokenPacks[0]?.id || 'starter')"
          />
        </div>

        <section class="section-card">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 class="text-xl font-semibold text-[var(--color-text)]">
                Buy Token Packs
              </h3>
              <p class="mt-1 text-sm text-muted">
                Need more tokens? Choose a pack that fits your needs.
              </p>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <TokenPackCard
              v-for="pack in tokenPacks"
              :key="pack.id"
              :pack="pack"
              @buy="buyPack"
            />
          </div>
        </section>

        <PaymentMethodsCard
          :methods="paymentMethods"
          @add="addPaymentMethod"
          @remove="removePaymentMethod"
        />
        <PaymentHistoryCard :history="paymentHistory" />
      </div>

      <div class="space-y-6">
        <section class="section-card">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h3 class="text-xl font-semibold text-[var(--color-text)]">
              Usage Summary
            </h3>
            <button
              type="button"
              class="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-text-soft)]"
            >
              This Month
            </button>
          </div>

          <div class="space-y-5">
            <div
              v-for="item in tokenUsage"
              :key="item.id"
            >
              <div class="mb-2 flex items-center justify-between gap-3">
                <span class="text-sm font-medium text-[var(--color-text)]">{{ item.label }}</span>
                <span class="text-sm text-[var(--color-text-soft)]">{{ item.tokens.toLocaleString() }} tokens {{ item.percentage }}%</span>
              </div>
              <div class="h-2 rounded-full bg-[var(--color-bg-soft)]">
                <div
                  class="h-full rounded-full bg-[var(--color-primary)]"
                  :style="{ width: `${item.percentage}%` }"
                />
              </div>
            </div>
          </div>

          <div class="mt-6 border-t border-[var(--color-border)] pt-4">
            <p class="text-sm text-muted">
              Total Used
            </p>
            <p class="mt-2 text-lg font-semibold text-[var(--color-text)]">
              {{ tokenBalance.used.toLocaleString() }} / {{ tokenBalance.limit.toLocaleString() }} tokens
            </p>
          </div>

          <div class="mt-6 rounded-2xl bg-[var(--color-primary-soft)] p-4 text-sm text-[var(--color-text-soft)]">
            Need more tokens? Upgrade your plan or buy token packs to keep going.
          </div>
        </section>

        <section class="section-card">
          <h3 class="mb-4 text-xl font-semibold text-[var(--color-text)]">
            Upgrade or Downgrade
          </h3>
          <p class="mb-4 text-sm text-muted">
            Choose the plan that works best for you.
          </p>
          <div class="rounded-2xl border border-[var(--color-border)] p-4">
            <div class="mb-3 flex items-center justify-between gap-3">
              <p class="text-lg font-semibold text-[var(--color-text)]">
                {{ subscription.name }}
              </p>
              <span class="status-badge status-info">Current</span>
            </div>
            <ul class="space-y-2 text-sm text-[var(--color-text-soft)]">
              <li>4,000 tokens per month</li>
              <li>AI Assistant (Answers & Explanations)</li>
              <li>Document Analysis</li>
              <li>Practice Exams</li>
              <li>Flashcards & Summaries</li>
              <li>Email Support</li>
            </ul>
            <button
              type="button"
              class="mt-5 w-full rounded-xl border border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]"
            >
              Compare Plans
            </button>
          </div>
        </section>

        <section class="section-card">
          <h3 class="mb-4 text-xl font-semibold text-[var(--color-text)]">
            Plans & Pricing
          </h3>
          <div class="space-y-4">
            <div
              v-for="plan in pricingPlans"
              :key="plan.id"
              class="rounded-2xl border border-[var(--color-border)] p-4"
            >
              <div class="mb-3 flex items-center justify-between gap-3">
                <p class="text-lg font-semibold text-[var(--color-text)]">
                  {{ plan.name }}
                </p>
                <span
                  v-if="plan.badge"
                  class="status-badge status-info"
                >{{ plan.badge }}</span>
              </div>
              <p class="text-2xl font-semibold text-[var(--color-text)]">
                {{ plan.priceLabel }}
              </p>
              <ul class="mt-4 space-y-2 text-sm text-[var(--color-text-soft)]">
                <li
                  v-for="feature in plan.features"
                  :key="feature"
                >
                  {{ feature }}
                </li>
              </ul>
              <button
                type="button"
                class="mt-5 w-full rounded-xl border border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]"
              >
                {{ plan.cta }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>
