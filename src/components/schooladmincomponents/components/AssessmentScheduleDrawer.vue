<!--
  AssessmentScheduleDrawer.vue
  ────────────────────────────────────────────────────────────────────────
  The tabbed slide-over used from AssessmentSchedulePage.vue to create or
  edit a scheduled assessment for a given calendar day. Mirrors the
  reference implementation's ScheduleDrawer.tsx: three tabs (Details,
  Submission window, Exam slots) plus a lifecycle-aware footer.

  Owns its own store calls (assessments + class arms), same as the page
  did before this was split out, so the page stays a thin calendar +
  drawer-trigger controller.
-->
<template>
  <AppDrawer
    :model-value="show"
    :eyebrow="weekday"
    :title="dateLabel"
    :subtitle="subtitleText"
    size="sm"
    :persistent="busy"
    @close="$emit('close')"
  >
    <div v-if="form.id" class="mb-5 rounded-2xl bg-slate-50 p-4">
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <AppBadge :label="getAssessmentStatusLabel(assessmentStatus)" :variant="getStatusVariant(assessmentStatus)" dot />
        <AppBadge :label="questionSubmissionStatus === 'open' ? 'Questions open' : 'Questions closed'" :variant="questionSubmissionStatus === 'open' ? 'success' : 'default'" />
      </div>
      <AppLifecycleTrail :assessment-status="assessmentStatus" :question-submission-status="questionSubmissionStatus" />
    </div>

    <div class="mb-6 flex gap-1 rounded-xl bg-slate-50 p-1" role="tablist">
      <button
        v-for="item in tabs"
        :key="item.id"
        type="button"
        role="tab"
        :aria-selected="tab === item.id"
        :disabled="item.disabled"
        class="flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
        :class="tab === item.id ? 'bg-white text-[#0B1F3A] shadow-sm' : 'text-slate-500 hover:text-slate-800'"
        @click="tab = item.id"
      >
        {{ item.label }}
      </button>
    </div>

    <!-- Details tab -->
    <form v-if="tab === 'details'" class="space-y-4" @submit.prevent="saveAssessment">
      <p v-if="form.id && lockedAfterDraft" class="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        This assessment has left draft status, so timing and class fields are locked here. Use the submission window
        tab to adjust dates, or contact support to reopen the schedule.
      </p>

      <AppInput v-model="form.title" label="Title" required :disabled="lockedAfterDraft" :error="errors.title" placeholder="e.g. JSS1 First Term Examination" />
      <AppTextarea v-model="form.description" label="Description" :rows="3" :disabled="lockedAfterDraft" placeholder="What does this assessment cover?" />

      <ResponsiveFormGrid :cols="2">
        <AppInput v-model="form.total_marks" type="number" label="Total marks" required :disabled="lockedAfterDraft" :error="errors.total_marks" />
        <AppSelect v-model="form.session_id" label="Academic session" required :options="sessionOptions" placeholder="Select session" :disabled="lockedAfterDraft" :error="errors.session_id" />
        <AppSelect v-model="form.class_level_id" label="Class level" required :options="classLevelOptions" placeholder="Select level" :disabled="lockedAfterDraft" :error="errors.class_level_id" @update:model-value="onLevelChange" />
        <AppSelect v-model="form.class_arm_id" label="Class arm" :options="classArmOptions" placeholder="Whole level" :disabled="lockedAfterDraft || !form.class_level_id" />
      </ResponsiveFormGrid>

      <p class="text-xs text-slate-500">Term is set from the active term ({{ activeTermLabel }}).</p>

      <p v-if="saveError" class="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ saveError }}</p>

      <div class="flex flex-wrap gap-2 pt-1">
        <AppButton type="submit" :text="form.id ? 'Update assessment' : 'Save assessment'" variant="primary" :processing="savingAssessment" />
        <AppButton v-if="form.id && hasSchedule" type="button" text="Delete schedule" variant="danger" :icon="Trash2" :processing="deletingSchedule" @click="deleteSelectedSchedule" />
      </div>
    </form>

    <!-- Submission window tab -->
    <form v-if="tab === 'window'" class="space-y-4" @submit.prevent="saveSubmissionConfig">
      <AppInput
        v-model="submission.question_submission_ends"
        type="datetime-local"
        label="Question submission ends"
        required
        :error="submissionErrors.question_submission_ends"
        hint="Teachers can build and revise their papers until this moment."
      />
      <AppSelect v-model="submission.class_level_id" label="Class level" required :options="classLevelOptions" placeholder="Select class level" :error="submissionErrors.class_level_id" />
      <ResponsiveFormGrid :cols="2">
        <AppInput v-model="submission.assessment_starts" type="datetime-local" label="Assessment starts" :error="submissionErrors.assessment_starts" />
        <AppInput v-model="submission.assessment_ends" type="datetime-local" label="Assessment ends" :error="submissionErrors.assessment_ends" />
      </ResponsiveFormGrid>

      <p v-if="submissionSaveError" class="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ submissionSaveError }}</p>

      <AppButton type="submit" :text="hasSubmissionConfig ? 'Update window' : 'Create window'" variant="primary" :processing="savingSubmission" />
    </form>

    <!-- Exam slots tab -->
    <div v-if="tab === 'slots'" class="space-y-5">
      <ul class="space-y-2">
        <li v-if="!scheduleSubjects.length" class="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
          No subject slots yet. Add the first paper below.
        </li>
        <li v-for="slot in scheduleSubjects" :key="slot.id" class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-slate-900">{{ subjectName(slot.subject_id ?? slot.subjectId ?? slot.subject?.id) }}</p>
            <p class="text-xs text-slate-500">{{ formatSlotTime(slot.starts_at) }} – {{ formatSlotTime(slot.ends_at) }}</p>
          </div>
          <div class="flex shrink-0 gap-1.5">
            <AppButton text="Edit" variant="ghost" size="xs" :disabled="assessmentStatus !== 'draft'" @click="editScheduleSubject(slot)" />
            <AppButton text="Delete" variant="danger" size="xs" :disabled="assessmentStatus !== 'draft'" @click="removeScheduleSubject(slot)" />
          </div>
        </li>
      </ul>

      <form class="grid gap-3 border-t border-slate-100 pt-4" @submit.prevent="addScheduleSubject">
        <AppSelect v-model="slotForm.subject_id" label="Subject" :options="subjectOptions" placeholder="Select subject" required />
        <ResponsiveFormGrid :cols="2">
          <AppInput v-model="slotForm.starts_at" type="datetime-local" label="Starts at" required />
          <AppInput v-model="slotForm.ends_at" type="datetime-local" label="Ends at" required />
        </ResponsiveFormGrid>
        <div class="flex gap-2">
          <AppButton :text="editingSlotId ? 'Update subject slot' : 'Add subject slot'" variant="outline" size="sm" :processing="savingSlot" :disabled="assessmentStatus !== 'draft'" type="submit" />
          <AppButton v-if="editingSlotId" text="Cancel" variant="ghost" size="sm" type="button" @click="resetSlotForm" />
        </div>
      </form>
    </div>

    <template #footer>
      <div class="flex flex-wrap items-center gap-2">
        <div v-if="form.id" class="mr-auto flex flex-wrap gap-2">
          <AppButton v-if="questionSubmissionStatus === 'open'" text="Close questions" variant="outline" size="sm" :processing="lifecycleBusy" @click="runLifecycle('close')" />
          <AppButton v-if="questionSubmissionStatus === 'closed' && assessmentStatus !== 'complete'" text="Reopen questions" variant="outline" size="sm" :processing="lifecycleBusy" @click="runLifecycle('reopen')" />
          <AppButton v-if="questionSubmissionStatus === 'closed' && assessmentStatus === 'draft'" text="Activate" variant="success" size="sm" :processing="lifecycleBusy" @click="runLifecycle('activate')" />
          <AppButton v-if="assessmentStatus === 'active'" text="Mark complete" variant="outline" size="sm" :processing="lifecycleBusy" @click="runLifecycle('complete')" />
        </div>
        <AppButton v-if="form.id" text="Teacher submissions" variant="primary" size="sm" :icon="ArrowRight" icon-position="right" @click="goToSubmissions" />
      </div>
    </template>
  </AppDrawer>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Trash2 } from 'lucide-vue-next'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppDrawer from '../../shared/AppDrawer.vue'
