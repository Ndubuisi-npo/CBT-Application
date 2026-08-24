<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Assessment Schedule"
      subtitle="Plan assessments on a calendar, then continue straight into submission setup."
      eyebrow="Assessment Management"
    >
    </AppPageHeader>

    <section class="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div class="grid gap-0" :class="selectedDate ? 'lg:grid-cols-[minmax(0,1fr)_360px]' : 'lg:grid-cols-1'">
        <div class="min-w-0 p-4 sm:p-6">
          <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">Academic Session</p>
              <h2 class="mt-1 text-4xl font-light tracking-tight text-[#0B1F3A] sm:text-5xl">{{ monthLabel }}</h2>
              <p class="mt-2 text-sm text-slate-500">{{ scheduledAssessments.length }} assessments scheduled · hover or click a date to work on it</p>
            </div>
            <div class="flex items-center gap-2">
              <AppButton text="Today" variant="outline" size="sm" @click="goToday" />
              <button class="h-9 w-9 rounded-xl border border-slate-200 text-slate-600 transition hover:border-[#0B1F3A] hover:text-[#0B1F3A]" aria-label="Previous month" @click="shiftMonth(-1)">‹</button>
              <button class="h-9 w-9 rounded-xl border border-slate-200 text-slate-600 transition hover:border-[#0B1F3A] hover:text-[#0B1F3A]" aria-label="Next month" @click="shiftMonth(1)">›</button>
            </div>
          </div>

          <div class="grid grid-cols-7 overflow-hidden rounded-2xl border border-slate-200">
            <div v-for="day in weekdays" :key="day" class="border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 last:border-r-0">
              {{ day }}
            </div>
            <button
              v-for="cell in calendarCells"
              :key="cell.key"
              type="button"
              class="group relative min-h-[116px] border-r border-b border-slate-200 p-2 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
              :class="[cell.isCurrentMonth ? 'bg-white' : 'bg-[#FBFAF7] text-slate-400', isSelected(cell.dateKey) ? 'bg-[#0B1F3A]/5 ring-1 ring-inset ring-[#0B1F3A]/20' : '']"
              :style="cell.tintColor ? { backgroundColor: `rgba(${cell.tintColor}, 0.07)` } : {}"
              :aria-label="`Select ${cell.label}`"
              @click="selectCell(cell)"
              @mouseenter="hoveredCell = cell.dateKey"
              @mouseleave="hoveredCell === cell.dateKey && (hoveredCell = '')"
            >
              <div class="flex items-start justify-between gap-2">
                <span
                  class="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium"
                  :class="[
                    cell.isToday ? 'bg-[#D4AF37] text-[#0B1F3A]' : '',
                    isSelected(cell.dateKey) ? 'bg-[#0B1F3A] text-white' : '',
                    !cell.isToday && !isSelected(cell.dateKey) ? 'text-slate-700' : '',
                  ]"
                >
                  {{ cell.day }}
                </span>
                <span v-if="cell.assessments.length" class="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#0B1F3A]/60">{{ cell.assessments.length }}</span>
              </div>
              <div class="mt-2 space-y-1.5">
                <button
                  v-for="assessment in cell.previewAssessments"
                  :key="assessment.id"
                  type="button"
                  class="flex w-full items-center gap-2 rounded-lg border px-2 py-1 text-left text-[11px] text-slate-700 transition hover:border-[#D4AF37]/40"
                  :style="{
                    borderColor: `rgba(${hexToRgb(scheduleColor(assessment))}, 0.35)`,
                    backgroundColor: `rgba(${hexToRgb(scheduleColor(assessment))}, 0.08)`,
                  }"
                  @click.stop="openAssessment(assessment)"
                >
                  <span class="h-2 w-2 shrink-0 rounded-full" :style="{ backgroundColor: scheduleColor(assessment) }" />
                  <span class="min-w-0 flex-1 truncate">
                    <span class="font-semibold text-[#0B1F3A]">{{ assessment.startTime || 'All day' }}</span>
                    {{ assessment.title || 'Assessment' }}
                  </span>
                </button>
                <p v-if="cell.moreCount" class="text-[11px] font-medium text-slate-500">+{{ cell.moreCount }} more</p>
              </div>

              <!-- Hover overlay: quick add/edit affordance, mirrors the reference screenshots -->
              <div
                v-if="hoveredCell === cell.dateKey && !isSelected(cell.dateKey)"
                class="pointer-events-none absolute inset-x-2 bottom-2 flex justify-start opacity-0 transition-opacity duration-150 group-hover:opacity-100"
              >
                <span
                  class="pointer-events-none inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm"
                  :class="cell.assessments.length ? 'bg-[#0B1F3A]/85' : 'bg-slate-700/85'"
                >
                  <Pencil v-if="cell.assessments.length" class="h-3 w-3" />
                  <Plus v-else class="h-3 w-3" />
                  {{ cell.assessments.length ? 'Edit schedule' : 'Set schedule' }}
                </span>
              </div>
            </button>
          </div>
        </div>

        <aside v-if="selectedDate" class="border-t border-slate-200 bg-slate-50/80 lg:border-l lg:border-t-0">
          
            <div class="">
              <div class="border-b border-slate-200 px-5 py-4">
                <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">{{ selectedWeekday }}</p>
                <h3 class="mt-1 text-2xl font-light text-[#0B1F3A]">{{ selectedDateLabel }}</h3>
                <p class="mt-1 text-sm text-slate-500">{{ activeTermLabel }} · session is selected below when saving</p>
              </div>

              <div class="space-y-5 p-5">
                <div v-if="selectedDayAssessments.length" class="space-y-3">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Scheduled assessments</p>
                  <button
                    v-for="assessment in selectedDayAssessments"
                    :key="assessment.id"
                    type="button"
                    class="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-[#0B1F3A]/30"
                    @click="openAssessment(assessment)"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="truncate text-sm font-semibold text-slate-900">{{ assessment.title }}</p>
                        <p class="mt-1 text-xs text-slate-500">{{ assessment.description || 'No description provided.' }}</p>
                      </div>
                      <AppBadge :label="getAssessmentStatusLabel(assessment)" :variant="getStatusVariant(assessment.assessment_status || assessment.status)" />
                    </div>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <AppBadge :label="questionSubmissionStatusLabel(assessment)" :variant="submissionStatusVariant(assessment)" />
                      <span class="text-xs text-slate-500">Marks: {{ assessment.total_marks ?? assessment.totalMarks ?? '—' }}</span>
                    </div>
                  </button>
                </div>
                <AppEmptyState
                  v-else
                  :icon="CalendarDays"
                  title="No assessments scheduled"
                  description="This day is clear. Create an assessment for this date below."
                />

                <form class="space-y-4" @submit.prevent="saveAssessment">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Assessment details</p>
                      <h4 class="text-lg font-semibold text-slate-900">{{ form.id ? 'Edit assessment' : 'Create assessment' }}</h4>
                    </div>
                    <AppBadge :label="activeTermLabel" variant="primary" />
                  </div>

                  <AppInput v-model="form.title" label="Title" required :error="errors.title" />
                  <AppTextarea v-model="form.description" label="Description" :rows="3" />
                  <AppInput v-model="form.total_marks" label="Total Marks" type="number" required :error="errors.total_marks" />
                  <AppSelect v-model="form.class_level_id" label="Class Level" required :options="classLevelOptions" placeholder="Select class level" :error="errors.class_level_id" @update:modelValue="onLevelChange" />
                  <AppSelect v-model="form.class_arm_id" label="Class Arm" :options="classArmOptions" placeholder="Select class arm" :disabled="!form.class_level_id" />
                  <AppSelect v-model="form.session_id" label="Session" required :options="sessionOptions" placeholder="Select academic session" :error="errors.session_id" />

                  <div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    <p><span class="font-semibold text-slate-900">Term:</span> {{ activeTermLabel }}</p>
                    <p class="mt-1"><span class="font-semibold text-slate-900">created_at:</span> backend-controlled, not editable here</p>
                  </div>

                  <p v-if="saveError" class="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ saveError }}</p>
                  <div class="flex flex-wrap gap-2">
                    <AppButton :text="form.id ? 'Update Assessment' : 'Save Assessment'" variant="primary" :processing="savingAssessment" type="submit" />
                    <AppButton text="Continue to Submission Setup" variant="outline" :disabled="!form.id" @click="continueToSubmissionSetup" />
                  </div>
                </form>

                <form v-if="form.id" class="space-y-4" @submit.prevent="saveSubmissionConfig">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Submission configuration</p>
                      <h4 class="text-lg font-semibold text-slate-900">{{ hasSubmissionConfig ? 'Edit submission' : 'Add submission' }}</h4>
                    </div>
                    <AppBadge :label="submissionConfigStatus" :variant="submissionStatusVariant(form)" />
                  </div>

                  <AppInput v-model="submission.question_submission_ends" label="question_submission_ends" type="datetime-local" required :error="submissionErrors.question_submission_ends" />
                  <AppInput v-model="submission.assessment_starts" label="assessment_starts" type="datetime-local" required :error="submissionErrors.assessment_starts" />
                  <AppInput v-model="submission.assessment_ends" label="assessment_ends" type="datetime-local" required :error="submissionErrors.assessment_ends" />

                  <div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    <p><span class="font-semibold text-slate-900">question_submission_status:</span> {{ questionSubmissionStatusLabel(form) }}</p>
                    <p class="mt-1"><span class="font-semibold text-slate-900">assessment_status:</span> {{ assessmentStatusLabel(form) }}</p>
                  </div>

                  <p v-if="submissionSaveError" class="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ submissionSaveError }}</p>
                  <div class="flex flex-wrap gap-2">
                    <AppButton :text="hasSubmissionConfig ? 'Update Submission' : 'Create Submission'" variant="primary" :processing="savingSubmission" type="submit" />
                    <AppButton text="Continue to Submission Setup" variant="outline" :disabled="!form.id" @click="continueToSubmissionSetup" />
                  </div>
                </form>
              </div>
            </div>
          
        </aside>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { CalendarDays, Pencil, Plus } from 'lucide-vue-next'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppEmptyState from '../../shared/AppEmptyState.vue'
