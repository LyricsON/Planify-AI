import type {
  AIPreference,
  ActivityItem,
  ProfileDetails,
  ProfilePayload,
  ProfileStat,
  ProfileSubscription,
  ProfileUser,
  QuickAction,
  StudyGoal,
  TokenUsage,
  Achievement
} from '~/types/profile'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

const mockUser: ProfileUser = {
  id: 'user_1',
  name: 'Yassine El Amrani',
  email: 'yassine.elamrani@university.edu',
  avatar: 'https://i.pravatar.cc/240?img=12',
  phone: '+212 612 345 678',
  location: 'Casablanca, Morocco',
  role: 'Student'
}

const mockProfile: ProfileDetails = {
  headline: 'Computer Science Student',
  bio: 'Passionate computer science student who loves solving problems, building projects, and exploring AI. Always looking to learn something new and improve every day.',
  completion: 85,
  tags: ['Problem Solver', 'AI Enthusiast', 'Team Player', 'Lifelong Learner'],
  academic: {
    university: 'Mohammed V University',
    fieldOfStudy: 'Computer Science',
    academicYear: '2nd Year',
    studentId: 'MU2021CS1234',
    gpa: '3.6 / 4.0'
  },
  checklist: [
    { id: 'picture', label: 'Add profile picture', completed: true },
    { id: 'bio', label: 'Add your bio', completed: true },
    { id: 'academic', label: 'Add academic info', completed: true },
    { id: 'goals', label: 'Set study goals', completed: true },
    { id: 'calendar', label: 'Connect calendar', completed: false }
  ]
}

const mockStats: ProfileStat[] = [
  { id: 'study-hours', label: 'Study Hours', value: '128h 34m', caption: 'This month', trend: '+18%', icon: 'i-lucide-clock-3', tone: 'primary' },
  { id: 'tasks', label: 'Tasks Completed', value: '42', caption: 'This month', trend: '+32%', icon: 'i-lucide-square-check-big', tone: 'success' },
  { id: 'courses', label: 'Courses', value: '5', caption: 'Enrolled', icon: 'i-lucide-book-open', tone: 'info' },
  { id: 'focus', label: 'Focus Score', value: '78%', caption: 'Good focus', icon: 'i-lucide-chart-no-axes-column-increasing', tone: 'ai' }
]

const mockGoals: StudyGoal[] = [
  { id: 'goal-1', title: 'Master Data Structures', progress: 75, tone: 'success' },
  { id: 'goal-2', title: 'Improve Algorithms Skills', progress: 60, tone: 'danger' },
  { id: 'goal-3', title: 'Build 3 Real-world Projects', progress: 40, tone: 'primary' }
]

const mockAchievements: Achievement[] = [
  { id: 'ach-1', title: 'Early Riser', description: '10 early starts', icon: 'i-lucide-sunrise', tone: 'warning' },
  { id: 'ach-2', title: 'Consistent', description: '7-day streak', icon: 'i-lucide-shield-check', tone: 'primary' },
  { id: 'ach-3', title: 'Focus Master', description: '25h focused', icon: 'i-lucide-target', tone: 'info' },
  { id: 'ach-4', title: 'Task Crusher', description: '50 tasks done', icon: 'i-lucide-wand-sparkles', tone: 'success' }
]

const mockActivity: ActivityItem[] = [
  { id: 'activity-1', title: 'Completed task "Revise Mathematics Chapter 3"', timeAgo: '2 hours ago', icon: 'i-lucide-circle-check-big', tone: 'success' },
  { id: 'activity-2', title: 'Uploaded file "Algorithms Notes.pdf"', timeAgo: '5 hours ago', icon: 'i-lucide-file-up', tone: 'info' },
  { id: 'activity-3', title: 'Started study session for "Algorithms Course"', timeAgo: 'Yesterday', icon: 'i-lucide-book-marked', tone: 'primary' },
  { id: 'activity-4', title: 'Earned badge "Consistent"', timeAgo: 'Yesterday', icon: 'i-lucide-medal', tone: 'warning' }
]

const mockSubscription: ProfileSubscription = {
  name: 'Student Plan',
  status: 'Active',
  nextBillingDate: '18 June 2024',
  billingCycle: 'Monthly',
  priceLabel: '$9.99 / month'
}

const mockTokenUsage: TokenUsage = {
  balance: 8750,
  limit: 10000,
  resetDate: '18 May 2024',
  usedPercentage: 87
}

