<script setup lang="ts">
interface Props {
  sender: 'user' | 'assistant'
  text: string
}

const props = defineProps<Props>()

const isUser = computed(() => props.sender === 'user')

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function inlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code class="rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.86em] font-mono text-slate-800">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
}

function isSeparatorRow(line: string) {
  return /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(line)
}

function parseTable(block: string[]) {
  const rows = block
    .filter(line => line.trim().length > 0)
    .map(line => line.split('|').map(cell => cell.trim()).filter(Boolean))
  if (rows.length < 2) return ''

  const header = rows[0] ?? []
  const body = rows.slice(2)
  const headerCells = header.map(cell => `<th class="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">${inlineMarkdown(cell)}</th>`).join('')
  const bodyRows = body.map(row => {
    const cells = row.map(cell => `<td class="border-b border-slate-100 px-3 py-2 align-top text-slate-600">${inlineMarkdown(cell)}</td>`).join('')
    return `<tr>${cells}</tr>`
  }).join('')

  return `
    <div class="my-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table class="w-full border-collapse text-[13px]">
        <thead class="bg-slate-50">
          <tr>${headerCells}</tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
  `
}

function parseBlocks(text: string) {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const blocks: string[] = []
  let current: string[] = []
  let inCode = false

  const flush = () => {
    if (!current.length) return
    blocks.push(current.join('\n'))
    current = []
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      if (!inCode) {
        flush()
        inCode = true
        current.push(trimmed)
      } else {
        current.push(trimmed)
        flush()
        inCode = false
      }
      continue
    }

    if (inCode) {
      current.push(line)
      continue
    }

    if (!trimmed) {
      flush()
      continue
    }

    current.push(line)
  }

  flush()

  return blocks.map((block) => {
    const rows = block.split('\n')
    const firstRow = rows[0] ?? ''

    if (firstRow.trim().startsWith('```')) {
      const language = firstRow.trim().slice(3).trim()
      const code = rows.slice(1, -1).join('\n')
      return `
        <div class="my-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-slate-100 shadow-sm">
          <div class="flex items-center justify-between border-b border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            <span>${language || 'code'}</span>
          </div>
          <pre class="overflow-x-auto px-4 py-3 text-[13px] leading-6"><code class="font-mono">${escapeHtml(code)}</code></pre>
        </div>
      `
    }

    if (rows.length > 1 && rows.some(isSeparatorRow) && firstRow.includes('|')) {
      return parseTable(rows)
    }

    const listMatch = rows.every(row => /^(?:\d+\.|[-*])\s+/.test(row.trim()))
    if (listMatch) {
      const ordered = /^\d+\./.test(firstRow.trim())
      const tag = ordered ? 'ol' : 'ul'
      const items = rows.map((row) => {
        const content = row.trim().replace(/^(?:\d+\.|[-*])\s+/, '')
        return `<li class="ml-5 list-inside py-0.5">${inlineMarkdown(content)}</li>`
      }).join('')
      return `<${tag} class="my-2 space-y-1 text-slate-600">${items}</${tag}>`
    }

    if (rows.some(row => row.trim().startsWith('>'))) {
      const content = rows.map(row => row.replace(/^\s*>\s?/, '')).join('<br/>')
      return `
        <blockquote class="my-3 border-l-4 border-indigo-300 bg-indigo-50/60 px-4 py-3 text-slate-600">
          ${inlineMarkdown(content)}
        </blockquote>
      `
    }

    return `<p class="my-2 whitespace-pre-wrap leading-7 text-slate-600">${inlineMarkdown(block)}</p>`
  }).join('')
}

const rendered = computed(() => {
  if (isUser.value) return ''
  return parseBlocks(props.text)
})
</script>

<template>
  <div class="flex w-full" :class="isUser ? 'justify-end' : 'justify-start'">
    <div class="flex max-w-[min(92%,46rem)] gap-3" :class="isUser ? 'flex-row-reverse' : 'flex-row'">
      <div
        v-if="!isUser"
        class="mt-1.5 flex size-9 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-indigo-600 shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
      >
        <UIcon name="i-lucide-sparkles" class="size-4" />
      </div>

      <div
        class="rounded-[26px] px-4 py-3.5 text-[14px] leading-7 shadow-sm"
        :class="isUser
          ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-[0_14px_30px_rgba(79,70,229,0.25)]'
          : 'border border-slate-200 bg-white text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.06)]'"
      >
        <div v-if="isUser" class="whitespace-pre-wrap break-words">
          {{ text }}
        </div>
        <div
          v-else
          class="ai-message prose-slate max-w-none"
          v-html="rendered"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-message :deep(p:first-child) {
  margin-top: 0;
}

.ai-message :deep(p:last-child) {
  margin-bottom: 0;
}

.ai-message :deep(ul),
.ai-message :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1rem;
}

.ai-message :deep(li) {
  margin: 0.2rem 0;
}

.ai-message :deep(code) {
  white-space: pre-wrap;
}

.ai-message :deep(table) {
  width: 100%;
}

.ai-message :deep(th),
.ai-message :deep(td) {
  vertical-align: top;
}
</style>
