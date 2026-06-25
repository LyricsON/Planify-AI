<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { ProfilePayload } from '~/types/profile'

const emit = defineEmits<{
  close: []
  saved: []
}>()

const profileStore = useProfileStore()
const { user, profile, loading } = storeToRefs(profileStore)

const saving = ref(false)
const savingAvatar = ref(false)
const feedback = ref<{ tone: 'success' | 'warning'; text: string } | null>(null)
const avatarInput = ref<HTMLInputElement | null>(null)

const form = reactive<ProfilePayload & { avatar: string; avatarPath: string }>({
  avatar: '',
  avatarPath: '',
  name: '',
  phone: '',
  location: '',
  bio: '',
  university: '',
  fieldOfStudy: '',
  academicYear: '',
  semester: '',
  studentId: '',
  socialLinks: {
    website: '',
    linkedin: '',
    github: ''
  }
})

function getRelativePath(url: string) {
  if (!url) return ''
  if (url.includes('/uploads/')) {
    return '/uploads/' + url.split('/uploads/')[1]
  }
  return url
}

function syncForm() {
  if (!user.value || !profile.value) return
  form.avatar = user.value.avatar || ''
  form.avatarPath = getRelativePath(user.value.avatar || '')
  form.name = user.value.name || ''
  form.phone = user.value.phone || ''
  form.location = user.value.location || ''
  form.bio = profile.value.bio || ''
  form.university = profile.value.academic.university || ''
  form.fieldOfStudy = profile.value.academic.fieldOfStudy || ''
  form.academicYear = profile.value.academic.academicYear || ''
  form.semester = profile.value.academic.semester || ''
  form.studentId = profile.value.academic.studentId || ''
  form.socialLinks = {
    website: profile.value.socialLinks?.website || '',
    linkedin: profile.value.socialLinks?.linkedin || '',
    github: profile.value.socialLinks?.github || ''
  }
}

watch([user, profile], syncForm, { immediate: true })

function openAvatarPicker() {
  avatarInput.value?.click()
}

const localPreviewUrl = ref('')

const displayAvatar = computed(() => {
  return localPreviewUrl.value || form.avatar || user.value?.avatar || ''
})

function cleanupPreview() {
  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value)
    localPreviewUrl.value = ''
  }
}

onBeforeUnmount(() => {
  cleanupPreview()
})

function removeAvatar() {
  cleanupPreview()
  form.avatar = ''
  form.avatarPath = ''
  if (profileStore.user) {
    profileStore.user.avatar = undefined
  }
}

async function onAvatarSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Cleanup old object URL if any
  cleanupPreview()

  // Show immediate local preview
  localPreviewUrl.value = URL.createObjectURL(file)

  savingAvatar.value = true
  // Upload to backend and update global store immediately (pass true)
  const res = await profileStore.updateAvatar(file, true)
  savingAvatar.value = false

  if (res.success) {
    form.avatar = res.avatar || ''
    form.avatarPath = res.rawAvatar || ''
    feedback.value = null
  } else {
    // Fallback on error
    cleanupPreview()
    form.avatar = user.value?.avatar || ''
    feedback.value = {
      tone: 'warning',
      text: res.error || 'Unable to upload photo.'
    }
  }
}

async function save() {
  if (!form.name.trim()) {
    feedback.value = { tone: 'warning', text: 'Full name is required.' }
    return
  }
  saving.value = true
  feedback.value = null

  const ok = await profileStore.updateProfile({
    ...form,
    avatar: form.avatarPath
  })
  saving.value = false

  if (ok) {
    feedback.value = { tone: 'success', text: 'Profile updated successfully.' }
    // Brief pause so the user sees the success message, then close
    setTimeout(() => {
      emit('saved')
    }, 700)
  } else {
    feedback.value = {
      tone: 'warning',
      text: profileStore.error || 'Unable to save profile changes.'
    }
  }
}
</script>

