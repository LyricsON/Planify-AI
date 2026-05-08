<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
const { get, put } = useApi()
const settings = ref({ emailNotifications: true, pushNotifications: true, examReminders: true, taskDeadlines: true, studyReminders: false, weeklyReport: true, reminderAdvance: '1d', digestFrequency: 'daily' })
const isSaving = ref(false)
const saved = ref(false)

const toggles = [
  { k:'emailNotifications', l:'Email Notifications', d:'Receive updates via email' },
  { k:'pushNotifications', l:'Push Notifications', d:'Browser push notifications' },
  { k:'examReminders', l:'Exam Reminders', d:'Alerts before upcoming exams' },
  { k:'taskDeadlines', l:'Task Deadline Alerts', d:'Reminders for due tasks' },
  { k:'studyReminders', l:'Study Session Reminders', d:'Daily study prompts' },
  { k:'weeklyReport', l:'Weekly Progress Report', d:'Summary of your weekly activity' }
]

async function load() {
  const r = await get<any>('/auth/notification-settings')
  if (r.success && r.data) Object.assign(settings.value, r.data)
}

async function save() {
  isSaving.value = true
  await put('/auth/notification-settings', settings.value)
  isSaving.value = false
  saved.value = true
  setTimeout(() => saved.value = false, 2000)
}

onMounted(load)
</script>

<template>
  <section class="max-w-[800px] mx-auto pb-10">
    <div class="mb-6">
      <h1 class="text-[24px] font-bold" style="color:var(--color-text)">Notification Settings</h1>
      <p class="text-[13px] mt-0.5" style="color:var(--color-text-muted)">Control how and when Planify AI notifies you.</p>
    </div>

    <div class="flex flex-col gap-5">
      <div class="p-6" style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
        <h2 class="text-[15px] font-bold mb-5" style="color:var(--color-text)">Notification Channels</h2>
        <div class="divide-y" style="--divide-color:var(--color-border)">
          <div v-for="t in toggles" :key="t.k" class="flex items-center justify-between py-4">
            <div>
              <p class="text-[13px] font-bold" style="color:var(--color-text)">{{ t.l }}</p>
              <p class="text-[12px] mt-0.5" style="color:var(--color-text-muted)">{{ t.d }}</p>
            </div>
            <button @click="(settings as any)[t.k] = !(settings as any)[t.k]" class="relative inline-flex h-[24px] w-[44px] flex-shrink-0 rounded-full transition-colors"
              :style="(settings as any)[t.k]?'background:var(--color-primary)':'background:var(--color-border)'">
              <span class="inline-block size-[20px] rounded-full bg-white shadow transition-transform mt-[2px]" :class="(settings as any)[t.k]?'translate-x-[22px]':'translate-x-[2px]'"></span>
            </button>
          </div>
        </div>
      </div>

      <div class="p-6" style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
        <h2 class="text-[15px] font-bold mb-5" style="color:var(--color-text)">Reminder Settings</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[12px] font-bold mb-1.5" style="color:var(--color-text-soft)">Remind me before exams</label>
            <select v-model="settings.reminderAdvance" class="w-full h-[40px] px-3 text-[13px] focus:outline-none" style="border-radius:8px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text)">
              <option value="1h">1 hour before</option>
              <option value="3h">3 hours before</option>
              <option value="1d">1 day before</option>
              <option value="2d">2 days before</option>
              <option value="1w">1 week before</option>
            </select>
          </div>
          <div>
            <label class="block text-[12px] font-bold mb-1.5" style="color:var(--color-text-soft)">Progress digest frequency</label>
            <select v-model="settings.digestFrequency" class="w-full h-[40px] px-3 text-[13px] focus:outline-none" style="border-radius:8px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text)">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <button @click="save" :disabled="isSaving" class="flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold text-white transition" style="border-radius:10px;background:var(--color-primary)">
          <UIcon :name="saved?'i-lucide-check':isSaving?'i-lucide-loader-2':'i-lucide-save'" class="size-4" :class="isSaving?'animate-spin':''" />
          {{ saved?'Saved!':isSaving?'Saving...':'Save Settings' }}
        </button>
      </div>
    </div>
  </section>
</template>