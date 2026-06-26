<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'

definePageMeta({
  layout: 'dashboard'
})

// ── Types ─────────────────────────────────────────────────────────────────────
interface Course {
  _id: string
  title: string
  semester?: string
  teacher?: string
  color?: string
  progress?: number
  status?: string
}

interface FileItem {
  _id: string
  originalName: string
  fileName: string
  type: string
  size: number
  courseId?: string
  createdAt: string
}

interface AIMessage {
  id: string
  sender: 'user' | 'assistant'
  timestamp: string
  type: 'chat' | 'summary' | 'exercises' | 'daily_plan'
  text?: string
  summaryData?: {
    summary: string
    keyPoints: string[]
    wordCount?: number
    readingTime?: string
  }
  exercisesData?: {
    topic: string
    difficulty: string
    exercises: Array<{
      id: number
      question: string
      type: 'open' | 'mcq' | 'coding'
      options?: string[]
      answer?: string
      hint?: string
      language?: string
    }>
  }
  planData?: {
    date: string
    totalStudyHours: number
    plan: Array<{
      time: string
      subject: string
      activity: string
      priority: 'high' | 'medium' | 'low'
    }>
    tip?: string
  }
  tokensUsed?: number
  isGenerating?: boolean
}

// ── Composables ───────────────────────────────────────────────────────────────
const { get, post } = useApi()
const router = useRouter()

// ── State ─────────────────────────────────────────────────────────────────────
const currentUser = ref<any>(null)
const courses = ref<Course[]>([])
const files = ref<FileItem[]>([])
const tokenBalance = ref<number>(10000)
const aiHistory = ref<any[]>([])

const isLoadingPage = ref(true)
const loadError = ref('')

// Selected contexts
const selectedCourseId = ref<string>('')
const selectedFileId = ref<string>('')

// Form state
const chatMessage = ref('')
const isSending = ref(false)
const aiMessages = ref<AIMessage[]>([])

// Modal States
const showExerciseModal = ref(false)
const exerciseForm = ref({
  topic: '',
  difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  count: 3
})

const showSummaryModal = ref(false)
const summaryForm = ref({
  fileId: '',
  text: ''
})

const showPlanModal = ref(false)
const planForm = ref({
  focusHours: 6,
  date: new Date().toISOString().split('T')[0]
})

// UI Toggles
const revealedAnswers = ref<Record<string, boolean>>({})
const revealedHints = ref<Record<string, boolean>>({})
const thumbsFeedback = ref<Record<string, 'up' | 'down'>>({})

// ── Computed Properties ───────────────────────────────────────────────────────
const activeCourse = computed<Course | null>(() => {
  if (selectedCourseId.value) {
    return courses.value.find(c => c._id === selectedCourseId.value) || null
  }
  return courses.value[0] || null
})

const recentFiles = computed<FileItem[]>(() => {
  return files.value.slice(0, 3)
})

const tokenUsagePct = computed(() => {
  const limit = 10000
  const used = Math.max(0, limit - tokenBalance.value)
  return Math.min(100, Math.round((used / limit) * 100))
})

const currentCostLabel = computed(() => {
  // Chat is default
  return '300 tokens per prompt'
})

// ── Ref helper for scrolling ──────────────────────────────────────────────────
const chatFeedRef = ref<HTMLDivElement | null>(null)

