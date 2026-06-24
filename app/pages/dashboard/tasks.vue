<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

// ── Types ─────────────────────────────────────────────────────────────────────
interface Task {
  _id: string
  title: string
  description?: string
  courseId?: string | { _id: string; title: string }
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'review' | 'completed'
  deadline?: string
  estimatedDuration?: number
  createdAt?: string
  updatedAt?: string
}

interface Course {
  _id: string
  title: string
}

interface Schedule {
  _id: string
  title: string
  start: string
  end: string
  type: string
  location?: string
  courseId?: string | { _id: string; title: string }
}

// ── Composables ───────────────────────────────────────────────────────────────
const { get, post, put, del } = useApi()
const router = useRouter()

// ── State ─────────────────────────────────────────────────────────────────────
const tasks = ref<Task[]>([])
const courses = ref<Course[]>([])
const schedules = ref<Schedule[]>([])
const exams = ref<any[]>([])
const studySessions = ref<any[]>([])
const preferences = ref<any>(null)
const isLoading = ref(true)
const loadError = ref('')

// Filter / search
const searchQuery = ref('')
const activeTab = ref<'all' | 'upcoming' | 'in_progress' | 'completed' | 'high_priority'>('all')
const sortBy = ref<'priority' | 'deadline' | 'newest' | 'oldest'>('priority')
const viewMode = ref<'board' | 'list'>('board')

// Modal state
const showModal = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const modalPresetStatus = ref<Task['status']>('todo')
const isSubmitting = ref(false)
const submitError = ref('')
const showDeleteConfirm = ref(false)
const deleteTargetId = ref('')

const form = ref({
  _id: '',
  title: '',
  description: '',
  courseId: '',
  status: 'todo' as Task['status'],
  priority: 'medium' as Task['priority'],
  deadline: '',
  estimatedDuration: 0
})

// ── Response parser ────────────────────────────────────────────────────
// The backend paginates and spreads: { success, data: [...], total, count, page, pages }
// normalizeResponse in useApi wraps the whole body as `apiRes.data`.
// So apiRes.data might be:
//   (a) the raw array  → if the response was just an array
//   (b) an object with a `data` key → paginated
function extractArray(apiRes: any): any[] {
  if (!apiRes || !apiRes.success) return []
  const d = apiRes.data
  if (Array.isArray(d)) return d
  if (d && Array.isArray(d.data)) return d.data
  return []
}

// ── Data Loading ──────────────────────────────────────────────────────
async function loadData() {
  loadError.value = ''
  isLoading.value = true

  // Guard: must be authenticated
  if (import.meta.client) {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('planify_token')
    if (!token) {
      loadError.value = 'You are not signed in. Please sign in to view your tasks.'
      isLoading.value = false
      return
    }
  }

  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const [tRes, cRes, sRes, eRes, ssRes, prefRes] = await Promise.all([
      get<any>('/tasks', { limit: 100 }),
      get<any>('/courses', { limit: 100 }),
      get<any>('/schedules', {
        start: todayStart.toISOString(),
        end: todayEnd.toISOString(),
        limit: 100
      }),
      get<any>('/exams', { limit: 100 }),
      get<any>('/study-sessions', { limit: 100 }),
      get<any>('/preferences')
    ])

    // Handle 401 — token expired / invalid
    if (tRes.statusCode === 401 || cRes.statusCode === 401) {
      loadError.value = 'Session expired. Please sign in again.'
      isLoading.value = false
      return
    }

    if (!tRes.success) {
      loadError.value = tRes.message || 'Failed to load tasks. Is the backend running on port 5000?'
      isLoading.value = false
      return
    }

    tasks.value = extractArray(tRes)
    courses.value = extractArray(cRes)
    schedules.value = extractArray(sRes)
    exams.value = extractArray(eRes)
    studySessions.value = extractArray(ssRes)
    preferences.value = prefRes.success ? prefRes.data : null
  } catch (e: any) {
    loadError.value = e?.message || 'Unexpected error loading tasks.'
    console.error('[Tasks] loadData error:', e)
  } finally {
    isLoading.value = false
  }
}


onMounted(loadData)

// ── Helpers ───────────────────────────────────────────────────────────────────
const courseMap = computed(() => {
  const m = new Map<string, string>()
  courses.value.forEach(c => m.set(c._id, c.title))
  return m
})

function courseTitleOf(courseId: string | { _id: string; title: string } | undefined): string {
  if (!courseId) return ''
  if (typeof courseId === 'object' && courseId.title) return courseId.title
  return courseMap.value.get(courseId as string) || ''
}

function normalizeCourseId(courseId: string | { _id: string; title: string } | undefined): string {
  if (!courseId) return ''
  if (typeof courseId === 'object') return courseId._id
  return courseId
}

function priorityWeight(p: string): number {
  if (p === 'high') return 3
  if (p === 'medium') return 2
  return 1
}

