<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import SettingsTabs from '~/components/settings/SettingsTabs.vue'
import CompactPlanChangePanel from '~/components/billing/CompactPlanChangePanel.vue'

definePageMeta({ layout: 'dashboard' })

const billingStore = useBillingStore()
const { subscription, paymentMethods, loading, error } = storeToRefs(billingStore)

const activeAccordion = ref<number | null>(0)
const isProcessingAction = ref(false)
const isCancelConfirmOpen = ref(false)
const feedback = ref<{ tone: 'success' | 'warning' | 'info', text: string } | null>(null)

async function confirmCancelSubscription() {
  isCancelConfirmOpen.value = false
  await cancelSubscription()
}

// Payment Modal State
const isPaymentModalOpen = ref(false)
const isSubmittingPayment = ref(false)
const selectedCardId = ref('')

const route = useRoute()
const router = useRouter()

onMounted(async () => {
  const hasStripeSuccess = Boolean(route.query.stripe_success && route.query.session_id)

  if (hasStripeSuccess) {
    const sessionId = String(route.query.session_id)
    const query = { ...route.query }
    delete query.stripe_success
    delete query.session_id
    delete query.stripe_cancel
    await router.replace({ query })

    feedback.value = { tone: 'info', text: 'Payment method is being verified...' }

    const methods = await billingStore.ensureStripePaymentMethod(sessionId, 5, 1500)
    const verified = Boolean(methods && methods.length > 0)

    if (verified) {
      feedback.value = { tone: 'success', text: 'Payment method added successfully.' }
    } else {
      feedback.value = { tone: 'warning', text: 'Stripe verification is taking longer than expected. Please refresh in a moment.' }
    }
  } else {
    await billingStore.loadBillingData()

    if (route.query.stripe_cancel) {
      const query = { ...route.query }
      delete query.stripe_cancel
      router.replace({ query })
      feedback.value = { tone: 'info', text: 'Card setup was cancelled.' }
    }
  }
})

const defaultPaymentMethod = computed(() => {
  if (!paymentMethods.value || paymentMethods.value.length === 0) return null
  return paymentMethods.value.find(m => m.isDefault) || paymentMethods.value[0]
})

