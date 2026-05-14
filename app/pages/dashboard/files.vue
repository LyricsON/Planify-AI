<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'

definePageMeta({ layout: 'dashboard' })
const { get, post } = useApi()

// Data
const files = ref<any[]>([])
const folders = ref<any[]>([])
const isLoading = ref(true)
const search = ref('')
const selectedFolder = ref('')
const selectedFile = ref<any>(null)
const uploadRef = ref<HTMLInputElement | null>(null)

const isDetailsModalOpen = ref(false)
const modalFile = ref<any>(null)
const openDetailsModal = (file: any) => {
  modalFile.value = file
  isDetailsModalOpen.value = true
}

// Filters & State
const activeTab = ref('All Files')
const isTypeDropdownOpen = ref(false)
const typeDropdownRef = ref<HTMLElement | null>(null)
const tabs = [
  { name: 'All Files', icon: 'i-lucide-layers', color: 'indigo' },
  { name: 'PDF', icon: 'i-lucide-file-text', color: 'rose' },
  { name: 'Excel', icon: 'i-lucide-file-spreadsheet', color: 'emerald' },
  { name: 'PowerPoint', icon: 'i-lucide-presentation', color: 'orange' },
  { name: 'Images', icon: 'i-lucide-image', color: 'purple' },
  { name: 'Docs', icon: 'i-lucide-file-type', color: 'blue' },
  { name: 'Notes', icon: 'i-lucide-notebook', color: 'amber' },
]

const activeTabMeta = computed(() => tabs.find(t => t.name === activeTab.value) || tabs[0])

const selectTab = (name: string) => {
  activeTab.value = name
  isTypeDropdownOpen.value = false
}

const handleClickOutside = (e: MouseEvent) => {
  if (typeDropdownRef.value && !typeDropdownRef.value.contains(e.target as Node)) {
    isTypeDropdownOpen.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))

const page = ref(1)
const total = ref(0)
const storageUsed = ref(0)
const MAX_STORAGE = 20 * 1024 * 1024 * 1024 // 20GB

