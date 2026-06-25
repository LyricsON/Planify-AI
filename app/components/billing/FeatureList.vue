<script setup lang="ts">
interface Props {
  features: string[]
  variant?: 'primary' | 'white'
}

withDefaults(defineProps<Props>(), {
  variant: 'primary'
})
</script>

<template>
  <ul 
    class="space-y-4 text-sm flex-1"
    :class="variant === 'white' ? 'text-white/95' : 'text-[var(--color-text-soft)]'"
  >
    <li
      v-for="feature in features"
      :key="feature"
      class="flex items-start gap-3"
    >
      <UIcon
        name="i-lucide-check"
        class="mt-0.5 size-4 shrink-0 font-bold"
        :class="variant === 'white' ? 'text-white' : 'text-[var(--color-primary)]'"
      />
      <span>{{ feature }}</span>
    </li>
  </ul>
</template>
