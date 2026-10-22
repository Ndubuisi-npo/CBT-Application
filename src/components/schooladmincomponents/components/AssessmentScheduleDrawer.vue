<!--
  AssessmentScheduleDrawer.vue
  ────────────────────────────────────────────────────────────────────────
  The tabbed slide-over used from AssessmentSchedulePage.vue to create or
  edit a scheduled assessment for a given calendar day. Mirrors the
  reference implementation's ScheduleDrawer.tsx: three tabs (Details,
  Submission window, Exam timetable) plus a lifecycle-aware footer.
  The exam timetable is READ-ONLY for admins: teachers place their own
  subject slots (see TeacherAssessmentPage.vue).

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
        <AppBadge :label="getAssessmentStatusLabel(assessmentStore.selectedAssessment)" :variant="getStatusVariant(assessmentStore.selectedAssessment)" dot />
        <AppBadge :label="questionSubmissionStatus === 'open' ? 'Questions open' : 'Questions closed'" :variant="questionSubmissionStatus === 'open' ? 'success' : 'default'" />
        <AppBadge :label="assessmentWindowLabel" :variant="assessmentWindowState === 'open' ? 'success' : 'default'" />
      </div>
      <AppLifecycleTrail :assessment-status="displayAssessmentStatus" :question-submission-status="questionSubmissionStatus" />
    </div>

    <div class="mb-6 grid grid-cols-3 gap-1 rounded-xl bg-slate-50 p-1" role="tablist">
      <button
        v-for="item in tabs"
        :key="item.id"
        type="button"
        role="tab"
        :aria-selected="tab === item.id"
        :disabled="item.disabled"
        class="min-w-0 rounded-lg px-1.5 py-2 text-[10px] font-semibold leading-tight transition disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-xs"
        :class="tab === item.id ? 'bg-white text-[#0B1F3A] shadow-sm' : 'text-slate-500 hover:text-slate-800'"
        @click="tab = item.id"
      >
        {{ item.label }}
      </button>
    </div>

    <p v-if="saveError" class="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ saveError }}</p>

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

      <div class="flex flex-wrap gap-2 pt-1">
        <AppButton type="submit" :text="form.id ? 'Update assessment' : 'Save assessment'" variant="primary" :processing="savingAssessment" />
        <AppButton v-if="form.id" type="button" :text="hasSchedule ? 'Delete schedule' : 'Delete assessment'" variant="danger" :icon="Trash2" :processing="deletingSchedule" @click="deleteSelectedSchedule" />
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

    <!-- Exam timetable tab (read-only) -->
    <div v-if="tab === 'slots'" class="space-y-5">
      <div class="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs" :class="assessmentStatus === 'draft' ? 'bg-sky-50 text-sky-800' : 'bg-amber-50 text-amber-800'">
        <Lock v-if="assessmentStatus !== 'draft'" class="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <CalendarDays v-else class="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <p v-if="assessmentStatus === 'draft'">Teachers place the slot for their own approved subject while the schedule is in draft. You can monitor progress here.</p>
        <p v-else>This schedule is {{ assessmentStatus }} — the timetable is locked and can no longer change.</p>
      </div>

      <div v-if="timetableState === 'loading'" class="space-y-2" role="status" aria-label="Loading exam timetable">
        <div class="h-14 animate-pulse rounded-xl bg-slate-100" />
        <div class="h-14 animate-pulse rounded-xl bg-slate-100" />
      </div>

      <div v-else-if="timetableState === 'error'" class="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
        <p>{{ timetableError }}</p>
        <AppButton class="mt-2" text="Try again" variant="outline" size="xs" @click="refreshTimetable" />
      </div>

      <template v-else>
        <!-- Daily capacity summary -->
        <section aria-labelledby="capacity-heading" class="rounded-2xl border border-slate-200 p-4">
          <div class="flex items-center justify-between gap-2">
            <h3 id="capacity-heading" class="text-sm font-semibold text-[#0B1F3A]">Daily capacity</h3>
            <span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
              {{ dailyCap === null ? 'No daily cap' : `Max ${dailyCap} per day` }}
            </span>
          </div>
          <p class="mt-1 text-xs text-slate-500">
            {{ dailyCap === null
              ? 'No daily limit applies to this class level.'
              : 'How many subjects this class level may sit on one day.' }}
            Usage counts slots across <span class="font-semibold">all schedules</span> for this class level, not only this one.
          </p>
          <ul v-if="usageDays.length" class="mt-3 space-y-2">
            <li v-for="day in usageDays" :key="day.key">
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-slate-700">{{ formatDateKey(day.key) }}</span>
                <span class="tabular-nums" :class="day.full ? 'font-semibold text-rose-600' : 'text-slate-500'">
                  {{ day.used }}{{ dailyCap === null ? ' scheduled' : ` of ${dailyCap}` }}{{ day.full ? ' · full' : '' }}
                </span>
              </div>
              <div
                v-if="dailyCap !== null"
                class="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                :aria-label="`Subject slots used on ${formatDateKey(day.key)}`"
                :aria-valuemin="0"
                :aria-valuemax="dailyCap"
                :aria-valuenow="Math.min(day.used, dailyCap)"
              >
                <div class="h-full rounded-full transition-[width] motion-reduce:transition-none" :class="day.full ? 'bg-rose-500' : 'bg-[#0B1F3A]'" :style="{ width: `${day.percent}%` }" />
              </div>
            </li>
          </ul>
          <p v-else class="mt-3 text-xs text-slate-400">No days are in use yet.</p>
        </section>

        <!-- Missing slots -->
        <section aria-labelledby="missing-heading" class="rounded-2xl border p-4" :class="missingSlots.length ? 'border-amber-200 bg-amber-50/60' : 'border-emerald-200 bg-emerald-50/60'">
          <div class="flex items-center justify-between gap-2">
            <h3 id="missing-heading" class="text-sm font-semibold text-[#0B1F3A]">Missing slots</h3>
            <span class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" :class="missingSlots.length ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'">
              {{ missingSlots.length }}
            </span>
          </div>
          <p v-if="submissionsError" class="mt-2 text-xs text-amber-800">
            Couldn’t check approved papers: {{ submissionsError }}
          </p>
          <p v-else-if="!missingSlots.length" class="mt-1 flex items-center gap-1.5 text-xs text-emerald-800">
            <CheckCircle2 class="h-3.5 w-3.5" aria-hidden="true" />
            All approved subjects have been scheduled.
          </p>
          <template v-else>
            <p class="mt-1 text-xs text-amber-900">These approved subjects still need their teacher to choose a time slot.</p>
            <ul class="mt-3 space-y-1.5">
              <li v-for="item in missingSlots" :key="item.id" class="flex items-baseline justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm">
                <span class="min-w-0 truncate font-medium text-slate-900">{{ submissionSubjectLabel(item) }}</span>
                <span class="shrink-0 truncate text-xs text-slate-500">{{ submissionTeacherLabel(item) }}</span>
              </li>
            </ul>
          </template>
        </section>

        <!-- Timetable -->
        <section aria-labelledby="timetable-heading">
          <h3 id="timetable-heading" class="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Timetable</h3>
          <p v-if="!scheduleSubjects.length" class="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
            Teachers schedule their own subjects. No slots placed yet.
          </p>
          <div v-else class="space-y-4">
            <div v-for="day in timetableDays" :key="day.key">
              <p class="mb-1.5 text-xs font-semibold text-slate-500">{{ formatDateKey(day.key) }}</p>
              <ul class="space-y-2">
                <li v-for="slot in day.slots" :key="slot.id" class="rounded-xl border border-slate-200 px-4 py-3">
                  <div class="flex items-baseline justify-between gap-3">
                    <p class="min-w-0 truncate text-sm font-semibold text-slate-900">{{ slotSubjectLabel(slot) }}</p>
                    <span v-if="slot.subject?.code" class="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{{ slot.subject.code }}</span>
                  </div>
                  <p class="mt-0.5 text-xs text-slate-500">
                    {{ formatSlotTime(slot.starts_at) }} – {{ formatSlotTime(slot.ends_at) }}
                    <template v-if="formatDuration(slotDurationMinutes(slot))"> · {{ formatDuration(slotDurationMinutes(slot)) }}</template>
                    <span class="text-slate-400"> · Lagos time</span>
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </template>
    </div>

    <template #footer>
      <div class="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <div v-if="form.id" class="flex flex-wrap gap-2 sm:mr-auto">
          <AppButton v-if="questionSubmissionStatus === 'open'" text="Close questions" variant="outline" size="sm" :processing="lifecycleBusy" @click="runLifecycle('close')" />
          <AppButton v-if="questionSubmissionStatus === 'closed' && assessmentStatus !== 'complete'" text="Reopen questions" variant="outline" size="sm" :processing="lifecycleBusy" @click="runLifecycle('reopen')" />
          <AppButton v-if="questionSubmissionStatus === 'closed' && assessmentStatus === 'draft'" text="Activate" variant="success" size="sm" :processing="lifecycleBusy" :disabled="activateBlocked" :aria-describedby="activateHint ? 'activate-hint' : undefined" @click="runLifecycle('activate')" />
          <AppButton v-if="assessmentStatus === 'active'" text="Mark complete" variant="outline" size="sm" :processing="lifecycleBusy" @click="runLifecycle('complete')" />
        </div>
        <p v-if="activateHint" id="activate-hint" class="text-xs font-medium text-amber-700 sm:mr-2" role="status">{{ activateHint }}</p>
        <AppButton v-if="form.id" text="Teacher submissions" variant="primary" size="sm" :icon="ArrowRight" icon-position="right" @click="goToSubmissions" />
      </div>
    </template>
  </AppDrawer>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, CalendarDays, CheckCircle2, Lock, Trash2 } from 'lucide-vue-next'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppDrawer from '../../shared/AppDrawer.vue'