// Fallback Mock Data
const mockFolders = [
  { _id: '1', title: 'Mathematics', filesCount: 24, colorClass: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' },
  { _id: '2', title: 'Physics', filesCount: 18, colorClass: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' },
  { _id: '3', title: 'Computer Science', filesCount: 16, colorClass: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' },
  { _id: '4', title: 'Data Structures', filesCount: 12, colorClass: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10' },
  { _id: '5', title: 'General Notes', filesCount: 30, colorClass: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
]

async function load() {
  isLoading.value = true
  try {
    const [fR, cR] = await Promise.all([
      get<any>('/files', { page: page.value, limit: 100, sort: 'newest' }),
      get<any>('/courses')
    ])
    if (fR.success) {
      files.value = Array.isArray(fR.data) ? fR.data : fR.data?.data || []
      total.value = fR.data?.total || files.value.length
      storageUsed.value = files.value.reduce((acc: number, f: any) => acc + (f.size || 0), 0)
      if (!selectedFile.value && files.value.length > 0) {
         selectedFile.value = files.value[0]
      }
    }
    if (cR.success) {
      folders.value = Array.isArray(cR.data) ? cR.data : cR.data?.data || []
    }
  } catch (error) {
    console.error('Error loading files data:', error)
  }
  isLoading.value = false
}

async function upload(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  const fd = new FormData()
  fd.append('file', f)
  if (selectedFolder.value) fd.append('courseId', selectedFolder.value)
  await post('/files/upload', fd)
  await load()
}

onMounted(() => {
  load()
})

const getTypesForTab = (tabName: string): string[] => {
  if (tabName === 'All Files') return []
  const types: Record<string, string[]> = {
    'PDF': ['pdf'],
    'Excel': ['xlsx', 'xls', 'csv'],
    'PowerPoint': ['pptx', 'ppt'],
    'Images': ['png', 'jpg', 'jpeg', 'gif', 'svg'],
    'Docs': ['docx', 'doc', 'txt'],
    'Notes': ['notes'] 
  }
  return types[tabName] || []
}

const filteredFiles = computed(() => {
  let result = files.value

  // Folder filter
  if (selectedFolder.value) {
    result = result.filter(f => f.courseId?._id === selectedFolder.value || f.courseId === selectedFolder.value)
  }

  // Type filter
  const allowedTypes = getTypesForTab(activeTab.value)
  if (allowedTypes.length > 0) {
    result = result.filter(f => allowedTypes.includes(f.type?.toLowerCase()))
  }

  return result
})

const currentPage = ref(1)
const ITEMS_PER_PAGE = 5

watch([activeTab, selectedFolder], () => {
  currentPage.value = 1
})

const totalPages = computed(() => Math.ceil(filteredFiles.value.length / ITEMS_PER_PAGE))

const paginatedFiles = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  return filteredFiles.value.slice(start, start + ITEMS_PER_PAGE)
})

const getFolderFileCount = (folderId: string) => {
  const allowedTypes = getTypesForTab(activeTab.value)
  return files.value.filter(f => {
    const matchesFolder = f.courseId?._id === folderId || f.courseId === folderId
    const matchesTab = allowedTypes.length === 0 || allowedTypes.includes(f.type?.toLowerCase())
    return matchesFolder && matchesTab
  }).length
}

// UI Helpers
const getFileIcon = (t: string) => {
  const type = t?.toLowerCase()
  if (['pdf'].includes(type)) return 'i-lucide-file-text'
  if (['xlsx', 'xls', 'csv'].includes(type)) return 'i-lucide-file-spreadsheet'
  if (['pptx', 'ppt'].includes(type)) return 'i-lucide-presentation'
  if (['docx', 'doc', 'txt'].includes(type)) return 'i-lucide-file-type'
  if (['png', 'jpg', 'jpeg', 'gif'].includes(type)) return 'i-lucide-image'
  return 'i-lucide-file'
}

const getFileColorClass = (t: string) => {
  const type = t?.toLowerCase()
  if (['pdf'].includes(type)) return 'text-rose-500 bg-rose-50 dark:bg-rose-500/10'
  if (['xlsx', 'xls', 'csv'].includes(type)) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
  if (['pptx', 'ppt'].includes(type)) return 'text-orange-500 bg-orange-50 dark:bg-orange-500/10'
  if (['docx', 'doc', 'txt'].includes(type)) return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10'
  if (['png', 'jpg', 'jpeg', 'gif'].includes(type)) return 'text-purple-500 bg-purple-50 dark:bg-purple-500/10'
  return 'text-slate-500 bg-slate-100 dark:bg-slate-800'
}

const formatSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const timeAgo = (d: string) => {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)} days ago`
}

const formatDate = (d: string) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' • ' + new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const getFileTags = (file: any) => {
  if (file.tags && file.tags.length) return file.tags
  // Mock tags based on filename if missing
  const name = (file.originalName || file.fileName || '').toLowerCase()
  const tags = []
  if (name.includes('calculus') || name.includes('integration')) tags.push('Calculus', 'Integration')
  if (name.includes('algebra') || name.includes('matrices')) tags.push('Algebra')
  if (name.includes('note') || name.includes('chapter')) tags.push('Notes')
  if (name.includes('problem') || name.includes('set')) tags.push('Problem Solving')
  if (name.includes('algorithm') || name.includes('sort')) tags.push('Algorithms')
  if (name.includes('database') || name.includes('sql')) tags.push('Database')
  if (name.includes('quantum') || name.includes('mechanics')) tags.push('Theory')
  if (tags.length === 0) tags.push('General')
  return tags
}

const getTagColorClass = (tag: string) => {
  const t = tag.toLowerCase()
  if (t.includes('calculus') || t.includes('integration')) return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10'
  if (t.includes('algebra') || t.includes('algorithm')) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10'
  if (t.includes('note') || t.includes('database')) return 'text-blue-600 bg-blue-50 dark:bg-blue-500/10'
  if (t.includes('problem') || t.includes('theory')) return 'text-amber-600 bg-amber-50 dark:bg-amber-500/10'
  return 'text-slate-600 bg-slate-100 dark:bg-slate-800'
}

const getFolderColor = (index: number) => {
  const colors = [
    'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
    'text-amber-500 bg-amber-50 dark:bg-amber-500/10',
    'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10',
    'text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10',
    'text-slate-500 bg-slate-100 dark:bg-slate-800',
    'text-rose-500 bg-rose-50 dark:bg-rose-500/10'
  ]
  return colors[index % colors.length]
}

const storagePct = computed(() => Math.min(100, (storageUsed.value / MAX_STORAGE) * 100))
const displayFolders = computed(() => folders.value.length ? folders.value : mockFolders)

const recentUploads = computed(() => {
  return [...files.value].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3)
})

</script>

<template>
  <div class="max-w-[1400px] mx-auto pb-10 flex flex-col gap-6">

    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-indigo-600" />
    </div>

    <!-- Main Grid -->
    <div v-else class="grid grid-cols-1 xl:grid-cols-[1fr_340px] 2xl:grid-cols-[1fr_340px] gap-6 items-start">
      
      <!-- LEFT COLUMN -->
      <div class="flex flex-col gap-5">

        <!-- LEFT: Filters Row (independent of right column) -->
        <div class="flex items-center justify-between gap-2">

          <!-- File Type Dropdown -->
          <div class="relative" ref="typeDropdownRef">
            <button
              @click="isTypeDropdownOpen = !isTypeDropdownOpen"
              class="flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-[8px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[12px] font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-all whitespace-nowrap w-[160px] justify-between"
              :class="isTypeDropdownOpen ? 'border-indigo-300 dark:border-indigo-500/50 ring-2 ring-indigo-500/15' : ''"
              aria-haspopup="listbox"
              :aria-expanded="isTypeDropdownOpen"
            >
              <span class="flex items-center gap-1.5">
                <UIcon :name="activeTabMeta.icon" class="size-3.5" :class="`text-${activeTabMeta.color}-500`" />
                {{ activeTabMeta.name }}
              </span>
              <UIcon
                name="i-lucide-chevron-down"
                class="size-3.5 text-slate-400 transition-transform duration-200"
                :class="isTypeDropdownOpen ? 'rotate-180' : ''"
              />
            </button>

            <!-- Dropdown Panel -->
            <Transition
              enter-active-class="transition ease-out duration-150"
              enter-from-class="opacity-0 translate-y-[-4px] scale-[0.98]"
              enter-to-class="opacity-100 translate-y-0 scale-100"
              leave-active-class="transition ease-in duration-100"
              leave-from-class="opacity-100 translate-y-0 scale-100"
              leave-to-class="opacity-0 translate-y-[-4px] scale-[0.98]"
            >
              <div
                v-if="isTypeDropdownOpen"
                role="listbox"
                class="absolute top-full left-0 mt-1.5 z-50 w-[160px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-lg shadow-slate-900/8 dark:shadow-slate-900/40 py-1.5 overflow-hidden"
              >
                <button
                  v-for="tab in tabs"
                  :key="tab.name"
                  role="option"
                  :aria-selected="activeTab === tab.name"
                  @click="selectTab(tab.name)"
                  class="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] font-semibold transition-colors text-left"
                  :class="[
                    activeTab === tab.name
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  ]"
                >
                  <UIcon
                    :name="tab.icon"
                    class="size-3.5 shrink-0"
                    :class="activeTab === tab.name ? 'text-indigo-500' : `text-${tab.color}-500`"
                  />
                  {{ tab.name }}
                  <UIcon
                    v-if="activeTab === tab.name"
                    name="i-lucide-check"
                    class="size-3 ml-auto text-indigo-500 shrink-0"
                  />
                </button>
              </div>
            </Transition>
          </div>

          <!-- Sort + View Toggle (right side of left filter bar) -->
          <div class="flex flex-row items-center gap-2">
            <!-- Sort Dropdown -->
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-all">
              <span class="text-[12px] text-slate-500 font-medium">Sort by:</span>
              <span class="text-[12px] text-slate-700 dark:text-slate-200 font-bold">Last updated</span>
              <UIcon name="i-lucide-chevron-down" class="size-3.5 text-slate-400" />
            </div>

            <!-- View Toggle -->
            <div class="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[8px] py-1 px-1 shadow-sm">
              <button class="px-1 rounded-[6px] text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10">
                <UIcon name="i-lucide-layout-grid" class="size-3.5" />
              </button>
              <button class="px-1 rounded-[6px] text-slate-400 hover:text-slate-600 transition-colors">
                <UIcon name="i-lucide-list" class="size-3.5" />
              </button>
            </div>
          </div>
        </div>
        
        <!-- Upload Dropzone -->
        <div 
          @click="uploadRef?.click()"
          class="flex flex-col items-center justify-center p-8 rounded-[16px] border-[1.5px] border-dashed border-indigo-200 dark:border-indigo-500/30 bg-white dark:bg-slate-900 cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-colors shadow-sm"
        >
          <div class="size-12 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center mb-3 text-indigo-600 bg-white dark:bg-slate-900 shadow-sm">
            <UIcon name="i-lucide-cloud-upload" class="size-5" />
          </div>
          <p class="text-[14px] font-medium text-slate-700 dark:text-slate-200 mb-1">
            Drag & drop files here, or <span class="text-indigo-600 font-bold hover:underline">click to browse</span>
          </p>
          <p class="text-[12px] text-slate-500 mb-4">PDF, DOCX, PPTX, XLSX, Images up to 50MB</p>
          <button class="px-5 py-2 rounded-[10px] border border-slate-200 dark:border-slate-700 text-indigo-600 text-[13px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            Choose Files
          </button>
        </div>

        <!-- Folders Section -->
        <div class="bg-white dark:bg-slate-900 rounded-[16px] border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-[16px] font-bold text-slate-900 dark:text-white">Folders</h3>
            <button class="text-[13px] font-bold text-indigo-600 flex items-center gap-1 hover:underline">
              View all folders <UIcon name="i-lucide-arrow-right" class="size-4" />
            </button>
          </div>
          <!-- Folders Grid -->
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div
              v-for="(folder, i) in displayFolders"
              :key="folder._id || i"
              class="flex items-center gap-3 p-3 rounded-[12px] bg-white dark:bg-slate-900 cursor-pointer transition-all duration-300 ease-out"
              @click="selectedFolder = selectedFolder === folder._id ? '' : folder._id"
              :class="[
                 selectedFolder === folder._id
                    ? 'border-[1.5px] border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                    : 'border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:ring-[3px] hover:ring-indigo-400/20 dark:hover:ring-indigo-500/20 hover:shadow-md hover:shadow-indigo-500/5 hover:-translate-y-0.5'
              ]"
            >
              <div class="flex items-center justify-center shrink-0" :class="(folder.colorClass || getFolderColor(i)).split(' ')[0]">
                <UIcon name="i-heroicons-folder-solid" class="size-8 opacity-90" />
              </div>
              <div class="flex flex-col min-w-0 pr-1">
                <p class="text-[12px] font-bold text-slate-900 dark:text-white truncate leading-tight !m-0 !mb-0">
                  {{ folder.title }}
                </p>
                <p class="text-[11px] font-medium text-slate-500 !m-0 !mb-0 !mt-0.5">{{ getFolderFileCount(folder._id) }} files</p>
              </div>
            </div>
          </div>
        </div>

        <!-- All Files Table -->
        <div class="bg-white dark:bg-slate-900 rounded-[16px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div class="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800/50">
            <h3 class="text-[16px] font-bold text-slate-900 dark:text-white">
              {{ activeTab }} <span class="text-slate-400 font-medium">({{ filteredFiles.length }})</span>
            </h3>
            <button class="text-slate-400 hover:text-slate-600">
              <UIcon name="i-lucide-settings" class="size-5" />
            </button>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-[700px] table-fixed">
              <thead>
                <tr class="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
                  <th class="py-3 px-5 text-[12px] font-semibold text-slate-500 tracking-wider w-[35%]">Name</th>
                  <th class="py-3 px-2 text-[12px] font-semibold text-slate-500 tracking-wider w-[12%]">Course</th>
                  <th class="py-3 px-2 text-[12px] font-semibold text-slate-500 tracking-wider w-[10%]">Size</th>
                  <th class="py-3 px-2 text-[12px] font-semibold text-slate-500 tracking-wider w-[15%]">Uploaded</th>
                  <th class="py-3 px-2 text-[12px] font-semibold text-slate-500 tracking-wider w-[18%]">Tags</th>
                  <th class="py-3 px-2 text-[12px] font-semibold text-slate-500 tracking-wider text-right w-[20%]"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(file, index) in paginatedFiles"
                  :key="file._id || index"
                  @click="selectedFile = file"
                  class="group border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
                  :class="{ 'bg-indigo-50/30 dark:bg-indigo-500/5': selectedFile?._id === file._id }"
                >
                  <td class="py-3 px-5">
                    <div class="flex items-center gap-3 w-full">
                      <div class="size-[32px] rounded-[8px] flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700/50" :class="getFileColorClass(file.type)">
                        <UIcon :name="getFileIcon(file.type)" class="size-[18px]" />
                      </div>
                      <span class="text-[13px] font-bold text-slate-900 dark:text-white truncate flex-1 min-w-0">
                        {{ file.originalName || file.fileName }}
                      </span>
                    </div>
                  </td>
                  <td class="py-3 px-2 text-[13px] text-slate-500">
                    {{ file.courseId?.title || 'General' }}
                  </td>
                  <td class="py-3 px-2 text-[13px] text-slate-500 font-medium">
                    {{ formatSize(file.size) }}
                  </td>
                  <td class="py-3 px-2 text-[13px] text-slate-500">
                    {{ timeAgo(file.createdAt) }}
                  </td>
                  <td class="py-3 px-2">
                    <div class="flex items-center gap-1.5 whitespace-nowrap">
                      <span
                        v-for="tag in getFileTags(file).slice(0, 1)"
                        :key="tag"
                        class="px-2 py-0.5 rounded-[6px] text-[11px] font-bold whitespace-nowrap"
                        :class="getTagColorClass(tag)"
                      >
                        {{ tag }}
                      </span>
                      <span
                        v-if="getFileTags(file).length > 1"
                        class="px-1.5 py-0.5 rounded-[6px] text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 whitespace-nowrap border border-slate-200 dark:border-slate-700"
                      >
                        +{{ getFileTags(file).length - 1 }}
                      </span>
                    </div>
                  </td>
                  <td class="py-3 px-2 text-right">
                    <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button class="p-1.5 text-slate-400 hover:text-indigo-500 transition" @click.prevent.stop="openDetailsModal(file)" title="View Details">
                        <UIcon name="i-lucide-eye" class="size-4" />
                      </button>
                      <button class="p-1.5 text-slate-400 hover:text-amber-400 transition" @click.stop>
                        <UIcon name="i-lucide-star" class="size-4" />
                      </button>
                      <button class="p-1.5 text-slate-400 hover:text-slate-600 transition" @click.stop>
                        <UIcon name="i-lucide-more-horizontal" class="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredFiles.length === 0">
                  <td colspan="6" class="py-10 text-center text-slate-500 text-[13px]">
                    No files found matching your criteria.
                  </td>
                </tr>
                <!-- Filler rows to maintain table height on last page -->
                <tr 
                  v-for="i in (filteredFiles.length > 0 ? Math.max(0, ITEMS_PER_PAGE - paginatedFiles.length) : 0)" 
                  :key="'empty-' + i" 
                  class="border-b border-transparent"
                >
                  <td colspan="6" class="py-3 px-5 h-[57px]"></td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div v-if="filteredFiles.length > ITEMS_PER_PAGE" class="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800/50">
            <span class="text-[12px] text-slate-500 font-medium">
              Showing {{ (currentPage - 1) * ITEMS_PER_PAGE + 1 }} to {{ Math.min(currentPage * ITEMS_PER_PAGE, filteredFiles.length) }} of {{ filteredFiles.length }} files
            </span>
            <div class="flex items-center gap-1.5">
              <button 
                @click="currentPage > 1 && currentPage--" 
                :disabled="currentPage === 1"
                class="size-7 flex items-center justify-center rounded-[6px] border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
              >
                <UIcon name="i-lucide-chevron-left" class="size-4" />
              </button>
              
              <template v-for="p in totalPages" :key="p">
                <button 
                  v-if="p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1"
                  @click="currentPage = p"
                  class="size-7 flex items-center justify-center rounded-[6px] text-[12px] transition"
                  :class="currentPage === p ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 border border-indigo-100 dark:border-indigo-500/20 font-bold' : 'text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800'"
                >
                  {{ p }}
                </button>
                <span v-else-if="p === 2 && currentPage > 3" class="text-slate-400 text-[12px] px-1">...</span>
                <span v-else-if="p === totalPages - 1 && currentPage < totalPages - 2" class="text-slate-400 text-[12px] px-1">...</span>
              </template>

              <button 
                @click="currentPage < totalPages && currentPage++"
                :disabled="currentPage === totalPages"
                class="size-7 flex items-center justify-center rounded-[6px] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
              >
                <UIcon name="i-lucide-chevron-right" class="size-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Bottom Cards Row -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Storage Usage -->
          <div class="bg-white dark:bg-slate-900 rounded-[16px] border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between">
            <h4 class="text-[14px] font-bold text-slate-900 dark:text-white mb-4">Storage Usage</h4>
            <div class="flex gap-5 items-center mb-5">
               <!-- Circular progress -->
               <div class="relative size-[72px] flex items-center justify-center shrink-0">
                  <svg class="size-full rotate-[-90deg]" viewBox="0 0 36 36">
                    <path class="text-slate-100 dark:text-slate-800" stroke-width="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path class="text-indigo-600" stroke-width="3" :stroke-dasharray="`${storagePct}, 100`" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span class="text-[16px] font-bold text-slate-900 dark:text-white leading-none mb-0.5">{{ Math.round(storagePct) }}%</span>
                    <span class="text-[10px] text-slate-500 font-medium leading-none">Used</span>
                  </div>
               </div>
               <div>
                  <div class="text-[15px] font-bold text-slate-900 dark:text-white leading-tight mb-1">
                    {{ (storageUsed / 1024 / 1024 / 1024).toFixed(1) }} GB
                    <span class="text-[12px] font-medium text-slate-400">/ 20 GB</span>
                  </div>
                  <div class="text-[12px] text-slate-500 font-medium">of storage used</div>
               </div>
            </div>
            <button class="w-full py-2 rounded-[10px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 text-[13px] font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition">
              Manage Storage
            </button>
          </div>

          <!-- Recent Uploads -->
          <div class="bg-white dark:bg-slate-900 rounded-[16px] border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-[14px] font-bold text-slate-900 dark:text-white">Recent Uploads</h4>
              <button class="text-[12px] font-bold text-indigo-600 hover:underline">View all</button>
            </div>
            <div class="flex flex-col gap-3.5 flex-1">
               <div v-for="(file, i) in recentUploads" :key="file._id || i" class="flex items-center gap-3">
                 <div class="size-9 rounded-[8px] flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700" :class="getFileColorClass(file.type)">
                    <UIcon :name="getFileIcon(file.type)" class="size-[18px]" />
                 </div>
                 <div class="min-w-0 flex-1">
                    <div class="text-[13px] font-bold text-slate-900 dark:text-white truncate mb-0.5">{{ file.originalName || file.fileName }}</div>
                    <div class="text-[11px] text-slate-500 font-medium uppercase">{{ String(file.type || 'file') }} • {{ formatSize(file.size) }} • {{ timeAgo(file.createdAt) }}</div>
                 </div>
               </div>
               <div v-if="recentUploads.length === 0" class="text-[12px] text-slate-500 text-center py-4">No recent uploads.</div>
            </div>
          </div>

          <!-- AI Actions list -->
          <div class="bg-white dark:bg-slate-900 rounded-[16px] border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col">
            <h4 class="text-[14px] font-bold text-slate-900 dark:text-white mb-3">AI Actions</h4>
            <div class="flex flex-col gap-1.5 flex-1 justify-center">
              <div class="flex items-center justify-between p-2 rounded-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer group transition">
                <div class="flex items-center gap-3">
                  <div class="size-8 rounded-[8px] bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <UIcon name="i-lucide-file-text" class="size-[18px] text-indigo-600" />
                  </div>
                  <div>
                    <div class="text-[13px] font-bold text-slate-900 dark:text-white mb-0.5">Summarize file</div>
                    <div class="text-[11px] text-slate-500 font-medium">Get concise overview</div>
                  </div>
                </div>
                <UIcon name="i-lucide-chevron-right" class="size-4 text-slate-300 group-hover:text-slate-500 transition" />
              </div>
              <div class="flex items-center justify-between p-2 rounded-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer group transition">
                <div class="flex items-center gap-3">
                  <div class="size-8 rounded-[8px] bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <UIcon name="i-lucide-crosshair" class="size-[18px] text-emerald-600" />
                  </div>
                  <div>
                    <div class="text-[13px] font-bold text-slate-900 dark:text-white mb-0.5">Extract key points</div>
                    <div class="text-[11px] text-slate-500 font-medium">Find important information</div>
                  </div>
                </div>
                <UIcon name="i-lucide-chevron-right" class="size-4 text-slate-300 group-hover:text-slate-500 transition" />
              </div>
              <div class="flex items-center justify-between p-2 rounded-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer group transition">
                <div class="flex items-center gap-3">
                  <div class="size-8 rounded-[8px] bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                    <UIcon name="i-lucide-layers" class="size-[18px] text-amber-600" />
                  </div>
                  <div>
                    <div class="text-[13px] font-bold text-slate-900 dark:text-white mb-0.5">Generate flashcards</div>
                    <div class="text-[11px] text-slate-500 font-medium">Create study flashcards</div>
                  </div>
                </div>
                <UIcon name="i-lucide-chevron-right" class="size-4 text-slate-300 group-hover:text-slate-500 transition" />
              </div>
              <div class="flex items-center justify-between p-2 rounded-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer group transition">
                <div class="flex items-center gap-3">
                  <div class="size-8 rounded-[8px] bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                    <UIcon name="i-lucide-file-question" class="size-[18px] text-blue-600" />
                  </div>
                  <div>
                    <div class="text-[13px] font-bold text-slate-900 dark:text-white mb-0.5">Create exercises</div>
                    <div class="text-[11px] text-slate-500 font-medium">Generate practice questions</div>
                  </div>
                </div>
                <UIcon name="i-lucide-chevron-right" class="size-4 text-slate-300 group-hover:text-slate-500 transition" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN (Sidebar Cards) -->
      <div class="flex flex-col gap-6 w-full">
        <template v-if="selectedFile">
          <!-- Selected File Card -->
          <div class="bg-white dark:bg-slate-900 rounded-[16px] border border-slate-200 dark:border-slate-800 p-5 shadow-sm relative">
            <button @click="selectedFile = null" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition">
              <UIcon name="i-lucide-x" class="size-4" />
            </button>
            <h3 class="text-[15px] font-bold text-slate-900 dark:text-white mb-5">Selected File</h3>
            
            <div class="flex items-start gap-4 mb-6">
              <div class="size-[48px] rounded-[12px] shrink-0 flex items-center justify-center border border-slate-100 dark:border-slate-700/50" :class="getFileColorClass(selectedFile.type)">
                <UIcon :name="getFileIcon(selectedFile.type)" class="size-[24px]" />
              </div>
              <div class="min-w-0 pr-4">
                <h4 class="text-[14px] font-bold text-slate-900 dark:text-white leading-snug mb-1 truncate">
                  {{ selectedFile.originalName || selectedFile.fileName }}
                </h4>
                <p class="text-[12px] text-slate-500 font-medium uppercase tracking-wide">
                  {{ String(selectedFile.type || 'file') }} • {{ formatSize(selectedFile.size) }}
                </p>
              </div>
            </div>

            <div class="space-y-4 mb-6">
              <div class="flex justify-between items-start text-[13px]">
                <span class="text-slate-500 font-medium w-20">Course</span>
                <span class="font-bold text-emerald-600 text-right">{{ selectedFile.courseId?.title || 'Mathematics' }}</span>
              </div>
              <div class="flex justify-between items-start text-[13px]">
                <span class="text-slate-500 font-medium w-20">Uploaded</span>
                <span class="font-medium text-slate-700 dark:text-slate-300 text-right">{{ formatDate(selectedFile.createdAt) }}</span>
              </div>
              <div class="flex justify-between items-start text-[13px]">
                <span class="text-slate-500 font-medium w-20">Tags</span>
                <div class="flex flex-wrap gap-1.5 justify-end flex-1">
                  <span v-for="tag in getFileTags(selectedFile)" :key="tag" class="px-2 py-0.5 rounded-[6px] border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-indigo-600 font-bold text-[11px] transition-colors hover:bg-slate-100">{{ tag }}</span>
                </div>
              </div>
              <div class="pt-2">
                <span class="text-[13px] text-slate-500 font-medium block mb-2">Description</span>
                <p class="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  {{ selectedFile.description || 'Comprehensive guide to integration techniques with solved examples and practice problems.' }}
                </p>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <button class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[10px] text-[13px] font-bold transition shadow-sm flex justify-center items-center gap-2">
                Open File <UIcon name="i-lucide-external-link" class="size-4" />
              </button>
              <div class="flex gap-2">
                <button class="flex-1 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-[10px] text-[13px] font-bold transition flex justify-center items-center gap-2 shadow-sm">
                  <UIcon name="i-lucide-download" class="size-4 text-slate-500" /> Download
                </button>
                <button class="px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-[10px] transition shadow-sm flex items-center justify-center">
                  <UIcon name="i-lucide-more-horizontal" class="size-4 text-slate-500" />
                </button>
              </div>
            </div>
          </div>

          <!-- AI Summary Card -->
          <div class="bg-indigo-50/50 dark:bg-indigo-500/5 rounded-[16px] border border-indigo-100 dark:border-indigo-500/20 p-5 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2 text-indigo-600 font-bold text-[14px]">
                <UIcon name="i-lucide-sparkles" class="size-4" />
                AI Summary
              </div>
              <button class="text-slate-400 hover:text-indigo-600 transition">
                <UIcon name="i-lucide-copy" class="size-4" />
              </button>
            </div>
            
            <div class="mb-4">
              <h5 class="text-[13px] font-bold text-slate-900 dark:text-white mb-1">Summary</h5>
              <p class="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                This document covers essential integration techniques including substitution, integration by parts, and partial fractions.
              </p>
            </div>
            
            <div class="mb-6">
              <h5 class="text-[13px] font-bold text-slate-900 dark:text-white mb-2">Key Points</h5>
              <ul class="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed space-y-1.5 pl-4 list-disc marker:text-indigo-400 font-medium">
                <li>Substitution simplifies complex integrals</li>
                <li>Integration by parts for product functions</li>
                <li>Partial fractions for rational expressions</li>
                <li>Multiple solved examples with steps</li>
              </ul>
            </div>

            <button class="w-full py-2.5 bg-white dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 rounded-[10px] text-[13px] font-bold hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition shadow-sm">
              View Full Summary
            </button>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white dark:bg-slate-900 rounded-[16px] border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h4 class="text-[14px] font-bold text-slate-900 dark:text-white mb-3">Quick Actions</h4>
            <div class="space-y-1">
              <button class="w-full flex items-center justify-between p-2.5 rounded-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left group">
                <div class="flex items-center gap-3">
                  <UIcon name="i-lucide-layers" class="size-4 text-indigo-500" />
                  <span class="text-[13px] font-bold text-slate-700 dark:text-slate-200">Generate flashcards</span>
                </div>
                <UIcon name="i-lucide-chevron-right" class="size-4 text-slate-300 group-hover:text-slate-500 transition" />
              </button>
              <button class="w-full flex items-center justify-between p-2.5 rounded-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left group">
                <div class="flex items-center gap-3">
                  <UIcon name="i-lucide-file-question" class="size-4 text-blue-500" />
                  <span class="text-[13px] font-bold text-slate-700 dark:text-slate-200">Create exercises</span>
                </div>
                <UIcon name="i-lucide-chevron-right" class="size-4 text-slate-300 group-hover:text-slate-500 transition" />
              </button>
              <button class="w-full flex items-center justify-between p-2.5 rounded-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left group">
                <div class="flex items-center gap-3">
                  <UIcon name="i-lucide-crosshair" class="size-4 text-emerald-500" />
                  <span class="text-[13px] font-bold text-slate-700 dark:text-slate-200">Extract key points</span>
                </div>
                <UIcon name="i-lucide-chevron-right" class="size-4 text-slate-300 group-hover:text-slate-500 transition" />
              </button>
              <button class="w-full flex items-center justify-between p-2.5 rounded-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left group">
                <div class="flex items-center gap-3">
                  <UIcon name="i-lucide-search" class="size-4 text-slate-400" />
                  <span class="text-[13px] font-bold text-slate-700 dark:text-slate-200">Find similar files</span>
                </div>
                <UIcon name="i-lucide-chevron-right" class="size-4 text-slate-300 group-hover:text-slate-500 transition" />
              </button>
            </div>
          </div>
        </template>
        
        <template v-else>
           <div class="h-[500px] flex items-center justify-center flex-col text-slate-400 p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[16px] bg-slate-50/50 dark:bg-slate-900/50">
             <UIcon name="i-lucide-mouse-pointer-click" class="size-10 mb-4 opacity-40 text-slate-400" />
             <p class="text-[14px] text-center font-medium">Select a file from the list<br>to view details and AI actions</p>
           </div>
        </template>
      </div>

    </div>

    <!-- File Details Modal -->
    <UModal v-model:open="isDetailsModalOpen" :ui="{ wrapper: 'z-[100]', width: 'sm:max-w-md', rounded: 'rounded-[20px]', shadow: 'shadow-2xl', background: 'bg-white dark:bg-slate-900', ring: 'ring-1 ring-slate-200 dark:ring-slate-800', overlay: { background: 'bg-slate-900/40 backdrop-blur-[2px]' } }">
      <template #content>
      <div class="p-6 flex flex-col gap-6" v-if="modalFile">
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div class="flex gap-4 items-center">
            <div class="size-[48px] rounded-[12px] flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800" :class="getFileColorClass(modalFile.type)">
              <UIcon :name="getFileIcon(modalFile.type)" class="size-[24px]" />
            </div>
            <div class="flex flex-col min-w-0 pr-4">
              <h3 class="text-[16px] font-bold text-slate-900 dark:text-white truncate max-w-[250px]">{{ modalFile.originalName || modalFile.fileName }}</h3>
              <p class="text-[13px] font-medium text-slate-500">{{ modalFile.courseId?.title || 'General' }}</p>
            </div>
          </div>
          <button @click="isDetailsModalOpen = false" class="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition">
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[12px] border border-slate-100 dark:border-slate-800">
          <div class="flex flex-col gap-1">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type</span>
            <span class="text-[13px] font-medium text-slate-900 dark:text-slate-200">{{ modalFile.type?.toUpperCase() || 'UNKNOWN' }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Size</span>
            <span class="text-[13px] font-medium text-slate-900 dark:text-slate-200">{{ formatSize(modalFile.size) }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Uploaded</span>
            <span class="text-[13px] font-medium text-slate-900 dark:text-slate-200">{{ new Date(modalFile.createdAt || Date.now()).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</span>
            <span class="text-[13px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><UIcon name="i-lucide-check-circle-2" class="size-3.5" /> {{ modalFile.status || 'Processed' }}</span>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="getFileTags(modalFile).length > 0" class="flex flex-col gap-2">
          <span class="text-[12px] font-bold text-slate-900 dark:text-white">Tags</span>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="tag in getFileTags(modalFile)"
              :key="tag"
              class="px-2.5 py-1 rounded-[6px] text-[12px] font-bold"
              :class="getTagColorClass(tag)"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- Summary / Description -->
        <div v-if="modalFile.description || modalFile.aiSummary" class="flex flex-col gap-2">
          <span class="text-[12px] font-bold text-slate-900 dark:text-white">Summary</span>
          <p class="text-[13px] leading-relaxed text-slate-600 dark:text-slate-400 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-[10px] border border-slate-100 dark:border-slate-800">
            {{ modalFile.aiSummary || modalFile.description }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3 pt-2">
          <button class="flex-1 py-2.5 rounded-[10px] bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold transition flex justify-center items-center gap-2 shadow-sm">
            Open File <UIcon name="i-lucide-external-link" class="size-4" />
          </button>
          <button class="flex-1 py-2.5 rounded-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[13px] font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex justify-center items-center gap-2 shadow-sm">
            Download <UIcon name="i-lucide-download" class="size-4" />
          </button>
        </div>
      </div>
      </template>
    </UModal>
  </div>
</template>
