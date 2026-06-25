<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { StudyGoal } from '~/types/profile'

const props = defineProps<{
  goal?: StudyGoal | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const profileStore = useProfileStore()
const { loading } = storeToRefs(profileStore)

const saving = ref(false)
const feedback = ref<{ tone: 'success' | 'warning'; text: string } | null>(null)

const form = reactive({
  title: '',
  description: '',
  targetValue: 10,
  currentValue: 0,
  unit: '',
  deadline: '',
  status: 'active' as 'active' | 'completed' | 'archived'
})

// Helper to format date object/ISO string to YYYY-MM-DD for input type="date"
function formatDateForInput(dateVal?: string | Date) {
  if (!dateVal) return ''
  const d = new Date(dateVal)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

function syncForm() {
  if (props.goal) {
    form.title = props.goal.title || ''
    form.description = props.goal.description || ''
    form.targetValue = props.goal.targetValue ?? 10
    form.currentValue = props.goal.currentValue ?? 0
    form.unit = props.goal.unit || ''
    form.deadline = formatDateForInput(props.goal.deadline)
    form.status = props.goal.status || 'active'
  } else {
    form.title = ''
    form.description = ''
    form.targetValue = 10
    form.currentValue = 0
    form.unit = ''
    form.deadline = ''
    form.status = 'active'
  }
}

watch(() => props.goal, syncForm, { immediate: true })

async function save() {
  if (!form.title.trim()) {
    feedback.value = { tone: 'warning', text: 'Goal title is required.' }
    return
  }
  if (form.targetValue <= 0) {
    feedback.value = { tone: 'warning', text: 'Target value must be greater than 0.' }
    return
  }
  if (form.currentValue < 0) {
    feedback.value = { tone: 'warning', text: 'Current value cannot be negative.' }
    return
  }

  saving.value = true
  feedback.value = null

  const payload = {
    title: form.title,
    description: form.description,
    targetValue: form.targetValue,
    currentValue: form.currentValue,
    unit: form.unit || undefined,
    deadline: form.deadline || undefined,
    status: form.status
  }

  let ok = false
  if (props.goal?.id) {
    const res = await profileStore.updateStudyGoal(props.goal.id, payload)
    ok = res.success
  } else {
    const res = await profileStore.addStudyGoal(payload)
    ok = res.success
  }

  saving.value = false

  if (ok) {
    feedback.value = {
      tone: 'success',
      text: props.goal?.id ? 'Goal updated successfully.' : 'Goal created successfully.'
    }
    setTimeout(() => {
      emit('saved')
    }, 700)
  } else {
    feedback.value = {
      tone: 'warning',
      text: profileStore.error || 'Unable to save study goal.'
    }
  }
}
</script>

<template>
  <UModal
    :open="true"
    :ui="{
      wrapper: 'z-[120]',
      width: 'sm:max-w-lg',
      rounded: 'rounded-[20px]',
      shadow: 'shadow-2xl',
      background: 'bg-white dark:bg-slate-900',
      ring: 'ring-1 ring-[var(--color-border)]',
      overlay: { background: 'bg-slate-900/40 backdrop-blur-[2px]' }
    }"
    @update:open="(val) => { if (!val) emit('close') }"
  >
    <template #content>
      <div class="p-5 sm:p-6 flex flex-col max-h-[calc(100vh-3rem)] sm:max-h-[85vh]">
        <!-- Modal Header -->
        <div class="flex-shrink-0 mb-5 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="icon-box icon-box-success">
              <UIcon :name="props.goal ? 'i-lucide-pencil' : 'i-lucide-plus'" class="size-4" />
            </div>
            <h3 class="text-xl font-semibold text-[var(--color-text)]">
              {{ props.goal ? 'Edit Study Goal' : 'Add New Goal' }}
            </h3>
          </div>
          <button
            type="button"
            class="rounded-lg p-1.5 text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-text)]"
            @click="emit('close')"
          >
            <UIcon name="i-lucide-x" class="size-4" />
          </button>
        </div>

        <!-- Feedback Banner -->
        <div
          v-if="feedback"
          class="flex-shrink-0 mb-4 rounded-xl px-4 py-3 text-sm font-medium"
          :class="feedback.tone === 'success'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'"
        >
          {{ feedback.text }}
        </div>

        <!-- Scrollable Form Content -->
        <div class="flex-1 overflow-y-auto pr-1 space-y-4">
          <div>
            <label class="field-label">Goal Title *</label>
            <input
              v-model="form.title"
              type="text"
              placeholder="e.g. Finish Nuxt 3 Course"
              class="field-control"
            >
          </div>

          <div>
            <label class="field-label">Description</label>
            <textarea
              v-model="form.description"
              placeholder="Provide a brief description of your goal..."
              rows="3"
              class="field-control resize-none py-3"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="field-label">Target Value *</label>
              <input
                v-model.number="form.targetValue"
                type="number"
                min="1"
                placeholder="e.g. 100"
                class="field-control"
              >
            </div>

            <div>
              <label class="field-label">Current Value</label>
              <input
                v-model.number="form.currentValue"
                type="number"
                min="0"
                placeholder="e.g. 0"
                class="field-control"
              >
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="field-label">Unit</label>
              <input
                v-model="form.unit"
                type="text"
                placeholder="e.g. hours, pages, %"
                class="field-control"
              >
            </div>

            <div>
              <label class="field-label">Deadline</label>
              <input
                v-model="form.deadline"
                type="date"
                class="field-control"
              >
            </div>
          </div>

          <div v-if="props.goal">
            <label class="field-label">Status</label>
            <select v-model="form.status" class="field-control select-control">
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <!-- Sticky Footer Actions -->
        <div class="flex-shrink-0 mt-5 flex items-center justify-end gap-3 border-t border-[var(--color-border)] pt-4">
          <button
            type="button"
            class="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-bg-soft)]"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="saving || loading"
            @click="save"
          >
            <span v-if="saving" class="flex items-center gap-2">
              <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
              Saving...
            </span>
            <span v-else>Save Goal</span>
          </button>
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.field-label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-soft);
}

.field-control {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-input-bg);
  color: var(--color-text);
  min-height: 44px;
  padding: 0 1rem;
  font-size: 0.875rem;
  transition: border-color var(--transition-fast) var(--ease-out),
    box-shadow var(--transition-fast) var(--ease-out);
}

.select-control {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.25em 1.25em;
  padding-right: 2.5rem;
}

.field-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-soft);
}
</style>
