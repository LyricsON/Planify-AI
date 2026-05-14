<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

// ── Types ────────────────────────────────────────────────────────────────────
interface ApiEvent {
  _id: string; title: string; type: string
  start: string; end: string
  location?: string; description?: string
  courseId?: { _id: string; title: string } | string
  taskId?: string; examId?: string
  status: string; color?: string
}

interface CalEvent {
  id: string; title: string; subtitle?: string
  type: string; day: number; start: number; end: number; allDay?: boolean
}

// ── Constants ────────────────────────────────────────────────────────────────
const HOUR_H = 64
const START_H = 8
const END_H   = 21
const hours   = Array.from({ length: END_H - START_H }, (_, i) => START_H + i)

const view = ref<'day'|'week'|'month'>('week')
const today = new Date()
const weekStart = ref(getWeekStart(today))
const activeFilters = ref(['course','td','tp','exam','study_session','task','break','personal','other'])
const showQuickAdd = ref(false)
const isRegen = ref(false)

function getWeekStart(d: Date) {
  const r = new Date(d); const day = r.getDay()
  r.setDate(r.getDate() - day + (day === 0 ? -6 : 1)); r.setHours(0,0,0,0); return r
}

const weekDays = computed(() => Array.from({length:7},(_,i)=>{ const d=new Date(weekStart.value); d.setDate(d.getDate()+i); return d }))

const weekRange = computed(() => {
  const s = weekDays.value[0], e = weekDays.value[6]
  return `${s.getDate()} – ${e.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}`
})

const isToday = (d: Date) => d.toDateString() === today.toDateString()
const isWeekend = (d: Date) => d.getDay()===0||d.getDay()===6
const isCurrentWeek = () => weekStart.value.toDateString()===getWeekStart(today).toDateString()
const todayIdx = computed(() => weekDays.value.findIndex(d=>isToday(d)))

function prevWeek(){ const d=new Date(weekStart.value); d.setDate(d.getDate()-7); weekStart.value=d }
function nextWeek(){ const d=new Date(weekStart.value); d.setDate(d.getDate()+7); weekStart.value=d }
function goToday(){ weekStart.value=getWeekStart(today) }

const now = ref(new Date())

// ── Calendar height sync ─────────────────────────────────────────────────────
// Measure the actual rendered calendar card height and apply it to the sidebar
// so both columns share the exact same bottom edge.
const calCardRef = ref<HTMLElement | null>(null)
const sidebarH   = ref(0)
let ro: ResizeObserver | null = null

onMounted(() => {
  setInterval(() => now.value = new Date(), 60000)
  nextTick(() => {
    if (calCardRef.value) {
      sidebarH.value = calCardRef.value.offsetHeight
      ro = new ResizeObserver(entries => {
        sidebarH.value = entries[0].contentRect.height
      })
      ro.observe(calCardRef.value)
    }
  })
})
onUnmounted(() => ro?.disconnect())
const nowH = computed(()=> now.value.getHours()+now.value.getMinutes()/60)
const nowLabel = computed(()=> now.value.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}))
const nowTop = computed(()=> nowH.value>=START_H&&nowH.value<END_H ? (nowH.value-START_H)*HOUR_H : -1)

const typeMap: Record<string,{bg:string;border:string;text:string;dot:string;label:string}> = {
  course:        {bg:'bg-blue-50',   border:'border-blue-200',   text:'text-blue-700',   dot:'bg-blue-500',   label:'Classes'},
  td:            {bg:'bg-sky-50',    border:'border-sky-200',    text:'text-sky-700',    dot:'bg-sky-500',    label:'TD'},
  tp:            {bg:'bg-cyan-50',   border:'border-cyan-200',   text:'text-cyan-700',   dot:'bg-cyan-500',   label:'TP'},
  exam:          {bg:'bg-purple-50', border:'border-purple-200', text:'text-purple-700', dot:'bg-purple-500', label:'Exams'},
  study_session: {bg:'bg-emerald-50',border:'border-emerald-200',text:'text-emerald-700',dot:'bg-emerald-500',label:'Study Sessions'},
  task:          {bg:'bg-orange-50', border:'border-orange-200', text:'text-orange-700', dot:'bg-orange-500', label:'Tasks'},
  break:         {bg:'bg-slate-100', border:'border-slate-200',  text:'text-slate-500',  dot:'bg-slate-400',  label:'Breaks'},
  personal:      {bg:'bg-pink-50',   border:'border-pink-200',   text:'text-pink-700',   dot:'bg-pink-500',   label:'Personal'},
  other:         {bg:'bg-slate-50',  border:'border-slate-200',  text:'text-slate-600',  dot:'bg-slate-400',  label:'Other'},
}
const tc = (t:string) => typeMap[t] || typeMap.other

