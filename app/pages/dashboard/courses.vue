<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

// ─── Composables ──────────────────────────────────────────────────────────────
const { get, post, put, del } = useApi()
const router = useRouter()

// ─── Types ────────────────────────────────────────────────────────────────────
interface Course {
  _id: string
  title: string
  description?: string
  semester?: string
  teacher?: string
  room?: string
  color?: string
  status: 'active' | 'archived' | 'completed'
  priority: 'low' | 'medium' | 'high'
  progress: number
  tags: string[]
  totalFiles: number
  totalTasks: number
  totalExams: number
  createdAt: string
  updatedAt: string
}

interface FileItem {
  _id: string
  courseId?: string | { _id: string; title: string }
  originalName: string
  fileName: string
  type: string
  size: number
  url?: string
  tags: string[]
  description?: string
  createdAt: string
  updatedAt: string
  uploadedAt?: string
}

interface CourseForm {
  title: string
  description: string
  semester: string
  teacher: string
  color: string
  priority: 'low' | 'medium' | 'high'
  status: 'active' | 'archived' | 'completed'
}

interface AiSummary {
  title: string
  summary: string
  keyPoints: string[]
  isLoading: boolean
  error: string | null
}

interface UploadState {
  active: boolean
  error: string | null
  fileName: string
}

// ─── Core State ───────────────────────────────────────────────────────────────
const courses = ref<Course[]>([])
const allFiles = ref<FileItem[]>([])
const isLoading = ref(true)
const apiError = ref<string | null>(null)
const selected = ref<Course | null>(null)
const tokenBalance = ref<number | null>(null)

// ─── Search / Filter / Sort ───────────────────────────────────────────────────
const courseSearch = ref('')
const fileSearch = ref('')
const activeTypeFilter = ref<'all' | 'pdf' | 'docx' | 'xlsx' | 'image' | 'pptx' | 'other'>('all')
const activeSortOrder = ref<'newest' | 'oldest' | 'name' | 'largest' | 'updated'>('newest')
const activeTab = ref<'overview' | 'files' | 'summaries' | 'exercises'>('overview')
const aiTab = ref<'overview' | 'topics'>('overview')

// ─── Upload State ─────────────────────────────────────────────────────────────
const uploadRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const uploadState = ref<UploadState>({ active: false, error: null, fileName: '' })

// ─── AI Summary ───────────────────────────────────────────────────────────────
const aiSummary = ref<AiSummary>({ title: '', summary: '', keyPoints: [], isLoading: false, error: null })

// ─── Modal State ──────────────────────────────────────────────────────────────
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showSortDropdown = ref(false)
const activeDropdown = ref<{ type: 'card' | 'header', courseId: string } | null>(null)

function toggleDropdown(type: 'card' | 'header', courseId: string) {
  if (activeDropdown.value && activeDropdown.value.type === type && activeDropdown.value.courseId === courseId) {
    activeDropdown.value = null
  } else {
    activeDropdown.value = { type, courseId }
  }
}

function closeDropdown() {
  activeDropdown.value = null
}
const isSavingCourse = ref(false)
const isDeletingCourse = ref(false)

const defaultForm = (): CourseForm => ({
  title: '',
  description: '',
  semester: '',
  teacher: '',
  color: '#4f46e5',
  priority: 'medium',
  status: 'active',
})
const courseForm = ref<CourseForm>(defaultForm())

// ─── Color Presets ────────────────────────────────────────────────────────────
const colorPresets = [
  '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
]

// ─── Computed ─────────────────────────────────────────────────────────────────
const filteredCourses = computed(() => {
  const q = courseSearch.value.toLowerCase()
  if (!q) return courses.value
  return courses.value.filter(c =>
    c.title?.toLowerCase().includes(q) ||
    c.description?.toLowerCase().includes(q) ||
    c.teacher?.toLowerCase().includes(q) ||
    c.semester?.toLowerCase().includes(q)
  )
})

// All filtered courses are rendered — no slice limit
const courseCards = computed(() => filteredCourses.value)

// ─── Carousel ────────────────────────────────────────────────────────────────
const carouselRef = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const CARD_WIDTH = 272 // px — matches .course-top-card width + gap

function updateCarouselArrows() {
  const el = carouselRef.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 2
  canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 2
}

function carouselScrollLeft() {
  carouselRef.value?.scrollBy({ left: -CARD_WIDTH, behavior: 'smooth' })
}

function carouselScrollRight() {
  carouselRef.value?.scrollBy({ left: CARD_WIDTH, behavior: 'smooth' })
}

async function scrollToNewCourse(courseId: string) {
  await nextTick()
  const el = carouselRef.value
  if (!el) return
  const idx = courses.value.findIndex(c => c._id === courseId)
  if (idx >= 0) {
    el.scrollTo({ left: idx * CARD_WIDTH, behavior: 'smooth' })
  }
  updateCarouselArrows()
}

const selectedCourseFiles = computed(() => {
  if (!selected.value?._id) return []
  let files = allFiles.value.filter(f => {
    const cid = typeof f.courseId === 'object' ? f.courseId?._id : f.courseId
    return cid === selected.value!._id
  })
  // Type filter
  if (activeTypeFilter.value !== 'all') {
    files = files.filter(f => f.type === activeTypeFilter.value)
  }
  // File search
  const q = fileSearch.value.toLowerCase()
  if (q) {
    files = files.filter(f =>
      f.originalName?.toLowerCase().includes(q) ||
      f.description?.toLowerCase().includes(q) ||
      f.tags?.some(t => t.toLowerCase().includes(q))
    )
  }
  // Sort
  const sorted = [...files]
  switch (activeSortOrder.value) {
    case 'oldest': sorted.sort((a, b) => new Date(a.uploadedAt || a.createdAt).getTime() - new Date(b.uploadedAt || b.createdAt).getTime()); break
    case 'name':   sorted.sort((a, b) => (a.originalName || '').localeCompare(b.originalName || '')); break
    case 'largest': sorted.sort((a, b) => (b.size || 0) - (a.size || 0)); break
    case 'updated': sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()); break
    default:       sorted.sort((a, b) => new Date(b.uploadedAt || b.createdAt).getTime() - new Date(a.uploadedAt || a.createdAt).getTime())
  }
  return sorted
})

const recentUploads = computed(() =>
  [...allFiles.value]
    .sort((a, b) => new Date(b.uploadedAt || b.createdAt).getTime() - new Date(a.uploadedAt || a.createdAt).getTime())
    .slice(0, 6)
)

const fileTypeCounts = computed(() => {
  const counts: Record<string, number> = { all: 0, pdf: 0, docx: 0, xlsx: 0, image: 0, pptx: 0, other: 0 }
  const base = allFiles.value.filter(f => {
    if (!selected.value) return true
    const cid = typeof f.courseId === 'object' ? f.courseId?._id : f.courseId
    return cid === selected.value._id
  })
  base.forEach(f => {
    counts.all++
    const t = f.type || 'other'
    if (t in counts) counts[t]++
    else counts.other++
  })
  return counts
})

const progressValue = computed(() => Number(selected.value?.progress ?? 0))
const progressRadius = 52
const progressCircumference = 2 * Math.PI * progressRadius
const progressDashoffset = computed(() => progressCircumference * (1 - Math.max(0, Math.min(100, progressValue.value)) / 100))
const fileCounts = computed(() => {
  const counts: Record<string, number> = {}
  allFiles.value.forEach(f => {
    if (!f.courseId) return
    const cid = typeof f.courseId === 'object' ? f.courseId?._id : f.courseId
    if (cid) {
      const normalizedId = String(cid).trim()
      counts[normalizedId] = (counts[normalizedId] || 0) + 1
    }
  })
  return counts
})

