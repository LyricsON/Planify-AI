<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
const { get, post } = useApi()
const files = ref<any[]>([])
const folders = ref<any[]>([])
const isLoading = ref(true)
const search = ref('')
const selectedFolder = ref('')
const selectedFile = ref<any>(null)
const uploadRef = ref<HTMLInputElement | null>(null)
const page = ref(1)
const total = ref(0)
const storageUsed = ref(0)

const filtered = computed(() => files.value.filter((f) => {
  const matchSearch = f.originalName?.toLowerCase().includes(search.value.toLowerCase()) || f.fileName?.toLowerCase().includes(search.value.toLowerCase())
  const matchFolder = !selectedFolder.value || f.courseId?._id === selectedFolder.value || f.courseId === selectedFolder.value
  return matchSearch && matchFolder
}))

async function load() {
  isLoading.value = true
  const [fR, cR] = await Promise.all([
    get<any>('/files', { page: page.value, limit: 20, sort: 'newest' }),
    get<any>('/courses')
  ])
  if (fR.success) {
    files.value = Array.isArray(fR.data) ? fR.data : fR.data?.data || []
    total.value = fR.data?.total || files.value.length
    storageUsed.value = files.value.reduce((acc, f) => acc + (f.size || 0), 0)
  }
  if (cR.success) folders.value = Array.isArray(cR.data) ? cR.data : cR.data?.data || []
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

const fileColor = (t: string) => ({ pdf: 'background:#fef2f2;color:#ef4444', xlsx: 'background:#f0fdf4;color:#22c55e', docx: 'background:#eff6ff;color:#3b82f6', png: 'background:#fdf4ff;color:#a855f7', jpg: 'background:#fdf4ff;color:#a855f7' }[t] || 'background:var(--color-border);color:var(--color-text-muted)')
const fileIcon = (t: string) => ({ pdf: 'i-lucide-file-text', xlsx: 'i-lucide-file-spreadsheet', docx: 'i-lucide-file-type', png: 'i-lucide-image', jpg: 'i-lucide-image' }[t] || 'i-lucide-file')
const storagePct = computed(() => Math.min(100, (storageUsed.value / (20 * 1024 * 1024 * 1024)) * 100).toFixed(1))
const ago = (d: string) => { const h = Math.floor((Date.now() - new Date(d || Date.now()).getTime()) / 3600000); return h < 1 ? 'Just now' : h < 24 ? h + 'h ago' : Math.floor(h / 24) + 'd ago' }
</script>

<template>
  <section class="max-w-[1400px] mx-auto pb-10">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1
          class="text-[24px] font-bold"
          style="color:var(--color-text)"
        >
          Files
        </h1>
        <p
          class="text-[13px] mt-0.5"
          style="color:var(--color-text-muted)"
        >
          Manage, organize and access all your study materials in one place.
        </p>
      </div>
      <button
        class="flex items-center gap-2 px-4 py-2 text-[13px] font-bold text-white transition"
        style="background:var(--color-primary);border-radius:10px"
        @click="uploadRef?.click()"
      >
        <UIcon
          name="i-lucide-upload"
          class="size-4"
        /> Upload File
      </button>
      <input
        ref="uploadRef"
        type="file"
        class="hidden"
        accept=".pdf,.docx,.pptx,.xlsx,.png,.jpg"
        @change="upload"
      >
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
      class="grid grid-cols-1 xl:grid-cols-[240px_1fr_260px] gap-6"
    >
      <!-- Sidebar -->
      <div class="flex flex-col gap-4">
        <!-- Upload zone -->
        <div
          class="flex flex-col items-center gap-2 p-5 cursor-pointer transition"
          style="border-radius:14px;border:2px dashed var(--color-border);color:var(--color-text-muted)"
          @click="uploadRef?.click()"
        >
          <UIcon
            name="i-lucide-upload-cloud"
            class="size-7"
          />
          <p class="text-[12px] font-semibold text-center">
            Drag & drop files here, or click to browse<br><span class="font-normal opacity-70 text-[11px]">PDF, DOCX, PPTX, XLSX up to 50MB</span>
          </p>
        </div>

        <!-- Folders -->
        <div
          class="p-4"
          style="background:var(--color-surface);border-radius:14px;border:1px solid var(--color-border)"
        >
          <p
            class="text-[12px] font-bold uppercase tracking-wide mb-3"
            style="color:var(--color-text-soft)"
          >
            Folders
          </p>
          <div class="space-y-1">
            <button
              class="w-full text-left flex items-center justify-between px-3 py-2 text-[13px] font-medium transition"
              :style="!selectedFolder?'border-radius:8px;background:color-mix(in srgb,var(--color-primary) 10%,transparent);color:var(--color-primary)':'border-radius:8px;color:var(--color-text)'"
              @click="selectedFolder=''"
            >
              <span>All Files</span><span
                class="text-[11px]"
                style="color:var(--color-text-muted)"
              >{{ files.length }}</span>
            </button>
            <button
              v-for="folder in folders"
              :key="folder._id"
              class="w-full text-left flex items-center justify-between px-3 py-2 text-[13px] font-medium transition"
              :style="selectedFolder===folder._id?'border-radius:8px;background:color-mix(in srgb,var(--color-primary) 10%,transparent);color:var(--color-primary)':'border-radius:8px;color:var(--color-text)'"
              @click="selectedFolder=folder._id"
            >
              <span class="truncate">{{ folder.title }}</span>
              <span
                class="text-[11px]"
                style="color:var(--color-text-muted)"
              >{{ folder.filesCount||0 }}</span>
            </button>
          </div>
        </div>

        <!-- Storage -->
        <div
          class="p-4"
          style="background:var(--color-surface);border-radius:14px;border:1px solid var(--color-border)"
        >
          <p
            class="text-[12px] font-bold uppercase tracking-wide mb-2"
            style="color:var(--color-text-soft)"
          >
            Storage Usage
          </p>
          <p
            class="text-[22px] font-bold mb-1"
            style="color:var(--color-text)"
          >
            {{ (storageUsed/1024/1024/1024).toFixed(1) }} <span
              class="text-[13px] font-medium"
              style="color:var(--color-text-muted)"
            >/ 20 GB</span>
          </p>
          <div
            class="h-2 w-full overflow-hidden mb-1"
            style="border-radius:99px;background:var(--color-border)"
          >
            <div
              class="h-full"
              :style="`width:${storagePct}%;border-radius:99px;background:var(--color-primary)`"
            />
          </div>
          <p
            class="text-[11px]"
            style="color:var(--color-text-muted)"
          >
            {{ storagePct }}% of storage used
          </p>
        </div>
      </div>

      <!-- File list -->
      <div>
        <div class="flex items-center gap-3 mb-4">
          <div class="relative flex-1">
            <UIcon
              name="i-lucide-search"
              class="absolute left-3 top-1/2 -translate-y-1/2 size-4"
              style="color:var(--color-text-muted)"
            />
            <input
              v-model="search"
              placeholder="Search files..."
              class="w-full h-[38px] pl-9 pr-3 text-[13px] focus:outline-none"
              style="border-radius:10px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text)"
            >
          </div>
        </div>

        <p
          class="text-[13px] font-bold mb-3"
          style="color:var(--color-text)"
        >
          All Files <span
            class="font-normal"
            style="color:var(--color-text-muted)"
          >({{ filtered.length }})</span>
        </p>

        <div
          v-if="!filtered.length"
          class="flex flex-col items-center justify-center py-16"
          style="color:var(--color-text-muted)"
        >
          <UIcon
            name="i-lucide-folder-open"
            class="size-10 mb-3 opacity-40"
          />
          <p class="text-[14px]">
            No files found.
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="f in filtered"
            :key="f._id"
            class="flex flex-col p-4 cursor-pointer transition"
            :style="selectedFile?._id===f._id?'border-radius:12px;border:1.5px solid var(--color-primary);background:color-mix(in srgb,var(--color-primary) 5%,var(--color-surface))':'border-radius:12px;border:1px solid var(--color-border);background:var(--color-surface);box-shadow:var(--shadow-sm)'"
            @click="selectedFile=f"
          >
            <div class="flex items-center gap-3 mb-3">
              <div
                class="flex size-[40px] flex-shrink-0 items-center justify-center"
                :style="`border-radius:10px;${fileColor(f.type)}`"
              >
                <UIcon
                  :name="fileIcon(f.type)"
                  class="size-5"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p
                  class="text-[13px] font-bold truncate"
                  style="color:var(--color-text)"
                >
                  {{ f.originalName||f.fileName }}
                </p>
                <p
                  class="text-[11px]"
                  style="color:var(--color-text-muted)"
                >
                  {{ String(f.type||'file').toUpperCase() }} • {{ (f.size/1024/1024).toFixed(1) }} MB
                </p>
              </div>
            </div>
            <p
              class="text-[11px]"
              style="color:var(--color-text-muted)"
            >
              {{ ago(f.createdAt) }}
            </p>
          </div>
        </div>
      </div>

      <!-- File detail -->
      <div
        v-if="selectedFile"
        class="flex flex-col gap-4"
      >
        <div
          class="p-5"
          style="background:var(--color-surface);border-radius:14px;border:1px solid var(--color-border);box-shadow:var(--shadow-card)"
        >
          <div class="flex items-center gap-3 mb-4">
            <div
              class="flex size-[48px] flex-shrink-0 items-center justify-center"
              :style="`border-radius:12px;${fileColor(selectedFile.type)}`"
            >
              <UIcon
                :name="fileIcon(selectedFile.type)"
                class="size-6"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p
                class="text-[14px] font-bold"
                style="color:var(--color-text)"
              >
                {{ selectedFile.originalName||selectedFile.fileName }}
              </p>
              <p
                class="text-[12px]"
                style="color:var(--color-text-muted)"
              >
                {{ String(selectedFile.type||'file').toUpperCase() }} • {{ (selectedFile.size/1024/1024).toFixed(1) }} MB
              </p>
            </div>
          </div>
          <p
            class="text-[12px] leading-relaxed mb-4"
            style="color:var(--color-text-soft)"
          >
            {{ selectedFile.description || 'Study material uploaded to your Planify AI workspace.' }}
          </p>
          <div class="flex flex-col gap-2">
            <a
              :href="selectedFile.url"
              target="_blank"
              class="flex items-center justify-center gap-2 py-2 text-[13px] font-bold text-white transition"
              style="border-radius:8px;background:var(--color-primary)"
            >
              <UIcon
                name="i-lucide-download"
                class="size-4"
              /> Download
            </a>
            <button
              class="flex items-center justify-center gap-2 py-2 text-[13px] font-bold transition"
              style="border-radius:8px;border:1px solid var(--color-border);color:var(--color-text)"
            >
              <UIcon
                name="i-lucide-trash-2"
                class="size-4"
                style="color:var(--color-danger)"
              /> Delete
            </button>
          </div>
        </div>

        <!-- AI Actions -->
        <div
          class="p-4"
          style="background:color-mix(in srgb,var(--color-primary) 5%,var(--color-surface));border-radius:14px;border:1px solid var(--color-border)"
        >
          <div class="flex items-center gap-2 mb-3">
            <UIcon
              name="i-lucide-sparkles"
              class="size-4"
              style="color:var(--color-primary)"
            />
            <p
              class="text-[13px] font-bold"
              style="color:var(--color-primary)"
            >
              AI Actions
            </p>
          </div>
          <div class="space-y-2">
            <button
              v-for="a in [{ l: 'Summarize file', s: 'Get concise overview', i: 'i-lucide-file-text' }, { l: 'Extract key points', s: 'Find important info', i: 'i-lucide-list' }, { l: 'Generate flashcards', s: 'Create study cards', i: 'i-lucide-layers' }]"
              :key="a.l"
              class="w-full flex items-center gap-3 p-2.5 text-left transition"
              style="border-radius:8px;background:var(--color-surface);border:1px solid var(--color-border)"
            >
              <UIcon
                :name="a.i"
                class="size-4 flex-shrink-0"
                style="color:var(--color-primary)"
              />
              <div>
                <p
                  class="text-[12px] font-bold"
                  style="color:var(--color-text)"
                >
                  {{ a.l }}
                </p>
                <p
                  class="text-[11px]"
                  style="color:var(--color-text-muted)"
                >
                  {{ a.s }}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
      <div
        v-else
        class="hidden xl:flex items-center justify-center"
        style="color:var(--color-text-muted)"
      >
        <div class="text-center">
          <UIcon
            name="i-lucide-mouse-pointer-click"
            class="size-10 mb-3 opacity-30 mx-auto"
          />
          <p class="text-[14px]">
            Click a file to view details
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