import AppInput from '../../shared/AppInput.vue'
import AppLifecycleTrail from '../../shared/AppLifecycleTrail.vue'
import AppSelect from '../../shared/AppSelect.vue'
import AppTextarea from '../../shared/AppTextarea.vue'
import ResponsiveFormGrid from '../../shared/ResponsiveFormGrid.vue'
import { useSchoolAdminClassArmsStore } from '../stores/classArms'
import { useAssessmentsStore, getAssessmentStatusLabel, getStatusVariant } from '../stores/assessments'

const props = defineProps({
  show: { type: Boolean, default: false },
  date: { type: Date, default: () => new Date() },
  assessment: { type: Object, default: null },
})
const emit = defineEmits(['close', 'saved'])

const router = useRouter()
const assessmentStore = useAssessmentsStore()
const classArmsStore = useSchoolAdminClassArmsStore()

const tab = ref('details')
const savingAssessment = ref(false)
const savingSubmission = ref(false)
const deletingSchedule = ref(false)
const savingSlot = ref(false)
const lifecycleBusy = ref(false)
const editingSlotId = ref('')
const saveError = ref('')
const submissionSaveError = ref('')
const errors = reactive({})
const submissionErrors = reactive({})

const busy = computed(() => savingAssessment.value || savingSubmission.value || deletingSchedule.value || lifecycleBusy.value)