// Filter chips use the actual API type values
const chips = ['course','td','tp','exam','study_session','task','break','personal']
const toggleFilter = (t:string) => { const i=activeFilters.value.indexOf(t); i>-1?activeFilters.value.splice(i,1):activeFilters.value.push(t) }

// ── All Types dropdown ─────────────────────────────────────────────
const showTypeDropdown = ref(false)
const selectedTypeLabel = computed(() => {
  if (activeFilters.value.length === chips.length) return 'All Types'
  if (activeFilters.value.length === 1) return tc(activeFilters.value[0]).label
  return `${activeFilters.value.length} Types`
})
function selectType(type: string | null) {
  activeFilters.value = type === null ? [...chips] : [type]
  showTypeDropdown.value = false
}

// ── API Fetch ─────────────────────────────────────────────────────────────────
const { get } = useApi()
const isLoading = ref(false)
const events = ref<CalEvent[]>([])

function apiEventToCalEvent(ev: ApiEvent): CalEvent {
  const startDate = new Date(ev.start)
  const endDate   = new Date(ev.end)

  // Find which day of the week this event falls on (0=Mon … 6=Sun)
  const weekStartMs = weekStart.value.getTime()
  const dayMs       = 86400000
  const dayIndex    = Math.floor((startDate.getTime() - weekStartMs) / dayMs)

  const startH = startDate.getHours() + startDate.getMinutes() / 60
  const endH   = endDate.getHours()   + endDate.getMinutes()   / 60

  // Subtitle: course title or location
  const subtitle = typeof ev.courseId === 'object' && ev.courseId?.title
    ? ev.courseId.title
    : ev.location || undefined

  return {
    id:       ev._id,
    title:    ev.title,
    subtitle,
    type:     ev.type,
    day:      dayIndex,
    start:    startH,
    end:      endH || startH + 1,
    allDay:   startH === 0 && endH === 0,
  }
}

async function fetchWeekEvents() {
  isLoading.value = true
  try {
    const start = weekStart.value.toISOString()
    const end   = new Date(weekStart.value.getTime() + 7 * 86400000).toISOString()
    const res   = await get<any>('/schedules', { start, end, limit: 200 })
    const raw: ApiEvent[] = Array.isArray(res.data) ? res.data : res.data?.data || []
    events.value = raw.map(apiEventToCalEvent).filter(e => e.day >= 0 && e.day < 7)
  } catch (e) {
    console.error('Failed to load schedule', e)
  } finally {
    isLoading.value = false
  }
}

// Re-fetch whenever the week changes
watch(weekStart, fetchWeekEvents, { immediate: true })

const filtered  = computed(() => events.value.filter(e => activeFilters.value.includes(e.type)))
const dayEvents = (i: number) => filtered.value.filter(e => e.day === i && !e.allDay)
const dayAllDay = (i: number) => filtered.value.filter(e => e.day === i &&  e.allDay)
const eTop      = (s: number) => (s - START_H) * HOUR_H
const eHeight   = (s: number, e: number) => Math.max((e - s) * HOUR_H - 3, 22)
const fmtH      = (h: number) => `${String(h).padStart(2,'0')}:00`
const fmtRange  = (s: number, e: number) => {
  const f=(v:number)=>`${String(Math.floor(v)).padStart(2,'0')}:${String(Math.round((v%1)*60)).padStart(2,'0')}`
  return `${f(s)} – ${f(e)}`
}

const todayAgenda = computed(()=> todayIdx.value>=0 ? filtered.value.filter(e=>e.day===todayIdx.value&&!e.allDay).sort((a,b)=>a.start-b.start) : [])