const filesCount = computed(() => {
  if (!selected.value?._id) return 0
  return fileCounts.value[selected.value._id] || 0
})
const summariesCount = computed(() => Number(selected.value?.totalTasks ?? 0))
const exercisesCount = computed(() => Number(selected.value?.totalExams ?? 0))
const studyPlansCount = computed(() => 0)
const reviewedFiles = computed(() => Math.round((filesCount.value * progressValue.value) / 100))
const readSummaries = computed(() => Math.round((summariesCount.value * progressValue.value) / 100))
const solvedExercises = computed(() => Math.round((exercisesCount.value * progressValue.value) / 100))

const courseDescription = computed(() =>
  selected.value?.description || 'No description available for this course yet.'
)

const selectedCourseDate = computed(() => {
  const d = selected.value?.updatedAt || selected.value?.createdAt
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
})

const selectedTags = computed(() => {
  if (Array.isArray(selected.value?.tags) && selected.value!.tags.length) return selected.value!.tags.slice(0, 6)
  return []
})

// ─── Data Loading ─────────────────────────────────────────────────────────────
async function loadCourses() {
  const res = await get<any>('/courses', { limit: 100, sort: 'newest' })
  if (res.success) {
    courses.value = Array.isArray(res.data) ? res.data : (res.data as any)?.data || []
    if (!selected.value && courses.value.length) {
      selected.value = courses.value[0]
    } else if (selected.value) {
      // Refresh selected from new data
      const refreshed = courses.value.find(c => c._id === selected.value!._id)
      if (refreshed) selected.value = refreshed
    }
  } else {
    if (res.statusCode === 401) { router.push('/auth/signin'); return }
    apiError.value = res.message || 'Failed to load courses'
  }
}

async function loadFiles() {
  const res = await get<any>('/files', { limit: 200, sort: 'newest' })
  if (res.success) {
    allFiles.value = Array.isArray(res.data) ? res.data : (res.data as any)?.data || []
  }
}

async function loadTokenBalance() {
  const res = await get<any>('/tokens/balance')
  if (res.success) tokenBalance.value = res.data?.tokenBalance ?? null
}

async function load() {
  isLoading.value = true
  apiError.value = null
  await Promise.all([loadCourses(), loadFiles(), loadTokenBalance()])
  isLoading.value = false
  // Allow the carousel DOM to render before measuring overflow
  await nextTick()
  updateCarouselArrows()
}

// ─── Course CRUD ──────────────────────────────────────────────────────────────
function openAddModal() {
  courseForm.value = defaultForm()
  showAddModal.value = true
}

function openEditModal(c: Course) {
  courseForm.value = {
    title: c.title || '',
    description: c.description || '',
    semester: c.semester || '',
    teacher: c.teacher || '',
    color: c.color || '#4f46e5',
    priority: c.priority || 'medium',
    status: c.status || 'active',
  }
  selected.value = c
  showEditModal.value = true
}

function openDeleteModal(c: Course) {
  selected.value = c
  showDeleteModal.value = true
}

async function createCourse() {
  if (!courseForm.value.title.trim()) return
  isSavingCourse.value = true
  const res = await post<any>('/courses', courseForm.value)
  isSavingCourse.value = false
  if (res.success) {
    showAddModal.value = false
    await loadCourses()
    if (res.data) {
      selected.value = res.data
      // Scroll carousel to the newly created course
      scrollToNewCourse(res.data._id)
    }
  } else {
    alert(res.message || 'Failed to create course')
  }
}

async function updateCourse() {
  if (!selected.value || !courseForm.value.title.trim()) return
  isSavingCourse.value = true
  const res = await put<any>(`/courses/${selected.value._id}`, courseForm.value)
  isSavingCourse.value = false
  if (res.success) {
    showEditModal.value = false
    await loadCourses()
  } else {
    alert(res.message || 'Failed to update course')
  }
}

async function deleteCourse() {
  if (!selected.value) return
  isDeletingCourse.value = true
  const res = await del(`/courses/${selected.value._id}`)
  isDeletingCourse.value = false
  if (res.success) {
    showDeleteModal.value = false
    selected.value = null
    await loadCourses()
    if (courses.value.length) selected.value = courses.value[0]
  } else {
    alert(res.message || 'Failed to delete course')
  }
}

// ─── File Upload ──────────────────────────────────────────────────────────────
async function handleUpload(fileList: FileList | null) {
  if (!fileList || fileList.length === 0) return
  const file = fileList[0]
  uploadState.value = { active: true, error: null, fileName: file.name }
  const fd = new FormData()
  fd.append('file', file)
  if (selected.value) fd.append('courseId', selected.value._id)
  const res = await post<any>('/files/upload', fd)
  if (res.success) {
    uploadState.value.active = false
    await Promise.all([loadFiles(), loadCourses()])
  } else {
    uploadState.value = { active: false, error: res.message || 'Upload failed', fileName: '' }
  }
  if (uploadRef.value) uploadRef.value.value = ''
}

function onFileInputChange(e: Event) {
  handleUpload((e.target as HTMLInputElement).files)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  handleUpload(e.dataTransfer?.files || null)
}

async function deleteFile(fileId: string) {
  const res = await del(`/files/${fileId}`)
  if (res.success) await Promise.all([loadFiles(), loadCourses()])
}

function openFile(file: FileItem) {
  if (file.url) {
    window.open(`http://localhost:5000${file.url}`, '_blank')
  }
}

// ─── AI Summary ───────────────────────────────────────────────────────────────
async function generateAiSummary() {
  if (!selected.value) return
  aiSummary.value.isLoading = true
  aiSummary.value.error = null
  const res = await post<any>('/ai/summarize', { courseId: selected.value._id })
  aiSummary.value.isLoading = false
  if (res.success && res.data?.summary) {
    const s = res.data.summary
    aiSummary.value.title = s.title || ''
    aiSummary.value.summary = s.summary || ''
    aiSummary.value.keyPoints = s.keyPoints || []
    await loadTokenBalance()
  } else if (res.statusCode === 402) {
    aiSummary.value.error = 'Insufficient tokens. Please purchase more tokens to use AI features.'
  } else {
    aiSummary.value.error = res.message || 'Failed to generate summary'
  }
}

// ─── Helper Functions ─────────────────────────────────────────────────────────
function getFileIcon(t: string) {
  const type = String(t || '').toLowerCase()
  if (type === 'pdf') return 'i-lucide-file-text'
  if (type === 'pptx' || type === 'ppt') return 'i-lucide-presentation'
  if (type === 'xlsx' || type === 'xls') return 'i-lucide-file-spreadsheet'
  if (type === 'docx' || type === 'doc') return 'i-lucide-file-type'
  if (type === 'image') return 'i-lucide-image'
  return 'i-lucide-file'
}

function getFileTone(t: string) {
  const type = String(t || '').toLowerCase()
  if (type === 'pdf') return 'file-tone-danger'
  if (type === 'pptx' || type === 'ppt') return 'file-tone-ppt'
  if (type === 'xlsx' || type === 'xls') return 'file-tone-success'
  if (type === 'docx' || type === 'doc') return 'file-tone-info'
  if (type === 'image') return 'file-tone-primary'
  return 'file-tone-default'
}

