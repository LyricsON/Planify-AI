<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
const { get, post, put } = useApi()
const tasks = ref<any[]>([])
const exams = ref<any[]>([])
const courses = ref<any[]>([])
const isLoading = ref(true)
const activeTab = ref<'overview' | 'exams' | 'tasks'>('overview')
const taskFilter = ref<'all' | 'todo' | 'in_progress' | 'completed'>('all')
const showAddTask = ref(false)
const newTask = ref({ title: '', priority: 'medium', deadline: '', courseId: '', description: '' })

const filteredTasks = computed(() => tasks.value.filter(t => taskFilter.value === 'all' || t.status === taskFilter.value))
const upcomingExams = computed(() => exams.value.filter(e => new Date(e.examDate) >= new Date()).sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime()))
const overdueTasks = computed(() => tasks.value.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed'))

const stats = computed(() => ({
  total: tasks.value.length,
  completed: tasks.value.filter(t => t.status === 'completed').length,
  inProgress: tasks.value.filter(t => t.status === 'in_progress').length,
  overdue: overdueTasks.value.length
}))

const daysUntil = (d: string) => {
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 0) return 'Passed'
  return `In ${diff}d`
}

const priorityStyle = (p: string) => ({ high: 'background:#fef2f2;color:#ef4444', medium: 'background:#fffbeb;color:#f59e0b', low: 'background:#f0fdf4;color:#22c55e' }[p] || '')
const statusStyle = (s: string) => ({ completed: 'background:#f0fdf4;color:#22c55e', in_progress: 'background:#eff6ff;color:#3b82f6', todo: 'background:var(--color-border);color:var(--color-text-muted)' }[s] || '')

async function load() {
  isLoading.value = true
  const [tR, eR, cR] = await Promise.all([get<any>('/tasks'), get<any>('/exams'), get<any>('/courses')])
  if (tR.success) tasks.value = Array.isArray(tR.data) ? tR.data : tR.data?.data || []
  if (eR.success) exams.value = Array.isArray(eR.data) ? eR.data : eR.data?.data || []
  if (cR.success) courses.value = Array.isArray(cR.data) ? cR.data : cR.data?.data || []
  isLoading.value = false
}

async function toggleTask(t: any) {
  const newStatus = t.status === 'completed' ? 'todo' : 'completed'
  await put(`/tasks/${t._id}`, { status: newStatus })
  t.status = newStatus
}

async function addTask() {
  if (!newTask.value.title.trim()) return
  await post('/tasks', newTask.value)
  showAddTask.value = false
  newTask.value = { title: '', priority: 'medium', deadline: '', courseId: '', description: '' }
  await load()
}

onMounted(load)
</script>

