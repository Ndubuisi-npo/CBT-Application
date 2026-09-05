<template>
  <div class="min-h-screen bg-slate-50 px-4 py-8">
    <div class="mx-auto max-w-4xl space-y-6">

      <!-- Back -->
      <button
        class="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-800"
        @click="router.push({ name: 'StudentResultsList' })"
      >
        <ArrowLeft class="h-3.5 w-3.5" /> Back to Results
      </button>

      <!-- Loading skeleton -->
      <template v-if="loading">
        <div class="rounded-2xl border border-slate-200 bg-white p-6">
          <div class="space-y-4">
            <div class="h-6 w-64 animate-pulse rounded bg-slate-100" />
            <div class="grid gap-4 sm:grid-cols-3">
              <div v-for="i in 3" :key="i" class="h-20 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </div>
        </div>
        <div class="space-y-4">
          <div v-for="i in 3" :key="i" class="h-36 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </template>

      <!-- Error -->
      <div v-else-if="loadError" class="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {{ loadError }}
        <button class="ml-2 font-semibold underline" @click="loadDetail">Retry</button>
      </div>

      <template v-else-if="result">
        <!-- Summary header -->
        <div class="rounded-2xl border border-slate-200 bg-white p-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">Result Details</p>
              <h1 class="mt-1 text-2xl font-semibold text-slate-900">{{ examTitle }}</h1>
              <p class="mt-1 text-sm text-slate-500">{{ examSubject }}</p>
            </div>
            <div class="flex flex-wrap items-end justify-end gap-4 text-right">
              <button
                class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="downloading"
                @click="downloadPdf"
              >
                {{ downloading ? 'Downloading...' : 'Download PDF' }}
              </button>
              <div>
              <p class="text-3xl font-bold" :class="scoreColorClass(percentage)">
                {{ percentage != null ? `${percentage}%` : 'N/A' }}
              </p>
              <p class="text-sm text-slate-500">{{ totalScore }} / {{ totalMarks }} marks</p>
              <p class="mt-1 text-lg font-semibold text-slate-700">{{ grade }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Stat cards -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div class="rounded-2xl border border-slate-200 bg-white p-5">
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Score</p>
            <p class="mt-2 text-2xl font-bold text-slate-900">{{ totalScore }} / {{ totalMarks }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-5">
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Percentage</p>
            <p class="mt-2 text-2xl font-bold" :class="scoreColorClass(percentage)">
              {{ percentage != null ? `${percentage}%` : 'N/A' }}
            </p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-5">
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Grade</p>
            <p class="mt-2 text-2xl font-bold text-slate-900">{{ grade }}</p>
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
          <div class="rounded-2xl border border-slate-200 bg-white p-5">
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Time Spent</p>
            <p class="mt-2 text-2xl font-bold text-slate-900">{{ fmtDuration(result.time_spent_seconds) }}</p>
          </div>
        </div>

        <!-- Exam info card -->
        <div class="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 class="mb-4 text-sm font-semibold text-slate-900">Exam Information</h2>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs text-slate-400">Attempt</p>
              <p class="mt-0.5 text-sm font-semibold text-slate-900">#{{ result.attempt_number ?? result.attemptNumber ?? 1 }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs text-slate-400">Submitted</p>
              <p class="mt-0.5 text-sm font-semibold text-slate-900">{{ fmtDate(result.submitted_at || result.completed_at) || 'N/A' }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs text-slate-400">Status</p>
              <p class="mt-0.5 text-sm font-semibold text-slate-900 capitalize">{{ result.status || 'Graded' }}</p>
            </div>
          </div>
        </div>

        <!-- Question review -->
        <div v-if="questions.length" class="space-y-4">
          <h2 class="text-lg font-semibold text-slate-900">Question Review</h2>
          <QuestionReviewCard
            v-for="(q, idx) in questions"
            :key="q.id || idx"
            :number="idx + 1"
            :question="q"
          />
        </div>

        <div v-else class="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No question detail available for this result.
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import QuestionReviewCard from '../../shared/QuestionReviewCard.vue'
import { getAttemptResultDetail } from '../services/api/studentResults'
import { fmtDate } from '../../../js/lib/helpers'
import { scoreColorClass, fmtDuration } from '../../../types/question'
import { downloadAttemptResultPdf, saveBlobAsPdf } from '../../shared/services/resultPdf'

const route = useRoute()
const router = useRouter()
const attemptId = route.params.attemptId

const result = ref(null)
const loading = ref(false)
const loadError = ref('')
const downloading = ref(false)

// ── Derived ───────────────────────────────────────────────────────────────────
const examTitle = computed(() => result.value?.exam?.title || result.value?.exam_title || 'Exam Result')
const examSubject = computed(() => result.value?.exam?.subject?.name || result.value?.subject?.name || result.value?.subject || '')
const totalScore = computed(() => result.value?.total_score ?? result.value?.score ?? 0)
const totalMarks = computed(() => result.value?.total_marks ?? result.value?.exam?.total_marks ?? 'N/A')
const percentage = computed(() => result.value?.percentage_score ?? result.value?.percentage ?? null)

const questions = computed(() => {
  const r = result.value
  return Array.isArray(r?.questions) ? r.questions
    : Array.isArray(r?.items) ? r.items
    : Array.isArray(r?.answers) ? r.answers
    : []
})

const grade = computed(() => {
  const pct = percentage.value
  if (pct == null) return result.value?.grade || 'N/A'
  if (pct >= 70) return 'A'
  if (pct >= 60) return 'B'
  if (pct >= 50) return 'C'
  if (pct >= 40) return 'D'
  return 'F'
})

const correctCount = computed(() =>
  questions.value.filter((q) => q?.is_correct === true || q?.correct === true || (q?.marks_awarded != null && Number(q.marks_awarded) > 0)).length,
)
const wrongCount = computed(() =>
  questions.value.filter((q) => q?.is_correct === false || q?.correct === false || (q?.marks_awarded != null && Number(q.marks_awarded) === 0)).length,
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
    result.value = await getAttemptResultDetail(attemptId)
  } catch (err) {
    loadError.value = err?.message || 'Failed to load result details.'
  } finally {
    loading.value = false
  }
}

const downloadPdf = async () => {
  downloading.value = true
  try {
    const blob = await downloadAttemptResultPdf(attemptId)
    saveBlobAsPdf(blob, `student-result-${attemptId}.pdf`)
  } catch (err) {
    loadError.value = err?.message || 'Failed to download the result PDF.'
  } finally {
    downloading.value = false
  }
}

onMounted(loadDetail)
</script>
