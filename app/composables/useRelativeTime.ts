import { ref } from 'vue'

const tick = ref(0)
let intervalId: any = null

function startGlobalTicker() {
  if (import.meta.client && !intervalId) {
    intervalId = setInterval(() => {
      tick.value++
    }, 60000)
  }
}

export function useRelativeTime() {
  startGlobalTicker()

  function getRelativeTime(d?: string | Date | number): string {
    // Reference tick.value to establish a reactive dependency
    const _ = tick.value

    if (!d) return 'Just now'
    const date = new Date(d)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()

    // Handle future dates or extremely small differences
    if (diffMs < 5000) return 'Just now'

    const diffSecs = Math.floor(diffMs / 1000)
    if (diffSecs < 60) return 'Just now'

    const diffMins = Math.floor(diffSecs / 60)
    if (diffMins < 60) {
      return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`
    }

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
    }

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`

    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return {
    getRelativeTime
  }
}
