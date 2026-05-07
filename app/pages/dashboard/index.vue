<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'dashboard'
})

const { get, post } = useApi()

// State
const user = ref<any>(null)
const schedules = ref<any[]>([])
const tasks = ref<any[]>([])
const exams = ref<any[]>([])
const files = ref<any[]>([])
const courses = ref<any[]>([])

const aiPlan = ref<any>(null)
const isGeneratingPlan = ref(false)

const chatMessage = ref('')
const chatReplies = ref<{ role: string, content: string }[]>([])
const isSendingChat = ref(false)

const isInitialLoading = ref(true)

// Computed
const userName = computed(() => user.value?.name || 'User')

const todayStart = new Date()
todayStart.setHours(0, 0, 0, 0)
const todayEnd = new Date()
todayEnd.setHours(23, 59, 59, 999)

const classesToday = computed(() => {
  return schedules.value.filter(s => {
    const sDate = new Date(s.start)
    return sDate >= todayStart && sDate <= todayEnd && ['course', 'td', 'tp', 'exam', 'study_session', 'task'].includes(s.type)
  })
})

const nextClass = computed(() => {
  const now = new Date()
  return classesToday.value.find(s => new Date(s.start) >= now) || classesToday.value[0]
})

const pendingTasks = computed(() => tasks.value.filter(t => t.status === 'todo' || t.status === 'in_progress'))
const highPriorityTasksCount = computed(() => pendingTasks.value.filter(t => t.priority === 'high').length)

const upcomingExams = computed(() => exams.value.filter(e => new Date(e.examDate) >= new Date()).sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime()))
const nextExam = computed(() => upcomingExams.value[0])

const productivityScore = computed(() => {
  const totalTasks = tasks.value.length
  const completedTasks = tasks.value.filter(t => t.status === 'completed').length
  const studySessions = schedules.value.filter(s => s.type === 'study_session' && s.status === 'completed').length
  
  if (totalTasks === 0 && studySessions === 0) return 0
  let score = totalTasks > 0 ? (completedTasks / totalTasks) * 80 : 0
  score += studySessions * 5 
  return Math.min(100, Math.round(score))
})

const todaysPlan = computed(() => {
  return schedules.value.filter(s => {
    const sDate = new Date(s.start)
    return sDate >= todayStart && sDate <= todayEnd
  }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
})

const upcomingItems = computed(() => {
  const items: any[] = []
  upcomingExams.value.forEach(e => {
    items.push({ id: e._id, title: e.title, date: new Date(e.examDate), type: 'exam', subtitle: e.courseId?.title || 'Exam' })
  })
  pendingTasks.value.forEach(t => {
    if (t.deadline) {
      items.push({ id: t._id, title: t.title, date: new Date(t.deadline), type: 'task', subtitle: 'Task' })
    }
  })
  return items.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 4)
})

async function fetchData() {
  try {
    isInitialLoading.value = true
    const [meRes, schedulesRes, tasksRes, examsRes, filesRes, coursesRes] = await Promise.all([
      get<any>('/auth/me'),
      get<any>('/schedules', { start: todayStart.toISOString() }),
      get<any>('/tasks'),
      get<any>('/exams', { status: 'upcoming' }),
      get<any>('/files', { limit: 3, sort: 'newest' }),
      get<any>('/courses', { limit: 3, sort: 'newest' })
    ])
    
    if (meRes.success && meRes.data) user.value = meRes.data
    if (schedulesRes.success) schedules.value = Array.isArray(schedulesRes.data) ? schedulesRes.data : schedulesRes.data?.data || []
    if (tasksRes.success) tasks.value = Array.isArray(tasksRes.data) ? tasksRes.data : tasksRes.data?.data || []
    if (examsRes.success) exams.value = Array.isArray(examsRes.data) ? examsRes.data : examsRes.data?.data || []
    if (filesRes.success) files.value = Array.isArray(filesRes.data) ? filesRes.data : filesRes.data?.data || []
    if (coursesRes.success) courses.value = Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data?.data || []
  } catch (err) {
    console.error('Failed to fetch dashboard data', err)
  } finally {
    isInitialLoading.value = false
  }
}

