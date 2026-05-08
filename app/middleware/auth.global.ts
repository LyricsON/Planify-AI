export default defineNuxtRouteMiddleware((to) => {
  if (!import.meta.client) {
    return
  }

  const token = getToken()
  const isAuthRoute = to.path.startsWith('/auth')
  const isProtectedRoute = to.path.startsWith('/dashboard') || to.path.startsWith('/settings')

  if (isProtectedRoute && !token) {
    return navigateTo(`/auth/signin?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  if (isAuthRoute && token) {
    return navigateTo('/dashboard')
  }
})