function getFileTypeLabel(t: string) {
  const m: Record<string, string> = { pdf: 'PDF', docx: 'DOCX', xlsx: 'XLSX', pptx: 'PPTX', image: 'IMAGE', other: 'FILE' }
  return m[String(t || '').toLowerCase()] || String(t || 'FILE').toUpperCase()
}

function formatFileSize(bytes: number) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(d?: string) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const { getRelativeTime } = useRelativeTime()

function ago(d?: string) {
  return getRelativeTime(d)
}

function cardTone(index: number) {
  const tones = [
    'text-emerald-500 bg-emerald-50',
    'text-amber-500 bg-amber-50',
    'text-indigo-500 bg-indigo-50',
    'text-cyan-500 bg-cyan-50',
  ]
  return tones[index % tones.length]
}

function cardSubtitle(c: Course) {
  const semRaw = String(c?.semester || '').trim()
  const d = c?.updatedAt || c?.createdAt
  const fullDate = d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
  const sMatch = semRaw.match(/^s\s*(\d+)$/i)
  if (sMatch) return fullDate || `Semester ${sMatch[1]}`
  if (semRaw) return fullDate || semRaw
  return fullDate || 'Active course'
}

function getCourseColorStyle(c: Course) {
  return c.color ? { background: c.color + '18', color: c.color } : {}
}

function selectCourse(c: Course) {
  selected.value = c
  activeTypeFilter.value = 'all'
  fileSearch.value = ''
  aiSummary.value = { title: '', summary: '', keyPoints: [], isLoading: false, error: null }
}

function dismissUploadError() {
  uploadState.value.error = null
}

// ─── Sort Dropdown ────────────────────────────────────────────────────────────
const sortOptions: { label: string; value: typeof activeSortOrder.value }[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Name', value: 'name' },
  { label: 'Largest', value: 'largest' },
  { label: 'Last updated', value: 'updated' },
]

function sortLabel() {
  return sortOptions.find(o => o.value === activeSortOrder.value)?.label || 'Newest'
}

// Close sort dropdown when clicking outside
function handleOutsideClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.sort-dropdown-wrap')) showSortDropdown.value = false
  if (!target.closest('.course-actions-dropdown-wrap')) activeDropdown.value = null
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    activeDropdown.value = null
    showSortDropdown.value = false
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
let carouselResizeObserver: ResizeObserver | null = null