import AppInput from '../../shared/AppInput.vue'
import AppLifecycleTrail from '../../shared/AppLifecycleTrail.vue'
import AppSelect from '../../shared/AppSelect.vue'
import AppTextarea from '../../shared/AppTextarea.vue'
import ResponsiveFormGrid from '../../shared/ResponsiveFormGrid.vue'
import { useSchoolAdminClassArmsStore } from '../stores/classArms'
import { useAssessmentsStore, getAssessmentStatusLabel, getStatusVariant, isQuestionSubmissionClosed } from '../stores/assessments'
import { getAssessmentWindowState, getEffectiveAssessmentStatus } from '../../../js/lib/helpers'
import {
  computeDayCapacity,
  formatDateKey,
  formatDuration,
  formatSlotTime,
  getMissingSlotSubmissions,
  groupSlotsByDay,
  lagosLocalToDate,
  lagosLocalToIso,
  normalizeScheduleSubjectMeta,
  slotDurationMinutes,
  slotErrorMessage,
  slotSubjectId,
  submissionSubjectId,
  toLagosLocalInput,
} from '../../../js/lib/slotTime'

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
const lifecycleBusy = ref(false)
const timetableState = ref('idle') // idle | loading | ready | error
const timetableError = ref('')
const submissionsError = ref('')
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

