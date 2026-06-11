<template>
  <div class="space-y-6">
    <div class="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-sm text-slate-500">Student Profile</p>
          <h2 class="mt-2 text-2xl font-semibold text-slate-900">{{ studentName }}</h2>
          <p class="text-sm text-slate-500">{{ user.email || user.username || 'No email available' }}</p>
          <p v-if="studentClass" class="mt-1 text-sm text-slate-500">{{ studentClass }}</p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <AppButton text="Logout" variant="secondary" size="sm" :processing="logoutLoading" loadingText="Logging out..." @click="handleLogout" />
        </div>
      </div>
    </div>

    <!-- Available / Live exams -->
    <SectionCard title="Available Exams" subtitle="Live exams you can take right now.">
      <template #header>
        <AppButton variant="ghost" size="sm" :processing="loading" text="Refresh" @click="loadExams" />
      </template>

      <div v-if="loading && !exams.length" class="space-y-3 pt-6">
        <div v-for="i in 3" :key="i" class="h-24 animate-pulse rounded-[20px] bg-slate-100" />
      </div>

      <div v-else class="pt-6">
        <div v-if="!liveExams.length" class="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No live exams right now. This page automatically checks for new exams.
        </div>

        <div v-else class="grid gap-4 md:grid-cols-2">
          <article
            v-for="exam in liveExams"
            :key="exam.id"
            class="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0 pr-4">
                <div class="flex items-center gap-2">
                  <span class="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 class="truncate text-lg font-semibold text-slate-900">{{ exam.title }}</h3>
                </div>
                <p class="mt-1 text-sm text-slate-500">{{ exam.subject || '—' }} • {{ exam.class_level?.name || '—' }}</p>
                <p class="mt-2 text-sm text-slate-600">Duration: {{ exam.duration || '—' }} min</p>
              </div>
              <div class="flex flex-col items-end gap-2 shrink-0">
                <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Live</span>
                <AppButton text="Start" size="sm" variant="primary" @click="startExam(exam)" />
              </div>
            </div>
          </article>
        </div>
      </div>
    </SectionCard>

    <!-- In-progress attempts -->
    <SectionCard v-if="inProgressAttempts.length" title="Resume Exam" subtitle="You have an in-progress attempt. Click to continue.">
      <div class="grid gap-4 pt-6 md:grid-cols-2">
        <article
          v-for="exam in inProgressAttempts"
          :key="exam.id"
          class="rounded-[20px] border border-amber-200 bg-amber-50/50 p-5"
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-lg font-semibold text-slate-900">{{ exam.title }}</h3>
              <p class="mt-1 text-sm text-slate-500">Exam in progress</p>
            </div>
            <AppButton text="Resume" size="sm" variant="primary" @click="resumeExam(exam)" />
          </div>
        </article>
      </div>
    </SectionCard>

    <!-- Published results -->
    <SectionCard title="My Results" subtitle="Published results you can review.">
      <div v-if="resultsLoading" class="space-y-3 pt-6">
        <div v-for="i in 2" :key="i" class="h-16 animate-pulse rounded-[20px] bg-slate-100" />
      </div>

      <div v-else-if="!publishedResults.length" class="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 pt-6">
        No published results yet.
      </div>

      <div v-else class="space-y-3 pt-6">
        <div
          v-for="result in publishedResults"
          :key="result.attempt_id || result.id"
          class="rounded-[20px] border border-slate-200 bg-white p-5"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 class="font-semibold text-slate-900">{{ getExamTitle(result) }}</h3>
              <p class="mt-1 text-sm text-slate-500">{{ getExamSubject(result) }}</p>
              <p class="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">Attempt {{ result.attempt_number ?? result.attemptNumber ?? 1 }} • {{ result.status || 'Graded' }}</p>
            </div>

            <div class="flex flex-col items-start gap-3 text-left sm:items-end">
              <div>
                <p class="text-2xl font-bold" :class="scoreClass(getPercentage(result))">
                  {{ getPercentage(result) != null ? `${getPercentage(result)}%` : '—' }}
                </p>
                <p class="text-xs text-slate-500">{{ getScore(result) }} / {{ getTotalMarks(result) }}</p>
              </div>
              <AppButton text="View details" size="sm" variant="outline" @click="openResultModal(result)" />
            </div>
          </div>
        </div>
      </div>
    </SectionCard>

    <div v-if="showResultModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div class="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
        <div class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Result details</p>
            <h2 class="mt-1 text-xl font-semibold text-slate-900">{{ getExamTitle(selectedResult) }}</h2>
            <p class="mt-1 text-sm text-slate-500">{{ getExamSubject(selectedResult) }}</p>
          </div>
          <button type="button" class="text-xl font-semibold text-slate-500 hover:text-slate-700" @click="closeResultModal">×</button>
        </div>

        <div class="space-y-4 p-6">
          <div v-if="detailLoading" class="rounded-[20px] border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Loading question results...
          </div>

          <div v-else-if="detailError" class="rounded-[20px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {{ detailError }}
          </div>

          <div v-else>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="rounded-[20px] border border-slate-200 bg-slate-50 p-5">
                <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Score</p>
                <p class="mt-2 text-3xl font-semibold text-slate-900">{{ getScore(selectedResult) }} / {{ getTotalMarks(selectedResult) }}</p>
              </div>
              <div class="rounded-[20px] border border-slate-200 bg-slate-50 p-5">
                <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Result</p>
                <p class="mt-2 text-3xl font-semibold" :class="scoreClass(getPercentage(selectedResult))">{{ getPercentage(selectedResult) != null ? `${getPercentage(selectedResult)}%` : '—' }}</p>
              </div>
            </div>

            <div v-if="!detailQuestions.length" class="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No question detail available for this attempt.
            </div>

            <div v-else class="space-y-4">
              <article
                v-for="(question, index) in detailQuestions"
                :key="question.id || index"
                :class="['rounded-[20px] border p-5', isQuestionCorrect(question) ? 'border-emerald-200 bg-emerald-50/70' : 'border-rose-200 bg-rose-50/70']"
              >
                <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p class="text-sm font-semibold text-slate-900">Question {{ index + 1 }}</p>
                    <p class="mt-2 text-base leading-7 text-slate-900">{{ getQuestionText(question) }}</p>
                  </div>
                  <div class="text-right text-sm">
                    <p :class="isQuestionCorrect(question) ? 'text-emerald-700' : 'text-rose-700'" class="font-semibold">
                      {{ isQuestionCorrect(question) ? 'Correct' : 'Wrong' }}
                    </p>
                  </div>
                </div>

                <div class="mt-4 grid gap-3 sm:grid-cols-2">
                  <div class="rounded-2xl border border-slate-200 bg-white p-4">
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Your answer</p>
                    <p class="mt-2 text-sm text-slate-700">{{ getAnswerText(question, 'selected') || 'No answer' }}</p>
                  </div>
                  <div class="rounded-2xl border border-slate-200 bg-white p-4">
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Correct answer</p>
                    <p class="mt-2 text-sm text-slate-700">{{ getAnswerText(question, 'correct') || 'Not available' }}</p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SectionCard from '../../schooladmincomponents/components/SectionCard.vue'
