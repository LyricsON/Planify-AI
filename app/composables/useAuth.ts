import { useProfileStore } from '~/stores/profile'

export function useAuth() {
  const router = useRouter()
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

  async function logout() {
    const { post } = useApi()
    
    try {
      await post('/auth/logout')
    } catch (err) {
      console.error('Backend logout request failed:', err)
    } finally {
      // Clear localStorage tokens
      clearToken()

      // Reset Pinia profile store
      try {
        const profileStore = useProfileStore()
        profileStore.$reset()
      } catch (err) {
        console.error('Failed to reset profile store:', err)
      }

      // Redirect to login page
      router.push('/auth/signin')
    }
  }

  return {
    isAuthenticated,
    saveAuthToken,
    getAuthRedirect,
    logout
  }
}
