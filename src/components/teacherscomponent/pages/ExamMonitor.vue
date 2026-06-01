<template>
  <div class="space-y-6">
    <SectionCard :title="`Monitor — ${exam?.title || '…'}`" subtitle="Live overview of student attempts.">
      <template #header>
        <div class="flex items-center gap-3">
          <span class="rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">ACTIVE</span>
          <AppButton text="← Back" variant="ghost" @click="$router.push('/teachers/exams')" />
          <AppButton
            text="End Session"
            variant="danger"
            size="sm"
            :processing="ending"
            @click="confirmEnd"
          />
        </div>
      </template>

      <!-- Exam Summary -->
      <div class="grid gap-4 pt-6 md:grid-cols-4">
        <div class="rounded-2xl bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wider text-slate-400">Duration</p>
          <p class="mt-2 font-semibold text-slate-900">{{ exam?.duration || '–' }} min</p>
        </div>
        <div class="rounded-2xl bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wider text-slate-400">Students</p>
          <p class="mt-2 font-semibold text-slate-900">{{ attempts.length }}</p>
        </div>
        <div class="rounded-2xl bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wider text-slate-400">Submitted</p>
          <p class="mt-2 font-semibold text-emerald-700">{{ submittedCount }}</p>
        </div>
        <div class="rounded-2xl bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wider text-slate-400">In Progress</p>
          <p class="mt-2 font-semibold text-amber-600">{{ inProgressCount }}</p>
        </div>
      </div>
    </SectionCard>

    <!-- Attempt list -->
    <SectionCard title="Student Attempts" subtitle="Real-time progress of each student.">
      <div v-if="loading" class="py-8 text-center text-sm text-slate-500">Loading…</div>
      <div v-else-if="!attempts.length" class="py-8 text-center text-sm text-slate-500">No attempts yet. Wait for students to start.</div>
      <div v-else class="overflow-x-auto pt-6">
        <table class="min-w-full divide-y divide-slate-200 rounded-2xl border border-slate-200 overflow-hidden">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Student</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Progress</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Flagged</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-for="attempt in attempts" :key="attempt.id">
              <td class="px-5 py-4 text-sm font-medium text-slate-900">{{ attempt.student?.name || attempt.student_name || 'Student' }}</td>
              <td class="px-5 py-4 text-sm text-slate-600">
                <div class="flex items-center gap-2">
                  <div class="h-2 w-24 rounded-full bg-slate-200">
                    <div class="h-2 rounded-full bg-[#0B1F3A]" :style="{ width: progressPct(attempt) + '%' }"></div>
                  </div>
                  <span>{{ progressPct(attempt) }}%</span>
                </div>
              </td>
              <td class="px-5 py-4">
                <span class="rounded-full px-2 py-1 text-xs font-semibold"
                  :class="attempt.status === 'submitted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
                >{{ attempt.status || 'in_progress' }}</span>
              </td>
              <td class="px-5 py-4 text-sm text-slate-600">{{ attempt.flagged_count ?? 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </SectionCard>

    <!-- Confirm end modal -->
    <div v-if="confirmModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div class="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
        <h2 class="text-xl font-semibold text-slate-900">End Exam Session?</h2>
        <p class="mt-3 text-sm text-slate-500">This will force-submit all remaining attempts and end the session.</p>
        <div class="mt-6 flex justify-end gap-3">
          <AppButton text="Cancel" variant="ghost" @click="confirmModal = false" />
          <AppButton text="End Session" variant="danger" :processing="ending" @click="doEnd" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '../../shared/AppButton.vue'
import SectionCard from '../components/SectionCard.vue'
import { useTeacherExamsStore } from '../stores/exams'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { apiFetch } from '../../../js/lib/api'

const route  = useRoute()
const router = useRouter()
const store  = useTeacherExamsStore()
const ui     = useSchoolAdminUiStore()

const examId = route.params.id
const exam   = ref(null)
const attempts = ref([])
const loading  = ref(true)
const ending   = ref(false)
const confirmModal = ref(false)

// DEPENDENCY NOTE: Teacher monitoring via Pusher/WebSocket (private-school.{tenantId}.exam.{examId})
// Pusher is not yet configured. Falling back to polling every 5s for attempt list.
let pollTimer = null

const submittedCount  = computed(() => attempts.value.filter((a) => a.status === 'submitted').length)
const inProgressCount = computed(() => attempts.value.filter((a) => a.status !== 'submitted').length)

const progressPct = (attempt) => {
  const answered = attempt.answered_count ?? 0
  const total    = attempt.question_count ?? attempt.total_questions ?? 1
  return Math.round((answered / total) * 100)
}

const loadData = async () => {
  try {
    exam.value = await store.fetchExam(examId)
    await loadAttempts()
  } catch (err) {
    ui.addToast({ title: 'Error', message: err.message, variant: 'error' })
  } finally {
    loading.value = false
  }
}

const loadAttempts = async () => {
  try {
    // DEPENDENCY: No explicit "list all attempts for an exam" endpoint in spec.
    // Using /api/exams/{id}/attempts as a reasonable extension point.
    const res = await apiFetch(`/api/exams/${examId}/attempts`).catch(() => [])
    attempts.value = Array.isArray(res) ? res : res?.data || []
  } catch { /* silent */ }
}

onMounted(() => {
  loadData()
  pollTimer = setInterval(loadAttempts, 5000)
})

onUnmounted(() => { if (pollTimer) clearInterval(pollTimer) })

const confirmEnd = () => { confirmModal.value = true }

const doEnd = async () => {
  ending.value = true
  try {
    await store.performLifecycleAction(examId, 'end-session')
    ui.addToast({ title: 'Session ended', message: 'Exam session has been ended.', variant: 'success' })
    router.push('/teachers/exams')
  } catch (err) {
    ui.addToast({ title: 'Error', message: err.message, variant: 'error' })
  } finally {
    ending.value = false
    confirmModal.value = false
  }
}
</script>