onMounted(() => {
  load()
  document.addEventListener('click', handleOutsideClick)
  document.addEventListener('keydown', handleKeyDown)
  // Keep arrows in sync when container resizes (window resize / sidebar toggle)
  if (typeof ResizeObserver !== 'undefined') {
    carouselResizeObserver = new ResizeObserver(() => updateCarouselArrows())
    // Observe after next tick so carouselRef is bound
    nextTick(() => {
      if (carouselRef.value) carouselResizeObserver!.observe(carouselRef.value)
    })
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
  document.removeEventListener('keydown', handleKeyDown)
  carouselResizeObserver?.disconnect()
})
</script>

<template>
  <section class="mx-auto max-w-[1400px] pb-10 min-w-0 w-full">

    <!-- ─── Loading ───────────────────────────────────────────────────────────── -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-[var(--color-primary)]" />
    </div>

    <!-- ─── API Error ─────────────────────────────────────────────────────────── -->
    <div v-else-if="apiError" class="flex flex-col items-center justify-center gap-4 py-20">
      <UIcon name="i-lucide-wifi-off" class="size-10 text-[var(--color-text-muted)]" />
      <p class="text-[var(--color-text-muted)]">{{ apiError }}</p>
      <button class="btn-primary" @click="load">Retry</button>
    </div>

    <!-- ─── Main Content ──────────────────────────────────────────────────────── -->
    <div v-else class="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">

      <!-- ═══════════════════ LEFT COLUMN ═════════════════════════════════════ -->
      <div class="space-y-5 min-w-0">

        <!-- ── Actions bar ─────────────────────────────────────────────────── -->
        <div class="flex items-center justify-end">
          <button class="btn-primary gap-2" @click="openAddModal">
            <UIcon name="i-lucide-plus" class="size-4" />
            Add Course
          </button>
        </div>

        <!-- ── Course Cards — horizontal carousel ──────────────────────────── -->
        <div v-if="courses.length" class="carousel-wrap">
          <!-- Left arrow -->
          <button
            class="carousel-arrow carousel-arrow--left"
            :class="{ 'carousel-arrow--hidden': !canScrollLeft }"
            :disabled="!canScrollLeft"
            aria-label="Scroll courses left"
            @click="carouselScrollLeft"
          >
            <UIcon name="i-lucide-chevron-left" class="size-5" />
          </button>

          <!-- Scrollable track -->
          <div
            ref="carouselRef"
            class="carousel-track"
            @scroll.passive="updateCarouselArrows"
          >
            <button
              v-for="(c, idx) in courseCards"
              :key="c._id"
              class="course-top-card flex flex-col text-left"
              :class="selected?._id === c._id ? 'course-top-card--active' : ''"
              @click="selectCourse(c)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-2 min-w-0">
                  <div
                    class="flex size-10 shrink-0 items-center justify-center rounded-[10px]"
                    :class="c.color ? '' : cardTone(idx)"
                    :style="c.color ? { background: c.color + '18', color: c.color } : {}"
                  >
                    <UIcon name="i-lucide-book-open" class="size-4" />
                  </div>
                  <div class="min-w-0 text-left">
                    <p class="truncate text-[14px] font-semibold text-[var(--color-text)] course-card-title" :title="c.title">{{ c.title }}</p>
                    <p class="mt-[1px] text-[12px] text-[var(--color-text-muted)] course-card-subtitle">{{ cardSubtitle(c) }}</p>
                  </div>
                </div>
                <div class="relative course-actions-dropdown-wrap">
                  <button
                    class="shrink-0 p-1 rounded hover:bg-[var(--color-bg)] transition"
                    @click.stop="toggleDropdown('card', c._id)"
                    title="Course actions"
                  >
                    <UIcon name="i-lucide-ellipsis" class="size-4 text-[var(--color-text-muted)]" />
                  </button>
                  <div
                    v-if="activeDropdown?.type === 'card' && activeDropdown?.courseId === c._id"
                    class="course-actions-dropdown"
                  >
                    <button
                      class="dropdown-item"
                      @click.stop="openEditModal(c); closeDropdown()"
                    >
                      <UIcon name="i-lucide-pencil" class="size-3.5" />
                      Edit
                    </button>
                    <button
                      class="dropdown-item dropdown-item--danger"
                      @click.stop="openDeleteModal(c); closeDropdown()"
                    >
                      <UIcon name="i-lucide-trash-2" class="size-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              <div class="mt-4 space-y-1 text-xs text-[var(--color-text-muted)]">
                <p class="flex items-center gap-2 course-card-meta-line">
                  <UIcon name="i-lucide-folder" class="size-3.5" />
                  {{ fileCounts[c._id] || 0 }} files
                </p>
                <p class="flex items-center gap-2 course-card-meta-line">
                  <UIcon name="i-lucide-clock-3" class="size-3.5" />
                  Updated {{ ago(c.updatedAt || c.createdAt) }}
                </p>
              </div>
            </button>
          </div>

          <!-- Right arrow -->
          <button
            class="carousel-arrow carousel-arrow--right"
            :class="{ 'carousel-arrow--hidden': !canScrollRight }"
            :disabled="!canScrollRight"
            aria-label="Scroll courses right"
            @click="carouselScrollRight"
          >
            <UIcon name="i-lucide-chevron-right" class="size-5" />
          </button>
        </div>

        <!-- ── Empty courses state ────────────────────────────────────────────── -->
        <div v-else class="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-14">
          <UIcon name="i-lucide-book-open" class="size-10 text-[var(--color-text-muted)]" />
          <p class="text-sm text-[var(--color-text-muted)]">No courses yet. Create your first course to get started.</p>
          <button class="btn-primary" @click="openAddModal">
            <UIcon name="i-lucide-plus" class="size-4" />
            Add Course
          </button>
        </div>

        <!-- ── File Filters Row ────────────────────────────────────────────────── -->
        <div class="flex flex-wrap items-center gap-2">
          <button
            class="chip chip-lg"
            :class="activeTypeFilter === 'all' ? 'chip--active' : ''"
            @click="activeTypeFilter = 'all'"
          >All Types <UIcon name="i-lucide-chevron-down" class="size-3.5" /></button>
          <button class="chip" :class="activeTypeFilter === 'pdf' ? 'chip--active' : ''" @click="activeTypeFilter = 'pdf'">
            <UIcon name="i-lucide-file-text" class="size-3.5 text-red-500" /> PDF
            <span v-if="fileTypeCounts.pdf" class="type-badge">{{ fileTypeCounts.pdf }}</span>
          </button>
          <button class="chip" :class="activeTypeFilter === 'xlsx' ? 'chip--active' : ''" @click="activeTypeFilter = 'xlsx'">
            <UIcon name="i-lucide-file-spreadsheet" class="size-3.5 text-emerald-500" /> Excel
            <span v-if="fileTypeCounts.xlsx" class="type-badge">{{ fileTypeCounts.xlsx }}</span>
          </button>
          <button class="chip" :class="activeTypeFilter === 'image' ? 'chip--active' : ''" @click="activeTypeFilter = 'image'">
            <UIcon name="i-lucide-image" class="size-3.5 text-blue-500" /> Images
            <span v-if="fileTypeCounts.image" class="type-badge">{{ fileTypeCounts.image }}</span>
          </button>
          <button class="chip" :class="activeTypeFilter === 'docx' ? 'chip--active' : ''" @click="activeTypeFilter = 'docx'">
            <UIcon name="i-lucide-file" class="size-3.5 text-slate-500" /> Docs
            <span v-if="fileTypeCounts.docx" class="type-badge">{{ fileTypeCounts.docx }}</span>
          </button>
          <button class="chip" :class="activeTypeFilter === 'pptx' ? 'chip--active' : ''" @click="activeTypeFilter = 'pptx'">
            <UIcon name="i-lucide-presentation" class="size-3.5 text-orange-500" /> PPTX
            <span v-if="fileTypeCounts.pptx" class="type-badge">{{ fileTypeCounts.pptx }}</span>
          </button>

          <div class="ml-auto flex items-center gap-2">
            <!-- Sort dropdown -->
            <div class="relative sort-dropdown-wrap">
              <button class="chip chip-lg" @click.stop="showSortDropdown = !showSortDropdown">
                Sort by: {{ sortLabel() }} <UIcon name="i-lucide-chevron-down" class="size-3.5" />
              </button>
              <div v-if="showSortDropdown" class="sort-dropdown">
                <button
                  v-for="opt in sortOptions"
                  :key="opt.value"
                  class="sort-opt"
                  :class="activeSortOrder === opt.value ? 'sort-opt--active' : ''"
                  @click="activeSortOrder = opt.value; showSortDropdown = false"
                >
                  {{ opt.label }}
                  <UIcon v-if="activeSortOrder === opt.value" name="i-lucide-check" class="size-3 ml-auto" />
                </button>
              </div>
            </div>
            <button class="icon-chip"><UIcon name="i-lucide-layout-grid" class="size-4" /></button>
            <button class="icon-chip"><UIcon name="i-lucide-list" class="size-4" /></button>
          </div>
        </div>

        <!-- ── Upload Box ─────────────────────────────────────────────────────── -->
        <div>
          <div
            class="upload-box w-full"
            :class="{ 'upload-box--dragging': isDragging, 'upload-box--uploading': uploadState.active }"
            @click="!uploadState.active && uploadRef?.click()"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
          >
            <!-- Uploading state -->
            <template v-if="uploadState.active">
              <div class="mx-auto mb-4 flex size-[58px] items-center justify-center rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-surface)] text-[var(--color-primary)]">
                <UIcon name="i-lucide-loader-2" class="size-5 animate-spin" />
              </div>
              <p class="text-lg font-semibold text-[var(--color-text)]">Uploading…</p>
              <p class="mt-2 text-sm text-[var(--color-text-muted)] truncate max-w-xs mx-auto">{{ uploadState.fileName }}</p>
            </template>
            <!-- Default state -->
            <template v-else>
              <div class="mx-auto mb-4 flex size-[58px] items-center justify-center rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-surface)] text-[var(--color-primary)]">
                <UIcon name="i-lucide-upload" class="size-5" />
              </div>
              <p class="text-lg font-semibold text-[var(--color-text)]">Upload files <span class="font-normal text-[var(--color-text-muted)]">or drag &amp; drop</span></p>
              <p class="mt-2 text-sm text-[var(--color-text-muted)]">PDF, DOCX, PPTX, XLSX, Images up to 50MB</p>
              <span class="mt-5 inline-flex rounded-[10px] border border-[var(--color-primary)]/40 px-5 py-2 text-sm font-medium text-[var(--color-primary)]">Choose Files</span>
            </template>
          </div>

          <!-- Upload error -->
          <div v-if="uploadState.error" class="mt-2 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
            <UIcon name="i-lucide-alert-circle" class="size-4 shrink-0" />
            <span>{{ uploadState.error }}</span>
            <button class="ml-auto" @click="dismissUploadError">
              <UIcon name="i-lucide-x" class="size-4" />
            </button>
          </div>
        </div>

        <input ref="uploadRef" type="file" class="hidden" accept=".pdf,.docx,.pptx,.xlsx,.png,.jpg,.jpeg" @change="onFileInputChange">

        <!-- ── Selected Course Detail ──────────────────────────────────────────── -->
        <div v-if="selected" class="detail-card">
          <!-- Breadcrumb -->
          <div class="mb-3 text-xs text-[var(--color-text-muted)]">
            Courses <span class="mx-2">›</span> {{ selected.title }}
          </div>

          <!-- Course header -->
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="flex items-start gap-4">
              <div
                class="flex size-14 items-center justify-center rounded-2xl"
                :class="selected.color ? '' : 'bg-emerald-50 text-emerald-500'"
                :style="selected.color ? { background: selected.color + '18', color: selected.color } : {}"
              >
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
                  <span v-if="selected.priority === 'high'" class="pill pill-red">High Priority</span>
                  <span v-if="selected.status === 'archived'" class="pill pill-blue">Archived</span>
                  <span v-if="selected.status === 'completed'" class="pill pill-green">Completed</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn-primary" @click="uploadRef?.click()">
                <UIcon name="i-lucide-plus" class="size-4" /> Add Files
              </button>
              <div class="relative course-actions-dropdown-wrap">
                <button
                  class="icon-chip size-11"
                  @click.stop="toggleDropdown('header', selected._id)"
                  title="Course actions"
                >
                  <UIcon name="i-lucide-ellipsis" class="size-4" />
                </button>
                <div
                  v-if="activeDropdown?.type === 'header' && activeDropdown?.courseId === selected._id"
                  class="course-actions-dropdown course-actions-dropdown--right"
                >
                  <button
                    class="dropdown-item"
                    @click.stop="openEditModal(selected); closeDropdown()"
                  >
                    <UIcon name="i-lucide-pencil" class="size-3.5" />
                    Edit
                  </button>
                  <button
                    class="dropdown-item dropdown-item--danger"
                    @click.stop="openDeleteModal(selected); closeDropdown()"
                  >
                    <UIcon name="i-lucide-trash-2" class="size-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="mt-5 border-b border-[var(--color-border)]">
            <div class="flex gap-7 text-sm">
              <span class="tab" :class="activeTab === 'overview' ? 'tab--active' : ''" @click="activeTab = 'overview'">Overview</span>
              <span class="tab" :class="activeTab === 'files' ? 'tab--active' : ''" @click="activeTab = 'files'">
                Files <span v-if="filesCount" class="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">{{ filesCount }}</span>
              </span>
              <span class="tab" :class="activeTab === 'summaries' ? 'tab--active' : ''" @click="activeTab = 'summaries'">Summaries</span>
              <span class="tab" :class="activeTab === 'exercises' ? 'tab--active' : ''" @click="activeTab = 'exercises'">Exercises</span>
            </div>
          </div>

          <!-- ── Overview Tab ────────────────────────────────────────────────── -->
          <template v-if="activeTab === 'overview'">
            <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr]">
              <!-- About card -->
              <div class="sub-card">
                <h3 class="text-lg font-semibold text-[var(--color-text)]">About this course</h3>
                <p class="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">{{ courseDescription }}</p>
                <div class="mt-5 grid grid-cols-[150px_1fr] gap-y-2 text-sm about-meta">
                  <p class="about-meta__label text-[var(--color-text-muted)]"><UIcon name="i-lucide-user-round" class="size-4 about-meta__icon" />Instructor</p><p class="text-[var(--color-text)]">{{ selected.teacher || '-' }}</p>
                  <p class="about-meta__label text-[var(--color-text-muted)]"><UIcon name="i-lucide-calendar-days" class="size-4 about-meta__icon" />Semester</p><p class="text-[var(--color-text)]">{{ selected.semester || '-' }}</p>
                  <p class="about-meta__label text-[var(--color-text-muted)]"><UIcon name="i-lucide-map-pin" class="size-4 about-meta__icon" />Room</p><p class="text-[var(--color-text)]">{{ selected.room || '-' }}</p>
                  <p class="about-meta__label text-[var(--color-text-muted)]"><UIcon name="i-lucide-badge-check" class="size-4 about-meta__icon" />Status</p><p class="text-[var(--color-text)] capitalize">{{ selected.status || 'active' }}</p>
                </div>
                <div v-if="selectedTags.length" class="mt-5">
                  <p class="text-sm font-medium text-[var(--color-text)]">Tags</p>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <span v-for="tag in selectedTags" :key="tag" class="chip chip-tag">{{ tag }}</span>
                  </div>
                </div>
              </div>

              <!-- Progress card -->
              <div class="sub-card">
                <h3 class="text-lg font-semibold text-[var(--color-text)]">Course Progress</h3>
                <div class="mt-4 flex items-center gap-5">
                  <div class="radial">
                    <svg class="radial__svg" viewBox="0 0 128 128" aria-hidden="true">
                      <circle class="radial__track" cx="64" cy="64" :r="progressRadius" />
                      <circle
                        class="radial__bar"
                        cx="64" cy="64"
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
                  <span>Keep reviewing files and solving exercises to increase your progress.</span>
                </div>
              </div>
            </div>

            <!-- What's inside -->
            <div class="mt-5">
              <h3 class="text-lg font-semibold text-[var(--color-text)]">What's inside this course</h3>
              <div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div
                  v-for="s in [
                    { l: 'Files', v: filesCount, i: 'i-lucide-file' },
                    { l: 'Summaries', v: summariesCount, i: 'i-lucide-sparkles' },
                    { l: 'Exercises', v: exercisesCount, i: 'i-lucide-pen-line' },
                    { l: 'Study Plans', v: studyPlansCount, i: 'i-lucide-calendar-days' }
                  ]"
                  :key="s.l"
                  class="mini-card mini-card--inside"
                >
                  <div class="inside-card-head">
                    <div class="inside-card-text">
                      <p class="inside-card-value text-[var(--color-text)]">{{ s.v }}</p>
                      <p class="inside-card-label">{{ s.l }}</p>
                      <button class="inside-card-link">
                        <span>View all</span>
                        <UIcon name="i-lucide-arrow-right" class="size-4" />
                      </button>
                    </div>
                    <div class="inside-card-icon-wrap"><UIcon :name="s.i" class="size-5 inside-card-icon" /></div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- ── Files Tab ───────────────────────────────────────────────────── -->
          <template v-else-if="activeTab === 'files'">
            <div class="mt-5">
              <!-- File search within course -->
              <div class="mb-4 flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
                <UIcon name="i-lucide-search" class="size-4 text-[var(--color-text-muted)]" />
                <input
                  v-model="fileSearch"
                  type="text"
                  placeholder="Search files in this course…"
                  class="flex-1 bg-transparent text-sm outline-none text-[var(--color-text)] placeholder-[var(--color-text-muted)]"
                >
              </div>

              <!-- File list -->
              <div v-if="selectedCourseFiles.length" class="space-y-2">
                <div
                  v-for="f in selectedCourseFiles"
                  :key="f._id"
                  class="course-file-row"
                >
                  <div class="recent-file-icon-wrap" :class="getFileTone(f.type)">
                    <UIcon :name="getFileIcon(f.type)" class="size-5" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate recent-file-name">{{ f.originalName || f.fileName }}</p>
                    <p class="text-xs text-[var(--color-text-muted)]">
                      {{ getFileTypeLabel(f.type) }} • {{ formatFileSize(f.size) }} • {{ ago(f.uploadedAt || f.createdAt) }}
                    </p>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <button
                      v-if="f.url"
                      class="file-action-btn"
                      title="Open file"
                      @click="openFile(f)"
                    >
                      <UIcon name="i-lucide-external-link" class="size-3.5" />
                    </button>
                    <button
                      class="file-action-btn text-red-400 hover:text-red-600"
                      title="Delete file"
                      @click="deleteFile(f._id)"
                    >
                      <UIcon name="i-lucide-trash-2" class="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Empty files state -->
              <div v-else class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] py-14">
                <UIcon name="i-lucide-folder-open" class="size-10 text-[var(--color-text-muted)]" />
                <p class="text-sm text-[var(--color-text-muted)]">
                  <span v-if="activeTypeFilter !== 'all' || fileSearch">No files match your filters.</span>
                  <span v-else>No files in this course yet. Upload a file to get started.</span>
                </p>
                <button class="btn-primary" @click="uploadRef?.click()">
                  <UIcon name="i-lucide-upload" class="size-4" /> Upload File
                </button>
              </div>
            </div>
          </template>

          <!-- ── Summaries / Exercises placeholder ─────────────────────────── -->
          <template v-else>
            <div class="mt-5 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] py-14">
              <UIcon name="i-lucide-sparkles" class="size-10 text-[var(--color-text-muted)]" />
              <p class="text-sm text-[var(--color-text-muted)]">No {{ activeTab }} yet. Generate them with AI from the summary panel.</p>
            </div>
          </template>
        </div>

        <!-- ── No course selected ──────────────────────────────────────────────── -->
        <div v-else-if="!isLoading && courses.length" class="detail-card flex flex-col items-center justify-center gap-4 py-12">
          <UIcon name="i-lucide-mouse-pointer-click" class="size-10 text-[var(--color-text-muted)]" />
          <p class="text-sm text-[var(--color-text-muted)]">Select a course above to see its details.</p>
        </div>

      </div>
      <!-- ═══════════════════ END LEFT COLUMN ══════════════════════════════════ -->

      <!-- ═══════════════════ RIGHT SIDEBAR ════════════════════════════════════ -->
      <aside class="space-y-5">

        <!-- ── AI Course Summary ───────────────────────────────────────────────── -->
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
              <button
                class="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary)] disabled:opacity-50"
                :disabled="!selected || aiSummary.isLoading"
                @click="generateAiSummary"
              >
                <span v-if="aiSummary.isLoading">Generating…</span>
                <span v-else>Regenerate</span>
                <UIcon :name="aiSummary.isLoading ? 'i-lucide-loader-2' : 'i-lucide-refresh-cw'" class="size-3.5" :class="{ 'animate-spin': aiSummary.isLoading }" />
              </button>
            </div>
            <div class="mt-3 flex gap-4 text-sm">
              <span
                class="tab px-4 py-2"
                :class="aiTab === 'overview' ? 'tab--active rounded-xl bg-[var(--color-bg)]' : ''"
                @click="aiTab = 'overview'"
              >Overview</span>
              <span
                class="tab px-4 py-2"
                :class="aiTab === 'topics' ? 'tab--active rounded-xl bg-[var(--color-bg)]' : ''"
                @click="aiTab = 'topics'"
              >Key Topics</span>
            </div>
          </div>

          <div class="space-y-2 p-3 mt-2 text-sm text-[var(--color-text-muted)]">
            <!-- No course selected -->
            <template v-if="!selected">
              <p class="ai-summary-description">Select a course to view or generate its AI summary.</p>
            </template>
            <!-- Insufficient tokens -->
            <template v-else-if="aiSummary.error?.includes('Insufficient')">
              <div class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-700 text-xs">
                <p class="font-semibold mb-1">Insufficient tokens</p>
                <p>Purchase more tokens to generate AI summaries.</p>
              </div>
            </template>
            <!-- Error -->
            <template v-else-if="aiSummary.error">
              <p class="text-red-500 text-xs">{{ aiSummary.error }}</p>
            </template>
            <!-- Overview tab -->
            <template v-else-if="aiTab === 'overview'">
              <p class="ai-summary-description">
                {{ aiSummary.summary || courseDescription }}
              </p>
              <template v-if="aiSummary.keyPoints.length">
                <p v-for="point in aiSummary.keyPoints.slice(0, 5)" :key="point" class="flex gap-2 ai-summary-point">
                  <UIcon name="i-lucide-check-circle-2" class="mt-0.5 size-4 shrink-0 text-[var(--color-success)]" />{{ point }}
                </p>
              </template>
              <template v-else-if="!aiSummary.summary">
                <p class="text-xs italic">Click Regenerate to generate an AI summary for this course.</p>
              </template>
            </template>
            <!-- Key Topics tab -->
            <template v-else>
              <template v-if="aiSummary.keyPoints.length">
                <p v-for="point in aiSummary.keyPoints" :key="point" class="flex gap-2 ai-summary-point">
                  <UIcon name="i-lucide-check-circle-2" class="mt-0.5 size-4 shrink-0 text-[var(--color-success)]" />{{ point }}
                </p>
              </template>
              <template v-else-if="selectedTags.length">
                <p v-for="tag in selectedTags" :key="tag" class="flex gap-2 ai-summary-point">
                  <UIcon name="i-lucide-tag" class="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]" />{{ tag }}
                </p>
              </template>
              <template v-else>
                <p class="text-xs italic">No key topics yet. Click Regenerate to extract topics from this course.</p>
              </template>
            </template>
          </div>

          <!-- Token balance & View summary -->
          <div class="p-3 pt-0 space-y-2">
            <div v-if="tokenBalance !== null" class="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
              <UIcon name="i-lucide-coins" class="size-3.5 text-[var(--color-warning)]" />
              Token balance: <span class="font-semibold text-[var(--color-text)]">{{ tokenBalance.toLocaleString() }}</span>
            </div>
            <button class="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]">
              View full summary
            </button>
          </div>
        </div>

        <!-- ── Recent Uploads ─────────────────────────────────────────────────── -->
        <div class="side-card side-card-lg">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-[var(--color-text)]">Recent uploads</h3>
            <NuxtLink to="/dashboard/files" class="text-xs font-semibold text-[var(--color-primary)]">View all</NuxtLink>
          </div>
          <div v-if="!recentUploads.length" class="py-4 text-center text-sm text-[var(--color-text-muted)]">No files yet.</div>
          <div class="space-y-3">
            <div
              v-for="f in recentUploads"
              :key="f._id"
              class="recent-file-row cursor-pointer"
              @click="openFile(f)"
            >
              <div class="recent-file-icon-wrap" :class="getFileTone(f.type)">
                <UIcon :name="getFileIcon(f.type)" class="size-5" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate recent-file-name">{{ f.originalName || f.fileName }}</p>
                <p class="text-xs text-[var(--color-text-muted)]">{{ getFileTypeLabel(f.type) }} • {{ formatFileSize(f.size) }} • Uploaded {{ ago(f.uploadedAt || f.createdAt) }}</p>
              </div>
            </div>
          </div>
          <NuxtLink to="/dashboard/files" class="recent-files-cta">
            <UIcon name="i-lucide-folder" class="size-4" />
            <span>Browse all files</span>
          </NuxtLink>
        </div>

      </aside>
      <!-- ═══════════════════ END RIGHT SIDEBAR ════════════════════════════════ -->

    </div><!-- end main grid -->

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- MODALS                                                                  -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->

    <!-- ── Add Course Modal ───────────────────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div class="modal-box">
          <div class="modal-header">
            <h2 class="modal-title">Add New Course</h2>
            <button class="modal-close" @click="showAddModal = false">
              <UIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Course Title *</label>
              <input v-model="courseForm.title" type="text" class="form-input" placeholder="e.g. Database Systems" />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea v-model="courseForm.description" class="form-input form-textarea" rows="3" placeholder="What is this course about?"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Semester</label>
                <input v-model="courseForm.semester" type="text" class="form-input" placeholder="e.g. S3" />
              </div>
              <div class="form-group">
                <label class="form-label">Teacher / Instructor</label>
                <input v-model="courseForm.teacher" type="text" class="form-input" placeholder="e.g. Dr. Smith" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Priority</label>
                <select v-model="courseForm.priority" class="form-input form-select">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Status</label>
                <select v-model="courseForm.status" class="form-input form-select">
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Color</label>
              <div class="color-presets">
                <button
                  v-for="color in colorPresets"
                  :key="color"
                  class="color-dot"
                  :class="courseForm.color === color ? 'color-dot--active' : ''"
                  :style="{ background: color }"
                  @click="courseForm.color = color"
                />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showAddModal = false">Cancel</button>
            <button class="btn-primary" :disabled="!courseForm.title.trim() || isSavingCourse" @click="createCourse">
              <UIcon v-if="isSavingCourse" name="i-lucide-loader-2" class="size-4 animate-spin" />
              Create Course
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Edit Course Modal ──────────────────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
        <div class="modal-box">
          <div class="modal-header">
            <h2 class="modal-title">Edit Course</h2>
            <button class="modal-close" @click="showEditModal = false">
              <UIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Course Title *</label>
              <input v-model="courseForm.title" type="text" class="form-input" placeholder="Course title" />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea v-model="courseForm.description" class="form-input form-textarea" rows="3"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Semester</label>
                <input v-model="courseForm.semester" type="text" class="form-input" placeholder="e.g. S3" />
              </div>
              <div class="form-group">
                <label class="form-label">Teacher</label>
                <input v-model="courseForm.teacher" type="text" class="form-input" placeholder="e.g. Dr. Smith" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Priority</label>
                <select v-model="courseForm.priority" class="form-input form-select">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Status</label>
                <select v-model="courseForm.status" class="form-input form-select">
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Color</label>
              <div class="color-presets">
                <button
                  v-for="color in colorPresets"
                  :key="color"
                  class="color-dot"
                  :class="courseForm.color === color ? 'color-dot--active' : ''"
                  :style="{ background: color }"
                  @click="courseForm.color = color"
                />
              </div>
            </div>
          </div>
          <div class="modal-footer justify-end">
            <button class="btn-ghost" @click="showEditModal = false">Cancel</button>
            <button class="btn-primary" :disabled="!courseForm.title.trim() || isSavingCourse" @click="updateCourse">
              <UIcon v-if="isSavingCourse" name="i-lucide-loader-2" class="size-4 animate-spin" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Delete Course Confirmation Modal ──────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal-box modal-box--sm">
          <div class="modal-header">
            <h2 class="modal-title">Delete Course</h2>
            <button class="modal-close" @click="showDeleteModal = false">
              <UIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>
          <div class="modal-body">
            <div class="flex items-start gap-3 mb-4">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <UIcon name="i-lucide-alert-triangle" class="size-5" />
              </div>
              <div>
                <p class="font-semibold text-[var(--color-text)]">Are you sure?</p>
                <p class="mt-1 text-sm text-[var(--color-text-muted)]">
                  This will permanently delete <strong>{{ selected?.title }}</strong>. Files associated with this course will remain but lose their course link.
                </p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showDeleteModal = false">Cancel</button>
            <button class="btn-danger" :disabled="isDeletingCourse" @click="deleteCourse">
              <UIcon v-if="isDeletingCourse" name="i-lucide-loader-2" class="size-4 animate-spin" />
              Delete Course
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </section>
</template>

