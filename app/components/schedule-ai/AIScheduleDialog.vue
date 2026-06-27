<script setup lang="ts">
import EmptyConversation from './EmptyConversation.vue'
import ChatInput from './ChatInput.vue'
import ChatMessage from './ChatMessage.vue'
import TypingIndicator from './TypingIndicator.vue'

interface Props {
  open: boolean
  weekStart?: string
  weekEnd?: string
}

interface ConversationMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'generated'): void
}>()

const { post } = useApi()

const messages = ref<ConversationMessage[]>([])
const draft = ref('')
const isThinking = ref(false)
const isGenerating = ref(false)
const conversationId = ref('')
const feedRef = ref<HTMLElement | null>(null)
const dialogRef = ref<HTMLElement | null>(null)
const canGenerate = computed(() => Boolean(draft.value.trim() || messages.value.length))

let previousBodyOverflow = ''
function buildRecentMessages() {
  return messages.value.slice(-20).map((message) => ({
    role: message.sender,
    content: message.text,
    type: 'schedule_builder',
  }))
}

function scrollToBottom() {
  nextTick(() => {
    if (feedRef.value) {
      feedRef.value.scrollTop = feedRef.value.scrollHeight
    }
  })
}

function closeDialog() {
  emit('update:open', false)
}

function appendAssistantMessage(text: string) {
  if (!text.trim()) return

  messages.value.push({
    id: `msg_ai_${Date.now()}`,
    sender: 'assistant',
    text,
  })
}

async function sendMessage() {
  const text = draft.value.trim()
  if (!text || isThinking.value || isGenerating.value) return

  const recentMessages = buildRecentMessages()

  messages.value.push({
    id: `msg_user_${Date.now()}`,
    sender: 'user',
    text,
  })

  draft.value = ''
  isThinking.value = true
  scrollToBottom()

  try {
    const payload: Record<string, any> = {
      message: text,
      conversationId: conversationId.value || undefined,
      weekStart: props.weekStart,
      weekEnd: props.weekEnd,
    }

    if (recentMessages.length > 0) {
      payload.recentMessages = recentMessages
    }

    const res = await post<any>('/ai/schedule-builder/chat', payload)
    const data = res.data || {}

    if (res.success && data) {
      conversationId.value = data.conversationId || conversationId.value

      appendAssistantMessage(data.reply || data.followUpQuestion || ' ')
    } else {
      appendAssistantMessage(res.message || 'I could not process that right now.')
    }
  } catch (error) {
    appendAssistantMessage('I could not process that right now.')
  } finally {
    isThinking.value = false
    scrollToBottom()
  }
}

async function generateSchedule() {
  if (!canGenerate.value || isThinking.value || isGenerating.value) return

  const draftText = draft.value.trim()
  const recentMessages = buildRecentMessages()
  isGenerating.value = true

  if (draftText) {
    messages.value.push({
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: draftText,
    })
    draft.value = ''
  }

  try {
    const payload: Record<string, any> = {
      conversationId: conversationId.value || undefined,
      weekStart: props.weekStart,
      weekEnd: props.weekEnd,
      message: draftText || undefined,
    }

    if (recentMessages.length > 0) {
      payload.recentMessages = recentMessages
    }

    const res = await post<any>('/ai/schedule-builder/generate', payload)
    const data = res.data || {}

    if (res.success && data) {
      conversationId.value = data.conversationId || conversationId.value
      appendAssistantMessage(data.reply || 'Your weekly schedule is ready.')
      emit('generated')
    } else {
      appendAssistantMessage(res.message || 'I could not generate the schedule right now.')
    }
  } catch (error) {
    appendAssistantMessage('I could not generate the schedule right now.')
  } finally {
    isGenerating.value = false
    scrollToBottom()
  }
}

function onEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) {
    closeDialog()
  }
}

watch(
  () => props.open,
  (open) => {
    if (!import.meta.client) return

    if (open) {
      previousBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      scrollToBottom()
      nextTick(() => dialogRef.value?.focus())
    } else {
      document.body.style.overflow = previousBodyOverflow
      isThinking.value = false
      isGenerating.value = false
    }
  },
  { immediate: true }
)

watch(
  () => [messages.value.length, isThinking.value, props.open],
  () => {
    if (props.open) {
      scrollToBottom()
    }
  }
)

onMounted(() => {
  window.addEventListener('keydown', onEscape)
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    document.body.style.overflow = previousBodyOverflow
  }
  window.removeEventListener('keydown', onEscape)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="ai-dialog">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-4"
        @click.self="closeDialog"
      >
        <div
          ref="dialogRef"
          class="flex h-[min(94dvh,860px)] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] shadow-[0_30px_90px_rgba(15,23,42,0.18)] outline-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-schedule-dialog-title"
          tabindex="-1"
        >
          <header class="flex items-center justify-between border-b border-slate-200/70 bg-white/70 px-5 py-4 backdrop-blur-xl sm:px-6">
            <h2 id="ai-schedule-dialog-title" class="text-[21px] font-extrabold tracking-tight text-slate-900 sm:text-[25px]">
              AI Schedule Builder
            </h2>

            <button
              type="button"
              class="inline-flex size-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
              @click="closeDialog"
            >
              <UIcon name="i-lucide-x" class="size-5" />
            </button>
          </header>

          <main
            ref="feedRef"
            class="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6"
          >
            <EmptyConversation v-if="messages.length === 0 && !isThinking && !isGenerating" />

            <TransitionGroup v-else name="message" tag="div" class="space-y-4">
              <ChatMessage
                v-for="message in messages"
                :key="message.id"
                :sender="message.sender"
                :text="message.text"
              />

              <TypingIndicator v-if="isThinking || isGenerating" key="typing" />
            </TransitionGroup>
          </main>

          <footer class="border-t border-slate-200/70 bg-white/80 px-3 py-3 backdrop-blur-xl sm:px-4 sm:py-4">
            <div class="mb-3 flex items-center justify-end gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(79,70,229,0.28)] transition hover:shadow-[0_14px_32px_rgba(79,70,229,0.34)] disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="isThinking || isGenerating || !canGenerate"
                @click="generateSchedule"
              >
                <UIcon name="i-lucide-sparkles" class="size-4" />
                Generate schedule
              </button>
            </div>

            <ChatInput
              v-model="draft"
              placeholder="Describe your week..."
              :disabled="isThinking || isGenerating"
              @send="sendMessage"
            />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ai-dialog-enter-active,
.ai-dialog-leave-active {
  transition: opacity 220ms ease;
}

.ai-dialog-enter-from,
.ai-dialog-leave-to {
  opacity: 0;
}

.ai-dialog-enter-active > div,
.ai-dialog-leave-active > div {
  transition: transform 260ms cubic-bezier(0.4, 0, 0.2, 1), opacity 260ms cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-dialog-enter-from > div,
.ai-dialog-leave-to > div {
  opacity: 0;
  transform: translateY(18px) scale(0.98);
}

.message-enter-active,
.message-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.message-enter-from,
.message-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
