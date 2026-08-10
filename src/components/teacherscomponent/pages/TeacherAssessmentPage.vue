<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Assessment Workspace"
      subtitle="Create a subject assignment and manage questions for this active assessment." 
      eyebrow="Assessments"
    />

    <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="grid gap-4 lg:grid-cols-2">
        <div>
          <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Assessment</p>
          <p class="mt-1 text-xl font-semibold text-slate-900">{{ assessment?.title }}</p>
          <p class="mt-1 text-sm text-slate-500">{{ assessment?.description }}</p>
        </div>
        <div class="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <div class="flex items-center justify-between"><span>Status</span><AppBadge :label="assessment?.status" :variant="getStatusVariant(assessment?.status)" /></div>
          <div class="flex items-center justify-between"><span>Due date</span><span>{{ assessment?.dueDate }} · {{ assessment?.dueTime }}</span></div>
          <div class="flex items-center justify-between"><span>Total Marks</span><span>{{ assessment?.totalMarks }}</span></div>
          <div class="flex items-center justify-between"><span>Class</span><span>{{ getClassLevelName(assessment?.classLevelId) }}{{ assessment?.classArmId ? ` ${getClassArmName(assessment.classArmId)}` : '' }}</span></div>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="grid gap-4 lg:grid-cols-2 flex-1">
          <AppSelect v-model="assignment.subjectId" label="Subject" :options="subjectOptions" placeholder="Choose subject" required :error="errors.subjectId" @blur="touch('subjectId')" />
          <AppInput v-model="assignment.description" label="Short Description" placeholder="e.g. Mathematics assignment for algebra" required :error="errors.description" @blur="touch('description')" />
        </div>
        <AppButton text="Select Assesment" variant="primary" size="sm" @click="createAssignment" />
      </div>

      <div v-if="assignedSubject" class="mt-6 rounded-2xl bg-slate-50 p-5">
        <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Assignment</p>
        <p class="mt-1 text-base font-semibold text-slate-900">{{ assignedSubject.title }}</p>
        <p class="mt-1 text-sm text-slate-500">{{ assignedSubject.description }}</p>
      </div>

      <div v-if="assignedSubject" class="mt-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-900">Question Builder</p>
            <p class="mt-1 text-sm text-slate-500">Manage teacher questions within this assignment.</p>
          </div>
          <AppButton text="Add Question" variant="primary" size="sm" @click="openQuestionModal" />
        </div>

        <div class="mt-4 grid gap-4">
          <div v-for="question in assignedSubject.questions" :key="question.id" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="font-semibold text-slate-900">Question {{ question.number }}</p>
                <p class="mt-1 text-sm text-slate-500">
                  {{ question.type === 'multiple_choice' ? 'Multiple Choice' : question.type === 'true_false' ? 'True / False' : question.type === 'theory' ? 'Theory' : question.type }} • {{ question.difficulty }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <AppButton text="Edit" variant="outline" size="xs" @click="editQuestion(question)" />
                <AppButton text="Delete" variant="danger" size="xs" @click="deleteQuestion(question.id)" />
                <AppButton text="Duplicate" variant="secondary" size="xs" @click="duplicateQuestion(question.id)" />
              </div>
            </div>
            <p class="mt-3 text-sm text-slate-700">{{ question.text }}</p>
            <div class="mt-4 grid gap-3 sm:grid-cols-3 text-sm text-slate-600">
              <div><span class="font-semibold text-slate-900">Marks:</span> {{ question.marks }}</div>
              <div><span class="font-semibold text-slate-900">Answer:</span> {{ question.correctAnswer }}</div>
              <div><span class="font-semibold text-slate-900">Explanation:</span> {{ question.explanation || 'N/A' }}</div>
            </div>
            <div v-if="question.options?.length" class="mt-4 grid gap-2 sm:grid-cols-2">
              <div v-for="option in question.options" :key="option" class="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{{ option }}</div>
            </div>
          </div>
        </div>

        <section class="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-2xl bg-white p-4 text-sm">
              <p class="text-slate-500">Total Questions</p>
              <p class="mt-2 text-xl font-semibold text-slate-900">{{ assignedSubject.questions.length }}</p>
            </div>
            <div class="rounded-2xl bg-white p-4 text-sm">
              <p class="text-slate-500">Marks Used</p>
              <p class="mt-2 text-xl font-semibold text-slate-900">{{ marksUsed }}</p>
            </div>
            <div class="rounded-2xl bg-white p-4 text-sm">
              <p class="text-slate-500">Remaining Marks</p>
              <p class="mt-2 text-xl font-semibold text-slate-900">{{ remainingMarks }}</p>
            </div>
            <div class="rounded-2xl bg-white p-4 text-sm">
              <p class="text-slate-500">Completion</p>
              <p class="mt-2 text-xl font-semibold text-slate-900">{{ completionPercent }}%</p>
            </div>
          </div>

          <div class="mt-4 h-2 rounded-full bg-slate-200">
            <div class="h-full rounded-full bg-[#0B1F3A]" :style="`width: ${completionPercent}%`" />
          </div>

          <p class="mt-3 text-sm text-slate-500">{{ completionText }}</p>
        </section>
      </div>
    </section>

    <QuestionModal
      v-if="showQuestionModal"
      :show="showQuestionModal"
      :question="activeQuestion"
      @close="closeQuestionModal"
      @submit="saveQuestion"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppInput from '../../shared/AppInput.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import AppSelect from '../../shared/AppSelect.vue'
import AppTextarea from '../../shared/AppTextarea.vue'
import QuestionModal from '../components/QuestionModal.vue'
import {
  currentTeacherId,
  getAssessmentById,
  getSubjectOptions,
  getClassLevelName,
  getClassArmName,
  getStatusVariant,
  getSubjectName,
  createTeacherAssignment,
  getTeacherAssignmentByAssessmentForTeacher,
  addQuestionToAssignment,
  updateQuestionOnAssignment,
  deleteQuestionFromAssignment,
  duplicateQuestionInAssignment,
} from '../../assessments/mockAssessments'

const route = useRoute()
const router = useRouter()
const assessmentId = route.params.id
const assessment = ref(getAssessmentById(assessmentId))
const subjectOptions = getSubjectOptions()
const assignments = ref(getTeacherAssignmentByAssessmentForTeacher(assessmentId, currentTeacherId))

const assignedSubject = computed(() => assignments.value[0] || null)
const assignment = reactive({ subjectId: '', description: '' })
const errors = reactive({ subjectId: '', description: '' })
const showQuestionModal = ref(false)
const activeQuestion = ref(null)

const marksUsed = computed(() => assignedSubject.value ? assignedSubject.value.questions.reduce((sum, q) => sum + q.marks, 0) : 0)
const remainingMarks = computed(() => Math.max(0, (assessment.value?.totalMarks || 0) - marksUsed.value))
const completionPercent = computed(() => {
  if (!assessment.value) return 0
  return Math.min(100, Math.round((marksUsed.value / assessment.value.totalMarks) * 100))
})
const completionText = computed(() => (marksUsed.value >= (assessment.value?.totalMarks || 0) ? 'Assessment Complete' : `Remaining Marks: ${remainingMarks.value}`))

const touch = (field) => {
  if (field === 'subjectId') errors.subjectId = assignment.subjectId ? '' : 'Subject is required.'
  if (field === 'description') errors.description = assignment.description.trim() ? '' : 'Description is required.'
}

const createAssignment = () => {
  touch('subjectId')
  touch('description')
  if (errors.subjectId || errors.description) return
  const newAssignment = createTeacherAssignment({
    assessmentId,
    subjectId: assignment.subjectId,
    title: getSubjectName(assignment.subjectId),
    description: assignment.description,
    teacherId: currentTeacherId,
  })
  assignments.value = [newAssignment]
  assignment.subjectId = ''
  assignment.description = ''
}

const openQuestionModal = () => {
  activeQuestion.value = null
  showQuestionModal.value = true
}
const closeQuestionModal = () => {
  showQuestionModal.value = false
  activeQuestion.value = null
}
const saveQuestion = (question) => {
  if (!assignedSubject.value) return
  if (question.id) {
    updateQuestionOnAssignment({ assignmentId: assignedSubject.value.id, questionId: question.id, payload: question })
  } else {
    addQuestionToAssignment({ assignmentId: assignedSubject.value.id, payload: question })
  }
  assignments.value = getTeacherAssignmentByAssessmentForTeacher(assessmentId, currentTeacherId)
  closeQuestionModal()
}
const editQuestion = (question) => {
  activeQuestion.value = { ...question }
  showQuestionModal.value = true
}
const deleteQuestion = (questionId) => {
  if (!window.confirm('Delete this question?')) return
  deleteQuestionFromAssignment({ assignmentId: assignedSubject.value.id, questionId })
  assignments.value = getTeacherAssignmentByAssessmentForTeacher(assessmentId, currentTeacherId)
}
const duplicateQuestion = (questionId) => {
  duplicateQuestionInAssignment({ assignmentId: assignedSubject.value.id, questionId })
  assignments.value = getTeacherAssignmentByAssessmentForTeacher(assessmentId, currentTeacherId)
}
</script>
