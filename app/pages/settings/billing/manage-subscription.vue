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
const isUpdateMode = ref(false)
const isSubmittingPayment = ref(false)
const paymentForm = ref({
  brand: 'Visa',
  number: '',
  expiry: '',
  cvv: ''
})

onMounted(async () => {
  await billingStore.loadBillingData()
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

function openAddPaymentModal() {
  isUpdateMode.value = false
  paymentForm.value = {
    brand: 'Visa',
    number: '',
    expiry: '',
    cvv: ''
  }
  isPaymentModalOpen.value = true
}

function openUpdatePaymentModal() {
  isUpdateMode.value = true
  if (defaultPaymentMethod.value) {
    paymentForm.value = {
      brand: defaultPaymentMethod.value.brand || 'Visa',
      number: defaultPaymentMethod.value.label || '',
      expiry: defaultPaymentMethod.value.expiry || '',
      cvv: ''
    }
  } else {
    paymentForm.value = {
      brand: 'Visa',
      number: '',
      expiry: '',
      cvv: ''
    }
  }
  isPaymentModalOpen.value = true
}

function closePaymentModal() {
  isPaymentModalOpen.value = false
}

async function submitPaymentMethod() {
  isSubmittingPayment.value = true
  feedback.value = null
  try {
    const rawNumber = paymentForm.value.number.replace(/\s+/g, '')
    const last4 = rawNumber.slice(-4) || '4242'
    const label = `${paymentForm.value.brand} ending in ${last4}`

    // If update mode, first remove current default payment method if it exists
    if (isUpdateMode.value && defaultPaymentMethod.value) {
      await billingStore.removePaymentMethod(defaultPaymentMethod.value.id)
    }

    const ok = await billingStore.addPaymentMethod({
      brand: paymentForm.value.brand,
      label: label,
      expiry: paymentForm.value.expiry
    })
    
    if (ok) {
      await billingStore.refreshBillingData(true)
      feedback.value = {
        tone: 'success',
        text: isUpdateMode.value ? 'Payment method updated successfully.' : 'Payment method added successfully.'
      }
      closePaymentModal()
    } else {
      feedback.value = {
        tone: 'warning',
        text: error.value || 'Failed to save payment method.'
      }
    }
  } catch (err: any) {
    feedback.value = {
      tone: 'warning',
      text: err?.message || 'An error occurred while saving the payment method.'
    }
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
      await billingStore.refreshBillingData(true)
      feedback.value = {
        tone: 'success',
        text: 'Payment method removed successfully.'
      }
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
                <div v-if="!defaultPaymentMethod" class="flex flex-col items-center justify-center p-8 text-center border border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-bg-soft)]/30">
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
                <!-- Card Style matching Billing page -->
                <div v-else class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex items-center gap-3">
                      <div class="icon-box icon-box-warning !size-11">
                        <UIcon :name="brandIcon(defaultPaymentMethod.brand)" class="size-5" />
                      </div>
                      <div>
                        <p class="font-bold text-base text-[var(--color-text)]">
                          {{ defaultPaymentMethod.label }}
                        </p>
                        <p class="text-sm text-muted mt-1">
                          Expiration: {{ defaultPaymentMethod.expiry }}
                        </p>
                        <p class="text-sm text-muted mt-1">
                          Billing Address: Default billing address
                        </p>
                      </div>
                    </div>
                    <span class="status-badge status-success">Default</span>
                  </div>

                  <div class="mt-6 flex flex-wrap gap-3 border-t border-[var(--color-border)] pt-4">
                    <button 
                      type="button" 
                      class="h-10 px-4 text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl transition cursor-pointer"
                      @click="openUpdatePaymentModal"
                    >
                      Update payment method
                    </button>
                    <button 
                      type="button" 
                      class="h-10 px-4 text-sm font-semibold text-[var(--color-primary)] border border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] rounded-xl transition cursor-pointer bg-transparent"
                      @click="openAddPaymentModal"
                    >
                      Add new payment method
                    </button>
                    <button 
                      type="button" 
                      class="h-10 px-4 text-sm font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-xl transition cursor-pointer bg-transparent"
                      @click="removePayment(defaultPaymentMethod.id)"
                      :disabled="isProcessingAction"
                    >
                      Remove payment method
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
            <span>{{ isUpdateMode ? 'Update Payment Method' : 'Add Payment Method' }}</span>
          </h3>

          <form @submit.prevent="submitPaymentMethod" class="mt-4 space-y-4">
            <div>
              <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Card Brand</label>
              <select v-model="paymentForm.brand" class="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]">
                <option value="Visa">Visa</option>
                <option value="Mastercard">Mastercard</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Card Number</label>
              <input 
                v-model="paymentForm.number" 
                type="text" 
                placeholder="4242 4242 4242 4242" 
                maxlength="19" 
                class="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]" 
                required
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Expiration (MM/YY)</label>
                <input 
                  v-model="paymentForm.expiry" 
                  type="text" 
                  placeholder="07/28" 
                  maxlength="5" 
                  class="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]" 
                  required
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">CVC / CVV</label>
                <input 
                  v-model="paymentForm.cvv" 
                  type="password" 
                  placeholder="123" 
                  maxlength="3" 
                  class="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]" 
                  required
                />
              </div>
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button
                type="button"
                class="h-10 rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-soft)] transition"
                @click="closePaymentModal"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="h-10 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition flex items-center justify-center gap-2"
                :disabled="isSubmittingPayment"
              >
                <UIcon v-if="isSubmittingPayment" name="i-lucide-loader-2" class="size-4 animate-spin" />
                <span>Save Card</span>
              </button>
            </div>
          </form>
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