function scrollToBottom() {
  nextTick(() => {
    if (chatFeedRef.value) {
      chatFeedRef.value.scrollTop = chatFeedRef.value.scrollHeight
    }
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatFileSize(bytes?: number): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
    // Could display a brief toast or notification if desired
  }
}

function safeParseJson(value: unknown) {
  if (typeof value !== 'string') return null

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function extractPlainText(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const record = value as Record<string, any>
    return record.reply || record.text || record.message || record.summary || ''
  }
  return ''
}

function normalizeChatReply(value: unknown): string {
  const parsed = safeParseJson(value)
  if (parsed && typeof parsed === 'object') {
    return extractPlainText(parsed)
  }
  return extractPlainText(value)
}

function normalizePromptText(item: any): string {
  const fallback = item?.metadata?.historyPrompt || item?.prompt || ''
  if (item?.metadata?.historyPrompt) return item.metadata.historyPrompt

  const parsedPrompt = safeParseJson(item?.prompt)
  if (!parsedPrompt) return fallback

  if (item.type === 'daily_plan') {
    return `Create a study plan for ${parsedPrompt.date || 'today'} with ${parsedPrompt.focusHours || 6} focus hours.`
  }

  if (item.type === 'exercises') {
    return `Generate ${parsedPrompt.count || 3} practice exercises on topic "${parsedPrompt.topic || 'General'}".`
  }

  if (item.type === 'summary' || item.type === 'summarize_file') {
    return 'Summarize the selected study material.'
  }

  if (item.type === 'prioritize_tasks') {
    return 'Prioritize my current tasks.'
  }

  if (item.type === 'revision_plan') {
    return 'Create a revision plan for my course or exam.'
  }

  return fallback
}

function normalizeSummaryResponse(value: unknown) {
  const parsed = safeParseJson(value)
  if (parsed && typeof parsed === 'object') {
    return {
      title: parsed.title || 'Summary',
      summary: parsed.summary || extractPlainText(parsed) || '',
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      wordCount: typeof parsed.wordCount === 'number' ? parsed.wordCount : undefined,
      readingTime: parsed.readingTime || undefined
    }
  }

  return {
    title: 'Summary',
    summary: extractPlainText(value),
    keyPoints: [],
  }
}

function normalizeExercisesResponse(value: unknown) {
  const parsed = safeParseJson(value)
  if (parsed && typeof parsed === 'object') {
    return {
      courseTitle: parsed.courseTitle || 'Course',
      topic: parsed.topic || 'General',
      difficulty: parsed.difficulty || 'medium',
      exercises: Array.isArray(parsed.exercises) ? parsed.exercises : []
    }
  }

  return {
    courseTitle: 'Course',
    topic: 'General',
    difficulty: 'medium',
    exercises: []
  }
}

function normalizePlanResponse(value: unknown) {
  const parsed = safeParseJson(value)
  if (parsed && typeof parsed === 'object') {
    return {
      date: parsed.date || '',
      focusHours: parsed.focusHours || parsed.totalStudyHours || 0,
      totalStudyHours: parsed.totalStudyHours || parsed.focusHours || 0,
      plan: Array.isArray(parsed.plan) ? parsed.plan : [],
      tip: parsed.tip || (Array.isArray(parsed.tips) ? parsed.tips[0] : ''),
      overview: parsed.overview || ''
    }
  }

  return {
    date: '',
    focusHours: 0,
    totalStudyHours: 0,
    plan: [],
    tip: extractPlainText(value),
    overview: ''
  }
}

function extractAssistantText(msg: AIMessage): string {
  if (msg.sender === 'user') {
    return msg.text || ''
  }

  if (msg.type === 'summary' && msg.summaryData) {
    return msg.summaryData.summary || ''
  }

  if (msg.type === 'exercises' && msg.exercisesData) {
    const firstQuestion = msg.exercisesData.exercises?.[0]?.question
    return firstQuestion ? `Practice exercises on ${msg.exercisesData.topic}. ${firstQuestion}` : `Practice exercises on ${msg.exercisesData.topic}.`
  }

  if (msg.type === 'daily_plan' && msg.planData) {
    return msg.planData.overview || msg.planData.tip || 'Daily study plan generated.'
  }

  return msg.text || ''
}

function buildRecentConversation(maxItems = 8) {
  return aiMessages.value
    .filter((msg) => !msg.isGenerating)
    .slice(-maxItems)
    .map((msg) => ({
      role: msg.sender,
      content: extractAssistantText(msg).trim(),
      type: msg.type,
    }))
    .filter((msg) => msg.content.length > 0)
}

// ── Backend AI History Parser ─────────────────────────────────────────────────
function parseAIHistory(historyData: any[]): AIMessage[] {
  const msgs: AIMessage[] = []
  // Sort chronologically (oldest first)
  const sorted = [...historyData].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  for (const item of sorted) {
    // 1. User Message
    const promptText = normalizePromptText(item)

    msgs.push({
      id: `${item._id}_user`,
      sender: 'user',
      timestamp: formatTime(item.createdAt),
      type: 'chat',
      text: promptText
    })

    // 2. Assistant Message
    const assistantMsg: AIMessage = {
      id: `${item._id}_assistant`,
      sender: 'assistant',
      timestamp: formatTime(item.createdAt),
      type: item.type,
      tokensUsed: item.tokensUsed
    }

    try {
      if (item.type === 'summary') {
        assistantMsg.summaryData = normalizeSummaryResponse(item.response)
      } else if (item.type === 'exercises') {
        assistantMsg.exercisesData = normalizeExercisesResponse(item.response)
      } else if (item.type === 'daily_plan') {
        assistantMsg.planData = normalizePlanResponse(item.response)
      } else if (item.type === 'chat') {
        assistantMsg.text = normalizeChatReply(item.response)
      } else if (item.type === 'prioritize_tasks' || item.type === 'revision_plan' || item.type === 'dashboard_recommendations') {
        const parsed = safeParseJson(item.response)
        assistantMsg.text = extractPlainText(parsed) || extractPlainText(item.response)
      } else {
        assistantMsg.text = extractPlainText(item.response)
      }
    } catch {
      assistantMsg.text = extractPlainText(item.response)
      assistantMsg.type = 'chat'
    }

    msgs.push(assistantMsg)
  }
  return msgs
}

// ── Load Page Data ────────────────────────────────────────────────────────────
async function loadData() {
  isLoadingPage.value = true
  loadError.value = ''

  if (import.meta.client) {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('planify_token')
    if (!token) {
      router.push('/auth/signin')
      return
    }
  }

  try {
    const [meRes, coursesRes, filesRes, tokenRes, historyRes] = await Promise.all([
      get<any>('/auth/me'),
      get<any>('/courses'),
      get<any>('/files?limit=10'),
      get<any>('/tokens/balance'),
      get<any>('/ai/history?limit=10')
    ])

    if (meRes.success) currentUser.value = meRes.data
    if (coursesRes.success) {
      courses.value = Array.isArray(coursesRes.data) ? coursesRes.data : (coursesRes.data?.data || [])
    }
    if (filesRes.success) {
      files.value = Array.isArray(filesRes.data) ? filesRes.data : (filesRes.data?.data || [])
    }
    if (tokenRes.success && tokenRes.data) {
      tokenBalance.value = tokenRes.data.tokenBalance
    }
    if (historyRes.success && historyRes.data) {
      aiHistory.value = historyRes.data
      aiMessages.value = parseAIHistory(historyRes.data)
    }

    // Set initial course context
    if (courses.value.length > 0 && !selectedCourseId.value && courses.value[0]) {
      selectedCourseId.value = courses.value[0]._id
    }
    
    scrollToBottom()
  } catch (err: any) {
    loadError.value = err?.message || 'Error connecting to the server.'
  } finally {
    isLoadingPage.value = false
  }
}

// Refresh only token balance and history (called after AI transactions)
async function refreshBalanceAndHistory() {
  try {
    const [tokenRes, historyRes] = await Promise.all([
      get<any>('/tokens/balance'),
      get<any>('/ai/history?limit=10')
    ])
    if (tokenRes.success && tokenRes.data) {
      tokenBalance.value = tokenRes.data.tokenBalance
    }
    if (historyRes.success && historyRes.data) {
      aiHistory.value = historyRes.data
      aiMessages.value = parseAIHistory(historyRes.data)
    }
    scrollToBottom()
  } catch (e) {
    console.error('Error refreshing balance/history', e)
  }
}

// ── API Handlers ──────────────────────────────────────────────────────────────
async function sendChatMessage() {
  if (!chatMessage.value.trim() || isSending.value) return

  const userMsgText = chatMessage.value.trim()
  chatMessage.value = ''
  isSending.value = true
  const recentMessages = buildRecentConversation()

  // Insert user message locally
  const tempUserMsgId = 'temp_user_' + Date.now()
  aiMessages.value.push({
    id: tempUserMsgId,
    sender: 'user',
    timestamp: formatTime(new Date().toISOString()),
    type: 'chat',
    text: userMsgText
  })
  scrollToBottom()

  // Insert loading state for assistant
  const tempAssistantMsgId = 'temp_ai_' + Date.now()
  aiMessages.value.push({
    id: tempAssistantMsgId,
    sender: 'assistant',
    timestamp: formatTime(new Date().toISOString()),
    type: 'chat',
    text: '',
    isGenerating: true
  })
  scrollToBottom()

  try {
    const payload: Record<string, any> = { message: userMsgText }
    if (selectedCourseId.value) {
      payload.courseId = selectedCourseId.value
    }
    if (selectedFileId.value) {
      payload.fileId = selectedFileId.value
    }
    if (recentMessages.length > 0) {
      payload.recentMessages = recentMessages
    }

    const res = await post<any>('/ai/chat', payload)
    
    // Remove loading message
    aiMessages.value = aiMessages.value.filter(m => m.id !== tempAssistantMsgId)

    if (res.success && res.data) {
      const replyText = normalizeChatReply(res.data.reply || res.data.message || res.data.chat)
      aiMessages.value.push({
        id: 'msg_ai_' + Date.now(),
        sender: 'assistant',
        timestamp: formatTime(new Date().toISOString()),
        type: 'chat',
        text: replyText,
        tokensUsed: res.data.tokensUsed
      })
      await refreshBalanceAndHistory()
    } else {
      aiMessages.value.push({
        id: 'msg_err_' + Date.now(),
        sender: 'assistant',
        timestamp: formatTime(new Date().toISOString()),
        type: 'chat',
        text: res.message || 'The request could not be processed. Please check your token balance.'
      })
    }
  } catch (e: any) {
    aiMessages.value = aiMessages.value.filter(m => m.id !== tempAssistantMsgId)
    aiMessages.value.push({
      id: 'msg_err_' + Date.now(),
      sender: 'assistant',
      timestamp: formatTime(new Date().toISOString()),
      type: 'chat',
      text: e?.message || 'Server connection failed.'
    })
  } finally {
    isSending.value = false
    scrollToBottom()
  }
}

// ── Quick Actions Trigger Functions ───────────────────────────────────────────

// Action: Generate Exercises
async function handleGenerateExercisesAction() {
  showExerciseModal.value = false
  isSending.value = true

  const topicText = exerciseForm.value.topic || 'General Studies'
  const countVal = exerciseForm.value.count
  const difficultyVal = exerciseForm.value.difficulty

  // Insert prompt locally
  aiMessages.value.push({
    id: 'ex_prompt_' + Date.now(),
    sender: 'user',
    timestamp: formatTime(new Date().toISOString()),
    type: 'chat',
    text: `Generate ${countVal} practice exercises on topic "${topicText}" at ${difficultyVal} difficulty.`
  })
  
  const tempAssistantMsgId = 'temp_ai_' + Date.now()
  aiMessages.value.push({
    id: tempAssistantMsgId,
    sender: 'assistant',
    timestamp: formatTime(new Date().toISOString()),
    type: 'chat',
    text: '',
    isGenerating: true
  })
  scrollToBottom()

  try {
    const res = await post<any>('/ai/generate-exercises', {
      courseId: selectedCourseId.value || undefined,
      topic: topicText,
      difficulty: difficultyVal,
      count: countVal
    })

    aiMessages.value = aiMessages.value.filter(m => m.id !== tempAssistantMsgId)

    if (res.success && res.data?.exercises) {
      aiMessages.value.push({
        id: 'ex_res_' + Date.now(),
        sender: 'assistant',
        timestamp: formatTime(new Date().toISOString()),
        type: 'exercises',
        exercisesData: res.data.exercises,
        tokensUsed: res.data.tokensUsed
      })
      await refreshBalanceAndHistory()
    } else {
      aiMessages.value.push({
        id: 'ex_err_' + Date.now(),
        sender: 'assistant',
        timestamp: formatTime(new Date().toISOString()),
        type: 'chat',
        text: res.message || 'Could not generate exercises. Verify your token balance.'
      })
    }
  } catch (e: any) {
    aiMessages.value = aiMessages.value.filter(m => m.id !== tempAssistantMsgId)
    aiMessages.value.push({
      id: 'ex_err_' + Date.now(),
      sender: 'assistant',
      timestamp: formatTime(new Date().toISOString()),
      type: 'chat',
      text: e?.message || 'Server error generating exercises.'
    })
  } finally {
    isSending.value = false
    scrollToBottom()
  }
}

// Action: Summarize Course material
async function handleSummarizeAction() {
  showSummaryModal.value = false
  isSending.value = true

  const fileIdVal = summaryForm.value.fileId || selectedFileId.value || undefined
  const textVal = summaryForm.value.text || undefined

  aiMessages.value.push({
    id: 'sum_prompt_' + Date.now(),
    sender: 'user',
    timestamp: formatTime(new Date().toISOString()),
    type: 'chat',
    text: fileIdVal ? `Summarize document: ${files.value.find(f => f._id === fileIdVal)?.originalName || 'Selected document'}` : `Summarize study notes.`
  })

  const tempAssistantMsgId = 'temp_ai_' + Date.now()
  aiMessages.value.push({
    id: tempAssistantMsgId,
    sender: 'assistant',
    timestamp: formatTime(new Date().toISOString()),
    type: 'chat',
    text: '',
    isGenerating: true
  })
  scrollToBottom()

  try {
    const res = await post<any>('/ai/summarize', {
      fileId: fileIdVal,
      courseId: selectedCourseId.value || undefined,
      text: textVal
    })

    aiMessages.value = aiMessages.value.filter(m => m.id !== tempAssistantMsgId)

    if (res.success && res.data?.summary) {
      aiMessages.value.push({
        id: 'sum_res_' + Date.now(),
        sender: 'assistant',
        timestamp: formatTime(new Date().toISOString()),
        type: 'summary',
        summaryData: res.data.summary,
        tokensUsed: res.data.tokensUsed
      })
      await refreshBalanceAndHistory()
    } else {
      aiMessages.value.push({
        id: 'sum_err_' + Date.now(),
        sender: 'assistant',
        timestamp: formatTime(new Date().toISOString()),
        type: 'chat',
        text: res.message || 'Could not summarize material. Verify your token balance.'
      })
    }
  } catch (e: any) {
    aiMessages.value = aiMessages.value.filter(m => m.id !== tempAssistantMsgId)
    aiMessages.value.push({
      id: 'sum_err_' + Date.now(),
      sender: 'assistant',
      timestamp: formatTime(new Date().toISOString()),
      type: 'chat',
      text: e?.message || 'Server error generating summary.'
    })
  } finally {
    isSending.value = false
    scrollToBottom()
  }
}

// Action: Create Daily / Study Plan
async function handleDailyPlanAction() {
  showPlanModal.value = false
  isSending.value = true

  const hoursVal = planForm.value.focusHours
  const dateVal = planForm.value.date

  aiMessages.value.push({
    id: 'plan_prompt_' + Date.now(),
    sender: 'user',
    timestamp: formatTime(new Date().toISOString()),
    type: 'chat',
    text: `Create a study plan for ${dateVal} with ${hoursVal} focus hours.`
  })

  const tempAssistantMsgId = 'temp_ai_' + Date.now()
  aiMessages.value.push({
    id: tempAssistantMsgId,
    sender: 'assistant',
    timestamp: formatTime(new Date().toISOString()),
    type: 'chat',
    text: '',
    isGenerating: true
  })
  scrollToBottom()

  try {
    const courseIdsVal = selectedCourseId.value ? [selectedCourseId.value] : []
    const res = await post<any>('/ai/daily-plan', {
      courseIds: courseIdsVal,
      focusHours: hoursVal,
      date: dateVal
    })

    aiMessages.value = aiMessages.value.filter(m => m.id !== tempAssistantMsgId)

    if (res.success && res.data?.plan) {
      aiMessages.value.push({
        id: 'plan_res_' + Date.now(),
        sender: 'assistant',
        timestamp: formatTime(new Date().toISOString()),
        type: 'daily_plan',
        planData: res.data.plan,
        tokensUsed: res.data.tokensUsed
      })
      await refreshBalanceAndHistory()
    } else {
      aiMessages.value.push({
        id: 'plan_err_' + Date.now(),
        sender: 'assistant',
        timestamp: formatTime(new Date().toISOString()),
        type: 'chat',
        text: res.message || 'Could not generate study plan. Verify your token balance.'
      })
    }
  } catch (e: any) {
    aiMessages.value = aiMessages.value.filter(m => m.id !== tempAssistantMsgId)
    aiMessages.value.push({
      id: 'plan_err_' + Date.now(),
      sender: 'assistant',
      timestamp: formatTime(new Date().toISOString()),
      type: 'chat',
      text: e?.message || 'Server error generating plan.'
    })
  } finally {
    isSending.value = false
    scrollToBottom()
  }
}

// ── Follow up actions on response context ─────────────────────────────────────
async function handleExplainDeeper(parentMsg: AIMessage) {
  let promptText = ''
  if (parentMsg.type === 'summary' && parentMsg.summaryData) {
    promptText = `Can you explain the summary of "${parentMsg.summaryData.summary.substring(0, 60)}..." in much deeper technical detail?`
  } else if (parentMsg.type === 'exercises' && parentMsg.exercisesData) {
    promptText = `Can you explain the core concepts of topic "${parentMsg.exercisesData.topic}" and go deeper into the theory behind these exercises?`
  } else if (parentMsg.type === 'daily_plan' && parentMsg.planData) {
    promptText = `Can you explain how I can structure my breaks and energy management better to execute this study plan?`
  } else {
    promptText = `Explain the concept you just described in much more detail, covering edge cases.`
  }

  chatMessage.value = promptText
  sendChatMessage()
}

async function handleExplainWithExample(parentMsg: AIMessage) {
  let topic = 'the concept'
  if (parentMsg.type === 'summary' && parentMsg.summaryData) {
    topic = 'the concepts in this summary'
  } else if (parentMsg.type === 'exercises' && parentMsg.exercisesData) {
    topic = `the topic: ${parentMsg.exercisesData.topic}`
  }
  chatMessage.value = `Explain ${topic} again, but this time using a clear, real-world example.`
  sendChatMessage()
}

async function handleGenerateFlashcards(parentMsg: AIMessage) {
  let topic = 'the concepts you just explained'
  if (parentMsg.type === 'summary' && parentMsg.summaryData) {
    topic = 'this summary'
  }
  chatMessage.value = `Create 5 study flashcards (Question & Answer format) based on ${topic}.`
  sendChatMessage()
}

async function handleQuizMe(parentMsg: AIMessage) {
  let topic = 'the previous response'
  if (parentMsg.type === 'summary' && parentMsg.summaryData) {
    topic = 'this course summary'
  } else if (parentMsg.type === 'exercises' && parentMsg.exercisesData) {
    topic = `the topic: ${parentMsg.exercisesData.topic}`
  }
  chatMessage.value = `Quiz me on ${topic}! Ask me 3 questions one by one and wait for my answers.`
  sendChatMessage()
}

function handleSaveToNotes() {
  alert("The notes feature is currently under active development and will be available soon.")
}

function selectHistoryOutput(historyItem: any) {
  // Populate the active chat view with this history item by scrolling to it or adding it to messages focus
  // Since we already loaded full history chronologically, we can just look up the message id in the feed and scroll to it
  const matchId = `${historyItem._id}_assistant`
  const element = document.getElementById(matchId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    element.classList.add('highlight-output')
    setTimeout(() => {
      element.classList.remove('highlight-output')
    }, 2000)
  } else {
    // If not found in current messages, refresh feed
    loadData()
  }
}

function selectActiveCourse(courseId: string) {
  selectedCourseId.value = courseId
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <section class="assistant-page max-w-[1600px] mx-auto pb-10">  
    <!-- Loading Page State -->
    <div v-if="isLoadingPage" class="flex flex-col items-center justify-center py-32 gap-3">
      <UIcon name="i-lucide-loader-2" class="size-10 animate-spin text-[#6366f1]" />
      <span class="text-sm font-semibold text-slate-500 dark:text-slate-400">Preparing assistant...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="error-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-lg mx-auto text-center mt-12 shadow-sm">
      <UIcon name="i-lucide-alert-triangle" class="size-12 text-rose-500 mb-4" />
      <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Failed to load Assistant</h3>
      <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">{{ loadError }}</p>
      <button @click="loadData" class="btn-primary inline-flex items-center gap-2 mx-auto">
        <UIcon name="i-lucide-refresh-cw" class="size-4" />
        Retry Connection
      </button>
    </div>

    <!-- Main Grid Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      
      <!-- ─── LEFT COLUMN: CHAT CARD ─── -->
      <div class="lg:col-span-2 flex flex-col gap-6">
        <div class="chat-card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] flex flex-col h-[780px]">
          
          <!-- Greeting Intro (Visible when message history is empty) -->
          <div v-if="aiMessages.length === 0" class="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-t-2xl">
            <div class="flex items-start gap-4">
              <div class="ai-avatar-circle flex-shrink-0 size-[48px] bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] text-white flex items-center justify-center rounded-full shadow-md shadow-indigo-100 dark:shadow-none">
                <UIcon name="i-lucide-sparkles" class="size-5" />
              </div>
              <div class="flex-1">
                <h2 class="text-base font-bold text-slate-800 dark:text-slate-100">
                  Hi {{ currentUser?.name || 'Student' }}! I'm your AI study assistant.
                </h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  I can help you understand concepts, create study plans, generate exercises, and keep you on track.
                </p>
                
                <!-- Quick actions row -->
                <div class="flex flex-wrap items-center gap-2.5 mt-4">
                  <button @click="showSummaryModal = true" class="quick-action-btn">
                    <UIcon name="i-lucide-file-text" class="size-4 text-indigo-500" />
                    Summarize my course
                  </button>
                  <button @click="showPlanModal = true" class="quick-action-btn">
                    <UIcon name="i-lucide-calendar" class="size-4 text-violet-500" />
                    Create a study plan
                  </button>
                  <button @click="showExerciseModal = true" class="quick-action-btn">
                    <UIcon name="i-lucide-pencil" class="size-4 text-sky-500" />
                    Generate exercises
                  </button>
                  <button @click="handleDailyPlanAction" class="quick-action-btn">
                    <UIcon name="i-lucide-clock" class="size-4 text-emerald-500" />
                    Plan my day
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Conversational Feed -->
          <div ref="chatFeedRef" class="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            
            <!-- Default Intro greeting shown as starting message if history exists but empty context -->
            <div v-if="aiMessages.length > 0" class="flex gap-4 border-b border-slate-50 dark:border-slate-800 pb-5">
              <div class="ai-avatar-circle flex-shrink-0 size-[36px] bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] text-white flex items-center justify-center rounded-full">
                <UIcon name="i-lucide-sparkles" class="size-4" />
              </div>
              <div class="flex-1">
                <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100">AI Study Assistant</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Ready to support your studies. You can use the quick actions below to generate structures instantly:
                </p>
                <div class="flex flex-wrap items-center gap-2 mt-3">
                  <button @click="showSummaryModal = true" class="mini-quick-btn">
                    <UIcon name="i-lucide-file-text" class="size-3 text-indigo-500" />
                    Summarize course
                  </button>
                  <button @click="showPlanModal = true" class="mini-quick-btn">
                    <UIcon name="i-lucide-calendar" class="size-3 text-violet-500" />
                    Study plan
                  </button>
                  <button @click="showExerciseModal = true" class="mini-quick-btn">
                    <UIcon name="i-lucide-pencil" class="size-3 text-sky-500" />
                    Exercises
                  </button>
                  <button @click="handleDailyPlanAction" class="mini-quick-btn">
                    <UIcon name="i-lucide-clock" class="size-3 text-emerald-500" />
                    Plan day
                  </button>
                </div>
              </div>
            </div>

            <!-- Messages List -->
            <div v-for="msg in aiMessages" :key="msg.id" :id="msg.id" class="message-wrapper">
              
              <!-- 1. User Message (Aligns Right) -->
              <div v-if="msg.sender === 'user'" class="flex items-start justify-end gap-3 max-w-[85%] ml-auto">
                <div class="flex flex-col items-end">
                  <span class="text-[10px] text-slate-400 mb-1">{{ msg.timestamp }}</span>
                  <div class="user-bubble bg-[#f5f4fd] dark:bg-indigo-950/40 border border-indigo-50/50 dark:border-indigo-900/20 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tr-none px-4.5 py-3 text-sm shadow-sm">
                    {{ msg.text }}
                  </div>
                </div>
                <AppAvatar
                  :src="currentUser?.avatar"
                  :name="currentUser?.name"
                  size="sm"
                  class="flex-shrink-0 border border-slate-100 dark:border-slate-800"
                />
              </div>

              <!-- 2. Assistant Message (Aligns Left) -->
              <div v-else class="flex items-start gap-3 max-w-[90%] mr-auto">
                <div class="ai-avatar-circle flex-shrink-0 size-[36px] bg-[#f5f4fd] dark:bg-indigo-950/30 text-[#4f46e5] dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 flex items-center justify-center rounded-full shadow-sm">
                  <UIcon name="i-lucide-sparkles" class="size-4.5" />
                </div>
                
                <div class="flex-1 min-w-0">
                  <span class="text-[10px] text-slate-400 mb-1 block">{{ msg.timestamp }}</span>
                  
                  <div class="ai-bubble bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-850 dark:text-slate-200 rounded-2xl rounded-tl-none p-5 shadow-[0_2px_12px_rgba(15,23,42,0.02)]">
                    
                    <!-- Loading typing indicator -->
                    <div v-if="msg.isGenerating" class="typing-indicator flex items-center gap-1.5 py-1">
                      <span class="dot"></span>
                      <span class="dot"></span>
                      <span class="dot"></span>
                    </div>

                    <!-- Type: Standard Chat Response -->
                    <div v-else-if="msg.type === 'chat'" class="whitespace-pre-line text-sm leading-relaxed">
                      {{ msg.text }}
                    </div>

                    <!-- Type: Summarized Output -->
                    <div v-else-if="msg.type === 'summary' && msg.summaryData" class="space-y-4">
                      <h4 class="text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <UIcon name="i-lucide-file-text" class="text-indigo-500 size-4" />
                        Summary Report
                      </h4>
                      <p class="text-xs text-slate-650 dark:text-slate-350 leading-relaxed">{{ msg.summaryData.summary }}</p>
                      
                      <div class="key-points bg-slate-50 dark:bg-slate-950/30 rounded-xl p-3 border border-slate-100/60 dark:border-slate-800/40">
                        <h5 class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Key Takeaways</h5>
                        <ul class="space-y-2">
                          <li v-for="(point, idx) in msg.summaryData.keyPoints" :key="idx" class="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                            <span class="size-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></span>
                            <span>{{ point }}</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div v-if="msg.summaryData.wordCount" class="flex items-center gap-3 text-[10px] text-slate-450 dark:text-slate-500 font-semibold pt-1">
                        <span>Words: {{ msg.summaryData.wordCount }}</span>
                        <span>•</span>
                        <span>Estimated reading: {{ msg.summaryData.readingTime || 'N/A' }}</span>
                      </div>
                    </div>

                    <!-- Type: Exercises Output -->
                    <div v-else-if="msg.type === 'exercises' && msg.exercisesData" class="space-y-4">
                      <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                        <h4 class="text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                          <UIcon name="i-lucide-pencil" class="text-sky-500 size-4" />
                          Practice Exercises
                        </h4>
                        <span class="badge-difficulty text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
                          :class="msg.exercisesData.difficulty === 'hard' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450' : msg.exercisesData.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450'"
                        >
                          {{ msg.exercisesData.difficulty }}
                        </span>
                      </div>
                      
                      <p class="text-xs text-slate-500 dark:text-slate-400">Topic: <strong class="text-slate-700 dark:text-slate-200">{{ msg.exercisesData.topic }}</strong></p>

                      <div class="space-y-4 mt-3">
                        <div v-for="(ex, idx) in msg.exercisesData.exercises" :key="ex.id" class="exercise-item border border-slate-100 dark:border-slate-800/80 rounded-xl p-3.5 bg-slate-50/20 dark:bg-slate-950/10">
                          <p class="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {{ idx + 1 }}. {{ ex.question }}
                          </p>

                          <!-- MCQ Options -->
                          <div v-if="ex.type === 'mcq' && ex.options" class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                            <label v-for="option in ex.options" :key="option" class="mcq-option flex items-center gap-2 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5 cursor-pointer text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                              <input type="radio" :name="'ex_radio_' + ex.id" class="accent-indigo-600" />
                              <span class="text-slate-700 dark:text-slate-350">{{ option }}</span>
                            </label>
                          </div>

                          <!-- Coding Language Indicator -->
                          <div v-if="ex.type === 'coding' && ex.language" class="mt-2 text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                            <UIcon name="i-lucide-code" class="size-3" />
                            {{ ex.language }}
                          </div>

                          <!-- Hints and Answers toggles -->
                          <div class="flex items-center gap-2.5 mt-3 pt-2 border-t border-slate-100/60 dark:border-slate-800/60">
                            <button v-if="ex.hint" @click="revealedHints[msg.id + '_' + ex.id] = !revealedHints[msg.id + '_' + ex.id]" class="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1">
                              <UIcon :name="revealedHints[msg.id + '_' + ex.id] ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="size-3" />
                              {{ revealedHints[msg.id + '_' + ex.id] ? 'Hide Hint' : 'View Hint' }}
                            </button>
                            
                            <button v-if="ex.answer" @click="revealedAnswers[msg.id + '_' + ex.id] = !revealedAnswers[msg.id + '_' + ex.id]" class="text-[11px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 ml-auto">
                              <UIcon :name="revealedAnswers[msg.id + '_' + ex.id] ? 'i-lucide-lock-keyhole-open' : 'i-lucide-lock'" class="size-3" />
                              {{ revealedAnswers[msg.id + '_' + ex.id] ? 'Hide Answer' : 'Show Answer' }}
                            </button>
                          </div>

                          <!-- Hint content -->
                          <div v-if="revealedHints[msg.id + '_' + ex.id]" class="mt-2.5 text-[11px] bg-sky-50/40 text-sky-850 dark:bg-sky-950/20 dark:text-sky-300 p-2.5 rounded-lg border border-sky-100/50 dark:border-sky-900/30">
                            <strong>Hint:</strong> {{ ex.hint }}
                          </div>

                          <!-- Answer content -->
                          <div v-if="revealedAnswers[msg.id + '_' + ex.id]" class="mt-2.5 text-[11px] bg-emerald-50/40 text-emerald-850 dark:bg-emerald-950/20 dark:text-emerald-300 p-2.5 rounded-lg border border-emerald-100/50 dark:border-emerald-900/30">
                            <strong>Correct Answer:</strong> {{ ex.answer }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Type: Daily Plan Output -->
                    <div v-else-if="msg.type === 'daily_plan' && msg.planData" class="space-y-4">
                      <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                        <h4 class="text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                          <UIcon name="i-lucide-calendar" class="text-emerald-500 size-4" />
                          Personalized Study Plan
                        </h4>
                        <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {{ msg.planData.date }} • {{ msg.planData.totalStudyHours }}h total
                        </span>
                      </div>

                      <div class="relative pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-4 my-2">
                        <div v-for="item in msg.planData.plan" :key="item.time" class="relative">
                          <!-- Dot indicator on timeline -->
                          <span class="absolute -left-[21px] top-1.5 size-2 rounded-full border border-white dark:border-slate-900 bg-indigo-500 shadow-sm"></span>
                          
                          <div class="text-xs">
                            <span class="font-bold text-[#4f46e5] dark:text-indigo-400">{{ item.time }}</span>
                            <span class="mx-1.5 text-slate-400">•</span>
                            <strong class="text-slate-800 dark:text-slate-200">{{ item.subject }}</strong>
                            <p class="text-slate-500 dark:text-slate-400 mt-0.5">{{ item.activity }}</p>
                            <span class="inline-block text-[9px] uppercase font-bold px-1.5 py-0.25 rounded-md mt-1"
                              :class="item.priority === 'high' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450' : item.priority === 'medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20' : 'bg-slate-100 text-slate-650'"
                            >
                              {{ item.priority }}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div v-if="msg.planData.tip" class="bg-amber-50/40 text-amber-850 dark:bg-amber-950/10 dark:text-amber-300 rounded-xl p-3 border border-amber-100/50 dark:border-amber-900/20 text-xs flex gap-2">
                        <UIcon name="i-lucide-lightbulb" class="size-4.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <span><strong>Tip:</strong> {{ msg.planData.tip }}</span>
                      </div>
                    </div>

                    <!-- Token cost notification -->
                    <div v-if="msg.tokensUsed" class="text-[9px] font-bold text-slate-400 uppercase text-right tracking-wide mt-3.5 select-none">
                      Cost: {{ msg.tokensUsed }} tokens deducted
                    </div>

                  </div>

                  <!-- Assistant Response Actions (Feedback + Follow-ups) -->
                  <div v-if="!msg.isGenerating" class="flex flex-col gap-2 mt-2 ml-1">
                    
                    <!-- Copy, Save, Explain deeper row -->
                    <div class="flex items-center gap-2">
                      <button @click="copyToClipboard(msg.text || msg.summaryData?.summary || 'AI Response')" class="response-action-btn" title="Copy Response">
                        <UIcon name="i-lucide-copy" class="size-3.5" />
                        Copy
                      </button>
                      <button @click="handleSaveToNotes" class="response-action-btn" title="Save to notes">
                        <UIcon name="i-lucide-bookmark" class="size-3.5" />
                        Save to Notes
                      </button>
                      <button @click="handleExplainDeeper(msg)" class="response-action-btn" title="Explain concepts in deeper detail">
                        <UIcon name="i-lucide-brain" class="size-3.5" />
                        Explain deeper
                      </button>

                      <div class="flex items-center gap-1 ml-auto">
                        <button @click="thumbsFeedback[msg.id] = 'up'" :class="thumbsFeedback[msg.id] === 'up' ? 'text-indigo-650 bg-indigo-50 dark:bg-indigo-950/30' : 'text-slate-400 hover:text-slate-650'" class="size-7 flex items-center justify-center rounded-lg transition-colors">
                          <UIcon name="i-lucide-thumbs-up" class="size-3.5" />
                        </button>
                        <button @click="thumbsFeedback[msg.id] = 'down'" :class="thumbsFeedback[msg.id] === 'down' ? 'text-rose-650 bg-rose-50 dark:bg-rose-950/30' : 'text-slate-400 hover:text-slate-650'" class="size-7 flex items-center justify-center rounded-lg transition-colors">
                          <UIcon name="i-lucide-thumbs-down" class="size-3.5" />
                        </button>
                      </div>
                    </div>

                    <!-- Contextual query suggestions -->
                    <div class="flex flex-wrap items-center gap-1.5 mt-1 border-t border-slate-50 dark:border-slate-800/40 pt-2">
                      <button @click="handleExplainWithExample(msg)" class="suggestion-tag-btn">Explain with an example</button>
                      <button @click="handleGenerateFlashcards(msg)" class="suggestion-tag-btn">Create flashcards</button>
                      <button @click="showExerciseModal = true" class="suggestion-tag-btn">Generate exercises</button>
                      <button @click="handleQuizMe(msg)" class="suggestion-tag-btn">Quiz me on this</button>
                    </div>

                  </div>

                </div>
              </div>

            </div>

          </div>

          <!-- Bottom Message Composer -->
          <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl">
            <form @submit.prevent="sendChatMessage" class="flex gap-2">
              <div class="relative flex-1">
                <textarea
                  v-model="chatMessage"
                  placeholder="Ask anything about your studies..."
                  rows="1"
                  class="composer-textarea w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-[#4f46e5] dark:focus:border-indigo-500 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 resize-none overflow-hidden"
                  @keydown.enter.exact.prevent="sendChatMessage"
                  :disabled="isSending"
                ></textarea>
                
                <button
                  type="submit"
                  class="absolute right-2 top-2 size-[34px] rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white flex items-center justify-center transition-colors disabled:opacity-50"
                  :disabled="!chatMessage.trim() || isSending"
                >
                  <UIcon name="i-lucide-send" class="size-4" />
                </button>
              </div>
            </form>

            <div class="flex items-center justify-between mt-3 px-1.5 text-slate-400 dark:text-slate-500 text-[11px] font-semibold">
              <div class="flex items-center gap-3">
                
                <!-- Select Context Dropdown -->
                <div class="flex items-center gap-1.5 cursor-pointer hover:text-slate-650 dark:hover:text-slate-350 relative select-none">
                  <UIcon name="i-lucide-plus" class="size-3.5 text-indigo-500" />
                  <select v-model="selectedCourseId" class="bg-transparent border-none focus:outline-none text-[11px] font-bold text-slate-600 dark:text-slate-400 cursor-pointer pr-1">
                    <option value="">No Course Context</option>
                    <option v-for="course in courses" :key="course._id" :value="course._id">
                      {{ course.title }}
                    </option>
                  </select>
                </div>

                <div class="flex items-center gap-1.5 cursor-pointer hover:text-slate-650 dark:hover:text-slate-350 select-none">
                  <UIcon name="i-lucide-file-text" class="size-3.5 text-sky-500" />
                  <select v-model="selectedFileId" class="bg-transparent border-none focus:outline-none text-[11px] font-bold text-slate-600 dark:text-slate-400 cursor-pointer pr-1">
                    <option value="">No File Context</option>
                    <option v-for="file in files" :key="file._id" :value="file._id">
                      {{ file.originalName }}
                    </option>
                  </select>
                </div>

              </div>

              <div class="flex items-center gap-3">
                <span class="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-550 px-2 py-0.5 rounded-full">
                  {{ currentCostLabel }}
                </span>
                
                <!-- View History -->
                <button @click="loadData" class="flex items-center gap-1 hover:text-slate-650 dark:hover:text-slate-350">
                  <UIcon name="i-lucide-history" class="size-3.5" />
                  View history
                </button>
              </div>
            </div>

          </div>

        </div>
        
        <p class="text-[10px] text-slate-400 text-center font-medium mt-1">
          AI responses may be inaccurate. Please verify important information.
        </p>
      </div>

      <!-- ─── RIGHT COLUMN: STUDY CONTEXT & TOKEN USAGE ─── -->
      <div class="lg:col-span-1 flex flex-col gap-6">
        
        <!-- Card 1: Your Study Context -->
        <div class="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)]">
          <div class="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3 mb-4">
            <h3 class="text-[13px] font-bold text-slate-800 dark:text-slate-200">Your Study Context</h3>
            <NuxtLink to="/dashboard/courses" class="text-[11px] font-bold text-[#4f46e5] dark:text-indigo-400 hover:underline">
              Manage
            </NuxtLink>
          </div>

          <!-- Active Course Block -->
          <div v-if="activeCourse" class="active-course-card border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 flex items-center gap-3 bg-slate-50/30 dark:bg-slate-950/10 mb-4 cursor-pointer hover:border-indigo-100 dark:hover:border-indigo-900/40 transition-colors">
            <div class="course-symbol size-[36px] bg-[#10b981]/15 text-[#10b981] flex items-center justify-center rounded-xl font-bold text-sm">
              {{ activeCourse.title.charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Active course</span>
              <h4 class="text-xs font-bold text-slate-800 dark:text-slate-150 truncate leading-snug">{{ activeCourse.title }}</h4>
              <p class="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5 truncate">
                {{ activeCourse.teacher || 'BSc Computer Science' }} • Semester 2
              </p>
            </div>
          </div>
          
          <div v-else class="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-100 dark:border-slate-800 rounded-xl mb-4">
            No active course selected.
          </div>

          <!-- Recent Uploaded Files list -->
          <div class="space-y-2.5">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Uploaded files</span>
            
            <div v-if="recentFiles.length > 0" class="space-y-2">
              <div v-for="file in recentFiles" :key="file._id" class="file-item-card flex items-center gap-3 p-2.5 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950/20 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                @click="selectedFileId = file._id"
                :class="selectedFileId === file._id ? 'border-sky-200 bg-sky-50/20 dark:border-sky-900/30' : ''"
              >
                <div class="file-icon-box size-[32px] bg-rose-50 dark:bg-rose-950/20 text-rose-550 flex items-center justify-center rounded-lg">
                  <UIcon name="i-lucide-file-text" class="size-4" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold text-slate-700 dark:text-slate-200 truncate leading-tight">{{ file.originalName }}</p>
                  <span class="text-[9px] text-slate-450 dark:text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                    <span>{{ formatFileSize(file.size) }}</span>
                    <span>•</span>
                    <span>Uploaded {{ formatRelativeTime(file.createdAt) }}</span>
                  </span>
                </div>
              </div>
            </div>

            <div v-else class="text-xs text-slate-400 text-center py-5 border border-slate-50 dark:border-slate-850 rounded-xl">
              No uploaded files yet.
            </div>

            <NuxtLink to="/dashboard/files" class="add-files-btn w-full mt-2.5 py-2 px-4 text-xs font-bold border border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5">
              <UIcon name="i-lucide-plus" class="size-4" />
              Add more files
            </NuxtLink>
          </div>
        </div>

        <!-- Card 2: Token Usage -->
        <div class="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)]">
          <h3 class="text-[13px] font-bold text-slate-800 dark:text-slate-200 border-b border-slate-50 dark:border-slate-800 pb-3 mb-4">
            Token Usage
          </h3>

          <div class="space-y-4">
            <div class="flex items-end justify-between">
              <span class="text-[13px] font-bold text-slate-800 dark:text-slate-200 leading-none">
                {{ (10000 - tokenBalance).toLocaleString() }} / 10,000 used
              </span>
              <span class="text-sm font-extrabold text-[#4f46e5] dark:text-indigo-400 leading-none">
                {{ tokenUsagePct }}%
              </span>
            </div>

            <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div class="bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] h-full rounded-full transition-all duration-500" :style="`width: ${tokenUsagePct}%`"></div>
            </div>

            <div class="flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500 pt-1">
              <span>Resets on 18 May 2024</span>
              <NuxtLink to="/settings/billing" class="text-[#4f46e5] dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold">
                Buy Tokens
                <UIcon name="i-lucide-arrow-right" class="size-3.5" />
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Card 3: Recent Outputs -->
        <div class="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)]">
          <div class="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3 mb-3">
            <h3 class="text-[13px] font-bold text-slate-800 dark:text-slate-200">Recent Outputs</h3>
            <button @click="loadData" class="text-[11px] font-bold text-[#4f46e5] dark:text-indigo-400 hover:underline">
              View all
            </button>
          </div>

          <div v-if="aiHistory.length > 0" class="space-y-2">
            <div
              v-for="item in aiHistory.slice(0, 4)"
              :key="item._id"
              @click="selectHistoryOutput(item)"
              class="recent-output-item flex items-center gap-3 p-2.5 rounded-xl border border-slate-50/50 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-950/10 cursor-pointer hover:border-indigo-100 dark:hover:border-indigo-900/30 hover:bg-slate-50/40 dark:hover:bg-slate-900/40 transition-all"
            >
              <div class="recent-output-icon size-[32px] flex items-center justify-center rounded-lg"
                :class="item.type === 'summary' ? 'bg-indigo-50 text-indigo-650 dark:bg-indigo-950/20' : item.type === 'exercises' ? 'bg-sky-50 text-sky-650 dark:bg-sky-950/20' : item.type === 'daily_plan' ? 'bg-emerald-50 text-emerald-650 dark:bg-emerald-950/20' : 'bg-amber-50 text-amber-650 dark:bg-amber-950/20'"
              >
                <UIcon :name="item.type === 'summary' ? 'i-lucide-file-text' : item.type === 'exercises' ? 'i-lucide-pencil' : item.type === 'daily_plan' ? 'i-lucide-calendar' : 'i-lucide-message-square'" class="size-4" />
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="text-xs font-bold text-slate-700 dark:text-slate-250 truncate capitalize">
                  {{ item.type === 'summary' ? 'Course Summary' : item.type === 'exercises' ? 'Practice Exercises' : item.type === 'daily_plan' ? 'Study Plan' : 'Chat Assistance' }}
                </h4>
                <p class="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
                  <span>{{ item.courseId?.title || 'General' }}</span>
                  <span>•</span>
                  <span>{{ formatRelativeTime(item.createdAt) }}</span>
                </p>
              </div>
            </div>
          </div>

          <div v-else class="text-xs text-slate-400 text-center py-6">
            No recent AI outputs yet.
          </div>
        </div>

      </div>

    </div>

    <!-- ── MODAL: GENERATE EXERCISES ────────────────────────────────────────── -->
    <div v-if="showExerciseModal" class="modal-overlay" @click.self="showExerciseModal = false">
      <div class="modal-box p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-floating">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <h3 class="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UIcon name="i-lucide-pencil" class="text-sky-500" />
            Generate Exercises
          </h3>
          <button @click="showExerciseModal = false" class="text-slate-400 hover:text-slate-650">
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <div class="space-y-4">
          <div class="form-group">
            <label class="form-label text-xs font-bold text-slate-500 uppercase">Topic / Area</label>
            <input v-model="exerciseForm.topic" type="text" placeholder="e.g. Matrices, Integration, SQL Joins..." class="form-input bg-slate-50 dark:bg-slate-950 mt-1" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label text-xs font-bold text-slate-500 uppercase">Difficulty</label>
              <select v-model="exerciseForm.difficulty" class="form-input bg-slate-50 dark:bg-slate-950 mt-1 select-custom">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label text-xs font-bold text-slate-500 uppercase">Count</label>
              <input v-model.number="exerciseForm.count" type="number" min="1" max="10" class="form-input bg-slate-50 dark:bg-slate-950 mt-1" />
            </div>
          </div>

          <p class="text-[10px] text-slate-450 dark:text-slate-500 italic mt-2">
            This request will deduct 1,000 tokens from your balance.
          </p>

          <div class="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button @click="showExerciseModal = false" class="btn-secondary">Cancel</button>
            <button @click="handleGenerateExercisesAction" class="btn-primary">Generate Now</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── MODAL: SUMMARIZE MATERIAL ────────────────────────────────────────── -->
    <div v-if="showSummaryModal" class="modal-overlay" @click.self="showSummaryModal = false">
      <div class="modal-box p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-floating">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <h3 class="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UIcon name="i-lucide-file-text" class="text-indigo-500" />
            Summarize Course Material
          </h3>
          <button @click="showSummaryModal = false" class="text-slate-400 hover:text-slate-650">
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <div class="space-y-4">
          <div class="form-group">
            <label class="form-label text-xs font-bold text-slate-500 uppercase">Select File</label>
            <select v-model="summaryForm.fileId" class="form-input bg-slate-50 dark:bg-slate-950 mt-1 select-custom">
              <option value="">No File Selected</option>
              <option v-for="file in files" :key="file._id" :value="file._id">
                {{ file.originalName }} ({{ formatFileSize(file.size) }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label text-xs font-bold text-slate-500 uppercase">Or Paste Custom Text</label>
            <textarea v-model="summaryForm.text" placeholder="Paste custom notes or paragraphs here to summarize..." rows="4" class="form-input py-2 bg-slate-50 dark:bg-slate-950 mt-1 h-auto resize-none"></textarea>
          </div>

          <p class="text-[10px] text-slate-450 dark:text-slate-500 italic mt-2">
            This request will deduct 800 tokens from your balance.
          </p>

          <div class="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button @click="showSummaryModal = false" class="btn-secondary">Cancel</button>
            <button @click="handleSummarizeAction" class="btn-primary" :disabled="!summaryForm.fileId && !summaryForm.text">Summarize</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── MODAL: CREATE STUDY PLAN ─────────────────────────────────────────── -->
    <div v-if="showPlanModal" class="modal-overlay" @click.self="showPlanModal = false">
      <div class="modal-box p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-floating">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <h3 class="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UIcon name="i-lucide-calendar" class="text-violet-500" />
            Create Study Plan
          </h3>
          <button @click="showPlanModal = false" class="text-slate-400 hover:text-slate-650">
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <div class="space-y-4">
          <div class="form-group">
            <label class="form-label text-xs font-bold text-slate-500 uppercase">Focus Hours</label>
            <input v-model.number="planForm.focusHours" type="number" min="1" max="16" class="form-input bg-slate-50 dark:bg-slate-950 mt-1" />
          </div>

          <div class="form-group">
            <label class="form-label text-xs font-bold text-slate-500 uppercase">Target Date</label>
            <input v-model="planForm.date" type="date" class="form-input bg-slate-50 dark:bg-slate-950 mt-1" />
          </div>

          <p class="text-[10px] text-slate-450 dark:text-slate-500 italic mt-2">
            This request will deduct 500 tokens from your balance.
          </p>

          <div class="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button @click="showPlanModal = false" class="btn-secondary">Cancel</button>
            <button @click="handleDailyPlanAction" class="btn-primary">Create Plan</button>
          </div>
        </div>
      </div>
    </div>

  </section>
</template>

<style scoped>
/* ── Page Header Styles (matches tasks.vue structure) ────────────────────────── */
.page-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  margin-bottom: 24px;
}

.page-title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sparkle-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-lg);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  font-weight: 500;
}

/* ── Chat Styling ───────────────────────────────────────────────────────────── */
.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-soft);
  cursor: pointer;
  transition: all var(--transition-fast) var(--ease-out);
}
.quick-action-btn:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-soft);
  transform: translateY(-1px);
}

