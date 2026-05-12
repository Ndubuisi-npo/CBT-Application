<template>
  <div class="space-y-6">
    <SectionCard title="Question Bank" subtitle="Create and manage multiple choice questions that can be auto-graded by the system.">
      <template #header>
        <div class="flex flex-wrap items-center gap-3">
          <button type="button" class="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
            {{ totalQuestions }} questions
          </button>
          <AppButton :icon="Plus" text="Create Question" variant="primary" size="md" @click="openEditor()" />
        </div>
      </template>

      <div class="space-y-5 pt-6">
        <div class="grid gap-4 xl:grid-cols-[1.6fr_repeat(3,minmax(0,1fr))]">
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
          <select v-model="filters.topic" class="question-filter">
            <option value="">All Topics</option>
            <option v-for="topic in questionTopics" :key="topic" :value="topic">{{ topic }}</option>
          </select>
          <select v-model="filters.className" class="question-filter">
            <option value="">All Classes</option>
            <option v-for="className in classNames" :key="className" :value="className">{{ className }}</option>
          </select>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-slate-50 p-4">
          <div class="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <button type="button" class="rounded-full bg-white px-4 py-2 font-semibold text-slate-700 shadow-sm">
              {{ filteredQuestions.length }} filtered
            </button>
            <button type="button" class="rounded-full bg-white px-4 py-2 font-semibold text-slate-700 shadow-sm">
              {{ selectedIds.length }} selected
            </button>
            <span class="hidden sm:inline">Only multiple choice items are available for auto-graded exams.</span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <AppButton text="Clear Filters" variant="outline" size="sm" @click="clearFilters" />
            <AppButton text="Bulk Publish" variant="secondary" size="sm" :disabled="!selectedIds.length" @click="bulkAction('publish')" />
            <AppButton text="Mark Draft" variant="secondary" size="sm" :disabled="!selectedIds.length" @click="bulkAction('draft')" />
            <AppButton text="Delete" variant="danger" size="sm" :disabled="!selectedIds.length" @click="bulkAction('delete')" />
          </div>
        </div>
      </div>
    </SectionCard>

    <div v-if="isLoading" class="space-y-4">
      <div v-for="item in 6" :key="item" class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
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

    <div v-else-if="!paginatedQuestions.length" class="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
      <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
        <FileQuestion class="h-10 w-10 text-slate-400" />
      </div>
      <h2 class="mt-6 text-2xl font-semibold text-slate-900">No questions match these filters</h2>
      <p class="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
        Try adjusting your search, switching class filters, or create a new multiple choice question to keep your exam workflow moving.
      </p>
      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <AppButton text="Reset Filters" variant="outline" @click="clearFilters" />
        <AppButton :icon="Plus" text="Create Question" variant="primary" @click="openEditor()" />
      </div>
    </div>

    <div v-else class="space-y-4">
      <article
        v-for="question in paginatedQuestions"
        :key="question.id"
        class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#D4AF37]/70 hover:shadow-md"
      >
        <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div class="flex min-w-0 flex-1 gap-4">
            <label class="mt-1">
              <input v-model="selectedIds" type="checkbox" :value="question.id" class="h-4 w-4 rounded border-slate-300 text-[#0B1F3A] focus:ring-[#D4AF37]" />
            </label>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Multiple Choice</span>
                <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="question.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
                  {{ question.status }}
                </span>
              </div>
              <h2 class="mt-4 text-lg font-semibold text-slate-900">{{ question.content }}</h2>
              <div class="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                <span class="rounded-full bg-slate-100 px-3 py-2">{{ question.subject }}</span>
                <span class="rounded-full bg-slate-100 px-3 py-2">{{ question.topic }}</span>
                <span class="rounded-full bg-slate-100 px-3 py-2">{{ question.className }}</span>
                <span class="rounded-full bg-slate-100 px-3 py-2">{{ question.marks }} marks</span>
                <span class="rounded-full bg-slate-100 px-3 py-2">Used {{ question.usageCount }} times</span>
              </div>
              <div v-if="question.options?.length" class="mt-4 grid gap-2 md:grid-cols-2">
                <div
                  v-for="option in question.options.slice(0, 4)"
                  :key="option"
                  class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  :class="question.correctAnswer === option ? 'text-emerald-700 border-emerald-200' : 'text-slate-600'"
                >
                  {{ option }}
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 lg:justify-end">
            <AppButton :icon="Eye" text="Preview" variant="outline" size="sm" @click="previewQuestion(question)" />
            <AppButton :icon="PencilLine" text="Edit" variant="secondary" size="sm" @click="openEditor(question)" />
            <AppButton :icon="question.status === 'Published' ? FilePenLine : Send" :text="question.status === 'Published' ? 'Draft' : 'Publish'" variant="ghost" size="sm" @click="toggleStatus(question)" />
          </div>
        </div>
      </article>

      <div class="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
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

    <div v-if="showEditor" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
      <div class="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
        <div class="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">{{ editorModeLabel }}</p>
            <h2 class="mt-1 text-2xl font-semibold text-slate-900">{{ form.id ? 'Refine Question' : 'Create New Question' }}</h2>
          </div>
          <AppButton :icon="X" variant="ghost" size="sm" @click="closeEditor" />
        </div>

        <div class="grid gap-6 p-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div class="space-y-6">
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div class="space-y-2 text-sm font-medium text-slate-700">
                <span>Question Type</span>
                <div class="question-filter !py-3 flex items-center font-semibold text-slate-600">Multiple Choice</div>
              </div>
              <label class="space-y-2 text-sm font-medium text-slate-700">
                <span>Subject</span>
                <select v-model="form.subject" class="question-filter !py-3">
                  <option value="">Select subject</option>
                  <option v-for="subject in subjects" :key="subject" :value="subject">{{ subject }}</option>
                </select>
              </label>
              <label class="space-y-2 text-sm font-medium text-slate-700">
                <span>Class</span>
                <select v-model="form.className" class="question-filter !py-3">
                  <option value="">Select class</option>
                  <option v-for="className in classNames" :key="className" :value="className">{{ className }}</option>
                </select>
              </label>
              <label class="space-y-2 text-sm font-medium text-slate-700">
                <span>Topic</span>
                <select v-model="form.topic" class="question-filter !py-3">
                  <option value="">Select topic</option>
                  <option v-for="topic in questionTopics" :key="topic" :value="topic">{{ topic }}</option>
                </select>
              </label>
              <label class="space-y-2 text-sm font-medium text-slate-700 md:col-span-2 xl:col-span-1">
                <span>Marks</span>
                <input v-model.number="form.marks" type="number" min="1" class="question-input" />
              </label>
            </div>

            <label class="block space-y-2 text-sm font-medium text-slate-700">
              <span>Question Content</span>
              <div class="rounded-[24px] border border-slate-300 bg-white">
                <div class="flex flex-wrap gap-2 border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  <span class="rounded-full bg-slate-100 px-3 py-2">Objective Question</span>
                  <span class="rounded-full bg-slate-100 px-3 py-2">Auto-Graded</span>
                </div>
                <textarea
                  v-model="form.content"
                  rows="6"
                  class="min-h-[170px] w-full rounded-b-[24px] border-0 px-4 py-4 text-sm outline-none"
                  placeholder="Type the full multiple choice question stem here."
                ></textarea>
              </div>
              <p v-if="errors.content" class="text-sm text-rose-600">{{ errors.content }}</p>
            </label>

            <div class="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h3 class="text-sm font-semibold text-slate-900">Image / Diagram Placeholder</h3>
                  <p class="mt-1 text-sm text-slate-500">Reserve space for graphs, geometry diagrams, or scanned stimulus material.</p>
                </div>
                <AppButton :icon="ImagePlus" text="Upload Placeholder" variant="outline" size="sm" @click="showUploadToast" />
              </div>
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold text-slate-900">Answer Options</h3>
                  <p class="text-sm text-slate-500">Add options and select the one the system should treat as correct.</p>
                </div>
                <AppButton :icon="Plus" text="Add Option" variant="outline" size="sm" @click="addOption" />
              </div>

              <div class="space-y-3">
                <div v-for="(option, index) in form.options" :key="index" class="flex gap-3 rounded-[24px] border border-slate-200 p-4">
                  <button
                    type="button"
                    class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold"
                    :class="form.correctAnswer === option ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-slate-500'"
                    @click="form.correctAnswer = option"
                  >
                    {{ String.fromCharCode(65 + index) }}
                  </button>
                  <input v-model="form.options[index]" type="text" class="question-input flex-1" placeholder="Option text" />
                  <AppButton :icon="Trash2" variant="ghost" size="sm" @click="removeOption(index)" />
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-slate-900">Preview</h3>
                <button type="button" class="text-sm font-semibold text-[#0B1F3A] hover:text-[#D4AF37]" @click="previewQuestion(form)">Open full preview</button>
              </div>
              <div class="mt-5 rounded-[24px] bg-white p-5 shadow-sm">
                <div class="flex flex-wrap gap-2">
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Multiple Choice</span>
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{{ form.subject || 'Subject' }}</span>
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{{ form.className || 'Class' }}</span>
                </div>
                <p class="mt-4 text-sm leading-6 text-slate-800">{{ form.content || 'Your question preview will appear here once you start typing.' }}</p>
                <div class="mt-4 space-y-2">
                  <div
                    v-for="(option, index) in form.options.filter(Boolean)"
                    :key="`${option}-${index}`"
                    class="rounded-2xl border px-4 py-3 text-sm"
                    :class="form.correctAnswer === option ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'"
                  >
                    {{ String.fromCharCode(65 + index) }}. {{ option }}
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-[24px] border border-slate-200 bg-white p-5">
              <h3 class="text-lg font-semibold text-slate-900">Validation</h3>
              <ul class="mt-4 space-y-3 text-sm text-slate-600">
                <li class="flex items-center gap-3">
                  <span class="h-2.5 w-2.5 rounded-full" :class="form.subject ? 'bg-emerald-500' : 'bg-rose-400'"></span>
                  Subject assigned
                </li>
                <li class="flex items-center gap-3">
                  <span class="h-2.5 w-2.5 rounded-full" :class="form.content.length > 15 ? 'bg-emerald-500' : 'bg-rose-400'"></span>
                  Question stem added
                </li>
                <li class="flex items-center gap-3">
                  <span class="h-2.5 w-2.5 rounded-full" :class="hasValidAnswer ? 'bg-emerald-500' : 'bg-rose-400'"></span>
                  Correct option selected
                </li>
              </ul>
            </div>

            <div class="rounded-[24px] border border-slate-200 bg-white p-5">
              <h3 class="text-lg font-semibold text-slate-900">Save State</h3>
              <p class="mt-3 text-sm leading-6 text-slate-500">
                Drafts are useful for questions awaiting moderation or diagrams. Published questions become available immediately in exam creation.
              </p>
            </div>
          </div>
        </div>

        <div class="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm text-slate-500">All changes are kept in mock state for this showcase experience.</p>
          <div class="flex flex-wrap items-center gap-2">
            <AppButton text="Cancel" variant="ghost" @click="closeEditor" />
            <AppButton text="Save Draft" variant="outline" @click="submitQuestion('Draft')" />
            <AppButton :icon="Send" text="Publish Question" variant="primary" @click="submitQuestion('Published')" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="previewItem" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div class="w-full max-w-3xl rounded-[28px] bg-white p-6 shadow-2xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Question Preview</p>
            <h2 class="mt-2 text-2xl font-semibold text-slate-900">{{ previewItem.subject }} • {{ previewItem.className }}</h2>
          </div>
          <AppButton :icon="X" variant="ghost" @click="previewItem = null" />
        </div>
        <div class="mt-6 rounded-[24px] bg-slate-50 p-5">
          <div class="flex flex-wrap gap-2">
            <span class="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-600">{{ previewItem.topic }}</span>
            <span class="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-600">Multiple Choice</span>
            <span class="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-600">{{ previewItem.marks }} marks</span>
          </div>
          <p class="mt-5 text-sm leading-7 text-slate-800">{{ previewItem.content }}</p>
          <div v-if="previewItem.options?.length" class="mt-5 space-y-3">
            <div
              v-for="(option, index) in previewItem.options"
              :key="`${option}-${index}`"
              class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              :class="previewItem.correctAnswer === option ? 'text-emerald-700 border-emerald-200' : 'text-slate-700'"
            >
              {{ String.fromCharCode(65 + index) }}. {{ option }}
            </div>
          </div>
          <div class="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            Correct answer: {{ previewItem.correctAnswer }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Eye, FilePenLine, FileQuestion, ImagePlus, PencilLine, Plus, Search, Send, Trash2, X } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import SectionCard from '../components/SectionCard.vue'
