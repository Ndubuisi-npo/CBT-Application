<template>
  <div class="space-y-6">
    <!-- Exam selector -->
    <SectionCard title="Results Review" subtitle="Review auto-graded submissions after an exam ends.">
      <template #header>
        <select
          v-model="selectedExamId"
          class="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#0B1F3A]"
          @change="loadAttempts"
        >
          <option value="">Select an exam…</option>
          <option v-for="e in gradableExams" :key="e.id" :value="e.id">{{ e.title }}</option>
        </select>
      </template>

      <div v-if="!selectedExamId" class="py-8 text-center text-sm text-slate-400">Select an exam above to view submissions.</div>
      <div v-else-if="loadingAttempts" class="py-8 text-center text-sm text-slate-500">Loading submissions…</div>
      <div v-else-if="!attempts.length" class="py-8 text-center text-sm text-slate-500 border border-dashed border-slate-300 rounded-2xl mt-4">
        No submissions yet for this exam.
      </div>
      <div v-else class="space-y-4 pt-6">
        <!-- Stats -->
        <div class="grid gap-4 md:grid-cols-4">
          <div class="rounded-2xl bg-slate-50 p-4 text-sm">
            <p class="text-xs uppercase tracking-wider text-slate-400">Submissions</p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">{{ attempts.length }}</p>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4 text-sm">
            <p class="text-xs uppercase tracking-wider text-slate-400">Average Score</p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">{{ avgScore }}%</p>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4 text-sm">
            <p class="text-xs uppercase tracking-wider text-slate-400">Pass Rate</p>
            <p class="mt-2 text-2xl font-semibold text-emerald-700">{{ passRate }}%</p>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4 text-sm">
            <p class="text-xs uppercase tracking-wider text-slate-400">Status</p>
            <p class="mt-2 text-sm font-semibold" :class="selectedExam?.status === 'published' ? 'text-emerald-700' : 'text-amber-600'">
              {{ (selectedExam?.status || '').toUpperCase() }}
            </p>
          </div>
        </div>

        <!-- Results table -->
        <div class="overflow-hidden rounded-2xl border border-slate-200">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Student</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Score</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">%</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Grade</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Result</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="attempt in attempts" :key="attempt.id" class="hover:bg-slate-50/60">
                <td class="px-5 py-4 text-sm font-medium text-slate-900">{{ attempt.student?.name || attempt.student_name || '–' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ attempt.score ?? '–' }} / {{ attempt.total_marks ?? '–' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ attempt.percentage != null ? attempt.percentage + '%' : '–' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ attempt.grade || '–' }}</td>
                <td class="px-5 py-4">
                  <span class="rounded-full px-2 py-1 text-xs font-semibold"
                    :class="attempt.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
                    {{ attempt.passed ? 'PASS' : 'FAIL' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import SectionCard from '../components/SectionCard.vue'
import { useTeacherExamsStore } from '../stores/exams'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { apiFetch } from '../../../js/lib/api'

const store = useTeacherExamsStore()
const ui    = useSchoolAdminUiStore()

const selectedExamId  = ref('')
const attempts        = ref([])
const loadingAttempts = ref(false)

const gradableExams = computed(() =>
  store.exams.filter((e) => ['concluded', 'grading', 'completed'].includes((e.status || '').toLowerCase()))
)

const selectedExam = computed(() =>
  store.exams.find((e) => String(e.id) === String(selectedExamId.value)) || null
)

const avgScore = computed(() => {
  const pcts = attempts.value.map((a) => a.percentage).filter((p) => p != null)
  if (!pcts.length) return 0
  return Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length)
})

const passRate = computed(() => {
  if (!attempts.value.length) return 0
  const passed = attempts.value.filter((a) => a.passed).length
  return Math.round((passed / attempts.value.length) * 100)
})

const loadAttempts = async () => {
  if (!selectedExamId.value) return
  loadingAttempts.value = true
  try {
    // DEPENDENCY: /api/exams/{id}/results — teacher endpoint per spec §2.8
    const res = await apiFetch(`/api/exams/${selectedExamId.value}/results`)
    attempts.value = Array.isArray(res) ? res : res?.data || []
  } catch (err) {
    ui.addToast({ title: 'Error', message: err.message || 'Failed to load results.', variant: 'error' })
    attempts.value = []
  } finally {
    loadingAttempts.value = false
  }
}

onMounted(async () => {
  if (!store.exams.length) {
    await store.fetchExams().catch(() => {})
  }
})
</script>