import AppButton from '../../shared/AppButton.vue'
import { getAvailableExams, getStudentExamAttempt, getAttemptResult } from '../services/api/studentExams'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { getAuthUser, logout } from '../../../js/lib/auth'

const router = useRouter()
const uiStore = useSchoolAdminUiStore()

const exams = ref([])
const loading = ref(false)
const logoutLoading = ref(false)
const publishedResults = ref([])
const resultsLoading = ref(false)
const inProgressAttempts = ref([])
const selectedResult = ref(null)
const selectedResultDetails = ref(null)
const detailLoading = ref(false)
const detailError = ref(null)
const showResultModal = ref(false)
const showProfile = ref(false)

let pollTimer = null

// ── Computed ───────────────────────────────────────────────────────────────

const user = computed(() => getAuthUser() || {})
const studentName = computed(() => {
  const firstName = user.value.first_name || user.value.firstName || ''
  const lastName = user.value.last_name || user.value.lastName || ''
  return (firstName || lastName)
    ? `${firstName} ${lastName}`.trim()
    : user.value.name || user.value.full_name || 'Student'
})


const liveExams = computed(() =>
  exams.value.filter((e) => ['live', 'active'].includes((e.status || '').toLowerCase())),
)

const scoreClass = (pct) => {
  if (pct == null) return 'text-slate-700'
  if (pct >= 70) return 'text-emerald-600'
  if (pct >= 50) return 'text-amber-600'
  return 'text-rose-600'
}

