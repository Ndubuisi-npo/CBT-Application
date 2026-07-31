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
            class="rounded-2xl border p-4 text-left transition"
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
                  <select v-model="wizard.subject_id" class="wizard-input">
                    <option value="">Select subject</option>
                    <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
                  </select>
                </label>
                <label class="wizard-field">
                  <span>Class Level</span>
                  <select v-model="wizard.class_level_id" class="wizard-input" @change="examsStore.fetchArms(wizard.class_level_id)">
                    <option value="">Select class</option>
                    <option v-for="c in classLevels" :key="c.id" :value="c.id">{{ c.name }}</option>
                  </select>
                </label>
                <label class="wizard-field">
                  <span>Class Arm (optional)</span>
                  <select v-model="wizard.class_arm_id" class="wizard-input">
                    <option value="">All arms</option>
                    <option v-for="a in classArms" :key="a.id" :value="a.id">{{ a.name }}</option>
                  </select>
                </label>
                <div class="wizard-field">
                  <span>Exam Type</span>
                  <select v-model="wizard.type" class="wizard-input">
                    <option value="exam">Exam</option>
                    <option value="test">Test</option>
                  </select>
                </div>
                <label class="wizard-field">
                  <span>Session</span>
                  <select v-model="wizard.session_id" class="wizard-input" @change="examsStore.fetchTerms(wizard.session_id)">
                    <option value="">Select session</option>
                    <option v-for="s in sessions" :key="s.id" :value="s.id">{{ s.name }}</option>
                  </select>
                </label>
                <label class="wizard-field">
                  <span>Term</span>
                  <select v-model="wizard.term_id" class="wizard-input">
                    <option value="">Select term</option>
                    <option v-for="t in terms" :key="t.id" :value="t.id">{{ t.name }}</option>
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
              <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
                <div class="flex flex-wrap gap-2">
                  <input v-model="questionSearch" type="text" class="wizard-input min-w-[240px]" placeholder="Search question bank" />
                  <select v-model="questionFilters.topic" class="wizard-input min-w-[200px]">
                    <option value="">All topics</option>
                    <option v-for="topic in questionTopics" :key="topic" :value="topic">{{ topic }}</option>
                  </select>
                  <label class="flex items-center gap-2 text-sm text-slate-600">
                    Total Marks
                    <input v-model.number="wizard.totalMarks" type="number" min="0" class="wizard-input w-28" placeholder="100" />
                  </label>
                </div>
                <div class="text-sm text-slate-500">{{ selectedQuestions.length }} question(s) selected</div>
              </div>

              <!-- 06-00-00 fault isolation banners -->
              <div v-if="marksEngine.lockedExceedsTotal.value" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Locked marks exceed total. Reduce a locked question.
              </div>
              <div v-else-if="marksEngine.allLocked.value && Math.abs(marksEngine.submitCheck.value.difference) > 0.01" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                All questions are locked. The sum of marks ({{ marksEngine.submitCheck.value.sum }}) must equal the exam total ({{ wizard.totalMarks ?? 0 }}) before you can save.
              </div>
              <div v-else-if="marksEngine.zeroPoolNoMarksLeft.value" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                No marks left to distribute — locked questions already use the full exam total.
              </div>

              <div class="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
                <div class="space-y-4">
                  <h3 class="text-lg font-semibold text-slate-900">Objective Question Browser</h3>
                  <article
                    v-for="question in filteredQuestionOptions"
                    :key="question.id"
                    class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div class="space-y-3">
                        <div class="flex flex-wrap gap-2">
                          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Multiple Choice</span>
                        </div>
                        <h4 class="text-base font-semibold text-slate-900">{{ question.content }}</h4>
                        <p class="text-sm text-slate-500">{{ question.topic }} • {{ question.className }} • {{ question.default_marks ?? question.marks }} marks</p>
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

                  <div v-if="!selectedQuestions.length" class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                    Add objective questions from the left. The stored correct answers will be used for auto-grading after submission.
                  </div>

                  <div v-else class="space-y-3">
                    <article
                      v-for="(question, index) in selectedQuestions"
                      :key="question.id"
                      class="rounded-2xl border p-4"
                      :class="question.draft.is_marks_locked ? 'border-amber-200 bg-amber-50/40' : marksEngine.zeroPoolNoMarksLeft.value ? 'border-slate-200 bg-slate-100' : 'border-slate-200 bg-slate-50'"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="space-y-2">
                          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Question {{ index + 1 }}</p>
                          <h4 class="text-sm font-semibold text-slate-900">{{ question.content }}</h4>
                          <div class="flex flex-wrap gap-2">
                            <span class="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">{{ question.topic }}</span>
                            <span class="rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700">Correct answer stored</span>
                            <span
                              class="rounded-full px-3 py-1 text-xs font-medium"
                              :class="question.draft.is_marks_locked ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'"
                            >
                              {{ question.draft.is_marks_locked ? 'Locked' : 'Unlocked' }}
                            </span>
                          </div>
                        </div>
                        <div class="flex items-center gap-2">
                          <AppButton text="Up" variant="ghost" size="sm" :disabled="index === 0" @click="moveQuestion(index, -1)" />
                          <AppButton text="Down" variant="ghost" size="sm" :disabled="index === selectedQuestions.length - 1" @click="moveQuestion(index, 1)" />
                          <AppButton
                            :text="question.draft.is_marks_locked ? 'Unlock' : 'Lock'"
                            :variant="question.draft.is_marks_locked ? 'outline' : 'secondary'"
                            size="sm"
                            @click="toggleQuestionLock(question.id)"
                          />
                        </div>
                      </div>

                      <div class="mt-4 grid gap-3 sm:grid-cols-[120px_1fr]">
                        <label class="wizard-field">
                          <span>Marks</span>
                          <input
                            :value="question.draft.marks"
                            type="number"
                            min="0"
                            step="0.01"
                            class="wizard-input"
                            :class="question.draft.is_marks_locked ? '' : 'bg-slate-100 text-slate-500'"
                            :disabled="!question.draft.is_marks_locked"
                            @input="updateQuestionMarks(question.id, $event.target.value)"
                          />
                        </label>
                        <div class="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500">
                          {{
                            question.draft.is_marks_locked
                              ? 'Teacher-controlled mark. Unlock to let the system redistribute it.'
                              : 'System-controlled mark. Lock to set a fixed mark for this question.'
                          }}
                        </div>
                      </div>
                    </article>
                  </div>

                  <div class="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    <div class="flex items-center justify-between">
                      <span>Locked sum</span>
                      <span class="font-semibold text-slate-900">{{ marksEngine.lockedSum.value }}</span>
                    </div>
                    <div class="mt-1 flex items-center justify-between">
                      <span>Remaining for unlocked pool</span>
                      <span class="font-semibold text-slate-900">{{ marksEngine.remaining.value }}</span>
                    </div>
                    <div class="mt-1 flex items-center justify-between">
                      <span>Allocated total</span>
                      <span class="font-semibold text-slate-900">{{ marksEngine.submitCheck.value.sum }} / {{ wizard.totalMarks ?? 0 }}</span>
                    </div>
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
                  <span>Total Marks</span>
                  <input v-model.number="wizard.totalMarks" type="number" min="0" class="wizard-input" />
                </label>
                <label class="wizard-field">
                  <span>Pass Mark (%)</span>
                  <input v-model.number="wizard.passMark" type="number" min="0" max="100" class="wizard-input" />
                </label>
                <label class="wizard-field">
                  <span>Max Attempts</span>
                  <input v-model.number="wizard.maxAttempts" type="number" min="1" class="wizard-input" />
                </label>
                <label class="wizard-field">
                  <span>Scheduled Start</span>
                  <input v-model="wizard.scheduledStart" type="datetime-local" class="wizard-input" />
                </label>
              </div>

              <div class="">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
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
              <div class="rounded-2xl bg-[#0B1F3A] p-6 text-white">
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Exam Preview</p>
                    <h2 class="mt-3 text-3xl font-semibold">{{ wizard.title || 'Untitled exam draft' }}</h2>
                    <p class="mt-2 text-sm text-slate-300">
                      {{ subjects.find(s => s.id === wizard.subject_id)?.name || 'Subject' }}
                      • {{ classLevels.find(c => c.id === wizard.class_level_id)?.name || 'Class' }}
                      • {{ wizard.type === 'exam' ? 'Exam' : 'Test' }}
                    </p>
                  </div>
                  <span class="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">{{ statusLabel }}</span>
                </div>
                <p class="mt-5 max-w-3xl text-sm leading-6 text-slate-200">{{ wizard.instructions || 'No student instructions added yet.' }}</p>
              </div>

              <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div class="rounded-2xl border border-slate-200 bg-white p-5">
                  <p class="text-sm text-slate-500">Questions</p>
                  <p class="mt-3 text-3xl font-semibold text-slate-900">{{ selectedQuestions.length }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-white p-5">
                  <p class="text-sm text-slate-500">Total Marks</p>
                  <p class="mt-3 text-3xl font-semibold text-slate-900">{{ wizard.totalMarks ?? 0 }}</p>
                  <p class="mt-2 text-xs text-slate-400">Allocated preview total: {{ totalMarks }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-white p-5">
                  <p class="text-sm text-slate-500">Duration</p>
                  <p class="mt-3 text-3xl font-semibold text-slate-900">{{ wizard.duration }} mins</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-white p-5">
                  <p class="text-sm text-slate-500">Pass Mark</p>
                  <p class="mt-3 text-3xl font-semibold text-slate-900">{{ wizard.passMark }}%</p>
                </div>
              </div>

              <div class="rounded-2xl border border-slate-200 bg-white p-5">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-slate-900">Review Checklist</h3>
                  <button type="button" class="text-sm font-semibold text-[#0B1F3A] hover:text-[#D4AF37]" @click="showSaveModal = true">
                    Save exam draft
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
            <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
                  <span class="font-semibold text-slate-900">{{ statusLabel }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>Auto-save</span>
                  <span class="font-semibold text-emerald-700">{{ autosaveLabel }}</span>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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

            <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 class="text-lg font-semibold text-slate-900">Lifecycle States</h3>
              <div class="mt-4 flex flex-wrap gap-2 text-sm">
                <span class="rounded-full bg-slate-100 px-3 py-2 font-medium text-slate-600">Draft</span>
                <span class="rounded-full bg-blue-100 px-3 py-2 font-medium text-blue-700">Submitted</span>
                <span class="rounded-full bg-emerald-100 px-3 py-2 font-medium text-emerald-700">Active</span>
                <span class="rounded-full bg-slate-200 px-3 py-2 font-medium text-slate-700">Completed</span>
              </div>
              <p class="mt-4 text-sm leading-6 text-slate-500">
                Save the exam as a draft, then submit it for review. The school admin will activate it. Completed exams show results after the exam ends.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>

    <div class="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm font-semibold text-slate-900">{{ currentStepLabel }}</p>
        <p class="text-sm text-slate-500">Complete each step before saving the exam draft.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <AppButton text="Previous" variant="ghost" :disabled="currentStep === 1" @click="currentStep -= 1" />
        <AppButton v-if="currentStep < 4" text="Next Step" variant="primary" @click="nextStep" />
        <AppButton v-else text="Create Exam" variant="primary" @click="openSaveDialog" />
      </div>
    </div>

    <div v-if="showSaveModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div class="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Create Exam</p>
            <h2 class="mt-2 text-2xl font-semibold text-slate-900">{{ wizard.title || 'Untitled exam draft' }}</h2>
          </div>
          <AppButton :icon="X" variant="ghost" @click="showSaveModal = false" />
        </div>

        <div class="mt-6 space-y-4">
          <button
            v-for="option in saveOptions"
            :key="option.state"
            type="button"
            class="w-full rounded-2xl border p-5 text-left transition hover:border-[#D4AF37]/70 hover:bg-slate-50"
            @click="saveExam"
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { X } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import SectionCard from '../components/SectionCard.vue'
import { useTeacherExamsStore } from '../stores/exams'
import { toDatetimeLocalIsoWithOffset } from '../../../js/lib/helpers'
import { useExamMarksDistribution } from '../composables/useExamMarksDistribution'

const router   = useRouter()
const uiStore  = useSchoolAdminUiStore()
const examsStore = useTeacherExamsStore()

const steps = [
  { id: 1, short: 'Step 1', title: 'Basic Information', description: 'Set the what, who, and why of the exam.' },
  { id: 2, short: 'Step 2', title: 'Select Questions', description: 'Choose and order auto-gradable objective items.' },
  { id: 3, short: 'Step 3', title: 'Configure Settings', description: 'Control schedule, review, and anti-cheat rules.' },
  { id: 4, short: 'Step 4', title: 'Review & Save', description: 'Confirm everything before saving the draft.' },
]

// Reference data  loaded from API; fallback to empty arrays
const subjects   = computed(() => examsStore.subjects.map((s) => ({ id: s.id, name: s.name || s.title || s.code })))
const classLevels = computed(() => examsStore.classLevels)
const classArms   = computed(() => examsStore.classArms)
const sessions    = computed(() => examsStore.sessions)
const terms       = computed(() => examsStore.terms)
const questionTopics = computed(() => [...new Set(questionOptions.value.map((q) => q.topic).filter(Boolean))])

const saveOptions = [
  { state: 'Draft', label: 'Save as draft', description: 'Save now and launch from the Exams page when ready.', badgeClass: 'bg-slate-100 text-slate-700' },
]

const currentStep      = ref(1)
const questionSearch   = ref('')
const showSaveModal = ref(false)
const autosaveLabel    = ref('Not saved yet')
const saving           = ref(false)
const createdExamId    = ref(null)
const linkedQuestionIds = ref(new Map()) // question_id -> exam_question id already saved on the backend

const questionFilters = reactive({ topic: '' })
const questionBankLoaded = ref(false)

const wizard = reactive({
  title: '',
  subject_id: '',
  class_level_id: '',
  class_arm_id: '',
  term_id: '',
  session_id: '',
  type: 'exam',
  instructions: '',
  duration: 60,
  totalMarks: null,
  passMark: 50,
  maxAttempts: 1,
  scheduledStart: '',
  randomizeQuestions: true,
  randomizeOptions: true,
  allowReview: false,
  showResultsInstantly: false,
  status: 'draft',
  // UI helpers
  subject: '',
  className: '',
  term: '',
})

// Question bank from API
const questionOptions  = computed(() => examsStore.questionBank)

// FE-MD-100: draft-state marks distribution engine. The exam total marks
// value drives the live preview for unlocked questions.
const totalMarksRef = computed(() => wizard.totalMarks)
const marksEngine = useExamMarksDistribution(totalMarksRef)

// Selected questions = draft entries (question_id, marks, is_marks_locked,
// order) merged with their display details from the question bank.
const selectedQuestions = computed(() =>
  marksEngine.draftQuestions.value
    .map((draft) => {
      const details = questionOptions.value.find((q) => String(q.id) === String(draft.question_id))
      if (!details) return null
      return { ...details, draft }
    })
    .filter(Boolean)
)

const filteredQuestionOptions = computed(() =>
  questionOptions.value.filter((q) => {
    const matchesSearch = !questionSearch.value || (q.content || '').toLowerCase().includes(questionSearch.value.toLowerCase())
    const matchesTopic  = !questionFilters.topic || q.topic === questionFilters.topic
    return matchesSearch && matchesTopic
  })
)

// Allocated preview total (sum of current draft marks) — for display only.
const totalMarks = computed(() => marksEngine.submitCheck.value.sum)

const currentStepLabel = computed(() => steps.find((s) => s.id === currentStep.value)?.title || '')
const statusLabel      = computed(() => wizard.status)
const scheduleSummary  = computed(() => {
  if (!wizard.scheduledStart) return 'Scheduled start not set'
  return wizard.scheduledStart.replace('T', ' ')
})

const validationChecklist = computed(() => [
  {
    label: 'Basic exam information complete',
    help:  'Title, subject, class level, and term should be selected.',
    valid: Boolean(wizard.title && wizard.subject_id && wizard.class_level_id && wizard.term_id),
  },
  {
    label: 'Question paper prepared',
    help:  'At least one question is needed, and allocated marks must match the exam total.',
    valid: selectedQuestions.value.length > 0 && marksEngine.canSubmit.value,
  },
  {
    label: 'Scheduling and scoring configured',
    help:  'Duration and pass mark should be valid.',
    valid: wizard.duration >= 1 && wizard.passMark >= 0,
  },
])

const studentToggles = [
  { key: 'randomizeQuestions',  label: 'Randomize questions',              help: 'Shuffle question order per student session.' },
  { key: 'randomizeOptions',    label: 'Randomize options',                help: 'Reduce answer-pattern copying.' },
  { key: 'allowReview',         label: 'Allow review before submission',   help: 'Students can return to earlier questions.' },
  { key: 'showResultsInstantly',label: 'Show results instantly',           help: 'Release scores immediately after submission.' },
]

const isSelected = (id) => marksEngine.draftQuestions.value.some((q) => String(q.question_id) === String(id))

// Trigger event: add / remove a question (04-01-00 #1, #2)
const toggleQuestion = (question) => {
  const sid = String(question.id)
  if (isSelected(sid)) {
    marksEngine.removeQuestion(sid)
  } else {
    marksEngine.addQuestion({
      question_id: sid,
      default_marks: question.default_marks ?? question.marks ?? 1,
      marks: question.default_marks ?? question.marks ?? 1,
    })
  }
  autosaveLabel.value = 'Unsaved changes'
}

// Trigger event: lock / unlock a question (04-01-00 #3, #4)
const toggleQuestionLock = (questionId) => {
  const sid = String(questionId)
  const draft = marksEngine.draftQuestions.value.find((q) => String(q.question_id) === sid)
  if (!draft) return
  if (draft.is_marks_locked) {
    marksEngine.unlockQuestion(sid) // 04-02-00: fresh automatic value, not the stale one
  } else {
    marksEngine.lockQuestion(sid) // 04-02-00: keep current value, remove from pool
  }
  autosaveLabel.value = 'Unsaved changes'
}

// Trigger event: edit the marks value of a locked question (04-01-00 #5)
const updateQuestionMarks = (questionId, value) => {
  const { accepted, max } = marksEngine.editLockedMarks(questionId, value)
  if (!accepted) {
    // 05-03-00: block the input, show an inline error, do not let it reach submit
    uiStore.addToast({
      title: 'Marks exceed remaining total',
      message: `This question can hold at most ${max} mark(s) without exceeding the exam total.`,
      variant: 'error',
    })
    return
  }
  autosaveLabel.value = 'Unsaved changes'
}

const moveQuestion = (index, direction) => {
  const ids = selectedQuestions.value.map((q) => q.draft.question_id)
  const next = index + direction
  if (next < 0 || next >= ids.length) return
  ;[ids[index], ids[next]] = [ids[next], ids[index]]
  marksEngine.reorder(ids)
}

const resetQuestionSelection = () => {
  marksEngine.setQuestions([])
}

const loadQuestionBank = async (force = false) => {
  if (questionBankLoaded.value && !force) return
  await examsStore.fetchQuestionBank()
  questionBankLoaded.value = true
}

const validateStep = () => {
  const [basicReady, questionReady, settingsReady] = validationChecklist.value.map((i) => i.valid)
  const map = { 1: basicReady, 2: questionReady, 3: settingsReady, 4: true }
  if (!map[currentStep.value]) {
    uiStore.addToast({ title: 'Complete the current step', message: 'Some required fields are missing.', variant: 'error' })
  }
  return map[currentStep.value]
}

const nextStep = () => {
  if (validateStep() && currentStep.value < 4) currentStep.value += 1
}

const jumpToStep = (step) => {
  if (step <= currentStep.value || validateStep()) currentStep.value = step
}

// -- API save / submit ---------------------------------------------------------

const buildPayload = () => ({
  title:            wizard.title,
  subject_id:       wizard.subject_id,
  class_level_id:   wizard.class_level_id,
  class_arm_id:     wizard.class_arm_id || null,
  term_id:          wizard.term_id,
  type:             wizard.type,
  duration_minutes: wizard.duration,
  total_marks:      wizard.totalMarks,
  pass_mark:        wizard.passMark,
  max_attempts:     wizard.maxAttempts,
  scheduled_start:  toDatetimeLocalIsoWithOffset(wizard.scheduledStart) || null,
  instructions:     wizard.instructions,
})

// 07-01-00 / 06-00-00: refuse to submit while a fault condition is active.
const blockedByMarksFault = () => {
  if (!selectedQuestions.value.length) return false
  if (marksEngine.lockedExceedsTotal.value) {
    uiStore.addToast({ title: 'Locked marks exceed total', message: 'Reduce a locked question before saving.', variant: 'error' })
    return true
  }
  if (!marksEngine.canSubmit.value) {
    uiStore.addToast({
      title: 'Marks do not match exam total',
      message: `Allocated marks (${marksEngine.submitCheck.value.sum}) must equal the exam total (${wizard.totalMarks ?? 0}).`,
      variant: 'error',
    })
    return true
  }
  return false
}

// 07-02-00: create the exam once (if needed) or update its details, then
// sync the draft question list against the backend using the per-question
// endpoints (the backend has no bulk/replace endpoint — PUT /api/exams/{id}
// does not accept a `questions` field).
const persistExam = async () => {
  if (!createdExamId.value) {
    const record = await examsStore.createExam(buildPayload())
    createdExamId.value = record.id
  } else {
    await examsStore.updateExam(createdExamId.value, buildPayload())
  }
  linkedQuestionIds.value = await examsStore.syncExamQuestions(
    createdExamId.value,
    marksEngine.draftQuestions.value,
    linkedQuestionIds.value,
  )
}

const saveDraft = async () => {
  if (!wizard.title) {
    uiStore.addToast({ title: 'Title required', message: 'Add a title before saving.', variant: 'error' })
    return
  }
  if (blockedByMarksFault()) return
  saving.value = true
  try {
    await persistExam()
    autosaveLabel.value = 'Saved just now'
    uiStore.addToast({ title: 'Draft saved', message: 'Exam saved as draft.', variant: 'success' })
  } catch (err) {
    uiStore.addToast({ title: 'Save failed', message: err.message, variant: 'error' })
  } finally {
    saving.value = false
  }
}

const openSaveDialog = () => {
  if (!validationChecklist.value.every((i) => i.valid)) {
    validateStep()
    return
  }
  if (blockedByMarksFault()) return
  showSaveModal.value = true
}

const saveExam = async () => {
  if (blockedByMarksFault()) return
  showSaveModal.value = false
  saving.value = true
  try {
    await persistExam()
    autosaveLabel.value = 'Saved'
    uiStore.addToast({
      title: 'Exam created',
      message: 'Your exam has been created. Launch it from the Exams page when ready.',
      variant: 'success',
    })
    router.push('/teachers/exams')
  } catch (err) {
    uiStore.addToast({ title: 'Error', message: err.message, variant: 'error' })
  } finally {
    saving.value = false
  }
}

// -- Lifecycle -----------------------------------------------------------------

onMounted(async () => {
  await examsStore.fetchRefData()
  await loadQuestionBank().catch(() => {})
})

watch(currentStep, async (step) => {
  if (step === 2) {
    await loadQuestionBank(true).catch(() => {})
  }
})
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
