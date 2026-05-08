// app/composables/useApi.ts
// Reusable authenticated API composable for Planify AI

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  count?: number
  total?: number
  page?: number
  pages?: number
  message?: string
  token?: string
}

const AUTH_TOKEN_KEY = 'planify_token'

export function getToken(): string | null {
  if (import.meta.client) {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  }
  return null
}

export function setToken(token: string) {
  if (import.meta.client) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  }
}

export function clearToken() {
  if (import.meta.client) {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  }
}

export function useApi() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBase as string

  async function get<T = unknown>(path: string, params?: Record<string, string | number>): Promise<ApiResponse<T>> {
    const token = getToken()
    const url = new URL(`${baseUrl}${path}`)

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          url.searchParams.set(k, String(v))
        }
      })
    }

    const res = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })

    return res.json() as Promise<ApiResponse<T>>
  }

  async function post<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    const token = getToken()

    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    })

    return res.json() as Promise<ApiResponse<T>>
  }

  return { get, post }
}
