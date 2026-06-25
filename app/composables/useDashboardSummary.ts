import type { DashboardSummary } from '~/types/dashboard'

let pendingRequest: Promise<DashboardSummary | null> | null = null

function normalizeAvatarUrl(raw?: string | null) {
  if (!raw || !raw.trim()) return null
  if (/^https?:\/\//i.test(raw)) return raw

  try {
    const config = useRuntimeConfig()
    const baseURL = String(config.public.apiBase || '')
    const origin = new URL(baseURL).origin
    return `${origin}${raw.startsWith('/') ? raw : `/${raw}`}`
  } catch {
    return raw
  }
}

export function useDashboardSummary() {
  const summary = useState<DashboardSummary | null>('dashboard-summary', () => null)
  const loading = useState<boolean>('dashboard-summary-loading', () => false)
  const error = useState<string | null>('dashboard-summary-error', () => null)
  const fetchedAt = useState<string | null>('dashboard-summary-fetched-at', () => null)

  const hasData = computed(() => Boolean(summary.value))

  function applyAvatarNormalization(data: DashboardSummary | null) {
    if (!data) return data
    return {
      ...data,
      user: {
        ...data.user,
        avatar: normalizeAvatarUrl(data.user.avatar)
      }
    }
  }

  async function refresh(force = false) {
    if (loading.value && pendingRequest && !force) {
      return pendingRequest
    }

    const hasLoaded = Boolean(summary.value)
    if (hasLoaded && !force) {
      return summary.value
    }

    const { get } = useApi()
    loading.value = true
    error.value = null

    pendingRequest = (async () => {
      try {
        const response = await get<DashboardSummary>('/dashboard/summary')
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Unable to load dashboard data')
        }

        summary.value = applyAvatarNormalization(response.data)
        fetchedAt.value = new Date().toISOString()
        return summary.value
      } catch (err: any) {
        error.value = err?.message || 'Unable to load dashboard data'
        summary.value = null
        return null
      } finally {
        loading.value = false
        pendingRequest = null
      }
    })()

    return pendingRequest
  }

  async function ensureLoaded() {
    if (!summary.value && !loading.value) {
      return refresh()
    }

    return summary.value
  }

  function clear() {
    summary.value = null
    loading.value = false
    error.value = null
    fetchedAt.value = null
    pendingRequest = null
  }

  return {
    summary,
    loading,
    error,
    fetchedAt,
    hasData,
    refresh,
    ensureLoaded,
    clear
  }
}
