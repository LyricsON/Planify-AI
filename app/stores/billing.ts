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
    feeLabel: Number.isFinite(price) && price > 0 ? `${price.toFixed(2)} TND / ${payload.billingCycle || 'month'}` : '0.00 TND / month',
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

  const usageItems = items.filter((item: any) => {
    const val = Number(item?.amount ?? item?.tokens ?? 0)
    return val < 0
  })

  const grouped = usageItems.reduce((acc: Record<string, number>, item: any) => {
    const label = String(item?.reason || item?.label || item?.name || 'Usage')
    const amount = Math.abs(Number(item?.amount ?? item?.tokens ?? 0))
    acc[label] = (acc[label] || 0) + amount
    return acc
  }, {})

  const totalUsage = Object.values(grouped).reduce((sum: number, val) => sum + (val as number), 0)

  return Object.entries(grouped)
    .map(([label, amount], index) => {
      const percentage = totalUsage > 0 ? Math.round(((amount as number) / totalUsage) * 100) : 0
      return {
        id: `usage-group-${index + 1}`,
        label,
        tokens: amount as number,
        percentage
      }
    })
    .sort((a, b) => b.tokens - a.tokens)
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
      amount: typeof payment?.amount === 'number' ? `${payment.amount.toFixed(2)} TND` : String(payment?.amount || '0.00 TND'),
      status: String(payment?.status || 'paid')
    }
  })
}

function normalizePaymentMethods(items: unknown): PaymentMethod[] {
  if (!Array.isArray(items)) return []

  return items.map((method: any, index: number) => ({
    id: String(method?._id || method?.id || `method-${index + 1}`),
    _id: method?._id ? String(method._id) : undefined,
    brand: String(method?.brand || 'Card'),
    last4: method?.last4 ? String(method.last4) : undefined,
    expMonth: method?.expMonth ? Number(method.expMonth) : undefined,
    expYear: method?.expYear ? Number(method.expYear) : undefined,
    label: String(method?.label || 'Saved card'),
    expiry: String(method?.expiry || 'N/A'),
    isDefault: Boolean(method?.isDefault),
    stripePaymentMethodId: method?.stripePaymentMethodId ? String(method.stripePaymentMethodId) : undefined
  }))
}

function extractListData<T = unknown>(payload: any): T[] {
  if (Array.isArray(payload?.data)) {
    return payload.data as T[]
  }

  if (Array.isArray(payload)) {
    return payload as T[]
  }

  return []
}

function normalizePlans(items: unknown): PricingPlan[] {
  if (!Array.isArray(items)) return []

  return items.map((plan: any, index: number) => ({
    id: String(plan?.id || plan?.plan || `plan-${index + 1}`),
    name: String(plan?.name || 'Plan'),
    priceLabel: String(plan?.priceLabel || '0 TND / month'),
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
    usingMockData: false,
    lastFetched: null as number | null,
    fetchPromise: null as Promise<void> | null
  }),
  actions: {
    async loadBillingData(force = false) {
      if (this.loading && this.fetchPromise) {
        return this.fetchPromise
      }
      if (this.fetchPromise) {
        return this.fetchPromise
      }

      const CACHE_TTL = 30000 // 30 seconds cache guard
      if (!force && this.lastFetched && (Date.now() - this.lastFetched < CACHE_TTL)) {
        return Promise.resolve()
      }

      this.loading = true
      this.error = null
      const api = useApi()

      this.fetchPromise = (async () => {
        try {
          const results = await Promise.allSettled([
            withTimeout(api.get<any>('/subscriptions/me')),
            withTimeout(api.get<any>('/tokens/balance')),
            withTimeout(api.get<any>('/payments')),
            withTimeout(api.get<any>('/payments/methods')),
            withTimeout(api.get<any>('/tokens/history')),
            withTimeout(api.get<any>('/tokens/packs')),
            withTimeout(api.get<any>('/subscriptions/plans'))
          ])

          const subscriptionRes = results[0].status === 'fulfilled' ? results[0].value : { success: false, message: 'Failed to load subscription' }
          const balanceRes = results[1].status === 'fulfilled' ? results[1].value : { success: false, message: 'Failed to load balance' }
          const historyRes = results[2].status === 'fulfilled' ? results[2].value : { success: false, message: 'Failed to load history' }
          const paymentMethodsRes = results[3].status === 'fulfilled' ? results[3].value : { success: false, message: 'Failed to load payment methods' }
          const tokenHistoryRes = results[4].status === 'fulfilled' ? results[4].value : { success: false, message: 'Failed to load token history' }
          const tokenPacksRes = results[5].status === 'fulfilled' ? results[5].value : { success: false, message: 'Failed to load token packs' }
          const plansRes = results[6].status === 'fulfilled' ? results[6].value : { success: false, message: 'Failed to load plans' }

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
          this.lastFetched = Date.now()
        } catch (error: any) {
          this.error = error?.message || 'Unable to load billing data.'
        } finally {
          this.loading = false
          this.fetchPromise = null
        }
      })()

      return this.fetchPromise
    },

    async refreshBillingData(force = false) {
      return this.loadBillingData(force)
    },

    async fetchBilling() {
      return this.loadBillingData(false)
    },

    async refreshPaymentMethods(): Promise<PaymentMethod[] | null> {
      const api = useApi()
      try {
        const response = await api.get<any>('/payments/methods')
        if (!response.success) {
          return null
        }

        const rawData = extractListData(response.data)
        const methods = normalizePaymentMethods(rawData)
        this.paymentMethods = methods
        return methods
      } catch (err) {
        console.error('[Billing Store] Failed to refresh payment methods:', err)
        return null
      }
    },

    async verifyStripeSetupSession(sessionId: string): Promise<{ stripePaymentMethodId: string } | null> {
      const api = useApi()
      try {
        const response = await api.post<any>('/payments/verify-setup-session', { sessionId })
        if (!response.success) {
          return null
        }

        const stripePaymentMethodId = String(response.data?.stripePaymentMethodId || '')
        if (!stripePaymentMethodId) {
          return null
        }

        return {
          stripePaymentMethodId
        }
      } catch (err) {
        console.error('[Billing Store] Failed to verify Stripe setup session:', err)
        return null
      }
    },

    async ensureStripePaymentMethod(sessionId: string, maxAttempts = 5, delayMs = 1500): Promise<PaymentMethod[] | null> {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const verifiedSession = await this.verifyStripeSetupSession(sessionId)
        if (verifiedSession?.stripePaymentMethodId) {
          const methods = await this.refreshPaymentMethods()
          if (methods?.some(method => method.stripePaymentMethodId === verifiedSession.stripePaymentMethodId)) {
            return methods
          }
        }

        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
      }

      return null
    },

    async buyTokenPack(packId: string) {
      const pack = this.tokenPacks.find(item => item.id === packId)
      if (!pack) {
        this.error = 'Selected token pack was not found.'
        return false
      }

      const api = useApi()
      const paymentRes = await api.post('/payments/demo', {
        packId: pack.id
      })

      if (!paymentRes.success) {
        this.error = paymentRes.message || 'Unable to complete token purchase.'
      }

      return paymentRes.success
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

    async getStripeSetupSession() {
      const api = useApi()
      const response = await api.post<any>('/payments/setup-session')
      if (!response.success) {
        this.error = response.message || 'Unable to start card addition.'
        return null
      }
      return response.data?.url || (response as any).url || null
    },

    async setPlanDefaultPaymentMethod(id: string) {
      const api = useApi()
      const response = await api.post<any>('/payments/set-default-method', { id })
      if (!response.success) {
        this.error = response.message || 'Unable to set default payment method.'
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
