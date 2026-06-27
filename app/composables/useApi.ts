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
const AUTH_TOKEN_COOKIE_KEY = 'planify_token'

function getAuthTokenCookie() {
  return useCookie<string | null>(AUTH_TOKEN_COOKIE_KEY, {
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production'
  })
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  const payloadPart = parts[1]

  if (!payloadPart) {
    return null
  }

  try {
    const base64Url = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64Url.padEnd(Math.ceil(base64Url.length / 4) * 4, '=')
    const raw = import.meta.server
      ? Buffer.from(padded, 'base64').toString('utf8')
      : atob(padded)

    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

function isExpiredToken(token: string): boolean {
  const payload = decodeJwtPayload(token)
  const exp = payload && typeof payload.exp === 'number' ? payload.exp : null

  if (!exp) {
    return false
  }

  return exp * 1000 <= Date.now()
}

export function getToken(): string | null {
  const tokenCookie = getAuthTokenCookie()
  const clearStaleToken = () => {
    tokenCookie.value = null

    if (import.meta.client) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem('accessToken')
    }
  }

  if (tokenCookie.value) {
    if (isExpiredToken(tokenCookie.value)) {
      clearStaleToken()
      return null
    }

    if (import.meta.client) {
      const storageToken = localStorage.getItem('accessToken') || localStorage.getItem(AUTH_TOKEN_KEY)
      if (storageToken !== tokenCookie.value) {
        localStorage.setItem(AUTH_TOKEN_KEY, tokenCookie.value)
        localStorage.setItem('accessToken', tokenCookie.value)
      }
    }

    return tokenCookie.value
  }

  if (!import.meta.client) {
    return null
  }

  const storageToken = localStorage.getItem('accessToken') || localStorage.getItem(AUTH_TOKEN_KEY)
  if (storageToken) {
    if (isExpiredToken(storageToken)) {
      clearStaleToken()
      return null
    }

    tokenCookie.value = storageToken
  }

  return storageToken
}

export function setToken(token: string) {
  const tokenCookie = getAuthTokenCookie()

  tokenCookie.value = token

  if (import.meta.client) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
    localStorage.setItem('accessToken', token)
  }
}

export function clearToken() {
  const tokenCookie = getAuthTokenCookie()

  tokenCookie.value = null

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
      
      let deviceId = null
      if (import.meta.client) {
        deviceId = localStorage.getItem('planify_device_id')
        if (!deviceId) {
          deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
          localStorage.setItem('planify_device_id', deviceId)
        }
      }

      const headers = {
        ...(options?.headers as Record<string, string> | undefined),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(deviceId ? { 'x-device-id': deviceId } : {})
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