const form = reactive({
  id: '', title: '', description: '', total_marks: '',
  class_level_id: '', class_arm_id: '', session_id: '', scheduled_date: '',
})
const submission = reactive({ class_level_id: '', question_submission_ends: '', assessment_starts: '', assessment_ends: '' })
const slotForm = reactive({ subject_id: '', starts_at: '', ends_at: '' })

const classLevelOptions = computed(() => assessmentStore.classLevelOptions)
const sessionOptions = computed(() => assessmentStore.sessionOptions)
const classArmOptions = computed(() => classArmsStore.classArms.map((arm) => ({ label: arm.name || arm.title || arm.label || `Arm ${arm.id}`, value: arm.id })))
const activeTermLabel = computed(() => assessmentStore.activeTermLabel)
const hasSubmissionConfig = computed(() => !!assessmentStore.selectedAssessment?.schedule_id)
const hasSchedule = computed(() => hasSubmissionConfig.value)
const scheduleSubjects = computed(() => assessmentStore.scheduleSubjects)
const subjectOptions = computed(() => assessmentStore.subjectOptions)
const questionSubmissionStatus = computed(() => (assessmentStore.selectedAssessment?.question_submission_status || 'open').toLowerCase())
const assessmentStatus = computed(() => (assessmentStore.selectedAssessment?.assessment_status || 'draft').toLowerCase())
const lockedAfterDraft = computed(() => !!form.id && assessmentStatus.value !== 'draft')

const tabs = computed(() => [
  { id: 'details', label: 'Details' },
  { id: 'window', label: 'Submission window', disabled: !form.id },
  { id: 'slots', label: 'Exam slots', disabled: !hasSubmissionConfig.value },
])

const weekday = computed(() => props.date.toLocaleDateString(undefined, { weekday: 'long' }))
const dateLabel = computed(() => props.date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }))
const subtitleText = computed(() => form.id
  ? `Editing "${form.title}" · ${activeTermLabel.value}`
  : `New assessment for this date · ${activeTermLabel.value}`)

const resetErrors = () => { Object.keys(errors).forEach((k) => delete errors[k]); saveError.value = '' }
const resetSubmissionErrors = () => { Object.keys(submissionErrors).forEach((k) => delete submissionErrors[k]); submissionSaveError.value = '' }

