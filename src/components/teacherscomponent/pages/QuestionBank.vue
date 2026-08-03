<template>
  <div data-tour="question-bank-page" class="space-y-6">
    <SectionCard title="Question Bank" subtitle="Create and manage multiple choice questions that can be auto-graded by the system.">
      <template #header>
        <div class="flex flex-wrap items-center gap-3">
          <button type="button" class="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
            {{ totalQuestions }} questions
          </button>
          <AppButton :icon="Plus" text="Create Question" variant="primary" size="md" @click="$router.push('/teachers/questions/create')" />
        </div>
      </template>

      <div class="space-y-5 pt-6">
        <div class="grid gap-4 xl:grid-cols-[1.6fr_repeat(2,minmax(0,1fr))]">
          <label class="relative block">
            <Search class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by question stem, topic, or class"
              class="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#D4AF37]/40"
            />
          </label>

          <select v-model="filters.subject" class="question-filter">
            <option value="">All Subjects</option>
            <option v-for="subject in subjects" :key="subject" :value="subject">{{ subject }}</option>
          </select>
          <!-- Topic filter removed -->
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
          <div class="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <button type="button" class="rounded-full bg-white px-4 py-2 font-semibold text-slate-700 shadow-sm">
              {{ filteredQuestions.length }} filtered
            </button>
            <button type="button" class="rounded-full bg-white px-4 py-2 font-semibold text-slate-700 shadow-sm">
              {{ selectedIds.length }} selected
            </button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <AppButton text="Clear Filters" variant="outline" size="sm" @click="clearFilters" />
            <!-- <AppButton text="Bulk Publish" variant="secondary" size="sm" :disabled="!selectedIds.length" @click="bulkAction('publish')" /> -->
            <!-- <AppButton text="Mark Draft" variant="secondary" size="sm" :disabled="!selectedIds.length" @click="bulkAction('draft')" /> -->
            <AppButton text="Delete" variant="danger" size="sm" :disabled="!selectedIds.length" @click="bulkAction('delete')" />
            <AppButton text="Add selected to exam" variant="primary" size="sm" :disabled="!selectedIds.length || !assessmentId" @click="addSelectedToAssessment" />
          </div>
        </div>
      </div>
    </SectionCard>

    <div v-if="isLoading" class="space-y-4">
      <div v-for="item in 6" :key="item" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="animate-pulse space-y-4">
          <div class="h-5 w-1/4 rounded bg-slate-100"></div>
          <div class="h-4 rounded bg-slate-100"></div>
          <div class="grid gap-3 md:grid-cols-4">
            <div class="h-12 rounded-2xl bg-slate-100"></div>
            <div class="h-12 rounded-2xl bg-slate-100"></div>
            <div class="h-12 rounded-2xl bg-slate-100"></div>
            <div class="h-12 rounded-2xl bg-slate-100"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!paginatedQuestions.length" class="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
      <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
        <FileQuestion class="h-10 w-10 text-slate-400" />
      </div>
      <h2 class="mt-6 text-2xl font-semibold text-slate-900">No questions match these filters</h2>
      <p class="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
        Try adjusting your search, switching class filters, or create a new multiple choice question to keep your exam workflow moving.
      </p>
      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <AppButton text="Reset Filters" variant="outline" @click="clearFilters" />
        <AppButton :icon="Plus" text="Create Question" variant="primary" @click="$router.push('/teachers/questions/create')" />
      </div>
    </div>

    <div v-else class="space-y-4">
      <article
        v-for="question in paginatedQuestions"
        :key="question.id"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#D4AF37]/70 hover:shadow-md"
      >
        <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div class="flex min-w-0 flex-1 gap-4">
            <label class="mt-1">
              <input v-model="selectedIds" type="checkbox" :value="question.id" class="h-4 w-4 rounded border-slate-300 text-[#0B1F3A] focus:ring-[#D4AF37]" />
            </label>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{{ getQuestionTypeLabel(question) }}</span>
                <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="question.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
                  {{ question.status }}
                </span>
              </div>
              <div class="mt-4 text-lg font-semibold text-slate-900" v-html="renderQuestionText(getQuestionText(question))" />
              <div class="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                <span class="rounded-full bg-slate-100 px-3 py-2">{{ getQuestionSubject(question) || 'No subject' }}</span>
                <!-- topic removed -->
                <span class="rounded-full bg-slate-100 px-3 py-2">{{ getQuestionClassName(question) || 'No class' }}</span>
                <span v-if="getQuestionClassArm(question)" class="rounded-full bg-slate-100 px-3 py-2">{{ getQuestionClassArm(question) }}</span>
                <span class="rounded-full bg-slate-100 px-3 py-2">{{ getQuestionMarks(question) }} marks</span>
                <span class="rounded-full bg-slate-100 px-3 py-2">Used {{ question.usageCount || question.usage_count || 0 }} times</span>
              </div>

              <!-- MCQ / True-False: show options -->
              <div v-if="isChoiceBasedQuestion(question) && question.options?.length" class="mt-4 grid gap-2 md:grid-cols-2">
                <div
                  v-for="(option, idx) in (question.options || []).slice(0, 4)"
                  :key="option.id || idx"
                  class="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm"
                  :class="isQuestionOptionCorrect(question, option) ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-600'"
                >
                  <span>{{ String.fromCharCode(65 + idx) }}. <span v-html="renderOptionContent(getOptionContent(option))" /></span>
                  <span v-if="isQuestionOptionCorrect(question, option)" class="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Correct</span>
                </div>
              </div>

              <!-- FITB: show acceptable answers -->
              <div v-else-if="isFillInBlankQuestion(question)" class="mt-4">
                <p class="text-xs font-semibold text-slate-500 mb-2">Acceptable answers:</p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="(ans, idx) in (question.acceptable_answers || []).slice(0, 4)"
                    :key="idx"
                    class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800"
                  >
                    {{ ans.content || ans }}
                  </span>
                  <span v-if="!(question.acceptable_answers?.length)" class="text-xs text-slate-400 italic">No answers configured</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 lg:justify-end">
            <AppButton :icon="Eye" text="Preview" variant="outline" size="sm" @click="previewQuestion(question)" />
            <AppButton :icon="PencilLine" text="Edit" variant="secondary" size="sm" @click="$router.push(`/teachers/questions/create?edit=${question.id}`)" />
            <!-- <AppButton :icon="question.status === 'Published' ? FilePenLine : Send" :text="question.status === 'Published' ? 'Draft' : 'Publish'" variant="ghost" size="sm" @click="toggleStatus(question)" /> -->
          </div>
        </div>
      </article>

      <div class="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-slate-500">Showing {{ pageStart }} - {{ pageEnd }} of {{ filteredQuestions.length }} questions</p>
        <div class="flex items-center gap-2">
          <AppButton text="Previous" variant="outline" size="sm" :disabled="currentPage === 1" @click="currentPage -= 1" />
          <button
            v-for="page in totalPages"
            :key="page"
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold transition"
            :class="currentPage === page ? 'bg-[#0B1F3A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            @click="currentPage = page"
          >
            {{ page }}
          </button>
          <AppButton text="Next" variant="outline" size="sm" :disabled="currentPage === totalPages" @click="currentPage += 1" />
        </div>
      </div>
    </div>

    <div v-if="previewItem" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div class="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Question Preview</p>
            <h2 class="mt-2 text-2xl font-semibold text-slate-900">{{ previewItem.subject }} - {{ previewItem.className }}</h2>
          </div>
          <AppButton :icon="X" variant="ghost" @click="previewItem = null" />
        </div>
        <div class="mt-6 rounded-2xl bg-slate-50 p-5">
          <div class="flex flex-wrap gap-2">
            <span class="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-600">{{ getQuestionTypeLabel(previewItem) }}</span>
            <span class="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-600">{{ previewItem.marks }} marks</span>
          </div>
          <div class="mt-5 text-sm leading-7 text-slate-800" v-html="renderQuestionText(previewItem.content)" />

          <!-- MCQ / True-False options -->
          <div v-if="isChoiceBasedQuestion(previewItem) && previewItem.options?.length" class="mt-5 space-y-3">
            <div
              v-for="(option, index) in previewItem.options"
              :key="option.id || index"
              class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              :class="isQuestionOptionCorrect(previewItem, option) ? 'border-emerald-300 bg-emerald-100 text-emerald-900 font-semibold shadow-sm' : 'text-slate-700'"
            >
              <span>{{ String.fromCharCode(65 + index) }}. <span v-html="renderOptionContent(getOptionContent(option))" /></span>
              <span v-if="isQuestionOptionCorrect(previewItem, option)" class="ml-3 rounded-full bg-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800">Correct</span>
            </div>
            <div class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              Correct answer: {{ getQuestionCorrectAnswerText(previewItem) || 'Not set' }}
            </div>
          </div>

          <!-- FITB acceptable answers -->
          <div v-else-if="isFillInBlankQuestion(previewItem)" class="mt-5">
            <div class="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-400 text-center mb-4">
              [ Student types their answer here ]
            </div>
            <p class="text-xs font-semibold text-slate-500 mb-2">Acceptable answers:</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(ans, i) in (previewItem.acceptable_answers || [])"
                :key="i"
                class="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-800"
              >
                {{ ans.content || ans }}
                <span v-if="ans.case_sensitive" class="ml-1 opacity-60">(case-sensitive)</span>
              </span>
              <span v-if="!previewItem.acceptable_answers?.length" class="text-xs text-slate-400 italic">No acceptable answers configured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onActivated, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Eye, FilePenLine, FileQuestion, PencilLine, Plus, Search, Send, Trash2, X } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { useTeacherExamsStore } from '../stores/exams'
