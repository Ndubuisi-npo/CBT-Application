<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
    <div class="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
      <div class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Live Monitoring</p>
          <h2 class="mt-1 text-xl font-semibold text-slate-900">{{ exam.title }}</h2>
          <p class="mt-1 text-sm text-slate-500">{{ activeCount }} active • {{ submittedCount }} submitted</p>
        </div>
        <div class="flex items-center gap-2">
          <AppButton text="Refresh" variant="outline" size="sm" :processing="loading" @click="refresh" />
          <button type="button" class="p-2 text-slate-400 hover:text-slate-600" @click="$emit('close')">✕</button>
        </div>
      </div>

      <div class="p-6">
        <div v-if="loading && !attempts.length" class="space-y-3">
          <div v-for="i in 5" :key="i" class="h-16 animate-pulse rounded-xl bg-slate-100" />
        </div>

        <div v-else-if="!attempts.length" class="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No student attempts yet.
        </div>

        <div v-else class="overflow-hidden rounded-[20px] border border-slate-200">
          <table class="min-w-full divide-y divide-slate-100 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Student</th>
                <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Progress</th>
                <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Flagged</th>
                <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Time Left</th>
                <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                <th class="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="attempt in attempts" :key="attempt.id" class="hover:bg-slate-50/80">
                <td class="px-5 py-4">
                  <p class="font-semibold text-slate-900">{{ attempt.student_name || attempt.student?.name || '—' }}</p>
                  <p class="text-xs text-slate-500">{{ attempt.student?.email || attempt.student_email || '' }}</p>
                </td>
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="h-2 w-32 rounded-full bg-slate-200">
                      <div
                        class="h-2 rounded-full bg-emerald-500 transition-all"
                        :style="{ width: `${getProgress(attempt)}%` }"
                      />
                    </div>
                    <span class="text-sm text-slate-600">{{ attempt.answered_count ?? 0 }}/{{ attempt.total_questions ?? '—' }}</span>
                  </div>
                </td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ attempt.flagged_count ?? 0 }}</td>
                <td class="px-5 py-4 text-sm" :class="timeClass(attempt.time_remaining_seconds)">
                  {{ formatTime(attempt.time_remaining_seconds) }}
                </td>
                <td class="px-5 py-4">
                  <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="attemptStatusClass(attempt.status)">
                    {{ attempt.status || 'in-progress' }}
                  </span>
                </td>
                <td class="px-5 py-4">
                  <AppButton
                    v-if="attempt.status !== 'submitted'"
                    text="Force Submit"
                    variant="danger"
                    size="xs"
                    :processing="forcingId === attempt.id"
                    @click="forceSubmit(attempt)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import AppButton from '../../shared/AppButton.vue'
import { useTeacherExamsStore } from '../stores/exams'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'

const props = defineProps({ exam: { type: Object, required: true } })
defineEmits(['close'])

const store = useTeacherExamsStore()
const uiStore = useSchoolAdminUiStore()

const attempts = ref([])
const loading = ref(false)
const forcingId = ref(null)
let pollTimer = null

const activeCount = computed(() => attempts.value.filter((a) => a.status !== 'submitted').length)
const submittedCount = computed(() => attempts.value.filter((a) => a.status === 'submitted').length)

const getProgress = (attempt) => {
  const total = attempt.total_questions || 1
  const answered = attempt.answered_count || 0
  return Math.round((answered / total) * 100)
}

const formatTime = (seconds) => {
  if (seconds == null) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const timeClass = (seconds) => {
  if (seconds == null) return 'text-slate-600'
  if (seconds <= 60) return 'text-rose-600 font-semibold'
  if (seconds <= 300) return 'text-amber-600'
  return 'text-slate-600'
}

const attemptStatusClass = (status) => {
  const map = {
    'in-progress': 'bg-emerald-100 text-emerald-700',
    'submitted': 'bg-blue-100 text-blue-700',
    'force-submitted': 'bg-amber-100 text-amber-700',
  }
  return map[status] || 'bg-slate-100 text-slate-700'
}

const refresh = async () => {
  loading.value = true
  try {
    attempts.value = await store.fetchAttempts(props.exam.id)
  } catch (err) {
    uiStore.addToast({ title: 'Error', message: err.message, variant: 'error' })
  } finally {
    loading.value = false
  }
}

const forceSubmit = async (attempt) => {
  forcingId.value = attempt.id
  try {
    await store.forceSubmitAttempt(attempt.id)
    await refresh()
    uiStore.addToast({ title: 'Attempt submitted', message: `${attempt.student_name || 'Student'}'s attempt has been force-submitted.`, variant: 'success' })
  } catch (err) {
    uiStore.addToast({ title: 'Error', message: err.message, variant: 'error' })
  } finally {
    forcingId.value = null
  }
}

onMounted(async () => {
  await refresh()
  // Poll every 10s for live updates
  pollTimer = setInterval(refresh, 10000)
})

onUnmounted(() => {
  clearInterval(pollTimer)
})
</script>
