<template>
  <div class="space-y-6">
    <div
      v-if="pageLoading"
      class="flex min-h-[55vh] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 text-center shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0B1F3A]/5">
        <LoaderCircle class="h-8 w-8 animate-spin text-[#0B1F3A]" />
      </div>
      <h1 class="mt-5 text-lg font-semibold text-slate-900">Loading your assessments</h1>
      <p class="mt-2 max-w-sm text-sm leading-6 text-slate-500">Preparing your scheduled assessments and submission status.</p>
      <div class="mt-6 w-full max-w-sm space-y-2" aria-hidden="true">
        <div class="h-2 animate-pulse rounded-full bg-slate-100" />
        <div class="h-2 w-2/3 animate-pulse rounded-full bg-slate-100" />
      </div>
    </div>

    <template v-else>
    <AppPageHeader
      title="Your submissions"
      subtitle="Open an assessment to build your paper. Each window closes at the time set by your school admin."
      eyebrow="Submissions"
    />

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <AppInput v-model="searchQuery" label="Search" placeholder="Search assessments…" class="min-w-[220px] flex-1" />
        <AppSelect v-model="filterClassLevel" label="Class level" :options="classLevelOptions" placeholder="All classes" class="w-full sm:w-44" />
      </div>

      <div v-if="store.loading && !visibleAssessments.length" class="space-y-3 p-5">
        <div v-for="i in 5" :key="i" class="h-20 animate-pulse rounded-2xl bg-slate-100" />
      </div>

      <AppEmptyState
        v-else-if="!visibleAssessments.length"
        :icon="ClipboardList"
        title="No scheduled assessments yet"
        description="Scheduled assessments will appear here, including ones whose question submissions are closed."
      />

      <ul v-else class="divide-y divide-slate-100">
        <li
          v-for="assessment in visibleAssessments"
          :key="assessment.id"
          class="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-5 transition-colors hover:bg-slate-50/60 sm:px-6"
        >
          <span
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            :class="assessmentIconColor(assessment)"
          >
            <ClipboardList class="h-5 w-5" aria-hidden="true" />
          </span>

          <div class="min-w-[220px] flex-1">
            <h2 class="text-sm font-semibold text-slate-900">{{ assessment.title }}</h2>
            <p class="mt-0.5 text-xs text-slate-400">
              {{ classText(assessment) }} · {{ termText(assessment) }} · {{ assessment.total_marks ?? assessment.totalMarks ?? '—' }} marks cap
            </p>
            <div class="mt-2.5 flex flex-wrap items-center gap-2">
              <SubmissionCountdown :deadline="assessment.question_submission_ends" />
              <AppBadge
                v-if="mySubmissions[assessment.id]"
                :label="getSubmissionStatusLabel(mySubmissions[assessment.id].status)"
                :variant="getSubmissionStatusVariant(mySubmissions[assessment.id].status)"
                dot
              />
              
              <AppBadge
                v-if="isQuestionSubmissionClosed(assessment)"
                label="Questions closed"
                variant="default"
              />
              <AppBadge v-else-if="!mySubmissions[assessment.id] && !loadingSubmissionsByAssessment[assessment.id]" label="Not started" variant="warning" />
              <span v-else-if="loadingSubmissionsByAssessment[assessment.id]" class="inline-flex items-center gap-1.5 text-xs text-slate-500" role="status">
                <LoaderCircle class="h-3.5 w-3.5 animate-spin" />
                Loading submission
              </span>
            </div>
          </div>

          <div class="hidden w-36 shrink-0 md:block">
            <p class="text-2xl font-light leading-none text-slate-900">
              {{ marksUsed(assessment) }}<span class="text-base text-slate-400">/{{ assessment.total_marks ?? assessment.totalMarks ?? '—' }}</span>
            </p>
            <p class="mt-1 text-xs text-slate-400">marks allocated</p>
          </div>

          <AppButton
            :text="mySubmissions[assessment.id] ? 'Open paper' : (isQuestionSubmissionClosed(assessment) ? 'Submission closed' : 'Start paper')"
            :variant="mySubmissions[assessment.id] ? 'outline' : 'primary'"
            :disabled="loadingSubmissionsByAssessment[assessment.id] || (isQuestionSubmissionClosed(assessment) && !mySubmissions[assessment.id])"
            @click="openAssessment(assessment.id)"
          />
        </li>
      </ul>
    </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ClipboardList, LoaderCircle } from 'lucide-vue-next'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppEmptyState from '../../shared/AppEmptyState.vue'
