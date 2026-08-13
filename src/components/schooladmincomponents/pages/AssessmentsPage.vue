<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Assessment Management"
      subtitle="Create assessments, open them for teachers, and activate them for students."
      eyebrow="Assessment Management"
    >
      <template #actions>
        <AppButton text="Create Assessment" variant="primary" size="sm" @click="createAssessment" />
      </template>
    </AppPageHeader>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="grid gap-4 lg:grid-cols-3">
        <AppInput v-model="searchQuery" label="Search" placeholder="Search assessments…" />
        <AppSelect v-model="filterStatus" label="Status" :options="statusOptions" placeholder="All statuses" />
        <AppSelect v-model="filterClassLevel" label="Class Level" :options="classLevelOptions" placeholder="All levels" />
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div v-if="store.loading && !filteredAssessments.length" class="p-5">
        <SkeletonRows :rows="6" :columns="6" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-[10px] uppercase tracking-[0.22em] text-slate-500">
            <tr>
              <th class="px-5 py-3">Assessment</th>
              <th class="px-5 py-3 text-right">Marks Cap</th>
              <th class="px-5 py-3">Class</th>
              <th class="px-5 py-3">Term</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-if="!pagedAssessments.length">
              <td colspan="6" class="px-5 py-10 text-center text-sm text-slate-500">No assessments found.</td>
            </tr>
            <tr v-for="assessment in pagedAssessments" :key="assessment.id" class="group align-top hover:bg-slate-50">
              <td class="w-[320px] max-w-[360px] px-5 py-4">
                <p class="text-[15px] font-semibold leading-5 text-slate-900">{{ assessment.title }}</p>
                <p v-if="submissionCount(assessment) !== null" class="mt-1 text-xs text-slate-500">
                  {{ submissionCount(assessment) }} submission{{ submissionCount(assessment) === 1 ? '' : 's' }}
                </p>
              </td>
              <td class="px-5 py-4 text-right font-medium text-slate-700">{{ totalMarks(assessment) }}</td>
              <td class="px-5 py-4 text-slate-600">{{ classText(assessment) }}</td>
              <td class="px-5 py-4 text-slate-600">{{ termText(assessment) }}</td>
              <td class="px-5 py-4">
                <AppBadge :label="getAssessmentStatusLabel(assessment)" :variant="getStatusVariant(assessment.status)" />
              </td>
              <td class="px-5 py-4">
                <div class="flex flex-wrap items-center justify-end gap-2">
                  <AppButton
                    v-for="action in lifecycleActions(assessment)"
                    :key="action.key"
                    :text="action.label"
                    :variant="action.variant"
                    size="sm"
                    :processing="transitioning === `${assessment.id}:${action.key}`"
                    @click="action.onClick"
                  />
                  <ResponsiveTableActions
                    :actions="rowMenuActions(assessment)"
                    :entity-label="assessment.title"
                    :always-visible="false"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
        <p class="text-xs text-slate-500">Showing {{ firstItem }}–{{ lastItem }} of {{ filteredAssessments.length }}</p>
        <div class="flex items-center gap-2">
          <AppButton text="Previous" variant="outline" size="sm" :disabled="page === 1" @click="page--" />
          <span class="text-sm text-slate-700">{{ page }} / {{ totalPages }}</span>
          <AppButton text="Next" variant="outline" size="sm" :disabled="page === totalPages" @click="page++" />
        </div>
      </div>
    </section>

    <AssessmentModal
      :show="showModal"
      :assessment="activeAssessment"
      @close="closeModal"
      @submit="handleSubmit"
    />
    <OpenForTeachersModal
      :show="showReopenModal"
      :assessment="targetAssessment"
      @close="showReopenModal = false"
      @submit="handleReopen"
    />
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppInput from '../../shared/AppInput.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import AppSelect from '../../shared/AppSelect.vue'
import AssessmentModal from '../components/AssessmentModal.vue'
import OpenForTeachersModal from '../components/OpenForTeachersModal.vue'
import ResponsiveTableActions from '../../shared/ResponsiveTableActions.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import { useAssessmentsStore, getStatusVariant, getAssessmentStatusLabel } from '../stores/assessments'

const router = useRouter()
const store = useAssessmentsStore()
const searchQuery = ref('')
const filterStatus = ref('')
const filterClassLevel = ref('')
const page = ref(1)
const pageSize = 8
const transitioning = ref(null)

// The 5 real statuses (§2/§4 of the integration guide) — no invented
// "closed"/"active" aliases, no AssessmentType.
const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Open for Teachers', value: 'open' },
  { label: 'Submissions Closed', value: 'submissions_closed' },
  { label: 'Active for Students', value: 'active' },
  { label: 'Completed', value: 'completed' },
]
const classLevelOptions = computed(() => store.classLevelOptions)

onMounted(async () => {
  await Promise.all([store.fetchRefData(), store.fetchAssessments()])
})

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
const totalMarks = (a) => a.total_marks ?? a.totalMarks ?? '—'
// question_count/submission_count are computed fields only present when the
// backend explicitly counted them on this endpoint (§8) — never assume presence.
const submissionCount = (a) => (typeof a.submission_count === 'number' ? a.submission_count : null)

