<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
const { get, put } = useApi()
const user = ref<any>(null)
const isLoading = ref(true)
const isSaving = ref(false)
const saved = ref(false)

const form = ref({ name: '', email: '', bio: '', phone: '', location: '', language: 'en', timezone: 'UTC', avatar: '' })

async function load() {
  isLoading.value = true
  const r = await get<any>('/auth/me')
  if (r.success && r.data) {
    user.value = r.data
    Object.assign(form.value, { name: r.data.name||'', email: r.data.email||'', bio: r.data.bio||'', phone: r.data.phone||'', location: r.data.location||'', language: r.data.language||'en', timezone: r.data.timezone||'UTC', avatar: r.data.avatar||'' })
  }
  isLoading.value = false
}

async function save() {
  isSaving.value = true
  await put('/auth/profile', form.value)
  isSaving.value = false
  saved.value = true
  setTimeout(() => saved.value = false, 2000)
}

onMounted(load)
</script>

<template>
  <section class="max-w-[900px] mx-auto pb-10">
    <div class="mb-6">
      <h1 class="text-[24px] font-bold" style="color:var(--color-text)">Profile Settings</h1>
      <p class="text-[13px] mt-0.5" style="color:var(--color-text-muted)">Manage your account information and preferences.</p>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" style="color:var(--color-primary)" />
    </div>

    <div v-else class="flex flex-col gap-5">
      <!-- Avatar section -->
      <div class="p-6 flex items-center gap-5" style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
        <UAvatar :src="form.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(form.name)}&background=random`" size="xl" class="rounded-full size-[72px]" />
        <div>
          <p class="text-[16px] font-bold" style="color:var(--color-text)">{{ form.name }}</p>
          <p class="text-[13px]" style="color:var(--color-text-muted)">{{ form.email }}</p>
          <button class="mt-2 text-[12px] font-bold px-3 py-1 transition" style="border-radius:7px;background:color-mix(in srgb,var(--color-primary) 10%,transparent);color:var(--color-primary)">Change Avatar</button>
        </div>
      </div>

      <!-- Personal info -->
      <div class="p-6" style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
        <h2 class="text-[15px] font-bold mb-5" style="color:var(--color-text)">Personal Information</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div v-for="f in [{l:'Full Name',k:'name',t:'text',ph:'Your full name'},{l:'Email',k:'email',t:'email',ph:'your@email.com'},{l:'Phone',k:'phone',t:'tel',ph:'+1 234 567 8900'},{l:'Location',k:'location',t:'text',ph:'City, Country'}]" :key="f.k">
            <label class="block text-[12px] font-bold mb-1.5" style="color:var(--color-text-soft)">{{ f.l }}</label>
            <input v-model="(form as any)[f.k]" :type="f.t" :placeholder="f.ph" class="w-full h-[40px] px-3 text-[13px] focus:outline-none" style="border-radius:8px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text)" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-[12px] font-bold mb-1.5" style="color:var(--color-text-soft)">Bio</label>
            <textarea v-model="form.bio" rows="3" placeholder="Tell us about yourself..." class="w-full px-3 py-2 text-[13px] focus:outline-none resize-none" style="border-radius:8px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text)"></textarea>
          </div>
        </div>
      </div>

      <!-- Preferences -->
      <div class="p-6" style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
        <h2 class="text-[15px] font-bold mb-5" style="color:var(--color-text)">Preferences</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[12px] font-bold mb-1.5" style="color:var(--color-text-soft)">Language</label>
            <select v-model="form.language" class="w-full h-[40px] px-3 text-[13px] focus:outline-none" style="border-radius:8px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text)">
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
          </div>
          <div>
            <label class="block text-[12px] font-bold mb-1.5" style="color:var(--color-text-soft)">Timezone</label>
            <select v-model="form.timezone" class="w-full h-[40px] px-3 text-[13px] focus:outline-none" style="border-radius:8px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text)">
              <option value="UTC">UTC</option>
              <option value="Africa/Algiers">Africa/Algiers (GMT+1)</option>
              <option value="Europe/Paris">Europe/Paris (GMT+2)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Save -->
      <div class="flex justify-end">
        <button @click="save" :disabled="isSaving" class="flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold text-white transition" style="border-radius:10px;background:var(--color-primary)">
          <UIcon v-if="isSaving" name="i-lucide-loader-2" class="size-4 animate-spin" />
          <UIcon v-else-if="saved" name="i-lucide-check" class="size-4" />
          <UIcon v-else name="i-lucide-save" class="size-4" />
          {{ saved ? 'Saved!' : isSaving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>
  </section>
</template>