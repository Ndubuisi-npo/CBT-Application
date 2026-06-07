<template>
  <div class="space-y-6">
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
                <p class="mt-1 text-sm text-slate-500">{{ exam.subject || '—' }} • {{ exam.className || '—' }}</p>
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
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-semibold text-slate-900">{{ result.exam_title || result.title }}</h3>
              <p class="mt-1 text-sm text-slate-500">{{ result.subject || '' }}</p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold" :class="scoreClass(result.percentage)">
                {{ result.percentage != null ? `${result.percentage}%` : '—' }}
              </p>
              <p class="text-xs text-slate-500">{{ result.score ?? '—' }} / {{ result.total_marks ?? '—' }}</p>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SectionCard from '../../schooladmincomponents/components/SectionCard.vue'
import AppButton from '../../shared/AppButton.vue'
import { getAvailableExams, getStudentExamAttempt } from '../services/api/studentExams'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { getAuthUser } from '../../../js/lib/auth'

const router = useRouter()
const uiStore = useSchoolAdminUiStore()

const exams = ref([])
const loading = ref(false)
const publishedResults = ref([])
const resultsLoading = ref(false)
const inProgressAttempts = ref([])

let pollTimer = null

// ── Computed ───────────────────────────────────────────────────────────────

const liveExams = computed(() =>
  exams.value.filter((e) => ['live', 'active'].includes((e.status || '').toLowerCase())),
)

const scoreClass = (pct) => {
  if (pct == null) return 'text-slate-700'
  if (pct >= 70) return 'text-emerald-600'
  if (pct >= 50) return 'text-amber-600'
  return 'text-rose-600'
}

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
    // Try the student results endpoint; fall back gracefully
    let response
    try {
      response = await apiFetch('/api/student/results')
    } catch {
      // Try alternative endpoint pattern
      response = await apiFetch('/api/student/exams/results')
    }
    publishedResults.value = Array.isArray(response) ? response : (response?.data || [])
  } catch {
    // Non-critical — silently fail, results tab will show empty state
    publishedResults.value = []
  } finally {
    resultsLoading.value = false
  }
}

// ── Navigation ─────────────────────────────────────────────────────────────

const startExam = (exam) => {
  router.push({ name: 'StudentExamInstructions', params: { id: exam.id } })
}

const resumeExam = (exam) => {
  router.push({ name: 'StudentExam', params: { id: exam.id } })
}

onMounted(async () => {
  await loadExams()
  await loadResults()
})
</script>
