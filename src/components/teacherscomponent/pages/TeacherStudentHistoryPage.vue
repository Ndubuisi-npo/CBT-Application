<template>
  <div class="space-y-6">

    <div v-if="student" class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-wrap items-end justify-between gap-4 bg-gradient-to-r from-[#0B1F3A] to-[#0B1F3A]/80 px-5 pb-5 pt-6 sm:px-6">
        <div class="flex items-end gap-4">
          <div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-emerald-50 text-xl font-bold text-emerald-700 shadow-sm">
            {{ studentInitials }}
          </div>
          <div class="pb-1">
            <h1 class="text-xl font-semibold tracking-tight text-white">{{ studentName || 'Student' }}</h1>
            <p class="mt-0.5 text-sm text-slate-200">{{ admissionNumber || 'No admission number' }}</p>
          </div>
        </div>
        <div class="flex shrink-0 flex-wrap items-center gap-2 pb-1">
          <AppButton text="Back to Student" variant="outline" size="sm" @click="router.push({ name: 'TeacherStudentProfile', params: { id: studentId } })" />
        </div>
      </div>
      <div class="px-5 pb-5 sm:px-6">
        <div class="mt-4 flex flex-wrap items-center gap-2">
          <AppBadge :label="studentClass || 'Class not assigned'" variant="info" dot />
        </div>
        <div class="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3 lg:grid-cols-4">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Email</p>
            <p class="mt-0.5 truncate text-sm font-medium text-slate-700">{{ student.email || student.user?.email || 'N/A' }}</p>
          </div>
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Phone</p>
            <p class="mt-0.5 truncate text-sm font-medium text-slate-700">{{ student.phone || student.user?.phone || 'N/A' }}</p>
          </div>
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Class</p>
            <p class="mt-0.5 truncate text-sm font-medium text-slate-700">{{ studentClass || 'N/A' }}</p>
          </div>
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Admission</p>
            <p class="mt-0.5 truncate text-sm font-medium text-slate-700">{{ admissionNumber || 'N/A' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="rounded-2xl border border-slate-200 bg-white">
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
      <button class="ml-2 font-semibold underline" @click="loadHistory">Retry</button>
    </div>

    <!-- Empty -->
    <div v-else-if="!results.length" class="rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <FileText class="h-8 w-8 text-slate-400" />
      </div>
      <h3 class="mt-4 text-base font-semibold text-slate-900">No exams yet</h3>
      <p class="mt-1.5 text-sm text-slate-500">This student hasn't completed any exams.</p>
    </div>

    <!-- Results table -->
    <div v-else class="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div class="border-b border-slate-100 px-5 py-4">
        <h2 class="text-sm font-semibold text-slate-900">{{ results.length }} Result{{ results.length !== 1 ? 's' : '' }}</h2>
      </div>

      <div class="hidden md:block overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Exam</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Subject</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Attempt</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Submitted</th>
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
              <td class="px-5 py-4 text-sm font-medium text-slate-900">{{ getExamTitle(result) }}</td>
              <td class="px-5 py-4 text-sm text-slate-600">{{ getExamSubject(result) || 'N/A' }}</td>
              <td class="px-5 py-4 text-sm text-slate-600">#{{ result.attempt_number ?? 1 }}</td>
              <td class="px-5 py-4 text-sm text-slate-600">{{ fmtDate(result.submitted_at || result.completed_at) || 'N/A' }}</td>
              <td class="px-5 py-4 text-sm text-slate-600">{{ getScore(result) }} / {{ getTotalMarks(result) }}</td>
              <td class="px-5 py-4">
                <span class="text-sm font-semibold" :class="scoreColorClass(getPercentage(result))">
                  {{ getPercentage(result) != null ? `${getPercentage(result)}%` : 'N/A' }}
                </span>
              </td>
              <td class="px-5 py-4 text-sm font-semibold text-slate-700">{{ result.grade || 'N/A' }}</td>
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
                  class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  @click="viewResult(result)"
                >
                  View Result
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="block space-y-3 p-3 md:hidden">
        <div
          v-for="result in paginatedResults"
          :key="result.attempt_id || result.id"
          class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-slate-900">{{ getExamTitle(result) }}</p>
              <p class="mt-1 text-sm text-slate-500">{{ getExamSubject(result) || 'N/A' }}</p>
            </div>
            <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize" :class="statusClass(result.status)">
              {{ result.status || 'Graded' }}
            </span>
          </div>

          <div class="mt-3 space-y-2 text-sm text-slate-600">
            <div class="flex items-center justify-between gap-3">
              <span class="text-slate-500">Attempt</span>
              <span class="font-medium text-slate-700">#{{ result.attempt_number ?? 1 }}</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-slate-500">Submitted</span>
              <span class="font-medium text-slate-700">{{ fmtDate(result.submitted_at || result.completed_at) || 'N/A' }}</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-slate-500">Score</span>
              <span class="font-medium text-slate-700">{{ getScore(result) }} / {{ getTotalMarks(result) }}</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-slate-500">Percentage</span>
              <span class="font-semibold" :class="scoreColorClass(getPercentage(result))">
                {{ getPercentage(result) != null ? `${getPercentage(result)}%` : 'N/A' }}
              </span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-slate-500">Grade</span>
              <span class="font-semibold text-slate-700">{{ result.grade || 'N/A' }}</span>
            </div>
          </div>

          <button
            class="mt-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            @click="viewResult(result)"
          >
            View Result
          </button>
        </div>
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
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-vue-next'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import { getStudentResultsForTeacher } from '../services/api/teacherStudentResults'
import { getStudents } from '../../schooladmincomponents/services/api/students'
import { fmtDate } from '../../../js/lib/helpers'
import { scoreColorClass } from '../../../types/question'

const route = useRoute()
const router = useRouter()
const studentId = route.params.studentId

const student = ref(null)
const results = ref([])
const loading = ref(false)
const loadError = ref('')
const page = ref(1)
const itemsPerPage = 10

// ── Student info ──────────────────────────────────────────────────────────────
const studentName = computed(() => {
  if (!student.value) return ''
  const fn = student.value.first_name || student.value.user?.first_name || ''
  const ln = student.value.last_name || student.value.user?.last_name || ''
  return `${fn} ${ln}`.trim() || 'Student'
})

const studentInitials = computed(() => {
  const fn = student.value?.first_name || student.value?.user?.first_name || ''
  const ln = student.value?.last_name || student.value?.user?.last_name || ''
  return `${fn[0] || ''}${ln[0] || ''}`.toUpperCase() || '?'
})

const admissionNumber = computed(() => {
  const sp = student.value?.studentProfile || student.value?.student_profile
  return sp?.admission_number ? `Adm: ${sp.admission_number}` : ''
})

const studentClass = computed(() => {
  const sp = student.value?.studentProfile || student.value?.student_profile
  return sp?.class_arm?.name || sp?.class_name || ''
})

// ── Pagination ────────────────────────────────────────────────────────────────
const totalPages = computed(() => Math.max(1, Math.ceil(results.value.length / itemsPerPage)))
const paginatedResults = computed(() =>
  results.value.slice((page.value - 1) * itemsPerPage, page.value * itemsPerPage),
)
const startIndex = computed(() => results.value.length ? (page.value - 1) * itemsPerPage + 1 : 0)
const endIndex = computed(() => Math.min(page.value * itemsPerPage, results.value.length))

// ── Data helpers ──────────────────────────────────────────────────────────────
const getExamTitle = (r) => r?.exam?.title || r?.exam_title || r?.title || 'Exam'
const getExamSubject = (r) => r?.exam_subject || r?.exam?.subject?.name || r?.subject?.name || r?.subject || ''
const getScore = (r) => r?.total_score ?? r?.score ?? 0
const getTotalMarks = (r) => r?.total_marks ?? r?.exam?.total_marks ?? 'N/A'
const getPercentage = (r) => r?.percentage_score ?? r?.percentage ?? null

const statusClass = (status) => {
  const s = (status || '').toLowerCase()
  if (s === 'published' || s === 'graded') return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
  if (s === 'completed') return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
  return 'bg-slate-100 text-slate-600'
}

// ── Navigation ────────────────────────────────────────────────────────────────
const viewResult = (result) => {
  const attemptId = result.attempt_id || result.id
  const examId = result.exam_id || result.exam?.id
  router.push({ name: 'TeacherStudentResultDetail', params: { studentId, examId, attemptId } })
}

// ── Load ──────────────────────────────────────────────────────────────────────
const loadHistory = async () => {
  loading.value = true
  loadError.value = ''
  try {
    results.value = await getStudentResultsForTeacher(studentId)
  } catch (err) {
    loadError.value = err?.message || 'Failed to load student exam history.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  // Try to load the student record from the students list
  try {
    const allStudents = await getStudents({})
    const list = Array.isArray(allStudents) ? allStudents : (allStudents?.data || allStudents?.students || [])
    student.value = list.find((s) => String(s.id) === String(studentId)) || null
  } catch {
    // Non-critical
  }
  await loadHistory()
})
</script>
