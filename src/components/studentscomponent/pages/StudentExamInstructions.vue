<template>
  <div class="mx-auto max-w-2xl px-4 py-8 space-y-6">
    <div v-if="loading" class="space-y-4">
      <div class="h-10 animate-pulse rounded-xl bg-slate-100" />
      <div class="h-48 animate-pulse rounded-[20px] bg-slate-100" />
    </div>

    <template v-else-if="exam">
      <!-- Header -->
      <div class="rounded-[24px] bg-[#0B1F3A] p-6 text-white">
        <div class="flex items-center gap-3">
          <img
            v-if="studentAvatar"
            :src="studentAvatar"
            :alt="`${studentName} avatar`"
            class="h-10 w-10 shrink-0 rounded-xl object-cover ring-2 ring-white/20"
          />
          <div
            v-else
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-bold text-white ring-2 ring-white/20"
          >
            {{ studentInitials }}
          </div>
          <p class="text-sm font-semibold text-white">{{ studentName }}</p>
        </div>
        <p class="mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">Exam Instructions</p>
        <h1 class="mt-3 text-2xl font-semibold">{{ exam.title }}</h1>
        <p class="mt-2 text-sm text-slate-300">{{ exam.subject || 'N/A' }} • {{ exam.class_level?.name || 'N/A' }}</p>
      </div>

      <!-- Exam details -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div class="rounded-[20px] border border-slate-200 bg-white p-4 text-center">
          <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Duration</p>
          <p class="mt-2 text-xl font-bold text-slate-900">{{ exam.duration }}</p>
          <p class="text-xs text-slate-500">minutes</p>
        </div>
        <div class="rounded-[20px] border border-slate-200 bg-white p-4 text-center">
          <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Questions</p>
          <p class="mt-2 text-xl font-bold text-slate-900">{{ questionCount ?? 'N/A' }}</p>
          <p class="text-xs text-slate-500">total</p>
        </div>
        <div class="rounded-[20px] border border-slate-200 bg-white p-4 text-center">
          <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
          <p class="mt-2 text-xl font-bold text-emerald-600">Live</p>
          <p class="text-xs text-slate-500">now</p>
        </div>
        <div class="rounded-[20px] border border-slate-200 bg-white p-4 text-center">
          <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Auto-save</p>
          <p class="mt-2 text-xl font-bold text-slate-900">Yes</p>
          <p class="text-xs text-slate-500">every answer</p>
        </div>
      </div>

      <!-- Instructions text -->
      <div class="rounded-[20px] border border-slate-200 bg-white p-6">
        <h2 class="font-semibold text-slate-900">Instructions</h2>
        <div class="mt-4 space-y-2 text-sm leading-7 text-slate-600 whitespace-pre-line">
          {{ exam.instructions || defaultInstructions }}
        </div>
      </div>

      <!-- Important reminders -->
      <div class="rounded-[20px] border border-amber-200 bg-amber-50 p-5">
        <h2 class="font-semibold text-amber-900">Important Reminders</h2>
        <ul class="mt-3 space-y-2 text-sm text-amber-800">
          <li>• The timer will start as soon as you click "Begin Exam".</li>
          <li>• Your answers are saved automatically after each selection.</li>
          <li>• If you lose connection, your progress is preserved server-side. Resume on reconnect.</li>
          <li>• The exam will auto-submit when time expires.</li>
          <li>• Do not open the exam in multiple tabs simultaneously.</li>
          <li>• Results are available only after your teacher publishes them.</li>
        </ul>
      </div>

      <!-- Error -->
      <div v-if="startError" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {{ formattedStartError }}
      </div>

      <!-- CTA -->
      <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <AppButton text="Back" variant="ghost" @click="goBack" />
        <AppButton
          text="Begin Exam"
          variant="primary"
          :processing="starting"
          @click="beginExam"
        />
      </div>
    </template>

    <div v-else class="rounded-[20px] border border-slate-200 bg-white p-8 text-center">
      <p class="text-slate-500">Exam not found or no longer available.</p>
      <AppButton class="mt-4" text="Back to Dashboard" variant="primary" @click="$router.push({ name: 'StudentDashboard' })" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import AppButton from '../../shared/AppButton.vue'
import { getStudentExam, startStudentExam } from '../services/api/studentExams'
import { fmtDateTime } from '../../../js/lib/helpers'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { disableProtection } from '../../../js/examProtection'
import { getAuthUser } from '../../../js/lib/auth'

const props = defineProps({ id: { type: String, required: true } })
const route = useRoute()
const router = useRouter()
const uiStore = useSchoolAdminUiStore()

const examId = props.id || route.params.id

const exam = ref(null)
const loading = ref(true)
const starting = ref(false)
const startError = ref(null)

const user = computed(() => getAuthUser() || {})
const studentName = computed(() => {
  const firstName = user.value.first_name || user.value.firstName || ''
  const lastName = user.value.last_name || user.value.lastName || ''
  return (firstName || lastName)
    ? `${firstName} ${lastName}`.trim()
    : user.value.name || user.value.full_name || 'Student'
})

const studentInitials = computed(() =>
  studentName.value
    .split(' ')
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'ST'
)

const studentAvatar = computed(() => {
  const profile = user.value.student_profile || user.value.studentProfile || {}
  return (
    user.value.avatar_url ||
    user.value.avatar ||
    user.value.photo_url ||
    user.value.profile_photo_url ||
    profile.avatar_url ||
    profile.avatar ||
    profile.photo_url ||
    profile.profile_photo_url ||
    ''
  )
})

// Convert any ISO timestamps in error messages to local time for readability
const formattedStartError = computed(() => {
  if (!startError.value) return ''
  // Replace ISO 8601 datetime strings (e.g. 2026-06-04T14:28:00+00:00) with local time
  return startError.value.replace(
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/g,
    (match) => {
      const formatted = fmtDateTime(match)
      return formatted || match
    }
  )
})

const defaultInstructions = `• This is a timed exam. The timer starts when you begin.
• Read each question carefully before selecting your answer.
• You can navigate between questions using the question palette.
• Flag questions you want to review later.
• Your answers auto-save after each selection.
• Submit when you are ready, or the exam will auto-submit when time runs out.`

const questionCount = computed(() => {
  const explicit = [
    exam.value?.question_count,
    exam.value?.questions_count,
    exam.value?.questionsCount,
    exam.value?.questionCount,
  ].find((value) => value != null && value !== '')

  if (explicit != null && explicit !== '') {
    const parsed = Number(explicit)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return Array.isArray(exam.value?.questions) ? exam.value.questions.length : 0
})

onMounted(async () => {
  try {
    exam.value = await getStudentExam(examId)
  } catch (err) {
    uiStore.addToast({ title: 'Error', message: err.message || 'Failed to load exam details.', variant: 'error' })
  } finally {
    loading.value = false
  }
})

const beginExam = async () => {
  starting.value = true
  startError.value = null
  try {
    await startStudentExam(examId)
    router.push({ name: 'StudentExam', params: { id: examId } })
  } catch (err) {
    const status = err?.status || 0

    if (status === 409) {
      // Attempt already exists - resume
      router.push({ name: 'StudentExam', params: { id: examId } })
      return
    }

    startError.value = err.message || 'Could not start the exam. Please try again.'
    starting.value = false
  }
}

const goBack = () => {
  disableProtection()
  router.push({ name: 'StudentDashboard' })
}

onBeforeRouteLeave((to) => {
  if (to.name !== 'StudentExam') {
    disableProtection()
  }
})
</script>
