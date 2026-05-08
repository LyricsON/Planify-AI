import type {
  AdditionalSecurityOption,
  ChangePasswordPayload,
  LoginHistoryItem,
  NotificationPreferences,
  RecoveryMethod,
  SecurityOverview,
  SecuritySession,
  SecurityTip,
  StudyPreferences,
  TrustedDevice
} from '~/types/settings'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

const mockNotificationPreferences: NotificationPreferences = {
  generalNotifications: true,
  aiStudyReminders: true,
  examAlerts: true,
  deadlineReminders: true,
  weeklySummaries: true,
  productivityInsights: true,
  emailNotifications: true,
  emailAddress: 'yassine.elamrani@university.edu',
  emailFrequency: 'digest',
  pushNotifications: true,
  webPush: true,
  mobilePush: true,
  inAppNotifications: true,
  inAppDisplayStyle: 'banner',
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  timezone: '(GMT+01:00) Casablanca',
  quietHoursApplyTo: ['push', 'email', 'in-app'],
  notificationFrequency: 'important'
}

const mockStudyPreferences: StudyPreferences = {
  preferredStudyHours: 'Morning (8AM - 12PM)',
  preferredDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  focusSessionLength: 90,
  revisionStyle: 'Spaced Repetition',
  breakLength: 15,
  language: 'English (US)',
  difficultyPreference: 'Balanced',
  calendarDefaultView: 'Schedule View',
  aiAssistantTone: 'Encouraging & Friendly',
  examPreparationMode: 'Balanced (Learn & Practice)',
  autoScheduleSessions: true,
  includeBufferTime: true,
  smartRescheduling: true,
  weekendStudy: false,
  themePreference: 'light'
}

const mockSecurityOverview: SecurityOverview = {
  twoFactorEnabled: true,
  twoFactorMethod: 'Authenticator App',
  backupCodesAvailable: 10,
  score: 85,
  checks: [
    { id: 'password', label: 'Strong password', status: 'Completed', completed: true },
    { id: 'two-factor', label: 'Two-factor authentication', status: 'Enabled', completed: true },
    { id: 'recovery', label: 'Recovery email', status: 'Set', completed: true },
    { id: 'trusted-devices', label: 'Trusted devices', status: '2 devices', completed: true },
    { id: 'recent-login', label: 'Recent login activity', status: 'No suspicious activity', completed: true }
  ]
}

const mockSessions: SecuritySession[] = [
  { id: 'session-1', device: 'Windows', browser: 'Chrome', location: 'Rabat, Morocco', ipAddress: '41.249.46.12', lastSeen: 'May 12, 2024 - 11:24 AM', current: true },
  { id: 'session-2', device: 'iPhone 14', browser: 'iOS Safari', location: 'Rabat, Morocco', ipAddress: '102.88.11.32', lastSeen: 'May 11, 2024 - 9:05 PM', current: false },
  { id: 'session-3', device: 'MacBook Pro', browser: 'Safari', location: 'Casablanca, Morocco', ipAddress: '196.25.18.45', lastSeen: 'May 9, 2024 - 4:18 PM', current: false }
]

const mockLoginHistory: LoginHistoryItem[] = [
  { id: 'log-1', timeLabel: 'Today, 11:24 AM', location: 'Rabat, Morocco', status: 'Success' },
  { id: 'log-2', timeLabel: 'May 11, 9:05 PM', location: 'Rabat, Morocco', status: 'Success' },
  { id: 'log-3', timeLabel: 'May 10, 3:40 PM', location: 'Casablanca, Morocco', status: 'Success' },
  { id: 'log-4', timeLabel: 'May 8, 7:12 AM', location: 'Rabat, Morocco', status: 'Success' },
  { id: 'log-5', timeLabel: 'May 7, 10:33 PM', location: 'Marrakech, Morocco', status: 'Failed' }
]