<style scoped>
/* ─── Carousel ─────────────────────────────────────────────────────────────── */
.carousel-wrap {
  position: relative;
}


.carousel-track {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  /* hide scrollbar but keep it functional */
  scrollbar-width: none;          /* Firefox */
  -ms-overflow-style: none;       /* IE/Edge */
  /* small padding so box-shadow of cards isn't clipped */
  padding: 4px 2px 8px;
}

.carousel-track::-webkit-scrollbar {
  display: none;                   /* Chrome/Safari */
}

.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%) scale(1);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Larger click target: 36×36 pill */
  width: 36px;
  height: 36px;
  border-radius: 50%;
  /* Glass / elevated card look */
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.10), 0 1px 2px rgba(15, 23, 42, 0.06);
  color: var(--color-text-muted);
  cursor: pointer;
  /* Animate opacity (disabled fade), transform (pop), shadow, color */
  transition:
    opacity .25s ease,
    visibility .25s ease,
    transform .25s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow .15s ease,
    color .15s ease,
    background .15s ease;
  /* Offset from track padding */
  margin-top: -4px;
}

/* Touch/mobile devices default states: visible by default */
.carousel-arrow:active {
  transform: translateY(-50%) scale(0.96);
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.10);
}

/* Desktop hover-capable interactions */
@media (hover: hover) {
  .carousel-arrow {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(-50%) scale(0.9);
  }

  .carousel-wrap:hover .carousel-arrow {
    opacity: 0.8;
    visibility: visible;
    pointer-events: auto;
    transform: translateY(-50%) scale(1);
  }

  .carousel-wrap:hover .carousel-arrow:hover {
    opacity: 1;
    background: #fff;
    color: var(--color-primary);
    box-shadow:
      0 0 0 3px color-mix(in srgb, var(--color-primary) 14%, transparent),
      0 4px 14px rgba(79, 70, 229, 0.18),
      0 1px 3px rgba(15, 23, 42, 0.08);
    transform: translateY(-50%) scale(1.12);
  }

  .carousel-wrap:hover .carousel-arrow:active {
    transform: translateY(-50%) scale(0.96);
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.10);
  }
}

