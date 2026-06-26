<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard' })

const billingStore = useBillingStore()
const { subscription, tokenBalance, tokenUsage, tokenPacks, paymentMethods, paymentHistory, pricingPlans, loading, error } = storeToRefs(billingStore)
const feedback = ref<{ tone: 'success' | 'warning' | 'info', text: string } | null>(null)
const router = useRouter()

onMounted(async () => {
  await billingStore.loadBillingData()
})

function toDateLabel(value?: string) {
  if (!value) return 'Not available'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

const balanceValue = computed(() => Number(tokenBalance.value?.balance || 0))
const totalUsed = computed(() => Number(tokenBalance.value?.used || 0))
const totalLimit = computed(() => Number(tokenBalance.value?.limit || 0))
const usedPct = computed(() => Number(tokenBalance.value?.usedPercentage || 0))
const compactBalance = computed(() => {
  const value = balanceValue.value
  if (!value) return '0'
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
})

const usageBars = computed(() => {
  return (tokenUsage.value || []).map((item, index) => ({
    id: item.id || `usage-${index}`,
    label: item.label,
    tokens: Number(item.tokens || 0),
    percentage: Number(item.percentage || 0)
  })).slice(0, 4)
})

const currentPlanFeatures = [
  '4,000 tokens per month',
  'AI Assistant (Answers & Explanations)',
  'Document Analysis',
  'Practice Exams',
  'Flashcards & Summaries',
  'Email Support'
]

async function buyPack(id: string) {
  const ok = await billingStore.buyTokenPack(id)
  await billingStore.refreshBillingData(true)
  feedback.value = {
    tone: ok ? 'success' : 'warning',
    text: ok ? 'Token pack purchased successfully.' : (error.value || 'Unable to purchase token pack.')
  }
}

function changePlan() {
  router.push('/settings/billing/plans')
}

function manageSubscription() {
  router.push('/settings/billing/manage-subscription')
}

// Payment Modal State
const isPaymentModalOpen = ref(false)
const isSubmittingPayment = ref(false)
const selectedCardId = ref('')

const defaultPaymentMethod = computed(() => {
  if (!paymentMethods.value || paymentMethods.value.length === 0) return null
  return paymentMethods.value.find(m => m.isDefault) || paymentMethods.value[0]
})

function brandIcon(brand: string) {
  if (!brand) return 'i-lucide-credit-card'
  const b = brand.toLowerCase()
  if (b.includes('visa')) return 'i-simple-icons-visa'
  if (b.includes('mastercard') || b.includes('master')) return 'i-simple-icons-mastercard'
  return 'i-lucide-credit-card'
}

async function openAddPaymentModal() {
  try {
    await billingStore.refreshPaymentMethods()
  } catch (err) {
    console.error('Error loading latest payment methods:', err)
  }
  selectedCardId.value = defaultPaymentMethod.value?.id || paymentMethods.value[0]?.id || ''
  isPaymentModalOpen.value = true
}

function closePaymentModal() {
  isPaymentModalOpen.value = false
}

function addPaymentMethod() {
  openAddPaymentModal()
}

async function useSelectedCard() {
  if (!selectedCardId.value) return
  isSubmittingPayment.value = true
  feedback.value = null
  try {
    const ok = await billingStore.setPlanDefaultPaymentMethod(selectedCardId.value)
    if (ok) {
      const methods = await billingStore.refreshPaymentMethods()
      feedback.value = methods ? { tone: 'success', text: 'Default payment method updated successfully.' } : { tone: 'warning', text: error.value || 'Updated the default payment method, but failed to refresh the list.' }
      closePaymentModal()
    } else {
      feedback.value = { tone: 'warning', text: error.value || 'Failed to update default payment method.' }
    }
  } catch (err: any) {
    feedback.value = { tone: 'warning', text: err?.message || 'An error occurred.' }
  } finally {
    isSubmittingPayment.value = false
  }
}

async function redirectToStripe() {
  isSubmittingPayment.value = true
  feedback.value = null
  try {
    const url = await billingStore.getStripeSetupSession()
    if (url) {
      window.location.href = url
    } else {
      feedback.value = { tone: 'warning', text: error.value || 'Failed to initialize Stripe checkout.' }
    }
  } catch (err: any) {
    feedback.value = { tone: 'warning', text: err?.message || 'An error occurred.' }
  } finally {
    isSubmittingPayment.value = false
  }
}

async function removePaymentMethod(id: string) {
  const ok = await billingStore.removePaymentMethod(id)
  const methods = await billingStore.refreshPaymentMethods()
  feedback.value = {
    tone: ok && methods ? 'info' : 'warning',
    text: ok && methods ? 'Payment method removed.' : (error.value || 'Unable to remove payment method.')
  }
}
</script>

<template>
  <section class="mx-auto max-w-[1440px] space-y-5 pb-10">
    <SettingsTabs />

    <div
      v-if="feedback"
      class="rounded-2xl px-4 py-3 text-sm font-medium"
      :class="feedback.tone === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : feedback.tone === 'warning' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'"
    >
      {{ feedback.text }}
    </div>

    <div v-if="error" class="rounded-xl border border-[var(--color-border)] bg-[var(--color-card-bg)] px-4 py-3 text-sm text-muted">
      {{ error }}
    </div>

    <div v-if="loading" class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-5">
        <div class="grid gap-5 lg:grid-cols-3">
          <div v-for="i in 3" :key="i" class="h-72 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]" />
        </div>
        <div class="h-48 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]" />
        <div class="h-36 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]" />
        <div class="h-64 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]" />
      </div>
      <div class="space-y-5">
        <div class="h-64 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]" />
        <div class="h-80 animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-bg-soft)]" />
      </div>
    </div>

    <div v-else class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
      <div class="space-y-4">
        <div class="grid gap-4 lg:grid-cols-3">
          <section class="section-card lg:col-span-2">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg leading-none font-semibold text-[var(--color-text)]">Current Subscription</h3>
              <span class="status-badge status-info">{{ subscription?.status || 'Active' }}</span>
            </div>

            <div class="rounded-2xl border border-[var(--color-border)] p-4">
              <div class="flex items-start gap-4">
                <div class="icon-box icon-box-primary !size-14">
                  <UIcon name="i-lucide-graduation-cap" class="size-7" />
                </div>
                <div>
                  <p class="text-[22px] leading-tight font-semibold text-[var(--color-text)]">{{ subscription?.name || 'Free Plan' }}</p>
                  <p class="mt-1.5 text-sm text-[var(--color-text-soft)]">{{ subscription?.description || 'Access to plan features and billing controls.' }}</p>
                </div>
              </div>

              <div class="mt-4 grid gap-3 border-t border-[var(--color-border)] pt-3 text-sm md:grid-cols-3">
                <div v-if="subscription?.name && !subscription.name.toLowerCase().includes('free') && subscription?.nextBillingDate">
                  <p class="text-muted">Next Billing Date</p>
                  <p class="mt-1 font-semibold text-[var(--color-text)]">{{ toDateLabel(subscription?.nextBillingDate) }}</p>
                </div>
                <div>
                  <p class="text-muted">Billing Cycle</p>
                  <p class="mt-1 font-semibold text-[var(--color-text)]">{{ subscription?.billingCycle || 'Monthly' }}</p>
                </div>
                <div>
                  <p class="text-muted">Subscription Fee</p>
                  <p class="mt-1 font-semibold text-[var(--color-text)]">{{ subscription?.feeLabel || 'Not available' }}</p>
                </div>
              </div>
            </div>

            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <NuxtLink to="/settings/billing/plans" class="flex items-center justify-center h-11 rounded-xl border border-[var(--color-primary)] text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] transition cursor-pointer">Change Plan</NuxtLink>
              <button class="h-11 rounded-xl bg-[var(--color-primary)] text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition cursor-pointer" @click="manageSubscription">Manage Subscription</button>
            </div>
          </section>

          <section class="section-card">
            <h3 class="text-lg leading-none font-semibold text-[var(--color-text)]">Your Tokens Balance</h3>
            <div class="mt-4 flex items-center gap-3">
              <div class="icon-box !size-11 bg-amber-100 text-amber-500">
                <UIcon name="i-lucide-coins" class="size-6" />
              </div>
              <div class="min-w-0">
                <p
                  class="text-[36px] leading-[1.06] font-semibold text-[var(--color-text)] tracking-tight tabular-nums"
                  :title="`${balanceValue.toLocaleString()} tokens`"
                >
                  {{ compactBalance }}
                </p>
                <p class="text-sm text-muted">{{ balanceValue.toLocaleString() }} tokens</p>
              </div>
            </div>

            <div class="mt-4 h-2 rounded-full bg-[var(--color-bg-soft)]">
              <div class="h-full rounded-full bg-[var(--color-success)]" :style="{ width: `${usedPct}%` }" />
            </div>
            <div class="mt-2 flex items-center justify-between text-sm">
              <span class="text-muted">{{ usedPct }}% used</span>
              <span class="text-[var(--color-text-soft)]">{{ totalUsed.toLocaleString() }} / {{ totalLimit.toLocaleString() }} tokens</span>
            </div>

            <button class="mt-5 h-11 w-full rounded-xl border border-[var(--color-primary)] text-sm font-semibold text-[var(--color-primary)] cursor-pointer" @click="buyPack(tokenPacks[0]?.id || 'starter')">
              Buy More Tokens
            </button>
          </section>
        </div>

        <section class="section-card">
          <h3 class="text-lg leading-none font-semibold text-[var(--color-text)]">Buy Token Packs</h3>
          <p class="mt-1 text-sm text-muted">Need more tokens? Choose a pack that fits your needs.</p>

          <div class="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article v-for="pack in tokenPacks" :key="pack.id" class="relative rounded-2xl border p-4 text-center" :class="pack.popular ? 'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_3%,white)]' : 'border-[var(--color-border)]'">
              <span v-if="pack.popular" class="absolute left-3 top-3 status-badge status-info">Popular</span>
              <div class="mx-auto mt-4 icon-box !size-9 bg-amber-100 text-amber-500">
                <UIcon name="i-lucide-coins" class="size-5" />
              </div>
              <p class="mt-3 text-base font-semibold text-[var(--color-text)]">{{ pack.name }}</p>
              <p class="text-sm text-muted">{{ pack.tokens.toLocaleString() }} tokens</p>
              <p class="mt-2 text-3xl leading-none font-semibold text-[var(--color-text)]">{{ pack.price.toFixed(2) }} TND</p>
              <button class="mt-4 h-8 w-full rounded-xl border text-sm font-semibold cursor-pointer" :class="pack.popular ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border)] text-[var(--color-primary)]'" @click="buyPack(pack.id)">
                Buy Now
              </button>
            </article>
          </div>
        </section>

        <section class="section-card">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h3 class="text-lg leading-none font-semibold text-[var(--color-text)]">Payment Methods</h3>
              <p class="mt-1 text-sm text-muted">Manage your saved payment methods.</p>
            </div>
            <button class="h-10 rounded-xl border border-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-primary)] cursor-pointer" @click="addPaymentMethod">Add Payment Method</button>
          </div>

          <div class="space-y-3">
            <div v-if="paymentMethods.length === 0" class="rounded-xl border border-[var(--color-border)] px-4 py-8 text-center text-sm text-muted">
              No payment methods added yet.
            </div>
            <div v-else v-for="method in paymentMethods" :key="method.stripePaymentMethodId || method._id" class="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-4 py-3">
              <div class="flex items-center gap-3">
                <span class="text-base font-bold text-[var(--color-text)]">{{ method.brand.toUpperCase() }}</span>
                <span class="text-sm text-[var(--color-text)]">{{ method.label }}</span>
                <span v-if="method.isDefault" class="status-badge status-success">Default</span>
              </div>
              <div class="flex items-center gap-4">
                <span class="text-sm text-muted">Expires {{ method.expiry }}</span>
                <button class="text-sm font-semibold text-[var(--color-danger)] cursor-pointer" @click="removePaymentMethod(method.id)">Remove</button>
              </div>
            </div>
          </div>
        </section>

        <section class="section-card">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h3 class="text-lg leading-none font-semibold text-[var(--color-text)]">Payment History</h3>
              <p class="mt-1 text-sm text-muted">View your invoices and payment history.</p>
            </div>
            <NuxtLink to="/settings/billing" class="text-sm font-semibold text-[var(--color-primary)] cursor-pointer">View All Invoices</NuxtLink>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full min-w-[720px] text-sm">
              <thead>
                <tr class="border-b border-[var(--color-border)] text-left text-muted">
                  <th class="py-2">Invoice ID</th>
                  <th class="py-2">Date</th>
                  <th class="py-2">Description</th>
                  <th class="py-2">Amount</th>
                  <th class="py-2">Status</th>
                  <th class="py-2">Receipt</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="paymentHistory.length === 0">
                  <td colspan="6" class="py-8 text-center text-sm text-muted">No invoices available.</td>
                </tr>
                <tr v-else v-for="payment in paymentHistory" :key="payment.id" class="border-b border-[var(--color-border)]/70">
                  <td class="py-3 font-medium text-[var(--color-text)]">{{ payment.invoiceId || payment.id }}</td>
                  <td class="py-3 text-[var(--color-text)]">{{ payment.date }}</td>
                  <td class="py-3 text-[var(--color-text)]">{{ payment.description }}</td>
                  <td class="py-3 text-[var(--color-text)]">{{ payment.amount }}</td>
                  <td class="py-3"><span class="status-badge status-success">{{ payment.status || 'Paid' }}</span></td>
                  <td class="py-3"><UIcon name="i-lucide-download" class="size-4 text-[var(--color-primary)]" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside class="space-y-4 xl:sticky xl:top-[112px] self-start">
        <section class="section-card">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-lg leading-none font-semibold text-[var(--color-text)]">Usage Summary</h3>
            <button class="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-soft)] cursor-pointer">This Month</button>
          </div>

          <div class="space-y-4">
            <div v-if="usageBars.length === 0" class="py-4 text-center text-sm text-muted">
              No usage data for this period.
            </div>
            <div v-else v-for="item in usageBars" :key="item.id">
              <div class="mb-1 flex items-center justify-between text-sm">
                <span class="text-[var(--color-text)]">{{ item.label }}</span>
                <span class="text-muted">{{ item.tokens.toLocaleString() }} tokens {{ item.percentage }}%</span>
              </div>
              <div class="h-2 rounded-full bg-[var(--color-bg-soft)]">
                <div class="h-full rounded-full bg-[var(--color-primary)]" :style="{ width: `${item.percentage}%` }" />
              </div>
            </div>
          </div>

          <div class="mt-5 border-t border-[var(--color-border)] pt-3 text-sm font-semibold text-[var(--color-text)]">
            Total Used {{ totalUsed.toLocaleString() }} / {{ totalLimit.toLocaleString() }} tokens
          </div>

          <div class="mt-4 rounded-xl bg-[var(--color-primary-soft)] px-3 py-2 text-sm text-[var(--color-text-soft)]">
            Need more tokens? Upgrade your plan or buy tokens to keep going.
          </div>
        </section>

        <section class="section-card">
          <h3 class="text-lg leading-none font-semibold text-[var(--color-text)]">Upgrade or Downgrade</h3>
          <p class="mt-1 text-sm text-muted">Choose the plan that works best for you.</p>
          <div class="mt-3 rounded-xl border border-[var(--color-border)] p-4">
            <div class="mb-3 flex items-center justify-between">
              <p class="font-semibold text-[var(--color-text)]">{{ subscription?.name || 'Student Plan' }}</p>
              <span class="status-badge status-info">Current</span>
            </div>
            <ul class="space-y-1 text-sm text-[var(--color-text-soft)]">
              <li v-for="feature in currentPlanFeatures" :key="feature" class="flex items-center gap-2">
                <UIcon name="i-lucide-check" class="size-3.5 text-[var(--color-primary)]" />
                <span>{{ feature }}</span>
              </li>
            </ul>
            <NuxtLink to="/settings/billing/plans" class="mt-4 flex h-10 w-full items-center justify-center rounded-xl border border-[var(--color-primary)] text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] transition cursor-pointer">
              Compare Plans
            </NuxtLink>
          </div>
        </section>

        <section class="section-card">
          <h3 class="text-lg leading-none font-semibold text-[var(--color-text)]">Plans & Pricing</h3>
          <p class="mt-1 text-sm text-muted">Choose the perfect plan for your study needs.</p>
          <div class="mt-3 space-y-3">
            <div v-for="plan in (pricingPlans || []).slice(0, 2)" :key="plan.id" class="rounded-xl border border-[var(--color-border)] p-4">
              <div class="mb-2 flex items-center justify-between">
                <p class="font-semibold text-[var(--color-text)]">{{ plan.name }}</p>
                <span v-if="plan.badge" class="status-badge status-info">{{ plan.badge }}</span>
              </div>
              <p class="text-[24px] leading-tight font-semibold text-[var(--color-text)]">{{ plan.priceLabel }}</p>
              <ul class="mt-2 space-y-1 text-[13px] text-[var(--color-text-soft)]">
                <li v-for="feature in plan.features" :key="feature" class="flex items-center gap-2">
                  <UIcon name="i-lucide-check" class="size-3.5 text-[var(--color-primary)]" />
                  <span>{{ feature }}</span>
                </li>
              </ul>
              <NuxtLink to="/settings/billing/plans" class="mt-3 flex h-10 w-full items-center justify-center rounded-xl border border-[var(--color-primary)] text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] transition cursor-pointer">
                {{ plan.cta }}
              </NuxtLink>
            </div>
          </div>
        </section>
      </aside>
    </div>

    <!-- Add/Update Payment Method Dialog Modal -->
    <Transition name="fade">
      <div
        v-if="isPaymentModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      >
        <div 
          class="w-full max-w-md rounded-3xl bg-[var(--color-card-bg)] border border-[var(--color-border)] p-6 shadow-floating transform transition-all duration-300 scale-100"
          role="dialog"
          aria-modal="true"
        >
          <h3 class="text-xl font-extrabold text-[var(--color-text)] flex items-center gap-2">
            <UIcon name="i-lucide-credit-card" class="size-5 text-[var(--color-primary)]" />
            <span>Manage Payment Methods</span>
          </h3>

          <!-- Case 1: User has saved payment methods -->
          <div v-if="paymentMethods && paymentMethods.length > 0" class="mt-4 space-y-4">
            <p class="text-sm text-[var(--color-text-soft)]">
              Select a card to use as your default payment method or add a new card securely through Stripe.
            </p>

            <div class="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              <label 
                v-for="method in paymentMethods" 
                :key="method.stripePaymentMethodId || method._id" 
                class="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)]/20 hover:bg-[var(--color-bg-soft)]/40 transition cursor-pointer"
                :class="{ 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]/5': selectedCardId === method.id }"
              >
                <div class="flex items-center gap-3">
                  <input 
                    type="radio" 
                    :value="method.id" 
                    v-model="selectedCardId" 
                    class="accent-[var(--color-primary)] size-4 cursor-pointer" 
                  />
                  <div class="flex items-center gap-2">
                    <UIcon :name="brandIcon(method.brand)" class="size-5 text-[var(--color-text-soft)]" />
                    <span class="text-sm font-semibold text-[var(--color-text)] cursor-pointer">{{ method.label }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-muted">Exp: {{ method.expiry }}</span>
                  <span v-if="method.isDefault" class="status-badge status-success text-[10px] font-medium px-1.5 py-0.5 rounded">Default</span>
                </div>
              </label>
            </div>

            <div class="mt-6 flex flex-col gap-2">
              <button
                type="button"
                class="h-10 w-full rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer border-0"
                @click="useSelectedCard"
                :disabled="isSubmittingPayment"
              >
                <UIcon v-if="isSubmittingPayment" name="i-lucide-loader-2" class="size-4 animate-spin" />
                <span>Use Selected Card</span>
              </button>
              <button
                type="button"
                class="h-10 w-full rounded-xl border border-[var(--color-border)] text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer bg-transparent"
                @click="redirectToStripe"
                :disabled="isSubmittingPayment"
              >
                <UIcon name="i-lucide-plus" class="size-4" />
                <span>Add Another Card</span>
              </button>
              <button
                type="button"
                class="h-10 w-full rounded-xl border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-soft)] font-semibold text-sm transition flex items-center justify-center cursor-pointer bg-transparent"
                @click="isPaymentModalOpen = false"
              >
                Cancel
              </button>
            </div>
          </div>

          <!-- Case 2: User has no saved card -->
          <div v-else class="mt-4 space-y-4">
            <p class="text-sm text-[var(--color-text-soft)]">
              You will be redirected securely to Stripe to setup your payment method.
            </p>
            <div class="mt-6 flex flex-col gap-2">
              <button
                type="button"
                class="h-10 w-full rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer border-0"
                @click="redirectToStripe"
                :disabled="isSubmittingPayment"
              >
                <UIcon v-if="isSubmittingPayment" name="i-lucide-loader-2" class="size-4 animate-spin" />
                <span>Add Credit Card</span>
              </button>
              <button
                type="button"
                class="h-10 w-full rounded-xl border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-soft)] font-semibold text-sm transition flex items-center justify-center cursor-pointer bg-transparent"
                @click="isPaymentModalOpen = false"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
p {
  margin-bottom: 0;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