function toDateLabel(value?: string) {
  if (!value) return 'Not available'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function brandIcon(brand: string) {
  if (!brand) return 'i-lucide-credit-card'
  const b = brand.toLowerCase()
  if (b.includes('visa')) return 'i-simple-icons-visa'
  if (b.includes('mastercard') || b.includes('master')) return 'i-simple-icons-mastercard'
  return 'i-lucide-credit-card'
}

function toggleAccordion(index: number | null) {
  if (activeAccordion.value === index) {
    activeAccordion.value = null
  } else {
    activeAccordion.value = index
  }
}

async function retryFetch() {
  feedback.value = null
  await billingStore.loadBillingData()
}

async function openAddPaymentModal() {
  isProcessingAction.value = true
  try {
    await billingStore.refreshPaymentMethods()
  } catch (err) {
    console.error('Error loading latest payment methods:', err)
  } finally {
    isProcessingAction.value = false
  }
  selectedCardId.value = defaultPaymentMethod.value?.id || paymentMethods.value[0]?.id || ''
  isPaymentModalOpen.value = true
}

function closePaymentModal() {
  isPaymentModalOpen.value = false
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

async function removePayment(id: string) {
  isProcessingAction.value = true
  feedback.value = null
  try {
    const ok = await billingStore.removePaymentMethod(id)
    if (ok) {
      const methods = await billingStore.refreshPaymentMethods()
      feedback.value = methods ? { tone: 'success', text: 'Payment method removed successfully.' } : { tone: 'warning', text: error.value || 'Removed the payment method, but failed to refresh the list.' }
    } else {
      feedback.value = {
        tone: 'warning',
        text: error.value || 'Failed to remove payment method.'
      }
    }
  } catch (err: any) {
    feedback.value = {
      tone: 'warning',
      text: err?.message || 'An error occurred while removing the payment method.'
    }
  } finally {
    isProcessingAction.value = false
  }
}

async function cancelSubscription() {
  isProcessingAction.value = true
  feedback.value = null
  try {
    const ok = await billingStore.cancelPlan()
    if (ok) {
      await billingStore.refreshBillingData(true)
      feedback.value = {
        tone: 'success',
        text: 'Subscription cancelled successfully.'
      }
      activeAccordion.value = 2 // Keep cancel membership open to show cancelled status
    } else {
      feedback.value = {
        tone: 'warning',
        text: error.value || 'Failed to cancel subscription.'
      }
    }
  } catch (err: any) {
    feedback.value = {
      tone: 'warning',
      text: err?.message || 'An error occurred while cancelling subscription.'
    }
  } finally {
    isProcessingAction.value = false
  }
}

async function reactivateSubscription() {
  isProcessingAction.value = true
  feedback.value = null
  try {
    const targetPlan = (subscription.value as any)?.plan || (subscription.value?.name?.toLowerCase().includes('student') ? 'student' : 'pro')
    const ok = await billingStore.upgradePlan(targetPlan)
    if (ok) {
      await billingStore.refreshBillingData(true)
      feedback.value = {
        tone: 'success',
        text: 'Subscription reactivated successfully!'
      }
    } else {
      feedback.value = {
        tone: 'warning',
        text: error.value || 'Failed to reactivate subscription.'
      }
    }
  } catch (err: any) {
    feedback.value = {
      tone: 'warning',
      text: err?.message || 'An error occurred while reactivating subscription.'
    }
  } finally {
    isProcessingAction.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-[1440px] space-y-4 pb-8">
    <SettingsTabs />

    <!-- Feedback & Action Alerts -->
    <div
      v-if="feedback"
      class="w-full rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 shadow-sm"
      :class="feedback.tone === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'"
    >
      {{ feedback.text }}
    </div>

    <!-- Error Alert when we can't fetch anything -->
    <div 
      v-if="error && !subscription && !feedback" 
      class="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-bg)] px-4 py-3 text-sm text-[var(--color-danger)] shadow-sm"
    >
      {{ error }}
    </div>

    <!-- Header Block (Left aligned, compact spacing) -->
    <div class="space-y-2">
      <!-- Breadcrumbs (Left aligned) -->
      <nav class="flex items-center gap-2 text-sm font-semibold text-muted">
        <NuxtLink to="/settings/billing" class="hover:text-[var(--color-primary)] transition-colors">Billing</NuxtLink>
        <UIcon name="i-lucide-chevron-right" class="size-4" />
        <span class="text-[var(--color-text)]">Manage Subscription</span>
      </nav>
    </div>

    <!-- Retry Screen when there is no subscription data and loading failed -->
    <div v-if="error && !subscription" class="max-w-md mx-auto text-center py-12 section-card border border-[var(--color-border)] shadow-md">
      <div class="icon-box icon-box-danger mb-4 mx-auto">
        <UIcon name="i-lucide-alert-triangle" class="size-6 text-[var(--color-danger)]" />
      </div>
      <h3 class="text-lg font-bold text-[var(--color-text)]">Unable to load billing details</h3>
      <p class="text-sm text-[var(--color-text-soft)] mt-2 mb-6">
        {{ error }}
      </p>
      <button 
        type="button" 
        class="h-11 px-6 text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl transition cursor-pointer flex items-center justify-center gap-2 mx-auto"
        @click="retryFetch"
      >
        <UIcon name="i-lucide-refresh-cw" class="size-4" />
        <span>Retry Connection</span>
      </button>
    </div>

    <!-- Accordion Wrapper -->
    <div v-else class="space-y-3 w-full">
      <!-- 1. Change Membership Plan Accordion -->
      <div class="section-card !p-0 overflow-hidden border border-[var(--color-border)] shadow-sm rounded-[var(--radius-2xl)]">
        <button 
          type="button"
          class="w-full flex items-center justify-between py-3.5 px-4 text-left font-bold text-base text-[var(--color-text)] hover:bg-[var(--color-bg-soft)]/40 transition-colors"
          @click="toggleAccordion(0)"
        >
          <div class="flex items-center gap-3">
            <div class="icon-box icon-box-primary !size-9 shrink-0">
              <UIcon name="i-lucide-graduation-cap" class="size-5" />
            </div>
            <span>Change Membership Plan</span>
          </div>
          <UIcon 
            name="i-lucide-chevron-down" 
            class="size-5 transition-transform duration-300 text-muted"
            :class="{ 'rotate-180': activeAccordion === 0 }"
          />
        </button>
        <div class="accordion-content" :class="{ 'is-open': activeAccordion === 0 }">
          <div class="accordion-inner">
            <div class="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-soft)]/20">
              <!-- Individual Skeleton -->
              <div v-if="loading && activeAccordion === 0" class="animate-pulse space-y-4">
                <div class="h-24 bg-[var(--color-bg-soft)] rounded-2xl w-full"></div>
                <div class="h-10 bg-[var(--color-bg-soft)] rounded-2xl w-32 mx-auto"></div>
                <div class="h-28 bg-[var(--color-bg-soft)] rounded-2xl w-full"></div>
              </div>
              <CompactPlanChangePanel v-else />
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Change Payment Method Accordion -->
      <div class="section-card !p-0 overflow-hidden border border-[var(--color-border)] shadow-sm rounded-[var(--radius-2xl)]">
        <button 
          type="button"
          class="w-full flex items-center justify-between py-3.5 px-4 text-left font-bold text-base text-[var(--color-text)] hover:bg-[var(--color-bg-soft)]/40 transition-colors"
          @click="toggleAccordion(1)"
        >
          <div class="flex items-center gap-3">
            <div class="icon-box icon-box-primary !size-9 shrink-0">
              <UIcon name="i-lucide-credit-card" class="size-5" />
            </div>
            <span>Change Payment Method</span>
          </div>
          <UIcon 
            name="i-lucide-chevron-down" 
            class="size-5 transition-transform duration-300 text-muted"
            :class="{ 'rotate-180': activeAccordion === 1 }"
          />
        </button>
        <div class="accordion-content" :class="{ 'is-open': activeAccordion === 1 }">
          <div class="accordion-inner">
            <div class="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-soft)]/20">
              <!-- Individual Skeleton -->
              <div v-if="loading && activeAccordion === 1" class="animate-pulse space-y-4">
                <div class="h-32 bg-[var(--color-bg-soft)] rounded-2xl w-full"></div>
              </div>
              <div v-else>
                <!-- Empty State -->
                <div v-if="!paymentMethods || paymentMethods.length === 0" class="flex flex-col items-center justify-center p-8 text-center border border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-bg-soft)]/30">
                  <div class="icon-box icon-box-primary mb-3">
                    <UIcon name="i-lucide-credit-card" class="size-6 text-[var(--color-primary)]" />
                  </div>
                  <p class="font-semibold text-[var(--color-text)]">No payment method found</p>
                  <p class="text-sm text-[var(--color-text-soft)] mt-1 mb-0">Please add a payment method to manage your subscription.</p>
                  <button 
                    type="button" 
                    class="mt-4 h-10 px-5 text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl transition cursor-pointer flex items-center gap-2"
                    @click="openAddPaymentModal"
                  >
                    <UIcon name="i-lucide-plus" class="size-4" />
                    <span>Add Payment Method</span>
                  </button>
                </div>
                <!-- Card Style rendering directly from billingStore.paymentMethods -->
                <div v-else class="space-y-4">
                  <div 
                    v-for="method in paymentMethods" 
                    :key="method.stripePaymentMethodId || method._id" 
                    class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
                  >
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex items-center gap-3">
                        <div class="icon-box icon-box-warning !size-11">
                          <UIcon :name="brandIcon(method.brand)" class="size-5" />
                        </div>
                        <div>
                          <p class="font-bold text-base text-[var(--color-text)]">
                            {{ method.label }}
                          </p>
                          <p class="text-sm text-muted mt-1">
                            Expiration: {{ method.expiry }}
                          </p>
                          <p class="text-sm text-muted mt-1">
                            Billing Address: Default billing address
                          </p>
                        </div>
                      </div>
                      <span v-if="method.isDefault" class="status-badge status-success">Default</span>
                    </div>

                    <div class="mt-4 flex flex-wrap gap-3 border-t border-[var(--color-border)] pt-3">
                      <button 
                        v-if="!method.isDefault"
                        type="button" 
                        class="h-9 px-4 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl transition cursor-pointer"
                        @click="selectedCardId = method.id; useSelectedCard()"
                        :disabled="isProcessingAction"
                      >
                        Set as default
                      </button>
                      <button 
                        type="button" 
                        class="h-9 px-4 text-xs font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-xl transition cursor-pointer bg-transparent"
                        @click="removePayment(method.id)"
                        :disabled="isProcessingAction"
                      >
                        Remove card
                      </button>
                    </div>
                  </div>

                  <div class="mt-6 flex flex-wrap gap-3 border-t border-[var(--color-border)] pt-4">
                    <button 
                      type="button" 
                      class="h-10 px-4 text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl transition cursor-pointer"
                      @click="openAddPaymentModal"
                    >
                      Update payment methods
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Cancel Membership Accordion -->
      <div class="section-card !p-0 overflow-hidden border border-[var(--color-border)] shadow-sm rounded-[var(--radius-2xl)]">
        <button 
          type="button"
          class="w-full flex items-center justify-between py-3.5 px-4 text-left font-bold text-base text-[var(--color-text)] hover:bg-[var(--color-bg-soft)]/40 transition-colors"
          @click="toggleAccordion(2)"
        >
          <div class="flex items-center gap-3">
            <div class="icon-box icon-box-danger !size-9 bg-rose-50 text-rose-500 shrink-0">
              <UIcon name="i-lucide-slash" class="size-5" />
            </div>
            <span>Cancel Membership</span>
          </div>
          <UIcon 
            name="i-lucide-chevron-down" 
            class="size-5 transition-transform duration-300 text-muted"
            :class="{ 'rotate-180': activeAccordion === 2 }"
          />
        </button>
        <div class="accordion-content" :class="{ 'is-open': activeAccordion === 2 }">
          <div class="accordion-inner">
            <div class="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-soft)]/20">
              <!-- Individual Skeleton -->
              <div v-if="loading && activeAccordion === 2" class="animate-pulse space-y-4">
                <div class="h-32 bg-[var(--color-bg-soft)] rounded-2xl w-full"></div>
              </div>
              <div v-else>
                <!-- CASE 3 — Cancelled subscription -->
                <div v-if="subscription?.status === 'cancelled'" class="space-y-6 text-left">
                  <!-- Green success info card -->
                  <div class="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 p-4 shadow-sm animate-fade-in">
                    <div class="flex items-start gap-4">
                      <div class="icon-box !bg-emerald-500/10 dark:!bg-emerald-500/20 !size-11 shrink-0 flex items-center justify-center rounded-xl text-emerald-600 dark:text-emerald-400">
                        <UIcon name="i-lucide-check-circle" class="size-6" />
                      </div>
                      <div>
                        <h4 class="font-bold text-emerald-800 dark:text-emerald-300 text-sm">Subscription Scheduled for Cancellation</h4>
                        <p class="text-sm text-emerald-700/90 dark:text-emerald-400/90 mt-1.5 leading-relaxed">
                          Your subscription has been cancelled successfully. You'll continue enjoying {{ subscription?.name || 'Pro' }} benefits until {{ toDateLabel(subscription?.nextBillingDate) }}.
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Reactivate button -->
                  <div class="flex justify-start">
                    <button 
                      type="button" 
                      class="h-9 px-4 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl transition cursor-pointer flex items-center gap-2 shadow-sm"
                      @click="reactivateSubscription"
                      :disabled="isProcessingAction"
                    >
                      <UIcon v-if="isProcessingAction" name="i-lucide-loader-2" class="size-4 animate-spin" />
                      <span>Reactivate Subscription</span>
                    </button>
                  </div>
                </div>

                <!-- CASE 1 — Active subscription (default) -->
                <div v-else class="space-y-4 text-left">
                  <h4 class="text-base font-bold text-[var(--color-text)]">Cancel Subscription</h4>
                  <p class="text-sm text-[var(--color-text-soft)] leading-relaxed">
                    Your {{ subscription?.name || 'Pro' }} subscription will remain active until the end of the current billing period. After cancellation, your account will automatically switch to the Free plan.
                  </p>

                  <ul class="space-y-2.5 text-sm text-[var(--color-text-soft)] my-4">
                    <li class="flex items-center gap-2">
                      <span class="inline-block size-1.5 rounded-full bg-[var(--color-text-soft)]"></span>
                      <span class="font-semibold text-[var(--color-text)]">Current plan:</span>
                      <span>{{ subscription?.name || 'Pro Plan' }}</span>
                    </li>
                    <li class="flex items-center gap-2" v-if="subscription?.nextBillingDate">
                      <span class="inline-block size-1.5 rounded-full bg-[var(--color-text-soft)]"></span>
                      <span class="font-semibold text-[var(--color-text)]">Next billing date:</span>
                      <span>{{ toDateLabel(subscription.nextBillingDate) }}</span>
                    </li>
                    <li class="flex items-center gap-2">
                      <span class="inline-block size-1.5 rounded-full bg-[var(--color-text-soft)]"></span>
                      <span class="font-semibold text-[var(--color-text)]">Billing cycle:</span>
                      <span class="capitalize">{{ subscription?.billingCycle || 'Monthly' }}</span>
                    </li>
                  </ul>

                  <div class="pt-4 border-t border-[var(--color-border)] flex justify-start">
                    <button 
                      type="button" 
                      class="h-9 px-4 text-xs font-semibold text-white bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/90 rounded-xl transition cursor-pointer shadow-sm flex items-center gap-2"
                      @click="isCancelConfirmOpen = true"
                    >
                      <span>Cancel Subscription</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Update Payment Method Dialog Modal -->
    <Transition name="fade">
      <div
        v-if="isPaymentModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
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
                    class="accent-[var(--color-primary)] size-4" 
                  />
                  <div class="flex items-center gap-2">
                    <UIcon :name="brandIcon(method.brand)" class="size-5 text-[var(--color-text-soft)]" />
                    <span class="text-sm font-semibold text-[var(--color-text)]">{{ method.label }}</span>
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

    <!-- Cancel Subscription Confirmation Modal -->
    <Transition name="fade">
      <div
        v-if="isCancelConfirmOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      >
        <div 
          class="w-full max-w-md rounded-3xl bg-[var(--color-card-bg)] border border-[var(--color-border)] p-6 shadow-floating transform transition-all duration-300 scale-100"
          role="dialog"
          aria-modal="true"
        >
          <h3 class="text-xl font-extrabold text-[var(--color-text)] flex items-center gap-2">
            <UIcon name="i-lucide-alert-triangle" class="size-5 text-[var(--color-danger)]" />
            <span>Cancel your subscription?</span>
          </h3>

          <p class="mt-4 text-sm text-[var(--color-text-soft)] leading-relaxed">
            Your {{ subscription?.name || 'Pro' }} plan will remain active until the end of the current billing cycle. You can reactivate your subscription anytime before it expires.
          </p>

          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="h-10 rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-soft)] transition cursor-pointer"
              @click="isCancelConfirmOpen = false"
            >
              Keep Subscription
            </button>
            <button
              type="button"
              class="h-10 rounded-xl bg-[var(--color-danger)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-danger)]/90 transition cursor-pointer flex items-center justify-center gap-2"
              @click="confirmCancelSubscription"
              :disabled="isProcessingAction"
            >
              <UIcon v-if="isProcessingAction" name="i-lucide-loader-2" class="size-4 animate-spin" />
              <span>Yes, Cancel Subscription</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.accordion-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--transition-normal) var(--ease-smooth);
}
.accordion-content.is-open {
  grid-template-rows: 1fr;
}
.accordion-inner {
  overflow: hidden;
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
