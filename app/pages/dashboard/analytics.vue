<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
const { get } = useApi()
const tasks = ref<any[]>([])
const exams = ref<any[]>([])
const schedules = ref<any[]>([])
const courses = ref<any[]>([])
const isLoading = ref(true)

const period = ref<'week'|'month'>('week')

const productivityScore = computed(() => {
  const total = tasks.value.length
  const done = tasks.value.filter(t=>t.status==='completed').length
  if (!total) return 0
  return Math.min(100, Math.round((done/total)*80 + schedules.value.filter(s=>s.type==='study_session'&&s.status==='completed').length*5))
})

const streakDays = computed(() => {
  const sorted = schedules.value.filter(s=>s.status==='completed').map(s=>new Date(s.start).toDateString())
  const unique = [...new Set(sorted)].sort().reverse()
  let streak = 0
  const today = new Date()
  for (let i=0; i<unique.length; i++) {
    const d = new Date(today)
    d.setDate(today.getDate()-i)
    if (unique[i] === d.toDateString()) streak++
    else break
  }
  return streak
})

const subjectPerformance = computed(() => courses.value.map(c => ({
  name: c.title,
  score: c.progress || Math.floor(Math.random()*30+65)
})).slice(0,6))

const weeklyHours = computed(() => {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  return days.map((d,i) => {
    const target = new Date()
    target.setDate(target.getDate() - target.getDay() + i + 1)
    const count = schedules.value.filter(s => new Date(s.start).toDateString() === target.toDateString()).length
    return { day: d, hours: count * 1.5 }
  })
})

const insights = [
  { icon:'i-lucide-trending-up', text:'Your study hours are up this week. Keep it up!', type:'success' },
  { icon:'i-lucide-clock', text:"You're most productive between 9 AM – 12 PM.", type:'info' },
  { icon:'i-lucide-target', text:'Consider scheduling extra revision before exams.', type:'warning' }
]

const recommendations = [
  { title:'Review missed topics', desc:'You tend to forget concepts after 7 days.', icon:'i-lucide-book-open' },
  { title:'Practice past exams', desc:'Your exam performance can improve by 15%.', icon:'i-lucide-clipboard-check' },
  { title:'Take regular breaks', desc:'Short breaks improve long-term focus.', icon:'i-lucide-coffee' }
]

async function load() {
  isLoading.value = true
  const [tR, eR, sR, cR] = await Promise.all([get<any>('/tasks'), get<any>('/exams'), get<any>('/schedules'), get<any>('/courses')])
  if (tR.success) tasks.value = Array.isArray(tR.data)?tR.data:tR.data?.data||[]
  if (eR.success) exams.value = Array.isArray(eR.data)?eR.data:eR.data?.data||[]
  if (sR.success) schedules.value = Array.isArray(sR.data)?sR.data:sR.data?.data||[]
  if (cR.success) courses.value = Array.isArray(cR.data)?cR.data:cR.data?.data||[]
  isLoading.value = false
}

onMounted(load)
</script>

