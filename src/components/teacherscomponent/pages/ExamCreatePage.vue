<template>
  <div class="space-y-6">

    <!-- Page header with breadcrumb -->
    <div>
      <nav class="flex items-center gap-1.5 text-xs text-slate-500">
        <RouterLink to="/teachers/exams" class="transition hover:text-slate-900">My Exams</RouterLink>
        <span class="text-slate-300">/</span>
        <span class="font-medium text-slate-700">{{ isEditing ? 'Edit Exam' : 'Create Exam' }}</span>
      </nav>
      <div class="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">Teacher Portal</p>
          <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {{ isEditing ? 'Edit Exam' : 'Create New Exam' }}
          </h1>
          <p class="mt-1 text-sm text-slate-500">
            {{ isEditing ? 'Update the details of this exam.' : 'Set up a new exam for your class.' }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <RouterLink
            to="/teachers/exams"
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </RouterLink>
          <button
            type="button"
            class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            :disabled="saving"
            @click="saveDraft"
          >
            Save Draft
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0F2940] disabled:opacity-60"
            :disabled="saving"
            @click="save"
          >
            <LoaderCircle v-if="saving" class="h-4 w-4 animate-spin" />
            {{ isEditing ? 'Save Changes' : 'Create Exam' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Error banner -->
    <div v-if="error" class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
      {{ error }}
    </div>

    <!-- Form sections -->
    <div class="grid gap-6 xl:grid-cols-3">

      <!-- Main form — 2/3 -->
      <div class="space-y-6 xl:col-span-2">

        <!-- Basic Details -->
        <section class="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 class="mb-5 text-base font-semibold text-slate-900">Basic Details</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700">
                Exam Title <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.title"
                type="text"
                class="sa-input mt-1.5"
                placeholder="e.g. SS2 Mid-Term Mathematics CBT"
              />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-slate-700">
                  Class Level <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="form.class_level_id"
                  class="sa-input mt-1.5"
                  @change="onClassLevelChange"
                >
                  <option value="">Select class level</option>
                  <option v-for="cl in store.classLevels" :key="cl.id" :value="cl.id">{{ cl.name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700">Class Arm</label>
                <select v-model="form.class_arm_id" class="sa-input mt-1.5">
                  <option value="">All arms (entire class level)</option>
                  <option v-for="arm in store.classArms" :key="arm.id" :value="arm.id">{{ arm.name }}</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700">
                Subject <span class="text-red-500">*</span>
              </label>
              <select v-model="form.subject_id" class="sa-input mt-1.5">
                <option value="">Select subject</option>
                <option v-for="s in store.subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
          </div>
        </section>

        <!-- Academic Period -->
        <section class="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 class="mb-5 text-base font-semibold text-slate-900">Academic Period</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="block text-sm font-medium text-slate-700">
                Academic Session <span class="text-red-500">*</span>
              </label>
              <select v-model="selectedSession" class="sa-input mt-1.5" @change="onSessionChange">
                <option value="">Select session</option>
                <option v-for="s in store.academicSessions" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700">
                Term <span class="text-red-500">*</span>
              </label>
              <select v-model="form.term_id" class="sa-input mt-1.5">
                <option value="">Select term</option>
                <option v-for="t in store.terms" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>
          </div>
        </section>

        <!-- Exam Settings -->
        <section class="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 class="mb-5 text-base font-semibold text-slate-900">Exam Settings</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="block text-sm font-medium text-slate-700">Exam Type</label>
              <div class="mt-1.5 flex gap-4">
                <label class="flex cursor-pointer items-center gap-2">
                  <input type="radio" v-model="form.type" value="exam" class="text-[#0B1F3A]" />
                  <span class="text-sm text-slate-700">Exam</span>
                </label>
                <label class="flex cursor-pointer items-center gap-2">
                  <input type="radio" v-model="form.type" value="test" class="text-[#0B1F3A]" />
                  <span class="text-sm text-slate-700">Test</span>
                </label>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700">
                Duration (minutes) <span class="text-red-500">*</span>
              </label>
              <input v-model.number="form.duration_minutes" type="number" min="1" class="sa-input mt-1.5" placeholder="60" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700">Total Marks</label>
              <input v-model.number="form.total_marks" type="number" min="0" class="sa-input mt-1.5" placeholder="100" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700">
                Pass Mark (%) <span class="text-red-500">*</span>
              </label>
              <input v-model.number="form.pass_mark" type="number" min="0" max="100" class="sa-input mt-1.5" placeholder="50" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700">Max Attempts</label>
              <input v-model.number="form.max_attempts" type="number" min="1" class="sa-input mt-1.5" placeholder="1" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700">Scheduled Start</label>
              <input v-model="form.scheduled_start" type="datetime-local" class="sa-input mt-1.5" />
              <p class="mt-1 text-xs text-slate-400">Your local timezone</p>
            </div>
          </div>

          <div class="mt-4">
            <label class="block text-sm font-medium text-slate-700">Instructions</label>
            <textarea
              v-model="form.instructions"
              rows="4"
              class="sa-input mt-1.5 resize-none"
              placeholder="Instructions shown to students before the exam starts…"
            />
          </div>
        </section>
      </div>

      <!-- Right sidebar — 1/3 -->
      <div class="space-y-6">

        <!-- Checklist -->
        <section class="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 class="mb-4 text-base font-semibold text-slate-900">Checklist</h2>
          <ul class="space-y-3">
            <li class="flex items-center gap-3 text-sm">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" :class="form.title ? 'bg-emerald-100' : 'bg-slate-100'">
                <Check v-if="form.title" class="h-3 w-3 text-emerald-600" />
                <span v-else class="h-2 w-2 rounded-full bg-slate-300" />
              </span>
              <span :class="form.title ? 'text-slate-900' : 'text-slate-400'">Exam title</span>
            </li>
            <li class="flex items-center gap-3 text-sm">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" :class="form.class_level_id ? 'bg-emerald-100' : 'bg-slate-100'">
                <Check v-if="form.class_level_id" class="h-3 w-3 text-emerald-600" />
                <span v-else class="h-2 w-2 rounded-full bg-slate-300" />
              </span>
              <span :class="form.class_level_id ? 'text-slate-900' : 'text-slate-400'">Class level selected</span>
            </li>
            <li class="flex items-center gap-3 text-sm">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" :class="form.subject_id ? 'bg-emerald-100' : 'bg-slate-100'">
                <Check v-if="form.subject_id" class="h-3 w-3 text-emerald-600" />
                <span v-else class="h-2 w-2 rounded-full bg-slate-300" />
              </span>
              <span :class="form.subject_id ? 'text-slate-900' : 'text-slate-400'">Subject selected</span>
            </li>
            <li class="flex items-center gap-3 text-sm">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" :class="form.term_id ? 'bg-emerald-100' : 'bg-slate-100'">
                <Check v-if="form.term_id" class="h-3 w-3 text-emerald-600" />
                <span v-else class="h-2 w-2 rounded-full bg-slate-300" />
              </span>
              <span :class="form.term_id ? 'text-slate-900' : 'text-slate-400'">Term selected</span>
            </li>
            <li class="flex items-center gap-3 text-sm">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" :class="form.duration_minutes > 0 ? 'bg-emerald-100' : 'bg-slate-100'">
                <Check v-if="form.duration_minutes > 0" class="h-3 w-3 text-emerald-600" />
                <span v-else class="h-2 w-2 rounded-full bg-slate-300" />
              </span>
              <span :class="form.duration_minutes > 0 ? 'text-slate-900' : 'text-slate-400'">Duration set</span>
            </li>
          </ul>
        </section>

        <!-- Info box -->
        <div class="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <h3 class="text-sm font-semibold text-blue-900">What happens next?</h3>
          <ul class="mt-3 space-y-2 text-xs text-blue-700">
            <li>1. Create your exam here</li>
            <li>2. Add questions from the Question Bank</li>
            <li>3. Submit for admin review</li>
            <li>4. Admin activates exam for students</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { AlertCircle, Check, LoaderCircle } from 'lucide-vue-next'
import { useTeacherExamsStore } from '../stores/exams'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { getAuthUser } from '../../../js/lib/auth'
import { toDatetimeLocalInputValue, toDatetimeLocalIsoWithOffset } from '../../../js/lib/helpers'

const router = useRouter()
const route = useRoute()
const store = useTeacherExamsStore()
const uiStore = useSchoolAdminUiStore()

const saving = ref(false)
const error = ref(null)
const selectedSession = ref('')

// If exam id is passed via query param, we're editing
const examId = computed(() => route.query.edit || null)
const isEditing = computed(() => !!examId.value)
const teacherClassLevel = computed(() => getAuthUser()?.teacher_profile?.class_level || null)

const form = reactive({
  title: '',
  subject_id: '',
  class_level_id: '',
  class_arm_id: null,
  term_id: '',
  type: 'exam',
  duration_minutes: 60,
  total_marks: null,
  pass_mark: 50,
  max_attempts: 1,
  scheduled_start: '',
  instructions: '',
})

onMounted(async () => {
  await store.loadFormMetadata()

  if (isEditing.value) {
    // Load existing exam data
    const existing = store.exams.find((e) => String(e.id) === String(examId.value))
    if (existing) {
      const sessionId = existing.term?.academic_session_id
        || existing.session_id
        || existing.academic_session_id
        || null
      if (sessionId) {
        selectedSession.value = sessionId
        await store.loadTerms(sessionId)
      }
      const clId = existing.class_level_id || existing.classLevelId || existing.classLevel?.id
      if (clId) await store.loadClassArms(clId)

      Object.assign(form, {
        title: existing.title || '',
        subject_id: existing.subject_id || existing.subject?.id || '',
        class_level_id: clId || '',
        class_arm_id: existing.class_arm_id || existing.classArmId || null,
        term_id: existing.term_id || existing.term?.id || '',
        type: existing.type || 'exam',
        duration_minutes: existing.duration_minutes || existing.duration || 60,
        total_marks: existing.total_marks ?? existing.totalMarks ?? null,
        pass_mark: existing.pass_mark ?? existing.passMark ?? 50,
        max_attempts: existing.max_attempts ?? existing.maxAttempts ?? 1,
        scheduled_start: toDatetimeLocalInputValue(existing.scheduled_start || existing.scheduledStart || ''),
        instructions: existing.instructions || '',
      })
    }
  } else if (teacherClassLevel.value?.id) {
    form.class_level_id = teacherClassLevel.value.id
    await Promise.all([
      store.loadClassArms(form.class_level_id),
      store.loadSubjectsForClassLevel(form.class_level_id),
    ])
  }
})

const onClassLevelChange = async () => {
  form.class_arm_id = null
  form.subject_id = ''
  if (form.class_level_id) {
    await Promise.all([
      store.loadClassArms(form.class_level_id),
      store.loadSubjectsForClassLevel(form.class_level_id),
    ])
  }
}

const onSessionChange = async () => {
  form.term_id = ''
  if (selectedSession.value) await store.loadTerms(selectedSession.value)
}

const validateForm = () => {
  if (!form.title?.trim()) { error.value = 'Exam title is required.'; return false }
  if (!form.class_level_id) { error.value = 'Class level is required.'; return false }
  if (!form.subject_id) { error.value = 'Subject is required.'; return false }
  if (!form.term_id) { error.value = 'Term is required.'; return false }
  if (!form.duration_minutes || form.duration_minutes < 1) { error.value = 'Duration must be at least 1 minute.'; return false }
  return true
}

const doSave = async () => {
  error.value = null
  if (!validateForm()) return
  saving.value = true
  try {
    const payload = { ...form, scheduled_start: toDatetimeLocalIsoWithOffset(form.scheduled_start) }
    if (isEditing.value) {
      await store.updateExam(examId.value, payload)
      uiStore.addToast({ title: 'Exam updated', message: 'Changes saved successfully.', variant: 'success' })
    } else {
      await store.createExam(payload)
      uiStore.addToast({ title: 'Exam created', message: 'Your exam has been created.', variant: 'success' })
    }
    router.push('/teachers/exams')
  } catch (err) {
    error.value = err?.message || 'Failed to save exam. Please try again.'
  } finally {
    saving.value = false
  }
}

const save = doSave
const saveDraft = doSave
</script>