const mockAIPreferences: AIPreference[] = [
  { id: 'assistant-style', label: 'Study Assistant Style', value: 'Balanced', icon: 'i-lucide-sparkles' },
  { id: 'response-detail', label: 'Response Detail', value: 'Detailed', icon: 'i-lucide-bot-message-square' },
  { id: 'motivation', label: 'Motivation Boosts', value: 'Enabled', icon: 'i-lucide-flame' }
]

const mockQuickActions: QuickAction[] = [
  { id: 'edit-profile', label: 'Edit Profile', icon: 'i-lucide-user-round-pen', to: '/settings/profile' },
  { id: 'manage-plan', label: 'Manage Plan', icon: 'i-lucide-credit-card', to: '/settings/billing' },
  { id: 'billing-history', label: 'Billing History', icon: 'i-lucide-receipt', to: '/settings/billing' },
  { id: 'download-data', label: 'Download My Data', icon: 'i-lucide-download', to: '/settings/profile' },
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
    quickActions: [] as QuickAction[],
    loading: false,
    error: '' as string | null,
    usingMockData: false
  }),
  actions: {
    applyMockData(message?: string) {
      this.user = clone(mockUser)
      this.profile = clone(mockProfile)
      this.stats = clone(mockStats)
      this.goals = clone(mockGoals)
      this.achievements = clone(mockAchievements)
      this.recentActivity = clone(mockActivity)
      this.subscription = clone(mockSubscription)
      this.tokenUsage = clone(mockTokenUsage)
      this.aiPreferences = clone(mockAIPreferences)
      this.quickActions = clone(mockQuickActions)
      this.error = message || null
      this.usingMockData = true
    },
    async fetchProfile() {
      this.loading = true
      this.error = null

      const api = useApi()

      try {
        const [userRes, profileRes, subscriptionRes, tokenRes] = await Promise.all([
          api.get<Partial<ProfileUser>>('/users/me'),
          api.get<Partial<ProfileDetails> & { stats?: ProfileStat[], goals?: StudyGoal[], achievements?: Achievement[], recentActivity?: ActivityItem[], aiPreferences?: AIPreference[] }>('/profile/me'),
          api.get<Partial<ProfileSubscription>>('/subscriptions/me'),
          api.get<Partial<TokenUsage>>('/tokens/balance')
        ])

        if (!userRes.success || !profileRes.success) {
          throw new Error(userRes.message || profileRes.message || 'Profile request failed')
        }

        this.user = {
          ...clone(mockUser),
          ...userRes.data
        }

        this.profile = {
          ...clone(mockProfile),
          ...profileRes.data,
          academic: {
            ...clone(mockProfile.academic),
            ...profileRes.data?.academic
          },
          checklist: profileRes.data?.checklist || clone(mockProfile.checklist)
        }

        this.stats = profileRes.data?.stats?.length ? profileRes.data.stats : clone(mockStats)
        this.goals = profileRes.data?.goals?.length ? profileRes.data.goals : clone(mockGoals)
        this.achievements = profileRes.data?.achievements?.length ? profileRes.data.achievements : clone(mockAchievements)
        this.recentActivity = profileRes.data?.recentActivity?.length ? profileRes.data.recentActivity : clone(mockActivity)
        this.aiPreferences = profileRes.data?.aiPreferences?.length ? profileRes.data.aiPreferences : clone(mockAIPreferences)
        this.quickActions = clone(mockQuickActions)
        this.subscription = subscriptionRes.success ? { ...clone(mockSubscription), ...subscriptionRes.data } : clone(mockSubscription)
        this.tokenUsage = tokenRes.success
          ? {
              ...clone(mockTokenUsage),
              ...tokenRes.data,
              usedPercentage: tokenRes.data?.usedPercentage || Math.round(((tokenRes.data?.balance || mockTokenUsage.balance) / (tokenRes.data?.limit || mockTokenUsage.limit)) * 100)
            }
          : clone(mockTokenUsage)
        this.usingMockData = false
      } catch (error: any) {
        this.applyMockData(error?.message || 'Backend unavailable. Showing demo profile data.')
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
          academic: {
            university: payload.university,
            fieldOfStudy: payload.fieldOfStudy,
            academicYear: payload.academicYear,
            studentId: payload.studentId
          }
        })
      ])

      const failedRequest = requests.find(request => !request.success)

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

      if (this.user) {
        this.user.avatar = previewUrl
      }

      return true
    }
  }
})
