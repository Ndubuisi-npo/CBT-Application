<template>
  <div class="space-y-6">
    <SectionCard title="Exam Creation Wizard" subtitle="Build objective exams that the system can score automatically from the correct answers you set.">
      <template #header>
        <div class="flex flex-wrap items-center gap-3">
          <button type="button" class="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
            Multiple Choice Only
          </button>
          <AppButton text="Save Draft" variant="outline" size="sm" @click="saveDraft" />
        </div>
      </template>

      <div class="space-y-6 pt-6">
        <div class="grid gap-4 lg:grid-cols-4">
          <button
            v-for="step in steps"
            :key="step.id"
            type="button"
            class="rounded-[24px] border p-4 text-left transition"
            :class="currentStep === step.id ? 'border-[#0B1F3A] bg-[#0B1F3A] text-white shadow-lg' : currentStep > step.id ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600'"
            @click="jumpToStep(step.id)"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.24em]">{{ step.short }}</p>
            <h2 class="mt-3 text-base font-semibold">{{ step.title }}</h2>
            <p class="mt-2 text-sm" :class="currentStep === step.id ? 'text-slate-200' : currentStep > step.id ? 'text-emerald-700' : 'text-slate-500'">
              {{ step.description }}
            </p>
          </button>
        </div>

        <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div class="space-y-6">
            <div v-if="currentStep === 1" class="space-y-6">
              <div class="grid gap-4 md:grid-cols-2">
                <label class="wizard-field">
                  <span>Exam Title</span>
                  <input v-model="wizard.title" type="text" class="wizard-input" placeholder="e.g. SS2 Mid-Term Mathematics CBT" />
                </label>
                <label class="wizard-field">
                  <span>Subject</span>
                  <select v-model="wizard.subject" class="wizard-input">
                    <option value="">Select subject</option>
                    <option v-for="subject in subjects" :key="subject" :value="subject">{{ subject }}</option>
                  </select>
                </label>
                <label class="wizard-field">
                  <span>Class</span>
                  <select v-model="wizard.className" class="wizard-input">
                    <option value="">Select class</option>
                    <option v-for="className in classNames" :key="className" :value="className">{{ className }}</option>
                  </select>
                </label>
                <div class="wizard-field">
                  <span>Exam Type</span>
                  <div class="wizard-input flex items-center font-semibold text-slate-600">Multiple Choice</div>
                </div>
                <label class="wizard-field">
                  <span>Term</span>
                  <select v-model="wizard.term" class="wizard-input">
                    <option value="">Select term</option>
                    <option>First Term</option>
                    <option>Second Term</option>
                    <option>Third Term</option>
                  </select>
                </label>
                <label class="wizard-field">
                  <span>Assessment Purpose</span>
                  <select v-model="wizard.purpose" class="wizard-input">
                    <option value="">Select purpose</option>
                    <option>Continuous Assessment</option>
                    <option>Mid-Term</option>
                    <option>Mock Revision</option>
                    <option>Promotion Exam</option>
                  </select>
                </label>
              </div>

              <label class="wizard-field">
                <span>Exam Instructions</span>
                <textarea
                  v-model="wizard.instructions"
                  rows="5"
                  class="wizard-input min-h-[140px]"
                  placeholder="Add instructions for objective exam takers."
                ></textarea>
              </label>
            </div>

            <div v-if="currentStep === 2" class="space-y-6">
              <div class="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-slate-50 p-4">
                <div class="flex flex-wrap gap-2">
                  <input v-model="questionSearch" type="text" class="wizard-input min-w-[240px]" placeholder="Search question bank" />
                  <select v-model="questionFilters.topic" class="wizard-input min-w-[200px]">
                    <option value="">All topics</option>
                    <option v-for="topic in questionTopics" :key="topic" :value="topic">{{ topic }}</option>
                  </select>
                </div>
                <div class="text-sm text-slate-500">{{ selectedQuestions.length }} question(s) selected</div>
              </div>

              <div class="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
                <div class="space-y-4">
                  <h3 class="text-lg font-semibold text-slate-900">Objective Question Browser</h3>
                  <article
                    v-for="question in filteredQuestionOptions"
                    :key="question.id"
                    class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div class="space-y-3">
                        <div class="flex flex-wrap gap-2">
                          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Multiple Choice</span>
                        </div>
                        <h4 class="text-base font-semibold text-slate-900">{{ question.content }}</h4>
                        <p class="text-sm text-slate-500">{{ question.topic }} • {{ question.className }} • {{ question.marks }} marks</p>
                      </div>
                      <AppButton
                        :text="isSelected(question.id) ? 'Remove' : 'Add Question'"
                        :variant="isSelected(question.id) ? 'danger' : 'outline'"
                        size="sm"
                        @click="toggleQuestion(question)"
                      />
                    </div>
                  </article>
                </div>

                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-slate-900">Selected Questions</h3>
                    <button type="button" class="text-sm font-semibold text-[#0B1F3A] hover:text-[#D4AF37]" @click="resetQuestionSelection">
                      Clear all
                    </button>
                  </div>

                  <div v-if="!selectedQuestions.length" class="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                    Add objective questions from the left. The stored correct answers will be used for auto-grading after submission.
                  </div>

                  <div v-else class="space-y-3">
                    <article v-for="(question, index) in selectedQuestions" :key="question.id" class="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                      <div class="flex items-start justify-between gap-3">
                        <div class="space-y-2">
                          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Question {{ index + 1 }}</p>
                          <h4 class="text-sm font-semibold text-slate-900">{{ question.content }}</h4>
                          <div class="flex flex-wrap gap-2">
                            <span class="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">{{ question.topic }}</span>
                            <span class="rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700">Correct answer stored</span>
                          </div>
                        </div>
                        <div class="flex items-center gap-2">
                          <AppButton text="Up" variant="ghost" size="sm" :disabled="index === 0" @click="moveQuestion(index, -1)" />
                          <AppButton text="Down" variant="ghost" size="sm" :disabled="index === selectedQuestions.length - 1" @click="moveQuestion(index, 1)" />
                        </div>
                      </div>

                      <div class="mt-4 grid gap-3 sm:grid-cols-[120px_1fr]">
                        <label class="wizard-field">
                          <span>Marks</span>
                          <input v-model.number="wizard.questionMarks[question.id]" type="number" min="1" class="wizard-input" />
                        </label>
                        <div class="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500">
                          Auto-grading will compare the student option against the teacher-selected correct option for this question.
                        </div>
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="currentStep === 3" class="space-y-6">
              <div class="grid gap-4 md:grid-cols-2">
                <label class="wizard-field">
                  <span>Duration (minutes)</span>
                  <input v-model.number="wizard.duration" type="number" min="10" class="wizard-input" />
                </label>
                <label class="wizard-field">
                  <span>Pass Mark (%)</span>
                  <input v-model.number="wizard.passMark" type="number" min="1" max="100" class="wizard-input" />
                </label>
                <label class="wizard-field">
                  <span>Scheduled Start</span>
                  <input v-model="wizard.startTime" type="datetime-local" class="wizard-input" />
                </label>
                <label class="wizard-field">
                  <span>Scheduled End</span>
                  <input v-model="wizard.endTime" type="datetime-local" class="wizard-input" />
                </label>
              </div>

              <div class="">
                <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <h3 class="text-lg font-semibold text-slate-900">Student Experience</h3>
                  <div class="mt-4 space-y-4">
                    <label v-for="toggle in studentToggles" :key="toggle.key" class="flex items-start justify-between gap-4 rounded-2xl bg-white px-4 py-3">
                      <div>
                        <p class="text-sm font-semibold text-slate-900">{{ toggle.label }}</p>
                        <p class="mt-1 text-sm text-slate-500">{{ toggle.help }}</p>
                      </div>
                      <input v-model="wizard[toggle.key]" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-[#0B1F3A] focus:ring-[#D4AF37]" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="currentStep === 4" class="space-y-6">
              <div class="rounded-[28px] bg-[#0B1F3A] p-6 text-white">
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Exam Preview</p>
                    <h2 class="mt-3 text-3xl font-semibold">{{ wizard.title || 'Untitled exam draft' }}</h2>
                    <p class="mt-2 text-sm text-slate-300">{{ wizard.subject || 'Subject' }} • {{ wizard.className || 'Class' }} • Multiple Choice</p>
                  </div>
                  <span class="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">{{ publishState }}</span>
                </div>
                <p class="mt-5 max-w-3xl text-sm leading-6 text-slate-200">{{ wizard.instructions || 'No student instructions added yet.' }}</p>
              </div>

              <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div class="rounded-[24px] border border-slate-200 bg-white p-5">
                  <p class="text-sm text-slate-500">Questions</p>
                  <p class="mt-3 text-3xl font-semibold text-slate-900">{{ selectedQuestions.length }}</p>
                </div>
                <div class="rounded-[24px] border border-slate-200 bg-white p-5">
                  <p class="text-sm text-slate-500">Total Marks</p>
                  <p class="mt-3 text-3xl font-semibold text-slate-900">{{ totalMarks }}</p>
                </div>
                <div class="rounded-[24px] border border-slate-200 bg-white p-5">
                  <p class="text-sm text-slate-500">Duration</p>
                  <p class="mt-3 text-3xl font-semibold text-slate-900">{{ wizard.duration }} mins</p>
                </div>
                <div class="rounded-[24px] border border-slate-200 bg-white p-5">
                  <p class="text-sm text-slate-500">Pass Mark</p>
                  <p class="mt-3 text-3xl font-semibold text-slate-900">{{ wizard.passMark }}%</p>
                </div>
              </div>

              <div class="rounded-[24px] border border-slate-200 bg-white p-5">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-slate-900">Review Checklist</h3>
                  <button type="button" class="text-sm font-semibold text-[#0B1F3A] hover:text-[#D4AF37]" @click="showPublishModal = true">
                    Publish options
                  </button>
                </div>
                <div class="mt-5 grid gap-4 md:grid-cols-2">
                  <div class="rounded-2xl bg-slate-50 p-4">
                    <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Schedule</p>
                    <p class="mt-2 text-sm font-medium text-slate-900">{{ scheduleSummary }}</p>
                  </div>
                  <div class="rounded-2xl bg-slate-50 p-4">
                    <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Auto-Grading</p>
                    <p class="mt-2 text-sm font-medium text-slate-900">Each student answer will be compared with the correct option saved in the question bank.</p>
                  </div>
                  <div class="rounded-2xl bg-slate-50 p-4 md:col-span-2">
                    <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Question order</p>
                    <ol class="mt-3 space-y-2 text-sm text-slate-600">
                      <li v-for="(question, index) in selectedQuestions" :key="question.id">
                        {{ index + 1 }}. {{ question.content }}
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 class="text-lg font-semibold text-slate-900">Wizard Summary</h3>
              <div class="mt-4 space-y-3 text-sm text-slate-600">
                <div class="flex items-center justify-between">
                  <span>Current step</span>
                  <span class="font-semibold text-slate-900">{{ currentStepLabel }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>Questions selected</span>
                  <span class="font-semibold text-slate-900">{{ selectedQuestions.length }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>Draft status</span>
                  <span class="font-semibold text-slate-900">{{ publishState }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>Auto-save</span>
                  <span class="font-semibold text-emerald-700">{{ autosaveLabel }}</span>
                </div>
              </div>
            </div>

            <div class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 class="text-lg font-semibold text-slate-900">Validation</h3>
              <div class="mt-4 space-y-4">
                <div v-for="item in validationChecklist" :key="item.label" class="flex items-start gap-3">
                  <span class="mt-1 h-2.5 w-2.5 rounded-full" :class="item.valid ? 'bg-emerald-500' : 'bg-rose-500'"></span>
                  <div>
                    <p class="text-sm font-semibold text-slate-900">{{ item.label }}</p>
                    <p class="text-sm text-slate-500">{{ item.help }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 class="text-lg font-semibold text-slate-900">Publishing States</h3>
              <div class="mt-4 flex flex-wrap gap-2 text-sm">
                <span class="rounded-full bg-slate-100 px-3 py-2 font-medium text-slate-600">Draft</span>
                <span class="rounded-full bg-blue-100 px-3 py-2 font-medium text-blue-700">Scheduled</span>
                <span class="rounded-full bg-emerald-100 px-3 py-2 font-medium text-emerald-700">Published</span>
              </div>
              <p class="mt-4 text-sm leading-6 text-slate-500">
                Save now as draft, publish immediately, or schedule for a future sitting. Results will be auto-generated after submission.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>

    <div class="sticky bottom-4 z-20 flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm font-semibold text-slate-900">{{ currentStepLabel }}</p>
        <p class="text-sm text-slate-500">Complete each step before publishing to students.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <AppButton text="Previous" variant="ghost" :disabled="currentStep === 1" @click="currentStep -= 1" />
        <AppButton v-if="currentStep < 4" text="Next Step" variant="primary" @click="nextStep" />
        <AppButton v-else text="Review Publish Options" variant="primary" @click="openPublishDialog" />
      </div>
    </div>

    <div v-if="showPublishModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div class="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Review & Publish</p>
            <h2 class="mt-2 text-2xl font-semibold text-slate-900">{{ wizard.title || 'Untitled exam draft' }}</h2>
          </div>
          <AppButton :icon="X" variant="ghost" @click="showPublishModal = false" />
        </div>

        <div class="mt-6 space-y-4">
          <button
            v-for="option in publishOptions"
            :key="option.state"
            type="button"
            class="w-full rounded-[24px] border p-5 text-left transition hover:border-[#D4AF37]/70 hover:bg-slate-50"
            @click="publishExam(option.state)"
          >
            <div class="flex items-center justify-between gap-4">
              <div>
                <h3 class="text-lg font-semibold text-slate-900">{{ option.label }}</h3>
                <p class="mt-2 text-sm leading-6 text-slate-500">{{ option.description }}</p>
              </div>
              <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="option.badgeClass">{{ option.state }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { X } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import SectionCard from '../components/SectionCard.vue'
import { cloneMock, questionBank, questionTopics, teacherProfile } from '../data/mockTeacherData'

const router = useRouter()
const uiStore = useSchoolAdminUiStore()

const steps = [
  { id: 1, short: 'Step 1', title: 'Basic Information', description: 'Set the what, who, and why of the exam.' },
  { id: 2, short: 'Step 2', title: 'Select Questions', description: 'Choose and order auto-gradable objective items.' },
  { id: 3, short: 'Step 3', title: 'Configure Settings', description: 'Control schedule, review, and anti-cheat rules.' },
  { id: 4, short: 'Step 4', title: 'Review & Publish', description: 'Confirm everything before students see it.' },
]

const subjects = [...new Set(teacherProfile.assignedSubjects)]
const classNames = [...new Set(teacherProfile.assignedClasses)]
const publishOptions = [
  { state: 'Draft', label: 'Keep as draft', description: 'Return later to finish scheduling or moderation changes.', badgeClass: 'bg-slate-100 text-slate-700' },
  { state: 'Scheduled', label: 'Schedule for later', description: 'Lock settings now and release to students at the chosen start time.', badgeClass: 'bg-blue-100 text-blue-700' },
  { state: 'Published', label: 'Publish immediately', description: 'Make this exam available now for assigned students.', badgeClass: 'bg-emerald-100 text-emerald-700' },
]

const currentStep = ref(1)
const questionSearch = ref('')
const showPublishModal = ref(false)
const autosaveLabel = ref('Saved just now')

const questionFilters = reactive({
  topic: '',
})

const wizard = reactive({
  title: '',
  subject: '',
  className: '',
  type: 'Multiple Choice',
  term: '',
  purpose: '',
  instructions: '',
  selectedQuestionIds: [],
  questionMarks: {},
  duration: 60,
  passMark: 50,
  startTime: '2026-05-15T09:00',
  endTime: '2026-05-15T10:00',
  randomizeQuestions: true,
  randomizeOptions: true,
  allowReview: false,
  showResultsInstantly: false,
  fullscreenMode: true,
  tabSwitchWarnings: true,
  captureDisconnects: true,
  webcamPrompt: false,
  status: 'Draft',
})

const questionOptions = ref(cloneMock(questionBank.filter(question => 
  teacherProfile.assignedSubjects.includes(question.subject) && 
  teacherProfile.assignedClasses.includes(question.className)
)))

const selectedQuestions = computed(() =>
  wizard.selectedQuestionIds
    .map((id) => questionOptions.value.find((question) => question.id === id))
    .filter(Boolean),
)

const filteredQuestionOptions = computed(() =>
  questionOptions.value.filter((question) => {
    const matchesSubject = !wizard.subject || question.subject === wizard.subject
    const matchesClass = !wizard.className || question.className === wizard.className
    const matchesSearch = !questionSearch.value || question.content.toLowerCase().includes(questionSearch.value.toLowerCase())
    const matchesTopic = !questionFilters.topic || question.topic === questionFilters.topic
    return matchesSubject && matchesClass && matchesSearch && matchesTopic
  }),
)

const totalMarks = computed(() =>
  selectedQuestions.value.reduce((sum, question) => sum + Number(wizard.questionMarks[question.id] || question.marks || 0), 0),
)

const currentStepLabel = computed(() => steps.find((step) => step.id === currentStep.value)?.title || '')
const publishState = computed(() => wizard.status)
const scheduleSummary = computed(() => {
  if (!wizard.startTime || !wizard.endTime) return 'Start and end time not fully set'
  return `${wizard.startTime.replace('T', ' ')} to ${wizard.endTime.replace('T', ' ')}`
})

const validationChecklist = computed(() => [
  { label: 'Basic exam information complete', help: 'Title, subject, class, term, and purpose should be selected.', valid: Boolean(wizard.title && wizard.subject && wizard.className && wizard.term && wizard.purpose) },
  { label: 'Question paper prepared', help: 'At least one objective question is needed before review.', valid: selectedQuestions.value.length > 0 },
  { label: 'Scheduling and scoring configured', help: 'Duration, pass mark, and start/end time should be valid.', valid: Boolean(wizard.duration >= 10 && wizard.passMark >= 1 && wizard.passMark <= 100 && wizard.startTime && wizard.endTime) },
])

const studentToggles = [
  { key: 'randomizeQuestions', label: 'Randomize questions', help: 'Shuffle question order per student session.' },
  { key: 'randomizeOptions', label: 'Randomize options', help: 'Reduce answer-pattern copying in objective sections.' },
  { key: 'allowReview', label: 'Allow review before submission', help: 'Students can return to earlier questions before final submit.' },
  { key: 'showResultsInstantly', label: 'Show results instantly', help: 'Release objective scores immediately after submission where appropriate.' },
]
const isSelected = (id) => wizard.selectedQuestionIds.includes(id)

const toggleQuestion = (question) => {
  if (isSelected(question.id)) {
    wizard.selectedQuestionIds = wizard.selectedQuestionIds.filter((item) => item !== question.id)
    delete wizard.questionMarks[question.id]
  } else {
    wizard.selectedQuestionIds.push(question.id)
    wizard.questionMarks[question.id] = question.marks
  }
  autosaveLabel.value = 'Draft updated just now'
}

const moveQuestion = (index, direction) => {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= wizard.selectedQuestionIds.length) return
  const updated = [...wizard.selectedQuestionIds]
  const [item] = updated.splice(index, 1)
  updated.splice(nextIndex, 0, item)
  wizard.selectedQuestionIds = updated
}

const resetQuestionSelection = () => {
  wizard.selectedQuestionIds = []
  wizard.questionMarks = {}
}

const validateStep = () => {
  const [basicReady, questionReady, settingsReady] = validationChecklist.value.map((item) => item.valid)
  const currentMap = {
    1: basicReady,
    2: questionReady,
    3: settingsReady,
    4: true,
  }
  if (!currentMap[currentStep.value]) {
    uiStore.addToast({
      title: 'Complete the current step',
      message: 'Some required fields are still missing. Review the validation panel before moving on.',
      variant: 'error',
    })
  }
  return currentMap[currentStep.value]
}

const nextStep = () => {
  if (validateStep() && currentStep.value < 4) {
    currentStep.value += 1
  }
}

const jumpToStep = (step) => {
  if (step <= currentStep.value || validateStep()) {
    currentStep.value = step
  }
}

const saveDraft = () => {
  wizard.status = 'Draft'
  autosaveLabel.value = 'Saved just now'
  uiStore.addToast({
    title: 'Draft saved',
    message: 'Your objective exam setup is now stored as a draft mock state.',
    variant: 'success',
  })
}

const openPublishDialog = () => {
  if (!validationChecklist.value.every((item) => item.valid)) {
    validateStep()
    return
  }
  showPublishModal.value = true
}

const publishExam = (state) => {
  wizard.status = state
  showPublishModal.value = false
  uiStore.addToast({
    title: `Exam ${state.toLowerCase()}`,
    message: state === 'Published' ? 'Students can now access this exam and their answers will be auto-scored.' : state === 'Scheduled' ? 'The exam has been scheduled successfully.' : 'The exam remains in draft for later edits.',
    variant: 'success',
  })
  router.push('/teachers/exams')
}
</script>

<style scoped>
.wizard-field {
  display: grid;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(51 65 85);
}

.wizard-input {
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

.wizard-input:focus {
  border-color: #0b1f3a;
  box-shadow: 0 0 0 3px rgb(212 175 55 / 0.25);
}
</style>
