<template>
  <div class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 sm:items-center sm:px-4">
    <div class="max-h-[96vh] w-full max-w-5xl overflow-y-auto rounded-t-[28px] bg-white shadow-2xl sm:rounded-2xl">
      <!-- Header -->
      <div class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Question Management</p>
          <h2 class="mt-1 text-xl font-semibold text-slate-900">{{ exam.title }}</h2>
          <p class="mt-1 text-sm text-slate-500">{{ examQuestions.length }} question(s) added to this exam</p>
        </div>
        <button type="button" class="p-2 text-slate-400 hover:text-slate-600" @click="$emit('close')">✕</button>
      </div>

      <div class="grid gap-6 p-6 lg:grid-cols-2">
        <!-- Left: Question Bank Search -->
        <div class="space-y-4">
          <h3 class="font-semibold text-slate-900">Question Bank</h3>
          <input
            v-model="searchQuery"
            type="text"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder-slate-400 focus:border-[#0B1F3A] focus:outline-none"
            placeholder="Search questions..."
            @input="debouncedSearch"
          />
          <!-- Subject & Class filters so all questions aren't limited to one subject/class -->
          <div class="grid grid-cols-2 gap-2">
            <select
              v-model="bankSubjectFilter"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-none"
              @change="debouncedSearch"
            >
              <option value="">All Subjects</option>
              <option v-for="s in store.subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
            <select
              v-model="bankClassFilter"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-none"
              @change="debouncedSearch"
            >
              <option value="">All Classes</option>
              <option v-for="c in store.classLevels" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div v-if="bankLoading" class="space-y-3">
            <div v-for="i in 4" :key="i" class="h-20 animate-pulse rounded-xl bg-slate-100" />
          </div>

          <div v-else-if="!bankQuestions.length" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No questions found. Try a different search.
          </div>

          <div v-else class="space-y-3 max-h-[50vh] overflow-y-auto">
            <div
              v-for="q in bankQuestions"
              :key="q.id"
              class="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div class="text-sm font-medium text-slate-900 leading-5" v-html="renderQuestionText(getQuestionText(q))" />
              <p class="mt-1 text-xs text-slate-400">{{ q.topic || q.subject?.name || q.subject || '' }} {{ q.class_level?.name ? '• ' + q.class_level.name : '' }} {{ q.class_arm?.name ? '• ' + q.class_arm.name : '' }}</p>
              <div class="mt-3 flex items-center gap-3">
                <input
                  v-model.number="marksMap[q.id]"
                  type="number"
                  min="1"
                  class="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Marks"
                />
                <AppButton
                  text="Add"
                  size="sm"
                  variant="secondary"
                  :disabled="isAlreadyAdded(q.id) || addingId === q.id"
                  :processing="addingId === q.id"
                  @click="addQuestion(q)"
                />
                <span v-if="isAlreadyAdded(q.id)" class="text-xs text-emerald-600 font-medium">✓ Added</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Exam Questions (added) -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-slate-900">In This Exam</h3>
            <AppButton
              v-if="orderChanged"
              text="Save Order"
              size="sm"
              variant="primary"
              :processing="savingOrder"
              @click="saveOrder"
            />
          </div>

          <div v-if="questionsLoading" class="space-y-3">
            <div v-for="i in 3" :key="i" class="h-24 animate-pulse rounded-xl bg-slate-100" />
          </div>

          <div v-else-if="!examQuestions.length" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No questions added yet. Search the question bank on the left.
          </div>

          <div v-else class="space-y-3 max-h-[50vh] overflow-y-auto">
            <div
              v-for="(q, idx) in examQuestions"
              :key="q.id"
              class="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div class="flex items-start gap-3">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0B1F3A] text-sm font-semibold text-white">
                  {{ idx + 1 }}
                </span>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium text-slate-900 leading-5" v-html="renderQuestionText(getQuestionText(q))" />
                  <div class="mt-2 flex items-center gap-3 flex-wrap">
                    <label class="flex items-center gap-2 text-xs text-slate-500">
                      Marks:
                      <input
                        v-model.number="q._marks"
                        type="number"
                        min="1"
                        class="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        @blur="updateMarks(q)"
                      />
                    </label>
                    <div class="flex gap-1">
                      <button class="p-1 text-slate-400 hover:text-slate-700" title="Move up" :disabled="idx === 0" @click="moveUp(idx)">↑</button>
                      <button class="p-1 text-slate-400 hover:text-slate-700" title="Move down" :disabled="idx === examQuestions.length - 1" @click="moveDown(idx)">↓</button>
                    </div>
                    <button
                      class="text-xs text-rose-500 hover:text-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      :disabled="removingId === q.id"
                      @click="removeQuestion(q)"
                    >
                      {{ removingId === q.id ? 'Removing...' : 'Remove' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t border-slate-100 px-6 py-4 flex justify-end">
        <AppButton text="Done" variant="primary" @click="$emit('close'); $emit('updated')" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import AppButton from '../../shared/AppButton.vue'
import { useTeacherExamsStore } from '../stores/exams'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const props = defineProps({
  exam: { type: Object, required: true },
})
const emit = defineEmits(['close', 'updated'])

const store = useTeacherExamsStore()
const uiStore = useSchoolAdminUiStore()

const searchQuery = ref('')
const bankSubjectFilter = ref('')
const bankClassFilter = ref('')
const bankQuestions = ref([])
const bankLoading = ref(false)
const questionsLoading = ref(false)
const addingId = ref(null)
const marksMap = ref({})
const orderChanged = ref(false)
const savingOrder = ref(false)

// Local mutable copy of exam questions so we can reorder
const examQuestions = ref([])

// ── Helpers ────────────────────────────────────────────────────────────────

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

const getQuestionText = (q) => {
  const src = q?.question || q?.question_details || q
  return src?.content || src?.question_text || src?.text || q?.content || 'Untitled question'
}

const renderQuestionText = (value) => renderMathContent(String(value ?? ''))

const isAlreadyAdded = (questionId) =>
  examQuestions.value.some((q) => q.question_id === questionId || q.id === questionId)

// ── Load ───────────────────────────────────────────────────────────────────

onMounted(async () => {
  // Load subjects + class levels for filters if not already in store
  if (!store.subjects.length || !store.classLevels.length) {
    await store.loadFormMetadata()
  }
  await loadExamQuestions()
  await searchQuestionBank()
})

const loadExamQuestions = async () => {
  questionsLoading.value = true
  try {
    const questions = await store.fetchExamQuestions(props.exam.id)
    examQuestions.value = questions.map((q, idx) => ({
      ...q,
      _marks: q.marks ?? 1,
      _order: q.order ?? idx + 1,
    }))
  } catch (err) {
    uiStore.addToast({ title: 'Error', message: err.message, variant: 'error' })
  } finally {
    questionsLoading.value = false
  }
}

const removingId = ref(null)

const searchQuestionBank = async () => {
  bankLoading.value = true
  try {
    const params = { per_page: 50 }
    if (searchQuery.value) params.search = searchQuery.value
    if (bankSubjectFilter.value) params.subject_id = bankSubjectFilter.value
    if (bankClassFilter.value) params.class_level_id = bankClassFilter.value
    bankQuestions.value = await store.fetchQuestionBank(params)
    // Default marks for each
    bankQuestions.value.forEach((q) => {
      if (!marksMap.value[q.id]) marksMap.value[q.id] = q.default_marks || q.marks || 1
    })
  } catch (err) {
    uiStore.addToast({ title: 'Error', message: err.message, variant: 'error' })
  } finally {
    bankLoading.value = false
  }
}

let debounceTimer
const debouncedSearch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(searchQuestionBank, 300)
}

// ── Actions ────────────────────────────────────────────────────────────────

const addQuestion = async (q) => {
  addingId.value = q.id
  try {
    await store.addQuestion(props.exam.id, {
      question_id: q.id,
      marks: marksMap.value[q.id] || 1,
      order: examQuestions.value.length + 1,
    })
    await loadExamQuestions()
    uiStore.addToast({ title: 'Question added', variant: 'success' })
  } catch (err) {
    uiStore.addToast({ title: 'Error', message: err.message, variant: 'error' })
  } finally {
    addingId.value = null
  }
}

const removeQuestion = async (q) => {
  removingId.value = q.id
  try {
    await store.removeQuestion(props.exam.id, q.id)
    examQuestions.value = examQuestions.value.filter((x) => x.id !== q.id)
    uiStore.addToast({ title: 'Question removed', variant: 'success' })
  } catch (err) {
    uiStore.addToast({ title: 'Error', message: err.message, variant: 'error' })
  } finally {
    removingId.value = null
  }
}

const updateMarks = async (q) => {
  try {
    await store.updateQuestion(props.exam.id, q.id, { marks: q._marks })
  } catch (err) {
    uiStore.addToast({ title: 'Error', message: err.message, variant: 'error' })
  }
}

const moveUp = (idx) => {
  if (idx === 0) return
  const arr = [...examQuestions.value]
  ;[arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]]
  examQuestions.value = arr
  orderChanged.value = true
}

const moveDown = (idx) => {
  if (idx === examQuestions.value.length - 1) return
  const arr = [...examQuestions.value]
  ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
  examQuestions.value = arr
  orderChanged.value = true
}

const saveOrder = async () => {
  savingOrder.value = true
  try {
    await Promise.all(
      examQuestions.value.map((q, idx) =>
        store.updateQuestion(props.exam.id, q.id, { order: idx + 1 }),
      ),
    )
    orderChanged.value = false
    uiStore.addToast({ title: 'Order saved', variant: 'success' })
  } catch (err) {
    uiStore.addToast({ title: 'Error', message: err.message, variant: 'error' })
  } finally {
    savingOrder.value = false
  }
}
</script>
