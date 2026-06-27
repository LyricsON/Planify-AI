<script setup lang="ts">
interface Props {
  modelValue: string
  placeholder?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Describe your week...',
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'send'): void
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

const canSend = computed(() => props.modelValue.trim().length > 0 && !props.disabled)

function resizeTextarea() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = '0px'
  const nextHeight = Math.max(56, Math.min(el.scrollHeight, 180))
  el.style.height = `${nextHeight}px`
}

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
  resizeTextarea()
}

function onSubmit() {
  if (!canSend.value) return
  emit('send')
  nextTick(() => resizeTextarea())
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    onSubmit()
  }
}

watch(
  () => props.modelValue,
  () => {
    nextTick(() => resizeTextarea())
  }
)

onMounted(() => {
  resizeTextarea()
})
</script>

<template>
  <form
    class="rounded-[30px] border border-slate-200/80 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl"
    @submit.prevent="onSubmit"
  >
    <div class="flex items-end gap-2 p-3 sm:p-4">
      <button
        type="button"
        class="mb-1.5 inline-flex size-11 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        aria-label="Add attachment"
      >
        <UIcon name="i-lucide-paperclip" class="size-4.5" />
      </button>

      <div class="min-w-0 flex-1">
        <textarea
          ref="textareaRef"
          :value="modelValue"
          rows="1"
          class="chat-composer w-full resize-none border-0 bg-transparent px-0 py-2 text-[14px] leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
          :placeholder="placeholder"
          :disabled="disabled"
          @input="onInput"
          @keydown="onKeydown"
        />
      </div>

      <button
        type="submit"
        class="mb-1.5 inline-flex size-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-[0_10px_24px_rgba(79,70,229,0.28)] transition hover:shadow-[0_12px_28px_rgba(79,70,229,0.34)] disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!canSend"
        aria-label="Send message"
      >
        <UIcon name="i-lucide-arrow-up" class="size-4.5" />
      </button>
    </div>
  </form>
</template>

<style scoped>
.chat-composer {
  scrollbar-width: none;
}

.chat-composer::-webkit-scrollbar {
  display: none;
}
</style>
