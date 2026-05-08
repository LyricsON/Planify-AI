export function useAuth() {
  const isAuthenticated = () => Boolean(getToken())

  function saveAuthToken(token?: string | null) {
    if (token) {
      setToken(token)
      return
    }

    clearToken()
  }

  function getAuthRedirect() {
    if (!import.meta.client) {
      return '/dashboard'
    }

    const route = useRoute()
    const redirect = route.query.redirect
    return typeof redirect === 'string' && redirect.startsWith('/')
      ? redirect
      : '/dashboard'
  }

  return {
    isAuthenticated,
    saveAuthToken,
    getAuthRedirect
  }
}
