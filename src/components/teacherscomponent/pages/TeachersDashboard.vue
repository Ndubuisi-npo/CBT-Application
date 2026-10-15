<template>
  <div class="space-y-6">
    <!-- Hero -->
    <section class="overflow-hidden rounded-3xl bg-[#0B1F3A] p-7 text-white shadow-sm sm:p-9">
      <div class="flex flex-wrap items-end justify-between gap-8">
        <div class="max-w-xl">
          <p class="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">Teacher workspace</p>
          <h1 class="text-5xl font-light leading-[1.03] tracking-tight sm:text-6xl">Good {{ timeOfDay }}, {{ firstName }}</h1>
          <p class="mt-4 text-sm leading-relaxed text-white/60">
            Build your papers before each submission window closes, keep your question bank stocked, and monitor
            live exams from here.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="action in quickActions"
            :key="action.label"
            type="button"
            class="flex items-center gap-2 rounded-xl bg-white/[0.08] px-3.5 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.16] hover:text-white"
            @click="goTo(action.to)"
          >
            <component :is="action.icon" class="h-4 w-4" />
            {{ action.label }}
          </button>
        </div>
      </div>
    </section>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
      <div class="space-y-6">
        <!-- Closest deadline -->
        <section v-if="priority" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Closest deadline</p>
              <h2 class="text-3xl font-light leading-tight tracking-tight text-[#0B1F3A]">{{ priority.title }}</h2>
              <p class="mt-2 text-sm text-slate-500">
                {{ classText(priority) }} · {{ priority.total_marks ?? priority.totalMarks ?? '—' }} marks cap · {{ formatDate(priority.scheduled_date) }}
              </p>
              <div class="mt-4 flex flex-wrap items-center gap-2">
                <SubmissionCountdown :deadline="priority.question_submission_ends" />
                <AppBadge
                  v-if="mySubmissions[priority.id]"
                  :label="getSubmissionStatusLabel(mySubmissions[priority.id].status)"
                  :variant="getSubmissionStatusVariant(mySubmissions[priority.id].status)"
                  dot
                />
                <AppBadge v-else label="No paper started" variant="warning" />
              </div>
            </div>
            <AppButton
              :text="mySubmissions[priority.id] ? 'Continue paper' : 'Start paper'"
              variant="primary"
              @click="router.push(`/teachers/assessments/${priority.id}`)"
            />
          </div>
        </section>

        <!-- Needs your attention -->
        <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 class="text-sm font-semibold text-slate-900">Needs your attention</h2>
            <RouterLink to="/teachers/assessments" class="text-xs font-medium text-slate-400 hover:text-slate-700">All submissions</RouterLink>
          </div>

          <div v-if="loading" class="space-y-3 p-5">
            <div v-for="i in 3" :key="i" class="h-14 animate-pulse rounded-xl bg-slate-100" />
          </div>
          <AppEmptyState
            v-else-if="!needsAction.length"
            :icon="ClipboardList"
            title="Nothing waiting on you"
            description="Every paper you own is submitted or approved."
          />
          <ul v-else class="divide-y divide-slate-100">
            <li v-for="item in needsAction" :key="item.submission.id">
              <button
                type="button"
                class="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50/60 sm:px-6"
                @click="router.push(`/teachers/assessments/${item.assessment.id}`)"
              >
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-semibold text-slate-900">{{ item.submission.title || item.assessment.title }}</span>
                  <span class="block truncate text-xs text-slate-400">{{ item.assessment.title }} · {{ (item.submission.questions?.length ?? item.submission.question_count) || 0 }} questions</span>
                </span>
                <AppBadge :label="getSubmissionStatusLabel(item.submission.status)" :variant="getSubmissionStatusVariant(item.submission.status)" dot />
                <ChevronRight class="h-4 w-4 shrink-0 text-slate-300" />
              </button>
            </li>
          </ul>
        </section>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Your scope</p>
          <dl class="space-y-3">
            <div v-for="stat in scopeStats" :key="stat.label" class="flex items-baseline justify-between">
              <dt class="text-xs text-slate-400">{{ stat.label }}</dt>
              <dd class="text-sm font-semibold text-slate-900">{{ stat.value }}</dd>
            </div>
          </dl>
        </section>

        <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-100 px-5 py-4">
            <h2 class="text-sm font-semibold text-slate-900">Upcoming assessments</h2>
          </div>
          <AppEmptyState v-if="!upcomingAssessments.length" :icon="CalendarDays" title="Nothing scheduled" description="Your school admin hasn't scheduled anything upcoming yet." />
          <ul v-else class="divide-y divide-slate-100">
            <li v-for="assessment in upcomingAssessments" :key="assessment.id" class="flex items-center gap-3 px-5 py-3.5">
              <span class="flex w-11 shrink-0 flex-col items-center rounded-lg bg-slate-50 py-1.5">
                <span class="text-[10px] font-semibold uppercase text-slate-400">{{ monthLabel(assessment.scheduled_date) }}</span>
                <span class="text-sm font-bold text-slate-900">{{ dayLabel(assessment.scheduled_date) }}</span>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium text-slate-900">{{ assessment.title }}</span>
                <span class="block text-xs text-slate-400">{{ daysUntilLabel(assessment.scheduled_date) }}</span>
              </span>
            </li>
          </ul>
        </section>

        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="mb-3 text-sm font-semibold text-slate-900">Quick links</h2>
          <div class="space-y-1">
            <button
              v-for="link in shortcutLinks"
              :key="link.label"
              type="button"
              class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              @click="goTo(link.to)"
            >
              <component :is="link.icon" class="h-4 w-4 text-slate-400" />
              {{ link.label }}
              <ChevronRight class="ml-auto h-4 w-4 text-slate-300" />
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FilePen,
  FileQuestion,
  Users,
} from 'lucide-vue-next'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppEmptyState from '../../shared/AppEmptyState.vue'
import SubmissionCountdown from '../components/SubmissionCountdown.vue'
import { getMySubmission } from '../../schooladmincomponents/services/api/assessments'
import { useAssessmentsStore, getSubmissionStatusLabel, getSubmissionStatusVariant } from '../../schooladmincomponents/stores/assessments'
import { getDisplayName } from '../../../js/lib/auth'
import { fmtDateTime } from '../../../js/lib/helpers'

