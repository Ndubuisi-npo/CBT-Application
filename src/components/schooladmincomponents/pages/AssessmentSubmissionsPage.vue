<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Teacher Submissions"
      subtitle="Review the papers teachers have built for this assessment."
      eyebrow="Assessment Management"
    >
      <template #actions>
        <AppButton text="Back to assessments" variant="outline" size="sm" @click="router.push('/school-admin/assessments')" />
      </template>
    </AppPageHeader>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="min-w-0">
          <div class="flex items-center gap-3">
            <p class="font-semibold text-slate-900">{{ assessment?.title }}</p>
            <AppBadge v-if="assessment" :label="getAssessmentStatusLabel(assessment)" :variant="getStatusVariant(assessment.status)" />
          </div>
          <p class="mt-1 text-xs text-slate-500">{{ classText }} • Marks cap {{ assessmentTotalMarks }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <AppButton
            v-for="action in lifecycleActions"
            :key="action.key"
            :text="action.label"
            :variant="action.variant"
            size="sm"
            :processing="transitioning === action.key"
            @click="action.onClick"
          />
        </div>
      </div>
      <p v-if="assessment && (assessment.status || '').toLowerCase() === 'submissions_closed' && !approvedCount" class="mt-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">
        No submission has been approved yet — activation requires at least one.
      </p>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div v-if="store.loading && !submissions.length" class="p-2">
        <SkeletonRows :rows="5" :columns="6" />
      </div>
      <div v-else-if="!submissions.length" class="rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center text-sm text-slate-500">
        No teacher submissions have been created for this assessment yet.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-[10px] uppercase tracking-[0.22em] text-slate-500">
            <tr>
              <th class="px-5 py-3">Teacher</th>
              <th class="px-5 py-3">Subject</th>
              <th class="px-5 py-3">Total Marks</th>
              <th class="px-5 py-3">Submitted</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-for="submission in submissions" :key="submission.id" class="group hover:bg-slate-50">
              <td class="px-5 py-4">{{ teacherName(submission) }}</td>
              <td class="px-5 py-4">{{ subjectName(submission) }}</td>
              <td class="px-5 py-4">{{ submission.total_marks ?? submission.totalMarks ?? 0 }}</td>
              <td class="px-5 py-4">{{ formatDate(submission.submitted_at) }}</td>
              <td class="px-5 py-4"><AppBadge :label="getSubmissionStatusLabel(submission.status)" :variant="getSubmissionStatusVariant(submission.status)" /></td>
              <td class="px-5 py-4">
                <AppButton text="Review" variant="outline" size="sm" @click="viewSubmission(submission)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import { fmtDateTime } from '../../../js/lib/helpers'
import {
  useAssessmentsStore,
  getSubmissionStatusLabel,
  getSubmissionStatusVariant,
  getStatusVariant,
  getAssessmentStatusLabel,
} from '../stores/assessments'

const route = useRoute()
const router = useRouter()
const store = useAssessmentsStore()
const assessmentId = route.params.id
const transitioning = ref(null)

const assessment = computed(() => store.current)
const submissions = computed(() => store.submissions)
const approvedCount = computed(() => submissions.value.filter((s) => (s.status || '').toLowerCase() === 'approved').length)

onMounted(async () => {
  await Promise.all([
    store.fetchRefData(),
    store.fetchAssessment(assessmentId),
    store.fetchSubmissions(assessmentId),
  ])
})

const teacherName = (submission) => {
  const t = submission.teacher || {}
  const first = t.first_name || t.firstName || ''
  const last = t.last_name || t.lastName || ''
  return `${first} ${last}`.trim() || t.name || 'Unknown teacher'
}
const subjectName = (submission) => {
  if (submission.subject?.name) return submission.subject.name
  const subjectId = submission.subject_id ?? submission.subjectId
  return store.subjectOptions.find((o) => String(o.value) === String(subjectId))?.label || 'Unknown subject'
}

const classLevelName = (id) => store.classLevelOptions.find((o) => String(o.value) === String(id))?.label || ''
const classArmName = (id) => store.classArmOptions.find((o) => String(o.value) === String(id))?.label || ''
const classText = computed(() => {
  const a = assessment.value
  if (!a) return '—'
  const levelId = a.class_level_id ?? a.classLevelId
  const armId = a.class_arm_id ?? a.classArmId
  const arm = armId ? ` ${classArmName(armId)}` : ' (whole level)'
  return `${classLevelName(levelId)}${arm}`.trim() || '—'
})
const assessmentTotalMarks = computed(() => assessment.value?.total_marks ?? assessment.value?.totalMarks ?? '—')

const viewSubmission = (submission) => router.push(`/school-admin/assessments/${assessmentId}/submissions/${submission.id}`)

const runTransition = async (key, fn) => {
  transitioning.value = key
  try {
    await fn()
  } catch {
    // Store already surfaced the error toast.
  } finally {
    transitioning.value = null
  }
}

// Same status-gated lifecycle as the assessments list — kept here too so
// admins reviewing submissions don't have to leave the page to activate.
const lifecycleActions = computed(() => {
  const a = assessment.value
  if (!a) return []
  const status = (a.status || '').toLowerCase()
  if (status === 'open') {
    return [{ key: 'close', label: 'Close Submissions', variant: 'outline', onClick: () => runTransition('close', () => store.closeSubmissions(a.id)) }]
  }
  if (status === 'submissions_closed') {
    return [
      {
        key: 'activate',
        label: 'Activate for Students',
        variant: 'primary',
        onClick: () => {
          const start = a.student_starts_at ?? a.studentStartsAt
          const end = a.student_ends_at ?? a.studentEndsAt
          if (!start || !end) {
            window.alert('Set both a student start and end time (edit the assessment) before activating it.')
            return
          }
          if (!window.confirm('Activate this assessment? Every approved submission becomes a live exam for students.')) return
          runTransition('activate', () => store.activateAssessment(a.id))
        },
      },
    ]
  }
  if (status === 'active') {
    return [{ key: 'complete', label: 'Complete', variant: 'primary', onClick: () => runTransition('complete', () => store.completeAssessment(a.id)) }]
  }
  return []
})

const formatDate = (value) => (value ? fmtDateTime(value) : 'N/A')
</script>
