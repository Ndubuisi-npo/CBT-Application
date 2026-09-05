<template>
  <div class="space-y-6">
    <AppPageHeader
      :title="assessment ? assessment.title : 'View Submissions'"
      subtitle="Review the papers each teacher has built for this assessment, then activate it for students."
      eyebrow="Assessment Management"
    >
      <template #actions>
        <AppButton text="All assessments" variant="outline" size="sm" :icon="ArrowLeft" @click="router.push('/school-admin/assessment-submissions')" />
      </template>
    </AppPageHeader>

    <div v-if="assessment" class="-mt-3 mb-1 flex flex-wrap items-center gap-2">
      <AppBadge :label="getAssessmentStatusLabel(assessment.assessment_status || assessment.status)" :variant="getStatusVariant(assessment.assessment_status || assessment.status)" dot />
      <AppBadge :label="(assessment.question_submission_status || 'open').toLowerCase() === 'open' ? 'Questions open' : 'Questions closed'" :variant="(assessment.question_submission_status || 'open').toLowerCase() === 'open' ? 'success' : 'default'" />
      <AppBadge :label="classText" variant="default" />
    </div>

    <AppEmptyState
      v-if="!assessment && !store.loading"
      :icon="Inbox"
      title="Assessment not found"
      description="This assessment may have been removed from the schedule."
    >
      <template #actions>
        <AppButton text="Back to assessments" variant="outline" @click="router.push('/school-admin/assessment-submissions')" />
      </template>
    </AppEmptyState>

    <template v-if="assessment">
      <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex flex-wrap items-center justify-between gap-5">
          <div class="min-w-0">
            <AppLifecycleTrail :assessment-status="assessmentStatus" :question-submission-status="questionSubmissionStatus" class="mb-4" />
            <p class="text-sm text-slate-500">
              {{ approvedCount }} of {{ submissions.length }} papers approved · questions close {{ formatDate(assessment.submission_closes_at ?? assessment.submissionClosesAt) }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <AppButton
              v-if="canCloseSubmissions"
              text="Close question submissions"
              variant="outline"
              size="sm"
              :processing="closingSubmissions"
              @click="closeSubmissions"
            />
            <AppButton
              v-if="canShowActivate"
              text="Activate assessment"
              variant="success"
              size="sm"
              :disabled="!canActivate"
              :title="!canActivate ? 'Close question submissions before activating this assessment.' : 'Activate assessment for students'"
              :processing="activating"
              @click="activateAssessment"
            />
            <AppButton
              v-if="canPublishResults"
              text="Publish results for students"
              variant="success"
              size="sm"
              :disabled="!assessmentCompleted"
              :title="!assessmentCompleted ? 'Complete the assessment before publishing results.' : 'Publish results for students'"
              :processing="publishingResults"
              @click="publishResults"
            />
            <AppButton
              v-if="assessmentStatus === 'active'"
              text="Force complete"
              variant="outline"
              size="sm"
              :disabled="assessmentStatus !== 'active'"
              title="Force complete the assessment"
              :processing="completingAssessment"
              @click="forceCompleteAssessment"
            />
          </div>
        </div>

        <p v-if="canCloseSubmissions" class="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Teachers can still edit their papers. Close question submissions to lock them before activating.
        </p>
        <p v-if="assessment.student_starts_at" class="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Students can take this assessment from {{ formatDate(assessment.student_starts_at) }} until {{ formatDate(assessment.student_ends_at) }}.
        </p>
        <p v-if="activationError" class="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ activationError }}</p>
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 class="text-sm font-semibold text-slate-900">Teacher papers</h2>
        </div>

        <div v-if="store.loading && !submissions.length" class="p-8 text-center text-sm text-slate-500">Loading submissions…</div>
        <AppEmptyState
          v-else-if="!submissions.length"
          :icon="Inbox"
          title="No teacher papers yet"
          description="Papers will appear here as teachers build their submissions for this assessment."
        />
        <ul v-else class="divide-y divide-slate-100">
          <li v-for="submission in submissions" :key="submission.id">
            <div class="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6">
              <button
                type="button"
                class="flex min-w-0 flex-1 flex-wrap items-center gap-4 text-left transition hover:bg-slate-50"
                @click="viewSubmission(submission)"
              >
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B1F3A]/5 text-xs font-bold text-[#0B1F3A]">
                  {{ initials(teacherName(submission)) }}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-semibold text-slate-900">{{ teacherName(submission) }}</span>
                  <span class="block truncate text-xs text-slate-500">{{ subjectName(submission) }} · {{ submission.title || 'Untitled paper' }}</span>
                </span>
                <span class="hidden text-sm text-slate-600 sm:block">
                  {{ submission.question_count ?? submission.questions_count ?? 0 }} {{ (submission.question_count ?? submission.questions_count) === 1 ? 'question' : 'questions' }}
                </span>
                <span class="hidden w-40 text-xs text-slate-400 lg:block">{{ formatDate(submission.submitted_at) }}</span>
                <AppBadge :label="getSubmissionStatusLabel(submission.status)" :variant="getSubmissionStatusVariant(submission.status)" dot />
              </button>
            </div>
          </li>
        </ul>
      </section>
    </template>

  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Inbox } from 'lucide-vue-next'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppEmptyState from '../../shared/AppEmptyState.vue'