const suggestions = ref([
  {id:1,icon:'i-lucide-trending-up',title:'Optimize Study Blocks',desc:'Add a 90-min deep work block on Tue afternoon.',applied:false},
  {id:2,icon:'i-lucide-coffee',title:'Add Short Breaks',desc:'You have 3 long blocks with no breaks.',applied:false},
  {id:3,icon:'i-lucide-book-open',title:'Review Before Exams',desc:'Add a review session for your exam on Wed.',applied:false},
])
const applySuggestion = (id:number) => { const s=suggestions.value.find(x=>x.id===id); if(s)s.applied=true }
const regenerate = async () => {
  isRegen.value=true; await new Promise(r=>setTimeout(r,1400))
  suggestions.value=[
    {id:4,icon:'i-lucide-clock',title:'Morning Study Boost',desc:'Add a 60-min review at 7:30 before classes.',applied:false},
    {id:5,icon:'i-lucide-repeat',title:'Spaced Repetition',desc:'Review Algorithms flashcards every 2 days.',applied:false},
    {id:6,icon:'i-lucide-zap',title:'Focus Block Friday',desc:'Block Fri 14:00–16:00 for deep study.',applied:false},
  ]; isRegen.value=false
}

import ScheduleInsightsGrid from '~/components/schedule/ScheduleInsightsGrid.vue'
</script>