import SectionCard from '../components/SectionCard.vue'
import { useTeachersQuestionsStore } from '../stores/questions'
import { getSubjects, getClassLevels } from '../services/api/exams'
import { getAuthUser } from '../../../js/lib/auth'
import { isChoiceBased, isFillInBlank, QUESTION_TYPE_LABELS } from '../../../types/question'
import katex from 'katex'
import 'katex/dist/katex.min.css'

// Returns the API-canonical type string for a question
const getQuestionApiType = (question) => question.type || ''
const isChoiceBasedQuestion = (question) => isChoiceBased(getQuestionApiType(question))
const isFillInBlankQuestion = (question) => isFillInBlank(getQuestionApiType(question))
const getQuestionTypeLabel = (question) => QUESTION_TYPE_LABELS[getQuestionApiType(question)] || question.type || 'Multiple Choice'

const uiStore = useSchoolAdminUiStore()
const examsStore = useTeacherExamsStore()
const questionsStore = useTeachersQuestionsStore()

const showEditor = ref(false)
const previewItem = ref(null)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 4
const selectedIds = ref([])
const form = reactive(createDefaultForm())

// Global subjects and class levels for question creation
const subjectsData = ref([])
const classLevelsData = ref([])

const filters = reactive({
  subject: '',
  topic: '',
  className: '',
})

