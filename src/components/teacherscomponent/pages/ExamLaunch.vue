<template>
  <div class="space-y-6">
    <!-- Exam Info -->
    <SectionCard :title="exam?.title || 'Loading...'" subtitle="Review and submit your exam for admin approval.">
      <template #header>
        <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="statusClass(exam?.status)">
          {{ exam?.status?.toUpperCase() }}
        </span>
      </template>
      <div class="grid gap-4 pt-6 md:grid-cols-3">
        <div class="rounded-2xl bg-slate-50 p-4 text-sm">
          <p class="text-slate-400 text-xs uppercase tracking-wider">Subject</p>
          <p class="mt-2 font-semibold text-slate-900">{{ displayOrNA(exam?.subject) }}</p>
        </div>
        <div class="rounded-2xl bg-slate-50 p-4 text-sm">
          <p class="text-slate-400 text-xs uppercase tracking-wider">Class</p>
          <p class="mt-2 font-semibold text-slate-900">{{ displayOrNA(exam?.className) }}</p>
        </div>
        <div class="rounded-2xl bg-slate-50 p-4 text-sm">
          <p class="text-slate-400 text-xs uppercase tracking-wider">Duration</p>
          <p class="mt-2 font-semibold text-slate-900">{{ displayOrNA(exam?.duration) }} min</p>
        </div>
      </div>
    </SectionCard>

    <SectionCard title="Exam Actions" subtitle="Submit your exam for review. The school admin will activate it.">
      <div class="space-y-6 pt-6">
        <div class="grid gap-4 md:grid-cols-3">
          <div class="rounded-2xl bg-slate-50 p-4 text-sm">
            <p class="text-slate-400 text-xs uppercase tracking-wider">Status</p>
            <p class="mt-2 font-semibold text-slate-900">{{ exam?.status || 'draft' }}</p>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4 text-sm">
            <p class="text-slate-400 text-xs uppercase tracking-wider">Total Marks</p>
            <p class="mt-2 font-semibold text-slate-900">{{ exam?.total_marks ?? exam?.totalMarks ?? 'N/A' }}</p>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4 text-sm">
            <p class="text-slate-400 text-xs uppercase tracking-wider">Scheduled Start</p>
            <p class="mt-2 font-semibold text-slate-900">{{ formatDate(exam?.scheduled_start) }}</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <AppButton
            v-if="(exam?.status || 'draft').toLowerCase() === 'draft'"
            text="Submit for Review"
            variant="primary"
            :processing="actionProcessing"
            @click="submitExam"
          />


          <AppButton text="← Back to Exams" variant="ghost" @click="$router.push('/teachers/exams')" />
        </div>

        <p v-if="exam?.status === 'active'" class="text-sm text-emerald-700">
          This exam is currently active for students.
        </p>
        <p v-if="exam?.status === 'completed'" class="text-sm text-slate-600">
          The exam has been completed and results can be reviewed in the Exams dashboard.
        </p>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '../../shared/AppButton.vue'
import SectionCard from '../components/SectionCard.vue'
import { useTeacherExamsStore } from '../stores/exams'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { fmtDateTime } from '../../../js/lib/helpers'
import { displayOrNA } from '../../../js/lib/utils'

const route = useRoute()
const router = useRouter()
const store = useTeacherExamsStore()
const ui = useSchoolAdminUiStore()

const examId = route.params.id
const exam = ref(null)
const actionProcessing = ref(false)

const formatDate = (value) => {
  if (!value) return 'Not scheduled'
  return fmtDateTime(value, { timeZone: 'Africa/Lagos' })
}

const loadExam = async () => {
  try {
    exam.value = await store.fetchExam(examId)
  } catch (err) {
    ui.addToast({ title: 'Error', message: err.message || 'Failed to load exam.', variant: 'error' })
  }
}

onMounted(loadExam)

const submitExam = async () => {
  actionProcessing.value = true
  try {
    await store.submitForReview(examId)
    exam.value = await store.fetchExam(examId)
    ui.addToast({ title: 'Submitted', message: 'Exam submitted for review.', variant: 'success' })
  } catch (err) {
    ui.addToast({ title: 'Error', message: err.message || 'Failed to submit exam.', variant: 'error' })
  } finally {
    actionProcessing.value = false
  }
}

</script>