const loadAssessmentIntoForm = (assessment) => {
  form.id = assessment?.id || ''
  form.title = assessment?.title || ''
  form.description = assessment?.description || ''
  form.total_marks = assessment?.total_marks ?? assessment?.totalMarks ?? ''
  const classLevelId = assessment?.class_level_id ?? assessment?.classLevelId ?? ''
  const classArmId = assessment?.class_arm_id ?? assessment?.classArmId ?? ''
  const sessionId = assessment?.session_id ?? assessment?.sessionId ?? assessment?.academic_session_id ?? assessment?.academicSessionId ?? ''
  form.class_level_id = classLevelId === '' ? '' : String(classLevelId)
  form.class_arm_id = classArmId === '' ? '' : String(classArmId)
  form.session_id = sessionId === '' ? '' : String(sessionId)
  form.scheduled_date = assessment?.scheduled_date || assessment?.scheduledDate || ''

  submission.question_submission_ends = assessment?.question_submission_ends || ''
  submission.class_level_id = classLevelId === '' ? '' : String(classLevelId)
  submission.assessment_starts = assessment?.assessment_starts || ''
  submission.assessment_ends = assessment?.assessment_ends || ''
}

const resetSlotForm = () => { editingSlotId.value = ''; slotForm.subject_id = ''; slotForm.starts_at = ''; slotForm.ends_at = '' }

watch(
  () => [props.show, props.assessment, props.date],
  async ([open, assessment, date]) => {
    if (!open) return
    tab.value = 'details'
    resetErrors()
    resetSubmissionErrors()
    resetSlotForm()
    if (assessment) {
      assessmentStore.selectAssessment(assessment.id)
      loadAssessmentIntoForm(assessment)
      await assessmentStore.fetchScheduleSubjects(assessment.id).catch(() => {})
    } else {
      assessmentStore.selectAssessment(null)
      loadAssessmentIntoForm({ scheduled_date: date })
      form.id = ''
    }
    if (form.class_level_id) await classArmsStore.fetchClassArms(form.class_level_id)
  },
  { immediate: true }
)

const onLevelChange = async (value) => {
  form.class_arm_id = ''
  if (value) await classArmsStore.fetchClassArms(value)
  else classArmsStore.classArms = []
}

const validateAssessment = () => {
  resetErrors()
  if (!form.title.trim()) errors.title = 'Title is required.'
  if (!String(form.total_marks).trim()) errors.total_marks = 'Total marks is required.'
  if (!form.class_level_id) errors.class_level_id = 'Class level is required.'
  if (!form.session_id) errors.session_id = 'Session is required.'
  return !Object.keys(errors).length
}

const validateSubmission = () => {
  resetSubmissionErrors()
  if (!submission.question_submission_ends) submissionErrors.question_submission_ends = 'This field is required.'
  if (!submission.class_level_id) submissionErrors.class_level_id = 'Class level is required.'
  const qEnd = new Date(submission.question_submission_ends)
  const aStart = new Date(submission.assessment_starts)
  const aEnd = new Date(submission.assessment_ends)
  if (submission.question_submission_ends && submission.assessment_starts && aStart < qEnd) {
    submissionErrors.assessment_starts = 'Assessment start must be after question submission ends.'
  }
  if (submission.assessment_starts && submission.assessment_ends && aEnd <= aStart) {
    submissionErrors.assessment_ends = 'Assessment end must be after assessment start.'
  }
  return !Object.keys(submissionErrors).length
}

const saveAssessment = async () => {
  if (!validateAssessment()) return
  savingAssessment.value = true
  try {
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      total_marks: Number(form.total_marks),
      class_level_id: form.class_level_id,
      class_arm_id: form.class_arm_id || null,
      session_id: form.session_id,
      term_id: assessmentStore.refData.terms.find((term) => term.current || term.is_current || term.status === 'Current' || term.status === 'Active')?.id || null,
      scheduled_date: form.scheduled_date || props.date,
      question_submission_status: 'open',
      assessment_status: 'pending',
    }
    const record = form.id
      ? await assessmentStore.saveScheduledAssessment(form.id, payload)
      : await assessmentStore.createScheduledAssessment(payload)
    loadAssessmentIntoForm({ ...record, class_level_id: payload.class_level_id, class_arm_id: payload.class_arm_id, session_id: payload.session_id })
    assessmentStore.selectAssessment(record.id)
    emit('saved', record)
    tab.value = 'window'
  } catch (error) {
    saveError.value = error?.message || 'Unable to save assessment.'
  } finally {
    savingAssessment.value = false
  }
}

