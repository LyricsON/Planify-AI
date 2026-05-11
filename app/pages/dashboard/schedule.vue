<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
const { get } = useApi()
const schedules = ref<any[]>([])
const tasks = ref<any[]>([])
const exams = ref<any[]>([])
const courses = ref<any[]>([])
const isLoading = ref(true)
const view = ref<'week' | 'day'>('week')
const activeTab = ref<'overview' | 'exams' | 'tasks'>('overview')

const today = new Date()
const weekDays = computed(() => {
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay() + 1)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
})

const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const fmtTime = (s: string) => new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
const isToday = (d: Date) => d.toDateString() === today.toDateString()

function dayEvents(d: Date) {
  return schedules.value.filter(s => new Date(s.start).toDateString() === d.toDateString())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
}

const typeColor = (t: string) => ({ course: '#3b82f6', td: '#10b981', tp: '#10b981', exam: '#f59e0b', study_session: 'var(--color-primary)', task: '#f97316' }[t] || '#64748b')
const typeBg = (t: string) => ({ course: '#eff6ff', td: '#f0fdf4', tp: '#f0fdf4', exam: '#fffbeb', study_session: 'color-mix(in srgb,var(--color-primary) 10%,transparent)', task: '#fff7ed' }[t] || 'var(--color-border)')

const upcomingExams = computed(() => exams.value.filter(e => new Date(e.examDate) >= new Date()).sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime()).slice(0, 5))
const pendingTasks = computed(() => tasks.value.filter(t => t.status !== 'completed').sort((a, b) => (a.priority === 'high' ? 0 : 1) - (b.priority === 'high' ? 0 : 1)))
const overdueTasks = computed(() => tasks.value.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed'))

const daysUntil = (d: string) => {
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 0) return 'Passed'
  return `In ${diff}d`
}

async function load() {
  isLoading.value = true
  const [sR, tR, eR, cR] = await Promise.all([
    get<any>('/schedules'), get<any>('/tasks'), get<any>('/exams'), get<any>('/courses')
  ])
  if (sR.success) schedules.value = Array.isArray(sR.data) ? sR.data : sR.data?.data || []
  if (tR.success) tasks.value = Array.isArray(tR.data) ? tR.data : tR.data?.data || []
  if (eR.success) exams.value = Array.isArray(eR.data) ? eR.data : eR.data?.data || []
  if (cR.success) courses.value = Array.isArray(cR.data) ? cR.data : cR.data?.data || []
  isLoading.value = false
}

onMounted(load)
</script>

