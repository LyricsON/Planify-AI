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

function getDaysUntilClass(dateStr: string | Date) {
  const diffTime = new Date(dateStr).getTime() - new Date().getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  if (diffDays <= 1) return 'bg-red-50 text-red-500'
  if (diffDays <= 3) return 'bg-amber-50 text-amber-500'
  return 'bg-emerald-50 text-emerald-600'
}

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

onMounted(() => {
  fetchData().then(() => generatePlan())
})
</script>

<template>
  <section v-if="isInitialLoading" class="flex h-full min-h-[50vh] items-center justify-center">
    <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-indigo-600" />
  </section>
  <section v-else class="max-w-[1400px] mx-auto pb-10">
    <!-- Main 2-Column Layout -->
    <div class="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
      
      <!-- LEFT COLUMN -->
      <div class="flex flex-col gap-6">
        
        <!-- 4 Compact Stat Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Classes Today -->
          <div class="rounded-[12px] p-4 shadow-[var(--shadow-card)] border border-[var(--color-border)]" style="background:var(--color-surface)">
            <div class="flex items-center gap-2.5">
              <div class="flex size-8 items-center justify-center rounded-[8px]" style="background:color-mix(in srgb,var(--color-info) 10%,transparent);color:var(--color-info)">
                <UIcon name="i-lucide-book-open" class="size-4" />
              </div>
              <p class="text-[12px] font-bold" style="color:var(--color-text-soft)">Classes Today</p>
            </div>
            <p class="mt-3 text-[24px] font-bold leading-none" style="color:var(--color-text)">{{ classesToday.length }}</p>
            <p class="mt-2 text-[11px] font-medium" :style="nextClass ? 'color:var(--color-success)' : 'color:var(--color-text-muted)'">
              {{ nextClass ? 'Next: ' + nextClass.title + ' - ' + formatTime(nextClass.start) : 'No more classes today' }}
            </p>
          </div>

          <!-- Tasks Pending -->
          <div class="rounded-[12px] p-4 shadow-[var(--shadow-card)] border border-[var(--color-border)]" style="background:var(--color-surface)">
            <div class="flex items-center gap-2.5">
              <div class="flex size-8 items-center justify-center rounded-[8px]" style="background:color-mix(in srgb,var(--color-warning) 12%,transparent);color:var(--color-warning)">
                <UIcon name="i-lucide-file-check-2" class="size-4" />
              </div>
              <p class="text-[12px] font-bold" style="color:var(--color-text-soft)">Tasks Pending</p>
            </div>
            <p class="mt-3 text-[24px] font-bold leading-none" style="color:var(--color-text)">{{ pendingTasks.length }}</p>
            <p class="mt-2 text-[11px] font-medium" :style="highPriorityTasksCount > 0 ? 'color:var(--color-danger)' : 'color:var(--color-text-muted)'">
              {{ highPriorityTasksCount }} high priority
            </p>
          </div>

          <!-- Exams -->
          <div class="rounded-[12px] p-4 shadow-[var(--shadow-card)] border border-[var(--color-border)]" style="background:var(--color-surface)">
            <div class="flex items-center gap-2.5">
              <div class="flex size-8 items-center justify-center rounded-[8px]" style="background:color-mix(in srgb,var(--color-primary) 10%,transparent);color:var(--color-primary)">
                <UIcon name="i-lucide-calendar" class="size-4" />
              </div>
              <p class="text-[12px] font-bold" style="color:var(--color-text-soft)">Exams</p>
            </div>
            <p class="mt-3 text-[24px] font-bold leading-none" style="color:var(--color-text)">{{ upcomingExams.length }}</p>
            <p class="mt-2 text-[11px] font-medium" style="color:var(--color-text-muted)">
              {{ nextExam ? 'Next: ' + formatDateShort(nextExam.examDate) : 'No upcoming exams' }}
            </p>
          </div>

          <!-- Productivity Score -->
          <div class="rounded-[12px] p-4 shadow-[var(--shadow-card)] border border-[var(--color-border)]" style="background:var(--color-surface)">
            <div class="flex items-center gap-2.5">
              <div class="flex size-8 items-center justify-center rounded-[8px]" style="background:color-mix(in srgb,var(--color-success) 10%,transparent);color:var(--color-success)">
                <UIcon name="i-lucide-trending-up" class="size-4" />
              </div>
              <p class="text-[12px] font-bold" style="color:var(--color-text-soft)">Productivity Score</p>
            </div>
            <p class="mt-3 text-[24px] font-bold leading-none" style="color:var(--color-text)">{{ productivityScore }}%</p>
            <p class="mt-2 text-[11px] font-medium" style="color:var(--color-success)">Good job!</p>
          </div>
        </div>

        <!-- Today's Plan (unified card with AI Suggestion inside) -->
        <div class="rounded-[12px] shadow-[var(--shadow-card)] border border-[var(--color-border)]" style="background:var(--color-surface)">
          <!-- Card header -->
          <div class="flex items-center justify-between px-6 pt-5 pb-4">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-calendar-days" class="size-4" style="color:var(--color-text)" />
              <h2 class="text-[15px] font-bold" style="color:var(--color-text)">Today's Plan</h2>
            </div>
            <p class="text-[12px] font-medium" style="color:var(--color-text-muted)">{{ formatDateFull(new Date()) }}</p>
          </div>

          <!-- Two columns inside one card -->
          <div class="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr]">
            <!-- Left: Timeline -->
            <div class="p-6">
              <div class="relative pl-[52px]">
                <div class="absolute left-[44px] top-4 bottom-4 w-[2px]" style="background:var(--color-border)"></div>
                <div v-if="todaysPlan.length === 0" class="text-[16px] text-slate-500 py-4 text-center">
                  No events scheduled for today.
                </div>
                <div class="space-y-4 relative z-10">
                  <div v-for="plan in todaysPlan" :key="plan._id" class="relative flex items-center gap-4">
                    <div class="absolute -left-[64px] w-[46px] text-right text-[12px] font-bold pt-0.5" style="color:var(--color-text-soft);background:var(--color-surface)">
                      {{ formatTime(plan.start) }}
                    </div>
                    <div class="absolute -left-[14px] flex items-center justify-center py-1" style="background:var(--color-surface)">
                      <div class="size-[10px] rounded-full border-2 border-white dark:border-slate-800" :class="{
                        'bg-blue-500': plan.type === 'course',
                        'bg-emerald-500': plan.type === 'td' || plan.type === 'tp',
                        'bg-indigo-500': plan.type === 'study_session',
                        'bg-orange-500': plan.type === 'exam' || plan.type === 'task',
                        'bg-slate-400': !['study_session', 'course', 'td', 'tp', 'exam', 'task'].includes(plan.type)
                      }"></div>
                    </div>
                    <div class="flex-1 p-3 flex items-center gap-4 transition-all cursor-pointer"
                      :style="plan.type === 'study_session'
                        ? 'border-radius:10px;border:1px dashed var(--color-primary);background:color-mix(in srgb,var(--color-primary) 6%,transparent)'
                        : 'border-radius:10px;border:1px solid var(--color-border);background:var(--color-surface);box-shadow:var(--shadow-sm)'">
                      <div class="flex size-[36px] flex-shrink-0 items-center justify-center"
                        :style="[
                          'border-radius:8px',
                          plan.type==='course' ? 'color:#2563eb;background:#eff6ff' :
                          plan.type==='td'||plan.type==='tp' ? 'color:#059669;background:#ecfdf5' :
                          plan.type==='study_session' ? 'color:var(--color-primary);background:color-mix(in srgb,var(--color-primary) 10%,transparent)' :
                          plan.type==='exam'||plan.type==='task' ? 'color:#ea580c;background:#fff7ed' :
                          'color:var(--color-text-muted);background:var(--color-border)'
                        ].join(';')">
                        <UIcon v-if="plan.type === 'study_session'" name="i-lucide-sparkles" class="size-4" />
                        <UIcon v-else-if="plan.type === 'course'" name="i-lucide-book-open" class="size-4" />
                        <UIcon v-else-if="plan.type === 'td' || plan.type === 'tp'" name="i-lucide-calculator" class="size-4" />
                        <UIcon v-else-if="plan.type === 'exam'" name="i-lucide-clipboard-check" class="size-4" />
                        <UIcon v-else name="i-lucide-calendar" class="size-4" />
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="font-bold text-[13px] truncate" :style="plan.type==='study_session' ? 'color:var(--color-primary)' : 'color:var(--color-text)'">{{ plan.title }}</p>
                        <p class="text-[11px] font-medium mt-0.5 truncate" :style="plan.type==='study_session' ? 'color:var(--color-primary);opacity:0.7' : 'color:var(--color-text-muted)'">{{ plan.location || (plan.type === 'study_session' ? 'AI Suggested' : plan.type.toUpperCase()) }}</p>
                      </div>
                      <div v-if="plan.type === 'study_session'" class="size-6 rounded-full border border-indigo-200 flex items-center justify-center mr-1">
                        <UIcon name="i-lucide-plus" class="size-3.5 text-indigo-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: AI Suggestion -->
            <div class="p-5 m-4 flex flex-col" style="background:color-mix(in srgb,var(--color-primary) 5%,var(--color-surface));border-radius:12px;border:1px solid var(--color-border)">
              <div class="flex items-center gap-2 mb-2">
                <UIcon name="i-lucide-sparkles" class="size-5" style="color:var(--color-primary)" />
                <h2 class="text-[16px] font-bold" style="color:var(--color-primary)">AI Suggestion for You</h2>
              </div>
              <p class="text-[13px] leading-relaxed font-medium mb-4" style="color:var(--color-text-muted)">
                Based on your courses and exams, here's your optimal plan for today.
              </p>
              <div v-if="isGeneratingPlan" class="flex-1 flex items-center justify-center py-10">
                <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-violet-500" />
              </div>
              <div v-else-if="aiPlan" class="flex-1 space-y-3">
                <div v-for="(item, idx) in aiPlan.plan" :key="idx" class="flex items-center gap-3 rounded-[10px] p-3 border border-[var(--color-border)] shadow-[var(--shadow-sm)]" style="background:var(--color-surface)">
                  <UIcon name="i-lucide-check-circle-2" class="size-5 text-emerald-500 flex-shrink-0" />
                  <div class="min-w-0 flex-1">
                    <p class="text-[13px] font-bold text-slate-900 dark:text-white truncate">{{ item.activity }}</p>
                    <p class="text-[11px] font-medium text-slate-500 truncate mt-0.5">{{ item.subject || 'Important' }}</p>
                  </div>
                  <UIcon name="i-lucide-arrow-right" class="size-4 text-slate-300 flex-shrink-0" />
                </div>
              </div>
              <div v-else class="flex-1 flex items-center justify-center py-6">
                <p class="text-[13px] text-slate-500">No suggestions available.</p>
              </div>
              <UButton block color="primary" variant="soft" class="mt-4 font-bold text-[16px] h-10 rounded-[8px] bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-100 transition" icon="i-lucide-refresh-cw" :loading="isGeneratingPlan" @click="generatePlan">
                Generate new plan
              </UButton>
            </div>
          </div>
        </div>

        <!-- Focus Plan -->
        <div class="rounded-[14px] p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6" style="background:linear-gradient(135deg,#4f46e5 0%,#6366f1 60%,#818cf8 100%);box-shadow:0 8px 32px -8px rgba(79,70,229,0.45)">
           <div>
              <p class="text-[12px] font-semibold uppercase tracking-wider mb-2" style="color:rgba(255,255,255,0.75)">Focus Plan</p>
              <h3 style="color:#fff;font-size:22px;font-weight:700;line-height:1.25;margin-bottom:6px">Stay consistent,<br>achieve your goals.</h3>
              <p class="text-[13px] font-medium" style="color:rgba(255,255,255,0.7)">Your success is built one day at a time.</p>
           </div>
           <div class="flex items-start gap-6 rounded-[12px] px-6 py-4" style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.15)">
              <div class="flex flex-col items-center">
                <p class="text-[11px] font-semibold mb-2" style="color:rgba(255,255,255,0.8)">This Week Progress</p>
                <div class="relative flex items-center justify-center" style="width:72px;height:72px">
                  <svg width="72" height="72" viewBox="0 0 72 72" style="position:absolute;top:0;left:0;transform:rotate(-90deg)">
                    <circle cx="36" cy="36" r="29" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="6"/>
                    <circle cx="36" cy="36" r="29" fill="none" stroke="#10b981" stroke-width="6" stroke-dasharray="182.2" stroke-dashoffset="63.8" stroke-linecap="round"/>
                  </svg>
                  <span class="relative text-[15px] font-bold" style="color:#fff">65%</span>
                </div>
                <p class="text-[10px] font-bold uppercase tracking-wider mt-2" style="color:rgba(255,255,255,0.8)">Great progress!</p>
              </div>
              <div class="flex items-end gap-2.5 mt-7" style="height:72px">
                 <div class="flex flex-col items-center gap-1.5"><div class="w-[8px] rounded-full" style="height:32px;background:#10b981"></div><span class="text-[9px] font-bold uppercase" style="color:rgba(255,255,255,0.7)">Mon</span></div>
                 <div class="flex flex-col items-center gap-1.5"><div class="w-[8px] rounded-full" style="height:40px;background:#10b981"></div><span class="text-[9px] font-bold uppercase" style="color:rgba(255,255,255,0.7)">Tue</span></div>
                 <div class="flex flex-col items-center gap-1.5"><div class="w-[8px] rounded-full" style="height:64px;background:#10b981;box-shadow:0 0 10px rgba(16,185,129,0.7)"></div><span class="text-[9px] font-bold uppercase" style="color:#fff">Wed</span></div>
                 <div class="flex flex-col items-center gap-1.5"><div class="w-[8px] rounded-full" style="height:36px;background:#10b981"></div><span class="text-[9px] font-bold uppercase" style="color:rgba(255,255,255,0.7)">Thu</span></div>
                 <div class="flex flex-col items-center gap-1.5"><div class="w-[8px] rounded-full" style="height:44px;background:#10b981"></div><span class="text-[9px] font-bold uppercase" style="color:rgba(255,255,255,0.7)">Fri</span></div>
                 <div class="flex flex-col items-center gap-1.5"><div class="w-[8px] rounded-full" style="height:24px;background:rgba(255,255,255,0.18)"></div><span class="text-[9px] font-bold uppercase" style="color:rgba(255,255,255,0.55)">Sat</span></div>
                 <div class="flex flex-col items-center gap-1.5"><div class="w-[8px] rounded-full" style="height:20px;background:rgba(255,255,255,0.18)"></div><span class="text-[9px] font-bold uppercase" style="color:rgba(255,255,255,0.55)">Sun</span></div>
              </div>
           </div>
        </div>


        <!-- Recent Files -->
        <div class="p-6" style="background:var(--color-surface);border-radius:16px;border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-[14px]" style="color:var(--color-text)">Recent Files</h3>
            <NuxtLink to="/dashboard/files" class="text-[12px] font-bold" style="color:var(--color-primary)">View all</NuxtLink>
          </div>
          <div class="grid gap-4 md:grid-cols-3">
            <div v-if="files.length === 0" class="text-[13px] col-span-3 py-4 text-center" style="color:var(--color-text-muted)">No recent files.</div>
            <div v-for="file in files" :key="file._id" class="flex items-center gap-3 p-4 transition" style="border-radius:10px;border:1px solid var(--color-border);background:var(--color-surface);box-shadow:var(--shadow-sm)">
               <div class="flex size-[40px] flex-shrink-0 items-center justify-center"
                 :style="[
                   'border-radius:10px',
                   file.type==='pdf'  ? 'background:#fef2f2;color:#ef4444' :
                   file.type==='xlsx' ? 'background:#f0fdf4;color:#22c55e' :
                   file.type==='docx' ? 'background:#eff6ff;color:#3b82f6' :
                   'background:var(--color-border);color:var(--color-text-muted)'
                 ].join(';')">
                 <UIcon :name="file.type === 'pdf' ? 'i-lucide-file-text' : file.type==='docx' ? 'i-lucide-file-type' : 'i-lucide-file'" class="size-[18px]" />
               </div>
               <div class="min-w-0 flex-1">
                 <p class="text-[13px] font-bold truncate" style="color:var(--color-text)">{{ file.originalName || file.fileName }}</p>
                 <p class="text-[11px] mt-0.5" style="color:var(--color-text-muted)">{{ String(file.type||'file').toUpperCase() }} • {{ (file.size/1024/1024).toFixed(1) }} MB</p>
               </div>
            </div>
          </div>
        </div>

      </div>

      <!-- RIGHT COLUMN -->
      <div class="flex flex-col gap-6">
        
        <!-- AI Assistant -->
        <div class="p-6 flex flex-col" style="background:var(--color-surface);border-radius:16px;border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-sparkles" class="size-4" style="color:var(--color-primary)" />
              <h2 class="text-[15px] font-bold" style="color:var(--color-text)">AI Assistant</h2>
            </div>
            <div class="size-7 rounded-full hover:bg-slate-50 flex items-center justify-center cursor-pointer transition">
               <UIcon name="i-lucide-more-horizontal" class="size-4 text-slate-400" />
            </div>
          </div>

          <p class="text-[13px] font-medium mb-4" style="color:var(--color-text-muted)">
            Hi {{ userName }}! How can I help you today?
          </p>

          <div class="flex-1 space-y-3">
            <template v-if="chatReplies.length === 0">
              <div @click="sendChat('Summarize my course')" class="flex items-center gap-3 p-3 cursor-pointer transition" style="border-radius:8px;border:1px solid var(--color-border);background:var(--color-surface);box-shadow:var(--shadow-sm)">
                 <div class="size-6 flex items-center justify-center" style="border-radius:6px;background:color-mix(in srgb,var(--color-primary) 10%,transparent);color:var(--color-primary)">
                    <UIcon name="i-lucide-file-text" class="size-3.5" />
                 </div>
                 <span class="text-[12px] font-bold" style="color:var(--color-text)">Summarize my course</span>
              </div>
              
              <div @click="sendChat('Create a study plan')" class="flex items-center gap-3 p-3 cursor-pointer transition" style="border-radius:8px;border:1px solid var(--color-border);background:var(--color-surface);box-shadow:var(--shadow-sm)">
                 <div class="size-6 flex items-center justify-center" style="border-radius:6px;background:color-mix(in srgb,var(--color-primary) 10%,transparent);color:var(--color-primary)">
                    <UIcon name="i-lucide-calendar" class="size-3.5" />
                 </div>
                 <span class="text-[12px] font-bold" style="color:var(--color-text)">Create a study plan</span>
              </div>
              
              <div @click="sendChat('Generate exercises')" class="flex items-center gap-3 p-3 cursor-pointer transition" style="border-radius:8px;border:1px solid var(--color-border);background:var(--color-surface);box-shadow:var(--shadow-sm)">
                 <div class="size-6 flex items-center justify-center" style="border-radius:6px;background:color-mix(in srgb,var(--color-primary) 10%,transparent);color:var(--color-primary)">
                    <UIcon name="i-lucide-pencil" class="size-3.5" />
                 </div>
                 <span class="text-[12px] font-bold" style="color:var(--color-text)">Generate exercises</span>
              </div>
              
              <div @click="sendChat('What should I study today?')" class="flex items-center gap-3 p-3 cursor-pointer transition" style="border-radius:8px;border:1px solid var(--color-border);background:var(--color-surface);box-shadow:var(--shadow-sm)">
                 <div class="size-6 flex items-center justify-center" style="border-radius:6px;background:color-mix(in srgb,var(--color-primary) 10%,transparent);color:var(--color-primary)">
                    <UIcon name="i-lucide-message-circle" class="size-3.5" />
                 </div>
                 <span class="text-[12px] font-bold" style="color:var(--color-text)">What should I study today?</span>
              </div>
            </template>
            <div v-else class="space-y-4 max-h-56 overflow-y-auto pr-2 scrollbar-thin">
               <div v-for="(msg, i) in chatReplies" :key="i" class="text-[13px] p-3 font-medium"
                 :class="msg.role === 'user' ? 'ml-6' : 'mr-6'"
                 :style="msg.role==='user'
                   ? 'border-radius:14px;background:var(--color-primary);color:#fff;box-shadow:var(--shadow-sm)'
                   : 'border-radius:14px;background:var(--color-surface);border:1px solid var(--color-border);color:var(--color-text);box-shadow:var(--shadow-sm)'">
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
                 class="w-full h-[42px] pl-4 pr-12 text-[13px] font-medium focus:outline-none"
                 style="border-radius:12px;border:1px solid var(--color-border);background:var(--color-bg);color:var(--color-text)"
               />
               <button @click="sendChat()" class="absolute right-1.5 size-[30px] flex items-center justify-center cursor-pointer transition disabled:opacity-50" style="border-radius:8px;background:var(--color-primary)">
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
        <div class="p-5" style="background:var(--color-surface);border-radius:16px;border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
           <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-[14px]" style="color:var(--color-text)">Upcoming</h3>
              <NuxtLink to="/dashboard/schedule" class="text-[12px] font-bold" style="color:var(--color-primary)">View all</NuxtLink>
           </div>
           
           <div class="space-y-4">
              <div v-if="upcomingItems.length === 0" class="text-[12px] py-2" style="color:var(--color-text-muted)">No upcoming items.</div>
              <div v-for="(item, idx) in upcomingItems" :key="item.id" class="flex gap-3 items-center"
                 :style="idx !== upcomingItems.length - 1 ? 'padding-bottom:16px;border-bottom:1px solid var(--color-border)' : ''">
                 <div class="w-[38px] text-center flex-shrink-0 flex flex-col justify-center pr-3" style="border-right:1px solid var(--color-border)">
                    <span class="text-[18px] font-bold leading-none" style="color:var(--color-text)">{{ getDayMonth(item.date).day }}</span>
                    <span class="text-[9px] font-bold uppercase tracking-widest mt-0.5" style="color:var(--color-text-muted)">{{ getDayMonth(item.date).month }}</span>
                 </div>
                 <div class="min-w-0 flex-1">
                    <p class="text-[13px] font-bold truncate" style="color:var(--color-text)">{{ item.title }}</p>
                    <p class="text-[11px] font-medium mt-0.5" style="color:var(--color-text-muted)">{{ formatDateShort(item.date) }} • {{ formatTime(item.date.toISOString()) || '10:00 AM' }}</p>
                 </div>
                 <span class="text-[10px] px-2 py-0.5 font-bold whitespace-nowrap uppercase" :class="getDaysUntilClass(item.date)" style="border-radius:5px">
                    {{ getDaysUntil(item.date) }}
                 </span>
              </div>
           </div>
        </div>

        <!-- Recent Courses -->
        <div class="p-5" style="background:var(--color-surface);border-radius:16px;border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
          <div class="flex items-center justify-between mb-4">
             <h3 class="font-bold text-[14px]" style="color:var(--color-text)">Recent Courses</h3>
             <NuxtLink to="/dashboard/courses" class="text-[12px] font-bold" style="color:var(--color-primary)">View all</NuxtLink>
          </div>
          <div class="space-y-4">
             <div v-if="courses.length === 0" class="text-[12px] py-2" style="color:var(--color-text-muted)">No recent courses.</div>
             <div v-for="course in courses" :key="course._id" class="flex items-center gap-3">
               <div class="flex size-[38px] flex-shrink-0 items-center justify-center" style="border-radius:10px;background:color-mix(in srgb,var(--color-primary) 10%,transparent);color:var(--color-primary)">
                 <UIcon name="i-lucide-book-open" class="size-4" />
               </div>
               <div class="min-w-0 flex-1">
                 <p class="text-[13px] font-bold truncate" style="color:var(--color-text)">{{ course.title }}</p>
                 <p class="text-[11px] mt-0.5" style="color:var(--color-text-muted)">{{ course.teacher || 'Prof. Smith' }} • {{ course.semester || 'Fall 2024' }}</p>
                 <div class="mt-2 w-full h-[5px] rounded-full overflow-hidden" style="background:var(--color-border)">
                    <div class="h-full rounded-full" style="background:var(--color-success)" :style="`width:${course.progress||75}%`"></div>
                 </div>
               </div>
               <span class="text-[12px] font-bold flex-shrink-0" style="color:var(--color-text-muted)">{{ course.progress||75 }}%</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<style scoped>