function formatDeadline(d?: string): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatDuration(mins?: number): string {
  if (!mins) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function relativeTime(dateStr?: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function daysUntilLabel(d?: string): string {
  if (!d) return ''
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  if (diff < 0) return `Overdue`
  if (diff === 0) return 'Due today'
  if (diff === 1) return 'In 1 day'
  return `In ${diff} days`
}

function daysUntilClass(d?: string): string {
  if (!d) return 'due-neutral'
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  if (diff < 0) return 'due-overdue'
  if (diff <= 2) return 'due-soon'
  return 'due-ok'
}

function scheduleTimeLabel(ev: Schedule): string {
  const s = new Date(ev.start)
  const e = new Date(ev.end)
  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return `${fmt(s)} – ${fmt(e)}`
}

function scheduleCourseName(ev: Schedule): string {
  if (!ev.courseId) return ev.location || ''
  if (typeof ev.courseId === 'object' && ev.courseId.title) return ev.courseId.title
  return courseMap.value.get(ev.courseId as string) || ev.location || ''
}

// ── Stats ─────────────────────────────────────────────────────────────────────
const stats = computed(() => {
  const total = tasks.value.length
  const completed = tasks.value.filter(t => t.status === 'completed').length
  const overdue = tasks.value.filter(t => {
    if (!t.deadline || t.status === 'completed') return false
    return new Date(t.deadline) < new Date()
  }).length

  // tasks created this week
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
  const thisWeek = tasks.value.filter(t => t.createdAt && new Date(t.createdAt) >= weekAgo).length

  // Today's priorities: high-priority active tasks
  const todayPriorities = tasks.value.filter(t => t.priority === 'high' && t.status !== 'completed').length

  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0

  return { total, completed, overdue, thisWeek, completionPct, todayPriorities }
})

// ── Status counts for donut ───────────────────────────────────────────────────
const statusCounts = computed(() => {
  const completed = tasks.value.filter(t => t.status === 'completed').length
  const inProgress = tasks.value.filter(t => t.status === 'in_progress').length
  const todo = tasks.value.filter(t => t.status === 'todo').length
  const review = tasks.value.filter(t => t.status === 'review').length
  const total = tasks.value.length || 1
  return { completed, inProgress, todo, review, total }
})

// SVG Donut helpers
const DONUT_R = 54
const DONUT_CIRC = 2 * Math.PI * DONUT_R

function donutOffset(pct: number, startPct: number): string {
  const filled = (pct / 100) * DONUT_CIRC
  const offset = DONUT_CIRC - filled
  const rotation = startPct * 3.6 // 3.6deg per percent
  return `${offset}`
}

function donutRotation(startPct: number): string {
  return `rotate(${startPct * 3.6 - 90}, 64, 64)`
}

const donutSegments = computed(() => {
  const { completed, inProgress, todo, review, total } = statusCounts.value
  const segments = [
    { label: 'Completed', count: completed, pct: Math.round((completed / total) * 100), color: 'var(--color-success)' },
    { label: 'In Progress', count: inProgress, pct: Math.round((inProgress / total) * 100), color: 'var(--color-warning)' },
    { label: 'To Do', count: todo, pct: Math.round((todo / total) * 100), color: 'var(--color-primary)' },
    { label: 'Review', count: review, pct: Math.round((review / total) * 100), color: 'var(--color-ai)' }
  ]
  let cumPct = 0
  return segments.map(s => {
    const seg = { ...s, startPct: cumPct }
    cumPct += s.pct
    return seg
  })
})

// ── Filtering & Sorting ───────────────────────────────────────────────────────
const enrichedTasks = computed(() =>
  tasks.value.map(t => ({
    ...t,
    courseTitle: courseTitleOf(t.courseId),
    courseIdNorm: normalizeCourseId(t.courseId)
  }))
)

function matchesSearch(t: typeof enrichedTasks.value[0]): boolean {
  if (!searchQuery.value.trim()) return true
  const q = searchQuery.value.toLowerCase()
  return (
    t.title.toLowerCase().includes(q) ||
    (t.description || '').toLowerCase().includes(q) ||
    t.courseTitle.toLowerCase().includes(q)
  )
}

function matchesTab(t: typeof enrichedTasks.value[0]): boolean {
  switch (activeTab.value) {
    case 'upcoming':
      return t.status !== 'completed' && !!t.deadline && new Date(t.deadline) > now
    case 'in_progress':
      return t.status === 'in_progress'
    case 'completed':
      return t.status === 'completed'
    case 'high_priority':
      return t.priority === 'high' && t.status !== 'completed'
    default:
      return true
  }
}

function sortTasks(a: any, b: any): number {
  switch (sortBy.value) {
    case 'priority':
      return priorityWeight(b.priority) - priorityWeight(a.priority)
    case 'deadline':
      return (new Date(a.deadline || 0).getTime()) - (new Date(b.deadline || 0).getTime())
    case 'newest':
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    case 'oldest':
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  }
}

const filteredTasks = computed(() =>
  enrichedTasks.value
    .filter(t => matchesSearch(t) && matchesTab(t))
    .sort(sortTasks)
)

// ── Kanban columns ────────────────────────────────────────────────────────────
const kanbanColumns = computed(() => [
  {
    id: 'todo',
    label: 'To Do',
    status: 'todo' as const,
    accent: 'var(--color-primary)',
    accentSoft: 'color-mix(in srgb, var(--color-primary) 8%, transparent)',
    tasks: filteredTasks.value.filter(t => t.status === 'todo')
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    status: 'in_progress' as const,
    accent: 'var(--color-warning)',
    accentSoft: 'color-mix(in srgb, var(--color-warning) 8%, transparent)',
    tasks: filteredTasks.value.filter(t => t.status === 'in_progress')
  },
  {
    id: 'review',
    label: 'Review',
    status: 'review' as const,
    accent: 'var(--color-ai)',
    accentSoft: 'color-mix(in srgb, var(--color-ai) 8%, transparent)',
    tasks: filteredTasks.value.filter(t => t.status === 'review')
  },
  {
    id: 'completed',
    label: 'Completed',
    status: 'completed' as const,
    accent: 'var(--color-success)',
    accentSoft: 'color-mix(in srgb, var(--color-success) 8%, transparent)',
    tasks: filteredTasks.value.filter(t => t.status === 'completed')
  }
])

// ── Upcoming Deadlines ────────────────────────────────────────────────────────
const upcomingDeadlines = computed(() =>
  enrichedTasks.value
    .filter(t => t.deadline && t.status !== 'completed')
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5)
)

// ── AI Prioritization ─────────────────────────────────────────────────────────
function calculatePriorityScore(t: Task): number {
  let score = 0

  // 1. Task priority
  if (t.priority === 'high') score += 1000
  else if (t.priority === 'medium') score += 500
  else score += 100

  // 2. Overdue status / Proximity
  const now = Date.now()
  if (t.deadline) {
    const dueTime = new Date(t.deadline).getTime()
    if (dueTime < now) {
      score += 2000 // Overdue bonus
    } else {
      const diffDays = (dueTime - now) / 86400000
      if (diffDays <= 1) score += 800
      else if (diffDays <= 3) score += 400
      else if (diffDays <= 7) score += 200
    }
  }

  return score
}

const aiPriorities = computed(() => {
  const active = enrichedTasks.value.filter(t => t.status !== 'completed')
  return [...active]
    .map(t => ({
      ...t,
      score: calculatePriorityScore(t)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
})

// ── Today's Agenda ────────────────────────────────────────────────────────────
const todayAgenda = computed(() => {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)

  const list: any[] = []

  // Add tasks due today
  tasks.value.forEach(t => {
    if (t.deadline) {
      const d = new Date(t.deadline)
      if (d >= todayStart && d <= todayEnd && t.status !== 'completed') {
        list.push({
          _id: t._id,
          title: `Due: ${t.title}`,
          start: t.deadline,
          end: t.deadline,
          type: 'task',
          courseId: t.courseId
        })
      }
    }
  })

  // Add exams today
  exams.value.forEach(e => {
    if (e.examDate) {
      const d = new Date(e.examDate)
      if (d >= todayStart && d <= todayEnd) {
        list.push({
          _id: e._id,
          title: `Exam: ${e.title}`,
          start: e.examDate,
          end: e.examDate,
          type: 'exam',
          courseId: e.courseId
        })
      }
    }
  })

  // Add schedules today (deduplicated by title)
  schedules.value.forEach(s => {
    if (s.start) {
      const d = new Date(s.start)
      if (d >= todayStart && d <= todayEnd) {
        const isDuplicate = list.some(item => 
          item.title.includes(s.title) || s.title.includes(item.title)
        )
        if (!isDuplicate) {
          list.push({
            _id: s._id,
            title: s.title,
            start: s.start,
            end: s.end,
            type: s.type || 'study_session',
            courseId: s.courseId
          })
        }
      }
    }
  })

  return list.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
})

// ── Daily Habits ──────────────────────────────────────────────────────────────
const dailyHabits = computed(() => {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)

  // 1. Study Hours (sum from completed study sessions today)
  const todayStudyMins = studySessions.value
    .filter(ss => {
      if (ss.status !== 'completed' || !ss.startTime) return false
      const d = new Date(ss.startTime)
      return d >= todayStart && d <= todayEnd
    })
    .reduce((acc, ss) => acc + (ss.duration || 0), 0)

  const studyHoursCurrent = Math.round((todayStudyMins / 60) * 10) / 10
  const studyHoursTarget = 2
  const studyDone = todayStudyMins >= 120

  // 2. Tasks Completed (tasks completed today)
  const completedToday = tasks.value.filter(t => {
    if (t.status !== 'completed' || !t.updatedAt) return false
    const d = new Date(t.updatedAt)
    return d >= todayStart && d <= todayEnd
  }).length
  const taskTarget = 10

  // 3. Flashcards Reviewed (tasks in review or matching search)
  const reviewCount = tasks.value.filter(t =>
    t.status === 'review' || t.title.toLowerCase().includes('review') || t.title.toLowerCase().includes('flashcard')
  ).length
  const reviewTarget = 20

  return [
    {
      label: 'Study for 2+ hours',
      current: studyHoursCurrent,
      target: studyHoursTarget,
      unit: 'h',
      displayCurrent: todayStudyMins > 0 ? `${Math.floor(todayStudyMins / 60)}h ${todayStudyMins % 60}m` : '0h',
      displayTarget: `${studyHoursTarget}h`,
      done: studyDone,
      pct: Math.min(100, Math.round((todayStudyMins / 120) * 100))
    },
    {
      label: 'Solve tasks/problems',
      current: completedToday,
      target: taskTarget,
      unit: '',
      displayCurrent: `${completedToday}`,
      displayTarget: `${taskTarget}`,
      done: completedToday >= taskTarget,
      pct: Math.min(100, Math.round((completedToday / taskTarget) * 100))
    },
    {
      label: 'Review flashcards',
      current: reviewCount,
      target: reviewTarget,
      unit: '',
      displayCurrent: `${reviewCount}`,
      displayTarget: `${reviewTarget}`,
      done: reviewCount >= reviewTarget,
      pct: Math.min(100, Math.round((reviewCount / reviewTarget) * 100))
    }
  ]
})

// ── Recent Activity ───────────────────────────────────────────────────────────
const recentActivity = computed(() => {
  const eventsList: any[] = []

  tasks.value.forEach(t => {
    // 1. Task Creation event
    if (t.createdAt) {
      eventsList.push({
        _id: `${t._id}-created`,
        text: `Task created: "${t.title}"`,
        icon: 'i-lucide-plus-circle',
        iconColor: 'var(--color-primary)',
        timestamp: new Date(t.createdAt).getTime()
      })
    }

    // 2. Task Completion event (if completed)
    if (t.status === 'completed') {
      const time = t.updatedAt || t.createdAt
      if (time) {
        eventsList.push({
          _id: `${t._id}-completed`,
          text: `Task completed: "${t.title}"`,
          icon: 'i-lucide-check-circle-2',
          iconColor: 'var(--color-success)',
          timestamp: new Date(time).getTime()
        })
      }
    } else if (t.updatedAt && t.createdAt && new Date(t.updatedAt).getTime() > new Date(t.createdAt).getTime() + 1000) {
      // 3. Task Update event (if modified after creation)
      eventsList.push({
        _id: `${t._id}-updated`,
        text: `Task updated: "${t.title}"`,
        icon: 'i-lucide-pencil',
        iconColor: 'var(--color-warning)',
        timestamp: new Date(t.updatedAt).getTime()
      })
    }
  })

  // Sort by timestamp descending (newest first)
  return eventsList
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)
    .map(evt => ({
      _id: evt._id,
      text: evt.text,
      icon: evt.icon,
      iconColor: evt.iconColor,
      time: relativeTime(new Date(evt.timestamp).toISOString())
    }))
})

// ── Modal logic ───────────────────────────────────────────────────────────────
function openAddModal(status: Task['status'] = 'todo') {
  modalMode.value = 'add'
  modalPresetStatus.value = status
  form.value = {
    _id: '',
    title: '',
    description: '',
    courseId: '',
    status,
    priority: 'medium',
    deadline: '',
    estimatedDuration: 0
  }
  submitError.value = ''
  showModal.value = true
}

function openEditModal(task: Task) {
  modalMode.value = 'edit'
  const cid = normalizeCourseId(task.courseId)
  const deadline = task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ''
  form.value = {
    _id: task._id,
    title: task.title,
    description: task.description || '',
    courseId: cid,
    status: task.status,
    priority: task.priority,
    deadline,
    estimatedDuration: task.estimatedDuration || 0
  }
  submitError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  submitError.value = ''
}

async function submitForm() {
  if (!form.value.title.trim()) {
    submitError.value = 'Title is required.'
    return
  }
  isSubmitting.value = true
  submitError.value = ''
  try {
    const payload: Record<string, any> = {
      title: form.value.title.trim(),
      description: form.value.description,
      status: form.value.status,
      priority: form.value.priority,
    }
    if (form.value.courseId) payload.courseId = form.value.courseId
    if (form.value.deadline) payload.deadline = new Date(form.value.deadline).toISOString()
    if (form.value.estimatedDuration > 0) payload.estimatedDuration = Number(form.value.estimatedDuration)

    if (modalMode.value === 'add') {
      const res = await post<any>('/tasks', payload)
      if (!res.success) throw new Error(res.message || 'Failed to create task')
    } else {
      const res = await put<any>(`/tasks/${form.value._id}`, payload)
      if (!res.success) throw new Error(res.message || 'Failed to update task')
    }
    showModal.value = false
    await loadData()
  } catch (e: any) {
    submitError.value = e.message || 'An error occurred'
  } finally {
    isSubmitting.value = false
  }
}

function confirmDelete(id: string) {
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}

async function executeDelete() {
  if (!deleteTargetId.value) return
  isSubmitting.value = true
  const targetId = deleteTargetId.value
  const originalTasks = [...tasks.value]
  
  // Optimistic update
  tasks.value = tasks.value.filter(t => t._id !== targetId)
  showDeleteConfirm.value = false
  
  try {
    const res = await del(`/tasks/${targetId}`)
    if (!res.success) {
      tasks.value = originalTasks
    } else {
      deleteTargetId.value = ''
      await loadData()
    }
  } catch (e) {
    tasks.value = originalTasks
    console.error('Delete error', e)
  } finally {
    isSubmitting.value = false
  }
}

// Task card menu
const openMenuId = ref<string | null>(null)
function toggleMenu(id: string) {
  openMenuId.value = openMenuId.value === id ? null : id
}

// Quick status change with optimistic updates
async function quickStatus(task: Task, status: Task['status']) {
  openMenuId.value = null
  const oldStatus = task.status
  
  // Optimistic update
  task.status = status
  
  try {
    const res = await put<any>(`/tasks/${task._id}`, { status })
    if (!res.success) {
      task.status = oldStatus
    } else {
      await loadData()
    }
  } catch (e) {
    task.status = oldStatus
    console.error('Failed to update status:', e)
  }
}
</script>

<template>
  <section class="tasks-page max-w-[1600px] mx-auto pb-10">

    <!-- ── PAGE HEADER ──────────────────────────────────────────────────────── -->
    <div class="page-header-row">
      
        <button class="btn-primary" @click="openAddModal('todo')">
          <UIcon name="i-lucide-plus" class="size-4" />
          Add Task
        </button>
     
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-24">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" style="color:var(--color-primary)" />
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="error-state-panel">
      <UIcon name="i-lucide-wifi-off" class="size-8" style="color:var(--color-danger)" />
      <h3 class="error-state-title">Could not load tasks</h3>
      <p class="error-state-msg">{{ loadError }}</p>
      <div class="error-state-actions">
        <button class="btn-primary" @click="loadData">
          <UIcon name="i-lucide-refresh-cw" class="size-4" />
          Retry
        </button>
        <NuxtLink to="/auth/signin" class="btn-secondary">
          Sign in
        </NuxtLink>
      </div>
    </div>

    <template v-else>

      <!-- ── STATS ROW ──────────────────────────────────────────────────────── -->
      <div class="stats-row">
        <!-- Total Tasks -->
        <div class="stat-card">
          <div class="stat-icon-wrap" style="background:color-mix(in srgb,var(--color-primary) 10%,transparent)">
            <UIcon name="i-lucide-layout-list" class="size-4" style="color:var(--color-primary)" />
          </div>
          <div class="stat-body">
            <p class="stat-label">Total Tasks</p>
            <p class="stat-value">{{ stats.total }}</p>
            <p class="stat-sub" style="color:var(--color-success)">
              {{ stats.thisWeek > 0 ? `+${stats.thisWeek} this week` : 'Updated from your tasks' }}
            </p>
          </div>
        </div>

        <!-- Overdue -->
        <div class="stat-card">
          <div class="stat-icon-wrap" style="background:color-mix(in srgb,var(--color-danger) 10%,transparent)">
            <UIcon name="i-lucide-alert-circle" class="size-4" style="color:var(--color-danger)" />
          </div>
          <div class="stat-body">
            <p class="stat-label">Overdue</p>
            <p class="stat-value" style="color:var(--color-danger)">{{ stats.overdue }}</p>
            <p class="stat-sub" style="color:var(--color-danger)">Needs attention</p>
          </div>
        </div>

        <!-- Completed -->
        <div class="stat-card">
          <div class="stat-icon-wrap" style="background:color-mix(in srgb,var(--color-success) 10%,transparent)">
            <UIcon name="i-lucide-check-circle-2" class="size-4" style="color:var(--color-success)" />
          </div>
          <div class="stat-body">
            <p class="stat-label">Completed</p>
            <p class="stat-value" style="color:var(--color-success)">{{ stats.completed }}</p>
            <p class="stat-sub" style="color:var(--color-success)">{{ stats.completionPct }}% completion</p>
          </div>
        </div>

        <!-- Today's Priorities -->
        <div class="stat-card">
          <div class="stat-icon-wrap" style="background:color-mix(in srgb,var(--color-warning) 10%,transparent)">
            <UIcon name="i-lucide-flame" class="size-4" style="color:var(--color-warning)" />
          </div>
          <div class="stat-body">
            <p class="stat-label">Today's Priorities</p>
            <p class="stat-value" style="color:var(--color-warning)">{{ stats.todayPriorities }}</p>
            <p class="stat-sub" style="color:var(--color-warning)">High impact tasks</p>
          </div>
        </div>
      </div>

      <!-- ── FILTER BAR ─────────────────────────────────────────────────────── -->
      <div class="filter-bar">
        <div class="filter-tabs">
          <button
            v-for="tab in [
              { key: 'all', label: 'All' },
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'in_progress', label: 'In Progress' },
              { key: 'completed', label: 'Completed' },
              { key: 'high_priority', label: 'High Priority' },
            ]"
            :key="tab.key"
            class="filter-tab"
            :class="activeTab === tab.key ? 'filter-tab--active' : ''"
            @click="activeTab = tab.key as any"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="filter-actions">
          <button class="filter-btn">
            <UIcon name="i-lucide-sliders-horizontal" class="size-3.5" />
            Filters
          </button>
          <div class="sort-wrap">
            <span class="sort-label">Sort by:</span>
            <select v-model="sortBy" class="sort-select">
              <option value="priority">Priority</option>
              <option value="deadline">Deadline</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
          <div class="view-toggle">
            <button
              class="view-btn"
              :class="viewMode === 'board' ? 'view-btn--active' : ''"
              @click="viewMode = 'board'"
              title="Board view"
            >
              <UIcon name="i-lucide-layout-dashboard" class="size-4" />
            </button>
            <button
              class="view-btn"
              :class="viewMode === 'list' ? 'view-btn--active' : ''"
              @click="viewMode = 'list'"
              title="List view"
            >
              <UIcon name="i-lucide-list" class="size-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- ── MAIN CONTENT ───────────────────────────────────────────────────── -->
      <div class="main-grid">

        <!-- ── LEFT / MAIN COLUMN ──────────────────────────────────────────── -->
        <div class="main-col">

          <!-- BOARD VIEW -->
          <div v-if="viewMode === 'board'" class="kanban-board">
            <div
              v-for="col in kanbanColumns"
              :key="col.id"
              class="kanban-col"
            >
              <!-- Column accent bar -->
              <div class="kanban-col-accent" :style="`background:${col.accent}`" />

              <!-- Column header -->
              <div class="kanban-col-header">
                <span class="kanban-col-title">{{ col.label }}</span>
                <span class="kanban-col-badge" :style="`background:color-mix(in srgb,${col.accent} 12%,transparent);color:${col.accent}`">
                  {{ col.tasks.length }}
                </span>
              </div>

              <!-- Task cards -->
              <div class="kanban-cards">
                <div v-if="col.tasks.length === 0" class="kanban-empty">
                  <UIcon name="i-lucide-inbox" class="size-5" style="color:var(--color-text-muted)" />
                  <p>No tasks here</p>
                </div>

                <div
                  v-for="task in col.tasks"
                  :key="task._id"
                  class="task-card"
                  :class="task.status === 'completed' ? 'task-card--completed' : ''"
                >
                  <div class="task-card-top">
                    <div class="task-card-icon-wrap">
                      <UIcon
                        v-if="task.status === 'completed'"
                        name="i-lucide-check-circle-2"
                        class="size-4"
                        style="color:var(--color-success)"
                      />
                      <UIcon
                        v-else-if="task.status === 'review'"
                        name="i-lucide-eye"
                        class="size-4"
                        style="color:var(--color-ai)"
                      />
                      <UIcon
                        v-else-if="task.status === 'in_progress'"
                        name="i-lucide-loader"
                        class="size-4"
                        style="color:var(--color-warning)"
                      />
                      <UIcon
                        v-else
                        name="i-lucide-square-check-big"
                        class="size-4"
                        style="color:var(--color-primary)"
                      />
                    </div>
                    <p class="task-card-title" :class="task.status === 'completed' ? 'line-through' : ''">
                      {{ task.title }}
                    </p>
                    <div class="task-card-menu-wrap">
                      <button class="task-card-menu-btn" @click.stop="toggleMenu(task._id)">
                        <UIcon name="i-lucide-more-horizontal" class="size-4" />
                      </button>
                      <div v-if="openMenuId === task._id" class="task-dropdown">
                        <button class="task-dropdown-item" @click="openEditModal(task); openMenuId = null">
                          <UIcon name="i-lucide-pencil" class="size-3.5" />Edit
                        </button>
                        
                        <button
                          v-if="task.status === 'todo'"
                          class="task-dropdown-item"
                          @click="quickStatus(task, 'in_progress')"
                        >
                          <UIcon name="i-lucide-play" class="size-3.5" />Start Task
                        </button>
                        <button
                          v-if="task.status === 'in_progress'"
                          class="task-dropdown-item"
                          @click="quickStatus(task, 'review')"
                        >
                          <UIcon name="i-lucide-eye" class="size-3.5" />Move to Review
                        </button>
                        <button
                          v-if="task.status === 'review'"
                          class="task-dropdown-item"
                          @click="quickStatus(task, 'completed')"
                        >
                          <UIcon name="i-lucide-check" class="size-3.5" />Complete Task
                        </button>
                        <button
                          v-if="task.status === 'completed'"
                          class="task-dropdown-item"
                          @click="quickStatus(task, 'todo')"
                        >
                          <UIcon name="i-lucide-rotate-ccw" class="size-3.5" />Reopen Task
                        </button>
                        
                        <button class="task-dropdown-item task-dropdown-item--danger" @click="confirmDelete(task._id); openMenuId = null">
                          <UIcon name="i-lucide-trash-2" class="size-3.5" />Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  <p v-if="task.courseTitle" class="task-card-course">{{ task.courseTitle }}</p>

                  <div class="task-card-meta">
                    <div v-if="task.deadline" class="task-card-due" :class="daysUntilClass(task.deadline)">
                      <UIcon name="i-lucide-calendar" class="size-3" />
                      Due {{ formatDeadline(task.deadline) }}
                    </div>
                    <div v-if="task.estimatedDuration" class="task-card-duration">
                      <UIcon name="i-lucide-clock" class="size-3" />
                      {{ formatDuration(task.estimatedDuration) }}
                    </div>
                  </div>

                  <div class="task-card-footer">
                    <span
                      class="priority-badge"
                      :class="`priority-badge--${task.priority}`"
                    >
                      {{ task.priority.charAt(0).toUpperCase() + task.priority.slice(1) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Add button -->
              <button class="kanban-add-btn" @click="openAddModal(col.status)">
                <UIcon name="i-lucide-plus" class="size-3.5" />
                Add Task
              </button>
            </div>
          </div>

          <!-- LIST VIEW -->
          <div v-else class="list-view">
            <div v-if="filteredTasks.length === 0" class="empty-state">
              <UIcon name="i-lucide-clipboard-list" class="size-8" style="color:var(--color-text-muted)" />
              <p>No tasks match your filters.</p>
            </div>
            <div
              v-for="task in filteredTasks"
              :key="task._id"
              class="list-task-row"
            >
              <div class="list-task-left">
                <UIcon
                  v-if="task.status === 'completed'"
                  name="i-lucide-check-circle-2"
                  class="size-4"
                  style="color:var(--color-success)"
                />
                <UIcon v-else name="i-lucide-circle" class="size-4" style="color:var(--color-text-muted)" />
                <div>
                  <p class="list-task-title" :class="task.status === 'completed' ? 'line-through' : ''">
                    {{ task.title }}
                  </p>
                  <p v-if="task.courseTitle" class="list-task-course">{{ task.courseTitle }}</p>
                </div>
              </div>
              <div class="list-task-right">
                <span v-if="task.deadline" class="list-task-due">
                  {{ formatDeadline(task.deadline) }}
                </span>
                <span class="priority-badge" :class="`priority-badge--${task.priority}`">
                  {{ task.priority.charAt(0).toUpperCase() + task.priority.slice(1) }}
                </span>
                <button class="icon-btn-sm" @click="openEditModal(task)">
                  <UIcon name="i-lucide-pencil" class="size-3.5" />
                </button>
                <button class="icon-btn-sm icon-btn-sm--danger" @click="confirmDelete(task._id)">
                  <UIcon name="i-lucide-trash-2" class="size-3.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- ── BOTTOM ROW ──────────────────────────────────────────────────── -->
          <div class="bottom-row">

            <!-- Upcoming Deadlines -->
            <div class="section-card deadline-card">
              <div class="card-header">
                <h3 class="card-title">Upcoming Deadlines</h3>
                <button class="card-link">View all deadlines →</button>
              </div>
              <div v-if="upcomingDeadlines.length === 0" class="empty-state">
                <UIcon name="i-lucide-calendar-check" class="size-6" style="color:var(--color-text-muted)" />
                <p>No upcoming deadlines.</p>
              </div>
              <div v-else class="deadline-list">
                <div
                  v-for="task in upcomingDeadlines"
                  :key="task._id"
                  class="deadline-row"
                >
                  <div class="deadline-date">
                    <span class="deadline-day">{{ new Date(task.deadline!).getDate() }}</span>
                    <span class="deadline-month">{{ new Date(task.deadline!).toLocaleDateString('en-GB', { month: 'short' }).toUpperCase() }}</span>
                  </div>
                  <div class="deadline-info">
                    <p class="deadline-title">{{ task.title }}</p>
                    <p v-if="task.courseTitle" class="deadline-course">{{ task.courseTitle }}</p>
                  </div>
                  <div class="deadline-right">
                    <span v-if="task.estimatedDuration" class="deadline-dur">{{ formatDuration(task.estimatedDuration) }}</span>
                    <span class="priority-badge" :class="`priority-badge--${task.priority}`">
                      {{ task.priority.charAt(0).toUpperCase() + task.priority.slice(1) }}
                    </span>
                    <span class="due-chip" :class="daysUntilClass(task.deadline)">
                      {{ daysUntilLabel(task.deadline) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Task Progress Overview -->
            <div class="section-card progress-card">
              <div class="card-header">
                <h3 class="card-title">Task Progress Overview</h3>
                <button class="card-link">View detailed analytics →</button>
              </div>
              <div class="progress-content">
                <div class="donut-wrap">
                  <svg viewBox="0 0 128 128" width="128" height="128" class="donut-svg">
                    <circle
                      cx="64" cy="64" r="54"
                      fill="none"
                      stroke="var(--color-border)"
                      stroke-width="14"
                    />
                    <circle
                      v-for="seg in donutSegments"
                      :key="seg.label"
                      cx="64" cy="64" r="54"
                      fill="none"
                      :stroke="seg.color"
                      stroke-width="14"
                      stroke-linecap="round"
                      :stroke-dasharray="`${(seg.pct / 100) * DONUT_CIRC} ${DONUT_CIRC}`"
                      :stroke-dashoffset="0"
                      :transform="donutRotation(seg.startPct)"
                    />
                  </svg>
                  <div class="donut-center">
                    <span class="donut-pct">{{ stats.completionPct }}%</span>
                    <span class="donut-label">Overall Progress</span>
                  </div>
                </div>
                <div class="progress-legend">
                  <div v-for="seg in donutSegments" :key="seg.label" class="legend-row">
                    <span class="legend-dot" :style="`background:${seg.color}`" />
                    <span class="legend-name">{{ seg.label }}</span>
                    <span class="legend-count">{{ seg.count }}</span>
                    <span class="legend-pct">({{ seg.pct }}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── RIGHT SIDEBAR ──────────────────────────────────────────────────── -->
        <aside class="right-sidebar">

          <!-- AI Prioritization -->
          <div class="section-card sidebar-panel">
            <div class="card-header">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-sparkles" class="size-4" style="color:var(--color-ai)" />
                <h3 class="card-title">AI Prioritization</h3>
              </div>
              <UIcon name="i-lucide-info" class="size-4" style="color:var(--color-text-muted)" />
            </div>
            <p class="card-subtitle">Based on deadlines, priority and your study patterns.</p>

            <div v-if="aiPriorities.length === 0" class="empty-state">
              <p>No tasks to prioritize.</p>
            </div>
            <div v-else class="ai-list">
              <div v-for="(task, idx) in aiPriorities" :key="task._id" class="ai-row">
                <span class="ai-rank">{{ idx + 1 }}</span>
                <div class="ai-info">
                  <p class="ai-title">{{ task.title }}</p>
                  <div class="ai-meta">
                    <span v-if="task.deadline" class="ai-due">
                      {{ daysUntilLabel(task.deadline) }}
                    </span>
                    <span class="priority-badge" :class="`priority-badge--${task.priority}`">
                      {{ task.priority.charAt(0).toUpperCase() + task.priority.slice(1) }}
                    </span>
                  </div>
                </div>
                <button class="btn-start" @click="quickStatus(task as Task, 'in_progress')">Start</button>
              </div>
            </div>

            <button class="card-footer-link">View all recommendations →</button>
          </div>

          <!-- Today's Agenda -->
          <div class="section-card sidebar-panel">
            <div class="card-header">
              <h3 class="card-title">Today's Agenda</h3>
              <button class="card-link">View all</button>
            </div>

            <div v-if="todayAgenda.length === 0" class="empty-state">
              <UIcon name="i-lucide-calendar-x" class="size-5" style="color:var(--color-text-muted)" />
              <p>No agenda scheduled today.</p>
            </div>
            <div v-else class="agenda-list">
              <div v-for="ev in todayAgenda" :key="ev._id" class="agenda-row">
                <div class="agenda-time">{{ scheduleTimeLabel(ev) }}</div>
                <div class="agenda-dot-col">
                  <span class="agenda-dot" :class="`agenda-dot--${ev.type}`" />
                </div>
                <div class="agenda-info">
                  <p class="agenda-title">{{ ev.title }}</p>
                  <p v-if="scheduleCourseName(ev)" class="agenda-course">{{ scheduleCourseName(ev) }}</p>
                </div>
              </div>
            </div>

            <button class="card-footer-link">
              <UIcon name="i-lucide-external-link" class="size-3.5" />
              Open full agenda
            </button>
          </div>

          <!-- Daily Habits -->
          <div class="section-card sidebar-panel">
            <div class="card-header">
              <h3 class="card-title">Daily Habits</h3>
              <button class="card-link">View all</button>
            </div>
            <div class="habits-list">
              <div v-for="habit in dailyHabits" :key="habit.label" class="habit-row">
                <div class="habit-header">
                  <div class="habit-icon-wrap">
                    <UIcon
                      v-if="habit.done"
                      name="i-lucide-check-circle-2"
                      class="size-4"
                      style="color:var(--color-success)"
                    />
                    <UIcon
                      v-else
                      name="i-lucide-circle"
                      class="size-4"
                      style="color:var(--color-text-muted)"
                    />
                  </div>
                  <span class="habit-label">{{ habit.label }}</span>
                  <span class="habit-count">{{ habit.displayCurrent }} / {{ habit.displayTarget }}</span>
                </div>
                <div class="habit-bar-wrap">
                  <div class="habit-bar" :style="`width:${habit.pct}%;background:${habit.done ? 'var(--color-success)' : 'var(--color-primary)'}`" />
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="section-card sidebar-panel">
            <div class="card-header">
              <h3 class="card-title">Recent Activity</h3>
              <button class="card-link">View all</button>
            </div>

            <div v-if="recentActivity.length === 0" class="empty-state">
              <p>No recent task activity.</p>
            </div>
            <div v-else class="activity-list">
              <div v-for="item in recentActivity" :key="item._id" class="activity-row">
                <UIcon :name="item.icon" class="size-4 flex-shrink-0" :style="`color:${item.iconColor}`" />
                <div class="activity-info">
                  <p class="activity-text">{{ item.text }}</p>
                  <p class="activity-time">{{ item.time }}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </template>

    <!-- ── OVERLAY to close menus ──────────────────────────────────────────── -->
    <div v-if="openMenuId" class="fixed inset-0 z-30" @click="openMenuId = null" />

    <!-- ── ADD/EDIT TASK MODAL ────────────────────────────────────────────── -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-box">
        <div class="modal-header">
          <h2 class="modal-title">{{ modalMode === 'add' ? 'Add New Task' : 'Edit Task' }}</h2>
          <button class="modal-close" @click="closeModal">
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input
              v-model="form.title"
              class="form-input"
              placeholder="Task title"
            >
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea
              v-model="form.description"
              class="form-input form-textarea"
              placeholder="Optional description"
              rows="2"
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Course</label>
              <select v-model="form.courseId" class="form-input">
                <option value="">No course</option>
                <option v-for="c in courses" :key="c._id" :value="c._id">{{ c.title }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select v-model="form.status" class="form-input">
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select v-model="form.priority" class="form-input">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Est. Duration (min)</label>
              <input
                v-model.number="form.estimatedDuration"
                type="number"
                min="0"
                class="form-input"
                placeholder="e.g. 90"
              >
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Deadline</label>
            <input
              v-model="form.deadline"
              type="datetime-local"
              class="form-input"
            >
          </div>
          <p v-if="submitError" class="form-error">{{ submitError }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">Cancel</button>
          <button class="btn-primary" :disabled="isSubmitting" @click="submitForm">
            <UIcon v-if="isSubmitting" name="i-lucide-loader-2" class="size-4 animate-spin" />
            {{ modalMode === 'add' ? 'Add Task' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── DELETE CONFIRM ─────────────────────────────────────────────────── -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal-box modal-box--sm">
        <div class="modal-header">
          <h2 class="modal-title">Delete Task</h2>
          <button class="modal-close" @click="showDeleteConfirm = false">
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>
        <div class="modal-body">
          <p style="color:var(--color-text-soft);font-size:14px">
            Are you sure you want to delete this task? This action cannot be undone.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showDeleteConfirm = false">Cancel</button>
          <button class="btn-danger" :disabled="isSubmitting" @click="executeDelete">
            <UIcon v-if="isSubmitting" name="i-lucide-loader-2" class="size-4 animate-spin" />
            Delete
          </button>
        </div>
      </div>
    </div>

  </section>
</template>

<style scoped>
/* ── Base ─────────────────────────────────────────────────────────────────── */
p, h1, h2, h3, h4, h5, h6 { margin: 0; }

.tasks-page {
  font-family: var(--font-sans);
}

/* ── Page Header ──────────────────────────────────────────────────────────── */
.page-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: end;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.page-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.page-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  width: 16px;
  height: 16px;
  color: var(--color-text-muted);
}

.search-input {
  height: 38px;
  padding: 0 12px 0 34px;
  font-size: 13px;
  width: 260px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  outline: none;
  transition: border-color var(--transition-fast);
}

.search-input:focus {
  border-color: var(--color-primary);
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.icon-btn:hover {
  background: var(--color-bg-soft);
  color: var(--color-text);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: background var(--transition-fast);
  white-space: nowrap;
}

.btn-primary:hover { background: var(--color-primary-hover); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-secondary:hover { background: var(--color-bg-soft); }

.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: var(--color-danger);
  border: none;
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Stats Row ────────────────────────────────────────────────────────────── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}

@media (max-width: 900px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 480px) {
  .stats-row { grid-template-columns: 1fr; }
}

.stat-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
  min-height: 100px;
}

.stat-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-body { flex: 1; min-width: 0; }

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
  margin-bottom: 6px;
}

.stat-sub {
  font-size: 11px;
  font-weight: 500;
}

/* ── Filter Bar ───────────────────────────────────────────────────────────── */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.filter-tab {
  height: 34px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--radius-full);
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.filter-tab:hover {
  background: var(--color-bg-soft);
  color: var(--color-text);
}

.filter-tab--active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-soft);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.filter-btn:hover { background: var(--color-bg-soft); }

.sort-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sort-label {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.sort-select {
  height: 34px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  outline: none;
  cursor: pointer;
}

.view-toggle {
  display: flex;
  align-items: center;
  background: var(--color-bg-soft);
  border-radius: var(--radius-lg);
  padding: 2px;
  gap: 2px;
}

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 30px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.view-btn--active {
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

/* ── Main Grid ────────────────────────────────────────────────────────────── */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 18px;
  align-items: start;
}

@media (max-width: 1100px) {
  .main-grid { grid-template-columns: 1fr; }
}

.main-col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }

/* ── Kanban Board ─────────────────────────────────────────────────────────── */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  min-width: 0;
}

@media (max-width: 1200px) {
  .kanban-board { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 600px) {
  .kanban-board { grid-template-columns: 1fr; }
}

.kanban-col {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  min-height: 420px;
  box-shadow: var(--shadow-card);
}

.kanban-col-accent {
  height: 3px;
  flex-shrink: 0;
}

.kanban-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 8px;
}

.kanban-col-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
}

.kanban-col-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.kanban-cards {
  flex: 1;
  padding: 0 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  max-height: 480px;
  scrollbar-width: none;
}

.kanban-cards::-webkit-scrollbar { display: none; }

.kanban-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 32px 12px;
  color: var(--color-text-muted);
  font-size: 12px;
  text-align: center;
}

/* Task Card */
.task-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 10px;
  transition: box-shadow var(--transition-fast), transform var(--transition-fast);
  position: relative;
}

.task-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.task-card--completed {
  opacity: 0.7;
}

.task-card-top {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 4px;
}

.task-card-icon-wrap {
  flex-shrink: 0;
  margin-top: 1px;
}

.task-card-title {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.4;
  min-width: 0;
  word-break: break-word;
}

.task-card-menu-wrap {
  position: relative;
  flex-shrink: 0;
}

.task-card-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.task-card-menu-btn:hover { background: var(--color-bg-soft); }

.task-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 50;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  min-width: 140px;
  padding: 4px;
  margin-top: 2px;
}

.task-dropdown-item {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  transition: background var(--transition-fast);
}

.task-dropdown-item:hover { background: var(--color-bg-soft); }

.task-dropdown-item--danger { color: var(--color-danger); }
.task-dropdown-item--danger:hover { background: color-mix(in srgb, var(--color-danger) 8%, transparent); }

.task-card-course {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
  padding-left: 22px;
}

.task-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 22px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.task-card-due, .task-card-duration {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 500;
}

.task-card-footer {
  padding-left: 22px;
}

/* Due classes */
.due-overdue { color: var(--color-danger); }
.due-soon { color: var(--color-warning); }
.due-ok { color: var(--color-text-muted); }
.due-neutral { color: var(--color-text-muted); }

/* Priority badges */
.priority-badge {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  border: 1px solid transparent;
  white-space: nowrap;
}

.priority-badge--high {
  background: color-mix(in srgb, var(--color-danger) 10%, transparent);
  color: var(--color-danger);
  border-color: color-mix(in srgb, var(--color-danger) 20%, transparent);
}

.priority-badge--medium {
  background: color-mix(in srgb, var(--color-warning) 12%, transparent);
  color: var(--color-warning);
  border-color: color-mix(in srgb, var(--color-warning) 25%, transparent);
}

.priority-badge--low {
  background: color-mix(in srgb, var(--color-success) 10%, transparent);
  color: var(--color-success);
  border-color: color-mix(in srgb, var(--color-success) 20%, transparent);
}

/* Add task button */
.kanban-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: calc(100% - 16px);
  margin: 8px;
  height: 34px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.kanban-add-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 4%, transparent);
}