const saveSubmissionConfig = async () => {
  if (!validateSubmission() || !form.id) return
  savingSubmission.value = true
  try {
    await assessmentStore.saveSubmissionConfiguration(form.id, {
      class_level_id: submission.class_level_id,
      class_arm_id: form.class_arm_id,
      question_submission_ends: submission.question_submission_ends,
      assessment_starts: submission.assessment_starts,
      assessment_ends: submission.assessment_ends,
      question_submission_status: 'open',
      assessment_status: 'pending',
    })
    await assessmentStore.fetchScheduleSubjects(form.id).catch(() => {})
    emit('saved', assessmentStore.selectedAssessment)
    tab.value = 'slots'
  } catch (error) {
    submissionSaveError.value = error?.message || 'Unable to save submission configuration.'
  } finally {
    savingSubmission.value = false
  }
}

const subjectName = (id) => subjectOptions.value.find((option) => String(option.value) === String(id))?.label || 'Subject'
const formatSlotTime = (value) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'

const addScheduleSubject = async () => {
  if (!form.id || !slotForm.subject_id) return
  savingSlot.value = true
  try {
    if (editingSlotId.value) {
      await assessmentStore.updateScheduleSubject(form.id, editingSlotId.value, { starts_at: slotForm.starts_at, ends_at: slotForm.ends_at })
    } else {
      await assessmentStore.createScheduleSubject(form.id, { ...slotForm })
    }
    resetSlotForm()
  } catch (error) {
    saveError.value = error?.message || 'Unable to add subject slot.'
  } finally {
    savingSlot.value = false
  }
}

const editScheduleSubject = (slot) => {
  editingSlotId.value = slot.id
  slotForm.subject_id = slot.subject_id ?? slot.subjectId ?? slot.subject?.id ?? ''
  slotForm.starts_at = assessmentStore.formatDateTimeValue(slot.starts_at)
  slotForm.ends_at = assessmentStore.formatDateTimeValue(slot.ends_at)
}

const removeScheduleSubject = async (slot) => {
  if (!window.confirm('Delete this subject slot?')) return
  try {
    await assessmentStore.deleteScheduleSubject(form.id, slot.id)
  } catch (error) {
    saveError.value = error?.message || 'Unable to delete subject slot.'
  }
}

const runLifecycle = async (action) => {
  if (!form.id) return
  lifecycleBusy.value = true
  try {
    if (action === 'close') await assessmentStore.closeSubmissions(form.id)
    if (action === 'reopen') await assessmentStore.reopenSubmissions(form.id, { question_submission_ends: submission.question_submission_ends })
    if (action === 'activate') await assessmentStore.activateAssessment(form.id)
    if (action === 'complete') await assessmentStore.completeAssessment(form.id)
    emit('saved', assessmentStore.selectedAssessment)
  } catch (error) {
    saveError.value = error?.message || 'Unable to update assessment lifecycle.'
  } finally {
    lifecycleBusy.value = false
  }
}

const deleteSelectedSchedule = async () => {
  if (!form.id || !assessmentStore.selectedAssessment?.schedule_id) return
  if (!window.confirm('Delete this assessment schedule? The assessment itself will be kept.')) return
  deletingSchedule.value = true
  try {
    await assessmentStore.deleteSchedule(form.id)
    emit('saved', null)
    emit('close')
  } catch (error) {
    saveError.value = error?.message || 'Unable to delete schedule.'
  } finally {
    deletingSchedule.value = false
  }
}

const goToSubmissions = () => {
  if (!form.id) return
  router.push(`/school-admin/assessment-submissions/${form.id}`)
}

</script>
