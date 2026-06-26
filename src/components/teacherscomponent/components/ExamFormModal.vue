<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
    <div class="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
            {{ isEditing ? 'Edit Exam' : 'Create Exam' }}
          </p>
          <h2 class="mt-1 text-2xl font-semibold text-slate-900">
            {{ isEditing ? 'Update exam details' : 'New exam' }}
          </h2>
        </div>
        <button type="button" class="text-slate-400 hover:text-slate-600 p-2" @click="$emit('close')">✕</button>
      </div>

      <div class="space-y-6 p-6">
        <!-- Error banner -->
        <div v-if="error" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {{ error }}
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <label class="flex flex-col gap-1.5 md:col-span-2">
            <span class="text-sm font-medium text-slate-700">Exam Title <span class="text-rose-500">*</span></span>
            <input
              v-model="form.title"
              type="text"
              class="form-input"
              placeholder="e.g. SS2 Mid-Term Mathematics CBT"
              required
            />
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-slate-700">Class Level <span class="text-rose-500">*</span></span>
            <select v-model="form.class_level_id" class="form-input" required @change="onClassLevelChange">
              <option value="">Select class</option>
              <option v-for="cl in store.classLevels" :key="cl.id" :value="cl.id">{{ cl.name }}</option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-slate-700">Class Arm</span>
            <select v-model="form.class_arm_id" class="form-input">
              <option value="">All arms (entire class level)</option>
              <option v-for="arm in store.classArms" :key="arm.id" :value="arm.id">{{ arm.name }}</option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-slate-700">Subject <span class="text-rose-500">*</span></span>
            <select v-model="form.subject_id" class="form-input" required>
              <option value="">Select subject</option>
              <option v-for="s in store.subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-slate-700">Academic Session <span class="text-rose-500">*</span></span>
            <select v-model="selectedSession" class="form-input" @change="onSessionChange">
              <option value="">Select session</option>
              <option v-for="s in store.academicSessions" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-slate-700">Term <span class="text-rose-500">*</span></span>
            <select v-model="form.term_id" class="form-input" required>
              <option value="">Select term</option>
              <option v-for="t in store.terms" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-slate-700">Type</span>
            <div class="flex gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="form.type" value="exam" class="text-[#0B1F3A]" />
                <span class="text-sm text-slate-700">Exam</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="form.type" value="test" class="text-[#0B1F3A]" />
                <span class="text-sm text-slate-700">Test</span>
              </label>
            </div>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-slate-700">Duration (minutes) <span class="text-rose-500">*</span></span>
            <input v-model.number="form.duration_minutes" type="number" min="1" class="form-input" placeholder="60" required />
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-slate-700">Total Marks</span>
            <input v-model.number="form.total_marks" type="number" min="0" class="form-input" placeholder="100" />
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-slate-700">Max Attempts</span>
            <input v-model.number="form.max_attempts" type="number" min="1" class="form-input" placeholder="1" />
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-slate-700">Pass Mark (%) <span class="text-rose-500">*</span></span>
            <input v-model.number="form.pass_mark" type="number" min="0" max="100" class="form-input" placeholder="50" required />
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-slate-700">Scheduled Start</span>
            <input v-model="form.scheduled_start" type="datetime-local" class="form-input" />
            <span class="text-xs text-slate-400">Time is in your local timezone ({{ localTimezone }})</span>
          </label>

          <label class="flex flex-col gap-1.5 md:col-span-2">
            <span class="text-sm font-medium text-slate-700">Instructions</span>
            <textarea
              v-model="form.instructions"
              rows="4"
              class="form-input resize-none"
              placeholder="Instructions shown to students before the exam starts..."
            />
          </label>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <AppButton text="Cancel" variant="ghost" @click="$emit('close')" />
          <AppButton
            :text="isEditing ? 'Save Changes' : 'Create Exam'"
            variant="primary"
            :processing="saving"
            @click="save"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import AppButton from '../../shared/AppButton.vue'
import { useTeacherExamsStore } from '../stores/exams'
import { getAuthUser } from '../../../js/lib/auth'
import { toDatetimeLocalInputValue, toDatetimeLocalIsoWithOffset } from '../../../js/lib/helpers'

const props = defineProps({
  exam: { type: Object, default: null },
})
const emit = defineEmits(['saved', 'close'])

const store = useTeacherExamsStore()
const saving = ref(false)
const error = ref(null)
const selectedSession = ref('')

const isEditing = computed(() => !!props.exam?.id)
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

  if (props.exam) {
    // Determine session from the exam's term
    // Try exam.term?.academic_session_id or exam.session_id or exam.academic_session_id
    const sessionId = props.exam.term?.academic_session_id
      || props.exam.session_id
      || props.exam.academic_session_id
      || props.exam.term?.session_id
      || null

    if (sessionId) {
      selectedSession.value = sessionId
      await store.loadTerms(sessionId)
    }

    // Load class arms for the exam's class level
    const clId = props.exam.class_level_id || props.exam.classLevelId
    if (clId) {
      await store.loadClassArms(clId)
    }

    Object.assign(form, {
      title: props.exam.title || '',
      subject_id: props.exam.subject_id || props.exam.subject?.id || '',
      class_level_id: clId || '',
      class_arm_id: props.exam.class_arm_id || props.exam.classArmId || null,
      term_id: props.exam.term_id || props.exam.term?.id || props.exam.termId || '',
      type: props.exam.type || 'exam',
      duration_minutes: props.exam.duration_minutes || props.exam.duration || 60,
      total_marks: props.exam.total_marks ?? props.exam.totalMarks ?? null,
      pass_mark: props.exam.pass_mark ?? props.exam.passMark ?? 50,
      max_attempts: props.exam.max_attempts ?? props.exam.maxAttempts ?? 1,
      scheduled_start: toDatetimeLocalInputValue(props.exam.scheduled_start || props.exam.scheduledStart || ''),
      instructions: props.exam.instructions || '',
    })
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
  if (selectedSession.value) {
    await store.loadTerms(selectedSession.value)
  }
}

const save = async () => {
  error.value = null

  if (!form.title || !form.subject_id || !form.class_level_id || !form.term_id || !form.duration_minutes || form.duration_minutes < 1) {
    error.value = 'Please fill in all required fields and ensure the duration is at least 1 minute.'
    return
  }

  saving.value = true
  try {
    const payload = {
      ...form,
      scheduled_start: toDatetimeLocalIsoWithOffset(form.scheduled_start),
    }
    if (isEditing.value) {
      await store.updateExam(props.exam.id, payload)
    } else {
      await store.createExam(payload)
    }
    emit('saved')
  } catch (err) {
    error.value = err.message || 'Failed to save exam. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.form-input {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgb(226 232 240);
  background-color: rgb(248 250 252);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: rgb(15 23 42);
}

.form-input:focus {
  border-color: #0B1F3A;
  background-color: white;
  outline: none;
  box-shadow: 0 0 0 1px #0B1F3A;
}

.form-input::placeholder {
  color: rgb(148 163 184);
}
</style>