const route = useRoute()
const assessmentId = computed(() => route.query.examId || route.query.assessmentId || null)

const questionStringValue = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.name || value.title || value.code || value.label || value.id || ''
}

const unwrapList = (response, keys = []) => {
  if (Array.isArray(response)) return response
  if (!response || typeof response !== 'object') return []

  for (const key of keys) {
    if (Array.isArray(response[key])) return response[key]
  }

  if (Array.isArray(response.data)) return response.data
  return []
}

const normalizeSubject = (subject) => {
  if (!subject || typeof subject !== 'object') {
    return { id: subject, name: String(subject ?? '') }
  }

  const nested = subject.subject && typeof subject.subject === 'object' ? subject.subject : null
  const source = nested || subject

  return {
    id: source.id ?? subject.subject_id ?? subject.id ?? source.name,
    name: source.name ?? source.title ?? subject.name ?? String(source.id ?? ''),
  }
}

const normalizeClass = (classItem) => {
  if (!classItem || typeof classItem !== 'object') {
    return { id: classItem, name: String(classItem ?? '') }
  }

  const nested = classItem.class_level && typeof classItem.class_level === 'object'
    ? classItem.class_level
    : classItem.class && typeof classItem.class === 'object'
      ? classItem.class
      : null
  const source = nested || classItem
  const classArmName = classItem.class_arm?.name || classItem.arm?.name || classItem.section
  const name = source.name ?? source.title ?? classItem.name ?? String(source.id ?? '')

  return {
    id: source.id ?? classItem.class_level_id ?? classItem.class_id ?? classItem.id ?? name,
    name: classArmName ? `${name} ${classArmName}` : name,
  }
}

