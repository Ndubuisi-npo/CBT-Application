<template>
  <div class="space-y-6">
    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-wrap items-end justify-between gap-4 bg-gradient-to-r from-[#0B1F3A] to-[#0B1F3A]/80 px-5 pb-5 pt-6 sm:px-6">
        <div class="flex items-end gap-4">
          <div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-emerald-50 text-xl font-bold text-emerald-700 shadow-sm">
            {{ studentInitials }}
          </div>
          <div class="pb-1">
            <h1 class="text-xl font-semibold tracking-tight text-white">Result Detail</h1>
            <p class="mt-0.5 text-sm text-slate-200">{{ studentName || 'Student' }}</p>
          </div>
        </div>
        <div class="flex shrink-0 flex-wrap items-center gap-2 pb-1">
          <AppButton text="Back to History" variant="outline" size="sm" @click="router.push({ name: 'TeacherStudentHistory', params: { studentId } })" />
        </div>
      </div>
      <div class="px-5 pb-5 sm:px-6">
        <div class="mt-4 flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center rounded-full bg-[#0B1F3A]/8 px-2.5 py-0.5 text-xs font-semibold text-[#0B1F3A]">
            {{ examTitle }}
          </span>
        </div>
        <div class="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3 lg:grid-cols-4">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Admission</p>
            <p class="mt-0.5 truncate text-sm font-medium text-slate-700">{{ admissionNumber || 'N/A' }}</p>
          </div>
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Class</p>
            <p class="mt-0.5 truncate text-sm font-medium text-slate-700">{{ studentClass || 'N/A' }}</p>
          </div>
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Subject</p>
            <p class="mt-0.5 truncate text-sm font-medium text-slate-700">{{ examSubject || 'N/A' }}</p>
          </div>
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
            <p class="mt-0.5 truncate text-sm font-medium text-slate-700 capitalize">{{ result?.status || 'Graded' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <template v-if="loading">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <div class="h-6 w-64 animate-pulse rounded bg-slate-100" />
        <div class="grid gap-4 sm:grid-cols-3">
          <div v-for="i in 6" :key="i" class="h-20 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    </template>

    <!-- Error -->
    <div v-else-if="loadError" class="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
      {{ loadError }}
      <button class="ml-2 font-semibold underline" @click="loadDetail">Retry</button>
    </div>

    <template v-else-if="result">
      <!-- Student info card -->
      <div class="rounded-2xl border border-slate-200 bg-white p-6">
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Student Information</p>
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0B1F3A]/10 text-xl font-bold text-[#0B1F3A]">
            {{ studentInitials }}
          </div>
          <div class="grid gap-2 sm:grid-cols-3 flex-1">
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs text-slate-400">Name</p>
              <p class="mt-0.5 text-sm font-semibold text-slate-900">{{ studentName }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs text-slate-400">Admission No.</p>
              <p class="mt-0.5 text-sm font-semibold text-slate-900">{{ admissionNumber || 'N/A' }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs text-slate-400">Class</p>
              <p class="mt-0.5 text-sm font-semibold text-slate-900">{{ studentClass || 'N/A' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Exam information + score summary -->
      <div class="rounded-2xl border border-slate-200 bg-white p-6">
        <div class="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">Exam Information</p>
            <h2 class="text-xl font-semibold text-slate-900">{{ examTitle }}</h2>
            <p class="text-sm text-slate-500 mt-1">{{ examSubject }}</p>
          </div>
          <div class="text-right">
            <p class="text-3xl font-bold" :class="scoreColorClass(percentage)">
              {{ percentage != null ? `${percentage}%` : 'N/A' }}
            </p>
            <p class="text-sm text-slate-500">{{ totalScore }} / {{ totalMarks }} marks</p>
            <p class="mt-1 text-lg font-semibold text-slate-700">{{ result.grade || 'N/A' }}</p>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs text-slate-400">Attempt</p>
            <p class="mt-0.5 text-sm font-semibold text-slate-900">#{{ result.attempt_number ?? 1 }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs text-slate-400">Submitted</p>
            <p class="mt-0.5 text-sm font-semibold text-slate-900">{{ fmtDate(result.submitted_at || result.completed_at) || 'N/A' }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs text-slate-400">Time Spent</p>
            <p class="mt-0.5 text-sm font-semibold text-slate-900">{{ fmtDuration(result.time_spent_seconds) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs text-slate-400">Status</p>
            <p class="mt-0.5 text-sm font-semibold text-slate-900 capitalize">{{ result.status || 'Graded' }}</p>
          </div>
        </div>
      </div>

      <!-- Score statistics -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
          <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Score</p>
          <p class="mt-2 text-2xl font-bold text-slate-900">{{ totalScore }} / {{ totalMarks }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
          <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Correct</p>
          <p class="mt-2 text-2xl font-bold text-emerald-600">{{ correctCount }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
          <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Wrong</p>
          <p class="mt-2 text-2xl font-bold text-red-600">{{ wrongCount }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
          <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Skipped</p>
          <p class="mt-2 text-2xl font-bold text-slate-500">{{ skippedCount }}</p>
        </div>
      </div>

      <!-- Question breakdown -->
      <div v-if="questions.length" class="space-y-4">
        <h2 class="text-lg font-semibold text-slate-900">Question Breakdown</h2>
        <QuestionReviewCard
          v-for="(q, idx) in questions"
          :key="q.id || idx"
          :number="idx + 1"
          :question="q"
        />
      </div>

      <div v-else class="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        No question detail available for this attempt.
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '../../shared/AppButton.vue'
import QuestionReviewCard from '../../shared/QuestionReviewCard.vue'
import { getAttemptResultDetailForTeacher } from '../services/api/teacherStudentResults'
import { getStudents } from '../../schooladmincomponents/services/api/students'
import { fmtDate } from '../../../js/lib/helpers'
import { scoreColorClass, fmtDuration } from '../../../types/question'

const route = useRoute()
const router = useRouter()
const studentId = route.params.studentId
const examId = route.params.examId
const attemptId = route.params.attemptId

const result = ref(null)
const student = ref(null)
const loading = ref(false)
const loadError = ref('')

// ── Student info ──────────────────────────────────────────────────────────────
const studentName = computed(() => {
  if (!student.value) return result.value?.student?.name || result.value?.student_name || 'Student'
  const fn = student.value.first_name || student.value.user?.first_name || ''
  const ln = student.value.last_name || student.value.user?.last_name || ''
  return `${fn} ${ln}`.trim() || 'Student'
})

const studentInitials = computed(() => {
  const name = studentName.value
  const parts = name.split(' ')
  return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase() || '?'
})

const admissionNumber = computed(() => {
  const sp = student.value?.studentProfile || student.value?.student_profile
  return sp?.admission_number || result.value?.student?.admission_number || ''
})

const studentClass = computed(() => {
  const sp = student.value?.studentProfile || student.value?.student_profile
  return sp?.class_arm?.name || sp?.class_name || result.value?.student?.class || ''
})

// ── Exam info ─────────────────────────────────────────────────────────────────
const examTitle = computed(() => result.value?.exam?.title || result.value?.exam_title || 'Exam Result')
const examSubject = computed(() => result.value?.exam?.subject?.name || result.value?.subject?.name || result.value?.subject || '')
const totalScore = computed(() => result.value?.total_score ?? result.value?.score ?? 0)
const totalMarks = computed(() => result.value?.total_marks ?? result.value?.exam?.total_marks ?? 'N/A')
const percentage = computed(() => result.value?.percentage_score ?? result.value?.percentage ?? null)

// ── Questions ─────────────────────────────────────────────────────────────────
const questions = computed(() => {
  const r = result.value
  return Array.isArray(r?.questions) ? r.questions
    : Array.isArray(r?.items) ? r.items
    : Array.isArray(r?.answers) ? r.answers
    : []
})

const correctCount = computed(() =>
  questions.value.filter((q) => q?.is_correct === true || q?.correct === true || (q?.marks_awarded != null && q.marks_awarded > 0)).length,
)
const wrongCount = computed(() =>
  questions.value.filter((q) => q?.is_correct === false || (q?.marks_awarded != null && q.marks_awarded === 0)).length,
)
const skippedCount = computed(() => {
  return questions.value.filter((q) => {
    const hasNoSelection = !Array.isArray(q?.selected_option_ids) && !q?.selected_option_ids?.length && 
                           !Array.isArray(q?.selected_options) && !q?.selected_options?.length && 
                           !q?.text_answer
    return hasNoSelection
  }).length
})

// ── Load ──────────────────────────────────────────────────────────────────────
const loadDetail = async () => {
  loading.value = true
  loadError.value = ''
  try {
    result.value = await getAttemptResultDetailForTeacher(examId, attemptId)
  } catch (err) {
    loadError.value = err?.message || 'Failed to load result details.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const allStudents = await getStudents({})
    const list = Array.isArray(allStudents) ? allStudents : (allStudents?.data || allStudents?.students || [])
    student.value = list.find((s) => String(s.id) === String(studentId)) || null
  } catch {
    // Non-critical
  }
  await loadDetail()
})
</script>
