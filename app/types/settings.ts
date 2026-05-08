export interface NotificationToggle {
  key: string
  label: string
  description: string
  icon: string
}

export type NotificationFrequency = 'instant' | 'digest' | 'weekly'
export type InAppDisplayStyle = 'banner' | 'toast' | 'modal'
export type DeliveryScope = 'all' | 'important' | 'custom'

export interface NotificationPreferences {
  generalNotifications: boolean
  aiStudyReminders: boolean
  examAlerts: boolean
  deadlineReminders: boolean
  weeklySummaries: boolean
  productivityInsights: boolean
  emailNotifications: boolean
  emailAddress: string
  emailFrequency: NotificationFrequency
  pushNotifications: boolean
  webPush: boolean
  mobilePush: boolean
  inAppNotifications: boolean
  inAppDisplayStyle: InAppDisplayStyle
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  timezone: string
  quietHoursApplyTo: Array<'push' | 'email' | 'in-app'>
  notificationFrequency: DeliveryScope
}

export interface StudyPreferences {
  preferredStudyHours: string
  preferredDays: string[]
  focusSessionLength: number
  revisionStyle: string
  breakLength: number
  language: string
  difficultyPreference: string
  calendarDefaultView: string
  aiAssistantTone: string
  examPreparationMode: string
  autoScheduleSessions: boolean
  includeBufferTime: boolean
  smartRescheduling: boolean
  weekendStudy: boolean
  themePreference: 'light' | 'dark'
}

export interface SecurityCheck {
  id: string
  label: string
  status: string
  completed: boolean
}

export interface SecurityOverview {
  twoFactorEnabled: boolean
  twoFactorMethod: string
  backupCodesAvailable: number
  score: number
  checks: SecurityCheck[]
}

export interface SecuritySession {
  id: string
  device: string
  browser: string
  location: string
  ipAddress: string
  lastSeen: string
  current: boolean
}

export interface LoginHistoryItem {
  id: string
  timeLabel: string
  location: string
  status: 'Success' | 'Failed'
}

export interface TrustedDevice {
  id: string
  name: string
  addedOn: string
  icon: string
}

export interface RecoveryMethod {
  id: string
  label: string
  value: string
  status: string
  icon: string
}

export interface AdditionalSecurityOption {
  id: string
  label: string
  description: string
  type: 'toggle' | 'link'
  enabled?: boolean
}

export interface SecurityTip {
  id: string
  title: string
  description: string
  icon: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