const classLevelOptions = computed(() => assessmentStore.classLevelOptions)
const sessionOptions = computed(() => assessmentStore.sessionOptions)
const classArmOptions = computed(() => classArmsStore.classArms.map((arm) => ({ label: arm.name || arm.title || arm.label || `Arm ${arm.id}`, value: arm.id })))
const activeTermLabel = computed(() => assessmentStore.activeTermLabel)
const hasSchedule = computed(() => !!assessmentStore.selectedAssessment?.schedule_id)
const hasSubmissionConfig = computed(() => !!assessmentStore.selectedAssessment?.schedule_id)
const scheduleSubjects = computed(() => assessmentStore.scheduleSubjects)
const subjectOptions = computed(() => assessmentStore.subjectOptions)
const dailyCap = computed(() => normalizeScheduleSubjectMeta(assessmentStore.scheduleSubjectMeta).daily_cap)
const timetableDays = computed(() => groupSlotsByDay(scheduleSubjects.value))
// Days with usage (any schedule of this class level), soonest first.
const usageDays = computed(() => {
  const usage = normalizeScheduleSubjectMeta(assessmentStore.scheduleSubjectMeta).daily_usage
  return Object.keys(usage)
    .filter((key) => usage[key] > 0)
    .sort()
    .map((key) => {
      const capacity = computeDayCapacity({ meta: assessmentStore.scheduleSubjectMeta, dateKey: key })
      return { key, used: capacity.used, full: capacity.cap !== null && capacity.used >= capacity.cap, percent: capacity.percent }
    })
})
const missingSlots = computed(() => getMissingSlotSubmissions(assessmentStore.submissions, scheduleSubjects.value))
// Activation needs a slot for every approved subject. While the check is
// loading we hold the button; if it FAILED we don't block (the backend's 409
// is the real gate) and the Missing slots card says the check couldn't run.
const activateBlocked = computed(() => timetableState.value === 'loading' || missingSlots.value.length > 0)
const activateHint = computed(() => {
  if (missingSlots.value.length) return `${missingSlots.value.length} subject(s) still need a time slot.`
  if (timetableState.value === 'loading') return 'Checking subject slots…'
  return ''
})
const questionSubmissionStatus = computed(() => (isQuestionSubmissionClosed(assessmentStore.selectedAssessment) ? 'closed' : 'open'))
const assessmentWindowState = computed(() => getAssessmentWindowState(assessmentStore.selectedAssessment))
const assessmentWindowLabel = computed(() => ({ upcoming: 'Assessment upcoming', open: 'Assessment open', closed: 'Assessment ended' }[assessmentWindowState.value]))
const assessmentStatus = computed(() => (assessmentStore.selectedAssessment?.assessment_status || 'draft').toLowerCase())
const displayAssessmentStatus = computed(() => getEffectiveAssessmentStatus(assessmentStore.selectedAssessment))
const lockedAfterDraft = computed(() => !!form.id && assessmentStatus.value !== 'draft')