async function generatePlan() {
  if (isGeneratingPlan.value) return
  isGeneratingPlan.value = true
  try {
    const todayStr = new Date().toISOString().split('T')[0]
    const res = await post<any>('/ai/daily-plan', {
      date: todayStr,
      focusHours: 6,
      courseIds: courses.value.map(c => c._id)
    })
    if (res.success && res.data?.plan) aiPlan.value = res.data.plan
  } catch (err) {
    console.error('AI Plan Error', err)
  } finally {
    isGeneratingPlan.value = false
  }
}

async function sendChat(message?: string) {
  const msg = message || chatMessage.value
  if (!msg.trim() || isSendingChat.value) return
  chatReplies.value.push({ role: 'user', content: msg })
  chatMessage.value = ''
  isSendingChat.value = true
  try {
    const res = await post<any>('/ai/chat', { message: msg })
    if (res.success && res.data?.reply) chatReplies.value.push({ role: 'ai', content: res.data.reply })
  } catch (err) {
     chatReplies.value.push({ role: 'ai', content: 'Sorry, I encountered an error.' })
  } finally {
    isSendingChat.value = false
  }
}

function formatTime(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDateFull(dateStr: string | Date) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function formatDateShort(dateStr: string | Date) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getDayMonth(dateStr: string | Date) {
  if (!dateStr) return { day: '', month: '' }
  const d = new Date(dateStr)
  return {
    day: d.getDate(),
    month: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
  }
}

function getDaysUntil(dateStr: string | Date) {
  if (!dateStr) return ''
  const diffTime = new Date(dateStr).getTime() - new Date().getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 0) return 'Passed'
  return `In ${diffDays} days`
}

onMounted(() => {
  fetchData().then(() => generatePlan())
})
</script>