import { cloneMock, loadingMoments, questionBank, questionTopics } from '../data/mockTeacherData'

const uiStore = useSchoolAdminUiStore()

const isLoading = ref(true)
const showEditor = ref(false)
const previewItem = ref(null)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 4
const selectedIds = ref([])
const questions = ref(cloneMock(questionBank))
const form = reactive(createDefaultForm())
const errors = reactive({ content: '' })

const filters = reactive({
  subject: '',
  topic: '',
  className: '',
})

const subjects = computed(() => [...new Set(questions.value.map((question) => question.subject))])
const classNames = computed(() => [...new Set(questions.value.map((question) => question.className))])
const totalQuestions = computed(() => questions.value.length)

const filteredQuestions = computed(() =>
  questions.value.filter((question) => {
    const haystack = `${question.content} ${question.topic} ${question.subject} ${question.className}`.toLowerCase()
    return (
      (!searchQuery.value || haystack.includes(searchQuery.value.toLowerCase())) &&
      (!filters.subject || question.subject === filters.subject) &&
      (!filters.topic || question.topic === filters.topic) &&
      (!filters.className || question.className === filters.className)
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
const hasValidAnswer = computed(() => form.options.filter(Boolean).length >= 2 && Boolean(form.correctAnswer))

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
    topic: '',
    className: '',
    status: 'Draft',
    marks: 2,
    content: '',
    options: ['', ''],
    correctAnswer: '',
    usageCount: 0,
  }
}

const resetForm = () => {
  Object.assign(form, createDefaultForm())
  errors.content = ''
}

const openEditor = (question = null) => {
  resetForm()
  if (question) {
    Object.assign(form, cloneMock(question))
    if (!form.options?.length) {
      form.options = ['', '']
    }
  }
  showEditor.value = true
}

const closeEditor = () => {
  showEditor.value = false
  resetForm()
}

const addOption = () => {
  form.options.push('')
}

const removeOption = (index) => {
  if (form.options.length <= 2) return
  const removed = form.options[index]
  form.options.splice(index, 1)
  if (form.correctAnswer === removed) {
    form.correctAnswer = ''
  }
}

const validateForm = () => {
  errors.content = form.content.trim().length < 15 ? 'Add a clearer question stem before saving.' : ''
  if (!form.subject || !form.topic || !form.className) {
    uiStore.addToast({
      title: 'Validation required',
      message: 'Subject, topic, and class must be selected before you can save this question.',
      variant: 'error',
    })
    return false
  }
  if (errors.content || !hasValidAnswer.value) {
    uiStore.addToast({
      title: 'Question incomplete',
      message: 'Please complete the stem, add valid options, and select the correct answer before continuing.',
      variant: 'error',
    })
    return false
  }
  return true
}

const submitQuestion = (status) => {
  if (!validateForm()) return

  const payload = {
    ...cloneMock(form),
    type: 'Multiple Choice',
    status,
    options: form.options.filter(Boolean),
    updatedAt: new Date().toISOString(),
  }

  if (payload.id) {
    const index = questions.value.findIndex((item) => item.id === payload.id)
    if (index !== -1) {
      questions.value[index] = payload
    }
  } else {
    payload.id = `Q-${String(Date.now()).slice(-5)}`
    questions.value.unshift(payload)
  }

  uiStore.addToast({
    title: status === 'Published' ? 'Question published' : 'Draft saved',
    message: status === 'Published' ? 'This multiple choice question is now available in exam creation.' : 'You can continue refining this question later.',
    variant: 'success',
  })
  closeEditor()
}

const previewQuestion = (question) => {
  previewItem.value = cloneMock(question)
}

const toggleStatus = (question) => {
  question.status = question.status === 'Published' ? 'Draft' : 'Published'
  uiStore.addToast({
    title: question.status === 'Published' ? 'Question published' : 'Question moved to draft',
    message: `${question.subject} multiple choice item updated successfully.`,
    variant: 'success',
  })
}

const clearFilters = () => {
  searchQuery.value = ''
  filters.subject = ''
  filters.topic = ''
  filters.className = ''
  selectedIds.value = []
}

const bulkAction = (action) => {
  const selectedSet = new Set(selectedIds.value)
  if (!selectedSet.size) return

  if (action === 'delete') {
    questions.value = questions.value.filter((question) => !selectedSet.has(question.id))
  } else {
    questions.value = questions.value.map((question) =>
      selectedSet.has(question.id)
        ? { ...question, status: action === 'publish' ? 'Published' : 'Draft' }
        : question,
    )
  }

  uiStore.addToast({
    title: 'Bulk action complete',
    message: `${selectedSet.size} question${selectedSet.size > 1 ? 's were' : ' was'} updated.`,
    variant: 'success',
  })
  selectedIds.value = []
}

const showUploadToast = () => {
  uiStore.addToast({
    title: 'Placeholder added',
    message: 'A diagram upload slot has been reserved for this question.',
    variant: 'success',
  })
}

onMounted(() => {
  window.setTimeout(() => {
    isLoading.value = false
  }, loadingMoments.questionBank)
})
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