.mini-quick-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 700;
  color: var(--color-text-soft);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.mini-quick-btn:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-soft);
}

/* Buttons from tasks.vue template style classes */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  padding: 0 16px;
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--radius-xl);
  font-size: 13px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: background var(--transition-fast);
}
.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  padding: 0 16px;
  background: var(--color-surface);
  color: var(--color-text-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  font-size: 13px;
  font-weight: 750;
  cursor: pointer;
  transition: background var(--transition-fast);
}
.btn-secondary:hover {
  background: var(--color-bg-soft);
}

.response-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 4.5px 9px;
  background: var(--color-surface);
  transition: all var(--transition-fast);
  cursor: pointer;
}
.response-action-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-bg-soft);
}

.suggestion-tag-btn {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border: 1px solid transparent;
  border-radius: 20px;
  padding: 5px 11px;
  transition: all var(--transition-fast);
  cursor: pointer;
}
.suggestion-tag-btn:hover {
  border-color: var(--color-primary);
  transform: scale(1.02);
}

/* Modals overlays & boxes matching tasks.vue custom classes */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.modal-box {
  width: 100%;
  max-width: 440px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  max-height: 90vh;
  overflow-y: auto;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.form-input {
  height: 40px;
  padding: 0 12px;
  font-size: 13px;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  outline: none;
  width: 100%;
  transition: border-color var(--transition-fast);
}
.form-input:focus {
  border-color: var(--color-primary);
}

.select-custom {
  cursor: pointer;
}

/* ── Animation: Typing pulse ────────────────────────────────────────────────── */
.typing-indicator .dot {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-text-muted);
  animation: wave 1.2s infinite ease-in-out;
}
.typing-indicator .dot:nth-child(2) {
  animation-delay: 0.2s;
}
.typing-indicator .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes wave {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
}

/* Highlight Output Transition style */
.highlight-output {
  animation: pulse-border 2s ease-in-out;
}
@keyframes pulse-border {
  0% {
    border-color: var(--color-primary);
    box-shadow: 0 0 12px var(--color-primary-soft);
  }
  50% {
    border-color: var(--color-primary);
    box-shadow: 0 0 12px var(--color-primary-soft);
  }
  100% {
    border-color: var(--color-border);
    box-shadow: none;
  }
}

/* Scrollbar support */
.scrollbar-thin::-webkit-scrollbar {
  width: 5px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-strong);
}

.composer-textarea {
  line-height: 1.5;
  transition: border-color var(--transition-fast);
}
.composer-textarea:focus {
  box-shadow: 0 0 0 2px var(--color-primary-soft);
}
</style>