<template>
  <section v-if="isInitialLoading" class="flex h-full min-h-[50vh] items-center justify-center">
    <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-indigo-600" />
  </section>
  <section v-else class="max-w-[1400px] mx-auto pb-10">
    <div class="mb-6">
      <h1 class="text-[26px] font-bold text-slate-900 dark:text-white">
        Good morning, {{ userName }}! 👋
      </h1>
      <p class="mt-1 text-[15px] text-slate-500 dark:text-slate-400">
        Let's make today productive and focused.
      </p>
    </div>

    <!-- Main 2-Column Layout -->
    <div class="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
      
      <!-- LEFT COLUMN -->
      <div class="flex flex-col gap-6">
        
        <!-- 4 Compact Stat Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Classes Today -->
          <div class="bg-white dark:bg-slate-800 rounded-[16px] p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">
            <div class="flex items-center gap-2.5">
              <div class="flex size-8 items-center justify-center rounded-[8px] bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <UIcon name="i-lucide-book-open" class="size-4" />
              </div>
              <p class="text-[12px] font-bold text-slate-600 dark:text-slate-300">Classes Today</p>
            </div>
            <p class="mt-3 text-[26px] font-bold leading-none text-slate-900 dark:text-white">{{ classesToday.length }}</p>
            <p class="mt-2 text-[11px] font-medium" :class="nextClass ? 'text-emerald-600' : 'text-slate-400'">
              {{ nextClass ? 'Next: ' + nextClass.title + ' - ' + formatTime(nextClass.start) : 'No more classes today' }}
            </p>
          </div>
          
          <!-- Tasks Pending -->
          <div class="bg-white dark:bg-slate-800 rounded-[16px] p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">
            <div class="flex items-center gap-2.5">
              <div class="flex size-8 items-center justify-center rounded-[8px] bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                <UIcon name="i-lucide-file-check-2" class="size-4" />
              </div>
              <p class="text-[12px] font-bold text-slate-600 dark:text-slate-300">Tasks Pending</p>
            </div>
            <p class="mt-3 text-[26px] font-bold leading-none text-slate-900 dark:text-white">{{ pendingTasks.length }}</p>
            <p class="mt-2 text-[11px] font-medium" :class="highPriorityTasksCount > 0 ? 'text-red-500' : 'text-slate-400'">
              {{ highPriorityTasksCount }} high priority
            </p>
          </div>

          <!-- Exams -->
          <div class="bg-white dark:bg-slate-800 rounded-[16px] p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">
            <div class="flex items-center gap-2.5">
              <div class="flex size-8 items-center justify-center rounded-[8px] bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <UIcon name="i-lucide-calendar" class="size-4" />
              </div>
              <p class="text-[12px] font-bold text-slate-600 dark:text-slate-300">Exams</p>
            </div>
            <p class="mt-3 text-[26px] font-bold leading-none text-slate-900 dark:text-white">{{ upcomingExams.length }}</p>
            <p class="mt-2 text-[11px] font-medium text-slate-400">
              {{ nextExam ? 'Next: ' + formatDateShort(nextExam.examDate) : 'No upcoming exams' }}
            </p>
          </div>

          <!-- Productivity Score -->
          <div class="bg-white dark:bg-slate-800 rounded-[16px] p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">
            <div class="flex items-center gap-2.5">
              <div class="flex size-8 items-center justify-center rounded-[8px] bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <UIcon name="i-lucide-trending-up" class="size-4" />
              </div>
              <p class="text-[12px] font-bold text-slate-600 dark:text-slate-300">Productivity Score</p>
            </div>
            <p class="mt-3 text-[26px] font-bold leading-none text-slate-900 dark:text-white">{{ productivityScore }}%</p>
            <p class="mt-2 text-[11px] font-medium text-emerald-600">
              Good job!
            </p>
          </div>
        </div>

        <!-- Today's Plan & AI Suggestion -->
        <div class="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
          <!-- Today's Plan -->
          <div class="bg-white dark:bg-slate-800 rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700 h-full">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-calendar-days" class="size-5 text-slate-800 dark:text-white" />
                <h2 class="text-lg font-bold text-slate-900 dark:text-white">Today's Plan</h2>
              </div>
              <p class="text-[13px] text-slate-500 font-medium">{{ formatDateFull(new Date()) }}</p>
            </div>
            
            <div class="relative pl-[52px]">
              <div class="absolute left-[44px] top-4 bottom-4 w-[2px] bg-slate-100 dark:bg-slate-700"></div>
              
              <div v-if="todaysPlan.length === 0" class="text-sm text-slate-500 py-4 text-center">
                No events scheduled for today.
              </div>
              
              <div class="space-y-4 relative z-10">
                <div v-for="plan in todaysPlan" :key="plan._id" class="relative flex items-center gap-4">
                  <div class="absolute -left-[64px] w-[46px] text-right text-[12px] font-bold text-slate-500 pt-0.5 bg-white dark:bg-slate-800">
                    {{ formatTime(plan.start) }}
                  </div>
                  <div class="absolute -left-[14px] flex items-center justify-center bg-white dark:bg-slate-800 py-1">
                     <div class="size-[10px] rounded-full border-2 border-white dark:border-slate-800" :class="{
                       'bg-blue-500': plan.type === 'course',
                       'bg-emerald-500': plan.type === 'td' || plan.type === 'tp',
                       'bg-indigo-500': plan.type === 'study_session',
                       'bg-orange-500': plan.type === 'exam' || plan.type === 'task',
                       'bg-slate-400': !['study_session', 'course', 'td', 'tp', 'exam', 'task'].includes(plan.type)
                     }"></div>
                  </div>
                  
                  <div class="flex-1 rounded-[16px] p-3 flex items-center gap-4 transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer" :class="{
                    'border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-900/10 border-dashed': plan.type === 'study_session',
                    'border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm': plan.type !== 'study_session'
                  }">
                    <div class="flex size-[36px] flex-shrink-0 items-center justify-center rounded-[10px]" :class="{
                      'text-blue-600 bg-blue-50 dark:bg-blue-900/30': plan.type === 'course',
                      'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30': plan.type === 'td' || plan.type === 'tp',
                      'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30': plan.type === 'study_session',
                      'text-orange-600 bg-orange-50 dark:bg-orange-900/30': plan.type === 'exam' || plan.type === 'task',
                      'text-slate-500 bg-slate-100 dark:bg-slate-700': !['study_session', 'course', 'td', 'tp', 'exam', 'task'].includes(plan.type)
                    }">
                      <UIcon v-if="plan.type === 'study_session'" name="i-lucide-sparkles" class="size-4" />
                      <UIcon v-else-if="plan.type === 'course'" name="i-lucide-book-open" class="size-4" />
                      <UIcon v-else-if="plan.type === 'td' || plan.type === 'tp'" name="i-lucide-calculator" class="size-4" />
                      <UIcon v-else-if="plan.type === 'exam'" name="i-lucide-clipboard-check" class="size-4" />
                      <UIcon v-else name="i-lucide-calendar" class="size-4" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="font-bold text-[13px] truncate" :class="plan.type === 'study_session' ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-white'">{{ plan.title }}</p>
                      <p class="text-[11px] font-medium mt-0.5 truncate" :class="plan.type === 'study_session' ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-500'">{{ plan.location || (plan.type === 'study_session' ? 'AI Suggested' : plan.type.toUpperCase()) }}</p>
                    </div>
                    <div v-if="plan.type === 'study_session'" class="size-6 rounded-full border border-indigo-200 flex items-center justify-center mr-1">
                      <UIcon name="i-lucide-plus" class="size-3.5 text-indigo-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- AI Suggestion -->
          <div class="bg-white dark:bg-slate-800 rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700 flex flex-col h-full">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-lucide-sparkles" class="size-5 text-violet-500" />
              <h2 class="text-[16px] font-bold text-slate-900 dark:text-white">AI Suggestion for You</h2>
            </div>
            <p class="text-[12px] text-slate-500 leading-relaxed font-medium">
              Based on your courses and exams, here's your optimal plan for today.
            </p>

            <div v-if="isGeneratingPlan" class="flex-1 flex items-center justify-center py-10">
              <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-violet-500" />
            </div>
            <div v-else-if="aiPlan" class="mt-5 flex-1 space-y-3">
               <div v-for="(item, idx) in aiPlan.plan" :key="idx" class="flex items-center gap-3 border border-slate-100 dark:border-slate-700 rounded-[14px] p-3 shadow-sm bg-white dark:bg-slate-800">
                  <UIcon name="i-lucide-check-circle-2" class="size-5 text-emerald-500 flex-shrink-0" />
                  <div class="min-w-0 flex-1">
                    <p class="text-[13px] font-bold text-slate-900 dark:text-white truncate">{{ item.activity }}</p>
                    <p class="text-[11px] font-medium text-slate-500 truncate mt-0.5">{{ item.subject || 'Important' }} • {{ item.time }}</p>
                  </div>
                  <UIcon name="i-lucide-arrow-right" class="size-4 text-slate-300 flex-shrink-0" />
               </div>
            </div>
            <div v-else class="flex-1 flex items-center justify-center py-10">
              <p class="text-sm text-slate-500">No suggestions available.</p>
            </div>

            <UButton block color="violet" variant="soft" class="mt-5 font-bold text-[12px] h-10 rounded-[10px] bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-100 transition" icon="i-lucide-refresh-cw" :loading="isGeneratingPlan" @click="generatePlan">
              Generate new plan
            </UButton>
          </div>
        </div>

        <!-- Focus Plan -->
        <div class="bg-gradient-to-r from-[#4f46e5] to-[#6366f1] rounded-[20px] p-8 text-white shadow-[0_8px_30px_-10px_rgba(79,70,229,0.4)] flex flex-col md:flex-row items-center justify-between gap-8">
           <div>
              <p class="text-indigo-100 text-[12px] font-medium uppercase tracking-wider mb-2">Focus Plan</p>
              <h3 class="text-[26px] font-bold leading-[1.2] mb-2 tracking-tight">Stay consistent,<br>achieve your goals.</h3>
              <p class="text-indigo-100/90 text-[13px] font-medium">Your success is built one day at a time.</p>
           </div>
           <div class="flex items-center gap-10 bg-white/10 rounded-[16px] p-5 backdrop-blur-md border border-white/10">
              <div class="text-center">
                <p class="text-[12px] text-indigo-100 mb-3 font-semibold">This Week Progress</p>
                <div class="relative size-[64px] mx-auto flex items-center justify-center rounded-full border-[4px] border-white/20 border-t-white">
                   <span class="font-bold text-lg">65%</span>
                </div>
                <p class="text-[10px] text-indigo-100 mt-3 font-bold uppercase tracking-wider">Great progress!</p>
              </div>
              <div class="flex items-end gap-3 h-[72px]">
                 <div class="flex flex-col items-center gap-1.5"><div class="w-2 rounded-full bg-white/30 h-8"></div><span class="text-[9px] font-bold text-indigo-100 uppercase">Mon</span></div>
                 <div class="flex flex-col items-center gap-1.5"><div class="w-2 rounded-full bg-white/30 h-10"></div><span class="text-[9px] font-bold text-indigo-100 uppercase">Tue</span></div>
                 <div class="flex flex-col items-center gap-1.5"><div class="w-2 rounded-full bg-white h-16 shadow-[0_0_12px_rgba(255,255,255,0.6)]"></div><span class="text-[9px] font-bold text-white uppercase">Wed</span></div>
                 <div class="flex flex-col items-center gap-1.5"><div class="w-2 rounded-full bg-white/30 h-9"></div><span class="text-[9px] font-bold text-indigo-100 uppercase">Thu</span></div>
                 <div class="flex flex-col items-center gap-1.5"><div class="w-2 rounded-full bg-white/30 h-12"></div><span class="text-[9px] font-bold text-indigo-100 uppercase">Fri</span></div>
                 <div class="flex flex-col items-center gap-1.5"><div class="w-2 rounded-full bg-white/30 h-6"></div><span class="text-[9px] font-bold text-indigo-100 uppercase">Sat</span></div>
                 <div class="flex flex-col items-center gap-1.5"><div class="w-2 rounded-full bg-white/30 h-8"></div><span class="text-[9px] font-bold text-indigo-100 uppercase">Sun</span></div>
              </div>
           </div>
        </div>

        <!-- Recent Files -->
        <div class="bg-white dark:bg-slate-800 rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">
          <div class="flex items-center justify-between mb-5">
            <h3 class="font-bold text-[16px] text-slate-900 dark:text-white">Recent Files</h3>
            <NuxtLink to="/dashboard/files" class="text-[13px] font-bold text-indigo-600 hover:text-indigo-700">View all</NuxtLink>
          </div>
          <div class="grid gap-4 md:grid-cols-3">
            <div v-if="files.length === 0" class="text-sm text-slate-500 py-2">No recent files.</div>
            <div v-for="file in files" :key="file._id" class="flex flex-col border border-slate-100 dark:border-slate-700 rounded-[16px] p-4 shadow-sm hover:shadow-md transition bg-white dark:bg-slate-800">
              <div class="flex items-center gap-3 mb-4">
                 <div class="flex size-[42px] flex-shrink-0 items-center justify-center rounded-[12px]" :class="{
                   'bg-red-50 text-red-500': file.type === 'pdf',
                   'bg-emerald-50 text-emerald-500': file.type === 'xlsx',
                   'bg-blue-50 text-blue-500': file.type === 'docx',
                   'bg-slate-100 text-slate-500': !['pdf', 'xlsx', 'docx'].includes(file.type)
                 }">
                   <UIcon :name="file.type === 'pdf' ? 'i-lucide-file-text' : 'i-lucide-file'" class="size-[20px]" />
                 </div>
                 <p class="text-[13px] font-bold text-slate-900 dark:text-white truncate flex-1">{{ file.originalName || file.fileName }}</p>
              </div>
              <p class="text-[11px] font-medium text-slate-500">{{ String(file.type).toUpperCase() }} • {{ (file.size / 1024 / 1024).toFixed(1) }} MB</p>
            </div>
          </div>
        </div>

      </div>

      <!-- RIGHT COLUMN -->
      <div class="flex flex-col gap-6">
        
        <!-- AI Assistant -->
        <div class="bg-white dark:bg-slate-800 rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700 flex flex-col">
          <div class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-sparkles" class="size-5 text-indigo-500" />
              <h2 class="text-[16px] font-bold text-slate-900 dark:text-white">AI Assistant</h2>
            </div>
            <div class="size-8 rounded-full hover:bg-slate-50 flex items-center justify-center cursor-pointer transition">
               <UIcon name="i-lucide-more-horizontal" class="size-5 text-slate-400" />
            </div>
          </div>

          <p class="text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-5">
            Hi {{ userName }}! How can I help you today?
          </p>

          <div class="flex-1 space-y-3">
            <template v-if="chatReplies.length === 0">
              <div @click="sendChat('Summarize my course')" class="flex items-center gap-3 p-3 rounded-[12px] border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition shadow-sm">
                 <div class="size-6 rounded-[6px] bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <UIcon name="i-lucide-file-text" class="size-3.5" />
                 </div>
                 <span class="text-[12px] font-bold text-slate-700 dark:text-slate-200">Summarize my course</span>
              </div>
              
              <div @click="sendChat('Create a study plan')" class="flex items-center gap-3 p-3 rounded-[12px] border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition shadow-sm">
                 <div class="size-6 rounded-[6px] bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <UIcon name="i-lucide-calendar" class="size-3.5" />
                 </div>
                 <span class="text-[12px] font-bold text-slate-700 dark:text-slate-200">Create a study plan</span>
              </div>
              
              <div @click="sendChat('Generate exercises')" class="flex items-center gap-3 p-3 rounded-[12px] border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition shadow-sm">
                 <div class="size-6 rounded-[6px] bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <UIcon name="i-lucide-pencil" class="size-3.5" />
                 </div>
                 <span class="text-[12px] font-bold text-slate-700 dark:text-slate-200">Generate exercises</span>
              </div>
              
              <div @click="sendChat('What should I study today?')" class="flex items-center gap-3 p-3 rounded-[12px] border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition shadow-sm">
                 <div class="size-6 rounded-[6px] bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <UIcon name="i-lucide-message-circle" class="size-3.5" />
                 </div>
                 <span class="text-[12px] font-bold text-slate-700 dark:text-slate-200">What should I study today?</span>
              </div>
            </template>
            <div v-else class="space-y-4 max-h-56 overflow-y-auto pr-2 scrollbar-thin">
               <div v-for="(msg, i) in chatReplies" :key="i" class="text-[13px] rounded-[14px] p-3 shadow-sm font-medium" :class="msg.role === 'user' ? 'bg-[#4f46e5] text-white ml-6' : 'bg-white border border-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mr-6'">
                  {{ msg.content }}
               </div>
            </div>
          </div>

          <div class="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 relative">
             <div class="relative flex items-center">
               <input
                 v-model="chatMessage"
                 placeholder="Ask anything..."
                 @keyup.enter="sendChat()"
                 :disabled="isSendingChat"
                 class="w-full h-[42px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[13px] rounded-[12px] pl-4 pr-12 focus:outline-none focus:border-indigo-400 font-medium placeholder:text-slate-400"
               />
               <button @click="sendChat()" class="absolute right-1.5 size-[30px] bg-[#4f46e5] hover:bg-indigo-600 transition rounded-[8px] flex items-center justify-center cursor-pointer disabled:opacity-50">
                 <UIcon name="i-lucide-send" class="size-[14px] text-white" />
               </button>
             </div>
             <div class="flex justify-between items-center mt-4 px-1">
                <div class="flex items-center gap-1.5 text-slate-400">
                  <UIcon name="i-lucide-square-dashed-bottom-code" class="size-3.5" />
                  <p class="text-[10px] font-bold uppercase tracking-wide">50 tokens per prompt</p>
                </div>
                <div class="flex items-center gap-1.5 text-slate-500 hover:text-indigo-500 cursor-pointer transition">
                  <UIcon name="i-lucide-history" class="size-3.5" />
                  <p class="text-[11px] font-bold">View history</p>
                </div>
             </div>
          </div>
        </div>

        <!-- Upcoming -->
        <div class="bg-white dark:bg-slate-800 rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">
           <div class="flex items-center justify-between mb-6">
              <h3 class="font-bold text-[16px] text-slate-900 dark:text-white">Upcoming</h3>
              <NuxtLink to="/dashboard/schedule" class="text-[13px] font-bold text-indigo-600 hover:text-indigo-700">View all</NuxtLink>
           </div>
           
           <div class="space-y-5">
              <div v-if="upcomingItems.length === 0" class="text-[13px] text-slate-500 py-2 font-medium">No upcoming items.</div>
              <div v-for="(item, idx) in upcomingItems" :key="item.id" class="flex gap-4 items-center" :class="idx !== upcomingItems.length - 1 ? 'pb-5 border-b border-slate-100 dark:border-slate-800' : ''">
                 <div class="w-[42px] text-center flex-shrink-0 flex flex-col justify-center border-r border-slate-100 dark:border-slate-700 pr-4">
                    <span class="text-[20px] font-bold text-slate-900 dark:text-white leading-none">{{ getDayMonth(item.date).day }}</span>
                    <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{{ getDayMonth(item.date).month }}</span>
                 </div>
                 <div class="min-w-0 flex-1 pl-1">
                    <p class="text-[13px] font-bold text-slate-900 dark:text-white truncate">{{ item.title }}</p>
                    <p class="text-[11px] font-medium text-slate-500 mt-1">{{ formatDateShort(item.date) }} • {{ formatTime(item.date.toISOString()) || '10:00 AM' }}</p>
                 </div>
                 <span class="text-[10px] px-2.5 py-1 rounded-md font-bold whitespace-nowrap tracking-wide uppercase" :class="item.title.includes('Exam') ? 'bg-red-50 text-red-500' : (item.title.includes('Homework') ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500')">
                    {{ getDaysUntil(item.date) }}
                 </span>
              </div>
           </div>
        </div>

        <!-- Recent Courses -->
        <div class="bg-white dark:bg-slate-800 rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">
          <div class="flex items-center justify-between mb-6">
             <h3 class="font-bold text-[16px] text-slate-900 dark:text-white">Recent Courses</h3>
             <NuxtLink to="/dashboard/courses" class="text-[13px] font-bold text-indigo-600 hover:text-indigo-700">View all</NuxtLink>
          </div>
          <div class="space-y-4">
             <div v-if="courses.length === 0" class="text-[13px] text-slate-500 py-2 font-medium">No recent courses.</div>
             <div v-for="course in courses" :key="course._id" class="flex items-center gap-4">
               <div class="flex size-[42px] flex-shrink-0 items-center justify-center rounded-[12px] bg-indigo-50 text-indigo-600 shadow-sm">
                 <UIcon name="i-lucide-book-open" class="size-5" />
               </div>
               <div class="min-w-0 flex-1 relative pr-[38px]">
                 <p class="text-[13px] font-bold text-slate-900 dark:text-white truncate">{{ course.title }}</p>
                 <p class="text-[11px] font-medium text-slate-500 mt-1">{{ course.teacher || 'Prof. Smith' }} • {{ course.semester || 'Fall 2024' }}</p>
                 <div class="mt-2.5 w-full bg-slate-100 dark:bg-slate-700 h-[6px] rounded-full overflow-hidden">
                    <div class="bg-emerald-500 h-full rounded-full" :style="`width: ${course.progress || 75}%`"></div>
                 </div>
                 <span class="absolute right-0 bottom-[-2px] text-[11px] font-bold text-slate-600">{{ course.progress || 75 }}%</span>
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>