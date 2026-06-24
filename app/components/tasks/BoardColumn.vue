<script setup lang="ts">
const props = defineProps<{
  title: string
  tone: 'high' | 'progress' | 'completed'
  items: any[]
}>()

const emit = defineEmits<{
  (e: 'action', payload: { task: any; action: 'start' | 'complete' | 'reopen' }): void
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
          
          <div class="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <template v-if="tone === 'high'">
              <button class="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline" @click="emit('action', { task: t, action: 'start' })">Start</button>
              <span class="text-slate-300 dark:text-slate-700 text-[10px] select-none">|</span>
              <button class="text-[11px] text-red-500 font-bold hover:underline" @click="emit('action', { task: t, action: 'complete' })">Done</button>
            </template>
            <template v-else-if="tone === 'progress'">
              <button class="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline" @click="emit('action', { task: t, action: 'complete' })">Done</button>
            </template>
            <template v-else-if="tone === 'completed'">
              <button class="text-[11px] text-slate-500 dark:text-slate-400 font-bold hover:underline" @click="emit('action', { task: t, action: 'reopen' })">Reopen</button>
            </template>
          </div>
        </div>
        <div :class="tone === 'completed' ? 'mt-1 pl-6 [&_*]:mb-0' : ''">
          <slot name="meta" :task="t" />
        </div>
      </div>
    </div>
  </div>
</template>
