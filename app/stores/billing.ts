import type {
  PaymentHistoryItem,
  PaymentMethod,
  PricingPlan,
  SubscriptionPlan,
  TokenBalance,
  TokenPack,
  TokenUsageCategory
} from '~/types/billing'
import type { ApiResponse } from '~/composables/useApi'

async function withTimeout<T>(promise: Promise<ApiResponse<T>>, timeoutMs = 12000): Promise<ApiResponse<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<ApiResponse<T>>((resolve) => {
    timeoutId = setTimeout(() => {
      resolve({ success: false, message: 'Request timed out' })
    }, timeoutMs)
  })

  const result = await Promise.race([promise, timeoutPromise])
  if (timeoutId) clearTimeout(timeoutId)
  return result
}

function normalizeSubscription(payload: any): SubscriptionPlan | null {
  if (!payload) return null

  const price = Number(payload.price)
  const currency = String(payload.currency || 'USD')
  const planKey = String(payload.plan || '').toLowerCase()
  const planName = payload.name || (planKey ? `${planKey.charAt(0).toUpperCase()}${planKey.slice(1)} Plan` : null)

  return {
    id: String(payload._id || payload.id || planKey || 'subscription'),
    name: String(planName || 'Free Plan'),
    status: String(payload.status || 'unknown'),
    nextBillingDate: payload.nextBillingDate ? new Date(payload.nextBillingDate).toISOString() : '',
    billingCycle: String(payload.billingCycle || 'none'),
    feeLabel: Number.isFinite(price) && price > 0 ? `$${price.toFixed(2)} / ${payload.billingCycle || 'month'}` : '$0.00 / month',
    description: String(payload.description || 'Billing details from your current subscription.'),
    monthlyTokenLimit: Number(payload.tokenLimit || 0) || 0
  }
}

function normalizeTokenBalance(payload: any, subscription: SubscriptionPlan | null): TokenBalance {
  const balance = Number(payload?.tokenBalance ?? payload?.balance ?? 0)
  const limit = Number(payload?.limit ?? subscription?.monthlyTokenLimit ?? 0)
  const used = Number(payload?.used ?? (limit > 0 ? Math.max(0, limit - balance) : 0))
  const usedPercentage = limit > 0 ? Math.round((used / limit) * 100) : 0

  return {
    balance: Number.isFinite(balance) ? balance : 0,
    used: Number.isFinite(used) ? used : 0,
    limit: Number.isFinite(limit) ? limit : 0,
    usedPercentage: Number.isFinite(usedPercentage) ? Math.max(0, Math.min(100, usedPercentage)) : 0
  }
}

function normalizeTokenUsage(items: unknown): TokenUsageCategory[] {
  if (!Array.isArray(items)) return []

  const total = items.reduce((sum: number, item: any) => sum + Math.abs(Number(item?.amount || item?.tokens || 0)), 0)

  return items.slice(0, 8).map((item: any, index: number) => {
    const amount = Math.abs(Number(item?.amount ?? item?.tokens ?? item?.usedTokens ?? 0))
    const percentage = total > 0 ? Math.round((amount / total) * 100) : 0

    return {
      id: String(item?._id || item?.id || `usage-${index + 1}`),
      label: String(item?.reason || item?.label || item?.name || 'Usage'),
      tokens: Number.isFinite(amount) ? amount : 0,
      percentage: Number.isFinite(percentage) ? percentage : 0
    }
  })
}

