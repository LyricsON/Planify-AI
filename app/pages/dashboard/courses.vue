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
const courseCards = computed(() => filtered.value.slice(0, 4))
const progressValue = computed(() => Number(selected.value?.progress ?? 0))
const selectedFiles = computed(() => {
  if (!selected.value?._id) return []
  return files.value.filter((f: any) => f.courseId === selected.value._id || f.courseId?._id === selected.value._id)
})
const filesCount = computed(() => Number(selected.value?.filesCount ?? selectedFiles.value.length ?? 0))
const summariesCount = computed(() => Number(selected.value?.summariesCount ?? selected.value?.summaries?.length ?? 0))
const exercisesCount = computed(() => Number(selected.value?.exercisesCount ?? selected.value?.exercises?.length ?? 0))
const studyPlansCount = computed(() => Number(selected.value?.plansCount ?? selected.value?.studyPlansCount ?? selected.value?.plans?.length ?? 0))
const reviewedFiles = computed(() => Number(selected.value?.reviewedFilesCount ?? Math.round((filesCount.value * progressValue.value) / 100)))
const readSummaries = computed(() => Number(selected.value?.readSummariesCount ?? Math.round((summariesCount.value * progressValue.value) / 100)))
const solvedExercises = computed(() => Number(selected.value?.solvedExercisesCount ?? Math.round((exercisesCount.value * progressValue.value) / 100)))
const selectedTags = computed(() => {
  if (Array.isArray(selected.value?.tags) && selected.value.tags.length) return selected.value.tags.slice(0, 6)
  if (Array.isArray(selected.value?.topics) && selected.value.topics.length) return selected.value.topics.slice(0, 6)
  return []
})
const summaryPoints = computed(() => {
  if (Array.isArray(selected.value?.highlights) && selected.value.highlights.length) return selected.value.highlights.slice(0, 5)
  if (Array.isArray(selected.value?.summaryPoints) && selected.value.summaryPoints.length) return selected.value.summaryPoints.slice(0, 5)
  if (selectedTags.value.length) return selectedTags.value.slice(0, 5).map((t: string) => `Covers ${t}`)
  return []
})
const courseDescription = computed(() => selected.value?.description || selected.value?.summary || 'No description available for this course yet.')
const selectedCourseDate = computed(() => {
  const d = selected.value?.updatedAt || selected.value?.updated_at || selected.value?.createdAt || selected.value?.created_at
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
})
const progressRadius = 52
const progressCircumference = 2 * Math.PI * progressRadius
const progressDashoffset = computed(() => progressCircumference * (1 - Math.max(0, Math.min(100, progressValue.value)) / 100))

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

const fileIcon = (t: string) => {
  const type = String(t).toLowerCase()
  if (type === 'pdf') return 'i-mdi-file-pdf-box'
  if (type === 'pptx' || type === 'ppt') return 'i-mdi-file-powerpoint-box'
  if (type === 'xlsx' || type === 'xls') return 'i-mdi-file-excel-box'
  if (type === 'docx' || type === 'doc') return 'i-mdi-file-word-box'
  if (type === 'png' || type === 'jpg' || type === 'jpeg' || type === 'webp') return 'i-mdi-file-image-box'
  return 'i-mdi-file-document-outline'
}

const fileTone = (t: string) => {
  const type = String(t).toLowerCase()
  if (type === 'pdf') return 'file-tone-danger'
  if (type === 'pptx' || type === 'ppt') return 'file-tone-ppt'
  if (type === 'xlsx' || type === 'xls') return 'file-tone-success'
  if (type === 'docx' || type === 'doc') return 'file-tone-info'
  if (type === 'png' || type === 'jpg' || type === 'jpeg' || type === 'webp') return 'file-tone-primary'
  return 'file-tone-default'
}

const cardTone = (index: number) => {
  if (index === 1) return 'text-amber-500 bg-amber-50'
  if (index === 2) return 'text-indigo-500 bg-indigo-50'
  if (index === 3) return 'text-cyan-500 bg-cyan-50'
  return 'text-emerald-500 bg-emerald-50'
}

