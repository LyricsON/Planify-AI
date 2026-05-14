<script setup lang="ts">
import BoardColumn from '~/components/tasks/BoardColumn.vue'
definePageMeta({ layout: 'dashboard' })

const { get, post, put } = useApi()
const route = useRoute()
const router = useRouter()

type TaskStatus = 'todo' | 'in_progress' | 'completed'
type Priority = 'low' | 'medium' | 'high'

const tasks = ref<any[]>([])
const exams = ref<any[]>([])
const courses = ref<any[]>([])
const isLoading = ref(true)

const activeTab = ref<'overview' | 'exams' | 'tasks'>('overview')
const taskFilter = ref<'all' | TaskStatus>('all')
const showAddTask = ref(false)
const newTask = ref({ title: '', priority: 'medium', deadline: '', courseId: '', description: '' })

const selectedCourse = ref('all')
const selectedType = ref<'all' | Priority>('all')
const sortBy = ref<'due' | 'priority'>('due')

const fallbackCourses = [
  { _id: 'course-cs-201', title: 'CS 201' },
  { _id: 'course-math-101', title: 'Math 101' },
  { _id: 'course-physics-101', title: 'Physics 101' },
  { _id: 'course-db', title: 'Database Systems' }
]

function inDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

const fallbackTasks = [
  { _id: 't-1', title: 'Revise Thermodynamics', priority: 'high', status: 'todo', deadline: inDays(0), courseId: 'course-physics-101' },
  { _id: 't-2', title: 'Solve Dynamic Programming Problems', priority: 'high', status: 'todo', deadline: inDays(1), courseId: 'course-cs-201' },
  { _id: 't-3', title: 'Practice Integrals', priority: 'medium', status: 'todo', deadline: inDays(2), courseId: 'course-math-101' },
  { _id: 't-4', title: 'Read Chapter 5: Normalization', priority: 'low', status: 'todo', deadline: inDays(3), courseId: 'course-db' },
  { _id: 't-5', title: 'Data Structures Lab Report', priority: 'medium', status: 'in_progress', deadline: inDays(3), courseId: 'course-cs-201' },
  { _id: 't-6', title: 'Limits and Continuity Notes', priority: 'medium', status: 'in_progress', deadline: inDays(4), courseId: 'course-math-101' },
  { _id: 't-7', title: 'Algorithm Analysis Summary', priority: 'low', status: 'in_progress', deadline: inDays(6), courseId: 'course-cs-201' },
  { _id: 't-8', title: 'SQL Joins Worksheet', priority: 'low', status: 'completed', deadline: inDays(-1), courseId: 'course-db', updatedAt: inDays(-1) },
  { _id: 't-9', title: 'Vectors and Matrices Quiz Prep', priority: 'medium', status: 'completed', deadline: inDays(-2), courseId: 'course-math-101', updatedAt: inDays(-2) },
  { _id: 't-10', title: 'Newton Laws Summary', priority: 'high', status: 'completed', deadline: inDays(-3), courseId: 'course-physics-101', updatedAt: inDays(-3) }
]

const fallbackExams = [
  { _id: 'e-1', title: 'Physics TD', examDate: inDays(2), courseId: 'course-physics-101' },
  { _id: 'e-2', title: 'Data Structures', examDate: inDays(4), courseId: 'course-cs-201' },
  { _id: 'e-3', title: 'Calculus Exam', examDate: inDays(7), courseId: 'course-math-101' },
  { _id: 'e-4', title: 'Database Systems', examDate: inDays(9), courseId: 'course-db' },
  { _id: 'e-5', title: 'Linear Algebra', examDate: inDays(14), courseId: 'course-math-101' }
]

const mapCourse = computed(() => {
  const m = new Map<string, string>()
  courses.value.forEach(c => m.set(c._id, c.title))
  return m
})

const allTasks = computed(() => tasks.value.map(t => ({ ...t, courseTitle: courseTitleOf(t.courseId) })))
const allExams = computed(() => exams.value.map(e => ({ ...e, courseTitle: courseTitleOf(e.courseId) })))

