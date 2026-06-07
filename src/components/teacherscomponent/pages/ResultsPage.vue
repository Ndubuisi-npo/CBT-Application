<template>
  <div class="space-y-6">
    <SectionCard title="Completed Exams" subtitle="Exam outcomes that have been finalized and released to students.">
      <template #header>
        <select
          v-model="selectedExamId"
          class="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#0B1F3A]"
          @change="loadResults"
        >
          <option value="">All completed exams</option>
          <option v-for="e in completedExams" :key="e.id" :value="e.id">{{ e.title }}</option>
        </select>
      </template>

      <!-- Summary cards -->
      <div class="grid gap-4 pt-6 md:grid-cols-4">
        <div class="rounded-2xl bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wider text-slate-400">Completed Exams</p>
          <p class="mt-2 text-3xl font-semibold text-slate-900">{{ completedExams.length }}</p>
        </div>
        <div class="rounded-2xl bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wider text-slate-400">Total Submissions</p>
          <p class="mt-2 text-3xl font-semibold text-slate-900">{{ results.length }}</p>
        </div>
        <div class="rounded-2xl bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wider text-slate-400">Average Score</p>
          <p class="mt-2 text-3xl font-semibold text-slate-900">{{ avgScore }}%</p>
        </div>
        <div class="rounded-2xl bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wider text-slate-400">Pass Rate</p>
          <p class="mt-2 text-3xl font-semibold text-emerald-700">{{ passRate }}%</p>
        </div>
      </div>
    </SectionCard>

    <SectionCard title="Student Results" subtitle="Individual student scores for published exams.">
      <div v-if="loading" class="py-8 text-center text-sm text-slate-500">Loading results…</div>
      <div v-else-if="loadError" class="py-8 text-center text-sm text-rose-600">
        {{ loadError }}
        <button class="ml-2 underline font-semibold" @click="loadResults">Retry</button>
      </div>
      <div v-else-if="!results.length" class="py-8 text-center text-sm text-slate-500 border border-dashed border-slate-300 rounded-2xl mt-4">
        No results available. Complete an exam to populate the results list.
      </div>
      <div v-else class="overflow-hidden rounded-2xl border border-slate-200 mt-6">
        <table class="min-w-full divide-y divide-slate-200 bg-white">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Student</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Exam</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Score</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">%</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Grade</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Result</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="r in results" :key="r.id || r.attempt_id" class="hover:bg-slate-50/60 transition">
              <td class="px-5 py-4 text-sm font-medium text-slate-900">{{ r.student?.name || r.student_name || '–' }}</td>
              <td class="px-5 py-4 text-sm text-slate-600">{{ r.exam_title || r.exam?.title || '–' }}</td>
              <td class="px-5 py-4 text-sm text-slate-600">{{ r.score ?? '–' }} / {{ r.total_marks ?? '–' }}</td>
              <td class="px-5 py-4 text-sm text-slate-600">{{ r.percentage != null ? r.percentage + '%' : '–' }}</td>
              <td class="px-5 py-4 text-sm text-slate-600">{{ r.grade || '–' }}</td>
              <td class="px-5 py-4">
                <span class="rounded-full px-2 py-1 text-xs font-semibold"
                  :class="r.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
                  {{ r.passed ? 'PASS' : 'FAIL' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
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

const selectedExamId = ref('')
const results        = ref([])
const loading        = ref(false)
const loadError      = ref('')

const completedExams = computed(() => store.exams.filter((e) => (e.status || '').toLowerCase() === 'completed'))

const avgScore = computed(() => {
  const pcts = results.value.map((r) => r.percentage).filter((p) => p != null)
  if (!pcts.length) return 0
  return Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length)
})

const passRate = computed(() => {
  if (!results.value.length) return 0
  return Math.round((results.value.filter((r) => r.passed).length / results.value.length) * 100)
})

const loadResults = async () => {
  loading.value   = true
  loadError.value = ''
  try {
    if (selectedExamId.value) {
      const res = await apiFetch(`/api/exams/${selectedExamId.value}/results`)
      results.value = Array.isArray(res) ? res : res?.data || []
    } else {
      // Aggregate across all completed exams
      const all = await Promise.all(
        completedExams.value.map((e) =>
          apiFetch(`/api/exams/${e.id}/results`)
            .then((r) => (Array.isArray(r) ? r : r?.data || []))
            .catch(() => [])
        )
      )
      results.value = all.flat()
    }
  } catch (err) {
    loadError.value = err.message || 'Failed to load results.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (!store.exams.length) {
    await store.fetchExams().catch(() => {})
  }
  if (completedExams.value.length) {
    await loadResults()
  }
})
</script>