const ago = (d?: string) => {
  if (!d) return 'Recently'
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h}h ago`
  if (h < 48) return 'Yesterday'
  return `${Math.floor(h / 24)} days ago`
}

const cardSubtitle = (c: any) => {
  const semRaw = String(c?.semesterLabel || c?.semester || c?.level || '').trim()
  const year = c?.academicYear || c?.year || c?.schoolYear
  const d = c?.updatedAt || c?.updated_at || c?.createdAt || c?.created_at
  const fullDate = d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  const sMatch = semRaw.match(/^s\s*(\d+)$/i)
  if (sMatch) {
    const semNum = sMatch[1]
    return fullDate || `Semester ${semNum} • ${year || new Date().getFullYear()}`
  }

  if (/semester/i.test(semRaw) && year) return fullDate || `${semRaw} • ${year}`
  if (semRaw) return fullDate || `${semRaw} • ${year || new Date().getFullYear()}`
  if (year) return fullDate || `Semester 2 • ${year}`
  if (fullDate) return fullDate

  return 'Semester 2 • 2024'
}

onMounted(load)
</script>

<template>
  <section class="mx-auto max-w-[1400px] pb-10">
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-[var(--color-primary)]" />
    </div>

    <div v-else class="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
      <div class="space-y-5">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <button
            v-for="(c, idx) in courseCards"
            :key="c._id"
            class="course-top-card flex h-[144px] flex-col text-left"
            :class="selected?._id === c._id ? 'course-top-card--active' : ''"
            @click="selected = c"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-2 min-w-0">
                <div class="flex size-10 shrink-0 items-center justify-center rounded-[10px]" :class="cardTone(idx)">
                  <UIcon name="i-lucide-book-open" class="size-4" />
                </div>
                <div class="min-w-0 text-left">
                  <p class="truncate text-[14px] font-semibold text-[var(--color-text)] course-card-title">{{ c.title || c.name || c.courseName || 'Untitled Course' }}</p>
                  <p class="mt-[1px] text-[12px] text-[var(--color-text-muted)] course-card-subtitle">{{ cardSubtitle(c) }}</p>
                </div>
              </div>
              <UIcon name="i-lucide-ellipsis" class="size-4 text-[var(--color-text-muted)]" />
            </div>
            <div class="mt-4 space-y-1 text-xs text-[var(--color-text-muted)]">
              <p class="flex items-center gap-2 course-card-meta-line"><UIcon name="i-lucide-folder" class="size-3.5" /> {{ c.filesCount || 0 }} files</p>
              <p class="flex items-center gap-2 course-card-meta-line"><UIcon name="i-lucide-clock-3" class="size-3.5" /> Updated {{ ago(c.updatedAt || c.updated_at || c.createdAt || c.created_at) }}</p>
            </div>
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button class="chip chip-lg">All Types <UIcon name="i-lucide-chevron-down" class="size-3.5" /></button>
          <button class="chip"><UIcon name="i-lucide-file-text" class="size-3.5 text-red-500" /> PDF</button>
          <button class="chip"><UIcon name="i-lucide-file-spreadsheet" class="size-3.5 text-emerald-500" /> Excel</button>
          <button class="chip"><UIcon name="i-lucide-image" class="size-3.5 text-blue-500" /> Images</button>
          <button class="chip"><UIcon name="i-lucide-file-pen-line" class="size-3.5 text-violet-500" /> Notes</button>
          <button class="chip"><UIcon name="i-lucide-file" class="size-3.5 text-slate-500" /> Docs</button>

          <div class="ml-auto flex items-center gap-2">
            <button class="chip chip-lg">Sort by: Last updated <UIcon name="i-lucide-chevron-down" class="size-3.5" /></button>
            <button class="icon-chip"><UIcon name="i-lucide-layout-grid" class="size-4" /></button>
            <button class="icon-chip"><UIcon name="i-lucide-list" class="size-4" /></button>
          </div>
        </div>

        <button class="upload-box w-full" @click="uploadRef?.click()">
          <div class="mx-auto mb-4 flex size-[58px] items-center justify-center rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-surface)] text-[var(--color-primary)]">
            <UIcon name="i-lucide-upload" class="size-5" />
          </div>
          <p class="text-lg font-semibold text-[var(--color-text)]">Upload files <span class="font-normal text-[var(--color-text-muted)]">or drag & drop</span></p>
          <p class="mt-2 text-sm text-[var(--color-text-muted)]">PDF, DOCX, PPTX, XLSX, Images up to 50MB</p>
          <span class="mt-5 inline-flex rounded-[10px] border border-[var(--color-primary)]/40 px-5 py-2 text-sm font-medium text-[var(--color-primary)]">Choose Files</span>
        </button>

        <input ref="uploadRef" type="file" class="hidden" accept=".pdf,.docx,.pptx,.xlsx,.png,.jpg" @change="upload">

        <div v-if="selected" class="detail-card">
          <div class="mb-3 text-xs text-[var(--color-text-muted)]">Courses <span class="mx-2">›</span> {{ selected.title }}</div>
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="flex items-start gap-4">
              <div class="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                <UIcon name="i-lucide-book-open" class="size-6" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="course-detail-title font-semibold leading-none text-[var(--color-text)]">{{ selected.title }}</h2>
                  <UIcon name="i-lucide-star" class="size-5 text-amber-400" />
                </div>
                <p class="mt-2 text-sm text-[var(--color-text-muted)]">{{ selectedCourseDate }}</p>
                <div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
                  <span class="flex items-center gap-1.5"><UIcon name="i-lucide-folder" class="size-3.5" />{{ filesCount }} files</span>
                  <span class="flex items-center gap-1.5"><UIcon name="i-lucide-clock-3" class="size-3.5" />Updated {{ ago(selected.updatedAt || selected.createdAt) }}</span>
                  <span v-if="selected.isCore" class="pill pill-blue">Core Subject</span>
                  <span v-if="selected.priority === 'high'" class="pill pill-red">High Priority</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button class="btn-primary"><UIcon name="i-lucide-plus" class="size-4" /> Add Files</button>
              <button class="icon-chip size-11"><UIcon name="i-lucide-ellipsis" class="size-4" /></button>
            </div>
          </div>

          <div class="mt-5 border-b border-[var(--color-border)]">
            <div class="flex gap-7 text-sm">
              <span class="tab tab--active">Overview</span>
              <span class="tab">Files</span>
              <span class="tab">Summaries</span>
              <span class="tab">Exercises</span>
            </div>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr]">
            <div class="sub-card">
              <h3 class="text-lg font-semibold text-[var(--color-text)]">About this course</h3>
              <p class="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">{{ courseDescription }}</p>
              <div class="mt-5 grid grid-cols-[120px_1fr] gap-y-2 text-sm">
                <p class="text-[var(--color-text-muted)]">Instructor</p><p class="text-[var(--color-text)]">{{ selected.teacher || '-' }}</p>
                <p class="text-[var(--color-text-muted)]">Credits</p><p class="text-[var(--color-text)]">{{ selected.credits ?? '-' }}</p>
                <p class="text-[var(--color-text-muted)]">Schedule</p><p class="text-[var(--color-text)]">{{ selected.schedule || '-' }}</p>
                <p class="text-[var(--color-text-muted)]">Location</p><p class="text-[var(--color-text)]">{{ selected.location || '-' }}</p>
              </div>
              <div v-if="selectedTags.length" class="mt-5">
                <p class="text-sm font-medium text-[var(--color-text)]">Tags</p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <span v-for="tag in selectedTags" :key="tag" class="chip chip-tag">{{ tag }}</span>
                </div>
              </div>
            </div>

            <div class="sub-card">
              <h3 class="text-lg font-semibold text-[var(--color-text)]">Course Progress</h3>
                <div class="mt-4 flex items-center gap-5">
                  <div class="radial">
                    <svg class="radial__svg" viewBox="0 0 128 128" aria-hidden="true">
                      <circle class="radial__track" cx="64" cy="64" :r="progressRadius" />
                      <circle
                        class="radial__bar"
                        cx="64"
                        cy="64"
                        :r="progressRadius"
                        :stroke-dasharray="progressCircumference"
                        :stroke-dashoffset="progressDashoffset"
                      />
                    </svg>
                    <div class="radial__inner">
                      <p class="radial__value text-3xl font-semibold leading-none text-[var(--color-text)]">{{ progressValue }}%</p>
                      <p class="radial__label text-xs text-[var(--color-text-muted)]">Complete</p>
                    </div>
                  </div>
                  <div class="space-y-3 text-xs text-[var(--color-text-muted)]">
                    <p class="progress-line">
                      <span class="progress-line__label"><UIcon name="i-lucide-file-check-2" class="size-3.5 progress-line__icon" />Files reviewed</span>
                      <span class="font-semibold text-[var(--color-text)]">{{ reviewedFiles }} / {{ filesCount }}</span>
                    </p>
                    <p class="progress-line">
                      <span class="progress-line__label"><UIcon name="i-lucide-clock-3" class="size-3.5 progress-line__icon" />Summaries read</span>
                      <span class="font-semibold text-[var(--color-text)]">{{ readSummaries }} / {{ summariesCount }}</span>
                    </p>
                    <p class="progress-line">
                      <span class="progress-line__label"><UIcon name="i-lucide-circle-check" class="size-3.5 progress-line__icon" />Exercises solved</span>
                      <span class="font-semibold text-[var(--color-text)]">{{ solvedExercises }} / {{ exercisesCount }}</span>
                    </p>
                  </div>
                </div>
                <div class="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-xs text-[var(--color-text-muted)] progress-note">
                  <UIcon name="i-lucide-trending-up" class="size-4 progress-note__icon" />
                  <span>Nice progress! Keep reviewing summaries and solving exercises.</span>
                </div>
              </div>
            </div>

          <div class="mt-5">
            <h3 class="text-lg font-semibold text-[var(--color-text)]">What's inside this course</h3>
            <div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div class="mini-card" v-for="s in [{ l: 'Files', v: filesCount, i: 'i-lucide-file' }, { l: 'Summaries', v: summariesCount, i: 'i-lucide-sparkles' }, { l: 'Exercises', v: exercisesCount, i: 'i-lucide-pen-line' }, { l: 'Study Plans', v: studyPlansCount, i: 'i-lucide-calendar-days' }]" :key="s.l">
                <div class="flex items-start justify-between">
                  <p class="text-2xl font-semibold leading-none text-[var(--color-text)]">{{ s.v }}</p>
                  <div class="flex size-10 items-center justify-center rounded-lg bg-[var(--color-bg)] text-[var(--color-primary)]"><UIcon :name="s.i" class="size-4" /></div>
                </div>
                <p class="mt-2 text-sm text-[var(--color-text-muted)]">{{ s.l }}</p>
                <button class="mt-2 text-xs font-medium text-[var(--color-primary)]">View all</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="space-y-5">
        <div class="side-card p-0">
          <div class="border-b border-[var(--color-border)] p-3">
            <div class="flex items-center justify-between">
              <h3 class="flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
                <UIcon name="i-lucide-sparkles" class="size-4 text-[var(--color-primary)]" />
                <div class="flex gap-1">
                  <span class="text-[var(--color-primary)]">AI Course</span>
                  <span>Summary</span>
                </div>
              </h3>
              <button class="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary)]">
                Regenerate
                <UIcon name="i-lucide-refresh-cw" class="size-3.5" />
              </button>
            </div>
            <div class="mt-3 flex gap-4 text-sm">
              <span class="tab tab--active rounded-xl bg-[var(--color-bg)] px-4 py-2">Overview</span>
              <span class="tab px-4 py-2">Key Topics</span>
            </div>
          </div>
          <div class="space-y-2 p-3 mt-2 text-sm text-[var(--color-text-muted)]">
            <p class="ai-summary-description">{{ courseDescription }}</p>
            <p v-for="point in summaryPoints" :key="point" class="flex gap-2 ai-summary-point">
              <UIcon name="i-lucide-check-circle-2" class="mt-0.5 size-4 text-[var(--color-success)]" />{{ point }}
            </p>
          </div>
          <div class="p-3 pt-0">
            <button class="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]">View full summary</button>
          </div>
        </div>

        <div class="side-card side-card-lg">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-[var(--color-text)]">Recent Uploads</h3>
            <NuxtLink to="/dashboard/files" class="text-xs font-semibold text-[var(--color-primary)]">View all</NuxtLink>
          </div>
          <div v-if="!files.length" class="py-4 text-center text-sm text-[var(--color-text-muted)]">No files yet.</div>
          <div class="space-y-3">
            <div v-for="f in files" :key="f._id" class="recent-file-row">
              <div class="recent-file-icon-wrap" :class="fileTone(f.type)">
                <UIcon :name="fileIcon(f.type)" class="size-5" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate recent-file-name">{{ f.originalName || f.fileName }}</p>
                <p class="text-xs text-[var(--color-text-muted)]">{{ String(f.type).toUpperCase() }} • {{ (f.size / 1024 / 1024).toFixed(1) }} MB • Uploaded {{ ago(f.createdAt) }}</p>
              </div>
            </div>
          </div>
          <NuxtLink to="/dashboard/files" class="recent-files-cta">
            <UIcon name="i-lucide-folder" class="size-4" />
            <span>Browse all files</span>
          </NuxtLink>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.course-top-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
  padding: 14px;
  transition: all .2s ease;
}

.course-top-card--active {
  border-color: color-mix(in srgb, var(--color-primary) 75%, white);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-primary) 22%, transparent), var(--shadow-sm);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: 10px;
  color: var(--color-text-muted);
  padding: 8px 11px;
  font-size: 12px;
  line-height: 1;
}

.chip-lg {
  padding: 8px 10px;
}

.chip-tag {
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-primary) 9%, transparent);
  color: var(--color-primary);
  border-color: color-mix(in srgb, var(--color-primary) 20%, var(--color-border));
}

.icon-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text-muted);
  background: var(--color-surface);
}

.upload-box {
  border: 2px dashed color-mix(in srgb, var(--color-primary) 20%, var(--color-border));
  border-radius: 16px;
  padding: 34px 20px;
  text-align: center;
  background: color-mix(in srgb, var(--color-surface) 70%, var(--color-bg));
}

.detail-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
  padding: 20px;
}

.side-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
  padding: 12px;
}

.sub-card {
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
  padding: 18px;
}

.mini-card {
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
  padding: 16px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 10px;
  height: 36px;
  padding: 0 12px;
  color: #fff;
  background: var(--color-primary);
  font-size: 12px;
  font-weight: 600;
}

.course-detail-title {
  font-size: 22px;
}

.pill {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
}

.pill-blue {
  color: #4f46e5;
  background: #eef2ff;
}

.pill-red {
  color: #ef4444;
  background: #fef2f2;
}

.tab {
  position: relative;
  color: var(--color-text-muted);
  padding-bottom: 10px;
}

.tab--active {
  color: var(--color-primary);
  font-weight: 600;
}

.tab--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  border-radius: 999px;
  background: var(--color-primary);
}

.radial {
  --size: 148px;
  position: relative;
  width: var(--size);
  height: var(--size);
}

.radial__svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.radial__track,
.radial__bar {
  fill: none;
  stroke-width: 12;
}

.radial__track {
  stroke: color-mix(in srgb, var(--color-primary) 14%, transparent);
}

.radial__bar {
  stroke: var(--color-primary);
  stroke-linecap: round;
  transition: stroke-dashoffset .25s ease;
}

.radial__inner {
  position: absolute;
  inset: 30px;
  padding: 0;
  border-radius: 999px;
  background: var(--color-surface);
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  text-align: center;
}

.radial__value {
  margin: 0;
}

.radial__label {
  margin: 0;
}

.progress-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}

.progress-line__label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.progress-line__icon {
  color: color-mix(in srgb, var(--color-primary) 60%, var(--color-text-muted));
}

.progress-note {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-note__icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.course-card-title,
.course-card-subtitle {
  margin-bottom: 0;
}

.course-card-meta-line {
  margin-bottom: 8px;
}

.ai-summary-description {
  margin-bottom: 16px;
}

.ai-summary-point {
  margin-bottom: 8px;
}

.side-card-lg {
  padding: 24px;
}

.recent-file-row {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid #e7e9f5;
  border-radius: 14px;
  padding: 14px;
  background: var(--color-surface);
}

.recent-file-icon-wrap {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
  border: 1px solid currentColor;
  background: #fff;
}

.file-tone-danger { color: #ef4444; }
.file-tone-ppt { color: #64748b; }
.file-tone-success { color: #22c55e; }
.file-tone-info { color: #60a5fa; }
.file-tone-primary { color: #8b5cf6; }
.file-tone-default { color: #64748b; }

.recent-file-name {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #1f2a4a;
}

.recent-file-row .text-xs {
  margin: 4px 0 0;
  font-size: 11px;
  color: #727ca3;
}

.recent-file-meta {
  margin: 4px 0 0;
  font-size: 11px;
  color: #727ca3;
}

.recent-files-cta {
  margin-top: 16px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  border: 1px solid #d9dcff;
  background: #f8f9ff;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #4f46e5;
}
</style>
