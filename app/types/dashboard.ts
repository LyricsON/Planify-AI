export interface DashboardUser {
  id: string
  name: string
  firstName: string
  email: string
  avatar?: string | null
  role?: string
  location?: string | null
  university?: string | null
  program?: string | null
  plan: string
  planLabel: string
  planStatus: string
  tokenBalance: number
  isVerified: boolean
}

export interface DashboardSubscription {
  id: string
  plan: string
  status: string
  billingCycle?: string
  price?: number
  currency?: string
  priceLabel?: string
  tokenLimit?: number
  autoRenew?: boolean
  nextBillingDate?: string | null
  endsAt?: string | null
}

export interface DashboardStat {
  id: string
  label: string
  value: string
  caption: string
  tone: 'primary' | 'success' | 'info' | 'warning'
  icon: string
}

export interface DashboardCourseRef {
  id: string
  title: string
  teacher?: string | null
  semester?: string | null
  color?: string | null
}

export interface DashboardScheduleItem {
  id: string
  title: string
  description?: string
  type: string
  start: string
  end: string
  time: string
  location?: string
  color?: string | null
  aiSuggested: boolean
  status: string
  course?: DashboardCourseRef | null
}

export interface DashboardWeeklyDay {
  label: string
  value: number
  height: number
  highlight?: boolean
}

export interface DashboardWeeklyProgress {
  percent: number
  summary: string
  days: DashboardWeeklyDay[]
}

export interface DashboardRecommendation {
  id: string
  title: string
  description: string
  icon: string
  tone: 'primary' | 'success' | 'info' | 'warning' | 'ai'
  actionLabel: string
  href: string
}

export interface DashboardUpcomingEvent {
  id: string
  type: string
  title: string
  subtitle: string
  date: string
  time: string
  label: string
  tone: 'primary' | 'success' | 'info' | 'warning' | 'ai'
  href: string
}

export interface DashboardFile {
  id: string
  name: string
  type: string
  size: number
  sizeLabel: string
  uploadedAt: string
  course?: DashboardCourseRef | null
}

export interface DashboardCourse {
  id: string
  title: string
  teacher: string
  semester: string
  progress: number
  color?: string | null
  status: string
  updatedAt?: string
}

export interface DashboardNotification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  tone: 'primary' | 'success' | 'info' | 'warning' | 'danger' | 'ai'
  createdAt: string
  actionUrl?: string | null
}

export interface DashboardSummary {
  greeting: string
  user: DashboardUser
  subscription: DashboardSubscription | null
  stats: DashboardStat[]
  todaySchedule: DashboardScheduleItem[]
  weeklyProgress: DashboardWeeklyProgress
  recommendations: DashboardRecommendation[]
  upcomingEvents: DashboardUpcomingEvent[]
  recentFiles: DashboardFile[]
  recentCourses: DashboardCourse[]
  notifications: DashboardNotification[]
  counts: {
    tasksPending: number
    tasksCompleted: number
    examsUpcoming: number
    notificationsUnread: number
    todaySchedule: number
    courses: number
  }
}
