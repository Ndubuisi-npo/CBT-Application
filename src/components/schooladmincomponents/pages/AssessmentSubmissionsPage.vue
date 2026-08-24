<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Assessment Submissions"
      subtitle="Review scheduled assessments and add or edit their submission configuration."
      eyebrow="Assessment Management"
    />

    <section class="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-[10px] uppercase tracking-[0.22em] text-slate-500">
            <tr>
              <th class="px-5 py-3">Assessment</th>
              <th class="px-5 py-3">Class</th>
              <th class="px-5 py-3">Session</th>
              <th class="px-5 py-3">Term</th>
              <th class="px-5 py-3">Submission Status</th>
              <th class="px-5 py-3">Assessment Status</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-if="!assessmentRows.length">
              <td colspan="7" class="px-5 py-12 text-center text-slate-500">No scheduled assessments yet.</td>
            </tr>
            <tr v-for="assessment in assessmentRows" :key="assessment.id" class="hover:bg-slate-50">
              <td class="px-5 py-4">
                <p class="font-semibold text-slate-900">{{ assessment.title }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ assessment.description || 'No description provided.' }}</p>
                <p class="mt-1 text-xs text-slate-500">Marks: {{ assessment.total_marks ?? '—' }}</p>
              </td>
              <td class="px-5 py-4 text-slate-600">{{ classText(assessment) }}</td>
              <td class="px-5 py-4 text-slate-600">{{ sessionName(assessment) }}</td>
              <td class="px-5 py-4 text-slate-600">{{ termName(assessment) }}</td>
              <td class="px-5 py-4"><AppBadge :label="questionSubmissionStatusLabel(assessment)" :variant="questionSubmissionVariant(assessment)" /></td>
              <td class="px-5 py-4"><AppBadge :label="assessmentStatusLabel(assessment)" :variant="assessmentVariant(assessment)" /></td>
              <td class="px-5 py-4">
                <div class="flex flex-wrap justify-end gap-2">
                  <AppButton :text="assessment.schedule_id ? 'Edit Submission' : 'Add Submission'" variant="primary" size="sm" @click="editAssessment(assessment)" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="selectedAssessment" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Selected assessment</p>
            <h2 class="mt-1 text-2xl font-semibold text-slate-900">{{ selectedAssessment.title }}</h2>
          </div>
          <AppButton text="Back to schedule" variant="outline" size="sm" @click="router.push('/school-admin/assessment-schedule')" />
        </div>
        <p class="mt-2 text-sm text-slate-500">{{ selectedAssessment.description || 'No description provided.' }}</p>
        <div class="mt-4 flex flex-wrap gap-2">
          <AppBadge :label="questionSubmissionStatusLabel(selectedAssessment)" :variant="questionSubmissionVariant(selectedAssessment)" />
          <AppBadge :label="assessmentStatusLabel(selectedAssessment)" :variant="assessmentVariant(selectedAssessment)" />
          <AppBadge :label="selectedTermLabel" variant="primary" />
        </div>
      </div>

      <form class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="saveSubmission">
        <h3 class="text-lg font-semibold text-slate-900">{{ selectedAssessment.schedule_id ? 'Edit Submission' : 'Add Submission' }}</h3>
        <div class="mt-4 space-y-4">
          <AppInput v-model="form.question_submission_ends" label="question_submission_ends" type="datetime-local" required :error="errors.question_submission_ends" />
          <AppInput v-model="form.assessment_starts" label="assessment_starts" type="datetime-local" required :error="errors.assessment_starts" />
          <AppInput v-model="form.assessment_ends" label="assessment_ends" type="datetime-local" required :error="errors.assessment_ends" />
        </div>
        <div class="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <p><span class="font-semibold text-slate-900">question_submission_status:</span> {{ questionSubmissionStatusLabel(selectedAssessment) }}</p>
          <p class="mt-1"><span class="font-semibold text-slate-900">assessment_status:</span> {{ assessmentStatusLabel(selectedAssessment) }}</p>
          <p class="mt-1"><span class="font-semibold text-slate-900">term:</span> {{ selectedTermLabel }}</p>
        </div>
        <p v-if="saveError" class="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ saveError }}</p>
        <div class="mt-4 flex flex-wrap gap-2">
          <AppButton :text="selectedAssessment.schedule_id ? 'Update Submission' : 'Create Submission'" variant="primary" :processing="saving" type="submit" />
          <AppButton text="Continue to Submission Setup" variant="outline" @click="router.push(`/school-admin/assessment-submissions/${selectedAssessment.id}`)" />
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppInput from '../../shared/AppInput.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import { useAssessmentsStore, getAssessmentStatusLabel, getStatusVariant } from '../stores/assessments'