<template>
  <section class="max-w-[1400px] mx-auto pb-10">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1
          class="text-[24px] font-bold"
          style="color:var(--color-text)"
        >
          Tasks & Exams
        </h1>
        <p
          class="text-[13px] mt-0.5"
          style="color:var(--color-text-muted)"
        >
          Stay on top of your deadlines and focus on what matters.
        </p>
      </div>
      <button
        class="flex items-center gap-2 px-4 py-2 text-[13px] font-bold text-white"
        style="border-radius:10px;background:var(--color-primary)"
        @click="showAddTask=true"
      >
        <UIcon
          name="i-lucide-plus"
          class="size-4"
        /> Add Task
      </button>
    </div>

    <!-- Tabs -->
    <div
      class="flex gap-1 mb-6 p-1"
      style="border-radius:12px;background:var(--color-border);width:fit-content"
    >
      <button
        v-for="tab in [{ k: 'overview', l: 'Overview' }, { k: 'exams', l: 'Exams' }, { k: 'tasks', l: 'Tasks' }]"
        :key="tab.k"
        class="px-4 py-1.5 text-[13px] font-bold transition"
        :style="activeTab===tab.k?'border-radius:8px;background:var(--color-surface);color:var(--color-primary);box-shadow:var(--shadow-sm)':'color:var(--color-text-muted)'"
        @click="activeTab=tab.k as any"
      >
        {{ tab.l }}
      </button>
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

    <!-- Overview Tab -->
    <div
      v-else-if="activeTab==='overview'"
      class="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6"
    >
      <div class="flex flex-col gap-5">
        <!-- Stats row -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="s in [{ l: 'Total Tasks', v: stats.total, i: 'i-lucide-list-checks', c: 'info' }, { l: 'Completed', v: stats.completed, i: 'i-lucide-check-circle-2', c: 'success' }, { l: 'In Progress', v: stats.inProgress, i: 'i-lucide-loader', c: 'primary' }, { l: 'Overdue', v: stats.overdue, i: 'i-lucide-alert-circle', c: 'danger' }]"
            :key="s.l"
            class="p-4"
            style="border-radius:12px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)"
          >
            <div class="flex items-center gap-2 mb-3">
              <div
                class="flex size-8 items-center justify-center"
                :style="`border-radius:8px;background:color-mix(in srgb,var(--color-${s.c}) 12%,transparent);color:var(--color-${s.c})`"
              >
                <UIcon
                  :name="s.i"
                  class="size-4"
                />
              </div>
              <p
                class="text-[12px] font-bold"
                style="color:var(--color-text-soft)"
              >
                {{ s.l }}
              </p>
            </div>
            <p
              class="text-[28px] font-bold leading-none"
              style="color:var(--color-text)"
            >
              {{ s.v }}
            </p>
          </div>
        </div>

        <!-- High priority tasks -->
        <div
          class="p-5"
          style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)"
        >
          <div class="flex items-center justify-between mb-4">
            <h3
              class="text-[15px] font-bold"
              style="color:var(--color-text)"
            >
              High Priority
            </h3>
            <span
              class="text-[11px] font-bold px-2 py-0.5"
              style="border-radius:5px;background:#fef2f2;color:#ef4444"
            >{{ tasks.filter(t => t.priority==='high'&&t.status!=='completed').length }} tasks</span>
          </div>
          <div class="space-y-2">
            <div
              v-for="t in tasks.filter(t => t.priority==='high'&&t.status!=='completed').slice(0, 4)"
              :key="t._id"
              class="flex items-center gap-3 p-3"
              style="border-radius:10px;border:1px solid var(--color-border);background:color-mix(in srgb,var(--color-danger) 4%,transparent)"
            >
              <button
                class="size-5 flex-shrink-0 flex items-center justify-center"
                style="border-radius:50%;border:2px solid var(--color-danger)"
                @click="toggleTask(t)"
              >
                <UIcon
                  v-if="t.status==='completed'"
                  name="i-lucide-check"
                  class="size-3"
                  style="color:var(--color-danger)"
                />
              </button>
              <p
                class="flex-1 text-[13px] font-bold truncate"
                style="color:var(--color-text)"
              >
                {{ t.title }}
              </p>
              <span
                v-if="t.deadline"
                class="text-[11px] font-bold px-2 py-0.5"
                style="border-radius:5px;background:#fef2f2;color:#ef4444"
              >{{ daysUntil(t.deadline) }}</span>
            </div>
            <div
              v-if="!tasks.filter(t => t.priority==='high'&&t.status!=='completed').length"
              class="py-4 text-center text-[13px]"
              style="color:var(--color-text-muted)"
            >
              No high priority tasks 🎉
            </div>
          </div>
        </div>

        <!-- In Progress -->
        <div
          class="p-5"
          style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)"
        >
          <h3
            class="text-[15px] font-bold mb-4"
            style="color:var(--color-text)"
          >
            In Progress
          </h3>
          <div class="space-y-2">
            <div
              v-for="t in tasks.filter(t => t.status==='in_progress').slice(0, 4)"
              :key="t._id"
              class="flex items-center gap-3 p-3"
              style="border-radius:10px;border:1px solid var(--color-border)"
            >
              <button
                class="size-5 flex-shrink-0 flex items-center justify-center"
                style="border-radius:50%;border:2px solid #3b82f6"
                @click="toggleTask(t)"
              />
              <p
                class="flex-1 text-[13px] font-medium truncate"
                style="color:var(--color-text)"
              >
                {{ t.title }}
              </p>
              <span
                class="text-[11px] px-2 py-0.5 font-bold"
                style="border-radius:5px;background:#eff6ff;color:#3b82f6"
              >In Progress</span>
            </div>
            <div
              v-if="!tasks.filter(t => t.status==='in_progress').length"
              class="py-3 text-center text-[13px]"
              style="color:var(--color-text-muted)"
            >
              No tasks in progress.
            </div>
          </div>
        </div>
      </div>

      <!-- Right sidebar -->
      <div class="flex flex-col gap-4">
        <!-- Upcoming exams -->
        <div
          class="p-5"
          style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)"
        >
          <div class="flex items-center justify-between mb-3">
            <h3
              class="text-[14px] font-bold"
              style="color:var(--color-text)"
            >
              Upcoming Exams
            </h3>
            <NuxtLink
              to="/dashboard/schedule"
              class="text-[12px] font-bold"
              style="color:var(--color-primary)"
            >Calendar</NuxtLink>
          </div>
          <div class="space-y-3">
            <div
              v-for="e in upcomingExams.slice(0, 5)"
              :key="e._id"
              class="flex items-center gap-3 p-2.5"
              style="border-radius:10px;border:1px solid var(--color-border)"
            >
              <div
                class="w-[38px] text-center flex-shrink-0 border-r pr-3"
                style="border-color:var(--color-border)"
              >
                <p
                  class="text-[16px] font-bold leading-none"
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
            </div>
            <div
              v-if="!upcomingExams.length"
              class="py-3 text-center text-[13px]"
              style="color:var(--color-text-muted)"
            >
              No upcoming exams.
            </div>
          </div>
        </div>

        <!-- AI Recommendations -->
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
              class="text-[13px] font-bold"
              style="color:var(--color-primary)"
            >
              AI Focus Recommendations
            </h3>
          </div>
          <ul class="space-y-2">
            <li
              v-for="r in tasks.filter(t => t.priority==='high').slice(0, 3)"
              :key="r._id"
              class="flex items-start gap-2 text-[12px]"
              style="color:var(--color-text-soft)"
            >
              <UIcon
                name="i-lucide-arrow-right"
                class="size-3.5 mt-0.5 flex-shrink-0"
                style="color:var(--color-primary)"
              />{{ r.title }}
            </li>
            <li
              v-if="!tasks.filter(t => t.priority==='high').length"
              class="text-[12px]"
              style="color:var(--color-text-muted)"
            >
              Focus on completing in-progress tasks first.
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Exams Tab -->
    <div
      v-else-if="activeTab==='exams'"
      class="flex flex-col gap-4"
    >
      <div
        v-if="!upcomingExams.length"
        class="flex flex-col items-center py-16"
        style="color:var(--color-text-muted)"
      >
        <UIcon
          name="i-lucide-calendar-x"
          class="size-12 opacity-30 mb-3"
        />
        <p class="text-[14px]">
          No upcoming exams
        </p>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="e in exams"
          :key="e._id"
          class="p-5"
          style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-sm)"
        >
          <div class="flex items-start justify-between mb-3">
            <div
              class="flex size-[42px] items-center justify-center"
              style="border-radius:10px;background:#fffbeb;color:#f59e0b"
            >
              <UIcon
                name="i-lucide-clipboard-check"
                class="size-5"
              />
            </div>
            <span
              class="text-[11px] font-bold px-2 py-0.5"
              style="border-radius:5px;background:#fffbeb;color:#f59e0b"
            >{{ daysUntil(e.examDate) }}</span>
          </div>
          <h3
            class="text-[14px] font-bold mb-1"
            style="color:var(--color-text)"
          >
            {{ e.title }}
          </h3>
          <p
            class="text-[12px] mb-2"
            style="color:var(--color-text-muted)"
          >
            {{ e.courseId?.title||'Course' }}
          </p>
          <p
            class="text-[12px] font-bold"
            style="color:var(--color-text-soft)"
          >
            {{ new Date(e.examDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) }}
          </p>
          <p
            v-if="e.location"
            class="text-[12px] mt-0.5"
            style="color:var(--color-text-muted)"
          >
            📍 {{ e.location }}
          </p>
        </div>
      </div>
    </div>

    <!-- Tasks Tab -->
    <div
      v-else
      class="flex flex-col gap-4"
    >
      <div class="flex items-center gap-2">
        <button
          v-for="f in ['all', 'todo', 'in_progress', 'completed']"
          :key="f"
          class="px-3 py-1.5 text-[12px] font-bold capitalize transition"
          :style="taskFilter===f?'border-radius:8px;background:var(--color-primary);color:#fff':'border-radius:8px;background:var(--color-surface);border:1px solid var(--color-border);color:var(--color-text)'"
          @click="taskFilter=f as any"
        >
          {{ f.replace('_', ' ') }}
        </button>
      </div>
      <div class="flex flex-col gap-2">
        <div
          v-for="t in filteredTasks"
          :key="t._id"
          class="flex items-center gap-3 p-4"
          style="border-radius:12px;background:var(--color-surface);border:1px solid var(--color-border)"
        >
          <button
            class="size-5 flex-shrink-0 flex items-center justify-center transition"
            :style="t.status==='completed'?'border-radius:50%;background:var(--color-success);color:#fff':'border-radius:50%;border:2px solid var(--color-border)'"
            @click="toggleTask(t)"
          >
            <UIcon
              v-if="t.status==='completed'"
              name="i-lucide-check"
              class="size-3"
            />
          </button>
          <div class="min-w-0 flex-1">
            <p
              class="text-[13px] font-bold truncate"
              :style="t.status==='completed'?'color:var(--color-text-muted);text-decoration:line-through':'color:var(--color-text)'"
            >
              {{ t.title }}
            </p>
            <p
              v-if="t.deadline"
              class="text-[11px] mt-0.5"
              style="color:var(--color-text-muted)"
            >
              Due: {{ new Date(t.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }}
            </p>
          </div>
          <span
            class="text-[11px] font-bold px-2 py-0.5"
            :style="`border-radius:5px;${priorityStyle(t.priority)}`"
          >{{ t.priority }}</span>
          <span
            class="text-[11px] font-bold px-2 py-0.5"
            :style="`border-radius:5px;${statusStyle(t.status)}`"
          >{{ t.status?.replace('_', ' ') }}</span>
        </div>
        <div
          v-if="!filteredTasks.length"
          class="py-10 text-center text-[14px]"
          style="color:var(--color-text-muted)"
        >
          No tasks found.
        </div>
      </div>
    </div>

    <!-- Add Task Modal -->
    <div
      v-if="showAddTask"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      style="background:rgba(0,0,0,0.4)"
    >
      <div
        class="w-full max-w-md p-6"
        style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border)"
      >
        <h2
          class="text-[16px] font-bold mb-4"
          style="color:var(--color-text)"
        >
          Add New Task
        </h2>
        <div class="space-y-3">
          <input
            v-model="newTask.title"
            placeholder="Task title"
            class="w-full h-[40px] px-3 text-[13px] focus:outline-none"
            style="border-radius:8px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text)"
          >
          <select
            v-model="newTask.priority"
            class="w-full h-[40px] px-3 text-[13px] focus:outline-none"
            style="border-radius:8px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text)"
          >
            <option value="low">
              Low Priority
            </option>
            <option value="medium">
              Medium Priority
            </option>
            <option value="high">
              High Priority
            </option>
          </select>
          <input
            v-model="newTask.deadline"
            type="date"
            class="w-full h-[40px] px-3 text-[13px] focus:outline-none"
            style="border-radius:8px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text)"
          >
          <select
            v-model="newTask.courseId"
            class="w-full h-[40px] px-3 text-[13px] focus:outline-none"
            style="border-radius:8px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text)"
          >
            <option value="">
              No course
            </option>
            <option
              v-for="c in courses"
              :key="c._id"
              :value="c._id"
            >
              {{ c.title }}
            </option>
          </select>
        </div>
        <div class="flex gap-3 mt-5">
          <button
            class="flex-1 py-2 text-[13px] font-bold"
            style="border-radius:8px;border:1px solid var(--color-border);color:var(--color-text)"
            @click="showAddTask=false"
          >
            Cancel
          </button>
          <button
            class="flex-1 py-2 text-[13px] font-bold text-white"
            style="border-radius:8px;background:var(--color-primary)"
            @click="addTask"
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