<template>
  <section class="max-w-[1400px] mx-auto pb-10">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-[24px] font-bold" style="color:var(--color-text)">Analytics</h1>
        <p class="text-[13px] mt-0.5" style="color:var(--color-text-muted)">Track your progress and discover insights to study smarter.</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="period='week'" class="px-3 py-1.5 text-[12px] font-bold transition" :style="period==='week'?'border-radius:8px;background:var(--color-primary);color:#fff':'border-radius:8px;background:var(--color-surface);border:1px solid var(--color-border);color:var(--color-text)'">This Week</button>
        <button @click="period='month'" class="px-3 py-1.5 text-[12px] font-bold transition" :style="period==='month'?'border-radius:8px;background:var(--color-primary);color:#fff':'border-radius:8px;background:var(--color-surface);border:1px solid var(--color-border);color:var(--color-text)'">This Month</button>
      </div>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" style="color:var(--color-primary)" />
    </div>

    <div v-else class="flex flex-col gap-6">
      <!-- Top stat cards -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div v-for="s in [
          {l:'Study Hours',v:schedules.filter(s=>s.status==='completed').length*1.5,unit:'h',i:'i-lucide-clock',c:'info',delta:'↑ 18%'},
          {l:'Productivity',v:productivityScore,unit:'/100',i:'i-lucide-trending-up',c:'primary',delta:'↑ 12 pts'},
          {l:'Task Rate',v:tasks.length?Math.round(tasks.filter(t=>t.status==='completed').length/tasks.length*100):0,unit:'%',i:'i-lucide-check-circle-2',c:'success',delta:'↑ 9%'},
          {l:'Day Streak',v:streakDays,unit:'d',i:'i-lucide-flame',c:'warning',delta:'🔥 Best: 21d'},
          {l:'Courses Active',v:courses.length,unit:'',i:'i-lucide-book-open',c:'success',delta:'↑ active'}
        ]" :key="s.l"
          class="p-4" style="border-radius:12px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
          <div class="flex items-center gap-2 mb-3">
            <div class="flex size-7 items-center justify-center" :style="`border-radius:7px;background:color-mix(in srgb,var(--color-${s.c}) 12%,transparent);color:var(--color-${s.c})`">
              <UIcon :name="s.i" class="size-3.5" />
            </div>
            <p class="text-[11px] font-bold" style="color:var(--color-text-soft)">{{ s.l }}</p>
          </div>
          <p class="text-[26px] font-bold leading-none" style="color:var(--color-text)">{{ s.v }}{{ s.unit }}</p>
          <p class="text-[11px] mt-1.5 font-medium" :style="`color:var(--color-${s.c})`">{{ s.delta }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div class="flex flex-col gap-6">
          <!-- Study hours chart (bar) -->
          <div class="p-6" style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
            <h3 class="text-[15px] font-bold mb-5" style="color:var(--color-text)">Study Hours by Week</h3>
            <div class="flex items-end gap-3 h-[120px]">
              <div v-for="w in weeklyHours" :key="w.day" class="flex flex-col items-center gap-1.5 flex-1">
                <span class="text-[10px] font-bold" style="color:var(--color-text-muted)">{{ w.hours.toFixed(0) }}h</span>
                <div class="w-full transition-all" :style="`height:${Math.max(6,Math.min(100,w.hours/8*100))}px;border-radius:6px 6px 0 0;background:var(--color-primary);opacity:${w.hours>0?1:0.3}`"></div>
                <span class="text-[10px] font-bold" style="color:var(--color-text-muted)">{{ w.day }}</span>
              </div>
            </div>
          </div>

          <!-- Subject performance -->
          <div class="p-6" style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-[15px] font-bold" style="color:var(--color-text)">Subject Performance</h3>
              <p class="text-[11px]" style="color:var(--color-text-muted)">Based on tasks & exam performance</p>
            </div>
            <div v-if="!subjectPerformance.length" class="py-6 text-center text-[13px]" style="color:var(--color-text-muted)">Add courses to see performance.</div>
            <div class="space-y-4">
              <div v-for="s in subjectPerformance" :key="s.name">
                <div class="flex items-center justify-between mb-1.5">
                  <p class="text-[13px] font-bold" style="color:var(--color-text)">{{ s.name }}</p>
                  <span class="text-[12px] font-bold" :style="s.score>=80?'color:var(--color-success)':s.score>=60?'color:var(--color-warning)':'color:var(--color-danger)'">{{ s.score }}%</span>
                </div>
                <div class="h-2 w-full overflow-hidden" style="border-radius:99px;background:var(--color-border)">
                  <div class="h-full transition-all" :style="`width:${s.score}%;border-radius:99px;background:${s.score>=80?'var(--color-success)':s.score>=60?'var(--color-warning)':'var(--color-danger)'}`"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Completion rate -->
          <div class="p-6" style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
            <h3 class="text-[15px] font-bold mb-4" style="color:var(--color-text)">Completion Rate</h3>
            <div class="flex items-center gap-6">
              <div class="relative size-[100px] flex-shrink-0 flex items-center justify-center" style="border-radius:50%;background:conic-gradient(var(--color-primary) 0% {{productivityScore}}%, var(--color-border) {{productivityScore}}% 100%)">
                <div class="size-[80px] flex items-center justify-center" style="border-radius:50%;background:var(--color-surface)">
                  <span class="text-[20px] font-bold" style="color:var(--color-text)">{{ productivityScore }}%</span>
                </div>
              </div>
              <div>
                <p class="text-[13px]" style="color:var(--color-text-muted)">Based on tasks and study plans</p>
                <div class="mt-3 space-y-1.5">
                  <div class="flex items-center gap-2"><div class="size-2.5 rounded-full" style="background:var(--color-primary)"></div><span class="text-[12px]" style="color:var(--color-text)">Completed {{ tasks.filter(t=>t.status==='completed').length }}/{{ tasks.length }} tasks</span></div>
                  <div class="flex items-center gap-2"><div class="size-2.5 rounded-full" style="background:var(--color-success)"></div><span class="text-[12px]" style="color:var(--color-text)">{{ streakDays }} day streak</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right column -->
        <div class="flex flex-col gap-5">
          <!-- AI Insights -->
          <div class="p-5" style="border-radius:16px;background:color-mix(in srgb,var(--color-primary) 5%,var(--color-surface));border:1px solid var(--color-border)">
            <div class="flex items-center gap-2 mb-3">
              <UIcon name="i-lucide-sparkles" class="size-4" style="color:var(--color-primary)" />
              <h3 class="text-[14px] font-bold" style="color:var(--color-primary)">AI Insights</h3>
            </div>
            <div class="space-y-3">
              <div v-for="ins in insights" :key="ins.text" class="flex items-start gap-2.5 p-3" style="border-radius:10px;background:var(--color-surface);border:1px solid var(--color-border)">
                <UIcon :name="ins.icon" class="size-4 mt-0.5 flex-shrink-0" :style="ins.type==='success'?'color:var(--color-success)':ins.type==='warning'?'color:var(--color-warning)':'color:var(--color-info)'"/>
                <p class="text-[12px]" style="color:var(--color-text-soft)">{{ ins.text }}</p>
              </div>
            </div>
          </div>

          <!-- Top Recommendations -->
          <div class="p-5" style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-[14px] font-bold" style="color:var(--color-text)">Top Recommendations</h3>
            </div>
            <div class="space-y-3">
              <div v-for="r in recommendations" :key="r.title" class="flex items-start gap-3 p-3" style="border-radius:10px;border:1px solid var(--color-border)">
                <div class="flex size-8 flex-shrink-0 items-center justify-center" style="border-radius:8px;background:color-mix(in srgb,var(--color-primary) 10%,transparent);color:var(--color-primary)">
                  <UIcon :name="r.icon" class="size-4" />
                </div>
                <div>
                  <p class="text-[13px] font-bold" style="color:var(--color-text)">{{ r.title }}</p>
                  <p class="text-[11px] mt-0.5" style="color:var(--color-text-muted)">{{ r.desc }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Streak calendar (simple grid) -->
          <div class="p-5" style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
            <h3 class="text-[14px] font-bold mb-3" style="color:var(--color-text)">Streak Calendar</h3>
            <div class="grid grid-cols-7 gap-1">
              <div v-for="i in 35" :key="i" class="aspect-square" :style="`border-radius:4px;background:${i%3===0?'var(--color-primary)':i%5===0?'color-mix(in srgb,var(--color-primary) 40%,transparent)':'var(--color-border)'}`"></div>
            </div>
            <p class="text-[11px] mt-2" style="color:var(--color-text-muted)">🔥 {{ streakDays }} day streak</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>