/* Cards */
.stat-card    { background: var(--color-surface); }
.card-lg      { background: var(--color-surface); border-radius: 16px; border: 1px solid var(--color-border); box-shadow: var(--shadow-card); }
.ai-panel     { background: color-mix(in srgb,var(--color-primary) 5%,var(--color-surface)); border-radius: 12px; border: 1px solid var(--color-border); }
.file-item    { border-radius: 10px; border: 1px solid var(--color-border); background: var(--color-surface); box-shadow: var(--shadow-sm); }
.plan-item         { border-radius: 10px; border: 1px solid var(--color-border); background: var(--color-surface); box-shadow: var(--shadow-sm); }
.plan-item--study  { border-style: dashed; border-color: var(--color-primary) !important; background: color-mix(in srgb,var(--color-primary) 6%,transparent) !important; box-shadow: none; }
.ai-plan-item { background: var(--color-surface); }

/* Stat icons */
.icon-base    { border-radius: 8px; }
.icon-info    { background: color-mix(in srgb,var(--color-info) 10%,transparent);    color: var(--color-info); }
.icon-warning { background: color-mix(in srgb,var(--color-warning) 12%,transparent); color: var(--color-warning); }
.icon-primary { background: color-mix(in srgb,var(--color-primary) 10%,transparent); color: var(--color-primary); }
.icon-success { background: color-mix(in srgb,var(--color-success) 10%,transparent); color: var(--color-success); }

