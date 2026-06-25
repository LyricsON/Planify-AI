export interface ProfileUser {
  id: string
  name: string
  email: string
  avatar?: string
  phone?: string
  location?: string
  role?: string
}

export interface ProfileChecklistItem {
  id: string
  label: string
  completed: boolean
}

export interface AcademicInformation {
  university?: string
  fieldOfStudy?: string
  academicYear?: string
  semester?: string
  studentId?: string
  gpa?: string
}

export interface SocialLinks {
  website?: string
  linkedin?: string
  github?: string
}

export interface ProfileDetails {
  headline?: string
  bio?: string
  completion: number
  tags: string[]
  academic: AcademicInformation
  socialLinks?: SocialLinks
  checklist: ProfileChecklistItem[]
}

export interface ProfileStat {
  id: string
  label: string
  value: string
  caption: string
  trend?: string
  icon: string
  tone: 'primary' | 'success' | 'info' | 'ai'
}

export interface StudyGoal {
  id: string
  title: string
  progress: number
  tone: 'success' | 'danger' | 'primary' | 'warning' | 'info'
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  tone: 'warning' | 'primary' | 'info' | 'success'
}

export interface ActivityItem {
  id: string
  title: string
  timeAgo: string
  icon: string
  tone: 'success' | 'info' | 'primary' | 'warning'
  date: string
}

export interface ProfileSubscription {
  name: string
  status: string
  nextBillingDate?: string
  billingCycle?: string
  priceLabel?: string
}

export interface TokenUsage {
  balance: number
  limit?: number
  resetDate?: string
  usedPercentage?: number
  used?: number
}

export interface AIPreference {
  id: string
  label: string
  value: string
  icon: string
}

export interface QuickAction {
  id: string
  label: string
  description?: string
  icon: string
  to?: string
  action?: 'edit-profile' | 'download-data'
}

/**
 * Payload for updating user profile.
 * - email is intentionally excluded: email changes require a dedicated secure flow.
 * - plan is intentionally excluded: plan changes are handled by the billing system only.
 */
export interface ProfilePayload {
  avatar?: string
  name: string
  phone: string
  location: string
  bio: string
  university: string
  fieldOfStudy: string
  academicYear: string
  semester: string
  studentId: string
  socialLinks?: SocialLinks
}

export interface Task {
  id: string
  title?: string
  status?: string
  completedAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface Course {
  id: string
  title?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

export interface StudySession {
  id: string
  title?: string
  status?: string
  durationMinutes?: number
  duration?: number
  startedAt?: string
  completedAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface FileItem {
  id: string
  name?: string
  filename?: string
  createdAt?: string
  updatedAt?: string
}