.carousel-arrow--left  { left: -18px; }
.carousel-arrow--right { right: -18px; }

.carousel-arrow--hidden {
  opacity: 0 !important;
  pointer-events: none !important;
  visibility: hidden !important;
  transform: translateY(-50%) scale(0.8) !important;
}

/* ─── Course Actions Dropdown ────────────────────────────────────────── */
.course-actions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 6px;
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04);
  z-index: 50;
  display: flex;
  flex-direction: column;
  padding: 4px;
  min-width: 110px;
}

.course-actions-dropdown--right {
  left: auto;
  right: 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  border-radius: 6px;
  text-align: left;
  transition: background 0.15s ease, color 0.15s ease;
  cursor: pointer;
  background: transparent;
  border: none;
}

.dropdown-item:hover {
  background: var(--color-bg);
}

.dropdown-item--danger {
  color: #ef4444;
}

.dropdown-item--danger:hover {
  background: #fef2f2;
}

/* ─── Course Cards ─────────────────────────────────────────────────────────── */
.course-top-card {
  /* Fixed width — never shrink, never grow */
  flex: 0 0 256px;
  width: 256px;
  height: 144px;
  scroll-snap-align: start;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
  padding: 14px;
  transition: all .2s ease;
}

.course-top-card:hover {
  box-shadow: var(--shadow-md);
  border-color: color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
}