<template>
  <section class="max-w-[1600px] mx-auto pb-10">

    <!-- Controls Bar: uses same 2-col grid as main layout -->
    <div class="grid xl:grid-cols-[1fr_340px] gap-5 mb-4 items-center">

      <!-- Left col: nav, view switcher, filters grouped together on the left -->
      <div class="flex items-center justify-between gap-6">
        <!-- Navigation -->
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1.5 text-[12px] font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
            @click="goToday"
          >Today</button>
          <button class="size-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition" @click="prevWeek">
            <UIcon name="i-lucide-chevron-left" class="size-4 text-slate-600"/>
          </button>
          <button class="size-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition" @click="nextWeek">
            <UIcon name="i-lucide-chevron-right" class="size-4 text-slate-600"/>
          </button>
          <button class="flex items-center gap-1 text-[13px] font-bold text-slate-800 hover:text-indigo-600 transition">
            {{ weekRange }}
            <UIcon name="i-lucide-chevron-down" class="size-4 opacity-60"/>
          </button>
        </div>

        <!-- View switcher + Filters (above the calendar card) -->
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button v-for="v in ['Day','Week','Month']" :key="v"
              class="px-3 py-1 text-[12px] font-bold rounded-md transition"
              :class="view===v.toLowerCase() ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'"
              @click="view=v.toLowerCase() as any">{{ v }}</button>
          </div>
          <button class="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition">
            <UIcon name="i-lucide-sliders-horizontal" class="size-3.5"/>Filters
          </button>
        </div>
      </div>

      <!-- Right col: Quick Add (above the sidebar) -->
      <div class="flex items-center justify-end xl:justify-end">
        <button class="flex items-center gap-2 px-4 py-2 text-[13px] font-bold text-white rounded-xl bg-indigo-600 hover:bg-indigo-700 transition shadow-sm shadow-indigo-200" @click="showQuickAdd=true">
          <UIcon name="i-lucide-plus" class="size-4"/>Quick Add
        </button>
      </div>
    </div>

    <!-- Filter chips -->
    <div class="flex flex-wrap items-center gap-2 mb-5">
      <!-- All Types dropdown -->
      <div class="relative">
        <button
          class="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
          @click="showTypeDropdown = !showTypeDropdown">
          {{ selectedTypeLabel }}
          <UIcon name="i-lucide-chevron-down" class="size-3.5 opacity-60 transition-transform" :class="showTypeDropdown ? 'rotate-180' : ''"/>
        </button>

        <!-- Overlay to close on outside click -->
        <div v-if="showTypeDropdown" class="fixed inset-0 z-40" @click="showTypeDropdown = false"/>

        <!-- Dropdown menu -->
        <div v-if="showTypeDropdown"
          class="absolute top-full left-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden">

          <!-- All Types option -->
          <button
            class="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] font-semibold text-left hover:bg-slate-50 transition"
            :class="activeFilters.length === chips.length ? 'text-indigo-600' : 'text-slate-700'"
            @click="selectType(null)">
            <span class="size-2 rounded-full bg-slate-400 flex-shrink-0"/>
            All Types
          </button>

          <div class="my-1 border-t border-slate-100"/>

          <!-- Individual type options -->
          <button v-for="chip in chips" :key="chip"
            class="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] font-semibold text-left hover:bg-slate-50 transition"
            :class="activeFilters.length === 1 && activeFilters.includes(chip) ? 'text-indigo-600' : 'text-slate-700'"
            @click="selectType(chip)">
            <span class="size-2 rounded-full flex-shrink-0" :class="tc(chip).dot"/>
            {{ tc(chip).label }}
          </button>

        </div>
      </div>
      <button v-for="chip in chips" :key="chip"
        class="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-lg border transition"
        :class="activeFilters.includes(chip) ? 'border-slate-200 bg-white text-slate-700' : 'border-dashed border-slate-200 bg-slate-50 text-slate-400'"
        @click="toggleFilter(chip)">
        <span class="size-2 rounded-full inline-block" :class="tc(chip).dot"/>
        {{ tc(chip).label }}
      </button>
    </div>

    <!-- Main layout: calendar natural height, sidebar capped to same -->
    <div class="grid gap-5 xl:grid-cols-[1fr_340px] items-start">

      <!-- Calendar Card: frozen headers + scrollable time grid -->
      <div ref="calCardRef" class="bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-x-auto no-scrollbar">
        <!-- Loading overlay -->
        <div v-if="isLoading" class="absolute inset-0 z-20 flex items-center justify-center bg-white/80 rounded-2xl">
          <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-indigo-500"/>
        </div>

        <!-- Day headers -->
        <div class="grid border-b border-slate-100" style="grid-template-columns:56px repeat(7,1fr)">
          <div class="border-r border-slate-100"/>
          <div v-for="(day,i) in weekDays" :key="i"
            class="py-2 text-center border-r border-slate-100 last:border-r-0 flex items-center justify-center">
            <div class="inline-flex flex-col items-center px-6 py-2 rounded-[8px] transition"
                 :class="isToday(day) ? 'bg-indigo-50 border border-indigo-200' : ''">
              <!-- Day name: Mon, Tue, etc. -->
              <span class="text-[12px] font-bold leading-tight"
                    :class="isWeekend(day) ? 'text-red-500' : isToday(day) ? 'text-indigo-600' : 'text-slate-700'">
                {{ day.toLocaleDateString('en-GB',{weekday:'short'}) }}
              </span>
              <!-- Date + Month on one line -->
              <span class="text-[11px] leading-tight mt-0.5"
                    :class="isWeekend(day) ? 'text-red-400' : isToday(day) ? 'text-indigo-500' : 'text-slate-400'">
                {{ day.getDate() }} {{ day.toLocaleDateString('en-GB',{month:'short'}) }}
              </span>
            </div>
          </div>
        </div>

        <!-- All-day row -->
        <div class="grid border-b border-slate-100" style="grid-template-columns:56px repeat(7,1fr)">
          <div class="py-2 text-right pr-2 border-r border-slate-100">
            <span class="text-[10px] font-bold text-slate-400 leading-none">All-day</span>
          </div>
          <div v-for="(_,i) in weekDays" :key="i" class="px-1 py-1 min-h-[32px] border-r border-slate-100 last:border-r-0 space-y-0.5">
            <div v-for="ev in dayAllDay(i)" :key="ev.id"
              class="px-2 py-0.5 rounded-md text-[10px] font-bold truncate border"
              :class="[tc(ev.type).bg,tc(ev.type).border,tc(ev.type).text]">
              {{ ev.title }}
            </div>
          </div>
        </div>

        <!-- Time grid -->
        <div>
          <div class="flex" :style="{height: hours.length*HOUR_H+'px'}">

            <!-- Time labels -->
            <div class="relative flex-shrink-0 border-r border-slate-100" style="width:56px">
              <div v-for="(h,idx) in hours" :key="h"
                class="absolute right-2 text-[11px] font-medium text-slate-400"
                :style="{top: idx*HOUR_H - 8 +'px'}">
                {{ fmtH(h) }}
              </div>
            </div>

            <!-- Day columns -->
            <div class="flex-1 grid grid-cols-7 relative">
              <!-- Hour lines -->
              <div v-for="(_,idx) in hours" :key="idx"
                class="absolute left-0 right-0 border-t border-slate-100 pointer-events-none"
                :style="{top: idx*HOUR_H+'px'}"/>
              <div v-for="(_,idx) in hours" :key="'h'+idx"
                class="absolute left-0 right-0 border-t border-slate-50 pointer-events-none"
                :style="{top: (idx+0.5)*HOUR_H+'px'}"/>

              <!-- Day cells with events -->
              <div v-for="(day,dayIdx) in weekDays" :key="dayIdx"
                class="relative border-r border-slate-100 last:border-r-0"
                :class="isToday(day) ? 'bg-indigo-50/30' : ''">

                <!-- Events -->
                <div v-for="ev in dayEvents(dayIdx)" :key="ev.id"
                  class="absolute left-1 right-1 rounded-lg px-1.5 py-1 overflow-hidden cursor-pointer border hover:brightness-95 transition-all"
                  :class="[tc(ev.type).bg, tc(ev.type).border, tc(ev.type).text]"
                  :style="{top: eTop(ev.start)+'px', height: eHeight(ev.start,ev.end)+'px'}">
                  <p class="text-[11px] font-bold leading-tight truncate">{{ ev.title }}</p>
                  <p v-if="ev.subtitle && eHeight(ev.start,ev.end)>36" class="text-[10px] opacity-70 truncate">{{ ev.subtitle }}</p>
                </div>

                <!-- Current time indicator -->
                <template v-if="isToday(day)&&isCurrentWeek()&&nowTop>=0">
                  <div class="absolute left-0 right-0 z-10 pointer-events-none" :style="{top: nowTop+'px'}">
                    <div class="relative border-t-2 border-indigo-500">
                      <span class="absolute -top-3 -left-14 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">{{ nowLabel }}</span>
                      <div class="absolute -top-1.5 -left-1 size-3 rounded-full bg-indigo-600 border-2 border-white shadow"/>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right sidebar: exact same height as calendar card, measured at runtime -->
      <div class="sidebar-col flex flex-col gap-5" :style="sidebarH ? {height: sidebarH + 'px'} : {}">

        <!-- AI Suggestions (fixed height) -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex-shrink-0">
          <div class="flex items-start justify-between mb-1">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-sparkles" class="size-4 text-indigo-500"/>
              <h3 class="text-[14px] font-bold text-slate-800">AI Schedule Suggestions</h3>
            </div>
            <UIcon name="i-lucide-info" class="size-4 text-slate-400 cursor-pointer"/>
          </div>
          <p class="text-[12px] text-slate-500 mb-4">Based on your courses, deadlines, and study habits.</p>

          <div class="space-y-3">
            <div v-for="s in suggestions" :key="s.id"
              class="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
              <div class="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm">
                <UIcon :name="s.icon" class="size-4 text-indigo-500"/>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[12px] font-bold text-slate-800 leading-tight">{{ s.title }}</p>
                <p class="text-[11px] text-slate-500 mt-0.5">{{ s.desc }}</p>
              </div>
              <button
                class="flex-shrink-0 px-3 py-1 text-[11px] font-bold rounded-lg transition"
                :class="s.applied ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'"
                @click="applySuggestion(s.id)">
                {{ s.applied ? '✓ Applied' : 'Apply' }}
              </button>
            </div>
          </div>

          <button
            class="mt-4 w-full flex items-center justify-center gap-2 py-2 text-[12px] font-bold text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
            :class="isRegen ? 'opacity-60 pointer-events-none' : ''"
            @click="regenerate">
            <UIcon name="i-lucide-refresh-cw" class="size-3.5" :class="isRegen ? 'animate-spin' : ''"/>
            {{ isRegen ? 'Regenerating…' : 'Regenerate Suggestions' }}
          </button>
        </div>

        <!-- Today's Agenda: flex-1 fills remaining sidebar height -->
        <div class="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">

          <!-- Header: always visible, never scrolls -->
          <div class="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b border-slate-100">
            <h3 class="text-[14px] font-bold text-slate-800">Today's Agenda</h3>
            <button class="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 transition">View all</button>
          </div>

          <!-- List: fills remaining card height, scrolls when items overflow -->
          <div class="flex-1 overflow-y-auto no-scrollbar px-5 py-3 min-h-0">
            <div v-if="!todayAgenda.length" class="text-center text-[13px] text-slate-400 py-3">
              No events today.
            </div>
            <div v-else>
              <div v-for="(ev, idx) in todayAgenda" :key="ev.id" class="flex gap-3">

                <!-- Time column -->
                <div class="w-[44px] pt-0.5 text-right">
                  <p class="text-[11px] font-bold text-slate-700 leading-tight agenda-card">{{ fmtRange(ev.start,ev.end).split('–')[0].trim() }}</p>
                  <p class="text-[10px] text-slate-400 leading-tight agenda-card">{{ fmtRange(ev.start,ev.end).split('–')[1]?.trim() }}</p>
                </div>

                <!-- Timeline column: dot + vertical connector line -->
                <div class="flex flex-col items-center flex-shrink-0">
                  <div class="size-2.5 rounded-full mt-0.5 flex-shrink-0" :class="tc(ev.type).dot"/>
                  <div v-if="idx < todayAgenda.length - 1" class="w-px bg-slate-200 flex-1 mt-1.5 rounded-full"/>
                </div>

                <!-- Content -->
                <div class="min-w-0 flex-1" :class="idx < todayAgenda.length - 1 ? 'pb-4' : ''">
                  <p class="text-[12px] font-bold text-slate-800 truncate leading-tight agenda-card">{{ ev.title }}</p>
                  <p v-if="ev.subtitle" class="text-[11px] text-slate-400 truncate mt-0.5 agenda-card">{{ ev.subtitle }}</p>
                </div>

              </div>
            </div>
          </div>

          <!-- Footer button: always visible, never scrolls -->
          <div class="px-5 py-4 flex-shrink-0 border-t border-slate-100 bg-white">
            <button class="w-full flex items-center justify-center gap-2 py-2 text-[12px] font-bold text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-50 transition">
              <UIcon name="i-lucide-external-link" class="size-3.5"/>Open Full Agenda
            </button>
          </div>

        </div>
      </div>
    </div>

    <!-- Bottom Analytics Section -->
    <ScheduleInsightsGrid :events="filtered" />

    <!-- Quick Add Modal -->
    <div v-if="showQuickAdd" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" @click.self="showQuickAdd=false">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md border border-slate-200">
        <h2 class="text-[16px] font-bold text-slate-800 mb-4">Quick Add Event</h2>
        <div class="space-y-3">
          <input placeholder="Event title" class="w-full h-10 px-3 text-[13px] rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-400 transition"/>
          <div class="grid grid-cols-2 gap-3">
            <input type="time" class="h-10 px-3 text-[13px] rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-400 transition"/>
            <input type="time" class="h-10 px-3 text-[13px] rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-400 transition"/>
          </div>
          <select class="w-full h-10 px-3 text-[13px] rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-400 transition bg-white">
            <option v-for="c in chips" :key="c" :value="c">{{ tc(c).label }}</option>
          </select>
        </div>
        <div class="flex gap-3 mt-5">
          <button class="flex-1 py-2 text-[13px] font-bold rounded-lg border border-slate-200 hover:bg-slate-50 transition" @click="showQuickAdd=false">Cancel</button>
          <button class="flex-1 py-2 text-[13px] font-bold text-white rounded-lg bg-indigo-600 hover:bg-indigo-700 transition" @click="showQuickAdd=false">Add Event</button>
        </div>
      </div>
    </div>

  </section>
</template>

<style scoped>
/* ── Scrollbar hiding ─────────────────────────────────────────── */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/*
  Sidebar height is set inline (measured from calCardRef at runtime).
  No overflow:hidden needed — the Today's Agenda card handles its own
  internal overflow, and the sidebar's definite height prevents children
  from growing beyond it while preserving card shadows and border-radius.
*/
.sidebar-col {
  /* intentionally no overflow:hidden so card shadows/rounded corners render correctly */
}
.sidebar-col::-webkit-scrollbar { display: none; }

.agenda-card {
  margin-bottom: 0px !important;
}
</style>
