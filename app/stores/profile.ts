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

const quickActions: QuickAction[] = [
  { id: 'edit-profile', label: 'Edit Profile', icon: 'i-lucide-user-round-pen', to: '/settings/personal-info' },
  { id: 'manage-plan', label: 'Manage Plan', icon: 'i-lucide-credit-card', to: '/settings/billing' },
  { id: 'billing-history', label: 'Billing History', icon: 'i-lucide-receipt', to: '/settings/billing' },
  { id: 'download-data', label: 'Download My Data', icon: 'i-lucide-download', to: '/settings/security' },
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
        const [
          authRes,
          userRes,
          profileRes,
          preferencesRes,
          subscriptionRes,
          tokenBalanceRes,
          tokenHistoryRes,
          tasksRes,
          coursesRes,
          filesRes,
          sessionsRes,
          securityRes,
          aiHistoryRes
        ] = await Promise.all([
          api.get<any>('/auth/me'),
          api.get<any>('/users/me'),
          api.get<any>('/profile/me'),
          api.get<any>('/preferences/me'),
          api.get<any>('/subscriptions/me'),
          api.get<any>('/tokens/balance'),
          api.get<any>('/tokens/history'),
          api.get<any>('/tasks'),
          api.get<any>('/courses'),
          api.get<any>('/files'),
          api.get<any>('/study-sessions'),
          api.get<any>('/security/logs'),
          api.get<any>('/ai/history')
        ])

        const rawUserData = (userRes.success ? userRes.data : authRes.success ? authRes.data : null) as any
        const userData = rawUserData?.user || rawUserData?.data || rawUserData
        if (!userData) {
          if (authRes.statusCode === 401 || userRes.statusCode === 401) {
            this.error = 'Your session has expired. Please sign in again.'
          } else {
            this.error = userRes.message || authRes.message || 'Unable to load user profile.'
          }
          return
        }

        const profileData = ((profileRes.success ? profileRes.data : {}) || {}) as any
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
            id: String(goal.id || `goal-${index + 1}`),
            title: String(goal.title || goal.name || 'Untitled goal'),
            progress: Math.max(0, Math.min(100, Number(goal.progress || goal.completion || 0))),
            tone: (['success', 'danger', 'primary', 'warning', 'info'].includes(goal.tone) ? goal.tone : 'primary') as StudyGoal['tone']
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

        const activities: ActivityItem[] = [
          ...completedTasks.slice(0, 5).map((task) => ({
            id: `task-${task.id}`,
            title: `Completed task "${task.title || 'Untitled task'}"`,
            timeAgo: formatRelative(task.completedAt || task.updatedAt || task.createdAt),
            icon: 'i-lucide-circle-check-big',
            tone: 'success' as const,
            date: task.completedAt || task.updatedAt || task.createdAt || ''
          })),
          ...files.slice(0, 5).map((file) => ({
            id: `file-${file.id}`,
            title: `Uploaded file "${file.name || file.filename || 'Untitled file'}"`,
            timeAgo: formatRelative(file.updatedAt || file.createdAt),
            icon: 'i-lucide-file-up',
            tone: 'info' as const,
            date: file.updatedAt || file.createdAt || ''
          })),
          ...sessions.slice(0, 5).map((session) => ({
            id: `session-${session.id}`,
            title: `Study session "${session.title || 'Untitled session'}"`,
            timeAgo: formatRelative(session.completedAt || session.startedAt || session.updatedAt || session.createdAt),
            icon: 'i-lucide-book-marked',
            tone: 'primary' as const,
            date: session.completedAt || session.startedAt || session.updatedAt || session.createdAt || ''
          })),
          ...aiHistory.slice(0, 3).map((event: any, index: number) => ({
            id: `ai-${event.id || index}`,
            title: 'Used AI assistant',
            timeAgo: formatRelative(event.createdAt || event.updatedAt),
            icon: 'i-lucide-sparkles',
            tone: 'warning' as const,
            date: event.createdAt || event.updatedAt || ''
          })),
          ...securityLogs.slice(0, 2).map((log: any, index: number) => ({
            id: `security-${log.id || index}`,
            title: log.action ? `Security: ${String(log.action)}` : 'Security event',
            timeAgo: formatRelative(log.createdAt || log.timestamp),
            icon: 'i-lucide-shield',
            tone: 'warning' as const,
            date: log.createdAt || log.timestamp || ''
          }))
        ]
          .sort((a, b) => (asDate(b.date)?.getTime() || 0) - (asDate(a.date)?.getTime() || 0))
          .slice(0, 8)

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
        const tokenBalance = Number(tokenData.balance || tokenData.tokens || tokenData.available || 0)
        const tokenUsed = Number(tokenData.used || (tokenLimit ? Math.max(0, tokenLimit - tokenBalance) : 0))

        this.user = {
          id: String(userData.id || userData._id || 'user'),
          name: String(userData.name || userData.fullName || 'User'),
          email: String(userData.email || 'Not added yet'),
          avatar: userData.avatar || userData.profileImage,
          phone: userData.phone,
          location: userData.location,
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
            studentId: profileData.studentId || profileData.academic?.studentId,
            gpa: profileData.gpa || profileData.academic?.gpa
          },
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
          resetDate: tokenData.resetDate || tokenData.nextResetDate || tokenHistoryRes.data?.resetDate
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

        if (!profileRes.success && profileRes.statusCode === 401) {
          this.error = 'Your session has expired. Please sign in again.'
        } else if (!profileRes.success || !preferencesRes.success || !subscriptionRes.success) {
          this.error = 'Some profile sections could not be loaded. Available data is shown.'
        }
      } catch (error: any) {
        this.error = error?.message || 'Unable to load profile data.'
      } finally {
        this.loading = false
      }
    },
    async updateProfile(payload: ProfilePayload) {
      const api = useApi()
      const requests = await Promise.all([
        api.put('/users/me', payload),
        api.put('/profile/me', {
          bio: payload.bio,
          university: payload.university,
          fieldOfStudy: payload.fieldOfStudy,
          academicYear: payload.academicYear,
          studentId: payload.studentId
        })
      ])

      const failedRequest = requests.find((request) => !request.success)
      if (failedRequest) {
        this.error = failedRequest.message || 'Unable to save profile changes.'
      }

      if (this.user) {
        this.user = {
          ...this.user,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          location: payload.location
        }
      }

      if (this.profile) {
        this.profile = {
          ...this.profile,
          bio: payload.bio,
          academic: {
            ...this.profile.academic,
            university: payload.university,
            fieldOfStudy: payload.fieldOfStudy,
            academicYear: payload.academicYear,
            studentId: payload.studentId
          }
        }
      }

      return !failedRequest
    },
    async updateAvatar(file: File) {
      const previewUrl = URL.createObjectURL(file)
      if (this.user) this.user.avatar = previewUrl
      return true
    }
  }
})
