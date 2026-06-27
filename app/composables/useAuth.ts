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
    const { signOutFirebase } = useFirebaseAuth()

    try {
      await post('/auth/logout')
    } catch (err) {
      console.error('Backend logout request failed:', err)
    } finally {
      try {
        await signOutFirebase()
      } catch (err) {
        console.error('Firebase sign-out failed:', err)
      }

      // Clear localStorage tokens
      clearToken()

      try {
        const dashboardSummary = useDashboardSummary()
        dashboardSummary.clear()
      } catch (err) {
        console.error('Failed to clear dashboard summary:', err)
      }

      // Reset Pinia profile store
      try {
        const profileStore = useProfileStore()
        profileStore.$reset()
      } catch (err) {
        console.error('Failed to reset profile store:', err)
      }

      // Redirect to login page
      await router.replace('/auth/signin')
    }
  }

  return {
    isAuthenticated,
    saveAuthToken,
    getAuthRedirect,
    logout
  }
}