import AppInput from '../../shared/AppInput.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import AppSelect from '../../shared/AppSelect.vue'
import AppTextarea from '../../shared/AppTextarea.vue'
import { useSchoolAdminSessionsStore } from '../stores/sessions'
import { useSchoolAdminClassArmsStore } from '../stores/classArms'
import { useAssessmentsStore, getAssessmentStatusLabel, getStatusVariant } from '../stores/assessments'
import { getScheduleColor, hexToRgb, getDateRangeKeys } from '../../../js/lib/scheduleColors'

const router = useRouter()
const assessmentStore = useAssessmentsStore()
const sessionsStore = useSchoolAdminSessionsStore()
const classArmsStore = useSchoolAdminClassArmsStore()

const today = new Date()
const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const hoveredCell = ref('')
const scheduleColor = (assessment) => getScheduleColor(assessment?.id)
const savingAssessment = ref(false)
const savingSubmission = ref(false)
const saveError = ref('')
const submissionSaveError = ref('')
const errors = reactive({})
const submissionErrors = reactive({})

const form = reactive({
  id: '',
  title: '',
  description: '',
  total_marks: '',
  class_level_id: '',
  class_arm_id: '',
  session_id: '',
  scheduled_date: '',
})

const submission = reactive({
  question_submission_ends: '',
  assessment_starts: '',
  assessment_ends: '',
})