<template>
  <section class="max-w-[1400px] mx-auto pb-10">
    <div class="flex items-center justify-end mb-6">
      <div class="flex items-center gap-2">
        <button
          class="px-3 py-1.5 text-[12px] font-bold transition"
          :style="view==='week'?'border-radius:8px;background:var(--color-primary);color:#fff':'border-radius:8px;background:var(--color-surface);border:1px solid var(--color-border);color:var(--color-text)'"
          @click="view='week'"
        >
          Week
        </button>
        <button
          class="px-3 py-1.5 text-[12px] font-bold transition"
          :style="view==='day'?'border-radius:8px;background:var(--color-primary);color:#fff':'border-radius:8px;background:var(--color-surface);border:1px solid var(--color-border);color:var(--color-text)'"
          @click="view='day'"
        >
          Day
        </button>
      </div>
    </div>

    <div
      v-if="isLoading"
      class="flex items-center justify-center py-20"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin"
        style="color:var(--color-primary)"
      />
    </div>

    <div
      v-else
      class="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6"
    >
      <!-- Calendar -->
      <div class="flex flex-col gap-4">
        <!-- Week grid -->
        <div
          class="overflow-x-auto"
          style="border-radius:16px;border:1px solid var(--color-border);background:var(--color-surface);box-shadow:var(--shadow-card)"
        >
          <div class="min-w-[640px]">
            <!-- Day headers -->
            <div
              class="grid grid-cols-7 border-b"
              style="border-color:var(--color-border)"
            >
              <div
                v-for="d in weekDays"
                :key="d.toISOString()"
                class="py-3 text-center"
                :style="isToday(d)?'background:color-mix(in srgb,var(--color-primary) 8%,transparent)':''"
              >
                <p
                  class="text-[11px] font-bold uppercase tracking-wide"
                  style="color:var(--color-text-muted)"
                >
                  {{ d.toLocaleDateString('en-GB', { weekday: 'short' }) }}
                </p>
                <p
                  class="text-[18px] font-bold mt-0.5"
                  :style="isToday(d)?'color:var(--color-primary)':'color:var(--color-text)'"
                >
                  {{ d.getDate() }}
                </p>
                <p
                  class="text-[10px]"
                  style="color:var(--color-text-muted)"
                >
                  {{ d.toLocaleDateString('en-GB', { month: 'short' }) }}
                </p>
              </div>
            </div>
            <!-- Events -->
            <div class="grid grid-cols-7 min-h-[200px] p-2 gap-1">
              <div
                v-for="d in weekDays"
                :key="d.toISOString()"
                class="flex flex-col gap-1 p-1"
                :style="isToday(d)?'border-radius:8px;background:color-mix(in srgb,var(--color-primary) 4%,transparent)':''"
              >
                <div
                  v-for="ev in dayEvents(d)"
                  :key="ev._id"
                  class="px-2 py-1.5 text-[11px] font-bold truncate cursor-pointer"
                  :style="`border-radius:6px;background:${typeBg(ev.type)};color:${typeColor(ev.type)}`"
                >
                  {{ fmtTime(ev.start) }} {{ ev.title }}
                </div>
                <div
                  v-if="!dayEvents(d).length"
                  class="flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- AI Suggestions -->
        <div
          class="p-5"
          style="border-radius:16px;background:color-mix(in srgb,var(--color-primary) 5%,var(--color-surface));border:1px solid var(--color-border)"
        >
          <div class="flex items-center gap-2 mb-3">
            <UIcon
              name="i-lucide-sparkles"
              class="size-4"
              style="color:var(--color-primary)"
            />
            <h3
              class="text-[14px] font-bold"
              style="color:var(--color-primary)"
            >
              AI Schedule Suggestions
            </h3>
            <span
              class="text-[11px]"
              style="color:var(--color-text-muted)"
            >Based on your courses, deadlines and study habits.</span>
          </div>
          <div
            class="flex items-start gap-3 p-3"
            style="border-radius:10px;background:var(--color-surface);border:1px solid var(--color-border)"
          >
            <UIcon
              name="i-lucide-calendar-plus"
              class="size-4 mt-0.5 flex-shrink-0"
              style="color:var(--color-primary)"
            />
            <div>
              <p
                class="text-[13px] font-bold"
                style="color:var(--color-text)"
              >
                Optimize Study Blocks
              </p>
              <p
                class="text-[12px]"
                style="color:var(--color-text-muted)"
              >
                Add a 90-min deep work block on Tuesday afternoon.
              </p>
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex flex-wrap gap-4 px-1">
          <div
            v-for="l in [{ c: '#3b82f6', l: 'Classes' }, { c: '#f59e0b', l: 'Exams' }, { c: '#f97316', l: 'Tasks' }, { c: 'var(--color-primary)', l: 'Study Sessions' }]"
            :key="l.l"
            class="flex items-center gap-1.5"
          >
            <div
              class="size-2.5 rounded-full"
              :style="`background:${l.c}`"
            />
            <span
              class="text-[12px] font-medium"
              style="color:var(--color-text-muted)"
            >{{ l.l }}</span>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="flex flex-col gap-4">
        <!-- Upcoming Exams -->
        <div
          class="p-5"
          style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)"
        >
          <h3
            class="text-[14px] font-bold mb-3"
            style="color:var(--color-text)"
          >
            Upcoming Exams
          </h3>
          <div
            v-if="!upcomingExams.length"
            class="text-[13px] py-2 text-center"
            style="color:var(--color-text-muted)"
          >
            No upcoming exams.
          </div>
          <div class="space-y-3">
            <div
              v-for="e in upcomingExams"
              :key="e._id"
              class="flex items-center gap-3"
            >
              <div class="w-[40px] text-center flex-shrink-0">
                <p
                  class="text-[18px] font-bold leading-none"
                  style="color:var(--color-text)"
                >
                  {{ new Date(e.examDate).getDate() }}
                </p>
                <p
                  class="text-[10px] font-bold uppercase"
                  style="color:var(--color-text-muted)"
                >
                  {{ new Date(e.examDate).toLocaleDateString('en-GB', { month: 'short' }) }}
                </p>
              </div>
              <div class="min-w-0 flex-1">
                <p
                  class="text-[13px] font-bold truncate"
                  style="color:var(--color-text)"
                >
                  {{ e.title }}
                </p>
                <p
                  class="text-[11px]"
                  style="color:var(--color-text-muted)"
                >
                  {{ e.courseId?.title||'Exam' }}
                </p>
              </div>
              <span
                class="text-[10px] font-bold px-2 py-0.5 whitespace-nowrap"
                style="border-radius:5px;background:#fffbeb;color:#f59e0b"
              >{{ daysUntil(e.examDate) }}</span>
            </div>
          </div>
        </div>

        <!-- Deadlines -->
        <div
          class="p-5"
          style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)"
        >
          <div class="flex items-center justify-between mb-3">
            <h3
              class="text-[14px] font-bold"
              style="color:var(--color-text)"
            >
              Upcoming Deadlines
            </h3>
            <NuxtLink
              to="/dashboard/tasks"
              class="text-[12px] font-bold"
              style="color:var(--color-primary)"
            >View all</NuxtLink>
          </div>
          <div
            v-if="!pendingTasks.length"
            class="text-[13px] py-2 text-center"
            style="color:var(--color-text-muted)"
          >
            No pending tasks.
          </div>
          <div class="space-y-2">
            <div
              v-for="t in pendingTasks.slice(0, 4)"
              :key="t._id"
              class="flex items-center gap-2 p-2.5"
              style="border-radius:8px;background:var(--color-bg,#f8fafc);border:1px solid var(--color-border)"
            >
              <div
                class="size-2 rounded-full flex-shrink-0"
                :style="t.priority==='high'?'background:var(--color-danger)':t.priority==='medium'?'background:var(--color-warning)':'background:var(--color-success)'"
              />
              <p
                class="text-[13px] font-medium truncate flex-1"
                style="color:var(--color-text)"
              >
                {{ t.title }}
              </p>
            </div>
          </div>
        </div>

        <!-- Workload balance -->
        <div
          class="p-5"
          style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)"
        >
          <h3
            class="text-[14px] font-bold mb-3"
            style="color:var(--color-text)"
          >
            Workload Balance
          </h3>
          <div class="space-y-2.5">
            <div
              v-for="d in weekDays.slice(0, 5)"
              :key="d.toISOString()"
            >
              <div class="flex items-center justify-between mb-1">
                <span
                  class="text-[11px] font-bold"
                  style="color:var(--color-text-muted)"
                >{{ d.toLocaleDateString('en-GB', { weekday: 'short' }) }}</span>
                <span
                  class="text-[11px]"
                  style="color:var(--color-text-muted)"
                >{{ dayEvents(d).length }} events</span>
              </div>
              <div
                class="h-1.5 w-full overflow-hidden"
                style="border-radius:99px;background:var(--color-border)"
              >
                <div
                  class="h-full transition-all"
                  :style="`width:${Math.min(100, dayEvents(d).length*20)}%;border-radius:99px;background:${dayEvents(d).length>3?'var(--color-danger)':dayEvents(d).length>1?'var(--color-warning)':'var(--color-success)'}`"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
