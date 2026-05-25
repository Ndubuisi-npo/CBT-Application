<template>
  <div class="space-y-6">
    <SectionCard title="Assessments" subtitle="Create assessment shells for teachers to complete with questions from their dashboard.">
      <template #header>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton :icon="Plus" text="Create Assessment" variant="primary" @click="openModal()" />
        </div>
      </template>

      <div class="grid gap-4 md:grid-cols-3">
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm text-slate-500">All Assessments</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ assessmentsStore.totalAssessments }}</p>
        </div>
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm text-slate-500">Published</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ assessmentsStore.liveAssessments }}</p>
        </div>
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm text-slate-500">Awaiting Questions</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ awaitingQuestionsCount }}</p>
        </div>
      </div>
    </SectionCard>

    <SectionCard title="Assessment Library" subtitle="Teachers will see these assessments and add questions from the teacher dashboard.">
      <SkeletonRows v-if="assessmentsStore.loading" :columns="6" />

      <div v-else-if="!assessmentsStore.assessments.length" class="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
        <h2 class="text-xl font-semibold text-slate-900">No assessments created yet</h2>
        <p class="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Create the assessment details here. The assigned teacher can open it from their dashboard and attach questions.
        </p>
        <div class="mt-6">
          <AppButton :icon="Plus" text="Create Assessment" variant="primary" @click="openModal()" />
        </div>
      </div>

      <div v-else class="overflow-hidden rounded-[24px] border border-slate-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th v-for="heading in headings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {{ heading }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="assessment in assessmentsStore.assessments" :key="assessment.id" class="transition hover:bg-slate-50/80">
                <td class="px-5 py-4">
                  <p class="font-semibold text-slate-900">{{ assessment.title }}</p>
                  <p class="mt-1 text-xs text-slate-500">{{ assessment.type ? (assessment.type === 'exam' ? 'Exam' : 'Assessment') : 'Assessment' }}</p>
                </td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ assessment.subject || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ assessment.className || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ assessment.term || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ formatSchedule(assessment) }}</td>
                <td class="px-5 py-4">
                  <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="statusClass(assessment.status)">
                    {{ assessment.status }}
                  </span>
                </td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ assessment.questions?.length || 0 }}</td>
                <td class="px-5 py-4">
                  <div class="flex flex-wrap gap-2">
                    <AppButton v-if="['Draft', 'Scheduled'].includes(assessment.status)" text="Publish" variant="secondary" size="xs" @click="publishAssessment(assessment)" />
                    <AppButton text="Edit" variant="outline" size="xs" @click="openModal(assessment)" />
                    <AppButton text="Delete" variant="danger" size="xs" @click="deleteAssessment(assessment)" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
      <div class="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
        <div class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">School Admin</p>
            <h2 class="mt-1 text-2xl font-semibold text-slate-900">{{ form.id ? 'Edit Assessment' : 'Create Assessment' }}</h2>
          </div>
          <AppButton :icon="X" variant="ghost" size="sm" @click="closeModal" />
        </div>

        <form class="space-y-6 p-6" @submit.prevent="submitAssessment">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="form-field md:col-span-2">
              <span>Assessment Title</span>
              <input v-model="form.title" type="text" class="form-input" placeholder="e.g. SS2 Mathematics Mid-Term Assessment" required />
            </label>
            <label class="form-field">
              <span>Subject</span>
              <select v-model="form.subject_id" class="form-input" required>
                <option value="">Select subject</option>
                <option v-for="option in subjectOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
            <label class="form-field">
              <span>Session</span>
              <select v-model="form.session_id" class="form-input" required>
                <option value="">Select session</option>
                <option v-for="option in sessionOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
            <label class="form-field">
              <span>Class</span>
              <select v-model="form.class_level_id" class="form-input" required>
                <option value="">Select class</option>
                <option v-for="option in classOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
            <label class="form-field">
              <span>Arm</span>
              <select v-model="form.class_arm_id" class="form-input" required>
                <option value="">Select arm</option>
                <option v-for="option in classArmOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
            <label class="form-field">
              <span>Term</span>
              <select v-model="form.term_id" class="form-input" required>
                <option value="">Select term</option>
                <option v-for="option in termOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
            <label class="form-field">
              <span>Type</span>
              <select v-model="form.type" class="form-input" required>
                <option value="">Select type</option>
                <option value="exam">Exam</option>
                <option value="assessment">Assessment</option>
              </select>
            </label>
            <label class="form-field">
              <span>Duration (minutes)</span>
              <input v-model.number="form.duration" type="number" min="10" class="form-input" required />
            </label>
            <label class="form-field">
              <span>Pass Mark (%)</span>
              <input v-model.number="form.passMark" type="number" min="1" max="100" class="form-input" required />
            </label>
            <label class="form-field">
              <span>Scheduled Start</span>
              <input v-model="form.startTime" type="datetime-local" class="form-input" />
            </label>
            <label class="form-field">
              <span>Scheduled End</span>
              <input v-model="form.endTime" type="datetime-local" class="form-input" />
            </label>
            <label class="form-field">
              <span>Status</span>
              <div v-if="['Draft', 'Scheduled'].includes(form.status)">
                <select v-model="form.status" class="form-input">
                  <option>Draft</option>
                  <option>Scheduled</option>
                </select>
              </div>
              <div v-else class="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {{ form.status }}
              </div>
            </label>
            <label class="form-field md:col-span-2">
              <span>Instructions for Students</span>
              <textarea v-model="form.instructions" rows="4" class="form-input" placeholder="Add instructions teachers and students should follow."></textarea>
            </label>

          </div>

          <div class="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm text-slate-500">Teachers add the actual questions after this assessment is created.</p>
            <div class="flex flex-wrap gap-2">
              <AppButton text="Cancel" variant="ghost" @click="closeModal" />
              <AppButton type="submit" text="Save Assessment" variant="primary" :processing="saving" />
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import AppButton from '../../shared/AppButton.vue'
import { useSchoolAdminAssessmentsStore } from '../stores/assessments'
import { useSchoolAdminClassLevelsStore } from '../stores/classLevels'
import { useSchoolAdminClassArmsStore } from '../stores/classArms'
import { useSchoolAdminSessionsStore } from '../stores/sessions'
import { useSchoolAdminSubjectsStore } from '../stores/subjects'
import { useSchoolAdminUiStore } from '../stores/ui'