const getTeacherClassLevel = () => getAuthUser()?.teacher_profile?.class_level || null

const escapeHtml = (unsafe = '') => {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const renderMathContent = (value = '') => {
  if (!value) return ''

  try {
    const mathOrTextRegex = /(\$\$[\s\S]+?\$\$|\$[^$]+\$)/g
    let lastIndex = 0
    const parts = []
    let match

    while ((match = mathOrTextRegex.exec(value)) !== null) {
      const idx = match.index
      if (idx > lastIndex) {
        const textSegment = value.slice(lastIndex, idx)
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

    if (lastIndex < value.length) {
      const tail = value.slice(lastIndex)
      parts.push(escapeHtml(tail).replace(/\n/g, '<br/>'))
    }

    return parts.join('')
  } catch {
    return escapeHtml(value).replace(/\n/g, '<br/>')
  }
}

const getQuestionText = (question) => question.content || question.question_text || ''
const renderQuestionText = (value) => renderMathContent(String(value ?? ''))
const renderOptionContent = (value) => renderMathContent(String(value ?? ''))
const getQuestionSubject = (question) => questionStringValue(question.subject) || question.subject_name || ''
const getQuestionTopic = (question) => questionStringValue(question.topic) || question.topic_name || ''
const getQuestionClassName = (question) => {
  return questionStringValue(question.className)
    || questionStringValue(question.class_name)
    || questionStringValue(question.class_level_name)
    || questionStringValue(question.classLevel)
    || questionStringValue(question.class)
    || ''
}
const getQuestionClassArm = (question) => {
  return questionStringValue(question.class_arm)
    || questionStringValue(question.classArm)
    || question.class_arm_name
    || question.classArmName
    || question.arm?.name
    || question.section
    || ''
}
const getQuestionMarks = (question) => question.marks ?? question.default_marks ?? question.points ?? 0
const getQuestionCorrectAnswer = (question) => question.correctAnswer ?? question.correct_answer ?? ''

const getOptionContent = (option) => {
  if (!option) return ''
  if (typeof option === 'string') return option
  return option.content ?? option.text ?? ''
}

const getOptionId = (option) => {
  if (!option || typeof option !== 'object') return ''
  return option.id ?? option.option_id ?? ''
}

const isQuestionOptionCorrect = (question, option) => {
  if (!option) return false
  if (typeof option === 'object' && (option.is_correct === true || option.is_correct === 1 || option.is_correct === 'true')) return true

  const answer = getQuestionCorrectAnswer(question)
  if (!answer) return false

  if (typeof answer === 'object') {
    const answerId = answer.id ?? answer.option_id ?? ''
    const answerContent = answer.content ?? answer.text ?? ''
    return Boolean(
      (answerId && String(answerId) === String(getOptionId(option))) ||
      (answerContent && answerContent === getOptionContent(option)),
    )
  }

  const answerText = String(answer)
  return answerText === String(getOptionId(option)) || answerText === getOptionContent(option)
}

const getQuestionCorrectAnswerText = (question) => {
  const correctOption = question.options?.find((option) => isQuestionOptionCorrect(question, option))
  if (correctOption) return getOptionContent(correctOption)

  const answer = getQuestionCorrectAnswer(question)
  if (!answer) return ''
  if (typeof answer === 'object') return answer.content ?? answer.text ?? answer.name ?? ''
  return String(answer)
}

const subjects = computed(() => [...new Set(questionsStore.questions.map((question) => getQuestionSubject(question)))].filter(Boolean))
const classNames = computed(() => [...new Set(questionsStore.questions.map((question) => getQuestionClassName(question)))].filter(Boolean))
const modalSubjects = computed(() => subjectsData.value || [])
const modalClassLevels = computed(() => classLevelsData.value || [])
// topic removed from Question Bank per API change
const totalQuestions = computed(() => questionsStore.questions.length)
const isLoading = computed(() => questionsStore.loading)

const selectedSubjectName = computed(() => {
  if (!form.subject_id) return ''
  const found = modalSubjects.value.find(s => s.id === form.subject_id)
  return found?.name || ''
})

const selectedClassName = computed(() => {
  if (!form.class_level_id) return ''
  const found = modalClassLevels.value.find(c => c.id === form.class_level_id)
  return found?.name || ''
})

const selectedArmName = computed(() => {
  if (!form.class_arm_id) return ''
  const found = examsStore.classArms.find(a => a.id === form.class_arm_id)
  return found?.name || ''
})

const filteredQuestions = computed(() =>
  questionsStore.questions.filter((question) => {
    const haystack = `${getQuestionText(question)} ${getQuestionTopic(question)} ${getQuestionSubject(question)} ${getQuestionClassName(question)}`.toLowerCase()
    return (
      (!searchQuery.value || haystack.includes(searchQuery.value.toLowerCase())) &&
      (!filters.subject || getQuestionSubject(question) === filters.subject) &&
      (!filters.topic || getQuestionTopic(question) === filters.topic) &&
      (!filters.className || getQuestionClassName(question) === filters.className)
    )
  }),
)

const totalPages = computed(() => Math.max(1, Math.ceil(filteredQuestions.value.length / pageSize)))
const paginatedQuestions = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredQuestions.value.slice(start, start + pageSize)
})
const pageStart = computed(() => (filteredQuestions.value.length ? (currentPage.value - 1) * pageSize + 1 : 0))
const pageEnd = computed(() => Math.min(currentPage.value * pageSize, filteredQuestions.value.length))
const editorModeLabel = computed(() => (form.status === 'Published' ? 'Published item' : 'Draft workspace'))
const hasValidAnswer = computed(() => {
  const filled = form.options.filter((o) => o && o.content && o.content.trim().length).length
  const hasCorrect = form.options.some((o) => o && o.is_correct)
  return filled >= 2 && hasCorrect
})

watch(filteredQuestions, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

function createDefaultForm() {
  return {
    id: '',
    type: 'Multiple Choice',
    subject: '',
    subject_id: '',
    topic: '',
    className: '',
    class_level_id: '',
    class_arm_id: '',
    status: 'Draft',
    marks: 2,
    content: '',
    // options are objects now: { content, is_correct, label, order }
    options: [
      { content: '', is_correct: true, label: '', order: 1 },
      { content: '', is_correct: false, label: '', order: 2 },
    ],
    correctAnswer: '',
    usageCount: 0,
  }
}

const resetForm = () => {
  Object.assign(form, createDefaultForm())
  const classLevel = getTeacherClassLevel()
  if (classLevel?.id) {
    form.class_level_id = classLevel.id
    form.className = classLevel.name || ''
  }
}

const hydrateForm = (question) => {
  if (!question) return
  // Normalize options to objects
  const opts = Array.isArray(question.options) ? question.options.map((o, idx) => {
    if (typeof o === 'string') {
      return { content: o, is_correct: isQuestionOptionCorrect(question, o), label: '', order: idx + 1 }
    }
    return {
      content: o.content ?? o.text ?? '',
      is_correct: o.is_correct ?? isQuestionOptionCorrect(question, o),
      label: o.label ?? '',
      order: o.order ?? (idx + 1),
    }
  }) : [ { content: '', is_correct: true, label: '', order: 1 }, { content: '', is_correct: false, label: '', order: 2 } ]

  Object.assign(form, {
    id: question.id,
    type: question.type || 'Multiple Choice',
    subject: question.subject_id || question.subject?.id || getQuestionSubject(question),
    subject_id: question.subject_id || question.subject?.id || '',
    topic: getQuestionTopic(question),
    className: getQuestionClassName(question),
    class_level_id: question.class_level_id || question.class_id || question.class_level?.id || question.class?.id || question.classLevel?.id || '',
    class_arm_id: question.class_arm_id || question.classArmId || question.class_arm?.id || question.classArm?.id || null,
    status: question.status || 'Draft',
    marks: getQuestionMarks(question) || 2,
    content: getQuestionText(question),
    options: opts,
    correctAnswer: getQuestionCorrectAnswer(question),
    usageCount: question.usageCount ?? question.usage_count ?? 0,
  })
}

const openEditor = async (question = null) => {
  resetForm()
  if (form.class_level_id) {
    await loadSubjectsForSelectedClassLevel(form.class_level_id)
  }

  if (question) {
    hydrateForm(question)
  }
  showEditor.value = true
}

const loadGlobalAssignments = async () => {
  try {
    const [subjectsResponse, classLevelsResponse] = await Promise.all([
      getSubjects(),
      getClassLevels(),
    ])

    const subjectsArray = Array.isArray(subjectsResponse) ? subjectsResponse : (subjectsResponse?.subjects || subjectsResponse?.data || [])
    subjectsData.value = subjectsArray.map(normalizeSubject).filter((subject) => subject.id && subject.name)

    const classLevelsArray = Array.isArray(classLevelsResponse)
      ? classLevelsResponse
      : (classLevelsResponse?.class_levels || classLevelsResponse?.data || classLevelsResponse || [])
    classLevelsData.value = classLevelsArray.map(normalizeClass).filter((classItem) => classItem.id && classItem.name)
  } catch (error) {
    console.error('Failed to load subjects and class levels:', error)
    uiStore.addToast({
      title: 'Unable to load metadata',
      message: error.message || 'Unable to load subjects and class levels.',
      variant: 'error',
    })
    subjectsData.value = []
    classLevelsData.value = []
  }
}

const loadSubjectsForSelectedClassLevel = async (classLevelId) => {
  try {
    const subjectsResponse = await getSubjects({ class_level_id: classLevelId })
    subjectsData.value = unwrapList(subjectsResponse, ['subjects']).map(normalizeSubject).filter((subject) => subject.id && subject.name)
    await examsStore.loadClassArms(classLevelId)
  } catch (error) {
    console.error('Failed to load subjects for class level:', error)
    uiStore.addToast({
      title: 'Unable to load subjects',
      message: error.message || 'Unable to load subjects for the selected class level.',
      variant: 'error',
    })
  }
}

const closeEditor = () => {
  showEditor.value = false
  resetForm()
}

const addOption = () => {
  const next = form.options.length + 1
  form.options.push({ content: '', is_correct: false, label: '', order: next })
}

const removeOption = (index) => {
  if (form.options.length <= 2) return
  const removed = form.options[index]
  form.options.splice(index, 1)
  // ensure at least one correct remains
  if (!form.options.some((o) => o.is_correct)) {
    if (form.options[0]) form.options[0].is_correct = true
  }
}

const markCorrect = (index) => {
  form.options = form.options.map((o, i) => ({ ...o, is_correct: i === index }))
}

const validateForm = () => {
  if (!form.subject_id || !form.class_level_id) {
    uiStore.addToast({
      title: 'Validation required',
      message: 'Subject and class must be selected before you can save this question.',
      variant: 'error',
    })
    return false
  }

  const filledOptions = form.options.filter((o) => o.content && o.content.trim().length)
  if (filledOptions.length < 2) {
    uiStore.addToast({ title: 'Options required', message: 'Please add at least two options.', variant: 'error' })
    return false
  }

  if (!form.options.some((o) => o.is_correct)) {
    uiStore.addToast({ title: 'Correct option', message: 'Select which option is correct.', variant: 'error' })
    return false
  }

  return true
}

const submitQuestion = async (status) => {
  if (!validateForm()) return

  const optionsPayload = form.options
    .filter((o) => o.content && o.content.trim().length)
    .map((o, idx) => ({
      content: o.content.trim(),
      is_correct: Boolean(o.is_correct),
      label: o.label ? String(o.label).slice(0, 10) : null,
      order: Number.isFinite(o.order) ? Number(o.order) : idx + 1,
    }))

  const payload = {
    id: form.id || undefined,
    type: 'Multiple Choice',
    subject_id: form.subject_id,
    // topic intentionally omitted per request
    class_level_id: form.class_level_id || form.className,
    class_arm_id: form.class_arm_id || null,
    status,
    content: form.content.trim(),
    options: optionsPayload,
  }

  try {
    if (form.id) {
      await questionsStore.updateQuestion(form.id, payload)
      uiStore.addToast({ title: 'Question updated', message: 'Your question has been updated successfully.', variant: 'success' })
    } else {
      await questionsStore.createQuestion(payload)
      uiStore.addToast({ title: status === 'Published' ? 'Question published' : 'Draft saved', message: status === 'Published' ? 'This multiple choice question is now available in exam creation.' : 'You can continue refining this question later.', variant: 'success' })
    }
    closeEditor()
  } catch (error) {
    let errorMessage = error.message || 'Unable to save the question right now.'
    // Handle validation errors from API
    if (error.response?.data?.errors) {
      const errors = error.response.data.errors
      if (typeof errors === 'object') {
        const firstError = Object.values(errors)[0]
        if (Array.isArray(firstError)) {
          errorMessage = firstError[0] || errorMessage
        } else if (typeof firstError === 'string') {
          errorMessage = firstError
        }
      }
    }
    uiStore.addToast({ title: 'Save failed', message: errorMessage, variant: 'error' })
  }
}

const previewQuestion = (question) => {
  previewItem.value = {
    ...question,
    subject: getQuestionSubject(question),
    topic: getQuestionTopic(question),
    className: getQuestionClassName(question),
    content: getQuestionText(question),
    marks: getQuestionMarks(question),
    correctAnswer: getQuestionCorrectAnswer(question),
  }
}

const toggleStatus = async (question) => {
  const updatedStatus = question.status === 'Published' ? 'Draft' : 'Published'
  try {
    await questionsStore.updateQuestion(question.id, { status: updatedStatus })
    uiStore.addToast({
      title: updatedStatus === 'Published' ? 'Question published' : 'Question moved to draft',
      message: `${getQuestionSubject(question)} multiple choice item updated successfully.`,
      variant: 'success',
    })
  } catch (error) {
    uiStore.addToast({
      title: 'Update failed',
      message: error.message || 'Unable to update question status.',
      variant: 'error',
    })
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  filters.subject = ''
  filters.topic = ''
  filters.className = ''
  selectedIds.value = []
}

const bulkAction = async (action) => {
  const selectedSet = new Set(selectedIds.value)
  if (!selectedSet.size) return

  try {
    if (action === 'delete') {
      await Promise.all([...selectedSet].map((id) => questionsStore.deleteQuestion(id)))
      uiStore.addToast({
        title: 'Questions deleted',
        message: `${selectedSet.size} question${selectedSet.size > 1 ? 's were' : ' was'} deleted.`,
        variant: 'success',
      })
    } else {
      const status = action === 'publish' ? 'Published' : 'Draft'
      await Promise.all(
        [...selectedSet].map((id) => questionsStore.updateQuestion(id, { status }))
      )
      uiStore.addToast({
        title: 'Bulk action complete',
        message: `${selectedSet.size} question${selectedSet.size > 1 ? 's were' : ' was'} updated.`,
        variant: 'success',
      })
    }
  } catch (error) {
    uiStore.addToast({
      title: 'Bulk update failed',
      message: error.message || 'Unable to complete the selected action.',
      variant: 'error',
    })
  } finally {
    selectedIds.value = []
  }
}

const addSelectedToAssessment = async () => {
  const selectedSet = new Set(selectedIds.value)
  if (!selectedSet.size || !assessmentId.value) return

  try {
    // This endpoint replaces the exam's whole question set, so fetch what's
    // already there first and merge the newly selected questions in.
    const existing = await examsStore.fetchExamQuestions(assessmentId.value)
    const existingIds = new Set(existing.map((q) => String(q.question_id ?? q.id)))
    const merged = [
      ...existing.map((q, idx) => ({
        question_id: q.question_id ?? q.id,
        order: q.order ?? idx + 1,
        marks: q.marks ?? 1,
        is_marks_locked: Boolean(q.is_marks_locked),
      })),
      ...[...selectedSet]
        .filter((id) => !existingIds.has(String(id)))
        .map((id, idx) => ({
          question_id: id,
          order: existing.length + idx + 1,
          marks: 1,
          is_marks_locked: false,
        })),
    ]

    await examsStore.setQuestions(assessmentId.value, merged)
    const added = merged.length - existing.length

    uiStore.addToast({
      title: 'Questions added',
      message: `${added} question${added !== 1 ? 's' : ''} added to exam.`,
      variant: 'success',
    })
    selectedIds.value = []
  } catch (error) {
    uiStore.addToast({
      title: 'Failed to add questions',
      message: error.message || 'Open an exam from the Exams list and try again.',
      variant: 'error',
    })
  }
}


const onSubjectChange = async () => {
  // Update subject name for display
  const selected = modalSubjects.value.find(s => s.id === form.subject_id)
  form.subject = selected?.name || ''
}

const onClassLevelChange = async () => {
  form.subject_id = ''
  form.subject = ''
  form.class_arm_id = ''
  if (form.class_level_id) {
    const [subjectsResponse] = await Promise.all([
      getSubjects({ class_level_id: form.class_level_id }),
      examsStore.loadClassArms(form.class_level_id),
    ])
    subjectsData.value = unwrapList(subjectsResponse, ['subjects']).map(normalizeSubject).filter((subject) => subject.id && subject.name)
  }
}

const loadQuestionBankPage = async () => {
  try {
    await questionsStore.fetchQuestions()
  } catch (error) {
    uiStore.addToast({
      title: 'Unable to load questions',
      message: error.message || 'Unable to load the question bank.',
      variant: 'error',
    })
  }
}

onMounted(async () => {
  await Promise.all([
    loadQuestionBankPage(),
    loadGlobalAssignments(),
  ])
})

onActivated(loadQuestionBankPage)
</script>

<style scoped>
.question-filter {
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

.question-input {
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

.question-filter:focus,
.question-input:focus {
  border-color: #0b1f3a;
  box-shadow: 0 0 0 3px rgb(212 175 55 / 0.25);
}
</style>