<template>
  <UModal
    :open="true"
    :ui="{
      wrapper: 'z-[120]',
      width: 'sm:max-w-2xl',
      rounded: 'rounded-[20px]',
      shadow: 'shadow-2xl',
      background: 'bg-white dark:bg-slate-900',
      ring: 'ring-1 ring-[var(--color-border)]',
      overlay: { background: 'bg-slate-900/40 backdrop-blur-[2px]' }
    }"
    @update:open="(val) => { if (!val) emit('close') }"
  >
    <template #content>
      <div class="p-5 sm:p-6 flex flex-col max-h-[calc(100vh-3rem)] sm:max-h-[85vh]">
        <!-- Modal Header -->
        <div class="flex-shrink-0 mb-5 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="icon-box icon-box-primary">
              <UIcon name="i-lucide-user-round-pen" class="size-4" />
            </div>
            <h3 class="text-xl font-semibold text-[var(--color-text)]">
              Edit Profile
            </h3>
          </div>
          <button
            type="button"
            class="rounded-lg p-1.5 text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-text)]"
            @click="emit('close')"
          >
            <UIcon name="i-lucide-x" class="size-4" />
          </button>
        </div>

        <!-- Feedback Banner -->
        <div
          v-if="feedback"
          class="flex-shrink-0 mb-4 rounded-xl px-4 py-3 text-sm font-medium"
          :class="feedback.tone === 'success'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'"
        >
          {{ feedback.text }}
        </div>

        <!-- Scrollable Form Content -->
        <div class="flex-1 overflow-y-auto pr-1 space-y-6">
          <!-- Avatar Section -->
          <div class="flex items-center gap-5">
            <div class="relative shrink-0">
              <AppAvatar
                :src="displayAvatar"
                :name="form.name"
                size="xl"
                class="ring-4 ring-[var(--color-primary-soft)]"
              />
              <button
                v-if="displayAvatar"
                type="button"
                class="absolute -top-1.5 -right-1.5 flex size-7 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-soft)] shadow-sm transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                title="Remove photo"
                @click="removeAvatar"
              >
                <UIcon name="i-lucide-x" class="size-3.5" />
              </button>
              <button
                type="button"
                class="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm transition hover:bg-[var(--color-primary-soft)]"
                :disabled="savingAvatar"
                @click="openAvatarPicker"
              >
                <UIcon
                  v-if="!savingAvatar"
                  name="i-lucide-camera"
                  class="size-4"
                />
                <UIcon
                  v-else
                  name="i-lucide-loader-2"
                  class="size-4 animate-spin"
                />
              </button>
            </div>
            <input
              ref="avatarInput"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              class="hidden"
              @change="onAvatarSelected"
            >
            <div>
              <p class="text-sm font-semibold text-[var(--color-text)]">
                Profile Photo
              </p>
              <p class="mt-1 text-xs text-muted">
                JPG or PNG, up to 50MB. Replaces any previous photo.
              </p>
            </div>
          </div>

          <!-- Personal Info -->
          <div>
            <p class="mb-3 text-sm font-semibold text-[var(--color-text-soft)] uppercase tracking-wide">
              Personal Information
            </p>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="field-label">Full Name *</label>
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="Your full name"
                  class="field-control"
                >
              </div>

              <div>
                <label class="field-label">Phone Number</label>
                <input
                  v-model="form.phone"
                  type="text"
                  placeholder="+1 234 567 890"
                  class="field-control"
                >
              </div>

              <div>
                <label class="field-label">Location</label>
                <input
                  v-model="form.location"
                  type="text"
                  placeholder="City, Country"
                  class="field-control"
                >
              </div>

              <div class="sm:col-span-2">
                <label class="field-label">Bio</label>
                <textarea
                  v-model="form.bio"
                  placeholder="Tell us about yourself..."
                  rows="3"
                  class="field-control resize-none py-3"
                />
              </div>
            </div>
          </div>

          <!-- Academic Info -->
          <div>
            <p class="mb-3 text-sm font-semibold text-[var(--color-text-soft)] uppercase tracking-wide">
              Academic Information
            </p>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="field-label">University</label>
                <input
                  v-model="form.university"
                  type="text"
                  placeholder="University or institution name"
                  class="field-control"
                >
              </div>

              <div class="sm:col-span-2">
                <label class="field-label">Field of Study / Program</label>
                <input
                  v-model="form.fieldOfStudy"
                  type="text"
                  placeholder="e.g. Computer Science"
                  class="field-control"
                >
              </div>

              <div>
                <label class="field-label">Academic Year</label>
                <input
                  v-model="form.academicYear"
                  type="text"
                  placeholder="e.g. 2024–2025"
                  class="field-control"
                >
              </div>

              <div>
                <label class="field-label">Semester</label>
                <input
                  v-model="form.semester"
                  type="text"
                  placeholder="e.g. Semester 2"
                  class="field-control"
                >
              </div>

              <div>
                <label class="field-label">Student ID (Optional)</label>
                <input
                  v-model="form.studentId"
                  type="text"
                  placeholder="Student ID"
                  class="field-control"
                >
              </div>
            </div>
          </div>

          <!-- Social Links -->
          <div>
            <p class="mb-3 text-sm font-semibold text-[var(--color-text-soft)] uppercase tracking-wide">
              Social Links (Optional)
            </p>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="field-label">Website</label>
                <div class="icon-input-wrapper">
                  <span class="icon-input-icon">
                    <UIcon name="i-lucide-globe" class="size-[18px]" />
                  </span>
                  <input
                    v-model="form.socialLinks!.website"
                    type="url"
                    placeholder="https://yourwebsite.com"
                    class="field-control field-control--icon"
                  >
                </div>
              </div>

              <div>
                <label class="field-label">LinkedIn</label>
                <div class="icon-input-wrapper">
                  <span class="icon-input-icon">
                    <UIcon name="i-lucide-linkedin" class="size-[18px]" />
                  </span>
                  <input
                    v-model="form.socialLinks!.linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    class="field-control field-control--icon"
                  >
                </div>
              </div>

              <div>
                <label class="field-label">GitHub</label>
                <div class="icon-input-wrapper">
                  <span class="icon-input-icon">
                    <UIcon name="i-lucide-github" class="size-[18px]" />
                  </span>
                  <input
                    v-model="form.socialLinks!.github"
                    type="url"
                    placeholder="https://github.com/..."
                    class="field-control field-control--icon"
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sticky Footer Actions -->
        <div class="flex-shrink-0 mt-5 flex items-center justify-end gap-3 border-t border-[var(--color-border)] pt-4">
          <button
            type="button"
            class="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-bg-soft)]"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="saving || loading"
            @click="save"
          >
            <span v-if="saving" class="flex items-center gap-2">
              <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
              Saving...
            </span>
            <span v-else>Save Changes</span>
          </button>
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.field-label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-soft);
}

.field-control {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-input-bg);
  color: var(--color-text);
  min-height: 44px;
  padding: 0 1rem;
  font-size: 0.875rem;
  transition: border-color var(--transition-fast) var(--ease-out),
    box-shadow var(--transition-fast) var(--ease-out);
}

.field-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-soft);
}

/**
 * Icon-prefixed input: the wrapper provides the border/background;
 * the input inside is borderless and fills remaining width.
 * This avoids the absolute-position + padding specificity conflict.
 */
.icon-input-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-input-bg);
  transition: border-color var(--transition-fast) var(--ease-out),
    box-shadow var(--transition-fast) var(--ease-out);
  overflow: hidden;
}

.icon-input-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-soft);
}

.icon-input-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  flex-shrink: 0;
  color: var(--color-text-muted);
}

.field-control--icon {
  /* When used inside icon-input-wrapper: no border, no background, no padding-left */
  flex: 1;
  min-width: 0;
  border: none !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  padding-left: 0;
  padding-right: 1rem;
}

.field-control--icon:focus {
  outline: none;
  border: none;
  box-shadow: none;
}
</style>