function normalizePayments(items: unknown): PaymentHistoryItem[] {
  if (!Array.isArray(items)) return []

  return items.map((payment: any, index: number) => {
    const date = payment?.paidAt || payment?.createdAt
    const dateLabel = date ? new Date(date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not available'

    return {
      id: String(payment?._id || payment?.id || `payment-${index + 1}`),
      invoiceId: String(payment?.invoiceNumber || payment?.invoiceId || payment?._id || `INV-${index + 1}`),
      date: dateLabel,
      description: String(payment?.description || payment?.type || 'Payment'),
      amount: typeof payment?.amount === 'number' ? `$${payment.amount.toFixed(2)}` : String(payment?.amount || '$0.00'),
      status: String(payment?.status || 'paid')
    }
  })
}

function normalizePaymentMethods(items: unknown): PaymentMethod[] {
  if (!Array.isArray(items)) return []

  return items.map((method: any, index: number) => ({
    id: String(method?._id || method?.id || `method-${index + 1}`),
    brand: String(method?.brand || 'Card'),
    label: String(method?.label || 'Saved card'),
    expiry: String(method?.expiry || 'N/A'),
    isDefault: Boolean(method?.isDefault)
  }))
}

function normalizePlans(items: unknown): PricingPlan[] {
  if (!Array.isArray(items)) return []

  return items.map((plan: any, index: number) => ({
    id: String(plan?.id || plan?.plan || `plan-${index + 1}`),
    name: String(plan?.name || 'Plan'),
    priceLabel: String(plan?.priceLabel || '$0 / month'),
    badge: plan?.badge ? String(plan.badge) : undefined,
    features: Array.isArray(plan?.features) ? plan.features.map((f: any) => String(f)) : [],
    cta: String(plan?.cta || 'Choose Plan')
  }))
}

export const useBillingStore = defineStore('billing', {
  state: () => ({
    subscription: null as SubscriptionPlan | null,
    tokenBalance: null as TokenBalance | null,
    tokenUsage: [] as TokenUsageCategory[],
    tokenPacks: [] as TokenPack[],
    paymentMethods: [] as PaymentMethod[],
    paymentHistory: [] as PaymentHistoryItem[],
    pricingPlans: [] as PricingPlan[],
    loading: false,
    error: '' as string | null,
    usingMockData: false
  }),
  actions: {
    async fetchBilling() {
      this.loading = true
      this.error = null
      const api = useApi()

      try {
        const [subscriptionRes, balanceRes, historyRes, paymentMethodsRes, tokenHistoryRes, tokenPacksRes, plansRes] = await Promise.all([
          withTimeout(api.get<any>('/subscriptions/me')),
          withTimeout(api.get<any>('/tokens/balance')),
          withTimeout(api.get<any>('/payments')),
          withTimeout(api.get<any>('/payments/methods')),
          withTimeout(api.get<any>('/tokens/history')),
          withTimeout(api.get<any>('/tokens/packs')),
          withTimeout(api.get<any>('/subscriptions/plans'))
        ])

        this.subscription = normalizeSubscription(subscriptionRes.success ? subscriptionRes.data : null)
        this.tokenBalance = normalizeTokenBalance(balanceRes.success ? balanceRes.data : null, this.subscription)
        this.tokenUsage = normalizeTokenUsage(tokenHistoryRes.success ? ((tokenHistoryRes.data as any)?.data || tokenHistoryRes.data) : [])
        this.tokenPacks = Array.isArray((tokenPacksRes.data as any)?.data)
          ? (tokenPacksRes.data as any).data
          : Array.isArray(tokenPacksRes.data)
            ? tokenPacksRes.data as TokenPack[]
            : []
        this.paymentMethods = normalizePaymentMethods(paymentMethodsRes.success ? ((paymentMethodsRes.data as any)?.data || paymentMethodsRes.data) : [])
        this.paymentHistory = normalizePayments(historyRes.success ? ((historyRes.data as any)?.data || historyRes.data) : [])
        this.pricingPlans = normalizePlans(plansRes.success ? ((plansRes.data as any)?.data || plansRes.data) : [])

        const hardFailures = [subscriptionRes, balanceRes].filter((r) => !r.success)
        const softFailures = [historyRes, paymentMethodsRes, tokenHistoryRes, tokenPacksRes, plansRes].filter((r) => !r.success)

        if (hardFailures.length) {
          this.error = hardFailures[0]?.message || 'Unable to load required billing data.'
        } else if (softFailures.length) {
          this.error = 'Some billing sections are unavailable. Showing database data where available.'
        }

        this.usingMockData = false
      } catch (error: any) {
        this.error = error?.message || 'Unable to load billing data.'
      } finally {
        this.loading = false
      }
    },

    async buyTokenPack(packId: string) {
      const pack = this.tokenPacks.find(item => item.id === packId)
      if (!pack) {
        this.error = 'Selected token pack was not found.'
        return false
      }

      const api = useApi()
      const [tokenRes, paymentRes] = await Promise.all([
        api.post('/tokens/buy-demo', { amount: pack.tokens }),
        api.post('/payments/demo', {
          amount: pack.price,
          type: 'token_pack',
          description: `${pack.name} (${pack.tokens.toLocaleString()} tokens)`,
          tokenAmount: pack.tokens
        })
      ])

      if (!tokenRes.success || !paymentRes.success) {
        this.error = tokenRes.message || paymentRes.message || 'Unable to complete token purchase.'
      }

      return tokenRes.success && paymentRes.success
    },

    async upgradePlan(planId = 'pro') {
      const api = useApi()
      const response = await api.post('/subscriptions/demo-upgrade', { plan: planId, billingCycle: 'monthly' })
      if (!response.success) {
        this.error = response.message || 'Unable to upgrade plan.'
      }
      return response.success
    },

    async cancelPlan() {
      const api = useApi()
      const response = await api.post('/subscriptions/cancel-demo')
      if (!response.success) {
        this.error = response.message || 'Unable to cancel plan.'
      }
      return response.success
    },

    async addPaymentMethod(payload: { brand: string, label: string, expiry: string }) {
      const api = useApi()
      const response = await api.post('/payments/methods', payload)
      if (!response.success) {
        this.error = response.message || 'Unable to add payment method.'
      }
      return response.success
    },

    async removePaymentMethod(id: string) {
      const api = useApi()
      const response = await api.del(`/payments/methods/${id}`)
      if (!response.success) {
        this.error = response.message || 'Unable to remove payment method.'
      }
      return response.success
    }
  }
})