const tabs = computed(() => [
  { id: 'details', label: 'Details' },
  { id: 'window', label: 'Submission window', disabled: !form.id },
  { id: 'slots', label: 'Exam timetable', disabled: !hasSubmissionConfig.value },
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

  submission.question_submission_ends = toLagosLocalInput(assessment?.question_submission_ends)
  submission.class_level_id = classLevelId === '' ? '' : String(classLevelId)
  submission.assessment_starts = toLagosLocalInput(assessment?.assessment_starts)
  submission.assessment_ends = toLagosLocalInput(assessment?.assessment_ends)
}

/** Reloads the read-only timetable plus the approved papers needed for the missing-slots check. */
const refreshTimetable = async () => {
  const id = form.id
  if (!id || !assessmentStore.selectedAssessment?.schedule_id) {
    timetableState.value = 'idle'
    return
  }
  timetableState.value = 'loading'
  timetableError.value = ''
  submissionsError.value = ''
  const [slotsResult, submissionsResult] = await Promise.allSettled([
    assessmentStore.fetchScheduleSubjects(id),
    assessmentStore.fetchSubmissions(id, { silent: true }),
  ])
  if (form.id !== id) return // drawer moved on to another assessment
  if (submissionsResult.status === 'rejected') {
    submissionsError.value = slotErrorMessage(submissionsResult.reason, 'Unable to load teacher submissions.')
  }
  if (slotsResult.status === 'rejected') {
    timetableError.value = slotErrorMessage(slotsResult.reason, 'Unable to load the exam timetable.')
    timetableState.value = 'error'
    return
  }
  timetableState.value = 'ready'
}

const slotSubjectLabel = (slot) => slot.subject?.name || subjectName(slotSubjectId(slot)) || 'Subject'
const submissionSubjectLabel = (item) => item.subject?.name || subjectName(submissionSubjectId(item)) || item.title || 'Subject'
const submissionTeacherLabel = (item) => {
  const teacher = item.teacher || {}
  return `${teacher.first_name || teacher.firstName || ''} ${teacher.last_name || teacher.lastName || ''}`.trim() || teacher.name || ''
}

watch(
  () => [props.show, props.assessment, props.date],
  async ([open, assessment, date]) => {
    if (!open) return
    tab.value = 'details'
    resetErrors()
    resetSubmissionErrors()
    timetableState.value = 'idle'
    if (assessment) {
      assessmentStore.selectAssessment(assessment.id)
      loadAssessmentIntoForm(assessment)
      await refreshTimetable()
    } else {
      assessmentStore.selectAssessment(null)
      loadAssessmentIntoForm({ scheduled_date: date })
      form.id = ''
    }
    if (form.class_level_id) await classArmsStore.fetchClassArms(form.class_level_id)
  },
  { immediate: true }
)

// Teachers may place slots while the drawer is open — re-check whenever the timetable tab is opened.
watch(tab, (value) => {
  if (value === 'slots' && props.show && timetableState.value !== 'loading') refreshTimetable()
})

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
  const qEnd = lagosLocalToDate(submission.question_submission_ends)
  const aStart = lagosLocalToDate(submission.assessment_starts)
  const aEnd = lagosLocalToDate(submission.assessment_ends)
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
      question_submission_ends: lagosLocalToIso(submission.question_submission_ends),
      assessment_starts: lagosLocalToIso(submission.assessment_starts),
      assessment_ends: lagosLocalToIso(submission.assessment_ends),
      question_submission_status: 'open',
      assessment_status: 'pending',
    })
    await refreshTimetable()
    emit('saved', assessmentStore.selectedAssessment)
    tab.value = 'slots'
  } catch (error) {
    submissionSaveError.value = error?.message || 'Unable to save submission configuration.'
  } finally {
    savingSubmission.value = false
  }
}

const subjectName = (id) => subjectOptions.value.find((option) => String(option.value) === String(id))?.label || ''

const runLifecycle = async (action) => {
  if (!form.id) return
  lifecycleBusy.value = true
  try {
    if (action === 'close') await assessmentStore.closeSubmissions(form.id)
    if (action === 'reopen') {
      await assessmentStore.reopenSubmissions(form.id, {
        question_submission_ends: lagosLocalToIso(submission.question_submission_ends),
      })
    }
    if (action === 'activate') await assessmentStore.activateAssessment(form.id)
    if (action === 'complete') await assessmentStore.completeAssessment(form.id)
    emit('saved', assessmentStore.selectedAssessment)
    if (action === 'close' || action === 'reopen') await refreshTimetable()
  } catch (error) {
    saveError.value = error?.message || 'Unable to update assessment lifecycle.'
  } finally {
    lifecycleBusy.value = false
  }
}

const deleteSelectedSchedule = async () => {
  if (!form.id) return
  const message = hasSchedule.value
    ? 'Delete this assessment schedule? The assessment itself will be kept.'
    : 'Delete this assessment? It has no schedule yet and will be permanently removed.'
  if (!window.confirm(message)) return
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
