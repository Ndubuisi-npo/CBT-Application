<template>
  <div class="space-y-6">
    <AppPageHeader
      :title="isEdit ? 'Edit Assessment' : 'Create Assessment'"
      :subtitle="isEdit ? 'Update assessment details and save them to the mock state.' : 'Create a new mock assessment for the school admin view.'"
      eyebrow="Assessment Management"
      :breadcrumbs="breadcrumbs"
    />

    <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <form class="space-y-6" @submit.prevent="handleSave">
        <div class="grid gap-4 lg:grid-cols-2">
          <AppInput v-model="form.title" label="Assessment Title" placeholder="e.g. JSS1 English CA1" required :error="errors.title" @blur="touch('title')" />
          <AppSelect v-model="form.category" :options="categoryOptions" label="Assessment Category" placeholder="Select category" required :error="errors.category" @blur="touch('category')" />
          <AppSelect v-model="form.subjectId" :options="subjectOptions" label="Subject" placeholder="Select subject" required :error="errors.subjectId" @blur="touch('subjectId')" />
          <AppSelect v-model="form.teacherId" :options="teacherOptions" label="Teacher" placeholder="Select teacher" required :error="errors.teacherId" @blur="touch('teacherId')" />
          <AppSelect v-model="form.sessionId" :options="sessionOptions" label="Academic Session" placeholder="Select session" required :error="errors.sessionId" @blur="touch('sessionId')" />
          <AppSelect v-model="form.term" :options="termOptions" label="Term" placeholder="Select term" required :error="errors.term" @blur="touch('term')" />
          <AppSelect v-model="form.classLevelId" :options="classLevelOptions" label="Class Level" placeholder="Select level" required :error="errors.classLevelId" @blur="touch('classLevelId')" />
          <AppSelect v-model="form.classArmId" :options="classArmOptions" label="Class Arm" placeholder="Select arm" />
          <AppInput v-model="form.totalMarks" type="number" label="Total Marks" placeholder="30" required :error="errors.totalMarks" @blur="touch('totalMarks')" />
          <AppInput v-model="form.dueDate" type="date" label="Due Date" required :error="errors.dueDate" @blur="touch('dueDate')" />
          <AppInput v-model="form.dueTime" type="time" label="Due Time" required :error="errors.dueTime" @blur="touch('dueTime')" />
          <AppSelect v-model="form.status" :options="statusOptions" label="Status" placeholder="Select status" required :error="errors.status" @blur="touch('status')" />
        </div>

        <div class="grid gap-4 lg:grid-cols-1">
          <AppTextarea v-model="form.description" label="Description" placeholder="Enter assessment description" rows="4" :error="errors.description" @blur="touch('description')" />
          <AppTextarea v-model="form.instructions" label="Instructions" placeholder="Provide clear instructions for teachers" rows="4" />
        </div>

        <div class="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm text-slate-500">All changes are saved to mock frontend state only. No backend is involved.</p>
          <div class="flex flex-wrap gap-2">
            <AppButton text="Cancel" variant="outline" @click="router.push('/school-admin/assessments')" />
            <AppButton text="Save Assessment" variant="primary" type="submit" />
          </div>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '../../shared/AppButton.vue'
import AppInput from '../../shared/AppInput.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import AppSelect from '../../shared/AppSelect.vue'
import AppTextarea from '../../shared/AppTextarea.vue'
import {
  getAssessmentById,
  saveAssessment,
  getSessionOptions,
  getTermOptions,
  getClassLevelOptions,
  getClassArmOptions,
  getSubjectOptions,
  getTeacherOptions,
  getCategoryOptions,
} from '../../assessments/mockAssessments'

const route = useRoute()
const router = useRouter()
const assessmentId = route.params.id
const isEdit = computed(() => !!assessmentId)

const defaultForm = () => ({
  title: '',
  description: '',
  instructions: '',
  category: '',
  subjectId: '',
  teacherId: '',
  sessionId: '',
  term: '',
  classLevelId: '',
  classArmId: '',
  dueDate: '',
  dueTime: '',
  totalMarks: '',
  status: '',
})
const form = reactive(defaultForm())
const errors = reactive({ ...defaultForm() })
const touched = reactive({})

if (isEdit.value) {
  const assessment = getAssessmentById(assessmentId)
  if (assessment) Object.assign(form, { ...assessment, classArmId: assessment.classArmId ?? '' })
}

const sessionOptions = getSessionOptions()
const termOptions = getTermOptions()
const classLevelOptions = getClassLevelOptions()
const classArmOptions = [{ label: 'All arms', value: '' }, ...getClassArmOptions()]
const subjectOptions = getSubjectOptions()
const teacherOptions = getTeacherOptions()
const categoryOptions = getCategoryOptions()
const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Closed', value: 'closed' },
]

const breadcrumbs = computed(() => [
  { label: 'School Admin', to: '/school-admin/dashboard' },
  { label: 'Assessment Management', to: '/school-admin/assessments' },
  { label: isEdit.value ? 'Edit Assessment' : 'Create Assessment' },
])

const touch = (field) => {
  touched[field] = true
  validateField(field)
}

const validateField = (field) => {
  if (field === 'title') errors.title = form.title.trim() ? '' : 'Title is required.'
  if (field === 'description') errors.description = form.description.trim() ? '' : 'Description is required.'
  if (field === 'category') errors.category = form.category ? '' : 'Category is required.'
  if (field === 'subjectId') errors.subjectId = form.subjectId ? '' : 'Subject is required.'
  if (field === 'teacherId') errors.teacherId = form.teacherId ? '' : 'Teacher is required.'
  if (field === 'sessionId') errors.sessionId = form.sessionId ? '' : 'Academic session is required.'
  if (field === 'term') errors.term = form.term ? '' : 'Term is required.'
  if (field === 'classLevelId') errors.classLevelId = form.classLevelId ? '' : 'Class level is required.'
  if (field === 'dueDate') {
    if (!form.dueDate) errors.dueDate = 'Due date is required.'
    else if (new Date(form.dueDate) < new Date(new Date().toISOString().slice(0, 10))) errors.dueDate = 'Due date cannot be before today.'
    else errors.dueDate = ''
  }
  if (field === 'dueTime') errors.dueTime = form.dueTime ? '' : 'Due time is required.'
  if (field === 'totalMarks') {
    const value = Number(form.totalMarks)
    errors.totalMarks = value > 0 ? '' : 'Total marks must be greater than zero.'
  }
  if (field === 'status') errors.status = form.status ? '' : 'Status is required.'
}

const validate = () => {
  ['title', 'description', 'category', 'subjectId', 'teacherId', 'sessionId', 'term', 'classLevelId', 'dueDate', 'dueTime', 'totalMarks', 'status'].forEach((field) => {
    touch(field)
  })
  return !Object.values(errors).some((value) => value)
}

const handleSave = () => {
  if (!validate()) return
  const payload = {
    id: isEdit.value ? Number(assessmentId) : undefined,
    title: form.title.trim(),
    description: form.description.trim(),
    instructions: form.instructions.trim(),
    category: form.category,
    subjectId: Number(form.subjectId),
    teacherId: Number(form.teacherId),
    sessionId: Number(form.sessionId),
    term: form.term,
    classLevelId: Number(form.classLevelId),
    classArmId: form.classArmId ? Number(form.classArmId) : null,
    dueDate: form.dueDate,
    dueTime: form.dueTime,
    totalMarks: Number(form.totalMarks),
    status: form.status,
  }
  saveAssessment(payload)
  router.push('/school-admin/assessments')
}
</script>