.course-top-card--active {
  border-color: color-mix(in srgb, var(--color-primary) 75%, white);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-primary) 22%, transparent), var(--shadow-sm);
}

.course-card-title,
.course-card-subtitle { margin-bottom: 0; }

.course-card-meta-line { margin-bottom: 8px; }


/* ─── Chips ────────────────────────────────────────────────────────────────── */
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
  cursor: pointer;
  transition: all .15s ease;
}

.chip:hover { border-color: var(--color-primary); color: var(--color-primary); }

.chip--active {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, white);
  color: var(--color-primary);
  font-weight: 600;
}

.chip-lg { padding: 8px 10px; }

.chip-tag {
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-primary) 9%, transparent);
  color: var(--color-primary);
  border-color: color-mix(in srgb, var(--color-primary) 20%, var(--color-border));
}

.type-badge {
  background: var(--color-primary);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  border-radius: 999px;
  padding: 1px 5px;
  line-height: 1.4;
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
  cursor: pointer;
}

/* ─── Sort Dropdown ────────────────────────────────────────────────────────── */
.sort-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 50;
  min-width: 160px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  padding: 6px;
}

.sort-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  font-size: 13px;
  border-radius: 8px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all .1s ease;
}

.sort-opt:hover { background: var(--color-bg); color: var(--color-text); }
.sort-opt--active { color: var(--color-primary); font-weight: 600; }