const headings = ['Title', 'Subject', 'Class', 'Term', 'Schedule', 'Status', 'Questions', 'Actions']

const assessmentsStore = useSchoolAdminAssessmentsStore()
const subjectsStore = useSchoolAdminSubjectsStore()
const classLevelsStore = useSchoolAdminClassLevelsStore()
const classArmsStore = useSchoolAdminClassArmsStore()
const sessionsStore = useSchoolAdminSessionsStore()
const uiStore = useSchoolAdminUiStore()

const showModal = ref(false)
const saving = ref(false)
const form = reactive(createDefaultForm())

const subjectOptions = computed(() => {
  const subjects = subjectsStore.subjects
    .filter((subject) => subject && (subject.name || subject.title || subject.code))
    .map((subject) => ({
      value: subject.id,
      label: subject.name || subject.title || subject.code,
    }))
  return subjects.length
    ? subjects
    : [{ value: 'Mathematics', label: 'Mathematics' }, { value: 'English Language', label: 'English Language' }, { value: 'Basic Science', label: 'Basic Science' }]
})

const classOptions = computed(() => {
  const classNames = classLevelsStore.classLevels
    .filter((classLevel) => classLevel && classLevel.name)
    .map((classLevel) => ({
      value: classLevel.id,
      label: classLevel.name,
    }))
  return classNames.length
    ? classNames
    : [{ value: 'JSS 1', label: 'JSS 1' }, { value: 'JSS 2', label: 'JSS 2' }, { value: 'SS 1', label: 'SS 1' }, { value: 'SS 2', label: 'SS 2' }]
})

const sessionOptions = computed(() =>
  sessionsStore.sessions.map((session) => ({
    value: session.id,
    label: session.name || session.title || session.id,
  })),
)

const currentSession = computed(
  () =>
    sessionsStore.sessions.find((session) => session.id === form.session_id) ||
    sessionsStore.sessions.find((session) => session.current) ||
    sessionsStore.sessions[0] ||
    null,
)

const termOptions = computed(() => {
  const terms = currentSession.value ? sessionsStore.terms[currentSession.value.id] || [] : []
  return terms.map((term) => ({
    value: term.id,
    label: term.name || term.title || term.code || term.id,
  }))
})

const classArmOptions = computed(() =>
  classArmsStore.classArms.map((arm) => ({
    value: arm.id,
    label: arm.name || arm.code || arm.id,
  })),
)

const awaitingQuestionsCount = computed(() =>
  assessmentsStore.assessments.filter((assessment) => !assessment.questions?.length).length,
)

let statusRefreshTimer = null

function createDefaultForm() {
  return {
    id: '',
    title: '',
    session_id: '',
    subject_id: '',
    class_level_id: '',
    class_arm_id: '',
    term_id: '',
    subject: '',
    className: '',
    term: '',
    type: 'assessment',
    duration: 60,
    passMark: 50,
    startTime: '',
    endTime: '',
    instructions: '',
    status: 'Draft',
    questions: [],
  }
}

const resetForm = () => {
  Object.assign(form, createDefaultForm())
}

