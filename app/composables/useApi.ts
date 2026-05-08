export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  statusCode?: number
  count?: number
  total?: number
  page?: number
  pages?: number
  token?: string
}

const AUTH_TOKEN_KEY = 'planify_token'

export function getToken(): string | null {
  if (!import.meta.client) {
    return null
  }

  return localStorage.getItem('accessToken') || localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setToken(token: string) {
  if (import.meta.client) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
    localStorage.setItem('accessToken', token)
  }
}

export function clearToken() {
  if (import.meta.client) {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem('accessToken')
  }
}

function normalizeResponse<T>(payload: unknown): ApiResponse<T> {
  if (payload && typeof payload === 'object' && 'success' in payload) {
    return payload as ApiResponse<T>
  }

  return {
    success: true,
    data: payload as T
  }
}

export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase as string

  async function request<T>(path: string, options: Record<string, any> = {}): Promise<ApiResponse<T>> {
    try {
      const token = getToken()
      const headers = {
        ...(options?.headers as Record<string, string> | undefined),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }

      const payload = await $fetch<T | ApiResponse<T>>(path, {
        baseURL,
        ...options,
        headers
      })

      return normalizeResponse<T>(payload)
    } catch (error: any) {
      return {
        success: false,
        statusCode: error?.statusCode || error?.response?.status,
        message: error?.data?.message || error?.message || 'Request failed'
      }
    }
  }

  function get<T>(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
    return request<T>(path, {
      method: 'GET',
      query
    })
  }

  function post<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: 'POST',
      body: body as BodyInit | Record<string, any> | undefined
    })
  }

  function put<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: 'PUT',
      body: body as BodyInit | Record<string, any> | undefined
    })
  }

  function del<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: 'DELETE',
      body: body as BodyInit | Record<string, any> | undefined
    })
  }

  return {
    get,
    post,
    put,
    del,
    request
  }
}
