<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Teacher Submissions"
      subtitle="Review the teachers who submitted work for this assessment."
      eyebrow="Assessment Management"
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <AppButton text="Back to assessments" variant="outline" size="sm" @click="router.push('/school-admin/assessments')" />
      </template>
    </AppPageHeader>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-6 rounded-2xl bg-slate-50 p-4">
        <p class="text-sm text-slate-600">Assessment</p>
        <p class="mt-1 font-semibold text-slate-900">{{ assessment?.title }}</p>
        <p class="mt-1 text-xs text-slate-500">{{ assessment?.description }}</p>
      </div>

      <div v-if="!submissions.length" class="rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center text-sm text-slate-500">
        No teacher submissions have been created for this assessment yet.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-[10px] uppercase tracking-[0.22em] text-slate-500">
            <tr>
              <th class="px-5 py-3">Teacher</th>
              <th class="px-5 py-3">Subject</th>
              <th class="px-5 py-3">Questions</th>
              <th class="px-5 py-3">Total Marks</th>
              <th class="px-5 py-3">Submission Date</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-for="submission in submissions" :key="submission.id" class="group hover:bg-slate-50">
              <td class="px-5 py-4">{{ getTeacherName(submission.teacherId) }}</td>
              <td class="px-5 py-4">{{ getSubjectName(submission.subjectId) }}</td>
              <td class="px-5 py-4">{{ submission.questions.length }}</td>
              <td class="px-5 py-4">{{ submission.questions.reduce((sum, q) => sum + q.marks, 0) }}</td>
              <td class="px-5 py-4">{{ formatDate(submission.submissionDate) }}</td>
              <td class="px-5 py-4"><AppBadge :label="getSubmissionStatusLabel(submission.status)" :variant="submission.status === 'submitted' ? 'success' : submission.status === 'pending' ? 'warning' : 'default'" /></td>
              <td class="px-5 py-4">
                <AppButton text="View" variant="outline" size="sm" @click="viewSubmission(submission)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import {
  getAssessmentById,
  getSubmissionsByAssessment,
  getTeacherName,
  getSubjectName,
  getSubmissionStatusLabel,
} from '../../assessments/mockAssessments'

const route = useRoute()
const router = useRouter()
const assessmentId = route.params.id
const assessment = ref(getAssessmentById(assessmentId))
const submissions = ref(getSubmissionsByAssessment(assessmentId))

const breadcrumbs = computed(() => [
  { label: 'School Admin', to: '/school-admin/dashboard' },
  { label: 'Assessment Management', to: '/school-admin/assessments' },
  { label: assessment.value?.title || 'Submissions' },
])

const viewSubmission = (submission) => router.push(`/school-admin/assessments/${assessmentId}/submissions/${submission.id}`)

const formatDate = (value) => {
  if (!value) return 'N/A'
  return new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}
</script>
