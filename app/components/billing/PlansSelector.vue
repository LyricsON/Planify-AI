<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import PricingGrid from '~/components/billing/PricingGrid.vue'
import UpgradeDialog from '~/components/billing/UpgradeDialog.vue'

const billingStore = useBillingStore()
const { subscription, pricingPlans, error, tokenBalance } = storeToRefs(billingStore)
const router = useRouter()

const isProcessing = ref(false)
const feedback = ref<{ tone: 'success' | 'warning', text: string } | null>(null)

const confirmDialog = ref({
  isOpen: false,
  planId: '',
  planName: '',
  action: '' as 'upgrade' | 'downgrade' | 'contact' | ''
})

const currentPlanId = computed(() => {
  if (!subscription.value || subscription.value.status === 'cancelled' || subscription.value.status === 'expired') {
    return 'free'
  }
  const planKey = (subscription.value as any).plan?.toLowerCase() || ''
  if (['student', 'pro'].includes(planKey)) return planKey
  const name = subscription.value.name?.toLowerCase() || ''
  if (name.includes('student')) return 'student'
  if (name.includes('pro')) return 'pro'
  return 'free'
})

function toDateLabel(value?: string) {
  if (!value) return 'Not available'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

const totalLimit = computed(() => Number(tokenBalance.value?.limit || 0))
const totalUsed = computed(() => Number(tokenBalance.value?.used || 0))
const usedPct = computed(() => Number(tokenBalance.value?.usedPercentage || 0))

const studentPriceLabel = computed(() => {
  const backendPlan = pricingPlans.value.find(p => p.id === 'student')
  if (backendPlan?.priceLabel) {
    return backendPlan.priceLabel.split('/')[0].trim()
  }
  return '9.99 TND'
})

const proPriceLabel = computed(() => {
  const backendPlan = pricingPlans.value.find(p => p.id === 'pro')
  if (backendPlan?.priceLabel) {
    return backendPlan.priceLabel.split('/')[0].trim()
  }
  return '19.99 TND'
})

const plans = computed(() => [
  {
    id: 'free',
    name: 'FREE',
    price: '0 TND',
    priceSub: '/month',
    description: 'Basic planner features with limited daily assistant credits.',
    features: [
      'Basic AI Assistant',
      '500 AI Tokens/month',
      'Tasks',
      'Courses',
      'Schedule',
      'Basic Analytics'
    ]
  },
  {
    id: 'student',
    name: 'STUDENT',
    price: studentPriceLabel.value,
    priceSub: '/month',
    description: 'Advanced features tailored for students and daily learners.',
    features: [
      'Everything in Free',
      '50,000 AI Tokens',
      'Smart Planner',
      'Flashcards',
      'AI Quiz Generator',
      'Document Analysis',
      'Priority AI'
    ]
  },
  {
    id: 'pro',
    name: 'PRO',
    price: proPriceLabel.value,
    priceSub: '/month',
    description: 'Our most popular tier. Complete AI coach suite for power study.',
    isPopular: true,
    features: [
      'Everything in Student',
      '150,000 AI Tokens',
      'Unlimited Study Plans',
      'Advanced Analytics',
      'AI Study Coach',
      'Calendar Optimization',
      'Exam Prediction',
      'Priority Processing',
      'Early AI Features'
    ]
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    price: 'Contact Sales',
    priceSub: '',
    description: 'Collaborative workspaces for study groups and institutions.',
    features: [
      'Unlimited users',
      'Admin Dashboard',
      'Shared Workspace',
      'Dedicated Support',
      'API Access',
      'Custom Integrations'
    ]
  }
])

const planValues: Record<string, number> = {
  'free': 0,
  'student': 1,
  'pro': 2,
  'enterprise': 3
}

const handlePlanAction = (planId: string) => {
  feedback.value = null
  if (planId === 'enterprise') {
    confirmDialog.value = {
      isOpen: true,
      planId: 'enterprise',
      planName: 'Enterprise',
      action: 'contact'
    }
    return
  }
  const currentVal = planValues[currentPlanId.value] ?? 0
  const targetVal = planValues[planId] ?? 0
  if (currentVal === targetVal) return

  confirmDialog.value = {
    isOpen: true,
    planId,
    planName: planId === 'free' ? 'Free' : planId === 'student' ? 'Student' : 'Pro',
    action: targetVal > currentVal ? 'upgrade' : 'downgrade'
  }
}

const executePlanChange = async () => {
  const { planId, action } = confirmDialog.value
  isProcessing.value = true
  feedback.value = null
  let success = false
  try {
    if (planId === 'free') {
      success = await billingStore.cancelPlan()
    } else {
      success = await billingStore.upgradePlan(planId)
    }
    if (success) {
      await billingStore.refreshBillingData(true)
      const planNameFormatted = planId.charAt(0).toUpperCase() + planId.slice(1)
      feedback.value = { tone: 'success', text: `Successfully ${action === 'upgrade' ? 'upgraded' : 'downgraded'} to the ${planNameFormatted} plan!` }
      setTimeout(() => { router.push('/settings/billing') }, 2000)
    } else {
      feedback.value = { tone: 'warning', text: error.value || `Failed to ${action} plan. Please try again.` }
    }
  } catch (err: any) {
    feedback.value = { tone: 'warning', text: err?.message || 'An unexpected error occurred.' }
  } finally {
    isProcessing.value = false
    confirmDialog.value.isOpen = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Feedback & Error Alerts -->
    <div
      v-if="feedback"
      class="rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300"
      :class="feedback.tone === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'"
    >
      {{ feedback.text }}
    </div>
    <div 
      v-if="error && !feedback" 
      class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-bg)] px-4 py-3 text-sm text-[var(--color-danger)]"
    >
      {{ error }}
    </div>

    <!-- Full Width Current Plan Summary -->
    <section v-if="subscription" class="section-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      
      <div class="flex items-center gap-3 flex-1">
        <div class="icon-box icon-box-primary !size-10 shrink-0">
          <UIcon name="i-lucide-check-circle-2" class="size-5" />
        </div>
        <div>
          <p class="text-xs font-semibold text-muted uppercase tracking-wider mb-0.5">Current Plan</p>
          <p class="text-base leading-tight font-bold text-[var(--color-text)]">{{ subscription.name || 'Free Plan' }}</p>
        </div>
      </div>
      
      <div class="hidden md:block h-10 w-px bg-[var(--color-border)]"></div>
      
      <div class="flex items-center gap-3 flex-1">
        <div class="icon-box !size-10 shrink-0 bg-amber-100 text-amber-500">
          <UIcon name="i-lucide-coins" class="size-5" />
        </div>
        <div>
          <p class="text-xs font-semibold text-muted uppercase tracking-wider mb-0.5">Monthly Tokens</p>
          <p class="text-base leading-tight font-bold text-[var(--color-text)]">{{ totalLimit.toLocaleString() }}</p>
        </div>
      </div>
      
      <div class="hidden md:block h-10 w-px bg-[var(--color-border)]"></div>
      
      <div class="flex items-center gap-3 flex-1 w-full">
        <div class="icon-box !size-10 shrink-0 bg-indigo-100 text-indigo-500">
          <UIcon name="i-lucide-activity" class="size-5" />
        </div>
        <div class="flex-1 w-full">
          <div class="flex justify-between items-center w-full mb-1">
            <p class="text-xs font-semibold text-muted uppercase tracking-wider">Usage</p>
            <span class="text-sm font-bold text-[var(--color-text)]">{{ usedPct }}%</span>
          </div>
          <div class="h-2 w-full rounded-full bg-[var(--color-bg-soft)] overflow-hidden">
            <div class="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500" :style="{ width: `${usedPct}%` }"></div>
          </div>
        </div>
      </div>

      <div class="hidden md:block h-10 w-px bg-[var(--color-border)]"></div>
      
      <div class="flex items-center gap-3 flex-1">
        <div class="icon-box !size-10 shrink-0 bg-emerald-100 text-emerald-500">
          <UIcon name="i-lucide-calendar" class="size-5" />
        </div>
        <div>
          <p class="text-xs font-semibold text-muted uppercase tracking-wider mb-0.5">Next Billing</p>
          <p class="text-base leading-tight font-bold text-[var(--color-text)]">{{ subscription.nextBillingDate ? toDateLabel(subscription.nextBillingDate) : 'N/A' }}</p>
        </div>
      </div>
      
    </section>

    <!-- Pricing Grid -->
    <PricingGrid
      :plans="plans"
      :current-plan-id="currentPlanId"
      :loading="isProcessing"
      @action="handlePlanAction"
    />

    <!-- Feature Comparison -->
    <section class="mt-8 section-card p-0 overflow-hidden mb-4">
      <div class="p-6 md:p-8 text-center border-b border-[var(--color-border)]">
        <h3 class="text-xl md:text-2xl font-bold tracking-tight text-[var(--color-text)]">Compare Features</h3>
        <p class="text-[var(--color-text-soft)] text-sm mt-1">A detailed breakdown of what's included in each plan.</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead>
            <tr class="border-b border-[var(--color-border)] bg-[var(--color-bg-soft)]/50">
              <th class="p-4 md:p-6 font-semibold text-muted w-[40%]">Features</th>
              <th class="p-4 md:p-6 font-bold text-center w-[15%] text-[var(--color-text)]">Free</th>
              <th class="p-4 md:p-6 font-bold text-center w-[15%] text-[var(--color-text)]">Student</th>
              <th class="p-4 md:p-6 font-bold text-center w-[15%] text-[var(--color-primary)]">Pro</th>
              <th class="p-4 md:p-6 font-bold text-center w-[15%] text-[var(--color-text)]">Enterprise</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--color-border)] text-[var(--color-text-soft)]">
            <tr class="hover:bg-[var(--color-bg-soft)] transition-colors">
              <td class="p-6 font-medium text-[var(--color-text)]">AI Tokens</td>
              <td class="p-6 text-center">500</td>
              <td class="p-6 text-center">50K</td>
              <td class="p-6 text-center font-bold text-[var(--color-primary)]">150K</td>
              <td class="p-6 text-center">Unlimited</td>
            </tr>
            <tr class="hover:bg-[var(--color-bg-soft)] transition-colors">
              <td class="p-6 font-medium text-[var(--color-text)]">AI Assistant</td>
              <td class="p-6 text-center"><UIcon name="i-lucide-check" class="size-4 mx-auto text-emerald-500"/></td>
              <td class="p-6 text-center"><UIcon name="i-lucide-check" class="size-4 mx-auto text-emerald-500"/></td>
              <td class="p-6 text-center"><UIcon name="i-lucide-check" class="size-4 mx-auto text-emerald-500"/></td>
              <td class="p-6 text-center"><UIcon name="i-lucide-check" class="size-4 mx-auto text-emerald-500"/></td>
            </tr>
            <tr class="hover:bg-[var(--color-bg-soft)] transition-colors">
              <td class="p-6 font-medium text-[var(--color-text)]">Smart Planner</td>
              <td class="p-6 text-center text-[var(--color-border-hover)]">—</td>
              <td class="p-6 text-center"><UIcon name="i-lucide-check" class="size-4 mx-auto text-emerald-500"/></td>
              <td class="p-6 text-center"><UIcon name="i-lucide-check" class="size-4 mx-auto text-emerald-500"/></td>
              <td class="p-6 text-center"><UIcon name="i-lucide-check" class="size-4 mx-auto text-emerald-500"/></td>
            </tr>
            <tr class="hover:bg-[var(--color-bg-soft)] transition-colors">
              <td class="p-6 font-medium text-[var(--color-text)]">Flashcards</td>
              <td class="p-6 text-center text-[var(--color-border-hover)]">—</td>
              <td class="p-6 text-center"><UIcon name="i-lucide-check" class="size-4 mx-auto text-emerald-500"/></td>
              <td class="p-6 text-center"><UIcon name="i-lucide-check" class="size-4 mx-auto text-emerald-500"/></td>
              <td class="p-6 text-center"><UIcon name="i-lucide-check" class="size-4 mx-auto text-emerald-500"/></td>
            </tr>
            <tr class="hover:bg-[var(--color-bg-soft)] transition-colors">
              <td class="p-6 font-medium text-[var(--color-text)]">Analytics</td>
              <td class="p-6 text-center">Basic</td>
              <td class="p-6 text-center">Advanced</td>
              <td class="p-6 text-center font-bold text-[var(--color-text)]">Advanced</td>
              <td class="p-6 text-center">Custom</td>
            </tr>
            <tr class="hover:bg-[var(--color-bg-soft)] transition-colors">
              <td class="p-6 font-medium text-[var(--color-text)]">Calendar Optimization</td>
              <td class="p-6 text-center text-[var(--color-border-hover)]">—</td>
              <td class="p-6 text-center text-[var(--color-border-hover)]">—</td>
              <td class="p-6 text-center"><UIcon name="i-lucide-check" class="size-4 mx-auto text-emerald-500"/></td>
              <td class="p-6 text-center"><UIcon name="i-lucide-check" class="size-4 mx-auto text-emerald-500"/></td>
            </tr>
            <tr class="hover:bg-[var(--color-bg-soft)] transition-colors">
              <td class="p-6 font-medium text-[var(--color-text)]">Document Analysis</td>
              <td class="p-6 text-center text-[var(--color-border-hover)]">—</td>
              <td class="p-6 text-center"><UIcon name="i-lucide-check" class="size-4 mx-auto text-emerald-500"/></td>
              <td class="p-6 text-center"><UIcon name="i-lucide-check" class="size-4 mx-auto text-emerald-500"/></td>
              <td class="p-6 text-center"><UIcon name="i-lucide-check" class="size-4 mx-auto text-emerald-500"/></td>
            </tr>
            <tr class="hover:bg-[var(--color-bg-soft)] transition-colors">
              <td class="p-6 font-medium text-[var(--color-text)]">Priority Support</td>
              <td class="p-6 text-center text-[var(--color-border-hover)]">—</td>
              <td class="p-6 text-center text-[var(--color-border-hover)]">—</td>
              <td class="p-6 text-center"><UIcon name="i-lucide-check" class="size-4 mx-auto text-emerald-500"/></td>
              <td class="p-6 text-center"><UIcon name="i-lucide-check" class="size-4 mx-auto text-emerald-500"/></td>
            </tr>
            <tr class="hover:bg-[var(--color-bg-soft)] transition-colors">
              <td class="p-6 font-medium text-[var(--color-text)]">Study Coach</td>
              <td class="p-6 text-center text-[var(--color-border-hover)]">—</td>
              <td class="p-6 text-center text-[var(--color-border-hover)]">—</td>
              <td class="p-6 text-center"><UIcon name="i-lucide-check" class="size-4 mx-auto text-emerald-500"/></td>
              <td class="p-6 text-center"><UIcon name="i-lucide-check" class="size-4 mx-auto text-emerald-500"/></td>
            </tr>
            <tr class="hover:bg-[var(--color-bg-soft)] transition-colors">
              <td class="p-6 font-medium text-[var(--color-text)]">API Access</td>
              <td class="p-6 text-center text-[var(--color-border-hover)]">—</td>
              <td class="p-6 text-center text-[var(--color-border-hover)]">—</td>
              <td class="p-6 text-center text-[var(--color-border-hover)]">—</td>
              <td class="p-6 text-center"><UIcon name="i-lucide-check" class="size-4 mx-auto text-emerald-500"/></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Bottom CTA -->
    <section class="section-card flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="flex items-center gap-4">
        <div class="icon-box icon-box-primary !size-10 shrink-0">
          <UIcon name="i-lucide-message-circle" class="size-5" />
        </div>
        <div>
          <h3 class="text-lg font-bold tracking-tight text-[var(--color-text)]">Need help choosing?</h3>
          <p class="text-sm text-[var(--color-text-soft)] mt-0.5">Our team can help you find the best plan for your study goals.</p>
        </div>
      </div>
      <button
        type="button"
        class="shrink-0 h-11 px-8 rounded-xl bg-[var(--color-primary)] !text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[var(--color-primary-hover)] transition-colors shadow-md cursor-pointer"
        style="color: white;"
        @click="window.open('mailto:sales@planify.ai', '_self')"
      >
        <UIcon name="i-lucide-mail" class="size-4" />
        <span>Contact Sales</span>
      </button>
    </section>

    <!-- Upgrade / Action confirmation dialog -->
    <UpgradeDialog
      :is-open="confirmDialog.isOpen"
      :plan-id="confirmDialog.planId"
      :plan-name="confirmDialog.planName"
      :action="confirmDialog.action"
      :loading="isProcessing"
      @confirm="executePlanChange"
      @close="confirmDialog.isOpen = false"
    />
  </div>
</template>