const mockTrustedDevices: TrustedDevice[] = [
  { id: 'device-1', name: 'Yassine\'s MacBook Pro', addedOn: 'Added on Apr 18, 2024', icon: 'i-lucide-laptop' },
  { id: 'device-2', name: 'iPhone 14 Pro', addedOn: 'Added on Apr 10, 2024', icon: 'i-lucide-smartphone' }
]

const mockRecoveryMethods: RecoveryMethod[] = [
  { id: 'recovery-email', label: 'Recovery Email', value: 'yassine.elamrani@university.edu', status: 'Verified', icon: 'i-lucide-mail' },
  { id: 'recovery-phone', label: 'Recovery Phone', value: '+212 612 345 678', status: 'Verified', icon: 'i-lucide-phone' },
  { id: 'backup-codes', label: 'Backup Codes', value: '10 codes available', status: 'Ready', icon: 'i-lucide-ticket' }
]

const mockAdditionalSecurity: AdditionalSecurityOption[] = [
  { id: 'email-alerts', label: 'Email Alerts', description: 'Get notified about important account activity.', type: 'toggle', enabled: true },
  { id: 'suspicious-logins', label: 'Suspicious Login Alerts', description: 'Get alerts for unrecognized logins.', type: 'toggle', enabled: true },
  { id: 'device-management', label: 'Device Management', description: 'Review and manage devices.', type: 'link' }
]