const route = useRoute()
const router = useRouter()
const store = useAssessmentsStore()
const saving = ref(false)
const saveError = ref('')
const errors = reactive({})

const form = reactive({ question_submission_ends: '', assessment_starts: '', assessment_ends: '' })

const assessmentRows = computed(() => store.scheduledAssessments)
const selectedAssessment = computed(() => store.selectedAssessment || store.getAssessmentById(route.params.assessmentId || route.params.id))
const selectedTermLabel = computed(() => store.activeTermLabel)

const classText = (assessment) => {
  const level = store.classLevelOptions.find((option) => String(option.value) === String(assessment.class_level_id ?? assessment.classLevelId))?.label || '—'
  const arm = assessment.class_arm_id ?? assessment.classArmId
    ? store.classArmOptions.find((option) => String(option.value) === String(assessment.class_arm_id ?? assessment.classArmId))?.label || ''
    : 'Whole level'
  return `${level} · ${arm}`
}
const sessionName = (assessment) => store.sessionOptions.find((option) => String(option.value) === String(assessment.session_id ?? assessment.sessionId))?.label || '—'
const termName = (assessment) => store.activeTermLabel || assessment.term?.name || '—'

const questionSubmissionStatusLabel = (assessment) => ((assessment?.question_submission_status || 'open') === 'open' ? 'Question submission open' : 'Question submission closed')
const questionSubmissionVariant = (assessment) => ((assessment?.question_submission_status || 'open') === 'open' ? 'success' : 'default')
const assessmentVariant = (assessment) => getStatusVariant(assessment?.assessment_status || assessment?.status)
const assessmentStatusLabel = (assessment) => getAssessmentStatusLabel(assessment?.assessment_status || assessment?.status)

const clearErrors = () => {
  Object.keys(errors).forEach((key) => delete errors[key])
  saveError.value = ''
}

const validate = () => {
  clearErrors()
  if (!form.question_submission_ends) errors.question_submission_ends = 'Required.'
  if (!form.assessment_starts) errors.assessment_starts = 'Required.'
  if (!form.assessment_ends) errors.assessment_ends = 'Required.'
  const q = new Date(form.question_submission_ends)
  const s = new Date(form.assessment_starts)
  const e = new Date(form.assessment_ends)
  if (form.question_submission_ends && form.assessment_starts && s < q) errors.assessment_starts = 'Must be after question submission ends.'
  if (form.assessment_starts && form.assessment_ends && e <= s) errors.assessment_ends = 'Must be after assessment starts.'
  return !Object.keys(errors).length
}

const editAssessment = (assessment) => {
  store.selectAssessment(assessment.id)
  form.question_submission_ends = assessment.question_submission_ends || ''
  form.assessment_starts = assessment.assessment_starts || ''
  form.assessment_ends = assessment.assessment_ends || ''
}

const saveSubmission = async () => {
  if (!selectedAssessment.value || !validate()) return
  saving.value = true
  try {
    await store.saveSubmissionConfiguration(selectedAssessment.value.id, { ...form, question_submission_status: 'open', assessment_status: 'pending' })
  } catch (error) {
    saveError.value = error?.message || 'Unable to save submission configuration.'
  } finally {
    saving.value = false
  }
}

watch(selectedAssessment, (assessment) => {
  if (!assessment) return
  store.selectAssessment(assessment.id)
  form.question_submission_ends = assessment.question_submission_ends || ''
  form.assessment_starts = assessment.assessment_starts || ''
  form.assessment_ends = assessment.assessment_ends || ''
}, { immediate: true })

onMounted(async () => {
  await Promise.all([store.fetchRefData(), store.fetchAssessments()])
  if (route.params.assessmentId) {
    const assessment = store.getAssessmentById(route.params.assessmentId)
    if (assessment) editAssessment(assessment)
  }
})
</script>
