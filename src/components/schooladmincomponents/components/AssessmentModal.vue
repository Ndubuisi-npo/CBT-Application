<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-2xl max-h-[90vh] transform overflow-y-auto rounded-lg bg-white shadow-xl transition-all">
      <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-900">{{ isEdit ? 'Edit Assessment' : 'Create Assessment' }}</h3>
          <AppButton @click="$emit('close')" :icon="X" variant="ghost" class="text-slate-400 hover:text-slate-600" />
        </div>

        <p v-if="isEdit && !isDraft" class="mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          This assessment has left draft status, so only the title and instructions can still be changed here.
          Timing windows are locked once teachers or students may already be relying on them.
        </p>

        <form class="space-y-4" @submit.prevent="submit">
          <AppInput
            v-model="form.title"
            label="Assessment Title"
            placeholder="e.g. JSS1 First Term Examination"
            required
            :error="errors.title"
            @blur="touch('title')"
          />

          <AppTextarea
            v-model="form.instructions"
            label="Instructions (optional)"
            placeholder="Any notes shown to reviewing admins or referenced by teachers…"
            :rows="3"
          />

          <div class="grid gap-4 sm:grid-cols-2">
            <AppInput
              v-model="form.totalMarks"
              type="number"
              label="Total Marks Cap"
              placeholder="100"
              required
              :disabled="lockedAfterDraft"
              :error="errors.totalMarks"
              @blur="touch('totalMarks')"
            />
            <AppInput
              v-model="form.durationMinutes"
              type="number"
              label="Duration (minutes, optional)"
              placeholder="Falls back to student window if left blank"
              :disabled="lockedAfterDraft"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <AppSelect
              v-model="form.classLevelId"
              :options="classLevelOptions"
              label="Class Level"
              placeholder="Select level"
              required
              :disabled="lockedAfterDraft"
              :error="errors.classLevelId"
              @blur="touch('classLevelId')"
            />
            <AppSelect
              v-model="form.classArmId"
              :options="classArmOptions"
              label="Class Arm (optional — leave blank for the whole level)"
              placeholder="All arms"
              :disabled="lockedAfterDraft"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <AppSelect
              v-model="form.sessionId"
              :options="sessionOptions"
              label="Academic Session"
              placeholder="Select session"
              required
              :disabled="lockedAfterDraft"
              :error="errors.sessionId"
              @blur="touch('sessionId')"
            />
            <AppSelect
              v-model="form.termId"
              :options="termOptions"
              label="Term"
              placeholder="Select term"
              required
              :disabled="lockedAfterDraft || !form.sessionId"
              :error="errors.termId"
              @blur="touch('termId')"
            />
          </div>

          <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Teacher submission window</p>
            <div class="mt-3 grid gap-4 sm:grid-cols-2">
              <AppInput
                v-model="form.submissionOpensAt"
                type="datetime-local"
                label="Opens At (optional)"
                :disabled="lockedAfterDraft"
              />
              <AppInput
                v-model="form.submissionClosesAt"
                type="datetime-local"
                label="Deadline"
                :disabled="lockedAfterDraft"
                :hint="'Required before this assessment can be opened to teachers.'"
              />
            </div>
          </div>

          <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Student attempt window</p>
            <div class="mt-3 grid gap-4 sm:grid-cols-2">
              <AppInput
                v-model="form.studentStartsAt"
                type="datetime-local"
                label="Starts At"
                :disabled="lockedAfterDraft"
              />
              <AppInput
                v-model="form.studentEndsAt"
                type="datetime-local"
                label="Ends At"
                :disabled="lockedAfterDraft"
                :error="errors.studentWindow"
              />
            </div>
            <p class="mt-2 text-xs text-slate-500">Both are required, and start must be before end, before this assessment can be activated.</p>
          </div>

          <div class="flex gap-2 pt-2">
            <AppButton
              type="submit"
              :text="isEdit ? 'Save Changes' : 'Create Assessment'"
              full-width
              variant="primary"
              :processing="submitting"
            />
            <AppButton type="button" text="Cancel" variant="outline" @click="$emit('close')" />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import AppInput from '../../shared/AppInput.vue'
import AppSelect from '../../shared/AppSelect.vue'
import AppTextarea from '../../shared/AppTextarea.vue'
import { useAssessmentsStore } from '../stores/assessments'
import { toDatetimeLocalInputValue, toDatetimeLocalIsoWithOffset } from '../../../js/lib/helpers'

const props = defineProps({
  show: { type: Boolean, default: false },
  assessment: { type: Object, default: null },
})

const emit = defineEmits(['close', 'submit'])

const store = useAssessmentsStore()
const isEdit = computed(() => !!props.assessment)
const submitting = ref(false)

// PATCH is draft-only (see the frontend integration guide §4/§7) — once the
// assessment has moved past draft, only title/instructions remain editable here.
const isDraft = computed(() => !props.assessment || (props.assessment.status || '').toLowerCase() === 'draft')
const lockedAfterDraft = computed(() => isEdit.value && !isDraft.value)

