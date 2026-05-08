<script setup lang="ts">
const props = defineProps<{
  title: string
  description: string
  icon?: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function toggle() {
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <div class="flex items-start justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
    <div class="flex items-start gap-3">
      <div
        v-if="icon"
        class="icon-box icon-box-primary"
      >
        <UIcon
          :name="icon"
          class="size-4"
        />
      </div>
      <div>
        <p class="text-sm font-semibold text-[var(--color-text)]">
          {{ title }}
        </p>
        <p class="mt-1 text-sm text-muted">
          {{ description }}
        </p>
      </div>
    </div>

    <button
      type="button"
      class="relative mt-1 inline-flex h-7 w-12 rounded-full transition"
      :class="modelValue ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'"
      @click="toggle"
    >
      <span
        class="absolute top-1 size-5 rounded-full bg-white shadow-sm transition"
        :class="modelValue ? 'left-6' : 'left-1'"
      />
    </button>
  </div>
</template>
