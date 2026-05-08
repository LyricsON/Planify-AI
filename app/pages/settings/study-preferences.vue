<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
const { get, put } = useApi()
const prefs = ref({ studyGoalHours: 6, preferredTimes: [] as string[], subjects: [] as string[], breakDuration: 10, sessionDuration: 90, studyStyle: 'mixed', reminderEnabled: true })
const isLoading = ref(true)
const isSaving = ref(false)
const saved = ref(false)

const timeSlots = ['Morning (6-9AM)','Late Morning (9-12PM)','Afternoon (12-3PM)','Late Afternoon (3-6PM)','Evening (6-9PM)','Night (9PM+)']
const styles = [{ v:'focused', l:'Focused Sessions', d:'Long uninterrupted blocks' },{ v:'pomodoro', l:'Pomodoro', d:'25min work, 5min break' },{ v:'mixed', l:'Mixed', d:'Flexible approach' }]

function toggleTime(t: string) {
  const i = prefs.value.preferredTimes.indexOf(t)
  if (i>=0) prefs.value.preferredTimes.splice(i,1)
  else prefs.value.preferredTimes.push(t)
}

async function load() {
  isLoading.value = true
  const r = await get<any>('/auth/study-preferences')
  if (r.success && r.data) Object.assign(prefs.value, r.data)
  isLoading.value = false
}

async function save() {
  isSaving.value = true
  await put('/auth/study-preferences', prefs.value)
  isSaving.value = false
  saved.value = true
  setTimeout(() => saved.value = false, 2000)
}

onMounted(load)
</script>

<template>
  <section class="max-w-[800px] mx-auto pb-10">
    <div class="mb-6">
      <h1 class="text-[24px] font-bold" style="color:var(--color-text)">Study Preferences</h1>
      <p class="text-[13px] mt-0.5" style="color:var(--color-text-muted)">Configure how you like to study for better AI recommendations.</p>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" style="color:var(--color-primary)" />
    </div>

    <div v-else class="flex flex-col gap-5">
      <!-- Daily goal -->
      <div class="p-6" style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
        <h2 class="text-[15px] font-bold mb-5" style="color:var(--color-text)">Daily Study Goal</h2>
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <input v-model="prefs.studyGoalHours" type="range" min="1" max="12" step="0.5" class="w-full" />
            <div class="flex justify-between mt-1">
              <span class="text-[11px]" style="color:var(--color-text-muted)">1h</span>
              <span class="text-[11px]" style="color:var(--color-text-muted)">12h</span>
            </div>
          </div>
          <div class="flex-shrink-0 px-4 py-2 text-center" style="border-radius:10px;background:color-mix(in srgb,var(--color-primary) 10%,transparent)">
            <p class="text-[22px] font-bold" style="color:var(--color-primary)">{{ prefs.studyGoalHours }}</p>
            <p class="text-[11px] font-semibold" style="color:var(--color-primary)">hours/day</p>
          </div>
        </div>
      </div>

      <!-- Preferred times -->
      <div class="p-6" style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
        <h2 class="text-[15px] font-bold mb-4" style="color:var(--color-text)">Preferred Study Times</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button v-for="t in timeSlots" :key="t" @click="toggleTime(t)" class="px-3 py-2.5 text-[12px] font-bold text-left transition"
            :style="prefs.preferredTimes.includes(t)?'border-radius:8px;background:color-mix(in srgb,var(--color-primary) 15%,transparent);border:1.5px solid var(--color-primary);color:var(--color-primary)':'border-radius:8px;background:var(--color-surface);border:1px solid var(--color-border);color:var(--color-text)'">
            {{ t }}
          </button>
        </div>
      </div>

      <!-- Study style -->
      <div class="p-6" style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
        <h2 class="text-[15px] font-bold mb-4" style="color:var(--color-text)">Study Style</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button v-for="s in styles" :key="s.v" @click="prefs.studyStyle=s.v" class="p-4 text-left transition"
            :style="prefs.studyStyle===s.v?'border-radius:12px;background:color-mix(in srgb,var(--color-primary) 10%,transparent);border:1.5px solid var(--color-primary)':'border-radius:12px;background:var(--color-surface);border:1px solid var(--color-border)'">
            <p class="text-[13px] font-bold mb-1" :style="prefs.studyStyle===s.v?'color:var(--color-primary)':'color:var(--color-text)'">{{ s.l }}</p>
            <p class="text-[11px]" style="color:var(--color-text-muted)">{{ s.d }}</p>
          </button>
        </div>
      </div>

      <!-- Session settings -->
      <div class="p-6" style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
        <h2 class="text-[15px] font-bold mb-5" style="color:var(--color-text)">Session Settings</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label class="block text-[12px] font-bold mb-1.5" style="color:var(--color-text-soft)">Session Duration (minutes)</label>
            <input v-model="prefs.sessionDuration" type="number" min="25" max="180" class="w-full h-[40px] px-3 text-[13px] focus:outline-none" style="border-radius:8px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text)" />
          </div>
          <div>
            <label class="block text-[12px] font-bold mb-1.5" style="color:var(--color-text-soft)">Break Duration (minutes)</label>
            <input v-model="prefs.breakDuration" type="number" min="5" max="30" class="w-full h-[40px] px-3 text-[13px] focus:outline-none" style="border-radius:8px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text)" />
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <button @click="save" :disabled="isSaving" class="flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold text-white transition" style="border-radius:10px;background:var(--color-primary)">
          <UIcon :name="saved?'i-lucide-check':isSaving?'i-lucide-loader-2':'i-lucide-save'" class="size-4" :class="isSaving?'animate-spin':''" />
          {{ saved?'Saved!':isSaving?'Saving...':'Save Preferences' }}
        </button>
      </div>
    </div>
  </section>
</template>