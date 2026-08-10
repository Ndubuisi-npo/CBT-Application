<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Submission Detail"
      subtitle="Review the teacher assessment submission and the questions created for it."
      eyebrow="Assessment Management"
    >
      <template #actions>
        <AppButton text="Back to submissions" variant="outline" size="sm" @click="router.push(`/school-admin/assessments/${assessmentId}/submissions`)" />
      </template>
    </AppPageHeader>

    <div class="grid gap-6 xl:grid-cols-3">
      <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1">
        <h2 class="text-sm font-semibold text-slate-900">Teacher Information</h2>
        <div class="mt-4 space-y-3 text-sm text-slate-600">
          <div><span class="font-semibold text-slate-900">Name:</span> {{ teacherName }}</div>
          <div><span class="font-semibold text-slate-900">Subject:</span> {{ subjectName }}</div>
          <div><span class="font-semibold text-slate-900">Submission:</span> {{ formatDate(submission.submissionDate) }}</div>
          <div><span class="font-semibold text-slate-900">Status:</span> {{ getSubmissionStatusLabel(submission.status) }}</div>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1">
        <h2 class="text-sm font-semibold text-slate-900">Assessment Information</h2>
        <div class="mt-4 space-y-3 text-sm text-slate-600">
          <div><span class="font-semibold text-slate-900">Title:</span> {{ assessment?.title }}</div>
          <div><span class="font-semibold text-slate-900">Class:</span> {{ getClassLevelName(assessment?.classLevelId) }}{{ assessment?.classArmId ? ` ${getClassArmName(assessment.classArmId)}` : '' }}</div>
          <div><span class="font-semibold text-slate-900">Total Marks:</span> {{ assessment?.totalMarks }}</div>
          <div><span class="font-semibold text-slate-900">Due:</span> {{ assessment?.dueDate }} · {{ assessment?.dueTime }}</div>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1">
        <h2 class="text-sm font-semibold text-slate-900">Question Summary</h2>
        <div class="mt-4 space-y-3 text-sm text-slate-600">
          <div><span class="font-semibold text-slate-900">Total Questions:</span> {{ submission.questions.length }}</div>
          <div><span class="font-semibold text-slate-900">Marks Used:</span> {{ totalMarks }}</div>
          <div><span class="font-semibold text-slate-900">Remaining:</span> {{ remainingMarks }}</div>
          <div><span class="font-semibold text-slate-900">Completion:</span> {{ completionPercent }}%</div>
          <p class="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{{ completionText }}</p>
        </div>
      </section>
    </div>

    <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-lg font-semibold text-slate-900">Questions</h2>
      <div class="mt-4 space-y-4">
        <div
          v-for="question in submission.questions"
          :key="question.id"
          class="rounded-2xl border border-slate-100 bg-slate-50 p-5"
        >
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="font-semibold text-slate-900">Question {{ question.number }} • {{ question.type === 'multiple_choice' ? 'Multiple Choice' : question.type === 'true_false' ? 'True / False' : 'Theory' }}</p>
              <p class="mt-2 text-sm text-slate-700">{{ question.text }}</p>
            </div>
            <div class="space-y-1 text-right text-sm text-slate-600">
              <div><span class="font-semibold text-slate-900">Marks:</span> {{ question.marks }}</div>
              <div><span class="font-semibold text-slate-900">Difficulty:</span> {{ question.difficulty }}</div>
            </div>
          </div>

          <div v-if="question.options?.length" class="mt-4 grid gap-2 sm:grid-cols-2">
            <div v-for="option in question.options" :key="option" class="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
              {{ option }}
            </div>
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Correct Answer</p>
              <p class="mt-1 text-sm text-slate-700">{{ question.correctAnswer }}</p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Explanation</p>
              <p class="mt-1 text-sm text-slate-700">{{ question.explanation || 'No explanation provided.' }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '../../shared/AppButton.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import {
  getAssessmentById,
  getSubmissionById,
  getTeacherName,
  getSubjectName,
  getSubmissionStatusLabel,
  getClassLevelName,
  getClassArmName,
} from '../../assessments/mockAssessments'

const route = useRoute()
const router = useRouter()
const assessmentId = route.params.assessmentId
const submissionId = route.params.submissionId
const assessment = ref(getAssessmentById(assessmentId))
const submission = ref(getSubmissionById(assessmentId, submissionId) || { questions: [] })

const teacherName = computed(() => getTeacherName(submission.value.teacherId))
const subjectName = computed(() => getSubjectName(submission.value.subjectId))
const totalMarks = computed(() => submission.value.questions.reduce((sum, q) => sum + q.marks, 0))
const remainingMarks = computed(() => Math.max(0, (assessment.value?.totalMarks || 0) - totalMarks.value))
const completionPercent = computed(() => {
  if (!assessment.value) return 0
  return Math.min(100, Math.round((totalMarks.value / assessment.value.totalMarks) * 100))
})
const completionText = computed(() => {
  if (!assessment.value) return 'No assessment selected.'
  return totalMarks.value >= assessment.value.totalMarks ? 'Assessment Complete' : `Remaining Marks: ${remainingMarks.value}`
})

const formatDate = (value) => {
  if (!value) return 'N/A'
  return new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}
</script>