/* ── List view ────────────────────────────────────────────────────────────── */
.list-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 12px;
  box-shadow: var(--shadow-card);
}

.list-task-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  transition: box-shadow var(--transition-fast);
}

.list-task-row:hover { box-shadow: var(--shadow-sm); }

.list-task-left { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }

.list-task-title { font-size: 13px; font-weight: 600; color: var(--color-text); }
.list-task-course { font-size: 11px; color: var(--color-text-muted); }

.list-task-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }

.list-task-due {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.icon-btn-sm {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.icon-btn-sm:hover { background: var(--color-bg-soft); color: var(--color-text); }
.icon-btn-sm--danger:hover { color: var(--color-danger); border-color: var(--color-danger); }

/* ── Bottom Row ───────────────────────────────────────────────────────────── */
.bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 800px) {
  .bottom-row { grid-template-columns: 1fr; }
}

/* ── Section Card ─────────────────────────────────────────────────────────── */
.section-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 16px;
  box-shadow: var(--shadow-card);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
}

.card-link {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  background: none;
  border: none;
  cursor: pointer;
  transition: opacity var(--transition-fast);
  white-space: nowrap;
}

.card-link:hover { opacity: 0.7; }

.card-subtitle {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 12px;
}

.card-footer-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  background: none;
  border: none;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.card-footer-link:hover { opacity: 0.7; }