const filteredTasks = computed(() => {
  const base = allTasks.value.filter(t => taskFilter.value === 'all' || t.status === taskFilter.value)
  return applyGlobalFilters(base).sort(taskSorter)
})

const upcomingExams = computed(() => allExams.value
  .filter(e => new Date(e.examDate).getTime() >= Date.now())
  .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime()))

const filteredUpcomingExams = computed(() => applyGlobalFilters(upcomingExams.value))
const topUpcomingExams = computed(() => filteredUpcomingExams.value.slice(0, 5))
const overdueTasks = computed(() => allTasks.value.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed'))

const stats = computed(() => ({
  total: allTasks.value.length,
  completed: allTasks.value.filter(t => t.status === 'completed').length,
  inProgress: allTasks.value.filter(t => t.status === 'in_progress').length,
  overdue: overdueTasks.value.length
}))

const boardColumns = computed(() => {
  const list = applyGlobalFilters(allTasks.value)
  return {
    high: list.filter(t => t.status !== 'completed' && t.priority === 'high').sort(taskSorter),
    progress: list.filter(t => t.status === 'in_progress').sort(taskSorter),
    completed: list.filter(t => t.status === 'completed').sort((a, b) => new Date(b.updatedAt || b.deadline || 0).getTime() - new Date(a.updatedAt || a.deadline || 0).getTime())
  }
})

const totalTrackable = computed(() => stats.value.total || 1)
const completionPct = computed(() => Math.round((stats.value.completed / totalTrackable.value) * 100))

const tasksByCourse = computed(() => {
  const grouped = new Map<string, number>()
  allTasks.value.forEach((t) => {
    const key = t.courseTitle || 'General'
    grouped.set(key, (grouped.get(key) || 0) + 1)
  })
  return [...grouped.entries()].map(([name, count]) => ({ name, count, pct: Math.round((count / (stats.value.total || 1)) * 100) }))
})

const activityFeed = computed(() => {
  const taskEvents = allTasks.value.slice(0, 12).map(t => ({
    id: `task-${t._id}`,
    title: t.status === 'completed' ? `Completed "${t.title}"` : `Updated task "${t.title}"`,
    subtitle: `${t.courseTitle || 'General'} • ${formatShortDate(t.updatedAt || t.createdAt || t.deadline)}`,
    time: new Date(t.updatedAt || t.createdAt || t.deadline || 0).getTime()
  }))
  const examEvents = allExams.value.slice(0, 6).map(e => ({
    id: `exam-${e._id}`,
    title: `Exam scheduled: "${e.title}"`,
    subtitle: `${e.courseTitle || 'Course'} • ${formatShortDate(e.examDate)}`,
    time: new Date(e.examDate).getTime()
  }))
  return [...taskEvents, ...examEvents].sort((a, b) => b.time - a.time).slice(0, 4)
})

const checklist = computed(() => ([
  { key: 'formula', label: 'Review formula sheet', done: stats.value.completed >= 2 },
  { key: 'flashcards', label: 'Flashcards - Physics', done: stats.value.completed >= 3 },
  { key: 'past', label: 'Solve 10 past questions', done: stats.value.inProgress >= 2 },
  { key: 'notes', label: 'Read lecture notes', done: stats.value.overdue === 0 && stats.value.total > 0 },
  { key: 'summary', label: 'Summarize key concepts', done: stats.value.completed >= 6 }
]))

const checklistDone = computed(() => checklist.value.filter(i => i.done).length)

const aiPriorities = computed(() => {
  const ranked = applyGlobalFilters(allTasks.value)
    .filter(t => t.status !== 'completed')
    .sort((a, b) => {
      const pa = priorityWeight(b.priority) - priorityWeight(a.priority)
      if (pa !== 0) return pa
      return new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime()
    })
    .slice(0, 5)

  return ranked.map((t, idx) => ({
    index: idx + 1,
    title: t.title,
    course: t.courseTitle,
    impact: t.priority === 'high' ? 'High Impact' : t.priority === 'medium' ? 'Medium Impact' : 'Low Impact',
    impactTone: t.priority === 'high' ? 'text-red-500' : t.priority === 'medium' ? 'text-amber-500' : 'text-emerald-500'
  }))
})

function applyGlobalFilters<T extends { courseId?: any, priority?: any }>(rows: T[]) {
  return rows.filter((row) => {
    const c = selectedCourse.value === 'all' || normalizeCourseId(row.courseId) === selectedCourse.value
    const p = selectedType.value === 'all' || row.priority === selectedType.value
    return c && p
  })
}

function taskSorter(a: any, b: any) {
  if (sortBy.value === 'priority') return priorityWeight(b.priority) - priorityWeight(a.priority)
  return new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime()
}

function priorityWeight(p: Priority) {
  if (p === 'high') return 3
  if (p === 'medium') return 2
  return 1
}

function normalizeCourseId(course: any) {
  if (!course) return ''
  if (typeof course === 'string') return course
  return course._id || ''
}

function courseTitleOf(course: any) {
  if (!course) return 'General'
  if (typeof course === 'object' && course.title) return course.title
  return mapCourse.value.get(course) || 'General'
}

function daysUntil(dateIso: string) {
  const diff = Math.ceil((new Date(dateIso).getTime() - Date.now()) / 86400000)
  if (diff <= 0) return diff === 0 ? 'Due today' : `Overdue ${Math.abs(diff)}d`
  if (diff === 1) return 'Due tomorrow'
  return `In ${diff} days`
}

function shortCourse(title: string) {
  return title.length <= 14 ? title : `${title.slice(0, 14)}...`
}

function formatShortDate(v?: string) {
  if (!v) return '-'
  return new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function examAccent(i: number) {
  const accents = ['#14b86a', '#ff3b3b', '#5a5cff', '#5a5cff', '#f59e0b']
  return accents[i % accents.length]
}

function examTime(i: number) {
  const times = ['14:00', '10:00', '09:00', '13:00', '11:00']
  return times[i % times.length]
}

function examChipClass(i: number) {
  const chips = [
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  ]
  return chips[i % chips.length]
}

function tabClass(tab: string) {
  return activeTab.value === tab
    ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
}

function setTab(tab: 'overview' | 'exams' | 'tasks') {
  router.replace({ query: { ...route.query, tab } })
}

function toneBadge(priority: Priority) {
  if (priority === 'high') return 'bg-red-50 text-red-500 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800'
  if (priority === 'medium') return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800'
  return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
}

function syncTabFromQuery() {
  const q = String(route.query.tab || '')
  if (q === 'tasks' || q === 'exams' || q === 'overview') activeTab.value = q
}

const isUnifiedExamsTasksMode = computed(() => {
  const q = String(route.query.tab || '')
  return q === 'overview' || q === 'exams' || q === 'tasks'
})

async function load() {
  isLoading.value = true
  const [tR, eR, cR] = await Promise.all([get<any>('/tasks'), get<any>('/exams'), get<any>('/courses')])
  const incomingTasks = tR.success ? (Array.isArray(tR.data) ? tR.data : tR.data?.data || []) : []
  const incomingExams = eR.success ? (Array.isArray(eR.data) ? eR.data : eR.data?.data || []) : []
  const incomingCourses = cR.success ? (Array.isArray(cR.data) ? cR.data : cR.data?.data || []) : []

  courses.value = incomingCourses.length ? incomingCourses : fallbackCourses
  tasks.value = incomingTasks.length ? incomingTasks : fallbackTasks
  exams.value = incomingExams.length ? incomingExams : fallbackExams
  isLoading.value = false
}

async function toggleTask(task: any) {
  const newStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed'
  if (!String(task._id).startsWith('t-')) await put(`/tasks/${task._id}`, { status: newStatus })
  task.status = newStatus
  task.updatedAt = new Date().toISOString()
}

async function addTask() {
  if (!newTask.value.title.trim()) return

  const payload = { ...newTask.value }
  if (tasks.value.some(t => String(t._id).startsWith('t-'))) {
    tasks.value.unshift({
      _id: `t-${Math.random().toString(36).slice(2, 9)}`,
      title: payload.title,
      priority: payload.priority,
      deadline: payload.deadline || undefined,
      status: 'todo',
      courseId: payload.courseId || undefined,
      description: payload.description,
      createdAt: new Date().toISOString()
    })
  } else {
    await post('/tasks', payload)
    await load()
  }

  showAddTask.value = false
  newTask.value = { title: '', priority: 'medium', deadline: '', courseId: '', description: '' }
}

onMounted(() => {
  syncTabFromQuery()
  load()
})

watch(() => route.query.tab, () => {
  syncTabFromQuery()
})
</script>

<template>
  <section class="max-w-[1420px] mx-auto pb-8">
    <template v-if="!isUnifiedExamsTasksMode">
      <div class="rounded-2xl border p-8 text-center" style="border-color:var(--color-border);background:var(--color-surface)">
        <h3 class="text-[20px] font-semibold" style="color:var(--color-text)">Tasks</h3>
        <p class="text-[13px] mt-2" style="color:var(--color-text-soft)">This standalone Tasks page is currently empty.</p>
      </div>
    </template>

    <template v-else>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div class="flex items-center gap-5 border-b border-[var(--color-border)] w-full md:w-auto">
        <button :class="['pb-2 text-[13px] font-semibold transition', tabClass('overview')]" @click="setTab('overview')">Overview</button>
        <button :class="['pb-2 text-[13px] font-semibold transition', tabClass('exams')]" @click="setTab('exams')">Exams</button>
        <button :class="['pb-2 text-[13px] font-semibold transition', tabClass('tasks')]" @click="setTab('tasks')">Tasks</button>
      </div>

      <div class="flex flex-wrap gap-2">
        <select v-model="selectedCourse" class="h-9 px-3 rounded-xl text-[12px] border" style="border-color:var(--color-border);background:var(--color-surface)">
          <option value="all">All Courses</option>
          <option v-for="c in courses" :key="c._id" :value="c._id">{{ c.title }}</option>
        </select>
        <select v-model="selectedType" class="h-9 px-3 rounded-xl text-[12px] border" style="border-color:var(--color-border);background:var(--color-surface)">
          <option value="all">All Types</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
        <select v-model="sortBy" class="h-9 px-3 rounded-xl text-[12px] border" style="border-color:var(--color-border);background:var(--color-surface)">
          <option value="due">Sort by: Due Date</option>
          <option value="priority">Sort by: Priority</option>
        </select>
        <button class="h-9 px-4 rounded-xl text-[12px] font-semibold text-white" style="background:var(--color-primary)" @click="showAddTask = true">Add task</button>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-24">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" style="color:var(--color-primary)" />
    </div>

    <template v-else-if="activeTab === 'overview'">
      <div class="grid grid-cols-1 2xl:grid-cols-[1fr_330px] gap-5">
        <div class="space-y-4">
          <div class="rounded-2xl border p-4" style="border-color:var(--color-border);background:var(--color-surface);box-shadow:var(--shadow-card)">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-[18px] font-semibold" style="color:var(--color-text)">Upcoming Exams</h3>
              <NuxtLink to="/dashboard/schedule" class="text-[13px] font-semibold" style="color:var(--color-primary)">View calendar</NuxtLink>
            </div>
            <div class="relative px-4 pt-7 pb-1">
              <div class="absolute left-4 right-4 top-8 h-[2px] rounded-full" style="background:#cfd5f3"></div>
              <div class="grid grid-cols-5 gap-3">
                <div v-for="(e, i) in topUpcomingExams" :key="e._id" class="relative">
                  <div class="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-semibold whitespace-nowrap" :style="`color:${examAccent(i)}`">
                    {{ daysUntil(e.examDate).replace('Due', 'In') }}
                  </div>
                  <div class="absolute top-[-1px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" :style="`background:${examAccent(i)}`"></div>
                  <div class="absolute top-[-4px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 bg-white" :style="`border-color:${examAccent(i)}`"></div>
                  <div
                    v-if="i < topUpcomingExams.length - 1"
                    class="absolute top-[0px] left-[calc(100%+6px)] w-1.5 h-1.5 rounded-full"
                    style="background:#5a5cff"
                  />
                </div>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-2">
              <div v-for="(e, i) in topUpcomingExams" :key="`card-${e._id}`" class="w-full rounded-xl p-1.5">
                <div class="flex items-start gap-2">
                  <div class="w-[48px] h-[48px] rounded-[9px] border text-center flex flex-col items-center justify-center bg-white/70 dark:bg-transparent shrink-0" style="border-color:#d9dff2">
                    <p class="w-full text-center text-[16px] leading-none font-semibold [font-variant-numeric:tabular-nums]" style="color:#1d2a53">{{ new Date(e.examDate).getDate() }}</p>
                    <p class="text-[10px] leading-none font-bold uppercase mt-2" style="color:#334f70">{{ new Date(e.examDate).toLocaleDateString('en-GB', { month: 'short' }) }}</p>
                  </div>
                  <div class="min-w-0">
                    <p class="text-[13px] font-semibold truncate" style="color:#1d2a53">{{ e.title }}</p>
                    <p class="text-[12px] mt-0.5" style="color:#617392">{{ examTime(i) }}</p>
                    <span class="inline-block w-[108px] mt-1 text-[10px] px-2 py-0.5 rounded-md truncate" :class="examChipClass(i)">{{ shortCourse(e.courseTitle) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="!topUpcomingExams.length" class="text-[12px] py-4 text-center" style="color:var(--color-text-soft)">
              No upcoming exams.
            </div>
          </div>

          <div class="rounded-2xl border p-4" style="border-color:var(--color-border);background:var(--color-surface);box-shadow:var(--shadow-card)">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 class="text-[18px] font-semibold" style="color:var(--color-text)">Task Board</h3>
              <div class="flex items-center gap-3">
                <p class="text-[13px]" style="color:var(--color-text-soft)">{{ stats.total }} tasks total</p>
                <div class="w-40 h-2 rounded-full" style="background:var(--color-border)">
                  <div class="h-2 rounded-full" :style="`background:var(--color-primary);width:${completionPct}%`"></div>
                </div>
                <p class="text-[13px] font-semibold" style="color:var(--color-text)">{{ completionPct }}%</p>
              </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-3">
              <BoardColumn title="High Priority" tone="high" :items="boardColumns.high" @toggle="toggleTask">
                <template #meta="{ task }">
                  <div class="mt-1 flex items-center justify-between">
                    <span class="text-[11px] px-2 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">{{ shortCourse(task.courseTitle) }}</span>
                    <span class="text-[12px] text-red-500">{{ daysUntil(task.deadline) }}</span>
                  </div>
                </template>
              </BoardColumn>
              <BoardColumn title="In Progress" tone="progress" :items="boardColumns.progress">
                <template #meta="{ task }">
                  <div class="mt-1 flex items-center justify-between">
                    <span class="text-[11px] px-2 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">{{ shortCourse(task.courseTitle) }}</span>
                    <span class="text-[12px] text-amber-500">{{ daysUntil(task.deadline) }}</span>
                  </div>
                </template>
              </BoardColumn>
              <BoardColumn title="Completed" tone="completed" :items="boardColumns.completed">
                <template #meta="{ task }">
                  <div class="mt-1 flex items-center justify-between">
                    <span class="text-[11px] px-2 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">{{ shortCourse(task.courseTitle) }}</span>
                    <span class="text-[12px]" style="color:var(--color-text-soft)">{{ formatShortDate(task.updatedAt || task.deadline) }}</span>
                  </div>
                </template>
              </BoardColumn>
            </div>
          </div>

          <div class="grid grid-cols-1 xl:grid-cols-3 gap-3">
            <div class="rounded-2xl border p-4" style="border-color:var(--color-border);background:var(--color-surface)">
              <h4 class="text-[18px] font-semibold mb-3" style="color:var(--color-text)">Task Overview</h4>
              <div class="grid grid-cols-2 gap-2.5">
                <div class="rounded-xl border p-3" style="border-color:var(--color-border)"><p class="text-[24px] font-semibold">{{ stats.total }}</p><p class="text-[12px]" style="color:var(--color-text-soft)">Total Tasks</p></div>
                <div class="rounded-xl border p-3" style="border-color:var(--color-border)"><p class="text-[24px] font-semibold text-emerald-600">{{ stats.completed }}</p><p class="text-[12px]" style="color:var(--color-text-soft)">Completed</p></div>
                <div class="rounded-xl border p-3" style="border-color:var(--color-border)"><p class="text-[24px] font-semibold text-amber-500">{{ stats.inProgress }}</p><p class="text-[12px]" style="color:var(--color-text-soft)">In Progress</p></div>
                <div class="rounded-xl border p-3" style="border-color:var(--color-border)"><p class="text-[24px] font-semibold text-red-500">{{ stats.overdue }}</p><p class="text-[12px]" style="color:var(--color-text-soft)">Overdue</p></div>
              </div>
            </div>

            <div class="rounded-2xl border p-4" style="border-color:var(--color-border);background:var(--color-surface)">
              <h4 class="text-[18px] font-semibold mb-3" style="color:var(--color-text)">Tasks by Course</h4>
              <div class="space-y-3">
                <div v-for="row in tasksByCourse" :key="row.name">
                  <div class="flex justify-between text-[12px] mb-1"><span>{{ row.name }}</span><span>{{ row.count }} ({{ row.pct }}%)</span></div>
                  <div class="h-2 rounded-full" style="background:var(--color-border)"><div class="h-2 rounded-full" :style="`background:var(--color-primary);width:${row.pct}%`"></div></div>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border p-4" style="border-color:var(--color-border);background:var(--color-surface)">
              <h4 class="text-[18px] font-semibold mb-3" style="color:var(--color-text)">Recent Activity</h4>
              <div class="space-y-3">
                <div v-for="a in activityFeed" :key="a.id" class="rounded-xl border p-3" style="border-color:var(--color-border)">
                  <p class="text-[12px] font-medium">{{ a.title }}</p>
                  <p class="text-[11px]" style="color:var(--color-text-soft)">{{ a.subtitle }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside class="space-y-3">
          <div class="rounded-2xl p-4 text-white" style="background:linear-gradient(160deg,#3730a3,#4f46e5 45%,#4338ca)">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-[18px] font-semibold">AI Prioritization</h4>
              <span class="text-[10px] px-2 py-0.5 rounded bg-white/20">BETA</span>
            </div>
            <p class="text-[12px] text-white/90 mb-3">Based on your exams, deadlines and performance, here's what to focus on first.</p>
            <div class="space-y-2 mb-3">
              <div v-for="p in aiPriorities" :key="p.index" class="rounded-xl bg-white text-[var(--color-text)] px-3 py-2">
                <div class="flex items-start gap-2">
                  <span class="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 text-[12px] font-semibold flex items-center justify-center">{{ p.index }}</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-[12px] font-semibold truncate">{{ p.title }}</p>
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-700">{{ shortCourse(p.course) }}</span>
                      <span class="text-[10px] font-semibold" :class="p.impactTone">{{ p.impact }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button class="w-full h-9 rounded-lg bg-white/20 text-[12px] font-semibold">Generate new priorities</button>
          </div>

          <div class="rounded-2xl border p-4" style="border-color:var(--color-border);background:var(--color-surface)">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-[18px] font-semibold" style="color:var(--color-text)">Study Checklist</h4>
              <button class="text-[12px]" style="color:var(--color-primary)">Edit</button>
            </div>
            <div class="flex items-center gap-3 mb-3">
              <div class="relative size-16 rounded-full grid place-items-center border-4" style="border-color:var(--color-border)">
                <div class="absolute inset-0 rounded-full border-4 border-transparent" :style="`border-top-color:var(--color-primary);transform:rotate(${(checklistDone / checklist.length) * 360}deg)`"></div>
                <span class="text-[12px] font-semibold">{{ checklistDone }}/{{ checklist.length }}</span>
              </div>
              <p class="text-[13px]" style="color:var(--color-text-soft)">Tasks done</p>
            </div>
            <div class="space-y-2">
              <label v-for="c in checklist" :key="c.key" class="flex items-center gap-2 text-[13px]">
                <input type="checkbox" :checked="c.done" class="size-4 rounded" />
                <span :style="c.done ? 'color:var(--color-text)' : 'color:var(--color-text-soft)'">{{ c.label }}</span>
              </label>
            </div>
          </div>
        </aside>
      </div>
    </template>

    <template v-else-if="activeTab === 'exams'">
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div v-for="e in filteredUpcomingExams" :key="e._id" class="rounded-2xl border p-4" style="border-color:var(--color-border);background:var(--color-surface)">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[12px] px-2 py-1 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">{{ daysUntil(e.examDate) }}</span>
            <span class="text-[12px]" style="color:var(--color-text-soft)">{{ formatShortDate(e.examDate) }}</span>
          </div>
          <h3 class="text-[16px] font-semibold" style="color:var(--color-text)">{{ e.title }}</h3>
          <p class="text-[13px]" style="color:var(--color-text-soft)">{{ e.courseTitle }}</p>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="flex items-center gap-2 mb-4">
        <button v-for="f in ['all', 'todo', 'in_progress', 'completed']" :key="f" class="h-9 px-3 rounded-lg text-[12px] font-semibold capitalize border" :style="taskFilter === f ? 'background:var(--color-primary);color:#fff;border-color:var(--color-primary)' : 'border-color:var(--color-border);color:var(--color-text)'" @click="taskFilter = f as any">{{ f.replace('_', ' ') }}</button>
      </div>
      <div class="space-y-3">
        <div v-for="t in filteredTasks" :key="t._id" class="rounded-xl border p-4" style="border-color:var(--color-border);background:var(--color-surface)">
          <div class="flex items-center gap-3">
            <button class="size-5 rounded-full border flex items-center justify-center" :style="t.status === 'completed' ? 'background:var(--color-success);color:#fff;border-color:var(--color-success)' : 'border-color:var(--color-border)'" @click="toggleTask(t)">
              <UIcon v-if="t.status === 'completed'" name="i-lucide-check" class="size-3" />
            </button>
            <div class="flex-1 min-w-0">
              <p class="text-[14px] font-semibold truncate" :style="t.status === 'completed' ? 'text-decoration:line-through;color:var(--color-text-muted)' : 'color:var(--color-text)'">{{ t.title }}</p>
              <p class="text-[12px]" style="color:var(--color-text-soft)">{{ t.courseTitle }} • {{ t.deadline ? formatShortDate(t.deadline) : 'No due date' }}</p>
            </div>
            <span class="text-[11px] px-2 py-0.5 rounded border capitalize" :class="toneBadge(t.priority)">{{ t.priority }}</span>
          </div>
        </div>
      </div>
    </template>

    <div v-if="showAddTask" class="fixed inset-0 z-50 bg-black/45 grid place-items-center p-4">
      <div class="w-full max-w-md rounded-2xl border p-5" style="border-color:var(--color-border);background:var(--color-surface)">
        <h3 class="text-[20px] font-semibold mb-4">Add New Task</h3>
        <div class="space-y-3">
          <input v-model="newTask.title" placeholder="Task title" class="w-full h-10 px-3 rounded-lg border" style="border-color:var(--color-border);background:var(--color-surface)">
          <select v-model="newTask.priority" class="w-full h-10 px-3 rounded-lg border" style="border-color:var(--color-border);background:var(--color-surface)">
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <input v-model="newTask.deadline" type="date" class="w-full h-10 px-3 rounded-lg border" style="border-color:var(--color-border);background:var(--color-surface)">
          <select v-model="newTask.courseId" class="w-full h-10 px-3 rounded-lg border" style="border-color:var(--color-border);background:var(--color-surface)">
            <option value="">No course</option>
            <option v-for="c in courses" :key="c._id" :value="c._id">{{ c.title }}</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3 mt-5">
          <button class="h-10 rounded-lg border" style="border-color:var(--color-border)" @click="showAddTask = false">Cancel</button>
          <button class="h-10 rounded-lg text-white font-semibold" style="background:var(--color-primary)" @click="addTask">Add Task</button>
        </div>
      </div>
    </div>
    </template>
  </section>
</template>

<style scoped>
p,
h1,
h2,
h3,
h4,
h5,
h6 {
  margin-top: 0;
  margin-bottom: 0;
}
</style>
