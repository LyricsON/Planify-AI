<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
const { get, post } = useApi()
const courses = ref<any[]>([])
const files = ref<any[]>([])
const isLoading = ref(true)
const selected = ref<any>(null)
const search = ref('')
const uploadRef = ref<HTMLInputElement | null>(null)

const filtered = computed(() => courses.value.filter(c => c.title?.toLowerCase().includes(search.value.toLowerCase())))

async function load() {
  isLoading.value = true
  const [cR, fR] = await Promise.all([get<any>('/courses'), get<any>('/files', { limit: 6, sort: 'newest' })])
  if (cR.success) courses.value = Array.isArray(cR.data) ? cR.data : cR.data?.data || []
  if (fR.success) files.value = Array.isArray(fR.data) ? fR.data : fR.data?.data || []
  if (courses.value.length) selected.value = courses.value[0]
  isLoading.value = false
}

async function upload(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  const fd = new FormData()
  fd.append('file', f)
  if (selected.value) fd.append('courseId', selected.value._id)
  await post('/files/upload', fd)
  await load()
}

const fileColor = (t: string) => ({ pdf:'#fef2f2;color:#ef4444', xlsx:'#f0fdf4;color:#22c55e', docx:'#eff6ff;color:#3b82f6' }[t] || 'var(--color-border);color:var(--color-text-muted)')
const fileIcon  = (t: string) => ({ pdf:'i-lucide-file-text', xlsx:'i-lucide-file-spreadsheet', docx:'i-lucide-file-type' }[t] || 'i-lucide-file')
const ago = (d: string) => { const h = Math.floor((Date.now()-new Date(d).getTime())/3600000); return h<1?'Just now':h<24?h+'h ago':Math.floor(h/24)+'d ago' }

onMounted(load)
</script>

