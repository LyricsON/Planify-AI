<script setup lang="ts">
const props = defineProps<{
  title: string
  tone: 'high' | 'progress' | 'completed'
  items: any[]
}>()

const emit = defineEmits<{
  (e: 'toggle', item: any): void
}>()

function toneWrap() {
  if (props.tone === 'high') return 'border-color:var(--color-border);background:color-mix(in srgb, var(--color-danger) 4%, var(--color-surface))'
  if (props.tone === 'progress') return 'border-color:var(--color-border);background:color-mix(in srgb, var(--color-warning) 4%, var(--color-surface))'
  if (props.tone === 'completed') return 'border-color:var(--color-border);background:color-mix(in srgb, var(--color-success) 3%, var(--color-surface))'
  return 'border-color:var(--color-border)'
}

function toneTitle() {
  if (props.tone === 'high') return 'text-red-500'
  if (props.tone === 'completed') return 'text-emerald-700 dark:text-emerald-300'
  return 'text-amber-600 dark:text-amber-300'
}

function toneTitleColor() {
  if (props.tone === 'high') return '#ef4444'
  if (props.tone === 'completed') return '#059669'
  return '#d97706'
}

function tonePill() {
  if (props.tone === 'high') return 'bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-300'
  if (props.tone === 'completed') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
  return 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300'
}
</script>

<template>
  <div class="rounded-xl border p-2" :style="toneWrap()">
    <div class="flex items-center justify-between mb-3">
      <p class="text-[13px] font-semibold leading-none mb-0" :class="toneTitle()" :style="`margin-bottom:0;color:${toneTitleColor()}`">{{ title }}</p>
      <span class="px-2 py-0.5 rounded-full text-[12px] font-semibold" :class="tonePill()">{{ items.length }}</span>
    </div>
    <div class="space-y-2">
      <div v-for="t in items.slice(0, 5)" :key="t._id" class="rounded-xl border p-3" style="border-color:var(--color-border);background:var(--color-surface)">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-start gap-2 min-w-0">
            <div v-if="tone === 'completed'" class="mt-0.5 size-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-check" class="size-2.5" />
            </div>
            <p class="min-w-0 mb-0" :class="tone === 'completed' ? 'text-[12px] line-through text-[var(--color-text-muted)]' : 'text-[12px] font-medium'" style="color:var(--color-text);margin-bottom:0">{{ t.title }}</p>
          </div>
          <button v-if="tone === 'high'" class="text-[12px] text-red-500 font-semibold" @click="emit('toggle', t)">{{ t.status === 'completed' ? 'Undo' : 'Done' }}</button>
        </div>
        <div :class="tone === 'completed' ? 'mt-1 pl-6 [&_*]:mb-0' : ''">
          <slot name="meta" :task="t" />
        </div>
      </div>
    </div>
  </div>
</template>
