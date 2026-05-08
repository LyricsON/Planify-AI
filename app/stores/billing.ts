import type {
  PaymentHistoryItem,
  PaymentMethod,
  PricingPlan,
  SubscriptionPlan,
  TokenBalance,
  TokenPack,
  TokenUsageCategory
} from '~/types/billing'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

const mockSubscription: SubscriptionPlan = {
  id: 'student-plan',
  name: 'Student Plan',
  status: 'Active',
  nextBillingDate: '12 May 2024',
  billingCycle: 'Monthly',
  feeLabel: '$9.99 / month',
  description: 'Access to all core features and AI assistant.',
  monthlyTokenLimit: 4000
}

const mockTokenBalance: TokenBalance = {
  balance: 8750,
  used: 3000,
  limit: 4000,
  usedPercentage: 75
}

const mockTokenUsage: TokenUsageCategory[] = [
  { id: 'assistant', label: 'AI Assistant (Answers)', tokens: 1250, percentage: 41 },
  { id: 'docs', label: 'Document Analysis', tokens: 850, percentage: 28 },
  { id: 'practice', label: 'Practice Exams', tokens: 650, percentage: 22 },
  { id: 'flashcards', label: 'Flashcards & Summaries', tokens: 250, percentage: 9 }
]

const mockTokenPacks: TokenPack[] = [
  { id: 'starter', name: 'Starter Pack', tokens: 2000, price: 4.99 },
  { id: 'standard', name: 'Standard Pack', tokens: 5000, price: 9.99, popular: true },
  { id: 'pro', name: 'Pro Pack', tokens: 12000, price: 19.99 },
  { id: 'ultimate', name: 'Ultimate Pack', tokens: 25000, price: 34.99 }
]

const mockPaymentMethods: PaymentMethod[] = [
  { id: 'pm_visa', brand: 'Visa', label: 'Visa ending in 4242', expiry: '04/27', isDefault: true },
  { id: 'pm_mastercard', brand: 'Mastercard', label: 'Mastercard ending in 8888', expiry: '09/26', isDefault: false }
]

const mockPaymentHistory: PaymentHistoryItem[] = [
  { id: 'payment-1', invoiceId: 'INV-2024-0056', date: '12 Apr 2024', description: 'Student Plan - Monthly', amount: '$9.99', status: 'Paid' },
  { id: 'payment-2', invoiceId: 'INV-2024-0043', date: '12 Mar 2024', description: 'Student Plan - Monthly', amount: '$9.99', status: 'Paid' },
  { id: 'payment-3', invoiceId: 'INV-2024-0031', date: '12 Feb 2024', description: 'Student Plan - Monthly', amount: '$9.99', status: 'Paid' }
]

const mockPricingPlans: PricingPlan[] = [
  {
    id: 'pro',
    name: 'Pro Plan',
    priceLabel: '$19.99 / month',
    badge: 'Most Popular',
    features: ['12,000 tokens per month', 'All Student Plan features', 'Priority support', 'Advanced analytics'],
    cta: 'Upgrade to Pro'
  },
  {
    id: 'free',
    name: 'Free Plan',
    priceLabel: '$0 / month',
    features: ['500 tokens per month', 'AI Assistant (Limited)', 'Basic features'],
    cta: 'Downgrade to Free'
  }
]

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
    applyMockData(message?: string) {
      this.subscription = clone(mockSubscription)
      this.tokenBalance = clone(mockTokenBalance)
      this.tokenUsage = clone(mockTokenUsage)
      this.tokenPacks = clone(mockTokenPacks)
      this.paymentMethods = clone(mockPaymentMethods)
      this.paymentHistory = clone(mockPaymentHistory)
      this.pricingPlans = clone(mockPricingPlans)
      this.error = message || null
      this.usingMockData = true
    },
    async fetchBilling() {
      this.loading = true
      this.error = null
      const api = useApi()

      try {
        const [subscriptionRes, balanceRes, historyRes, paymentMethodsRes, tokenHistoryRes] = await Promise.all([
          api.get<Partial<SubscriptionPlan>>('/subscriptions/me'),
          api.get<Partial<TokenBalance>>('/tokens/balance'),
          api.get<PaymentHistoryItem[]>('/payments/history'),
          api.get<PaymentMethod[]>('/payments/methods'),
          api.get<TokenUsageCategory[]>('/tokens/history')
        ])

        if (!subscriptionRes.success && !balanceRes.success) {
          throw new Error(subscriptionRes.message || balanceRes.message || 'Billing request failed')
        }

        this.subscription = subscriptionRes.success ? { ...clone(mockSubscription), ...subscriptionRes.data } : clone(mockSubscription)
        this.tokenBalance = balanceRes.success
          ? {
              ...clone(mockTokenBalance),
              ...balanceRes.data,
              usedPercentage: balanceRes.data?.usedPercentage || Math.round(((balanceRes.data?.used || mockTokenBalance.used) / (balanceRes.data?.limit || mockTokenBalance.limit)) * 100)
            }
          : clone(mockTokenBalance)
        this.tokenUsage = tokenHistoryRes.success && tokenHistoryRes.data?.length ? tokenHistoryRes.data : clone(mockTokenUsage)
        this.tokenPacks = clone(mockTokenPacks)
        this.paymentMethods = paymentMethodsRes.success && paymentMethodsRes.data?.length ? paymentMethodsRes.data : clone(mockPaymentMethods)
        this.paymentHistory = historyRes.success && historyRes.data?.length ? historyRes.data : clone(mockPaymentHistory)
        this.pricingPlans = clone(mockPricingPlans)
        this.usingMockData = false
      } catch (error: any) {
        this.applyMockData(error?.message || 'Backend unavailable. Showing demo billing data.')
      } finally {
        this.loading = false
      }
    },
    async buyTokenPack(packId: string) {
      const pack = this.tokenPacks.find(item => item.id === packId)

      if (!pack || !this.tokenBalance) {
        return false
      }

      this.tokenBalance.balance += pack.tokens

      const api = useApi()
      const response = await api.post('/tokens/buy-demo', {
        packId
      })

      if (!response.success) {
        this.error = response.message || 'Unable to complete token purchase.'
      }

      return response.success || true
    },
    async addPaymentMethod(payload: { brand: string, label: string, expiry: string }) {
      const newMethod: PaymentMethod = {
        id: `pm_${Date.now()}`,
        brand: payload.brand,
        label: payload.label,
        expiry: payload.expiry,
        isDefault: false
      }

      this.paymentMethods = [...this.paymentMethods, newMethod]

      const api = useApi()
      const response = await api.post('/payments/methods', payload)

      if (!response.success) {
        this.error = response.message || 'Unable to add payment method.'
      }

      return response.success || true
    },
    async removePaymentMethod(id: string) {
      this.paymentMethods = this.paymentMethods.filter(method => method.id !== id)

      const api = useApi()
      const response = await api.del(`/payments/methods/${id}`)

      if (!response.success) {
        this.error = response.message || 'Unable to remove payment method.'
      }

      return response.success || true
    }
  }
})
