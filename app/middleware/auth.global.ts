export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.client) {
    return
  }

  let token = getToken()
  const { saveAuthToken } = useAuth()
  const isAuthRoute = to.path.startsWith('/auth')
  const isProtectedRoute = to.path.startsWith('/dashboard') || to.path.startsWith('/settings')

  if (!token) {
    const { ensureFirebaseSession } = useFirebaseAuth()

    try {
      const response = await ensureFirebaseSession()
      if (response?.token) {
        token = response.token
        saveAuthToken(response.token)
      }
    } catch {
      // Ignore hydration failures and fall through to the normal redirect logic.
    }
  }

  if (isProtectedRoute && !token) {
    return navigateTo(`/auth/signin?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  if (isAuthRoute && token) {
    return navigateTo('/dashboard')
  }
})
