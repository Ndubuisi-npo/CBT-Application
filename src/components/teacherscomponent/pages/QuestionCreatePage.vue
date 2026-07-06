<template>
  <div class="space-y-6">

    <!-- Breadcrumb + header -->
    <div>
      <nav class="flex items-center gap-1.5 text-xs text-slate-500">
        <RouterLink to="/teachers/questions" class="transition hover:text-slate-900">Question Bank</RouterLink>
        <span class="text-slate-300">/</span>
        <span class="font-medium text-slate-700">{{ isEditing ? 'Edit Question' : 'Create Question' }}</span>
      </nav>
      <div class="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">Teacher Portal</p>
          <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {{ isEditing ? 'Edit Question' : 'Create Question' }}
          </h1>
          <p class="mt-1 text-sm text-slate-500">Build and preview your question before saving.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <RouterLink
            to="/teachers/questions"
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </RouterLink>
          <button
            type="button"
            class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            :disabled="saving"
            @click="submitQuestion('Draft')"
          >
            Save as Draft
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0F2940] disabled:opacity-60"
            :disabled="saving"
            @click="submitQuestion('Published')"
          >
            <LoaderCircle v-if="saving" class="h-4 w-4 animate-spin" />
            <Send v-else class="h-4 w-4" />
            Publish Question
          </button>
        </div>
      </div>
    </div>

    <!-- Error banner -->
    <div v-if="error" class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
      {{ error }}
    </div>

    <!-- Main workspace -->
    <div class="grid gap-6 xl:grid-cols-[1fr_380px]">

      <!-- Left: Question form -->
      <div class="space-y-6">

        <!-- Metadata -->
        <section class="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 class="mb-5 text-base font-semibold text-slate-900">Question Metadata</h2>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label class="block text-sm font-medium text-slate-700">
                Type <span class="text-red-500">*</span>
              </label>
              <select v-model="form.type" class="sa-input mt-1.5" @change="onTypeChange">
                <option value="">Select type</option>
                <option value="mcq">Multiple Choice</option>
                <option value="true_false">True / False</option>
                <option value="fill_in_blank">Fill in the Blank</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700">
                Class Level <span class="text-red-500">*</span>
              </label>
              <select v-model="form.class_level_id" class="sa-input mt-1.5" @change="onClassLevelChange">
                <option value="">Select class</option>
                <option v-for="cl in classLevels" :key="cl.id" :value="cl.id">{{ cl.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700">Class Arm</label>
              <select v-model="form.class_arm_id" class="sa-input mt-1.5">
                <option value="">All arms</option>
                <option v-for="arm in classArms" :key="arm.id" :value="arm.id">{{ arm.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700">
                Subject <span class="text-red-500">*</span>
              </label>
              <select v-model="form.subject_id" class="sa-input mt-1.5">
                <option value="">Select subject</option>
                <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700">Marks</label>
              <input v-model.number="form.marks" type="number" min="0.5" step="0.5" class="sa-input mt-1.5" placeholder="1" />
            </div>
          </div>
        </section>

        <!-- Question content -->
        <section class="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 class="mb-5 text-base font-semibold text-slate-900">Question Content</h2>
          <div>
            <label class="block text-sm font-medium text-slate-700">
              Question Stem <span class="text-red-500">*</span>
            </label>
            <div class="mt-1.5 overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/20">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2">
                <div class="flex flex-wrap gap-2">
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{{ typeLabel || 'Select a type above' }}</span>
                  <span v-if="form.type === 'mcq' && form.allow_multiple_answers" class="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Multiple Answer</span>
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Auto-Graded</span>
                </div>
                <button
                  type="button"
                  class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                  @click="showMathKeyboard = !showMathKeyboard"
                >
                  <span>∑</span>
                  {{ showMathKeyboard ? 'Hide Math Keyboard' : 'Show Math Keyboard' }}
                </button>
              </div>
              
              <!-- MathLive Math Field -->
              <div v-if="showMathKeyboard" class="border-b border-slate-200 bg-slate-50 p-4">
                <label class="block text-xs font-medium text-slate-600 mb-2">Math Editor (for equations, symbols, functions)</label>
                <div ref="mathFieldRef" class="mathfield border border-slate-300 rounded-lg bg-white p-3 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20" />
                <button
                  type="button"
                  class="mt-2 text-xs font-medium text-[#0B1F3A] hover:underline"
                  @click="insertMathToContent"
                >
                  Insert into Question Stem →
                </button>
              </div>

              <textarea
                ref="textareaRef"
                v-model="form.content"
                rows="6"
                class="block min-h-[140px] w-full rounded-b-xl border-0 bg-white px-4 py-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                :placeholder="contentPlaceholder"
              />

              <!-- removed separate LaTeX preview — live preview now renders KaTeX -->
            </div>
          </div>
        </section>

        <!-- MCQ: Multiple answer toggle + Answer options -->
        <section v-if="form.type === 'mcq'" class="rounded-2xl border border-slate-200 bg-white p-6">
          <div class="mb-5 space-y-4">
            <div class="flex items-start justify-between">
              <div>
                <h2 class="text-base font-semibold text-slate-900">Answer Options</h2>
                <p class="mt-0.5 text-sm text-slate-500">Add options and mark the correct answer(s).</p>
              </div>
              <button
                type="button"
                class="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                @click="addOption"
              >
                <Plus class="h-4 w-4" />
                Add Option
              </button>
            </div>

            <!-- Multiple Answer Toggle -->
            <div class="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div class="flex-1">
                <p class="text-sm font-medium text-slate-900">Allow Multiple Answers</p>
                <p class="text-xs text-slate-500 mt-0.5">
                  When ON, students can select more than one correct answer. Minimum 2 correct answers required.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                :aria-checked="form.allow_multiple_answers"
                class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2"
                :class="form.allow_multiple_answers ? 'bg-[#0B1F3A]' : 'bg-slate-300'"
                @click="toggleMultipleAnswers"
              >
                <span
                  class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  :class="form.allow_multiple_answers ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="(option, index) in form.options"
              :key="index"
              class="grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-xl border p-4 transition"
              :class="option.is_correct ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/30'"
            >
              <div class="flex flex-col items-center gap-1 pt-1">
                <!-- Single answer: radio; Multiple answer: checkbox -->
                <input
                  v-if="!form.allow_multiple_answers"
                  type="radio"
                  :name="`correct-${form.id || 'new'}`"
                  :checked="option.is_correct"
                  class="h-4 w-4 text-[#0B1F3A]"
                  @change="markCorrect(index)"
                />
                <input
                  v-else
                  type="checkbox"
                  :checked="option.is_correct"
                  class="h-4 w-4 rounded text-[#0B1F3A]"
                  @change="toggleCorrect(index)"
                />
                <span class="text-xs font-bold text-slate-400">{{ String.fromCharCode(65 + index) }}</span>
              </div>
              <div class="space-y-2">
                <input
                  v-model="option.content"
                  type="text"
                  class="sa-input"
                  :placeholder="`Option ${String.fromCharCode(65 + index)} text`"
                />
                <div class="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    class="text-xs font-medium text-[#0B1F3A] transition hover:underline"
                    @click="toggleOptionMath(index)"
                  >
                    ∑ {{ optionMathOpen[String(index)] ? 'Hide Math Keyboard' : 'Math Keyboard' }}
                  </button>
                </div>
                <div v-if="optionMathOpen[String(index)]" class="rounded-lg border border-slate-200 bg-white p-3">
                  <div :ref="(el) => setOptionMathFieldRef(el, index)" class="mathfield min-h-[60px] rounded-lg border border-slate-300 bg-slate-50 p-3" />
                  <button
                    type="button"
                    class="mt-2 text-xs font-medium text-[#0B1F3A] hover:underline"
                    @click="insertMathIntoOption(index)"
                  >
                    Insert into Option →
                  </button>
                </div>
                <span v-if="option.is_correct" class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <Check class="h-3 w-3" /> Correct Answer
                </span>
              </div>
              <button
                type="button"
                class="mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                :disabled="form.options.length <= 2"
                @click="removeOption(index)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>

          <p v-if="form.allow_multiple_answers && correctAnswerCount < 2" class="mt-3 text-xs text-amber-600">
            Select at least 2 options as correct answers for a multiple-answer question.
          </p>
          <p v-else-if="!form.allow_multiple_answers && !hasMcqCorrectAnswer" class="mt-3 text-xs text-amber-600">
            Select one option as the correct answer before publishing.
          </p>
        </section>

        <!-- True / False: Correct answer selector -->
        <section v-if="form.type === 'true_false'" class="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 class="mb-5 text-base font-semibold text-slate-900">Correct Answer</h2>
          <p class="mb-4 text-sm text-slate-500">Mark which option is correct.</p>
          <div class="flex gap-4">
            <label
              class="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border p-4 transition"
              :class="form.true_false_correct === 'True' ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'"
            >
              <input type="radio" v-model="form.true_false_correct" value="True" class="h-4 w-4 text-[#0B1F3A]" />
              <span class="font-medium text-slate-800">True</span>
              <Check v-if="form.true_false_correct === 'True'" class="ml-auto h-4 w-4 text-emerald-600" />
            </label>
            <label
              class="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border p-4 transition"
              :class="form.true_false_correct === 'False' ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'"
            >
              <input type="radio" v-model="form.true_false_correct" value="False" class="h-4 w-4 text-[#0B1F3A]" />
              <span class="font-medium text-slate-800">False</span>
              <Check v-if="form.true_false_correct === 'False'" class="ml-auto h-4 w-4 text-emerald-600" />
            </label>
          </div>
          <p v-if="!form.true_false_correct" class="mt-3 text-xs text-amber-600">
            Select the correct answer before publishing.
          </p>
        </section>

        <!-- Fill in the Blank: Acceptable answers -->
        <section v-if="form.type === 'fill_in_blank'" class="rounded-2xl border border-slate-200 bg-white p-6">
          <div class="mb-5 flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold text-slate-900">Acceptable Answers</h2>
              <p class="mt-0.5 text-sm text-slate-500">All entries are treated as correct. Do not mark a "correct" answer N/A the API rejects it.</p>
            </div>
            <button
              type="button"
              class="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              @click="addFitbAnswer"
            >
              <Plus class="h-4 w-4" />
              Add Answer
            </button>
          </div>

          <div class="space-y-3">
            <div
              v-for="(ans, index) in form.acceptable_answers"
              :key="index"
              class="grid grid-cols-[1fr_auto_auto] items-center gap-3"
            >
              <input
                v-model="ans.content"
                type="text"
                class="sa-input"
                :placeholder="`Acceptable answer ${index + 1}`"
              />
              <label class="flex items-center gap-2 text-sm text-slate-600 whitespace-nowrap">
                <input type="checkbox" v-model="ans.case_sensitive" class="h-4 w-4 rounded text-[#0B1F3A]" />
                Case sensitive
              </label>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                :disabled="form.acceptable_answers.length <= 1"
                @click="removeFitbAnswer(index)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>

          <p v-if="!hasFitbAnswers" class="mt-3 text-xs text-amber-600">
            Provide at least one acceptable answer before publishing.
          </p>
        </section>

      </div>

      <!-- Right: Preview + validation -->
      <div class="space-y-6">

        <!-- Live preview -->
        <section class="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 class="mb-4 text-base font-semibold text-slate-900">Live Preview</h2>
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div class="flex flex-wrap gap-2">
              <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{{ typeLabel || 'N/A' }}</span>
              <span v-if="form.type === 'mcq' && form.allow_multiple_answers" class="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Multiple Answer</span>
              <span v-if="selectedSubjectName" class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{{ selectedSubjectName }}</span>
              <span v-if="selectedClassName" class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{{ selectedClassName }}</span>
            </div>
            <div class="mt-4 text-sm leading-6 text-slate-800 preview-reset">
              <div v-html="form.content ? renderedContent : 'Your question preview will appear here once you start typing…'" />
            </div>

            <!-- MCQ preview -->
            <div v-if="form.type === 'mcq'" class="mt-4 space-y-2">
              <p v-if="form.allow_multiple_answers" class="text-xs font-semibold text-blue-700 mb-2">
                ☑ Select all correct answers
              </p>
              <div
                v-for="(option, index) in form.options.filter(o => o?.content?.trim())"
                :key="index"
                class="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm"
                :class="option.is_correct ? 'border-emerald-300 bg-emerald-50 font-semibold text-emerald-900' : 'border-slate-200 bg-white text-slate-700'"
              >
                <span v-if="form.allow_multiple_answers" class="h-4 w-4 rounded border-2 shrink-0" :class="option.is_correct ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'" />
                <span v-else class="h-4 w-4 rounded-full border-2 shrink-0" :class="option.is_correct ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'" />
                {{ String.fromCharCode(65 + index) }}. <span v-html="renderContentHtml(option.content)" />
                <span v-if="option.is_correct" class="ml-2 text-xs text-emerald-600">✓</span>
              </div>
              <div v-if="!form.options.some(o => o?.content?.trim())" class="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-400">
                Add options to see preview
              </div>
            </div>

            <!-- True/False preview -->
            <div v-if="form.type === 'true_false'" class="mt-4 space-y-2">
              <div
                v-for="val in ['True', 'False']"
                :key="val"
                class="rounded-xl border px-4 py-3 text-sm"
                :class="form.true_false_correct === val ? 'border-emerald-300 bg-emerald-50 font-semibold text-emerald-900' : 'border-slate-200 bg-white text-slate-700'"
              >
                {{ val }}
                <span v-if="form.true_false_correct === val" class="ml-2 text-xs text-emerald-600">✓ Correct</span>
              </div>
            </div>

            <!-- FITB preview -->
            <div v-if="form.type === 'fill_in_blank'" class="mt-4">
              <div class="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-400 text-center">
                [ Text input field ]
              </div>
              <div v-if="form.acceptable_answers.some(a => a.content?.trim())" class="mt-3">
                <p class="text-xs font-semibold text-slate-500 mb-1">Acceptable answers:</p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="(ans, i) in form.acceptable_answers.filter(a => a.content?.trim())"
                    :key="i"
                    class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800"
                  >
                    {{ ans.content }}<span v-if="ans.case_sensitive" class="ml-1 opacity-60">(case-sensitive)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Validation -->
        <section class="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 class="mb-4 text-base font-semibold text-slate-900">Validation</h2>
          <ul class="space-y-3">
            <ValidationItem :valid="!!form.type" label="Question type selected" />
            <ValidationItem :valid="!!form.subject_id" label="Subject assigned" />
            <ValidationItem :valid="!!form.class_level_id" label="Class level set" />
            <ValidationItem :valid="form.content.trim().length > 0" label="Question stem added" />
            <template v-if="form.type === 'mcq' && !form.allow_multiple_answers">
              <ValidationItem :valid="hasMcqCorrectAnswer" label="Correct option selected" />
              <ValidationItem :valid="form.options.filter(o => o?.content?.trim()).length >= 2" label="At least 2 options" />
            </template>
            <template v-if="form.type === 'mcq' && form.allow_multiple_answers">
              <ValidationItem :valid="correctAnswerCount >= 2" label="At least 2 correct options" />
              <ValidationItem :valid="form.options.filter(o => o?.content?.trim()).length >= 2" label="At least 2 options" />
            </template>
            <template v-if="form.type === 'true_false'">
              <ValidationItem :valid="!!form.true_false_correct" label="Correct answer selected (True/False)" />
            </template>
            <template v-if="form.type === 'fill_in_blank'">
              <ValidationItem :valid="hasFitbAnswers" label="At least 1 acceptable answer" />
            </template>
          </ul>
        </section>

        <!-- Save info -->
        <section class="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 class="text-sm font-semibold text-slate-900">Save Status</h2>
          <p class="mt-2 text-xs leading-5 text-slate-500">
            <strong>Draft</strong> N/A keeps the question private until reviewed.<br />
            <strong>Published</strong> N/A makes it available for use in exam creation immediately.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { AlertCircle, Check, LoaderCircle, Plus, Send, Trash2 } from 'lucide-vue-next'
import { useTeacherExamsStore } from '../stores/exams'
import { useTeachersQuestionsStore } from '../stores/questions'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { getAuthUser } from '../../../js/lib/auth'
import {
  QUESTION_TYPE_LABELS,
  isChoiceBased,
  isFillInBlank,
  defaultMcqOption,
  defaultTrueFalseOptions,
  defaultFitbAnswer,
} from '../../../types/question'
import { MathfieldElement } from 'mathlive'
import katex from 'katex'
import 'katex/dist/katex.min.css'

// Inline validation item component
const ValidationItem = {
  props: { valid: Boolean, label: String },
  template: `
    <li class="flex items-center gap-3 text-sm">
      <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
        :class="valid ? 'bg-emerald-100' : 'bg-slate-100'">
        <svg v-if="valid" class="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span v-else class="h-2 w-2 rounded-full bg-slate-300" />
      </span>
      <span :class="valid ? 'text-slate-800' : 'text-slate-400'">{{ label }}</span>
    </li>
  `,
}

const router = useRouter()
const route = useRoute()
const examsStore = useTeacherExamsStore()
const questionsStore = useTeachersQuestionsStore()
const uiStore = useSchoolAdminUiStore()

const saving = ref(false)
const error = ref(null)
const classLevels = ref([])
const classArms = ref([])
const subjects = ref([])

// MathLive state
const showMathKeyboard = ref(false)
const mathFieldRef = ref(null)
const textareaRef = ref(null)
const optionMathFieldRefs = ref({})
const optionMathFields = ref({})
const optionMathOpen = ref({})
let mathField = null

const questionId = computed(() => route.query.edit || null)
const isEditing = computed(() => !!questionId.value)
const teacherClassLevel = computed(() => getAuthUser()?.teacher_profile?.class_level || null)

const typeLabel = computed(() => QUESTION_TYPE_LABELS[form.type] || '')

const contentPlaceholder = computed(() => {
  if (form.type === 'fill_in_blank') return 'Use ___ to indicate the blank. E.g. "The capital of Nigeria is ___."'
  if (form.type === 'true_false') return 'Write a statement that is either True or False…'
  return 'Type the full question stem here…'
})

const escapeHtml = (unsafe = '') => {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const renderContentHtml = (src = '') => {
  if (!src) return ''

  try {
    const mathOrTextRegex = /(\$\$[\s\S]+?\$\$|\$[^$]+\$)/g
    let lastIndex = 0
    const parts = []
    let match

    while ((match = mathOrTextRegex.exec(src)) !== null) {
      const idx = match.index
      if (idx > lastIndex) {
        const textSegment = src.slice(lastIndex, idx)
        parts.push(escapeHtml(textSegment).replace(/\n/g, '<br/>'))
      }

      const token = match[0]
      if (token.startsWith('$$') && token.endsWith('$$')) {
        const inner = token.slice(2, -2)
        parts.push(katex.renderToString(inner, { throwOnError: false, displayMode: true }))
      } else if (token.startsWith('$') && token.endsWith('$')) {
        const inner = token.slice(1, -1)
        parts.push(katex.renderToString(inner, { throwOnError: false, displayMode: false }))
      } else {
        parts.push(escapeHtml(token))
      }

      lastIndex = mathOrTextRegex.lastIndex
    }

    if (lastIndex < src.length) {
      const tail = src.slice(lastIndex)
      parts.push(escapeHtml(tail).replace(/\n/g, '<br/>'))
    }

    return parts.join('')
  } catch (e) {
    return escapeHtml(src).replace(/\n/g, '<br/>')
  }
}

// Render content: plain text is escaped; math segments wrapped in $...$ or $$...$$ are rendered via KaTeX
const renderedContent = computed(() => renderContentHtml(form.content || ''))

const form = reactive({
  id: null,
  type: '',
  content: '',
  class_level_id: '',
  class_arm_id: '',
  subject_id: '',
  marks: 1,
  allow_multiple_answers: false,
  // MCQ
  options: [
    { content: '', label: '', order: 1, is_correct: false },
    { content: '', label: '', order: 2, is_correct: false },
    { content: '', label: '', order: 3, is_correct: false },
    { content: '', label: '', order: 4, is_correct: false },
  ],
  // True/False
  true_false_correct: '',
  // FITB
  acceptable_answers: [{ content: '', case_sensitive: false }],
})

// ── Computed validators ──────────────────────────────────────────────────────

const hasMcqCorrectAnswer = computed(() => form.options.some((o) => o.is_correct && o.content?.trim()))
const correctAnswerCount = computed(() => form.options.filter((o) => o.is_correct && o.content?.trim()).length)
const hasFitbAnswers = computed(() => form.acceptable_answers.some((a) => a.content?.trim()))

const selectedSubjectName = computed(() => subjects.value.find((s) => s.id === form.subject_id)?.name || '')
const selectedClassName = computed(() => classLevels.value.find((c) => c.id === form.class_level_id)?.name || '')

// ── Type change handler ──────────────────────────────────────────────────────

const onTypeChange = () => {
  form.options = form.type === 'true_false'
    ? defaultTrueFalseOptions().map((o) => ({ ...o }))
    : [
        { content: '', label: '', order: 1, is_correct: false },
        { content: '', label: '', order: 2, is_correct: false },
        { content: '', label: '', order: 3, is_correct: false },
        { content: '', label: '', order: 4, is_correct: false },
      ]
  form.true_false_correct = ''
  form.acceptable_answers = [{ content: '', case_sensitive: false }]
  form.allow_multiple_answers = false
}

// ── Multiple answer toggle ──────────────────────────────────────────────────

const toggleMultipleAnswers = () => {
  form.allow_multiple_answers = !form.allow_multiple_answers
  // Reset all correct marks when switching modes
  form.options.forEach((o) => { o.is_correct = false })
}

// ── MCQ helpers ──────────────────────────────────────────────────────────────

const addOption = () => {
  form.options.push({ content: '', label: '', order: form.options.length + 1, is_correct: false })
}

const removeOption = (index) => {
  if (form.options.length <= 2) return
  form.options.splice(index, 1)
}

/** Single-answer: radio N/A only one can be correct */
const markCorrect = (index) => {
  form.options.forEach((o, i) => { o.is_correct = i === index })
}

/** Multiple-answer: checkbox N/A toggle individual option */
const toggleCorrect = (index) => {
  form.options[index].is_correct = !form.options[index].is_correct
}

// ── FITB helpers ─────────────────────────────────────────────────────────────

const addFitbAnswer = () => {
  form.acceptable_answers.push({ content: '', case_sensitive: false })
}

const removeFitbAnswer = (index) => {
  if (form.acceptable_answers.length <= 1) return
  form.acceptable_answers.splice(index, 1)
}

// ── MathLive Math Keyboard ─────────────────────────────────────────────────────

const initMathField = () => {
  if (!mathFieldRef.value) return
  mathField = new MathfieldElement()
  mathFieldRef.value.appendChild(mathField)
  mathField.value = ''
}

const insertMathToContent = () => {
  if (!mathField || !textareaRef.value) return
  const latex = mathField.value
  if (!latex) return

  const mathContent = latex.startsWith('$') ? latex : `$${latex}$`
  const textarea = textareaRef.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = form.content

  form.content = text.substring(0, start) + mathContent + text.substring(end)
  mathField.value = ''
  textarea.focus()
  textarea.setSelectionRange(start + mathContent.length, start + mathContent.length)
}

const setOptionMathFieldRef = (el, index) => {
  const key = String(index)
  if (el) {
    optionMathFieldRefs.value[key] = el
    if (optionMathOpen.value[key] && !optionMathFields.value[key]) {
      nextTick(() => initOptionMathField(index))
    }
  }
}

const initOptionMathField = (index) => {
  const key = String(index)
  const container = optionMathFieldRefs.value[key]
  if (!container) return
  if (optionMathFields.value[key]) return
  const field = new MathfieldElement()
  container.appendChild(field)
  optionMathFields.value[key] = field
  field.value = ''
}

const toggleOptionMath = (index) => {
  const key = String(index)
  const isOpen = !!optionMathOpen.value[key]
  optionMathOpen.value[key] = !isOpen
  if (!isOpen) {
    nextTick(() => initOptionMathField(index))
  }
}

const insertMathIntoOption = (index) => {
  const key = String(index)
  const field = optionMathFields.value[key]
  if (!field) return
  const latex = field.value
  if (!latex) return

  const mathContent = latex.startsWith('$') ? latex : `$${latex}$`
  const current = form.options[index]?.content || ''
  form.options[index].content = `${current}${current ? ' ' : ''}${mathContent}`
  field.value = ''
}

// Watch for keyboard visibility changes to initialize/cleanup
watch(showMathKeyboard, (isVisible) => {
  if (isVisible && !mathField) {
    // Small delay to ensure DOM is ready
    setTimeout(() => initMathField(), 100)
  }
})

// ── Metadata loading ─────────────────────────────────────────────────────────

const loadMetadata = async () => {
  try {
    await examsStore.loadFormMetadata()
    classLevels.value = examsStore.classLevels || []
    subjects.value = examsStore.subjects || []

    if (teacherClassLevel.value?.id && !form.class_level_id) {
      form.class_level_id = teacherClassLevel.value.id
      await onClassLevelChange()
    }
  } catch (e) {
    console.error('Failed to load metadata', e)
  }
}

const onClassLevelChange = async () => {
  form.class_arm_id = ''
  if (form.class_level_id) {
    await examsStore.loadClassArms(form.class_level_id)
    classArms.value = examsStore.classArms || []
    await examsStore.loadSubjectsForClassLevel(form.class_level_id)
    subjects.value = examsStore.subjects || []
  }
}

// ── Validation ───────────────────────────────────────────────────────────────

const validateForm = () => {
  if (!form.type) { error.value = 'Please select a question type.'; return false }
  if (!form.subject_id) { error.value = 'Please select a subject.'; return false }
  if (!form.class_level_id) { error.value = 'Please select a class level.'; return false }
  if (!form.content?.trim()) { error.value = 'Question content is required.'; return false }

  if (form.type === 'mcq') {
    if (form.allow_multiple_answers) {
      if (correctAnswerCount.value < 2) {
        error.value = 'Multiple-answer questions require at least 2 correct options.'
        return false
      }
    } else {
      if (!hasMcqCorrectAnswer.value) { error.value = 'Please mark one option as correct.'; return false }
    }
    if (form.options.filter((o) => o?.content?.trim()).length < 2) {
      error.value = 'Please provide at least 2 answer options.'
      return false
    }
  }

  if (form.type === 'true_false') {
    if (!form.true_false_correct) { error.value = 'Please select the correct answer (True or False).'; return false }
  }

  if (form.type === 'fill_in_blank') {
    if (!hasFitbAnswers.value) { error.value = 'Please provide at least one acceptable answer.'; return false }
  }

  return true
}

// ── Submit ───────────────────────────────────────────────────────────────────

const submitQuestion = async (status) => {
  error.value = null
  if (!validateForm()) return
  saving.value = true

  try {
    let options

    if (form.type === 'mcq') {
      options = form.options
        .filter((o) => o?.content?.trim())
        .map((o, i) => ({
          content: o.content.trim(),
          label: o.label || String.fromCharCode(65 + i),
          order: i + 1,
          is_correct: !!o.is_correct,
        }))
    } else if (form.type === 'true_false') {
      options = [
        { content: 'True', is_correct: form.true_false_correct === 'True' },
        { content: 'False', is_correct: form.true_false_correct === 'False' },
      ]
    } else {
      // fill_in_blank N/A is_correct must NOT be included (server rejects with 422)
      options = form.acceptable_answers
        .filter((a) => a.content?.trim())
        .map((a) => ({
          content: a.content.trim(),
          match_pair: JSON.stringify({ case_sensitive: !!a.case_sensitive }),
        }))
    }

    const payload = {
      type: form.type,
      content: form.content.trim(),
      subject_id: form.subject_id,
      class_level_id: form.class_level_id || undefined,
      class_arm_id: form.class_arm_id || undefined,
      marks: form.marks || 1,
      status,
      options,
      // Send allow_multiple_answers for MCQ
      ...(form.type === 'mcq' ? { allow_multiple_answers: form.allow_multiple_answers } : {}),
    }

    if (isEditing.value) {
      await questionsStore.updateQuestion(questionId.value, payload)
      uiStore.addToast({ title: 'Question updated', message: 'Your question has been saved.', variant: 'success' })
    } else {
      await questionsStore.createQuestion(payload)
      uiStore.addToast({ title: 'Question saved', message: `Question ${status === 'Published' ? 'published' : 'saved as draft'}.`, variant: 'success' })
    }
    router.push('/teachers/questions')
  } catch (err) {
    error.value = err?.message || 'Failed to save question. Please try again.'
  } finally {
    saving.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  await loadMetadata()

  if (isEditing.value) {
    try {
      const existing = questionsStore.questions.find((q) => String(q.id) === String(questionId.value))
      if (existing) {
        form.id = existing.id
        form.type = existing.type || ''
        form.content = existing.content || existing.question_text || ''
        form.subject_id = existing.subject?.id || existing.subject_id || ''
        form.class_level_id = existing.class_level?.id || existing.class_level_id || ''
        form.class_arm_id = existing.class_arm?.id || existing.class_arm_id || ''
        form.marks = existing.marks || existing.default_marks || 1

        if (existing.type === 'fill_in_blank') {
          if (existing.acceptable_answers?.length) {
            form.acceptable_answers = existing.acceptable_answers.map((a) => ({
              content: a.content || '',
              case_sensitive: !!a.case_sensitive,
            }))
          }
        } else if (existing.type === 'true_false') {
          const correctOpt = existing.options?.find((o) => o.is_correct)
          if (correctOpt) form.true_false_correct = correctOpt.content
        } else {
          // MCQ
          if (existing.options?.length) {
            form.options = existing.options.map((o) => ({
              id: o.id,
              content: o.content || o.text || '',
              label: o.label || '',
              order: o.order || 0,
              is_correct: !!(o.is_correct || o.isCorrect),
            }))
          }
          // Detect multiple answer
          const correctCount = form.options.filter((o) => o.is_correct).length
          form.allow_multiple_answers = existing.allow_multiple_answers === true || correctCount > 1
        }

        if (form.class_level_id) await onClassLevelChange()
      }
    } catch (e) {
      console.error('Could not pre-fill question', e)
    }
  }
})

onUnmounted(() => {
  if (mathField && mathFieldRef.value) {
    mathFieldRef.value.removeChild(mathField)
    mathField = null
  }

  Object.entries(optionMathFields.value).forEach(([index, field]) => {
    const container = optionMathFieldRefs.value[index]
    if (container && field) {
      container.removeChild(field)
    }
  })
  optionMathFields.value = {}
  optionMathFieldRefs.value = {}
})
</script>

<style scoped>
/* Ensure the preview uses the app's default font and neutral colors
   Prevent KaTeX or inserted HTML from bringing in custom fonts/colors
   and avoid text overflow from long tokens. */
.preview-reset {
  font-family: inherit;
  color: inherit;
  line-height: 1.5;
  white-space: pre-wrap; /* preserve line breaks */
  word-break: break-word;
  overflow-wrap: anywhere;
}
.preview-reset img { max-width: 100%; height: auto; }

/* Target common KaTeX classes and force default font/color */
.preview-reset .katex,
.preview-reset .katex *,
.preview-reset .katex-html {
  font-family: inherit !important;
  color: inherit !important;
  background: transparent !important;
}

/* Prevent inline color classes from changing text color inside preview */
.preview-reset [class*="text-"] {
  color: inherit !important;
}

/* Neutralize common utility classes that may affect fonts or background */
.preview-reset [class*="font-"] {
  font-weight: inherit !important;
  font-style: inherit !important;
}
.preview-reset [class*="bg-"] {
  background: transparent !important;
}
.preview-reset [class*="leading-"] {
  line-height: inherit !important;
}

/* KaTeX sometimes creates wide inline elements; force wrapping and limit width */
.preview-reset .katex {
  max-width: 100%;
  display: inline-block;
  vertical-align: baseline;
  overflow-wrap: anywhere;
}
.preview-reset .katex .katex-html {
  overflow-wrap: anywhere;
}

</style>