/* ─── Upload Box ───────────────────────────────────────────────────────────── */
.upload-box {
  border: 2px dashed color-mix(in srgb, var(--color-primary) 20%, var(--color-border));
  border-radius: 16px;
  padding: 34px 20px;
  text-align: center;
  background: color-mix(in srgb, var(--color-surface) 70%, var(--color-bg));
  cursor: pointer;
  transition: all .2s ease;
}

.upload-box:hover {
  border-color: color-mix(in srgb, var(--color-primary) 60%, var(--color-border));
  background: color-mix(in srgb, var(--color-primary) 3%, var(--color-bg));
}

.upload-box--dragging {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 6%, var(--color-bg));
}

.upload-box--uploading { cursor: not-allowed; }

/* ─── Detail Card ──────────────────────────────────────────────────────────── */
.detail-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
  padding: 20px;
}

/* ─── Sidebar Cards ────────────────────────────────────────────────────────── */
.side-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
  padding: 12px;
}

.side-card-lg { padding: 24px; }

/* ─── Sub Cards ────────────────────────────────────────────────────────────── */
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

/* ─── Buttons ──────────────────────────────────────────────────────────────── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 10px;
  height: 36px;
  padding: 0 14px;
  color: #fff;
  background: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
  transition: background .15s ease;
  cursor: pointer;
}

.btn-primary:hover { background: var(--color-primary-hover); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  height: 36px;
  padding: 0 14px;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid var(--color-border);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s ease;
}

.btn-ghost:hover { color: var(--color-text); background: var(--color-bg); }

.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  height: 36px;
  padding: 0 14px;
  color: #fff;
  background: #ef4444;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s ease;
}

.btn-danger:hover { background: #dc2626; }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-danger-ghost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  height: 36px;
  padding: 0 14px;
  color: #ef4444;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s ease;
}

.btn-danger-ghost:hover { background: #fef2f2; }

/* ─── Tabs ─────────────────────────────────────────────────────────────────── */
.tab {
  position: relative;
  color: var(--color-text-muted);
  padding-bottom: 10px;
  cursor: pointer;
  transition: color .15s ease;
}

.tab:hover { color: var(--color-text); }

.tab--active {
  color: var(--color-primary);
  font-weight: 600;
}

.tab--active::after {
  content: '';
  position: absolute;
  left: 0; right: 0;
  bottom: -1px;
  height: 2px;
  border-radius: 999px;
  background: var(--color-primary);
}

/* ─── Pills ────────────────────────────────────────────────────────────────── */
.pill {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
}

.pill-blue { color: #4f46e5; background: #eef2ff; }
.pill-red  { color: #ef4444; background: #fef2f2; }
.pill-green { color: #10b981; background: #d1fae5; }

/* ─── Radial Progress ──────────────────────────────────────────────────────── */
.radial {
  --size: 148px;
  position: relative;
  width: var(--size);
  height: var(--size);
}

.radial__svg {
  width: 100%; height: 100%;
  transform: rotate(-90deg);
}

.radial__track,
.radial__bar {
  fill: none;
  stroke-width: 12;
}

.radial__track { stroke: color-mix(in srgb, var(--color-primary) 14%, transparent); }

.radial__bar {
  stroke: var(--color-primary);
  stroke-linecap: round;
  transition: stroke-dashoffset .25s ease;
}

.radial__inner {
  position: absolute;
  inset: 30px;
  border-radius: 999px;
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.radial__value { margin: 0; }
.radial__label { margin: 0; }

/* ─── Progress Lines ───────────────────────────────────────────────────────── */
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

.progress-line__icon { color: color-mix(in srgb, var(--color-primary) 60%, var(--color-text-muted)); }

.progress-note {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-note__icon { color: var(--color-primary); flex-shrink: 0; }

/* ─── AI Summary ───────────────────────────────────────────────────────────── */
.ai-summary-description { margin-bottom: 16px; }
.ai-summary-point { margin-bottom: 8px; }

/* ─── Recent Files ─────────────────────────────────────────────────────────── */
.recent-file-row {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 14px;
  background: var(--color-surface);
  transition: box-shadow .15s ease;
}

.recent-file-row:hover { box-shadow: var(--shadow-sm); }

.course-file-row {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 12px;
  background: var(--color-surface);
  transition: box-shadow .15s ease;
}

.course-file-row:hover { box-shadow: var(--shadow-sm); }

.recent-file-icon-wrap {
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
  border: 1px solid currentColor;
  background: #fff;
}

.file-tone-danger { color: #ef4444; }
.file-tone-ppt    { color: #f97316; }
.file-tone-success { color: #22c55e; }
.file-tone-info   { color: #60a5fa; }
.file-tone-primary { color: #8b5cf6; }
.file-tone-default { color: #64748b; }

.recent-file-name {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.file-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px; height: 28px;
  border-radius: 8px;
  color: var(--color-text-muted);
  transition: all .15s ease;
  cursor: pointer;
}

.file-action-btn:hover { background: var(--color-bg); color: var(--color-text); }

.recent-files-cta {
  margin-top: 16px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  transition: background .15s ease;
}

.recent-files-cta:hover { background: color-mix(in srgb, var(--color-primary) 6%, var(--color-bg)); }

/* ─── About Meta ───────────────────────────────────────────────────────────── */
.about-meta p { margin: 0; }

.about-meta__label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.about-meta__icon { color: #8a90b8; }

/* ─── Inside Cards ─────────────────────────────────────────────────────────── */
.mini-card--inside { padding: 16px 18px; }

.inside-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.inside-card-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.inside-card-value {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
}

.inside-card-icon-wrap {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--color-primary) 8%, var(--color-bg));
}

.inside-card-icon { color: var(--color-primary); }

.inside-card-label {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.2;
  color: var(--color-text-muted);
}

.inside-card-link {
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-primary);
}

/* ─── Course Detail Header ─────────────────────────────────────────────────── */
.course-detail-title { font-size: 22px; }

/* ─── Modals ───────────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-box {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modal-in .2s ease;
}

.modal-box--sm { max-width: 420px; }

@keyframes modal-in {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 0;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.modal-close {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  border-radius: 8px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all .15s ease;
}

.modal-close:hover { background: var(--color-bg); color: var(--color-text); }

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-footer {
  padding: 16px 20px 20px;
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ─── Form ─────────────────────────────────────────────────────────────────── */
.form-group { display: flex; flex-direction: column; gap: 6px; }

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 13px;
  color: var(--color-text);
  background: var(--color-bg);
  outline: none;
  transition: border-color .15s ease;
  font-family: var(--font-sans);
}

.form-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent); }

.form-textarea { resize: vertical; min-height: 80px; }

.form-select { cursor: pointer; }

/* ─── Color Picker ─────────────────────────────────────────────────────────── */
.color-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-dot {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform .15s ease;
}

.color-dot:hover { transform: scale(1.15); }

.color-dot--active {
  border-color: var(--color-text);
  transform: scale(1.15);
  box-shadow: 0 0 0 2px var(--color-surface), 0 0 0 4px currentColor;
}
</style>