/* ── Empty State ──────────────────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px 12px;
  color: var(--color-text-muted);
  font-size: 12px;
  text-align: center;
}

/* ── Deadline Card ────────────────────────────────────────────────────────── */
.deadline-list { display: flex; flex-direction: column; gap: 0; }

.deadline-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
}

.deadline-row:last-child { border-bottom: none; }

.deadline-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-bg-soft);
  flex-shrink: 0;
}

.deadline-day {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
}

.deadline-month {
  font-size: 9px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.deadline-info { flex: 1; min-width: 0; }
.deadline-title { font-size: 13px; font-weight: 600; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.deadline-course { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }

.deadline-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.deadline-dur {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.due-chip {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.due-chip.due-overdue { background: color-mix(in srgb, var(--color-danger) 10%, transparent); color: var(--color-danger); }
.due-chip.due-soon { background: color-mix(in srgb, var(--color-warning) 12%, transparent); color: var(--color-warning); }
.due-chip.due-ok { background: color-mix(in srgb, var(--color-success) 10%, transparent); color: var(--color-success); }
.due-chip.due-neutral { background: var(--color-bg-soft); color: var(--color-text-muted); }

/* ── Progress Card ────────────────────────────────────────────────────────── */
.progress-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.donut-wrap {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.donut-svg { transform: rotate(-90deg); }

.donut-center {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  top: 0; left: 0; right: 0; bottom: 0;
}

.donut-pct {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text);
  line-height: 1;
}

.donut-label {
  font-size: 9px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-align: center;
  line-height: 1.2;
  margin-top: 3px;
}

.progress-legend { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 0; }

.legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-name { flex: 1; color: var(--color-text-soft); font-weight: 500; }
.legend-count { font-weight: 700; color: var(--color-text); }
.legend-pct { color: var(--color-text-muted); }

/* ── Right Sidebar ────────────────────────────────────────────────────────── */
.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sidebar-panel { }

/* ── AI List ──────────────────────────────────────────────────────────────── */
.ai-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 4px; }

.ai-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-bg-soft);
}

.ai-rank {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-info { flex: 1; min-width: 0; }

.ai-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ai-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
  flex-wrap: wrap;
}

.ai-due {
  font-size: 10px;
  color: var(--color-text-muted);
}

.btn-start {
  height: 26px;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-start:hover {
  background: var(--color-primary);
  color: #fff;
}

/* ── Agenda ───────────────────────────────────────────────────────────────── */
.agenda-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 4px; }

.agenda-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.agenda-time {
  font-size: 10px;
  font-weight: 700;
  color: var(--color-text-muted);
  min-width: 60px;
  padding-top: 2px;
  white-space: nowrap;
}

.agenda-dot-col { display: flex; align-items: flex-start; padding-top: 4px; }

.agenda-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.agenda-dot--course { background: #3b82f6; }
.agenda-dot--td, .agenda-dot--tp { background: #10b981; }
.agenda-dot--exam { background: #a855f7; }
.agenda-dot--study_session { background: #4f46e5; }
.agenda-dot--task { background: #f59e0b; }
.agenda-dot--break { background: #94a3b8; }
.agenda-dot--personal { background: #ec4899; }
.agenda-dot--other { background: #94a3b8; }

.agenda-info { flex: 1; min-width: 0; }
.agenda-title { font-size: 12px; font-weight: 600; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.agenda-course { font-size: 10px; color: var(--color-text-muted); margin-top: 1px; }

/* ── Habits ───────────────────────────────────────────────────────────────── */
.habits-list { display: flex; flex-direction: column; gap: 12px; }

.habit-row { }

.habit-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.habit-icon-wrap { flex-shrink: 0; }

.habit-label { flex: 1; font-size: 12px; font-weight: 500; color: var(--color-text); }

.habit-count { font-size: 11px; font-weight: 700; color: var(--color-text-muted); white-space: nowrap; }

.habit-bar-wrap {
  height: 4px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-left: 28px;
}

.habit-bar {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--transition-normal) var(--ease-smooth);
}

/* ── Activity ─────────────────────────────────────────────────────────────── */
.activity-list { display: flex; flex-direction: column; gap: 10px; }

.activity-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.activity-info { flex: 1; min-width: 0; }

.activity-text {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-time {
  font-size: 10px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

/* ── Modal ────────────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-box {
  width: 100%;
  max-width: 520px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-box--sm { max-width: 380px; }

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text);
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-lg);
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.modal-close:hover { background: var(--color-bg-soft); }

.modal-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
}

.form-group { display: flex; flex-direction: column; gap: 5px; }

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-soft);
}

.form-input {
  height: 40px;
  padding: 0 12px;
  font-size: 13px;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  outline: none;
  width: 100%;
  transition: border-color var(--transition-fast);
}

.form-input:focus { border-color: var(--color-primary); }

.form-textarea {
  height: auto;
  padding: 10px 12px;
  resize: vertical;
  min-height: 64px;
}

.form-error {
  font-size: 12px;
  color: var(--color-danger);
  font-weight: 500;
}

/* ── Error State ──────────────────────────────────────────────────────────── */
.error-state-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 300px;
  padding: 40px 24px;
  text-align: center;
}

.error-state-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
}

.error-state-msg {
  font-size: 13px;
  color: var(--color-text-muted);
  max-width: 480px;
  line-height: 1.6;
}

.error-state-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>