import AppLifecycleTrail from '../../shared/AppLifecycleTrail.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import { fmtDateTime } from '../../../js/lib/helpers'
import { useAssessmentsStore, getAssessmentStatusLabel, getStatusVariant, getSubmissionStatusLabel, getSubmissionStatusVariant } from '../stores/assessments'

const route = useRoute()
const router = useRouter()
const store = useAssessmentsStore()
const assessmentId = route.params.id
const assessment = computed(() => store.current || store.getAssessmentById(assessmentId))
const submissions = computed(() => store.submissions)
const activating = ref(false)
const closingSubmissions = ref(false)
const publishingResults = ref(false)
const completingAssessment = ref(false)
const activationError = ref('')

const questionSubmissionStatus = computed(() => (assessment.value?.question_submission_status || 'open').toLowerCase())
const assessmentStatus = computed(() => (assessment.value?.assessment_status || assessment.value?.status || 'draft').trim().toLowerCase())
const assessmentCompleted = computed(() => assessmentStatus.value === 'completed')
const approvedCount = computed(() => submissions.value.filter((s) => (s.status || '').toLowerCase() === 'approved').length)

const canShowActivate = computed(() => {
  const item = assessment.value
  return item?.schedule_id && assessmentStatus.value === 'draft'
})
const canCloseSubmissions = computed(() => canShowActivate.value && questionSubmissionStatus.value === 'open')
const canActivate = computed(() => {
  const item = assessment.value
  return item?.schedule_id && assessmentStatus.value === 'draft' && questionSubmissionStatus.value === 'closed'
})
const canPublishResults = computed(() => ['active', 'completed'].includes(assessmentStatus.value))

const classText = computed(() => {
  const levelId = assessment.value?.class_level_id ?? assessment.value?.classLevelId
  const armId = assessment.value?.class_arm_id ?? assessment.value?.classArmId
  const level = store.classLevelOptions.find((option) => String(option.value) === String(levelId))?.label || '—'
  const arm = armId ? store.classArmOptions.find((option) => String(option.value) === String(armId))?.label || '' : 'Whole level'
  return `${level} · ${arm}`
})

const teacherName = (submission) => {
  const teacher = submission.teacher || {}
  return `${teacher.first_name || teacher.firstName || ''} ${teacher.last_name || teacher.lastName || ''}`.trim() || teacher.name || 'Unknown teacher'
}
const initials = (name) => (name || '')
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join('') || '—'
const subjectName = (submission) => submission.subject?.name || store.subjectOptions.find((option) => String(option.value) === String(submission.subject_id ?? submission.subjectId))?.label || 'Unknown subject'
const formatDate = (value) => value ? fmtDateTime(value) : 'Not submitted'
const viewSubmission = (submission) => router.push(`/school-admin/assessments/${assessmentId}/submissions/${submission.id}`)

const activateAssessment = async () => {
  if (!canActivate.value || activating.value) return
  if (!window.confirm('Activate this assessment? Approved submissions will become student exams.')) return

  activating.value = true
  activationError.value = ''
  try {
    await store.activateAssessment(assessmentId)
  } catch (error) {
    activationError.value = error?.message || 'Unable to activate assessment. Check the activation prerequisites.'
  } finally {
    activating.value = false
  }
}

const closeSubmissions = async () => {
  if (!canCloseSubmissions.value || closingSubmissions.value) return
  closingSubmissions.value = true
  activationError.value = ''
  try {
    await store.closeSubmissions(assessmentId)
  } catch (error) {
    activationError.value = error?.message || 'Unable to close submissions.'
  } finally {
    closingSubmissions.value = false
  }
}

const publishResults = async () => {
  if (!assessmentCompleted.value || publishingResults.value) return
  if (!window.confirm('Publish assessment results for students?')) return

  publishingResults.value = true
  activationError.value = ''
  try {
    await store.publishAssessmentResults(assessmentId)
  } catch (error) {
    activationError.value = error?.message || 'Unable to publish assessment results for students.'
  } finally {
    publishingResults.value = false
  }
}

const forceCompleteAssessment = async () => {
  if (assessmentStatus.value !== 'active' || completingAssessment.value) return
  if (!window.confirm('Force complete this assessment? Students will no longer be able to take it.')) return

  completingAssessment.value = true
  activationError.value = ''
  try {
    await store.completeAssessment(assessmentId)
  } catch (error) {
    activationError.value = error?.message || 'Unable to force complete this assessment.'
  } finally {
    completingAssessment.value = false
  }
}

onMounted(async () => {
  await Promise.all([store.fetchRefData(), store.fetchAssessment(assessmentId)])
  await store.fetchSubmissions(assessmentId)
})
</script>