const filteredAssessments = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return store.assessments.filter((assessment) => {
    const matchesSearch = query ? `${assessment.title || ''}`.toLowerCase().includes(query) : true
    const matchesStatus = filterStatus.value ? (assessment.status || '').toLowerCase() === filterStatus.value : true
    const levelId = assessment.class_level_id ?? assessment.classLevelId
    const matchesLevel = filterClassLevel.value ? String(levelId) === String(filterClassLevel.value) : true
    return matchesSearch && matchesStatus && matchesLevel
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredAssessments.value.length / pageSize)))
const firstItem = computed(() => (filteredAssessments.value.length ? ((page.value - 1) * pageSize) + 1 : 0))
const lastItem = computed(() => Math.min(filteredAssessments.value.length, page.value * pageSize))
const pagedAssessments = computed(() => filteredAssessments.value.slice((page.value - 1) * pageSize, page.value * pageSize))

const showModal = ref(false)
const activeAssessment = ref(null)
const showReopenModal = ref(false)
const targetAssessment = ref(null)

const openModal = (assessment) => {
  activeAssessment.value = assessment
  showModal.value = true
}
const closeModal = () => {
  showModal.value = false
  activeAssessment.value = null
}

const handleSubmit = async (payload) => {
  const { id, ...rest } = payload
  try {
    if (id) {
      await store.updateAssessment(id, rest)
    } else {
      await store.createAssessment(rest)
    }
    closeModal()
  } catch {
    // Store surfaces the error toast; keep the modal open so the user can retry.
  }
}

const createAssessment = () => openModal(null)
const viewSubmissions = (assessment) => router.push(`/school-admin/assessments/${assessment.id}/submissions`)
const editAssessment = (assessment) => openModal(assessment)
const confirmDelete = async (assessment) => {
  if (!window.confirm(`Delete "${assessment.title}"? This cannot be undone.`)) return
  await store.deleteAssessment(assessment.id).catch(() => {})
}

const runTransition = async (assessment, key, fn) => {
  transitioning.value = `${assessment.id}:${key}`
  try {
    await fn()
  } catch {
    // Store already surfaced the error toast (invalid transitions, missing
    // approved submissions on activate, timing validation, etc.).
  } finally {
    transitioning.value = null
  }
}

const onOpen = (assessment) => {
  if (!assessment.submission_closes_at && !assessment.submissionClosesAt) {
    window.alert('Set a submission deadline (edit the assessment) before opening it to teachers.')
    return
  }
  runTransition(assessment, 'open', () => store.openAssessment(assessment.id))
}
const onCloseSubmissions = (assessment) => runTransition(assessment, 'close', () => store.closeSubmissions(assessment.id))
const onReopen = (assessment) => {
  targetAssessment.value = assessment
  showReopenModal.value = true
}
const handleReopen = async ({ submission_closes_at }) => {
  if (!targetAssessment.value) return
  await runTransition(targetAssessment.value, 'reopen', () => store.reopenAssessment(targetAssessment.value.id, { submission_closes_at }))
  showReopenModal.value = false
  targetAssessment.value = null
}
const onActivate = (assessment) => {
  const start = assessment.student_starts_at ?? assessment.studentStartsAt
  const end = assessment.student_ends_at ?? assessment.studentEndsAt
  if (!start || !end) {
    window.alert('Set both a student start and end time (edit the assessment) before activating it.')
    return
  }
  if (!window.confirm('Activate this assessment? Every approved submission will be turned into a live exam for students.')) return
  runTransition(assessment, 'activate', () => store.activateAssessment(assessment.id))
}
const onComplete = (assessment) => {
  if (!window.confirm('Mark this assessment complete?')) return
  runTransition(assessment, 'complete', () => store.completeAssessment(assessment.id))
}

// Status-gated action buttons — mirrors the state machine in §4 of the
// integration guide so invalid transitions are never offered.
const lifecycleActions = (assessment) => {
  const status = (assessment.status || '').toLowerCase()
  if (status === 'draft') {
    return [{ key: 'open', label: 'Open for Teachers', variant: 'primary', onClick: () => onOpen(assessment) }]
  }
  if (status === 'open') {
    return [{ key: 'close', label: 'Close Submissions', variant: 'outline', onClick: () => onCloseSubmissions(assessment) }]
  }
  if (status === 'submissions_closed') {
    return [
      { key: 'reopen', label: 'Reopen', variant: 'outline', onClick: () => onReopen(assessment) },
      { key: 'activate', label: 'Activate', variant: 'primary', onClick: () => onActivate(assessment) },
    ]
  }
  if (status === 'active') {
    return [{ key: 'complete', label: 'Complete', variant: 'primary', onClick: () => onComplete(assessment) }]
  }
  return []
}

const rowMenuActions = (assessment) => {
  const status = (assessment.status || '').toLowerCase()
  return [
    { key: 'view', label: 'View Submissions', onClick: () => viewSubmissions(assessment) },
    { key: 'edit', label: 'Edit', onClick: () => editAssessment(assessment) },
    {
      key: 'delete',
      label: 'Delete',
      variant: 'danger',
      onClick: () => confirmDelete(assessment),
      // Delete is only valid while draft or open (§4 endpoints table).
      hidden: !['draft', 'open'].includes(status),
    },
  ]
}
</script>