const openModal = async (assessment = null) => {
  resetForm()
  if (assessment) {
    Object.assign(form, { ...assessment })
    if (assessment.class_level_id) {
      await classArmsStore.fetchClassArms(assessment.class_level_id)
    }
  }
  else {
    // Creating a new assessment — fetch latest reference data so the
    // form options are up-to-date when the modal opens.
    await Promise.allSettled([
      subjectsStore.fetchSubjects(),
      classLevelsStore.fetchClassLevels(),
      sessionsStore.fetchSessions(),
    ])

    // Ensure terms are fetched for the current session if missing
    const sessionCandidate =
      sessionsStore.sessions.find((s) => s.id === form.session_id) ||
      sessionsStore.sessions.find((s) => s.current) ||
      sessionsStore.sessions[0]

    if (
      sessionCandidate &&
      (!sessionsStore.terms || !sessionsStore.terms[sessionCandidate.id] || !sessionsStore.terms[sessionCandidate.id].length)
    ) {
      await sessionsStore.fetchTerms(sessionCandidate.id)
    }

    // Prefetch class arms for the first class level to populate arm options
    const firstClass = classLevelsStore.classLevels[0]
    if (firstClass && (!classArmsStore.classArms || !classArmsStore.classArms.length)) {
      await classArmsStore.fetchClassArms(firstClass.id)
    }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  resetForm()
}

const submitAssessment = async () => {
  saving.value = true
  try {
    const payload = { ...form }
    const selectedSubject = subjectOptions.value.find((option) => option.value === form.subject_id)
    if (selectedSubject) payload.subject = selectedSubject.label
    const selectedClass = classOptions.value.find((option) => option.value === form.class_level_id)
    if (selectedClass) payload.className = selectedClass.label
    const selectedTerm = termOptions.value.find((option) => option.value === form.term_id)
    if (selectedTerm) payload.term = selectedTerm.label

    await assessmentsStore.saveAssessment(payload)
    uiStore.addToast({
      title: 'Assessment saved',
      message: 'Teachers can now see this assessment and add questions from their dashboard.',
      variant: 'success',
    })
    closeModal()
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: error.message || 'Failed to save assessment.', variant: 'error' })
  } finally {
    saving.value = false
  }
}

const deleteAssessment = async (assessment) => {
  if (!confirm(`Delete ${assessment.title}? This action cannot be undone.`)) return

  try {
    await assessmentsStore.deleteAssessment(assessment.id)
    uiStore.addToast({ title: 'Assessment deleted', message: 'The assessment has been removed.', variant: 'success' })
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to delete assessment.', variant: 'error' })
  }
}

const publishAssessment = async (assessment) => {
  try {
    await assessmentsStore.publishAssessment(assessment.id)
    uiStore.addToast({ title: 'Assessment published', message: 'The assessment has been made live.', variant: 'success' })
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: error.message || 'Failed to publish assessment.', variant: 'error' })
  }
}

const formatSchedule = (assessment) => {
  if (!assessment.startTime && !assessment.endTime) return '-'
  const start = assessment.startTime ? assessment.startTime.replace('T', ' ') : 'Not set'
  const end = assessment.endTime ? assessment.endTime.replace('T', ' ') : 'Not set'
  return `${start} - ${end}`
}

watch(
  () => form.class_level_id,
  async (classLevelId) => {
    form.class_arm_id = ''
    if (classLevelId) {
      await classArmsStore.fetchClassArms(classLevelId)
    } else {
      classArmsStore.classArms = []
    }
  },
)

watch(
  currentSession,
  async (session) => {
    if (
      session &&
      (!sessionsStore.terms || !sessionsStore.terms[session.id] || !sessionsStore.terms[session.id].length)
    ) {
      await sessionsStore.fetchTerms(session.id)
    }
  },
  { immediate: true },
)

const statusClass = (status) => {
  const classes = {
    Draft: 'bg-slate-100 text-slate-700',
    Scheduled: 'bg-blue-100 text-blue-700',
    Published: 'bg-blue-100 text-blue-700',
    Live: 'bg-emerald-100 text-emerald-700',
    Completed: 'bg-indigo-100 text-indigo-700',
  }
  return classes[status] || 'bg-slate-100 text-slate-700'
}

onMounted(async () => {
  // Fetch assessments first; if exams response included related entities,
  // the stores may already be populated by the assessments store.
  await assessmentsStore.fetchAssessments()

  const tasks = []
  if (!subjectsStore.subjects?.length) tasks.push(subjectsStore.fetchSubjects())
  if (!classLevelsStore.classLevels?.length) tasks.push(classLevelsStore.fetchClassLevels())
  if (!sessionsStore.sessions?.length) tasks.push(sessionsStore.fetchSessions())

  if (tasks.length) await Promise.allSettled(tasks)

  assessmentsStore.refreshStatuses()
  statusRefreshTimer = window.setInterval(() => {
    assessmentsStore.refreshStatuses()
  }, 60000)
})

onUnmounted(() => {
  if (statusRefreshTimer) {
    window.clearInterval(statusRefreshTimer)
    statusRefreshTimer = null
  }
})
</script>

<style scoped>
.form-field {
  display: grid;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(51 65 85);
}

.form-input {
  width: 100%;
  border-radius: 1rem;
  border: 1px solid rgb(203 213 225);
  background: white;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: rgb(51 65 85);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input:focus {
  border-color: #0b1f3a;
  box-shadow: 0 0 0 3px rgb(212 175 55 / 0.25);
}
</style>
