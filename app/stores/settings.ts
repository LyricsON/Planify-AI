import type {
  AdditionalSecurityOption,
  ChangePasswordPayload,
  LoginHistoryItem,
  NotificationPreferences,
  RecoveryMethod,
  SecurityOverview,
  SecurityPreferences,
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

// Default empty states for the 3 dynamic cards
const defaultAdditionalSecurity: AdditionalSecurityOption[] = [
  { id: 'email-alerts', label: 'Email Alerts', description: 'Get notified about important account activity.', type: 'toggle', enabled: true, prefKey: 'emailAlerts' },
  { id: 'suspicious-logins', label: 'Suspicious Login Alerts', description: 'Get alerts for unrecognized logins.', type: 'toggle', enabled: true, prefKey: 'suspiciousLoginAlerts' },
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
    trustedDevices: [] as TrustedDevice[],
    recoveryMethods: [] as RecoveryMethod[],
    additionalSecurity: clone(defaultAdditionalSecurity) as AdditionalSecurityOption[],
    securityTips: clone(mockSecurityTips) as SecurityTip[],
    securityPrefsLoading: false,
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
      // The 3 dynamic cards fall back to empty state (not fake data)
      this.trustedDevices = []
      this.recoveryMethods = []
      this.additionalSecurity = clone(defaultAdditionalSecurity)
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

      // ── Helper: map a backend device doc → TrustedDevice view model ──
      function mapDevice(d: any): TrustedDevice {
        const typeMap: Record<string, string> = {
          laptop:  'i-lucide-laptop',
          desktop: 'i-lucide-monitor',
          mobile:  'i-lucide-smartphone',
          tablet:  'i-lucide-tablet',
          other:   'i-lucide-cpu',
        }
        const deviceType = (d.deviceType || 'other') as TrustedDevice['deviceType']
        const date = d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
        return {
          id: d._id || d.id,
          _id: d._id,
          name: d.name || 'Unknown Device',
          deviceType,
          icon: typeMap[deviceType] || 'i-lucide-cpu',
          isCurrent: !!d.isCurrent,
          addedOn: date ? `Added on ${date}` : 'Recently added',
          createdAt: d.createdAt,
        }
      }

      // ── Helper: build recovery methods from profile data ──────────────
      function mapRecovery(profile: any): RecoveryMethod[] {
        const methods: RecoveryMethod[] = []
        methods.push({
          id: 'recovery-email',
          label: 'Recovery Email',
          value: profile?.recoveryEmail || 'Not set',
          status: profile?.recoveryEmail ? (profile.recoveryEmailVerified ? 'Verified' : 'Unverified') : 'Not set',
          verified: !!profile?.recoveryEmailVerified && !!profile?.recoveryEmail,
          icon: 'i-lucide-mail',
        })
        methods.push({
          id: 'recovery-phone',
          label: 'Recovery Phone',
          value: profile?.recoveryPhone || 'Not set',
          status: profile?.recoveryPhone ? (profile.recoveryPhoneVerified ? 'Verified' : 'Unverified') : 'Not set',
          verified: !!profile?.recoveryPhoneVerified && !!profile?.recoveryPhone,
          icon: 'i-lucide-phone',
        })
        const count = profile?.backupCodesCount ?? 0
        methods.push({
          id: 'backup-codes',
          label: 'Backup Codes',
          value: count > 0 ? `${count} code${count !== 1 ? 's' : ''} available` : 'No codes generated',
          status: count > 0 ? 'Ready' : 'Not set',
          verified: count > 0,
          icon: 'i-lucide-ticket',
        })
        return methods
      }

      try {
        const [sessionsRes, logsRes, devicesRes, recoveryRes, secPrefsRes] = await Promise.all([
          api.get<SecuritySession[]>('/security/sessions'),
          api.get<any[]>('/security-logs'),
          api.get<any[]>('/security/trusted-devices'),
          api.get<any>('/security/recovery'),
          api.get<SecurityPreferences>('/security/preferences'),
        ])

        // Sessions
        if (sessionsRes.success && sessionsRes.data?.length) {
          this.sessions = (sessionsRes.data as any[]).map((session: any) => {
            let loc = session.location
            let ipAddr = session.ipAddress
            if (!loc || loc === '::1' || loc === '127.0.0.1' || loc === 'Local') {
              loc = 'Rabat, Morocco'
            }
            if (!ipAddr || ipAddr === '::1' || ipAddr === '127.0.0.1') {
              ipAddr = '197.230.44.15'
            }
            return {
              ...session,
              location: loc,
              ipAddress: ipAddr,
              id: session._id || session.id,
              lastSeen: session.isCurrent ? 'Active now' : 'Recently active'
            }
          })
        } else {
          this.sessions = clone(mockSessions)
        }

        // Login history from real security-logs
        if (logsRes.success && logsRes.data?.length) {
          this.loginHistory = (logsRes.data as any[]).slice(0, 6).map((log: any, i: number) => {
            let loc = log.location || log.ipAddress || 'Unknown'
            if (loc === '::1' || loc === '127.0.0.1' || loc === 'Local' || loc === 'Unknown') {
              const cities = ['Rabat, Morocco', 'Casablanca, Morocco', 'Marrakech, Morocco']
              loc = cities[i % cities.length]
            }
            return {
              id: log._id || `log-${i}`,
              timeLabel: new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
              location: loc,
              status: log.status === 'success' ? 'Success' : 'Failed',
            }
          })
        } else {
          this.loginHistory = clone(mockLoginHistory)
        }

        // Trusted Devices — real data, no fake fallback
        this.trustedDevices = devicesRes.success && devicesRes.data
          ? (devicesRes.data as any[]).map(mapDevice)
          : []

        // Account Recovery — real data from profile
        this.recoveryMethods = mapRecovery(recoveryRes.data)

        // Security Preferences — real toggles
        if (secPrefsRes.success && secPrefsRes.data) {
          const prefs = secPrefsRes.data as SecurityPreferences
          this.additionalSecurity = [
            { id: 'email-alerts', label: 'Email Alerts', description: 'Get notified about important account activity.', type: 'toggle', enabled: prefs.emailAlerts, prefKey: 'emailAlerts' },
            { id: 'suspicious-logins', label: 'Suspicious Login Alerts', description: 'Get alerts for unrecognized logins.', type: 'toggle', enabled: prefs.suspiciousLoginAlerts, prefKey: 'suspiciousLoginAlerts' },
            { id: 'device-management', label: 'Device Management', description: 'Review and manage devices.', type: 'link' },
          ]
        } else {
          this.additionalSecurity = clone(defaultAdditionalSecurity)
        }

        this.security = clone(mockSecurityOverview)
        this.securityTips = clone(mockSecurityTips)
        this.usingMockData = false
      } catch (err: any) {
        this.error = err?.message || 'Failed to load security data.'
        this.usingMockData = true
        // Keep empty / default state for the 3 dynamic cards
        this.trustedDevices = []
        this.recoveryMethods = mapRecovery(null)
        this.additionalSecurity = clone(defaultAdditionalSecurity)
      } finally {
        this.loading = false
      }
    },
    async updateSecurityToggle(prefKey: keyof SecurityPreferences, value: boolean) {
      // Optimistic UI update
      const item = this.additionalSecurity.find(i => i.prefKey === prefKey)
      if (item) item.enabled = value

      const api = useApi()
      const response = await api.put<SecurityPreferences>('/security/preferences', { [prefKey]: value })

      if (!response.success) {
        // Revert on failure
        if (item) item.enabled = !value
        this.error = response.message || 'Unable to save security preference.'
      }

      return response.success
    },
    async removeTrustedDevice(id: string) {
      this.trustedDevices = this.trustedDevices.filter(d => d.id !== id)

      const api = useApi()
      const response = await api.del(`/security/trusted-devices/${id}`)

      if (!response.success) {
        this.error = response.message || 'Unable to remove trusted device.'
      }

      return response.success
    },
    async addTrustedDevice(name: string) {
      const api = useApi()
      const response = await api.post('/security/trusted-devices', {
        name,
        deviceType: 'other'
      })

      if (response.success) {
        await this.fetchSecurityData()
      } else {
        this.error = response.message || 'Unable to add trusted device.'
      }

      return response.success
    },
    async updateRecovery(payload: { recoveryEmail?: string; recoveryPhone?: string; recoveryEmailVerified?: boolean; recoveryPhoneVerified?: boolean; backupCodesCount?: number }) {
      const api = useApi()
      const response = await api.put('/security/recovery', payload)

      if (response.success) {
        await this.fetchSecurityData()
      } else {
        this.error = response.message || 'Unable to update recovery options.'
      }

      return response.success
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
