<template>
  <div class="space-y-6">
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
        title="No assessments are open for you right now"
        description="When your school admin opens a submission window it will appear here."
      />

      <ul v-else class="divide-y divide-slate-100">
        <li
          v-for="assessment in visibleAssessments"
          :key="assessment.id"
          class="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-5 transition-colors hover:bg-slate-50/60 sm:px-6"
        >
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B1F3A]/5 text-xs font-bold text-[#0B1F3A]">
            {{ initials(assessment.title) }}
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
              <AppBadge v-else-if="!loadingSubmissions" label="Not started" variant="warning" />
            </div>
          </div>

          <div class="hidden w-36 shrink-0 md:block">
            <p class="text-2xl font-light leading-none text-slate-900">
              {{ marksUsed(assessment) }}<span class="text-base text-slate-400">/{{ assessment.total_marks ?? assessment.totalMarks ?? '—' }}</span>
            </p>
            <p class="mt-1 text-xs text-slate-400">marks allocated</p>
          </div>

          <AppButton
            :text="mySubmissions[assessment.id] ? 'Open paper' : 'Start paper'"
            :variant="mySubmissions[assessment.id] ? 'outline' : 'primary'"
            @click="openAssessment(assessment.id)"
          />
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ClipboardList } from 'lucide-vue-next'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppEmptyState from '../../shared/AppEmptyState.vue'
import AppInput from '../../shared/AppInput.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import AppSelect from '../../shared/AppSelect.vue'
import SubmissionCountdown from '../components/SubmissionCountdown.vue'
import { getMySubmission } from '../../schooladmincomponents/services/api/assessments'
import { useAssessmentsStore, getSubmissionStatusLabel, getSubmissionStatusVariant } from '../../schooladmincomponents/stores/assessments'

const router = useRouter()
const store = useAssessmentsStore()
const searchQuery = ref('')
const filterClassLevel = ref('')

// Keyed by assessment id -> the teacher's own submission for it, or absent
// if they haven't started one. The backend has no batch endpoint for this
// (only a per-schedule `getMySubmission`), so we fetch each open
// assessment's submission in parallel — the list is already scoped to
// "open for me right now", which keeps this bounded to a handful of calls.
const mySubmissions = ref({})
const loadingSubmissions = ref(false)

const classLevelOptions = computed(() => store.classLevelOptions)

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
const initials = (title) => (title || '')
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((word) => word[0]?.toUpperCase())
  .join('') || '—'

const visibleAssessments = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return store.assessments
    .filter((assessment) => !!assessment.schedule_id)
    .filter((assessment) => (assessment.question_submission_status || 'open').toLowerCase() === 'open')
    .filter((assessment) => {
      const matchesSearch = query ? `${assessment.title || ''}`.toLowerCase().includes(query) : true
      const levelId = assessment.class_level_id ?? assessment.classLevelId
      const matchesClass = filterClassLevel.value ? String(levelId) === String(filterClassLevel.value) : true
      return matchesSearch && matchesClass
    })
})

const marksUsed = (assessment) => {
  const submission = mySubmissions.value[assessment.id]
  if (!submission) return 0
  const serverTotal = submission.total_marks ?? submission.totalMarks
  if (typeof serverTotal === 'number') return serverTotal
  const questions = submission.questions ?? submission.submissionQuestions ?? []
  return questions.reduce((sum, q) => sum + Number(q.marks || 0), 0)
}

const loadMySubmissions = async (assessments) => {
  loadingSubmissions.value = true
  const results = await Promise.all(
    assessments.map(async (assessment) => {
      try {
        const submission = await getMySubmission(assessment.schedule_id)
        return [assessment.id, submission]
      } catch {
        return [assessment.id, null]
      }
    })
  )
  const next = {}
  for (const [id, submission] of results) if (submission) next[id] = submission
  mySubmissions.value = next
  loadingSubmissions.value = false
}

watch(() => store.assessments.length, () => {
  if (visibleAssessments.value.length) loadMySubmissions(visibleAssessments.value)
})

onMounted(async () => {
  await Promise.all([
    store.fetchRefData(),
    store.fetchTeacherAssessments(),
  ])
  if (visibleAssessments.value.length) await loadMySubmissions(visibleAssessments.value)
})

const openAssessment = (id) => router.push(`/teachers/assessments/${id}`)
</script>