<template>
  <section class="max-w-[1400px] mx-auto pb-10">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-[24px] font-bold" style="color:var(--color-text)">Courses</h1>
        <p class="text-[13px] mt-0.5" style="color:var(--color-text-muted)">Organize, access and study your course materials.</p>
      </div>
      <button @click="uploadRef?.click()" class="flex items-center gap-2 px-4 py-2 text-[13px] font-bold text-white transition" style="background:var(--color-primary);border-radius:10px">
        <UIcon name="i-lucide-upload" class="size-4" /> Upload File
      </button>
      <input ref="uploadRef" type="file" class="hidden" @change="upload" accept=".pdf,.docx,.pptx,.xlsx,.png,.jpg" />
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" style="color:var(--color-primary)" />
    </div>

    <div v-else class="grid grid-cols-1 xl:grid-cols-[280px_1fr_280px] gap-6">
      <!-- Sidebar course list -->
      <div class="flex flex-col gap-2">
        <input v-model="search" placeholder="Search courses..." class="w-full h-[36px] px-3 text-[13px] focus:outline-none mb-1" style="border-radius:10px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text)" />
        <button v-for="c in filtered" :key="c._id" @click="selected=c" class="w-full text-left p-3 flex items-center gap-3 transition"
          :style="selected?._id===c._id ? 'border-radius:12px;background:color-mix(in srgb,var(--color-primary) 10%,transparent);border:1.5px solid var(--color-primary)' : 'border-radius:12px;background:var(--color-surface);border:1px solid var(--color-border)'">
          <div class="flex size-[36px] flex-shrink-0 items-center justify-center" style="border-radius:8px;background:color-mix(in srgb,var(--color-primary) 12%,transparent);color:var(--color-primary)">
            <UIcon name="i-lucide-book-open" class="size-4" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[13px] font-bold truncate" :style="selected?._id===c._id?'color:var(--color-primary)':'color:var(--color-text)'">{{ c.title }}</p>
            <p class="text-[11px] truncate" style="color:var(--color-text-muted)">{{ c.teacher || 'Prof.' }} • {{ c.semester || 'S2' }}</p>
          </div>
          <span class="text-[11px] font-bold px-1.5 py-0.5" style="border-radius:5px;background:color-mix(in srgb,var(--color-success) 15%,transparent);color:var(--color-success)">{{ c.progress||75 }}%</span>
        </button>
        <div v-if="!filtered.length" class="text-center py-6 text-[13px]" style="color:var(--color-text-muted)">No courses found.</div>
        <div @click="uploadRef?.click()" class="mt-1 flex flex-col items-center gap-1.5 p-4 cursor-pointer transition" style="border-radius:12px;border:2px dashed var(--color-border);color:var(--color-text-muted)">
          <UIcon name="i-lucide-upload-cloud" class="size-5" />
          <p class="text-[11px] font-semibold text-center">Drag & drop or click to upload<br/><span class="font-normal opacity-70">PDF, DOCX, XLSX up to 50MB</span></p>
        </div>
      </div>

      <!-- Course detail -->
      <div v-if="selected" class="flex flex-col gap-5">
        <div class="p-6" style="background:var(--color-surface);border-radius:16px;border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
          <h2 class="text-[20px] font-bold mb-1" style="color:var(--color-text)">{{ selected.title }}</h2>
          <p class="text-[13px] mb-4" style="color:var(--color-text-muted)">{{ selected.teacher||'Prof. Smith' }} • {{ selected.semester||'Semester 2 • 2024' }}</p>
          <p class="text-[13px] leading-relaxed mb-5" style="color:var(--color-text-soft)">{{ selected.description||'This course covers essential topics including core concepts, theories, and practical applications. Use the resources and summaries to stay on top of your studies.' }}</p>
          <div class="mb-5">
            <div class="flex justify-between mb-1.5">
              <p class="text-[12px] font-bold" style="color:var(--color-text-soft)">Course Progress</p>
              <span class="text-[12px] font-bold" style="color:var(--color-success)">{{ selected.progress||75 }}%</span>
            </div>
            <div class="h-2 w-full overflow-hidden" style="border-radius:99px;background:var(--color-border)">
              <div class="h-full" :style="`width:${selected.progress||75}%;border-radius:99px;background:var(--color-success)`"></div>
            </div>
          </div>
          <div class="grid grid-cols-4 gap-3">
            <div v-for="s in [{l:'Files',i:'i-lucide-files',v:selected.filesCount||24},{l:'Summaries',i:'i-lucide-book-marked',v:12},{l:'Exercises',i:'i-lucide-pen-line',v:18},{l:'Plans',i:'i-lucide-calendar-check',v:5}]" :key="s.l"
              class="flex flex-col items-center p-3 text-center" style="border-radius:12px;background:color-mix(in srgb,var(--color-primary) 6%,transparent);border:1px solid var(--color-border)">
              <UIcon :name="s.i" class="size-4 mb-1" style="color:var(--color-primary)" />
              <p class="text-[18px] font-bold" style="color:var(--color-text)">{{ s.v }}</p>
              <p class="text-[10px] font-semibold uppercase" style="color:var(--color-text-muted)">{{ s.l }}</p>
            </div>
          </div>
        </div>
        <div class="p-5" style="background:color-mix(in srgb,var(--color-primary) 5%,var(--color-surface));border-radius:16px;border:1px solid var(--color-border)">
          <div class="flex items-center gap-2 mb-3">
            <UIcon name="i-lucide-sparkles" class="size-4" style="color:var(--color-primary)" />
            <h3 class="text-[14px] font-bold" style="color:var(--color-primary)">AI Course Summary</h3>
          </div>
          <ul class="space-y-2">
            <li v-for="pt in ['Strong emphasis on core theory and applications','Includes practical exercises and problem sets','Regular assignments build analytical foundation','Exam-focused revision materials available']" :key="pt" class="flex items-start gap-2 text-[13px]" style="color:var(--color-text-soft)">
              <UIcon name="i-lucide-check-circle-2" class="size-4 mt-0.5 flex-shrink-0" style="color:var(--color-success)" />{{ pt }}
            </li>
          </ul>
        </div>
      </div>
      <div v-else class="flex items-center justify-center" style="color:var(--color-text-muted)">
        <p class="text-[14px]">Select a course to view details.</p>
      </div>

      <!-- Recent Uploads -->
      <div class="p-5" style="background:var(--color-surface);border-radius:16px;border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
        <h3 class="text-[15px] font-bold mb-4" style="color:var(--color-text)">Recent Uploads</h3>
        <div v-if="!files.length" class="text-[13px] py-4 text-center" style="color:var(--color-text-muted)">No files yet.</div>
        <div class="space-y-3">
          <div v-for="f in files" :key="f._id" class="flex items-center gap-3">
            <div class="flex size-[36px] flex-shrink-0 items-center justify-center" :style="`border-radius:10px;background:${fileColor(f.type)}`">
              <UIcon :name="fileIcon(f.type)" class="size-4" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[13px] font-bold truncate" style="color:var(--color-text)">{{ f.originalName||f.fileName }}</p>
              <p class="text-[11px]" style="color:var(--color-text-muted)">{{ String(f.type).toUpperCase() }} • {{ (f.size/1024/1024).toFixed(1) }}MB • {{ ago(f.createdAt) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>