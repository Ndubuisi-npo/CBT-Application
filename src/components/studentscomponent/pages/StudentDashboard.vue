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
          <NotificationBell />
          <AppButton text="My Results" variant="outline" size="sm" @click="router.push({ name: 'StudentResultsList' })" />
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
                <p class="mt-1 text-sm text-slate-500">{{ exam.subject || 'N/A' }} • {{ exam.class_level?.name || 'N/A' }}</p>
                <p class="mt-2 text-sm text-slate-600">Duration: {{ exam.duration || 'N/A' }} min</p>
              </div>
              <div class="flex flex-col items-end gap-2 shrink-0">
                <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Live</span>
                <AppButton
                  text="Start"
                  size="sm"
                  variant="primary"
                  :processing="launchingExamId === exam.id"
                  :disabled="launchingExamId !== null"
                  @click="startExam(exam)"
                />
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
  </div>

  <div
    v-if="launchingExamId"
    class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#0B1F3A]/95 px-4 text-center"
  >
    <div class="h-12 w-12 animate-spin rounded-full border-4 border-[#D4AF37] border-t-transparent" />
    <p class="text-lg font-semibold text-white">Launching Secure Exam Browser...</p>
    <p class="max-w-xs text-sm text-slate-300">Please do not close this window.</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SectionCard from '../../schooladmincomponents/components/SectionCard.vue'
import AppButton from '../../shared/AppButton.vue'
import NotificationBell from '../../shared/NotificationBell.vue'
import { getAvailableExams, getStudentExamAttempt } from '../services/api/studentExams'
import { startSebExam } from '../services/api/studentSeb'
import { getStudentResults } from '../services/api/studentResults'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { getAuthUser, logout } from '../../../js/lib/auth'
import { teardownRealtimeNotifications } from '../../../js/echoNotifications'

const router = useRouter()
const uiStore = useSchoolAdminUiStore()

const exams = ref([])
const loading = ref(false)
const logoutLoading = ref(false)
const allResults = ref([])
const resultsLoading = ref(false)
const inProgressAttempts = ref([])
const launchingExamId = ref(null)

const user = computed(() => getAuthUser() || {})
const studentName = computed(() => {
  const firstName = user.value.first_name || user.value.firstName || ''
  const lastName = user.value.last_name || user.value.lastName || ''
  return (firstName || lastName)
    ? `${firstName} ${lastName}`.trim()
    : user.value.name || user.value.full_name || 'Student'
})

const studentClass = computed(() => {
  const profile = user.value.student_profile || user.value.studentProfile
  return profile?.class_arm?.name || profile?.class_name || ''
})

const liveExams = computed(() =>
  exams.value.filter((e) => ['live', 'active'].includes((e.status || '').toLowerCase())),
)

// Show only 3 most recent results on dashboard
const recentResults = computed(() => allResults.value.slice(0, 3))

const scoreClass = (pct) => {
  if (pct == null) return 'text-slate-700'
  if (pct >= 70) return 'text-emerald-600'
  if (pct >= 50) return 'text-amber-600'
  return 'text-rose-600'
}

const getExamTitle = (result) => result?.exam?.title || result?.exam_title || result?.title || 'Exam result'
const getExamSubject = (result) => result?.exam?.subject?.name || result?.subject?.name || result?.subject || result?.exam?.subject || ''
const getScore = (result) => result?.total_score ?? result?.score ?? result?.score_obtained ?? 0
const getTotalMarks = (result) => result?.total_marks ?? result?.exam?.total_marks ?? 'N/A'
const getPercentage = (result) => result?.percentage_score ?? result?.percentage ?? result?.score_percentage ?? null

const loadExams = async () => {
  loading.value = true
  try {
    const available = await getAvailableExams()
    exams.value = available

    const attemptChecks = await Promise.allSettled(
      available.map(async (exam) => {
        try {
          const raw = await getStudentExamAttempt(exam.id)
          const attempt = raw?.attempt ?? raw
          if (attempt && attempt.id && (attempt.status === 'in_progress' || attempt.status === 'in-progress')) {
            return exam
          }
        } catch {
          // 404 = no attempt
        }
        return null
      })
    )
    inProgressAttempts.value = attemptChecks
      .filter((r) => r.status === 'fulfilled' && r.value !== null)
      .map((r) => r.value)
  } catch {
    uiStore.addToast({ title: 'Error', message: 'Failed to load exams.', variant: 'error' })
  } finally {
    loading.value = false
  }
}

const loadResults = async () => {
  resultsLoading.value = true
  try {
    allResults.value = await getStudentResults()
  } catch {
    allResults.value = []
  } finally {
    resultsLoading.value = false
  }
}

// Starting an exam hands off to the Secure Exam Browser client. This is a
// handoff to a different application, not an in-app route change, so it
// deliberately bypasses Vue Router — assigning window.location.href lets
// the OS intercept the URL and open the installed SEB client.
const startExam = async (exam) => {
  if (launchingExamId.value) return

  launchingExamId.value = exam.id
  try {
    const response = await startSebExam(exam.id)
    const sebLaunchUrl = response?.seb_launch_url ?? response?.data?.seb_launch_url

    if (!sebLaunchUrl) {
      throw new Error('The server did not return a secure launch URL.')
    }

    // Leave launchingExamId set (and the overlay up) through the handoff —
    // the redirect isn't instant, and there's no "success" state to return
    // to on this page once it fires.
    window.location.href = sebLaunchUrl
  } catch (err) {
    uiStore.addToast({
      title: 'Error',
      message: err.message || 'Could not start the exam. Please try again.',
      variant: 'error',
    })
    launchingExamId.value = null
  }
}

const resumeExam = (exam) => {
  router.push({ name: 'StudentExam', params: { id: exam.id } })
}

const handleLogout = async () => {
  logoutLoading.value = true
  try {
    teardownRealtimeNotifications()
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