const currentMonthDate = computed(() => new Date(assessmentStore.currentMonth))
const monthLabel = computed(() => currentMonthDate.value.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }))
const selectedDate = computed(() => assessmentStore.selectedDate)
const selectedDayAssessments = computed(() => assessmentStore.selectedDateAssessments)
const scheduledAssessments = computed(() => assessmentStore.scheduledAssessments)
const classLevelOptions = computed(() => assessmentStore.classLevelOptions)
const sessionOptions = computed(() => assessmentStore.sessionOptions)
const classArmOptions = computed(() => classArmsStore.classArms.map((arm) => ({ label: arm.name || arm.title || arm.label || `Arm ${arm.id}`, value: arm.id })))
const activeTermLabel = computed(() => assessmentStore.activeTermLabel)
const hasSubmissionConfig = computed(() => !!assessmentStore.selectedAssessment?.schedule_id)
const submissionConfigStatus = computed(() => hasSubmissionConfig.value ? 'Configured' : 'Not configured')

const formatLocalDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return ''
  return new Date(`${selectedDate.value}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
})
const selectedWeekday = computed(() => {
  if (!selectedDate.value) return ''
  return new Date(`${selectedDate.value}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long' })
})

// Map every date a scheduled assessment's window touches (scheduled_date
// through assessment_ends, inclusive) to that assessment's color, so a
// multi-day window gets a consistent tint across its full range — not just
// on the day it was created.
const dateRangeTints = computed(() => {
  const map = {}
  for (const assessment of assessmentStore.scheduledAssessments) {
    const color = scheduleColor(assessment)
    const keys = getDateRangeKeys(assessment.scheduled_date, assessment.assessment_ends)
    for (const key of keys) {
      if (!map[key]) map[key] = hexToRgb(color)
    }
  }
  return map
})

