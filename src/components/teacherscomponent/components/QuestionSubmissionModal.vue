<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
      <div class="px-5 pb-5 pt-5 sm:p-6">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">Submissions</h3>
            <p class="mt-0.5 truncate text-sm text-slate-500">{{ assessment?.title || 'Assessment' }}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            class="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            @click="$emit('close')"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Submission details</p>
          <AppInput v-model="form.title" label="Title" placeholder="e.g. Mathematics Paper" required :error="errors.title" />
          <AppSelect v-model="form.subjectId" label="Subject" placeholder="Select subject" required :options="subjectOptions" :error="errors.subjectId" />
          <AppTextarea v-model="form.description" label="Description" placeholder="Describe this paper" :rows="3" />
          <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <p>Assessment total marks: <strong class="text-slate-900">{{ assessmentTotalMarks }}</strong></p>
            <p class="mt-1">Questions currently selected: <strong class="text-slate-900">{{ totalMarks }}</strong></p>
            <p class="mt-1 text-xs text-slate-500">The total marks of all questions cannot exceed the assessment total marks.</p>
          </div>
          <div v-if="submission" class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Submission questions</p>
            <div v-for="question in questions" :key="question.id" class="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3">
              <p class="min-w-0 flex-1 text-sm text-slate-700">{{ question.content }}</p>
              <div class="flex shrink-0 items-center gap-2">
                <input v-model.number="question.marks" type="number" min="1" class="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm" :disabled="!editable" @change="updateQuestionMarks(question)" />
                <AppButton text="Delete" variant="danger" size="xs" :disabled="!editable" @click="deleteSubmissionQuestion(question)" />
              </div>
            </div>
            <p v-if="!questions.length" class="text-sm text-slate-500">No questions added yet.</p>
          </div>
          <p v-if="errors.questions" class="text-xs text-red-600">{{ errors.questions }}</p>
          <div class="flex flex-wrap gap-2">
            <AppButton v-if="submission && editable" type="button" text="Select Questions" variant="outline" @click="showQuestionBank = true" />
            <AppButton v-if="submission && editable" type="button" text="Submit for Review" variant="success" :disabled="!questions.length" :processing="submitting" @click="submitForReview" />
            <AppButton v-else type="submit" text="Create Submission" variant="primary" :processing="saving" />
            <AppButton type="button" text="Close" variant="outline" @click="$emit('close')" />
          </div>
        </form>

        <QuestionBankModal
          :show="showQuestionBank"
          :subject-id="form.subjectId"
          :subject-label="subjectName"
          :class-level-id="assessment?.class_level_id ?? assessment?.classLevelId"
          :remaining-marks="Math.max(0, assessmentTotalMarks - totalMarks)"
          :saving="addingQuestions"
          @close="showQuestionBank = false"
          @submit="addQuestions"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import AppInput from '../../shared/AppInput.vue'
import AppSelect from '../../shared/AppSelect.vue'
import AppTextarea from '../../shared/AppTextarea.vue'
import { useAssessmentsStore } from '../../schooladmincomponents/stores/assessments'
import QuestionBankModal from './QuestionBankModal.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  assessment: { type: Object, default: null },
})
const emit = defineEmits(['close'])

const refStore = useAssessmentsStore()
const saving = ref(false)
const submitting = ref(false)
const addingQuestions = ref(false)
const showQuestionBank = ref(false)
const submission = computed(() => refStore.currentSubmission)
const questions = computed(() => submission.value?.questions ?? submission.value?.submissionQuestions ?? [])
const subjectOptions = computed(() => refStore.subjectOptions)
const assessmentTotalMarks = computed(() => Number(props.assessment?.total_marks ?? props.assessment?.totalMarks ?? 0))
const totalMarks = computed(() => questions.value.reduce((sum, question) => sum + Number(question.marks || 0), 0))
const editable = computed(() => ['draft', 'changes_requested'].includes((submission.value?.status || 'draft').toLowerCase()))
const subjectName = computed(() => subjectOptions.value.find((option) => String(option.value) === String(form.subjectId))?.label || 'this subject')

const defaultForm = () => ({ title: '', subjectId: '', description: '' })
const form = reactive(defaultForm())
const errors = reactive({ title: '', subjectId: '', questions: '' })
const resetErrors = () => Object.assign(errors, { title: '', subjectId: '', questions: '' })

watch(
  () => [props.show, props.assessment?.id],
  async ([show, assessmentId]) => {
    if (!show || !assessmentId) return
    Object.assign(form, { ...defaultForm(), subjectId: props.assessment?.subject_id ?? '' })
    resetErrors()
    refStore.currentSubmission = null
  },
  { immediate: true }
)

const validate = () => {
  resetErrors()
  if (!form.title.trim()) errors.title = 'Title is required.'
  if (!form.subjectId) errors.subjectId = 'Subject is required.'
  return !Object.values(errors).some(Boolean)
}

const submit = async () => {
  if (!validate() || !props.assessment?.id) return
  try {
    await refStore.createSubmission(props.assessment.id, {
      subject_id: form.subjectId,
      title: form.title.trim(),
      description: form.description.trim() || null,
    })
    await refStore.fetchSubmission(refStore.currentSubmission.id)
  } catch {
    // Store already surfaced the error toast; keep the modal open to retry.
  }
}

const addQuestions = async (chosen) => {
  const addedMarks = chosen.reduce((sum, item) => sum + Number(item.marks || 0), 0)
  if (totalMarks.value + addedMarks > assessmentTotalMarks.value) {
    errors.questions = 'Question marks cannot exceed the assessment total marks.'
    return
  }
  addingQuestions.value = true
  try {
    await refStore.addQuestions(submission.value.id, chosen.map(({ question, marks }) => ({
      type: question.type,
      content: question.content || '',
      marks,
      explanation: question.explanation || null,
      image_url: question.image_url || null,
      ...(question.type !== 'fill_in_blank' ? { options: question.options || [] } : {}),
    })))
    showQuestionBank.value = false
  } finally {
    addingQuestions.value = false
  }
}

const updateQuestionMarks = async (question) => {
  if (totalMarks.value > assessmentTotalMarks.value) {
    errors.questions = 'Question marks cannot exceed the assessment total marks.'
    return
  }
  errors.questions = ''
  await refStore.deleteQuestion(submission.value.id, question.id)
  await refStore.addQuestion(submission.value.id, { type: question.type, content: question.content, marks: Number(question.marks), explanation: question.explanation, image_url: question.image_url, ...(question.type !== 'fill_in_blank' ? { options: question.options || [] } : {}) })
}

const deleteSubmissionQuestion = async (question) => {
  await refStore.deleteQuestion(submission.value.id, question.id)
}

const submitForReview = async () => {
  submitting.value = true
  try { await refStore.submitForReview(submission.value.id) } finally { submitting.value = false }
}
</script>
