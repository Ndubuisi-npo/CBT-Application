<template>
  <div class="min-h-screen bg-slate-50 px-4 py-8">
    <div class="mx-auto max-w-5xl space-y-6">

      <!-- Page header -->
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            class="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-800"
            @click="router.push({ name: 'StudentDashboard' })"
          >
            <ArrowLeft class="h-3.5 w-3.5" /> Back to Dashboard
          </button>
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900">My Results</h1>
          <p class="mt-1 text-sm text-slate-500">All your completed exam results in one place.</p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="rounded-2xl border border-slate-200 bg-white">
        <div class="border-b border-slate-100 px-5 py-4">
          <div class="h-5 w-40 animate-pulse rounded bg-slate-100" />
        </div>
        <div class="divide-y divide-slate-100">
          <div v-for="i in 5" :key="i" class="flex items-center gap-4 px-5 py-4">
            <div class="flex-1 space-y-2">
              <div class="h-4 w-48 animate-pulse rounded bg-slate-100" />
              <div class="h-3 w-32 animate-pulse rounded bg-slate-100" />
            </div>
            <div class="h-4 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {{ loadError }}
        <button class="ml-2 font-semibold underline" @click="loadResults">Retry</button>
      </div>

      <!-- Empty -->
      <div
        v-else-if="!results.length"
        class="rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center"
      >
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
          <FileText class="h-8 w-8 text-slate-400" />
        </div>
        <h3 class="mt-4 text-base font-semibold text-slate-900">No results yet</h3>
        <p class="mt-1.5 text-sm text-slate-500">Complete and submit an exam to see your results here.</p>
      </div>

      <!-- Results table -->
      <div v-else class="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div class="border-b border-slate-100 px-5 py-4">
          <h2 class="text-sm font-semibold text-slate-900">{{ results.length }} Result{{ results.length !== 1 ? 's' : '' }}</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-100">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Exam</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Subject</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Attempt</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Time Spent</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Score</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">%</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Grade</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th class="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr
                v-for="result in paginatedResults"
                :key="result.attempt_id || result.id"
                class="group transition hover:bg-slate-50/70"
              >
                <td class="px-5 py-4">
                  <p class="font-medium text-slate-900 text-sm">{{ getExamTitle(result) }}</p>
                </td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ getExamSubject(result) || '—' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">#{{ result.attempt_number ?? result.attemptNumber ?? 1 }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ fmtDate(result.submitted_at || result.completed_at) || '—' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ fmtDuration(result.time_spent_seconds) }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">
                  {{ getScore(result) }} / {{ getTotalMarks(result) }}
                </td>
                <td class="px-5 py-4">
                  <span class="text-sm font-semibold" :class="scoreColorClass(getPercentage(result))">
                    {{ getPercentage(result) != null ? `${getPercentage(result)}%` : '—' }}
                  </span>
                </td>
                <td class="px-5 py-4 text-sm font-semibold text-slate-700">{{ result.grade || '—' }}</td>
                <td class="px-5 py-4">
                  <span
                    class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
                    :class="statusClass(result.status)"
                  >
                    {{ result.status || 'Graded' }}
                  </span>
                </td>
                <td class="px-5 py-4">
                  <button
                    class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 opacity-0 transition hover:bg-slate-100 group-hover:opacity-100"
                    @click="viewDetail(result)"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="results.length > itemsPerPage" class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5">
          <p class="text-xs text-slate-500">Showing {{ startIndex }}–{{ endIndex }} of {{ results.length }}</p>
          <div class="flex items-center gap-1.5">
            <button
              class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="page === 1"
              @click="page--"
            >
              <ChevronLeft class="h-4 w-4" />
            </button>
            <span class="px-2 text-xs font-medium text-slate-700">{{ page }} / {{ totalPages }}</span>
            <button
              class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="page === totalPages"
              @click="page++"
            >
              <ChevronRight class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ChevronLeft, ChevronRight, FileText } from 'lucide-vue-next'
import { getStudentResults } from '../services/api/studentResults'
import { fmtDate } from '../../../js/lib/helpers'
import { scoreColorClass, fmtDuration } from '../../../types/question'

const router = useRouter()

const results = ref([])
const loading = ref(false)
const loadError = ref('')
const page = ref(1)
const itemsPerPage = 10

// ── Pagination ────────────────────────────────────────────────────────────────
const totalPages = computed(() => Math.max(1, Math.ceil(results.value.length / itemsPerPage)))
const paginatedResults = computed(() =>
  results.value.slice((page.value - 1) * itemsPerPage, page.value * itemsPerPage),
)
const startIndex = computed(() => results.value.length ? (page.value - 1) * itemsPerPage + 1 : 0)
const endIndex = computed(() => Math.min(page.value * itemsPerPage, results.value.length))

// ── Data helpers ──────────────────────────────────────────────────────────────
const getExamTitle = (r) => r?.exam?.title || r?.exam_title || r?.title || 'Exam'
const getExamSubject = (r) => r?.exam?.subject?.name || r?.subject?.name || r?.subject || r?.exam_subject || ''
const getScore = (r) => r?.total_score ?? r?.score ?? r?.score_obtained ?? 0
const getTotalMarks = (r) => r?.total_marks ?? r?.exam?.total_marks ?? '—'
const getPercentage = (r) => r?.percentage_score ?? r?.percentage ?? r?.score_percentage ?? null

const statusClass = (status) => {
  const s = (status || '').toLowerCase()
  if (s === 'published' || s === 'graded') return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
  if (s === 'completed') return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
  return 'bg-slate-100 text-slate-600'
}

// ── Navigation ────────────────────────────────────────────────────────────────
const viewDetail = (result) => {
  const id = result.attempt_id || result.id
  router.push({ name: 'StudentResultDetail', params: { attemptId: id } })
}

// ── Load ──────────────────────────────────────────────────────────────────────
const loadResults = async () => {
  loading.value = true
  loadError.value = ''
  try {
    results.value = await getStudentResults()
  } catch (err) {
    loadError.value = err?.message || 'Failed to load results.'
  } finally {
    loading.value = false
  }
}

onMounted(loadResults)
</script>
