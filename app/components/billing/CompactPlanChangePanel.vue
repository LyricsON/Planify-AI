<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import UpgradeDialog from '~/components/billing/UpgradeDialog.vue'

const billingStore = useBillingStore()
const { subscription, pricingPlans, error } = storeToRefs(billingStore)

const selectedCycle = ref<'monthly' | 'yearly'>('monthly')
const isProcessing = ref(false)
const feedback = ref<{ tone: 'success' | 'warning', text: string } | null>(null)

const confirmDialog = ref({
  isOpen: false,
  planId: '',
  planName: '',
  action: '' as 'upgrade' | 'downgrade' | 'contact' | ''
})

const expandedBenefits = ref<Record<string, boolean>>({})

onMounted(() => {
  if (subscription.value?.billingCycle === 'yearly' || subscription.value?.billingCycle === 'annual') {
    selectedCycle.value = 'yearly'
  }
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

const planList = computed(() => {
  const isYearly = selectedCycle.value === 'yearly'
  
  return [
    {
      id: 'free',
      name: 'Free Plan',
      priceLabel: '0 TND',
      billingPeriod: isYearly ? '/year' : '/month',
      tokensLabel: '500 tokens/month',
      description: 'Basic planner features with limited daily assistant credits.',
      value: 0,
      benefits: [
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
      name: 'Student Plan',
      priceLabel: isYearly ? '7.99 TND' : '9.99 TND',
      billingPeriod: isYearly ? '/month' : '/month',
      subText: isYearly ? 'Billed annually (95.88 TND/year)' : 'Billed monthly',
      tokensLabel: '50,000 tokens/month',
      description: 'Advanced features tailored for students and daily learners.',
      value: 1,
      benefits: [
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
      name: 'Pro Plan',
      priceLabel: isYearly ? '15.99 TND' : '19.99 TND',
      billingPeriod: isYearly ? '/month' : '/month',
      subText: isYearly ? 'Billed annually (191.88 TND/year)' : 'Billed monthly',
      tokensLabel: '150,000 tokens/month',
      description: 'Our most popular tier. Complete AI coach suite for power study.',
      isPopular: true,
      value: 2,
      benefits: [
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
      name: 'Enterprise',
      priceLabel: 'Contact Sales',
      billingPeriod: '',
      description: 'Collaborative workspaces for study groups and institutions.',
      value: 3,
      benefits: [
        'Unlimited users',
        'Admin Dashboard',
        'Shared Workspace',
        'Dedicated Support',
        'API Access',
        'Custom Integrations'
      ]
    }
  ]
})

const currentPlan = computed(() => {
  return planList.value.find(p => p.id === currentPlanId.value) || planList.value[0]
})

const currentVal = computed(() => {
  return currentPlan.value.value
})

const upgradePlans = computed(() => {
  return planList.value.filter(p => p.value > currentVal.value && p.id !== 'enterprise')
})

const downgradePlans = computed(() => {
  return planList.value.filter(p => p.value < currentVal.value && p.id !== 'enterprise')
})

const showEnterprise = computed(() => {
  return currentVal.value < 3
})

function toggleBenefits(planId: string) {
  expandedBenefits.value[planId] = !expandedBenefits.value[planId]
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
  const currentValNum = currentPlan.value.value
  const targetPlanObj = planList.value.find(p => p.id === planId)
  const targetValNum = targetPlanObj ? targetPlanObj.value : 0
  if (currentValNum === targetValNum) return

  confirmDialog.value = {
    isOpen: true,
    planId,
    planName: planId === 'free' ? 'Free' : planId === 'student' ? 'Student' : 'Pro',
    action: targetValNum > currentValNum ? 'upgrade' : 'downgrade'
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
      await useDashboardSummary().refresh(true)
      const planNameFormatted = planId.charAt(0).toUpperCase() + planId.slice(1)
      feedback.value = { tone: 'success', text: `Successfully ${action === 'upgrade' ? 'upgraded' : 'downgraded'} to the ${planNameFormatted} plan!` }
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
  <div class="space-y-4">
    <!-- Feedback & Error Alerts -->
    <div
      v-if="feedback"
      class="rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300"
      :class="feedback.tone === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'"
    >
      {{ feedback.text }}
    </div>

    <!-- Segmented Billing Cycle Switch -->
    <div class="flex flex-col items-center">
      <div class="inline-flex rounded-xl bg-[var(--color-bg-soft)] p-1 border border-[var(--color-border)]">
        <button
          type="button"
          class="h-8 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-transparent border-0"
          :class="selectedCycle === 'monthly' ? 'bg-white !text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-soft)] hover:text-[var(--color-text)]'"
          @click="selectedCycle = 'monthly'"
        >
          Monthly
        </button>
        <button
          type="button"
          class="h-8 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-transparent border-0"
          :class="selectedCycle === 'yearly' ? 'bg-white !text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-soft)] hover:text-[var(--color-text)]'"
          @click="selectedCycle = 'yearly'"
        >
          Annual
        </button>
      </div>
      <div v-if="selectedCycle === 'yearly'" class="mt-1.5 text-[11px] font-semibold text-[var(--color-primary)]">
        Save up to 20% with annual billing!
      </div>
    </div>

    <!-- Current Plan Block -->
    <div class="space-y-1.5">
      <h4 class="text-[11px] font-bold uppercase tracking-wider text-muted">Current Plan</h4>
      <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-base font-bold text-[var(--color-text)]">{{ currentPlan.name }}</span>
            <span class="status-badge status-success text-[11px] font-medium">Active</span>
          </div>
          <p class="text-xs text-[var(--color-text-soft)] mt-1 font-medium">
            {{ currentPlan.priceLabel }}{{ currentPlan.billingPeriod }}
            <span v-if="selectedCycle === 'yearly' && currentPlanId !== 'free'" class="text-xs text-muted font-normal ml-1">
              ({{ currentPlan.subText }})
            </span>
          </p>
          <p v-if="currentPlan.tokensLabel" class="text-[11px] text-muted mt-0.5 leading-none">
            {{ currentPlan.tokensLabel }}
          </p>
        </div>
        <div>
          <button 
            type="button" 
            class="text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] inline-flex items-center gap-1 cursor-pointer bg-transparent border-0"
            @click="toggleBenefits(currentPlan.id)"
          >
            <span>See benefits</span>
            <UIcon 
              :name="expandedBenefits[currentPlan.id] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" 
              class="size-4" 
            />
          </button>
        </div>
      </div>
      <!-- Benefits Dropdown -->
      <div 
        v-if="expandedBenefits[currentPlan.id]" 
        class="p-3 rounded-2xl bg-[var(--color-bg-soft)]/50 border border-[var(--color-border)] text-xs text-[var(--color-text-soft)]"
      >
        <ul class="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          <li v-for="benefit in currentPlan.benefits" :key="benefit" class="flex items-center gap-2">
            <UIcon name="i-lucide-check" class="size-4 text-emerald-500" />
            <span>{{ benefit }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Upgrade Options -->
    <div v-if="upgradePlans.length > 0 || showEnterprise" class="space-y-2 pt-2">
      <h4 class="text-[11px] font-bold uppercase tracking-wider text-muted">Upgrade Options</h4>
      <div class="space-y-2">
        <!-- Upgrade card -->
        <div 
          v-for="plan in upgradePlans" 
          :key="plan.id" 
          class="rounded-2xl border bg-[var(--color-surface)] p-4 shadow-sm hover:border-[var(--color-primary)]/50 transition-all flex flex-col gap-3"
          :class="plan.isPopular ? 'border-[var(--color-primary)] bg-gradient-to-r from-[var(--color-primary-soft)]/10 to-transparent' : 'border-[var(--color-border)]'"
        >
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-base font-bold text-[var(--color-text)]">{{ plan.name }}</span>
                <span v-if="plan.isPopular" class="status-badge status-primary bg-[var(--color-primary-soft)] text-[var(--color-primary)] text-[9px] font-bold px-1.5 py-0.5 rounded-md">Recommended</span>
              </div>
              <p class="text-xs text-[var(--color-text-soft)] mt-1 font-medium">
                <strong class="text-base text-[var(--color-text)] font-semibold">{{ plan.priceLabel }}</strong>{{ plan.billingPeriod }}
                <span v-if="selectedCycle === 'yearly'" class="text-xs text-muted font-normal ml-1">
                  ({{ plan.subText }})
                </span>
              </p>
              <p class="text-[11px] text-[var(--color-text-soft)] mt-1">{{ plan.description }}</p>
            </div>
            
            <div class="flex items-center gap-3 shrink-0 self-end md:self-center">
              <button 
                type="button" 
                class="text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] inline-flex items-center gap-1 cursor-pointer bg-transparent border-0"
                @click="toggleBenefits(plan.id)"
              >
                <span>See benefits</span>
                <UIcon 
                  :name="expandedBenefits[plan.id] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" 
                  class="size-4" 
                />
              </button>
              
              <button 
                type="button" 
                class="h-9 px-4 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] font-semibold text-xs transition cursor-pointer border-0"
                @click="handlePlanAction(plan.id)"
              >
                Upgrade
              </button>
            </div>
          </div>
          
          <!-- Benefits list expander -->
          <div 
            v-if="expandedBenefits[plan.id]" 
            class="p-3 rounded-xl bg-[var(--color-bg-soft)]/50 border border-[var(--color-border)] text-xs text-[var(--color-text-soft)]"
          >
            <ul class="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              <li v-for="benefit in plan.benefits" :key="benefit" class="flex items-center gap-2">
                <UIcon name="i-lucide-check" class="size-4 text-emerald-500" />
                <span>{{ benefit }}</span>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- Enterprise Card -->
        <div 
          v-if="showEnterprise" 
          class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <span class="text-base font-bold text-[var(--color-text)]">Enterprise</span>
            <p class="text-xs text-[var(--color-text-soft)] mt-0.5">Contact Sales for custom pricing</p>
            <p class="text-[11px] text-[var(--color-text-soft)] mt-1">Collaborative workspaces for study groups and institutions.</p>
          </div>
          <div class="flex items-center gap-3 shrink-0 self-end md:self-center">
            <button 
              type="button" 
              class="text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] inline-flex items-center gap-1 cursor-pointer bg-transparent border-0"
              @click="toggleBenefits('enterprise')"
            >
              <span>See benefits</span>
              <UIcon 
                :name="expandedBenefits['enterprise'] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" 
                class="size-4" 
              />
            </button>
            <button 
              type="button" 
              class="h-9 px-4 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] font-semibold text-xs transition cursor-pointer border-0"
              @click="handlePlanAction('enterprise')"
            >
              Contact Sales
            </button>
          </div>
        </div>
        
        <!-- Enterprise benefits expander -->
        <div 
          v-if="showEnterprise && expandedBenefits['enterprise']" 
          class="p-3 rounded-xl bg-[var(--color-bg-soft)]/50 border border-[var(--color-border)] text-xs text-[var(--color-text-soft)]"
        >
          <ul class="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            <li v-for="benefit in planList.find(p => p.id === 'enterprise')?.benefits" :key="benefit" class="flex items-center gap-2">
              <UIcon name="i-lucide-check" class="size-4 text-emerald-500" />
              <span>{{ benefit }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Downgrade Options -->
    <div v-if="downgradePlans.length > 0" class="space-y-2 pt-2">
      <h4 class="text-[11px] font-bold uppercase tracking-wider text-muted">Downgrade Options</h4>
      <div class="space-y-2">
        <!-- Downgrade card -->
        <div 
          v-for="plan in downgradePlans" 
          :key="plan.id" 
          class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm hover:border-[var(--color-border-strong)] transition-all flex flex-col gap-3"
        >
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span class="text-base font-bold text-[var(--color-text)]">{{ plan.name }}</span>
              <p class="text-xs text-[var(--color-text-soft)] mt-1 font-medium">
                <strong class="text-base text-[var(--color-text)] font-semibold">{{ plan.priceLabel }}</strong>{{ plan.billingPeriod }}
                <span v-if="selectedCycle === 'yearly'" class="text-xs text-muted font-normal ml-1">
                  ({{ plan.subText }})
                </span>
              </p>
              <p class="text-[11px] text-[var(--color-text-soft)] mt-1">{{ plan.description }}</p>
            </div>
            
            <div class="flex items-center gap-3 shrink-0 self-end md:self-center">
              <button 
                type="button" 
                class="text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] inline-flex items-center gap-1 cursor-pointer bg-transparent border-0"
                @click="toggleBenefits(plan.id)"
              >
                <span>See benefits</span>
                <UIcon 
                  :name="expandedBenefits[plan.id] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" 
                  class="size-4" 
                />
              </button>
              
              <button 
                type="button" 
                class="h-9 px-4 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-soft)] font-semibold text-xs transition cursor-pointer bg-transparent"
                @click="handlePlanAction(plan.id)"
              >
                Downgrade
              </button>
            </div>
          </div>
          
          <!-- Benefits list expander -->
          <div 
            v-if="expandedBenefits[plan.id]" 
            class="p-3 rounded-xl bg-[var(--color-bg-soft)]/50 border border-[var(--color-border)] text-xs text-[var(--color-text-soft)]"
          >
            <ul class="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              <li v-for="benefit in plan.benefits" :key="benefit" class="flex items-center gap-2">
                <UIcon name="i-lucide-check" class="size-4 text-emerald-500" />
                <span>{{ benefit }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Upgrade / Downgrade confirmation dialog -->
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