const getExamTitle = (result) => result?.exam?.title || result?.exam_title || result?.title || 'Exam result'
const getExamSubject = (result) => result?.exam?.subject?.name || result?.subject?.name || result?.subject || result?.exam?.subject || ''
const getScore = (result) => result?.total_score ?? result?.score ?? result?.score_obtained ?? 0
const getTotalMarks = (result) => result?.total_marks ?? result?.exam?.total_marks ?? result?.exam?.total_marks ?? '—'
const getPercentage = (result) => result?.percentage_score ?? result?.percentage ?? result?.score_percentage ?? null

const getQuestionText = (question) => {
  const src = question?.question || question
  return src?.content || src?.question_text || src?.text || src?.title || 'Untitled question'
}

const getAnswerText = (question, type) => {
  const selected = question?.selected_answer ?? question?.selected_option ?? question?.selected_option_id ?? question?.selected_option_ids?.[0] ?? question?.answer ?? question?.submitted_answer
  const correct = question?.correct_answer ?? question?.correctOption ?? question?.correct_option_id ?? question?.correct_option_ids?.[0] ?? question?.answer
  if (type === 'selected') {
    if (typeof selected === 'object') return selected?.content || selected?.label || JSON.stringify(selected)
    return selected != null ? String(selected) : ''
  }
  if (typeof correct === 'object') return correct?.content || correct?.label || JSON.stringify(correct)
  return correct != null ? String(correct) : ''
}

const getAttemptQuestions = (detail) => {
  const questions = detail?.questions || detail?.items || detail?.answers || []
  return Array.isArray(questions) ? questions : []
}

const isQuestionCorrect = (question) => {
  if (question?.is_correct === true || question?.correct === true) return true
  const selected = getAnswerText(question, 'selected')
  const correct = getAnswerText(question, 'correct')
  return selected && correct && selected === correct
}

const detailQuestions = computed(() => getAttemptQuestions(selectedResultDetails.value))

// ── Load ───────────────────────────────────────────────────────────────────

const loadExams = async () => {
  loading.value = true
  try {
    const available = await getAvailableExams()
    exams.value = available

    // Check each exam for an in-progress attempt (spec: GET /api/student/exams/{examId}/attempt)
    const attemptChecks = await Promise.allSettled(
      available.map(async (exam) => {
        try {
          const raw = await getStudentExamAttempt(exam.id)
          // Normalise: response may be wrapped as { attempt, questions, ... } or direct attempt
          const attempt = raw?.attempt ?? raw
          // If attempt exists and is in_progress, it's resumable
          if (attempt && attempt.id && (attempt.status === 'in_progress' || attempt.status === 'in-progress')) {
            return exam
          }
        } catch {
          // 404 = no attempt, ignore
        }
        return null
      })
    )
    inProgressAttempts.value = attemptChecks
      .filter((r) => r.status === 'fulfilled' && r.value !== null)
      .map((r) => r.value)
  } catch (err) {
    uiStore.addToast({ title: 'Error', message: 'Failed to load exams.', variant: 'error' })
  } finally {
    loading.value = false
  }
}

const loadResults = async () => {
  resultsLoading.value = true
  try {
    const { apiFetch } = await import('../../../js/lib/api')
    const response = await apiFetch('/api/students/results')
    publishedResults.value = Array.isArray(response) ? response : (response?.data || [])
  } catch {
    publishedResults.value = []
  } finally {
    resultsLoading.value = false
  }
}

const openResultModal = async (result) => {
  selectedResult.value = result
  selectedResultDetails.value = null
  detailError.value = null
  detailLoading.value = true
  showResultModal.value = true

  try {
    const response = await getAttemptResult(result?.id || result?.attempt_id)
    selectedResultDetails.value = Array.isArray(response) ? { questions: response } : (response?.data ?? response)
  } catch (err) {
    detailError.value = err?.message || 'Unable to load question details.'
  } finally {
    detailLoading.value = false
  }
}

const closeResultModal = () => {
  showResultModal.value = false
  selectedResult.value = null
  selectedResultDetails.value = null
  detailError.value = null
}

// ── Navigation ─────────────────────────────────────────────────────────────

const startExam = (exam) => {
  router.push({ name: 'StudentExamInstructions', params: { id: exam.id } })
}

const resumeExam = (exam) => {
  router.push({ name: 'StudentExam', params: { id: exam.id } })
}

const handleLogout = async () => {
  logoutLoading.value = true
  try {
    await logout()
  } finally {
    logoutLoading.value = false
    router.replace({ name: 'Login' })
  }
}

onMounted(async () => {
  await loadExams()
  await loadResults()
})
</script>