const mockSecurityTips: SecurityTip[] = [
  { id: 'tip-password', title: 'Use a strong password', description: 'Create a unique password with at least 8 characters, including numbers and symbols.', icon: 'i-lucide-lock' },
  { id: 'tip-2fa', title: 'Enable 2FA', description: 'Adding two-factor authentication significantly reduces account breach risks.', icon: 'i-lucide-shield-check' },
  { id: 'tip-recovery', title: 'Keep your recovery email updated', description: 'Ensure your recovery email is current so you can regain access if needed.', icon: 'i-lucide-badge-check' },
  { id: 'tip-sessions', title: 'Review active sessions', description: 'Sign out of any devices you don\'t recognize.', icon: 'i-lucide-monitor-smartphone' }
]

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    preferences: clone(mockNotificationPreferences) as NotificationPreferences,
    studyPreferences: clone(mockStudyPreferences) as StudyPreferences,
    security: clone(mockSecurityOverview) as SecurityOverview,
    sessions: clone(mockSessions) as SecuritySession[],
    loginHistory: clone(mockLoginHistory) as LoginHistoryItem[],
    trustedDevices: clone(mockTrustedDevices) as TrustedDevice[],
    recoveryMethods: clone(mockRecoveryMethods) as RecoveryMethod[],
    additionalSecurity: clone(mockAdditionalSecurity) as AdditionalSecurityOption[],
    securityTips: clone(mockSecurityTips) as SecurityTip[],
    loading: false,
    error: '' as string | null,
    usingMockData: false
  }),
  actions: {
    applyMockData(message?: string) {
      this.preferences = clone(mockNotificationPreferences)
      this.studyPreferences = clone(mockStudyPreferences)
      this.security = clone(mockSecurityOverview)
      this.sessions = clone(mockSessions)
      this.loginHistory = clone(mockLoginHistory)
      this.trustedDevices = clone(mockTrustedDevices)
      this.recoveryMethods = clone(mockRecoveryMethods)
      this.additionalSecurity = clone(mockAdditionalSecurity)
      this.securityTips = clone(mockSecurityTips)
      this.error = message || null
      this.usingMockData = true
    },
    async fetchPreferences() {
      this.loading = true
      this.error = null

      const api = useApi()

      try {
        const [notificationRes, studyRes] = await Promise.all([
          api.get<Partial<NotificationPreferences>>('/preferences/me'),
          api.get<Partial<StudyPreferences>>('/preferences/me', { section: 'study' })
        ])

        if (!notificationRes.success && !studyRes.success) {
          throw new Error(notificationRes.message || studyRes.message || 'Preferences request failed')
        }

        this.preferences = {
          ...clone(mockNotificationPreferences),
          ...notificationRes.data
        }

        this.studyPreferences = {
          ...clone(mockStudyPreferences),
          ...studyRes.data
        }

        this.usingMockData = false
      } catch (error: any) {
        this.applyMockData(error?.message || 'Backend unavailable. Showing demo preferences.')
      } finally {
        this.loading = false
      }
    },
    async updateNotifications(payload: NotificationPreferences) {
      this.preferences = clone(payload)

      const api = useApi()
      const response = await api.put('/preferences/notifications', payload)

      if (!response.success) {
        this.error = response.message || 'Unable to save notification preferences.'
      }

      return response.success
    },
    async updateStudyPreferences(payload: StudyPreferences) {
      this.studyPreferences = clone(payload)

      const api = useApi()
      const response = await api.put('/preferences/me', {
        section: 'study',
        ...payload
      })

      if (!response.success) {
        this.error = response.message || 'Unable to save study preferences.'
      }

      return response.success
    },
    async changePassword(payload: ChangePasswordPayload) {
      if (!payload.currentPassword || !payload.newPassword || !payload.confirmPassword) {
        this.error = 'Please fill all password fields.'
        return false
      }

      if (payload.newPassword !== payload.confirmPassword) {
        this.error = 'New passwords do not match.'
        return false
      }

      if (payload.newPassword.length < 8) {
        this.error = 'Password must be at least 8 characters.'
        return false
      }

      this.error = null
      const api = useApi()
      const response = await api.post('/security/change-password', {
        currentPassword: payload.currentPassword,
        newPassword: payload.newPassword
      })

      if (!response.success) {
        this.error = response.message || 'Unable to update password.'
      }

      return response.success
    },
    async toggleTwoFactor(enabled: boolean) {
      this.security.twoFactorEnabled = enabled

      const api = useApi()
      const response = await api.post('/security/two-factor/toggle', {
        enabled
      })

      if (!response.success) {
        this.error = response.message || 'Unable to update two-factor authentication.'
      }

      return response.success
    },
    async fetchSecurityData() {
      this.loading = true
      this.error = null

      const api = useApi()

      try {
        const [sessionsRes, logsRes] = await Promise.all([
          api.get<SecuritySession[]>('/security/sessions'),
          api.get<LoginHistoryItem[]>('/security/logs')
        ])

        this.sessions = sessionsRes.success && sessionsRes.data?.length ? sessionsRes.data : clone(mockSessions)
        this.loginHistory = logsRes.success && logsRes.data?.length ? logsRes.data : clone(mockLoginHistory)
        this.security = clone(mockSecurityOverview)
        this.trustedDevices = clone(mockTrustedDevices)
        this.recoveryMethods = clone(mockRecoveryMethods)
        this.additionalSecurity = clone(mockAdditionalSecurity)
        this.securityTips = clone(mockSecurityTips)
        this.usingMockData = !(sessionsRes.success || logsRes.success)

        if (!sessionsRes.success && !logsRes.success) {
          this.error = sessionsRes.message || logsRes.message || 'Backend unavailable. Showing demo security data.'
        }
      } finally {
        this.loading = false
      }
    },
    async testNotification() {
      const api = useApi()
      const response = await api.post('/notifications/test')

      if (!response.success) {
        this.error = response.message || 'Test notification could not be sent.'
      }

      return response.success
    },
    async revokeSession(id: string) {
      this.sessions = this.sessions.filter(session => session.id !== id)

      const api = useApi()
      const response = await api.del(`/security/sessions/${id}`)

      if (!response.success) {
        this.error = response.message || 'Unable to remove session.'
      }

      return response.success
    },
    signOutAllSessions() {
      this.sessions = this.sessions.filter(session => session.current)
    }
  }
})