/* Plan type icons */
.plan-icon          { border-radius: 8px; }
.plan-icon--course  { color: #2563eb; background: #eff6ff; }
.plan-icon--td      { color: #059669; background: #ecfdf5; }
.plan-icon--study   { color: var(--color-primary); background: color-mix(in srgb,var(--color-primary) 10%,transparent); }
.plan-icon--exam    { color: #ea580c; background: #fff7ed; }
.plan-icon--default { color: var(--color-text-muted); background: var(--color-border); }

/* File type icons */
.file-icon        { border-radius: 12px; }
.file-icon--pdf   { background: #fef2f2; color: #ef4444; }
.file-icon--xlsx  { background: #f0fdf4; color: #22c55e; }
.file-icon--docx  { background: #eff6ff; color: #3b82f6; }
.file-icon--other { background: var(--color-border); color: var(--color-text-muted); }

/* Text colors */
.text-soft    { color: var(--color-text-soft); }
.text-main    { color: var(--color-text); }
.text-muted   { color: var(--color-text-muted); }
.text-primary { color: var(--color-primary); }
.text-success { color: var(--color-success); }
.text-danger  { color: var(--color-danger); }

/* Timeline */
.timeline-line { background: var(--color-border); }
.time-label    { color: var(--color-text-soft); background: var(--color-surface); }
.dot-bg        { background: var(--color-surface); }
.plan-title--study    { color: var(--color-primary); }
.plan-title--normal   { color: var(--color-text); }
.plan-sub--study      { color: var(--color-primary); opacity: 0.7; }
.plan-sub--normal     { color: var(--color-text-muted); }

/* Course icon */
.course-icon { border-radius: 12px; background: color-mix(in srgb,var(--color-primary) 10%,transparent); color: var(--color-primary); box-shadow: var(--shadow-sm); }

/* Chat suggestions */
.chat-suggestion  { border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-surface); box-shadow: var(--shadow-sm); }
.suggestion-icon  { border-radius: 6px; background: color-mix(in srgb,var(--color-primary) 10%,transparent); color: var(--color-primary); }

/* Chat messages */
.msg-user { border-radius: 14px; background: var(--color-primary);  color: #fff; box-shadow: var(--shadow-sm); }
.msg-ai   { border-radius: 14px; background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text); box-shadow: var(--shadow-sm); }

/* Chat input */
.chat-input { border-radius: 12px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); }
.send-btn   { border-radius: 8px; background: var(--color-primary); }

/* Upcoming */
.upcoming-item--bordered { padding-bottom: 20px; border-bottom: 1px solid var(--color-border); }
.date-divider { border-right: 1px solid var(--color-border); }
.badge { border-radius: 6px; }
</style>