const calendarCells = computed(() => {
  const monthStart = new Date(currentMonthDate.value.getFullYear(), currentMonthDate.value.getMonth(), 1)
  const startDay = (monthStart.getDay() + 6) % 7
  const gridStart = new Date(monthStart)
  gridStart.setDate(monthStart.getDate() - startDay)
  const cells = []
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + i)
    const dateKey = formatLocalDateKey(date)
    const assessments = assessmentStore.scheduledAssessments.filter((item) => formatLocalDateKey(item.scheduled_date) === dateKey)
    cells.push({
      key: dateKey,
      dateKey,
      date,
      day: date.getDate(),
      label: date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      isCurrentMonth: date.getMonth() === monthStart.getMonth(),
      isToday: dateKey === formatLocalDateKey(today),
      assessments,
      previewAssessments: assessments.slice(0, 2),
      moreCount: Math.max(0, assessments.length - 2),
      tintColor: dateRangeTints.value[dateKey] || '',
    })
  }
  return cells
})

const isSelected = (dateKey) => selectedDate.value === dateKey

const resetErrors = () => {
  Object.keys(errors).forEach((key) => delete errors[key])
  saveError.value = ''
}
const resetSubmissionErrors = () => {
  Object.keys(submissionErrors).forEach((key) => delete submissionErrors[key])
  submissionSaveError.value = ''
}

const goToday = () => {
  const now = new Date()
  assessmentStore.setCurrentMonth(now)
  assessmentStore.selectDate(now)
}

const shiftMonth = (delta) => {
  const next = new Date(currentMonthDate.value)
  next.setMonth(next.getMonth() + delta)
  assessmentStore.setCurrentMonth(next)
}

const loadAssessmentIntoForm = (assessment) => {
  form.id = assessment?.id || ''
  form.title = assessment?.title || ''
  form.description = assessment?.description || ''
  form.total_marks = assessment?.total_marks ?? assessment?.totalMarks ?? ''
  form.class_level_id = assessment?.class_level_id ?? assessment?.classLevelId ?? ''
  form.class_arm_id = assessment?.class_arm_id ?? assessment?.classArmId ?? ''
  form.session_id = assessment?.session_id ?? assessment?.sessionId ?? ''
  form.scheduled_date = assessment?.scheduled_date || assessment?.scheduledDate || selectedDate.value || ''

  submission.question_submission_ends = assessment?.question_submission_ends || ''
  submission.assessment_starts = assessment?.assessment_starts || ''
  submission.assessment_ends = assessment?.assessment_ends || ''
}

