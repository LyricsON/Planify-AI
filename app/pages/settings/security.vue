<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
const { put } = useApi()
const form = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })
const twoFA = ref(false)
const sessions = ref([
  { device: 'Chrome on Windows', location: 'Algiers, Algeria', current: true, lastSeen: 'Now' },
  { device: 'Firefox on MacOS', location: 'Paris, France', current: false, lastSeen: '2 days ago' }
])
const isSaving = ref(false)
const error = ref('')
const success = ref('')

async function changePassword() {
  error.value = ''
  if (!form.value.currentPassword || !form.value.newPassword) { error.value = 'Please fill all fields.'; return }
  if (form.value.newPassword !== form.value.confirmPassword) { error.value = 'Passwords do not match.'; return }
  if (form.value.newPassword.length < 8) { error.value = 'Password must be at least 8 characters.'; return }
  isSaving.value = true
  const r = await put('/auth/change-password', { currentPassword: form.value.currentPassword, newPassword: form.value.newPassword })
  isSaving.value = false
  if (r.success) { success.value = 'Password changed successfully!'; form.value = { currentPassword:'', newPassword:'', confirmPassword:'' }; setTimeout(()=>success.value='',3000) }
  else error.value = r.message || 'Failed to change password.'
}
</script>

<template>
  <section class="max-w-[800px] mx-auto pb-10">
    <div class="mb-6">
      <h1 class="text-[24px] font-bold" style="color:var(--color-text)">Security Settings</h1>
      <p class="text-[13px] mt-0.5" style="color:var(--color-text-muted)">Manage your password, two-factor authentication and active sessions.</p>
    </div>

    <div class="flex flex-col gap-5">
      <!-- Change Password -->
      <div class="p-6" style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
        <h2 class="text-[15px] font-bold mb-5" style="color:var(--color-text)">Change Password</h2>
        <div v-if="error" class="mb-4 p-3 text-[13px] font-medium" style="border-radius:8px;background:#fef2f2;color:#ef4444;border:1px solid #fecaca">{{ error }}</div>
        <div v-if="success" class="mb-4 p-3 text-[13px] font-medium" style="border-radius:8px;background:#f0fdf4;color:#22c55e;border:1px solid #bbf7d0">{{ success }}</div>
        <div class="flex flex-col gap-3">
          <div v-for="f in [{l:'Current Password',k:'currentPassword'},{l:'New Password',k:'newPassword'},{l:'Confirm New Password',k:'confirmPassword'}]" :key="f.k">
            <label class="block text-[12px] font-bold mb-1.5" style="color:var(--color-text-soft)">{{ f.l }}</label>
            <input v-model="(form as any)[f.k]" type="password" class="w-full h-[40px] px-3 text-[13px] focus:outline-none" style="border-radius:8px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text)" />
          </div>
        </div>
        <button @click="changePassword" :disabled="isSaving" class="mt-4 flex items-center gap-2 px-5 py-2 text-[13px] font-bold text-white transition" style="border-radius:8px;background:var(--color-primary)">
          <UIcon :name="isSaving?'i-lucide-loader-2':'i-lucide-lock'" class="size-4" :class="isSaving?'animate-spin':''" />
          {{ isSaving ? 'Changing...' : 'Change Password' }}
        </button>
      </div>

      <!-- 2FA -->
      <div class="p-6" style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-[15px] font-bold" style="color:var(--color-text)">Two-Factor Authentication</h2>
            <p class="text-[13px] mt-1" style="color:var(--color-text-muted)">Add an extra layer of security to your account.</p>
          </div>
          <button @click="twoFA=!twoFA" class="relative inline-flex h-[24px] w-[44px] flex-shrink-0 rounded-full transition-colors" :style="twoFA?'background:var(--color-primary)':'background:var(--color-border)'">
            <span class="inline-block size-[20px] rounded-full bg-white shadow transition-transform mt-[2px]" :class="twoFA?'translate-x-[22px]':'translate-x-[2px]'"></span>
          </button>
        </div>
        <div v-if="twoFA" class="mt-4 p-4" style="border-radius:10px;background:color-mix(in srgb,var(--color-success) 10%,transparent);border:1px solid var(--color-success)">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-shield-check" class="size-4" style="color:var(--color-success)" />
            <p class="text-[13px] font-bold" style="color:var(--color-success)">2FA is enabled</p>
          </div>
        </div>
      </div>

      <!-- Active Sessions -->
      <div class="p-6" style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
        <h2 class="text-[15px] font-bold mb-4" style="color:var(--color-text)">Active Sessions</h2>
        <div class="space-y-3">
          <div v-for="s in sessions" :key="s.device" class="flex items-center justify-between p-4" style="border-radius:10px;border:1px solid var(--color-border)">
            <div class="flex items-center gap-3">
              <div class="flex size-9 items-center justify-center" style="border-radius:9px;background:color-mix(in srgb,var(--color-primary) 10%,transparent);color:var(--color-primary)">
                <UIcon name="i-lucide-monitor" class="size-4" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <p class="text-[13px] font-bold" style="color:var(--color-text)">{{ s.device }}</p>
                  <span v-if="s.current" class="text-[10px] font-bold px-1.5 py-0.5" style="border-radius:4px;background:#f0fdf4;color:#22c55e">Current</span>
                </div>
                <p class="text-[11px]" style="color:var(--color-text-muted)">{{ s.location }} • {{ s.lastSeen }}</p>
              </div>
            </div>
            <button v-if="!s.current" class="text-[12px] font-bold px-3 py-1 transition" style="border-radius:7px;background:#fef2f2;color:#ef4444">Revoke</button>
          </div>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="p-6" style="border-radius:16px;background:var(--color-surface);border:1.5px solid #fecaca">
        <h2 class="text-[15px] font-bold mb-2" style="color:#ef4444">Danger Zone</h2>
        <p class="text-[13px] mb-4" style="color:var(--color-text-muted)">Permanently delete your account and all associated data. This action cannot be undone.</p>
        <button class="flex items-center gap-2 px-4 py-2 text-[13px] font-bold transition" style="border-radius:8px;background:#fef2f2;color:#ef4444;border:1px solid #fecaca">
          <UIcon name="i-lucide-trash-2" class="size-4" /> Delete Account
        </button>
      </div>
    </div>
  </section>
</template>