const router = useRouter()
const store = useAssessmentsStore()

const loading = ref(true)
// Keyed by assessment id -> the teacher's own submission for currently-open
// assessments. No batch "my submissions" endpoint exists on the backend
// (only per-schedule getMySubmission), so this — and therefore every stat
// derived from it below — is scoped to assessments that are open for
// question submission right now, not the teacher's full submission history.
const mySubmissions = ref({})

const firstName = computed(() => (getDisplayName() || 'Teacher').split(' ')[0])
const timeOfDay = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
})

const openAssessments = computed(() => store.assessments
  .filter((a) => !!a.schedule_id && (a.question_submission_status || 'open').toLowerCase() === 'open' && a.question_submission_ends)
  .sort((a, b) => new Date(a.question_submission_ends) - new Date(b.question_submission_ends)))

const priority = computed(() => openAssessments.value[0] || null)

const needsAction = computed(() => openAssessments.value
  .map((assessment) => ({ assessment, submission: mySubmissions.value[assessment.id] }))
  .filter((item) => item.submission && ['draft', 'changes_requested'].includes((item.submission.status || '').toLowerCase())))

const mySubmissionCount = computed(() => Object.keys(mySubmissions.value).length)
const submittedCount = computed(() => Object.values(mySubmissions.value).filter((s) => (s.status || '').toLowerCase() === 'submitted').length)
const approvedCount = computed(() => Object.values(mySubmissions.value).filter((s) => (s.status || '').toLowerCase() === 'approved').length)

const scopeStats = computed(() => [
  { label: 'Open windows', value: openAssessments.value.length },
  { label: 'My papers', value: mySubmissionCount.value },
  { label: 'Awaiting review', value: submittedCount.value },
  { label: 'Approved', value: approvedCount.value },
])

const upcomingAssessments = computed(() => store.assessments
  .filter((a) => a.scheduled_date && new Date(a.scheduled_date).getTime() >= new Date().setHours(0, 0, 0, 0))
  .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
  .slice(0, 4))

const classLevelName = (id) => store.classLevelOptions.find((o) => String(o.value) === String(id))?.label || ''
const classArmName = (id) => store.classArmOptions.find((o) => String(o.value) === String(id))?.label || ''
const classText = (a) => {
  const levelId = a.class_level_id ?? a.classLevelId
  const armId = a.class_arm_id ?? a.classArmId
  const level = a.classLevel?.name || a.class_level?.name || classLevelName(levelId)
  const arm = armId ? ` ${classArmName(armId)}` : ' (whole level)'
  return `${level}${arm}`.trim() || '—'
}
const formatDate = (value) => value ? fmtDateTime(value) : '—'
const monthLabel = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short' }).toUpperCase() : '—'
const dayLabel = (value) => value ? new Date(value).getDate() : '—'
const daysUntilLabel = (value) => {
  if (!value) return ''
  const target = new Date(value); target.setHours(0, 0, 0, 0)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const days = Math.round((target - today) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

const quickActions = [
  { label: 'Submissions', to: '/teachers/assessments', icon: ClipboardList },
  { label: 'Calendar', to: '/teachers/calendar', icon: CalendarDays },
  { label: 'Question Bank', to: '/teachers/questions', icon: FileQuestion },
  { label: 'Students', to: '/teachers/students', icon: Users },
]
const shortcutLinks = [
  { label: 'All submissions', to: '/teachers/assessments', icon: ClipboardList },
  { label: 'Calendar', to: '/teachers/calendar', icon: CalendarDays },
  { label: 'Question bank', to: '/teachers/questions', icon: FileQuestion },
  { label: 'My students', to: '/teachers/students', icon: Users },
  { label: 'Settings', to: '/teachers/settings', icon: FilePen },
]
const goTo = (path) => router.push(path)

onMounted(async () => {
  loading.value = true
  await Promise.all([store.fetchRefData(), store.fetchTeacherAssessments()])
  const results = await Promise.all(
    openAssessments.value.map(async (assessment) => {
      try {
        return [assessment.id, await getMySubmission(assessment.schedule_id)]
      } catch {
        return [assessment.id, null]
      }
    })
  )
  const next = {}
  for (const [id, submission] of results) if (submission) next[id] = submission
  mySubmissions.value = next
  loading.value = false
})
</script>
