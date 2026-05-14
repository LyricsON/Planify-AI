<script setup lang="ts">
import BoardColumn from '~/components/tasks/BoardColumn.vue'
definePageMeta({ layout: 'dashboard' })

const { get } = useApi()
const route = useRoute()
const router = useRouter()

const exams = ref<any[]>([])
const tasks = ref<any[]>([])
const courses = ref<any[]>([])
const isLoading = ref(true)
const activeTab = ref<'overview' | 'exams' | 'tasks'>('overview')
const taskFilter = ref<'all' | 'todo' | 'in_progress' | 'completed'>('all')

const selectedCourse = ref('all')
const selectedType = ref('all')
const sortBy = ref<'due' | 'title'>('due')
const selectedRange = ref('12may-18may')

function inDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

const fallbackCourses = [
  { _id: 'course-cs-201', title: 'CS 201' },
  { _id: 'course-math-101', title: 'Math 101' },
  { _id: 'course-physics-101', title: 'Physics 101' },
  { _id: 'course-db', title: 'Database Systems' }
]

const fallbackExams = [
  { _id: 'e-1', title: 'Physics TD', examDate: inDays(2), courseId: 'course-physics-101' },
  { _id: 'e-2', title: 'Data Structures', examDate: inDays(4), courseId: 'course-cs-201' },
  { _id: 'e-3', title: 'Calculus Exam', examDate: inDays(7), courseId: 'course-math-101' },
  { _id: 'e-4', title: 'Database Systems', examDate: inDays(9), courseId: 'course-db' },
  { _id: 'e-5', title: 'Linear Algebra', examDate: inDays(14), courseId: 'course-math-101' }
]

const fallbackTasks = [
  { _id: 't-1', title: 'Revise Thermodynamics', priority: 'high', status: 'todo', deadline: inDays(0), courseId: 'course-physics-101' },
  { _id: 't-2', title: 'Solve Dynamic Programming Problems', priority: 'high', status: 'todo', deadline: inDays(1), courseId: 'course-cs-201' },
  { _id: 't-3', title: 'Practice Integrals', priority: 'medium', status: 'todo', deadline: inDays(2), courseId: 'course-math-101' },
  { _id: 't-4', title: 'Read Chapter 5: Normalization', priority: 'low', status: 'todo', deadline: inDays(3), courseId: 'course-db' },
  { _id: 't-5', title: 'Data Structures Lab Report', priority: 'medium', status: 'in_progress', deadline: inDays(3), courseId: 'course-cs-201' },
  { _id: 't-6', title: 'Limits and Continuity Notes', priority: 'medium', status: 'in_progress', deadline: inDays(4), courseId: 'course-math-101' }
]

const mapCourse = computed(() => {
  const m = new Map<string, string>()
  courses.value.forEach(c => m.set(c._id, c.title))
  return m
})

const allExams = computed(() => exams.value.map(e => ({
  ...e,
  courseTitle: typeof e.courseId === 'object' ? e.courseId?.title : mapCourse.value.get(e.courseId) || 'General'
})))
const allTasks = computed(() => tasks.value.map(t => ({
  ...t,
  courseTitle: typeof t.courseId === 'object' ? t.courseId?.title : mapCourse.value.get(t.courseId) || 'General'
})))

const filteredExams = computed(() => {
  const byCourse = allExams.value.filter(e => selectedCourse.value === 'all' || e.courseId === selectedCourse.value || e.courseId?._id === selectedCourse.value)
  const sorted = [...byCourse].sort((a, b) => {
    if (sortBy.value === 'title') return String(a.title).localeCompare(String(b.title))
    return new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
  })
  return sorted
})