const classLevelOptions = computed(() => store.classLevelOptions)
const classArmOptions = computed(() => store.classArmOptions)
const sessionOptions = computed(() => store.sessionOptions)
const termOptions = computed(() => store.termOptions)

const defaultForm = () => ({
  title: '',
  instructions: '',
  totalMarks: '',
  durationMinutes: '',
  classLevelId: '',
  classArmId: '',
  sessionId: '',
  termId: '',
  submissionOpensAt: '',
  submissionClosesAt: '',
  studentStartsAt: '',
  studentEndsAt: '',
})

const form = reactive(defaultForm())
const errors = reactive({ title: '', totalMarks: '', classLevelId: '', sessionId: '', termId: '', studentWindow: '' })

const resetErrors = () => Object.assign(errors, { title: '', totalMarks: '', classLevelId: '', sessionId: '', termId: '', studentWindow: '' })

watch(
  () => [props.show, props.assessment],
  async ([show, assessment]) => {
    if (!show) return
    resetErrors()
    if (assessment) {
      form.title = assessment.title ?? ''
      form.instructions = assessment.instructions ?? ''
      form.totalMarks = assessment.total_marks ?? assessment.totalMarks ?? ''
      form.durationMinutes = assessment.duration_minutes ?? assessment.durationMinutes ?? ''
      form.classLevelId = assessment.class_level_id ?? assessment.classLevelId ?? ''
      form.classArmId = assessment.class_arm_id ?? assessment.classArmId ?? ''
      form.termId = assessment.term_id ?? assessment.termId ?? ''
      // The term's parent session isn't on the Assessment payload itself, so
      // infer it from the loaded term (if the relation was eager-loaded) —
      // otherwise leave the session picker blank; the term is already set.
      form.sessionId = assessment.term?.academic_session_id ?? assessment.term?.session_id ?? ''
      form.submissionOpensAt = toDatetimeLocalInputValue(assessment.submission_opens_at ?? assessment.submissionOpensAt)
      form.submissionClosesAt = toDatetimeLocalInputValue(assessment.submission_closes_at ?? assessment.submissionClosesAt)
      form.studentStartsAt = toDatetimeLocalInputValue(assessment.student_starts_at ?? assessment.studentStartsAt)
      form.studentEndsAt = toDatetimeLocalInputValue(assessment.student_ends_at ?? assessment.studentEndsAt)

      if (form.classLevelId) await store.fetchClassArms(form.classLevelId)
      if (form.sessionId) await store.fetchTerms(form.sessionId)
    } else {
      Object.assign(form, defaultForm())
    }
  },
  { immediate: true }
)

watch(
  () => form.classLevelId,
  (levelId) => {
    if (levelId) store.fetchClassArms(levelId)
  }
)

watch(
  () => form.sessionId,
  (sessionId) => {
    form.termId = ''
    if (sessionId) store.fetchTerms(sessionId)
  }
)

const validateField = (field) => {
  if (field === 'title') errors.title = String(form.title).trim() ? '' : 'Title is required.'
  if (field === 'totalMarks') errors.totalMarks = Number(form.totalMarks) > 0 ? '' : 'Total marks must be greater than zero.'
  if (field === 'classLevelId') errors.classLevelId = form.classLevelId ? '' : 'Class level is required.'
  if (field === 'sessionId') errors.sessionId = form.sessionId ? '' : 'Academic session is required.'
  if (field === 'termId') errors.termId = form.termId ? '' : 'Term is required.'
}

const touch = (field) => validateField(field)

const validate = () => {
  ;['title', 'totalMarks', 'classLevelId', 'sessionId', 'termId'].forEach(validateField)
  errors.studentWindow = ''
  if (form.studentStartsAt && form.studentEndsAt) {
    if (new Date(form.studentStartsAt).getTime() >= new Date(form.studentEndsAt).getTime()) {
      errors.studentWindow = 'The student window must start before it ends.'
    }
  }
  return !Object.values(errors).some(Boolean)
}

const submit = async () => {
  if (!validate()) return

  // After draft, only title/instructions are sent (PATCH is draft-only for
  // everything else per the backend contract).
  const payload = lockedAfterDraft.value
    ? {
        title: String(form.title).trim(),
        instructions: form.instructions?.trim() || null,
      }
    : {
        title: String(form.title).trim(),
        instructions: form.instructions?.trim() || null,
        total_marks: Number(form.totalMarks),
        duration_minutes: form.durationMinutes ? Number(form.durationMinutes) : null,
        class_level_id: form.classLevelId,
        class_arm_id: form.classArmId || null,
        term_id: form.termId,
        submission_opens_at: toDatetimeLocalIsoWithOffset(form.submissionOpensAt),
        submission_closes_at: toDatetimeLocalIsoWithOffset(form.submissionClosesAt),
        student_starts_at: toDatetimeLocalIsoWithOffset(form.studentStartsAt),
        student_ends_at: toDatetimeLocalIsoWithOffset(form.studentEndsAt),
      }

  submitting.value = true
  try {
    emit('submit', { id: props.assessment?.id, ...payload })
  } finally {
    submitting.value = false
  }
}
</script>