import AppInput from '../../shared/AppInput.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import AppSelect from '../../shared/AppSelect.vue'
import SubmissionCountdown from '../components/SubmissionCountdown.vue'
import { useNotificationStore } from '../../shared/stores/notifications'
import { getMySubmission } from '../../schooladmincomponents/services/api/assessments'
import { useAssessmentsStore, getSubmissionStatusLabel, getSubmissionStatusVariant } from '../../schooladmincomponents/stores/assessments'
import { loadTeacherDashboardData, preloadTeacherDashboardData } from '../services/teacherDashboardCache'
import { getAuthUser } from '../../../js/lib/auth'
import { getTenantHandle } from '../../../js/lib/api'

const router = useRouter()
const store = useAssessmentsStore()
const notificationStore = useNotificationStore()
const searchQuery = ref('')
const filterClassLevel = ref('')

// Keyed by assessment id -> the teacher's own submission for it, or absent
// if they haven't started one. The backend has no batch endpoint for this
// (only a per-schedule `getMySubmission`), so we fetch each open
// assessment's submission in parallel — the list is already scoped to
// "open for me right now", which keeps this bounded to a handful of calls.
const mySubmissions = ref({})
const loadingSubmissionsByAssessment = ref({})
const pageLoading = ref(true)

const classLevelOptions = computed(() => store.classLevelOptions)

const assessmentIconColors = [
  'bg-blue-50 text-blue-700',
  'bg-violet-50 text-violet-700',
  'bg-emerald-50 text-emerald-700',
  'bg-amber-50 text-amber-700',
  'bg-rose-50 text-rose-700',
  'bg-cyan-50 text-cyan-700',
  'bg-orange-50 text-orange-700',
  'bg-indigo-50 text-indigo-700',
]

const assessmentIconColor = (assessment) => {
  const key = String(assessment.id ?? assessment.schedule_id ?? assessment.title ?? '')
  const hash = [...key].reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 0)
  return assessmentIconColors[hash % assessmentIconColors.length]
}

const classLevelName = (id) => store.classLevelOptions.find((o) => String(o.value) === String(id))?.label || ''
const classArmName = (id) => store.classArmOptions.find((o) => String(o.value) === String(id))?.label || ''
const classText = (a) => {
  const nestedLevel = a.classLevel?.name || a.class_level?.name || ''
  const levelId = a.class_level_id ?? a.classLevelId
  const armId = a.class_arm_id ?? a.classArmId
  const level = nestedLevel || classLevelName(levelId)
  const arm = armId ? ` ${classArmName(armId)}` : ' (whole level)'
  return `${level}${arm}`.trim() || '—'
}
const termText = (a) => a.term?.name || a.term_name || a.term?.title || '—'
const visibleAssessments = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return store.assessments
    .filter((assessment) => !!assessment.schedule_id)
    .filter((assessment) => {
      const matchesSearch = query ? `${assessment.title || ''}`.toLowerCase().includes(query) : true
      const levelId = assessment.class_level_id ?? assessment.classLevelId
      const matchesClass = filterClassLevel.value ? String(levelId) === String(filterClassLevel.value) : true
      return matchesSearch && matchesClass
    })
})

const isQuestionSubmissionClosed = (assessment) => (assessment?.question_submission_status || 'open').toLowerCase() === 'closed'

const marksUsed = (assessment) => {
  const submission = mySubmissions.value[assessment.id]
  if (!submission) return 0
  const serverTotal = submission.total_marks ?? submission.totalMarks
  if (typeof serverTotal === 'number') return serverTotal
  const questions = submission.questions ?? submission.submissionQuestions ?? []
  return questions.reduce((sum, q) => sum + Number(q.marks || 0), 0)
}

onMounted(async () => {
  pageLoading.value = true
  try {
    let snapshot = await loadTeacherDashboardData(getAuthUser(), getTenantHandle())
    if (!snapshot) snapshot = await preloadTeacherDashboardData(getAuthUser(), getTenantHandle())
    if (snapshot?.assessmentSubmissions) {
      mySubmissions.value = Object.fromEntries(
        Object.entries(snapshot.assessmentSubmissions).filter(([, submission]) => submission)
      )
      return
    }

    // Recover this page's data if a background prefetch request failed.
    await Promise.all([store.fetchRefData(), store.fetchTeacherAssessments()])
    const assessments = visibleAssessments.value
    loadingSubmissionsByAssessment.value = Object.fromEntries(assessments.map((assessment) => [assessment.id, true]))
    const results = await Promise.all(assessments.map(async (assessment) => {
      try {
        return [assessment.id, await getMySubmission(assessment.schedule_id)]
      } catch {
        return [assessment.id, null]
      }
    }))
    mySubmissions.value = Object.fromEntries(results.filter(([, submission]) => submission))
    loadingSubmissionsByAssessment.value = {}
  } finally {
    pageLoading.value = false
  }
})

const openAssessment = (id) => {
  const path = `/teachers/assessments/${id}`
  void notificationStore.markReadForAction(path, ['assessment', 'submission'])
  router.push(path)
}

</script>
