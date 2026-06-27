const PROTECTED_ROUTE_PREFIXES = ['/dashboard', '/settings']
const AUTH_REDIRECT_ROUTES = ['/auth/signin', '/auth/signup']

function isUnderPrefix(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`)
}

export default defineNuxtRouteMiddleware(async (to) => {
  const path = to.path
  const token = getToken()
  const { saveAuthToken } = useAuth()
  const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some(prefix => isUnderPrefix(path, prefix))
  const isAuthRedirectRoute = AUTH_REDIRECT_ROUTES.includes(path)

  if (token) {
    if (isAuthRedirectRoute) {
      return navigateTo('/dashboard')
    }

    return
  }

  if (isProtectedRoute) {
    if (import.meta.client) {
      const { ensureFirebaseSession } = useFirebaseAuth()

      try {
        const response = await ensureFirebaseSession()
        if (response?.token) {
          saveAuthToken(response.token)
          return
        }
      } catch {
        // Fall through to the redirect below.
      }
    }

    return navigateTo(`/auth/signin?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  if (isAuthRedirectRoute && import.meta.client) {
    const { ensureFirebaseSession } = useFirebaseAuth()

    try {
      const response = await ensureFirebaseSession()
      if (response?.token) {
        saveAuthToken(response.token)
        return navigateTo('/dashboard')
      }
    } catch {
      // Allow the public auth page to render if no session can be restored.
    }
  }
})
