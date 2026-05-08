export interface SubscriptionPlan {
  id: string
  name: string
  status: string
  nextBillingDate: string
  billingCycle: string
  feeLabel: string
  description: string
  monthlyTokenLimit: number
}

export interface TokenBalance {
  balance: number
  used: number
  limit: number
  usedPercentage: number
}

export interface TokenUsageCategory {
  id: string
  label: string
  tokens: number
  percentage: number
}

export interface TokenPack {
  id: string
  name: string
  tokens: number
  price: number
  popular?: boolean
}

export interface PaymentMethod {
  id: string
  brand: string
  label: string
  expiry: string
  isDefault: boolean
}

export interface PaymentHistoryItem {
  id: string
  invoiceId: string
  date: string
  description: string
  amount: string
  status: string
}

export interface PricingPlan {
  id: string
  name: string
  priceLabel: string
  badge?: string
  current?: boolean
  features: string[]
  cta: string
}