const topUpcomingExams = computed(() => filteredExams.value.filter(e => new Date(e.examDate).getTime() >= Date.now()).slice(0, 5))
const filteredTasks = computed(() => {
  const base = allTasks.value.filter(t => taskFilter.value === 'all' || t.status === taskFilter.value)
  return base.sort((a, b) => new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime())
})
const boardColumns = computed(() => ({
  high: allTasks.value.filter(t => t.status !== 'completed' && t.priority === 'high'),
  progress: allTasks.value.filter(t => t.status === 'in_progress'),
  completed: allTasks.value.filter(t => t.status === 'completed')
}))
const completionPct = computed(() => {
  const total = allTasks.value.length || 1
  const done = allTasks.value.filter(t => t.status === 'completed').length
  return Math.round((done / total) * 100)
})
const stats = computed(() => ({
  total: allTasks.value.length,
  completed: allTasks.value.filter(t => t.status === 'completed').length,
  inProgress: allTasks.value.filter(t => t.status === 'in_progress').length,
  overdue: allTasks.value.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length
}))
const tasksByCourse = computed(() => {
  const grouped = new Map<string, number>()
  allTasks.value.forEach((t) => {
    const key = t.courseTitle || 'General'
    grouped.set(key, (grouped.get(key) || 0) + 1)
  })
  return [...grouped.entries()].map(([name, count]) => ({ name, count, pct: Math.round((count / (stats.value.total || 1)) * 100) }))
})
const activityFeed = computed(() => {
  const taskEvents = allTasks.value.slice(0, 10).map(t => ({
    id: `task-${t._id}`,
    title: t.status === 'completed' ? `Completed "${t.title}"` : `Updated task "${t.title}"`,
    subtitle: `${t.courseTitle || 'General'} • ${formatShortDate(t.deadline)}`,
    time: new Date(t.updatedAt || t.deadline || 0).getTime()
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
  { key: 'formula', label: 'Review formula sheet', done: allTasks.value.filter(t => t.status === 'completed').length >= 2 },
  { key: 'flashcards', label: 'Flashcards - Physics', done: allTasks.value.filter(t => t.status === 'completed').length >= 3 },
  { key: 'past', label: 'Solve 10 past questions', done: allTasks.value.filter(t => t.status === 'in_progress').length >= 2 },
  { key: 'notes', label: 'Read lecture notes', done: allTasks.value.length > 0 },
  { key: 'summary', label: 'Summarize key concepts', done: allTasks.value.filter(t => t.status === 'completed').length >= 5 }
]))
const checklistDone = computed(() => checklist.value.filter(i => i.done).length)
const aiPriorities = computed(() => {
  return allTasks.value
    .filter(t => t.status !== 'completed')
    .sort((a, b) => {
      const p = (b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1) - (a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1)
      if (p !== 0) return p
      return new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime()
    })
    .slice(0, 5)
    .map((t, idx) => ({
      index: idx + 1,
      title: t.title,
      course: t.courseTitle,
      impact: t.priority === 'high' ? 'High Impact' : t.priority === 'medium' ? 'Medium Impact' : 'Low Impact',
      impactTone: t.priority === 'high' ? 'text-red-500' : t.priority === 'medium' ? 'text-amber-500' : 'text-emerald-500'
    }))
})

function daysUntil(dateIso: string) {
  const diff = Math.ceil((new Date(dateIso).getTime() - Date.now()) / 86400000)
  if (diff <= 0) return diff === 0 ? 'In 0 days' : `In ${Math.abs(diff)} days`
  return `In ${diff} days`
}
function daysUntilTask(v?: string) {
  if (!v) return '-'
  const diff = Math.ceil((new Date(v).getTime() - Date.now()) / 86400000)
  if (diff <= 0) return diff === 0 ? 'Due today' : `Overdue ${Math.abs(diff)}d`
  return `Due in ${diff}d`
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
function shortCourse(title: string) {
  return title.length <= 14 ? title : `${title.slice(0, 14)}...`
}
function toneBadge(priority: string) {
  if (priority === 'high') return 'bg-red-50 text-red-500 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800'
  if (priority === 'medium') return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800'
  return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
}
function formatShortDate(v?: string) {
  if (!v) return '-'
  return new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

async function load() {
  isLoading.value = true
  const [eR, cR, tR] = await Promise.all([get<any>('/exams'), get<any>('/courses'), get<any>('/tasks')])
  const incomingExams = eR.success ? (Array.isArray(eR.data) ? eR.data : eR.data?.data || []) : []
  const incomingCourses = cR.success ? (Array.isArray(cR.data) ? cR.data : cR.data?.data || []) : []
  const incomingTasks = tR.success ? (Array.isArray(tR.data) ? tR.data : tR.data?.data || []) : []
  courses.value = incomingCourses.length ? incomingCourses : fallbackCourses
  exams.value = incomingExams.length ? incomingExams : fallbackExams
  tasks.value = incomingTasks.length ? incomingTasks : fallbackTasks
  isLoading.value = false
}

function syncTabFromQuery() {
  const q = String(route.query.tab || 'overview')
  if (q === 'overview' || q === 'exams' || q === 'tasks') activeTab.value = q
  else activeTab.value = 'overview'
}
function setTab(tab: 'overview' | 'exams' | 'tasks') {
  router.replace({ query: { ...route.query, tab } })
}

onMounted(() => {
  syncTabFromQuery()
  load()
})
watch(() => route.query.tab, syncTabFromQuery)
</script>

<template>
  <section class="max-w-[1420px] mx-auto pb-8">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div class="flex items-center gap-5 border-b border-[var(--color-border)] w-full md:w-auto">
        <button class="pb-2 text-[13px] font-semibold transition" :class="activeTab==='overview' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'" @click="setTab('overview')">Overview</button>
        <button class="pb-2 text-[13px] font-semibold transition" :class="activeTab==='exams' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'" @click="setTab('exams')">Exams</button>
        <button class="pb-2 text-[13px] font-semibold transition" :class="activeTab==='tasks' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'" @click="setTab('tasks')">Tasks</button>
      </div>

      <div class="flex flex-wrap gap-2">
        <select v-model="selectedCourse" class="h-9 px-3 rounded-xl text-[12px] border" style="border-color:var(--color-border);background:var(--color-surface)">
          <option value="all">All Courses</option>
          <option v-for="c in courses" :key="c._id" :value="c._id">{{ c.title }}</option>
        </select>
        <select v-model="selectedType" class="h-9 px-3 rounded-xl text-[12px] border" style="border-color:var(--color-border);background:var(--color-surface)">
          <option value="all">All Types</option>
        </select>
        <select v-model="selectedRange" class="h-9 px-3 rounded-xl text-[12px] border" style="border-color:var(--color-border);background:var(--color-surface)">
          <option value="12may-18may">12 May - 18 May</option>
          <option value="thisweek">This Week</option>
        </select>
        <select v-model="sortBy" class="h-9 px-3 rounded-xl text-[12px] border" style="border-color:var(--color-border);background:var(--color-surface)">
          <option value="due">Sort by: Due Date</option>
          <option value="title">Sort by: Title</option>
        </select>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-24">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" style="color:var(--color-primary)" />
    </div>

    <template v-else-if="activeTab === 'overview' || activeTab === 'exams'">
      <div :class="activeTab === 'overview' ? 'grid grid-cols-1 2xl:grid-cols-[1fr_340px] gap-5' : 'block'">
      <div>
      <div class="rounded-2xl border p-4 mb-4" style="border-color:var(--color-border);background:var(--color-surface);box-shadow:var(--shadow-card)">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-[18px] font-semibold" style="color:var(--color-text)">Upcoming Exams</h3>
          <NuxtLink to="/dashboard/schedule" class="text-[13px] font-semibold" style="color:var(--color-primary)">View calendar</NuxtLink>
        </div>
        <div class="relative px-4 h-8">
          <div class="absolute left-4 right-4 top-5 h-[2px] rounded-full z-0" style="background:#cfd5f3"></div>
          <div class="relative z-20 grid grid-cols-5 gap-3">
            <div v-for="(e, i) in topUpcomingExams" :key="e._id" class="relative">
              <div class="absolute -top-2 left-1/2 -translate-x-1/2 text-[11px] font-semibold whitespace-nowrap" :style="`color:${examAccent(i)}`">{{ daysUntil(e.examDate) }}</div>
              <div class="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-[2.5px] bg-white" :style="`top:20.8px;border-color:${examAccent(i)}`"></div>
              <div v-if="i < topUpcomingExams.length - 1" class="absolute left-[calc(100%+6px)] -translate-y-1/2 w-1 h-1 rounded-full" :style="`top:20.8px;background:${examAccent(i + 1)}`" />
            </div>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
      </div>

      <div v-if="activeTab === 'overview'" class="rounded-2xl border p-4" style="border-color:var(--color-border);background:var(--color-surface);box-shadow:var(--shadow-card)">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-[16px] font-semibold" style="color:var(--color-text)">Task Board</h3>
          <div class="flex items-center gap-3">
            <p class="text-[12px]" style="color:var(--color-text-soft)">{{ allTasks.length }} tasks total</p>
            <div class="w-72 h-3 rounded-full" style="background:var(--color-border)"><div class="h-3 rounded-full" :style="`background:var(--color-primary);width:${completionPct}%`"></div></div>
            <p class="text-[12px] font-semibold" style="color:var(--color-text)">{{ completionPct }}%</p>
          </div>
        </div>
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-3">
          <BoardColumn title="High Priority" tone="high" :items="boardColumns.high"><template #meta="{ task }"><div class="mt-1 flex items-center justify-between"><span class="text-[11px] px-2 py-0.5 rounded bg-sky-100 text-sky-700">{{ shortCourse(task.courseTitle) }}</span><span class="text-[12px] text-red-500">{{ daysUntilTask(task.deadline) }}</span></div></template></BoardColumn>
          <BoardColumn title="In Progress" tone="progress" :items="boardColumns.progress"><template #meta="{ task }"><div class="mt-1 flex items-center justify-between"><span class="text-[11px] px-2 py-0.5 rounded bg-sky-100 text-sky-700">{{ shortCourse(task.courseTitle) }}</span><span class="text-[12px] text-amber-500">{{ daysUntilTask(task.deadline) }}</span></div></template></BoardColumn>
          <BoardColumn title="Completed" tone="completed" :items="boardColumns.completed"><template #meta="{ task }"><div class="mt-1 flex items-center justify-between"><span class="text-[11px] px-2 py-0.5 rounded bg-sky-100 text-sky-700">{{ shortCourse(task.courseTitle) }}</span><span class="text-[12px]" style="color:var(--color-text-soft)">{{ formatShortDate(task.deadline) }}</span></div></template></BoardColumn>
        </div>
      </div>

      <div v-if="activeTab === 'overview'" class="grid grid-cols-1 xl:grid-cols-3 gap-3 mt-3">
        <div class="rounded-2xl border p-4" style="border-color:var(--color-border);background:var(--color-surface)">
          <h4 class="text-[18px] font-semibold mb-3" style="color:var(--color-text)">Task Overview</h4>
          <div class="grid grid-cols-2 gap-2.5">
            <div class="rounded-xl border p-2" style="border-color:var(--color-border)"><p class="text-[24px] font-semibold">{{ stats.total }}</p><p class="text-[12px]" style="color:var(--color-text-soft)">Total Tasks</p></div>
            <div class="rounded-xl border p-2" style="border-color:var(--color-border)"><p class="text-[24px] font-semibold text-emerald-600">{{ stats.completed }}</p><p class="text-[12px]" style="color:var(--color-text-soft)">Completed</p></div>
            <div class="rounded-xl border p-2" style="border-color:var(--color-border)"><p class="text-[24px] font-semibold text-amber-500">{{ stats.inProgress }}</p><p class="text-[12px]" style="color:var(--color-text-soft)">In Progress</p></div>
            <div class="rounded-xl border p-2" style="border-color:var(--color-border)"><p class="text-[24px] font-semibold text-red-500">{{ stats.overdue }}</p><p class="text-[12px]" style="color:var(--color-text-soft)">Overdue</p></div>
          </div>
        </div>

        <div class="rounded-2xl border p-4" style="border-color:var(--color-border);background:var(--color-surface)">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-[18px] font-semibold" style="color:var(--color-text)">Tasks by Course</h4>
            <span class="text-[12px]" style="color:var(--color-primary)">View full report</span>
          </div>
          <div class="space-y-3">
            <div v-for="row in tasksByCourse" :key="row.name">
              <div class="flex justify-between text-[12px] mb-1"><span>{{ row.name }}</span><span>{{ row.count }} ({{ row.pct }}%)</span></div>
              <div class="h-2 rounded-full" style="background:var(--color-border)"><div class="h-2 rounded-full" :style="`background:var(--color-primary);width:${row.pct}%`"></div></div>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border p-4" style="border-color:var(--color-border);background:var(--color-surface)">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-[18px] font-semibold" style="color:var(--color-text)">Recent Activity</h4>
            <span class="text-[12px]" style="color:var(--color-primary)">View all</span>
          </div>
          <div class="space-y-3">
            <div v-for="a in activityFeed" :key="a.id" class="rounded-xl border p-2" style="border-color:var(--color-border)">
              <p class="text-[12px] font-medium">{{ a.title }}</p>
              <p class="text-[11px]" style="color:var(--color-text-soft)">{{ a.subtitle }}</p>
            </div>
          </div>
        </div>
      </div>
      </div>

      <aside v-if="activeTab === 'overview'" class="space-y-3">
        <div class="rounded-2xl overflow-hidden border" style="border-color:#5b5cf4;background:#4f46e5">
          <div class="p-4" style="background:linear-gradient(165deg,#4f46e5 0%,#4f46e5 35%,#4338ca 100%)">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-sparkles" class="size-4 text-white/95" />
                <h4 class="text-[18px] font-semibold" style="color:rgba(255,255,255,0.96)">AI Prioritization</h4>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded bg-white/20" style="color:rgba(255,255,255,0.96)">BETA</span>
            </div>
            <p class="text-[12px]" style="color:rgba(255,255,255,0.86)">Based on your exams, deadlines and performance, here's what to focus on first.</p>
          </div>

          <div class="bg-white p-2.5">
            <div class="rounded-xl border border-slate-100 overflow-hidden">
              <div v-for="(p, idx) in aiPriorities" :key="p.index" class="px-3 py-2.5 bg-white" :class="idx < aiPriorities.length - 1 ? 'border-b border-slate-100' : ''">
                <div class="flex items-start gap-2">
                  <span class="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 text-[12px] font-semibold flex items-center justify-center">{{ p.index }}</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-[13px] font-semibold truncate text-slate-800">{{ p.title }}</p>
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-700">{{ shortCourse(p.course) }}</span>
                      <span class="text-[10px] font-semibold" :class="p.impactTone">{{ p.impact }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button class="mt-2 w-full h-9 rounded-lg text-[12px] font-semibold text-white border border-white/20" style="background:linear-gradient(180deg,#5d58ff,#4f46e5)">
              <span class="inline-flex items-center gap-1.5">
                <UIcon name="i-lucide-sparkles" class="size-3.5" />
                Generate new priorities
              </span>
            </button>
          </div>
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

    <div v-else class="space-y-3">
      <div class="flex items-center gap-2 mb-2">
        <button v-for="f in ['all', 'todo', 'in_progress', 'completed']" :key="f" class="h-9 px-3 rounded-lg text-[12px] font-semibold capitalize border" :style="taskFilter === f ? 'background:var(--color-primary);color:#fff;border-color:var(--color-primary)' : 'border-color:var(--color-border);color:var(--color-text)'" @click="taskFilter = f as any">{{ f.replace('_', ' ') }}</button>
      </div>
      <div v-for="t in filteredTasks" :key="t._id" class="rounded-xl border p-4" style="border-color:var(--color-border);background:var(--color-surface)">
        <div class="flex items-center gap-3">
          <div class="size-5 rounded-full border flex items-center justify-center" :style="t.status === 'completed' ? 'background:var(--color-success);color:#fff;border-color:var(--color-success)' : 'border-color:var(--color-border)'"><UIcon v-if="t.status === 'completed'" name="i-lucide-check" class="size-3" /></div>
          <div class="flex-1 min-w-0"><p class="text-[14px] font-semibold truncate" :style="t.status === 'completed' ? 'text-decoration:line-through;color:var(--color-text-muted)' : 'color:var(--color-text)'">{{ t.title }}</p><p class="text-[12px]" style="color:var(--color-text-soft)">{{ t.courseTitle }} • {{ t.deadline ? formatShortDate(t.deadline) : 'No due date' }}</p></div>
          <span class="text-[11px] px-2 py-0.5 rounded border capitalize" :class="toneBadge(t.priority)">{{ t.priority }}</span>
        </div>
      </div>
    </div>
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
