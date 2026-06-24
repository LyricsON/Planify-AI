<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  active?: boolean
  fileName?: string
  accept?: string
}>(), {
  active: false,
  fileName: '',
  accept: '.pdf,.docx,.pptx,.xlsx,.png,.jpg,.jpeg'
})

const emit = defineEmits<{
  (e: 'select', files: FileList | null): void
}>()

const uploadRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

function triggerClick() {
  if (!props.active && uploadRef.value) {
    uploadRef.value.click()
  }
}

defineExpose({
  triggerClick
})

function onClick() {
  triggerClick()
}

function onFileInputChange(e: Event) {
  const target = e.target as HTMLInputElement
  emit('select', target.files)
  if (uploadRef.value) {
    uploadRef.value.value = ''
  }
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (!props.active) {
    isDragging.value = true
  }
}

function onDragLeave() {
  isDragging.value = false
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  if (!props.active) {
    emit('select', e.dataTransfer?.files || null)
  }
}
</script>

<template>
  <div
    class="upload-box w-full"
    :class="{ 'upload-box--dragging': isDragging, 'upload-box--uploading': active }"
    @click="onClick"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <input
      ref="uploadRef"
      type="file"
      class="hidden"
      :accept="accept"
      @change="onFileInputChange"
    />
    <!-- Uploading state -->
    <template v-if="active">
      <div class="mx-auto mb-4 flex size-[58px] items-center justify-center rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-surface)] text-[var(--color-primary)]">
        <UIcon name="i-lucide-loader-2" class="size-5 animate-spin" />
      </div>
      <p class="text-base font-semibold text-[var(--color-text)]">Uploading…</p>
      <p class="mt-2 text-xs text-[var(--color-text-muted)] truncate max-w-xs mx-auto">{{ fileName }}</p>
    </template>
    <!-- Default state -->
    <template v-else>
      <div class="mx-auto mb-4 flex size-[58px] items-center justify-center rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-surface)] text-[var(--color-primary)]">
        <UIcon name="i-lucide-upload" class="size-5" />
      </div>
      <p class="text-base font-semibold text-[var(--color-text)]">Upload files <span class="font-normal text-[var(--color-text-muted)]">or drag &amp; drop</span></p>
      <p class="mt-2 text-xs text-[var(--color-text-muted)]">PDF, DOCX, PPTX, XLSX, Images up to 50MB</p>
      <span class="mt-5 inline-flex rounded-[10px] border border-[var(--color-primary)]/40 px-5 py-2 text-sm font-medium text-[var(--color-primary)]">Choose Files</span>
    </template>
  </div>
</template>

<style scoped>
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

.upload-box--uploading {
  cursor: not-allowed;
}
</style>
