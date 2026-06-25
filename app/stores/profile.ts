import type {
  AIPreference,
  Achievement,
  ActivityItem,
  Course,
  FileItem,
  ProfileChecklistItem,
  ProfileDetails,
  ProfilePayload,
  ProfileStat,
  ProfileSubscription,
  ProfileUser,
  QuickAction,
  StudyGoal,
  StudySession,
  Task,
  TokenUsage
} from '~/types/profile'

import type { ApiResponse } from '~/composables/useApi'

function toArray<T>(response: ApiResponse<T[] | { data?: T[] }> | null): T[] {
  if (!response?.success) return []
  const payload = response.data
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object' && Array.isArray((payload as any).data)) {
    return (payload as any).data as T[]
  }
  return []
}

function asDate(value?: string | null): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatRelative(value?: string): string {
  const date = asDate(value)
  if (!date) return 'Recently'
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`
  const diffDay = Math.round(diffHr / 24)
  if (diffDay === 1) return 'Yesterday'
  return `${diffDay} days ago`
}

function formatMonthHours(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (!h) return `${m}m`
  return `${h}h ${m}m`
}

function normalizeStatus(value?: string): string {
  if (!value) return 'Free'
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

/**
 * Normalize an avatar URL/path to an absolute URL the browser can load.
 * - Full https:// or http:// URLs are returned as-is (Google photoURL, external CDN).
 * - Relative paths like /uploads/file.jpg are prefixed with the backend origin.
 * - Empty/null values return undefined.
 */
function normalizeAvatarUrl(raw?: string | null): string | undefined {
  if (!raw || !raw.trim()) return undefined
  if (raw.startsWith('http')) return raw

  let apiBase = 'http://localhost:5000/api'
  try {
    const config = useRuntimeConfig()
    if (config?.public?.apiBase) {
      apiBase = config.public.apiBase
    } else if (import.meta.client) {
      apiBase = (window as any).__NUXT__?.config?.public?.apiBase || apiBase
    }
  } catch {
    if (import.meta.client) {
      apiBase = (window as any).__NUXT__?.config?.public?.apiBase || apiBase
    }
  }

  try {
    const origin = new URL(apiBase).origin
    return `${origin}${raw.startsWith('/') ? raw : `/${raw}`}`
  } catch {
    return raw
  }
}

const quickActions: QuickAction[] = [
  { id: 'edit-profile', label: 'Edit Profile', icon: 'i-lucide-user-round-pen', action: 'edit-profile' },
  { id: 'manage-plan', label: 'Manage Plan', icon: 'i-lucide-credit-card', to: '/settings/billing' },
  { id: 'billing-history', label: 'Billing History', icon: 'i-lucide-receipt', to: '/settings/billing' },
  { id: 'download-data', label: 'Download My Data', icon: 'i-lucide-download', action: 'download-data' },
  { id: 'account-settings', label: 'Account Settings', icon: 'i-lucide-settings-2', to: '/settings/security' }
]

export const useProfileStore = defineStore('profile', {
  state: () => ({
    user: null as ProfileUser | null,
    profile: null as ProfileDetails | null,
    stats: [] as ProfileStat[],
    goals: [] as StudyGoal[],
    achievements: [] as Achievement[],
    recentActivity: [] as ActivityItem[],
    subscription: null as ProfileSubscription | null,
    tokenUsage: null as TokenUsage | null,
    aiPreferences: [] as AIPreference[],
    quickActions: quickActions as QuickAction[],
    loading: false,
    error: '' as string | null
  }),
  actions: {
    async fetchProfile() {
      this.loading = true
      this.error = null

      const api = useApi()
      try {
        // 1. Fetch required endpoints
        const [userRes, profileRes] = await Promise.all([
          api.get<any>('/users/me'),
          api.get<any>('/profile/me')
        ])

        // Verify required data
        const rawUserData = userRes.success ? userRes.data : null
        const userData = rawUserData?.user || rawUserData?.data || rawUserData
        const profileData = profileRes.success ? profileRes.data : null

        if (!userData || !profileData) {
          if (userRes.statusCode === 401 || profileRes.statusCode === 401) {
            this.error = 'Your session has expired. Please sign in again.'
          } else {
            this.error = 'Unable to load profile. Please refresh this page or sign in again.'
          }
          console.error('[Profile Fetch Error] Required data failed:', { userRes, profileRes })
          return
        }

        // 2. Fetch optional endpoints concurrently using Promise.allSettled
        const optionalPromises = [
          api.get<any>('/auth/me'),
          api.get<any>('/preferences/me'),
          api.get<any>('/subscriptions/me'),
          api.get<any>('/tokens/balance'),
          api.get<any>('/tokens/history'),
          api.get<any>('/tasks'),
          api.get<any>('/courses'),
          api.get<any>('/files'),
          api.get<any>('/study-sessions'),
          api.get<any>('/security-logs'),
          api.get<any>('/ai/history')
        ]

        const optionalResults = await Promise.allSettled(optionalPromises)

        // Helper to extract response safely, logging failures to console in development
        const getOptionalResponse = (index: number, endpoint: string) => {
          const result = optionalResults[index]
          if (result.status === 'fulfilled') {
            if (result.value.success) {
              return result.value
            } else {
              console.warn(`[Profile Fetch Warning] Optional endpoint "${endpoint}" returned success=false:`, result.value)
            }
          } else {
            console.error(`[Profile Fetch Error] Optional endpoint "${endpoint}" rejected:`, result.reason)
          }
          return { success: false, data: null }
        }

        const authRes = getOptionalResponse(0, '/auth/me')
        const preferencesRes = getOptionalResponse(1, '/preferences/me')
        const subscriptionRes = getOptionalResponse(2, '/subscriptions/me')
        const tokenBalanceRes = getOptionalResponse(3, '/tokens/balance')
        const tokenHistoryRes = getOptionalResponse(4, '/tokens/history')
        const tasksRes = getOptionalResponse(5, '/tasks')
        const coursesRes = getOptionalResponse(6, '/courses')
        const filesRes = getOptionalResponse(7, '/files')
        const sessionsRes = getOptionalResponse(8, '/study-sessions')
        const securityRes = getOptionalResponse(9, '/security-logs')
        const aiHistoryRes = getOptionalResponse(10, '/ai/history')

        const preferencesData = ((preferencesRes.success ? preferencesRes.data : {}) || {}) as any
        const subscriptionData = ((subscriptionRes.success ? subscriptionRes.data : {}) || {}) as any
        const tokenData = ((tokenBalanceRes.success ? tokenBalanceRes.data : {}) || {}) as any

        const tasks = toArray<Task>(tasksRes)
        const courses = toArray<Course>(coursesRes)
        const files = toArray<FileItem>(filesRes)
        const sessions = toArray<StudySession>(sessionsRes)
        const securityLogs = toArray<any>(securityRes)
        const aiHistory = toArray<any>(aiHistoryRes)

        const now = new Date()
        const month = now.getMonth()
        const year = now.getFullYear()

        const completedTasks = tasks.filter((task) => (task.status || '').toLowerCase() === 'completed')
        const monthlyCompletedTasks = completedTasks.filter((task) => {
          const d = asDate(task.completedAt || task.updatedAt || task.createdAt)
          return d ? d.getMonth() === month && d.getFullYear() === year : false
        })

        const monthlyStudyMinutes = sessions.reduce((total, session) => {
          const d = asDate(session.completedAt || session.startedAt || session.updatedAt || session.createdAt)
          if (!d || d.getMonth() !== month || d.getFullYear() !== year) return total
          const duration = session.durationMinutes || session.duration || 0
          return total + Math.max(0, Number(duration) || 0)
        }, 0)

        const activeCourses = courses.filter((course) => !course.status || !['archived', 'inactive'].includes((course.status || '').toLowerCase()))
        const focusScore = Math.min(100, Math.round((monthlyCompletedTasks.length * 2) + (monthlyStudyMinutes / 60) * 3))

        const profileGoals = Array.isArray(profileData?.goals) ? profileData.goals : []
        const computedGoals: StudyGoal[] = profileGoals
          .map((goal: any, index: number) => ({
            id: String(goal.id || goal._id || `goal-${index + 1}`),
            title: String(goal.title || goal.name || 'Untitled goal'),
            description: goal.description,
            targetValue: Number(goal.targetValue ?? 0),
            currentValue: Number(goal.currentValue ?? 0),
            unit: goal.unit,
            deadline: goal.deadline,
            status: (goal.status || 'active') as StudyGoal['status'],
            progress: Math.max(0, Math.min(100, Number(goal.progress ?? 0))),
            tone: (['success', 'danger', 'primary', 'warning', 'info'].includes(goal.tone) ? goal.tone : 'primary') as StudyGoal['tone'],
            createdAt: goal.createdAt,
            updatedAt: goal.updatedAt
          }))

        const achievementList: Achievement[] = []
        const earlySessions = sessions.filter((s) => {
          const d = asDate(s.startedAt || s.completedAt || s.createdAt)
          return d ? d.getHours() < 8 : false
        }).length

        if (earlySessions >= 3) {
          achievementList.push({ id: 'early-riser', title: 'Early Riser', description: `${earlySessions} early sessions`, icon: 'i-lucide-sunrise', tone: 'warning' })
        }
        if (completedTasks.length >= 20) {
          achievementList.push({ id: 'task-crusher', title: 'Task Crusher', description: `${completedTasks.length} tasks completed`, icon: 'i-lucide-check-check', tone: 'success' })
        }
        if (focusScore >= 70) {
          achievementList.push({ id: 'focus-master', title: 'Focus Master', description: `${focusScore}% focus score`, icon: 'i-lucide-target', tone: 'info' })
        }
        if (sessions.length >= 7 || completedTasks.length >= 7) {
          achievementList.push({ id: 'consistent', title: 'Consistent', description: 'Active this week', icon: 'i-lucide-shield-check', tone: 'primary' })
        }

        const tokenTransactions = toArray<any>(tokenHistoryRes)

        const allActivities: ActivityItem[] = []

        // 1. Tasks
        tasks.forEach((task) => {
          if (task.createdAt) {
            allActivities.push({
              id: `task-created-${task.id}`,
              type: 'task_created',
              label: `Created task "${task.title || 'Untitled task'}"`,
              icon: 'i-lucide-circle-plus',
              color: 'info',
              createdAt: task.createdAt
            })
          }
          if ((task.status || '').toLowerCase() === 'completed') {
            const completedDate = task.completedAt || task.updatedAt || task.createdAt
            if (completedDate) {
              allActivities.push({
                id: `task-completed-${task.id}`,
                type: 'task_completed',
                label: `Completed task "${task.title || 'Untitled task'}"`,
                icon: 'i-lucide-circle-check-big',
                color: 'success',
                createdAt: completedDate
              })
            }
          }
        })

        // 2. Files
        files.forEach((file) => {
          const fileDate = file.createdAt
          if (fileDate) {
            allActivities.push({
              id: `file-uploaded-${file.id}`,
              type: 'file_uploaded',
              label: `Uploaded file "${file.originalName || file.name || file.filename || 'Untitled file'}"`,
              icon: 'i-lucide-file-up',
              color: 'info',
              createdAt: fileDate
            })
          }
        })

        // 3. Courses
        courses.forEach((course) => {
          if (course.createdAt) {
            allActivities.push({
              id: `course-created-${course.id}`,
              type: 'course_created',
              label: `Created course "${course.title || 'Untitled course'}"`,
              icon: 'i-lucide-book-open',
              color: 'primary',
              createdAt: course.createdAt
            })
          }
        })

        // 4. Study Sessions
        sessions.forEach((session) => {
          if ((session.status || '').toLowerCase() === 'completed') {
            const sessionDate = session.completedAt || session.endTime || session.updatedAt || session.createdAt
            if (sessionDate) {
              allActivities.push({
                id: `session-completed-${session.id}`,
                type: 'session_completed',
                label: `Completed study session "${session.title || 'Untitled session'}"`,
                icon: 'i-lucide-book-marked',
                color: 'success',
                createdAt: sessionDate
              })
            }
          }
        })

        // 5. AI Requests
        aiHistory.forEach((aiReq) => {
          if (aiReq.createdAt) {
            allActivities.push({
              id: `ai-request-${aiReq.id || aiReq._id}`,
              type: 'ai_request',
              label: `Used AI assistant for ${aiReq.type ? aiReq.type.replace('_', ' ') : 'chat'}`,
              icon: 'i-lucide-sparkles',
              color: 'warning',
              createdAt: aiReq.createdAt
            })
          }
        })

        // 6. Token Transactions
        tokenTransactions.forEach((tx) => {
          if (tx.createdAt) {
            const amount = Number(tx.amount || 0)
            const label = amount < 0
              ? `Used ${Math.abs(amount)} tokens for ${tx.reason || 'AI action'}`
              : `Received ${amount} tokens for ${tx.reason || 'bonus/purchase'}`
            allActivities.push({
              id: `token-tx-${tx.id || tx._id}`,
              type: 'token_tx',
              label,
              icon: 'i-lucide-database',
              color: amount < 0 ? 'warning' : 'success',
              createdAt: tx.createdAt
            })
          }
        })

        // 7. Security Logs
        securityLogs.forEach((log) => {
          const logDate = log.createdAt || log.timestamp
          if (logDate) {
            let label = ''
            if (log.action === 'login') label = 'Signed in successfully'
            else if (log.action === 'register') label = 'Registered new account'
            else if (log.action === 'password_change') label = 'Changed password'
            else if (log.action === 'profile_update') label = 'Updated profile'
            else if (log.action === 'logout') label = 'Signed out'
            else label = log.action ? `Security: ${String(log.action).replace('_', ' ')}` : 'Security event'

            allActivities.push({
              id: `security-log-${log.id || log._id}`,
              type: 'security_log',
              label,
              icon: 'i-lucide-shield',
              color: log.status === 'failed' ? 'warning' : 'info',
              createdAt: logDate
            })
          }
        })

        const activities = allActivities
          .sort((a, b) => (asDate(b.createdAt)?.getTime() || 0) - (asDate(a.createdAt)?.getTime() || 0))
          .map((activity) => ({
            ...activity,
            timeAgo: formatRelative(activity.createdAt)
          }))

        const checklist: ProfileChecklistItem[] = [
          { id: 'picture', label: 'Add profile picture', completed: Boolean(userData.avatar || profileData.avatar) },
          { id: 'bio', label: 'Add your bio', completed: Boolean(profileData.bio) },
          {
            id: 'academic',
            label: 'Add academic info',
            completed: Boolean(profileData.university || profileData.program || profileData.academic?.university || profileData.academic?.program)
          },
          { id: 'goals', label: 'Set study goals', completed: computedGoals.length > 0 },
          { id: 'calendar', label: 'Connect calendar', completed: Boolean(preferencesData?.calendarConnected || preferencesData?.integrations?.calendarConnected) }
        ]
        const completion = Math.round((checklist.filter((item) => item.completed).length / checklist.length) * 100)

        const tokenLimit = Number(tokenData.limit || tokenData.monthlyLimit || subscriptionData.tokenAllowance || 0) || undefined
        const tokenBalance = Number(tokenData.balance || tokenData.tokens || tokenData.available || tokenData.tokenBalance || 0)
        const tokenUsed = Number(tokenData.used || (tokenLimit ? Math.max(0, tokenLimit - tokenBalance) : 0))

        this.user = {
          id: String(userData.id || userData._id || 'user'),
          name: String(userData.name || userData.fullName || 'User'),
          email: String(userData.email || 'Not added yet'),
          avatar: normalizeAvatarUrl(userData.avatar || userData.profileImage),
          phone: userData.phone || profileData.phone,
          location: userData.location || profileData.location,
          role: userData.role || subscriptionData.role || 'Student'
        }

        this.profile = {
          headline: profileData.headline || profileData.program || profileData.academic?.program || 'Student',
          bio: profileData.bio || '',
          completion,
          tags: Array.isArray(profileData.tags) ? profileData.tags : Array.isArray(profileData.skills) ? profileData.skills : [],
          academic: {
            university: profileData.university || profileData.academic?.university,
            fieldOfStudy: profileData.program || profileData.fieldOfStudy || profileData.academic?.fieldOfStudy || profileData.academic?.program,
            academicYear: profileData.academicYear || profileData.academic?.academicYear || profileData.year,
            semester: profileData.semester || profileData.academic?.semester,
            studentId: profileData.studentId || profileData.academic?.studentId,
            gpa: profileData.gpa || profileData.academic?.gpa
          },
          socialLinks: profileData.socialLinks || undefined,
          checklist
        }

        this.stats = [
          {
            id: 'study-hours',
            label: 'Study Hours',
            value: formatMonthHours(monthlyStudyMinutes),
            caption: 'This month',
            icon: 'i-lucide-clock-3',
            tone: 'primary'
          },
          {
            id: 'tasks-completed',
            label: 'Tasks Completed',
            value: String(monthlyCompletedTasks.length || completedTasks.length),
            caption: monthlyCompletedTasks.length ? 'This month' : 'Completed',
            icon: 'i-lucide-square-check-big',
            tone: 'success'
          },
          {
            id: 'courses',
            label: 'Courses',
            value: String(activeCourses.length),
            caption: 'Enrolled',
            icon: 'i-lucide-book-open',
            tone: 'info'
          },
          {
            id: 'focus-score',
            label: 'Focus Score',
            value: `${focusScore}%`,
            caption: focusScore >= 70 ? 'Good focus' : 'Keep improving',
            icon: 'i-lucide-chart-no-axes-column-increasing',
            tone: 'ai'
          }
        ]

        this.goals = computedGoals
        this.achievements = achievementList
        this.recentActivity = activities
        this.subscription = {
          name: subscriptionData.planName || subscriptionData.name || subscriptionData.plan || 'Free Plan',
          status: normalizeStatus(subscriptionData.status || 'active'),
          nextBillingDate: subscriptionData.nextBillingDate || subscriptionData.endsAt || subscriptionData.renewalDate,
          billingCycle: subscriptionData.billingCycle,
          priceLabel: subscriptionData.priceLabel
        }

        this.tokenUsage = {
          balance: tokenBalance,
          limit: tokenLimit,
          used: tokenUsed,
          usedPercentage: tokenLimit ? Math.min(100, Math.round((tokenUsed / tokenLimit) * 100)) : undefined,
          resetDate: tokenData.resetDate || tokenData.nextResetDate || (tokenHistoryRes.data as any)?.resetDate
        }

        this.aiPreferences = [
          {
            id: 'assistant-style',
            label: 'Study Assistant Style',
            value: preferencesData?.ai?.assistantTone || preferencesData?.assistantTone || 'Not set',
            icon: 'i-lucide-sparkles'
          },
          {
            id: 'response-detail',
            label: 'Response Detail',
            value: preferencesData?.ai?.responseDetail || preferencesData?.responseDetail || 'Not set',
            icon: 'i-lucide-bot-message-square'
          },
          {
            id: 'motivation-boosts',
            label: 'Motivation Boosts',
            value: typeof (preferencesData?.ai?.motivationBoosts ?? preferencesData?.motivationBoosts) === 'boolean'
              ? ((preferencesData?.ai?.motivationBoosts ?? preferencesData?.motivationBoosts) ? 'Enabled' : 'Disabled')
              : 'Not set',
            icon: 'i-lucide-flame'
          }
        ]

        // We do not set this.error for optional failures, keeping the experience clean.
      } catch (error: any) {
        this.error = 'Unable to load profile. Please refresh this page or sign in again.'
        console.error('[Profile Fetch Exception]:', error)
      } finally {
        this.loading = false
      }
    },

    async updateProfile(payload: ProfilePayload) {
      const api = useApi()
      const requests = await Promise.all([
        // PUT /api/users/me — safe fields only (name, phone, location, avatar)
        api.put('/users/me', {
          name: payload.name,
          phone: payload.phone,
          location: payload.location,
          avatar: payload.avatar
        }),
        // PUT /api/profile/me — profile-specific fields
        api.put('/profile/me', {
          bio: payload.bio,
          university: payload.university,
          fieldOfStudy: payload.fieldOfStudy,
          academicYear: payload.academicYear,
          semester: payload.semester,
          studentId: payload.studentId,
          socialLinks: payload.socialLinks
        })
      ])

      const failedRequest = requests.find((request) => !request.success)
      if (failedRequest) {
        this.error = failedRequest.message || 'Unable to save profile changes.'
      }

      if (!failedRequest && this.user) {
        this.user = {
          ...this.user,
          name: payload.name,
          phone: payload.phone,
          location: payload.location,
          avatar: payload.avatar ? normalizeAvatarUrl(payload.avatar) : this.user.avatar
        }
      }

      if (!failedRequest && this.profile) {
        this.profile = {
          ...this.profile,
          bio: payload.bio,
          academic: {
            ...this.profile.academic,
            university: payload.university,
            fieldOfStudy: payload.fieldOfStudy,
            academicYear: payload.academicYear,
            semester: payload.semester,
            studentId: payload.studentId
          },
          socialLinks: payload.socialLinks
        }
      }

      return !failedRequest
    },

    /**
     * Upload a new avatar image to the backend.
     * Uses the dedicated POST /api/users/me/avatar endpoint (multer diskStorage → /uploads).
     * The returned relative /uploads/filename path is normalized to an absolute URL
     * via normalizeAvatarUrl so that <img> can resolve it in the browser.
     * request() automatically attaches the Authorization Bearer token.
     */
    async updateAvatar(file: File, updateGlobalState = true) {
      const api = useApi()
      const formData = new FormData()
      formData.append('avatar', file)

      // Do NOT pass headers: {} — that would erase the Authorization token added by request().
      const res = await api.request<{ avatar: string; user: any }>('/users/me/avatar', {
        method: 'POST',
        body: formData
      })

      if (res.success) {
        const rawAvatar = (res.data as any)?.avatar || (res.data as any)?.user?.avatar
        const normalized = normalizeAvatarUrl(rawAvatar)
        if (normalized) {
          if (updateGlobalState && this.user) {
            this.user = { ...this.user, avatar: normalized }
          }
          return { success: true, avatar: normalized, rawAvatar }
        }
      }

      this.error = res.message || 'Unable to upload avatar.'
      return { success: false, error: this.error }
    },

    /**
     * Export current authenticated user data as a JSON file.
     * Uses data already fetched from the authenticated session (no new endpoint).
     * Triggers a browser file download.
     */
    downloadData() {
      if (!import.meta.client) return

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        user: this.user,
        profile: this.profile,
        subscription: this.subscription,
        tokenUsage: this.tokenUsage,
        stats: this.stats,
        recentActivity: this.recentActivity,
        aiPreferences: this.aiPreferences
      }

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `planify-data-${Date.now()}.json`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
    },

    async addStudyGoal(payload: {
      title: string
      description?: string
      targetValue: number
      currentValue: number
      unit?: string
      deadline?: string
      status?: string
    }) {
      const api = useApi()
      const res = await api.post<any>('/profile/goals', payload)
      if (res.success) {
        await this.fetchProfile()
        return { success: true }
      }
      this.error = res.message || 'Unable to add study goal.'
      return { success: false, error: this.error }
    },

    async updateStudyGoal(goalId: string, payload: {
      title: string
      description?: string
      targetValue: number
      currentValue: number
      unit?: string
      deadline?: string
      status?: string
    }) {
      const api = useApi()
      const res = await api.put<any>(`/profile/goals/${goalId}`, payload)
      if (res.success) {
        await this.fetchProfile()
        return { success: true }
      }
      this.error = res.message || 'Unable to update study goal.'
      return { success: false, error: this.error }
    },

    async deleteStudyGoal(goalId: string) {
      const api = useApi()
      const res = await api.del<any>(`/profile/goals/${goalId}`)
      if (res.success) {
        await this.fetchProfile()
        return { success: true }
      }
      this.error = res.message || 'Unable to delete study goal.'
      return { success: false, error: this.error }
    },

    updateRelativeTimes() {
      if (!this.recentActivity) return
      this.recentActivity = this.recentActivity.map((activity) => ({
        ...activity,
        timeAgo: formatRelative(activity.createdAt)
      }))
    }
  }
})
