<script setup lang="ts">
/**
 * AppAvatar — Centralized avatar component for the entire application.
 *
 * Rendering logic (priority order):
 *   1. If `src` is a non-empty string → render <img> (Google photoURL, uploaded file URL, any URL)
 *   2. If `src` is empty/null → generate a premium initials badge from `name`
 *   3. If both are absent → render a generic user icon placeholder
 *
 * This is the single source of truth for avatar rendering.
 * All UAvatar usages across the app are replaced by this component.
 * No external services (e.g. ui-avatars.com) are ever called.
 */

interface Props {
  src?: string | null
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const props = withDefaults(defineProps<Props>(), {
  src: null,
  name: null,
  size: 'md'
})

/** Extract initials: first letter of first name + first letter of last name */
const initials = computed(() => {
  const n = (props.name || '').trim()
  if (!n) return '?'
  const parts = n.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
})

/** Whether a real image src is available */
const hasSrc = computed(() => Boolean(props.src && props.src.trim()))

/** Map size prop to pixel dimension */
const sizeMap: Record<string, string> = {
  xs: '24px',
  sm: '32px',
  md: '40px',
  lg: '56px',
  xl: '80px',
  '2xl': '112px'
}

/** Map size prop to font-size for initials */
const fontSizeMap: Record<string, string> = {
  xs: '10px',
  sm: '13px',
  md: '16px',
  lg: '22px',
  xl: '30px',
  '2xl': '42px'
}

const dimension = computed(() => sizeMap[props.size] ?? '40px')
const fontSize = computed(() => fontSizeMap[props.size] ?? '16px')

const imgError = ref(false)

function onImgError() {
  imgError.value = true
}

/** Show initials if no src OR if image failed to load */
const showInitials = computed(() => !hasSrc.value || imgError.value)

watch(() => props.src, () => {
  imgError.value = false
})
</script>

<template>
  <span
    class="app-avatar"
    :style="{ width: dimension, height: dimension, flexShrink: '0' }"
    aria-hidden="true"
  >
    <img
      v-if="hasSrc && !imgError"
      :key="props.src!"
      :src="props.src!"
      :alt="props.name || 'Avatar'"
      class="app-avatar__img"
      @error="onImgError"
    >

    <!-- Initials badge — shown when no src or image fails -->
    <span
      v-else
      class="app-avatar__initials"
      :style="{ fontSize }"
      aria-label="User initials"
    >
      {{ initials }}
    </span>
  </span>
</template>

<style scoped>
.app-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  /* Subtle ring using design system color */
  flex-shrink: 0;
  position: relative;
}

.app-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}

.app-avatar__initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  /* Planify AI primary purple gradient — matches design system */
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: #ffffff;
  font-weight: 700;
  font-family: inherit;
  letter-spacing: 0.03em;
  line-height: 1;
  user-select: none;
}
</style>