const clearFormForDate = (dateKey) => {
  loadAssessmentIntoForm({ scheduled_date: dateKey })
  form.id = ''
  form.title = ''
  form.description = ''
  form.total_marks = ''
  form.class_level_id = ''
  form.class_arm_id = ''
  form.session_id = ''
}

const selectCell = async (cell) => {
  assessmentStore.selectDate(cell.dateKey)
  const existing = cell.assessments[0] || null
  if (existing) {
    assessmentStore.selectAssessment(existing.id)
    loadAssessmentIntoForm(existing)
  } else {
    assessmentStore.selectAssessment(null)
    clearFormForDate(cell.dateKey)
  }
  if (form.class_level_id) await classArmsStore.fetchClassArms(form.class_level_id)
}

const openAssessment = async (assessment) => {
  assessmentStore.selectAssessment(assessment.id)
  assessmentStore.selectDate(assessment.scheduled_date || assessment.scheduledDate || today)
  loadAssessmentIntoForm(assessment)
  if (form.class_level_id) await classArmsStore.fetchClassArms(form.class_level_id)
}

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
  if (!submission.assessment_starts) submissionErrors.assessment_starts = 'This field is required.'
  if (!submission.assessment_ends) submissionErrors.assessment_ends = 'This field is required.'
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
      scheduled_date: selectedDate.value || form.scheduled_date,
      question_submission_ends: form.question_submission_ends || null,
      assessment_starts: form.assessment_starts || null,
      assessment_ends: form.assessment_ends || null,
      question_submission_status: 'open',
      assessment_status: 'pending',
    }
    const record = form.id
      ? await assessmentStore.saveScheduledAssessment(form.id, payload)
      : await assessmentStore.createScheduledAssessment(payload)
    loadAssessmentIntoForm(record)
    assessmentStore.selectAssessment(record.id)
  } catch (error) {
    saveError.value = error?.message || 'Unable to save assessment.'
  } finally {
    savingAssessment.value = false
  }
}

const saveSubmissionConfig = async () => {
  if (!validateSubmission()) return
  if (!form.id) return
  savingSubmission.value = true
  try {
    await assessmentStore.saveSubmissionConfiguration(form.id, {
      question_submission_ends: submission.question_submission_ends,
      assessment_starts: submission.assessment_starts,
      assessment_ends: submission.assessment_ends,
      question_submission_status: 'open',
      assessment_status: 'pending',
    })
  } catch (error) {
    submissionSaveError.value = error?.message || 'Unable to save submission configuration.'
  } finally {
    savingSubmission.value = false
  }
}

const continueToSubmissionSetup = () => {
  if (!form.id) return
  router.push(`/school-admin/assessment-submissions/${form.id}`)
}

const questionSubmissionStatusLabel = (assessment) => ((assessment?.question_submission_status || 'open') === 'open' ? 'Question submission open' : 'Question submission closed')
const assessmentStatusLabel = (assessment) => getAssessmentStatusLabel(assessment?.assessment_status || assessment?.status)
const submissionStatusVariant = (assessment) => ((assessment?.question_submission_status || 'open') === 'open' ? 'success' : 'default')

watch(selectedDate, (value) => {
  if (!value) return
  if (!assessmentStore.selectedAssessmentId) {
    clearFormForDate(value)
  }
})

onMounted(async () => {
  await Promise.all([
    sessionsStore.fetchSessions().catch(() => {}),
    assessmentStore.fetchRefData(),
    assessmentStore.fetchAssessments(),
  ])
  assessmentStore.setCurrentMonth(new Date())
})
</script>
