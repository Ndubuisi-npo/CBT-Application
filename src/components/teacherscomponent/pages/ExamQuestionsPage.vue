<template>
  <div class="space-y-6">
    <SectionCard :title="`Questions — ${exam?.title || '…'}`" subtitle="Add questions from the bank and set marks.">
      <template #header>
        <AppButton text="← Back" variant="ghost" @click="$router.push('/teachers/exams')" />
      </template>
      <div class="grid gap-4 pt-6 md:grid-cols-2">
        <div class="rounded-2xl bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wider text-slate-400">Questions on Exam</p>
          <p class="mt-2 text-3xl font-semibold text-slate-900">{{ examQuestions.length }}</p>
        </div>
        <div class="rounded-2xl bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wider text-slate-400">Total Marks</p>
          <p class="mt-2 text-3xl font-semibold text-slate-900">{{ totalMarks }}</p>
        </div>
      </div>
    </SectionCard>

    <div class="grid gap-6 xl:grid-cols-2">
      <!-- Question Bank -->
      <SectionCard title="Question Bank" subtitle="Search and add questions to this exam.">
        <template #header>
          <div class="flex items-center gap-2">
            <input
              v-model="search"
              type="text"
              placeholder="Search questions…"
              class="rounded-xl border border-slate-200 px-3 py-2 text-sm w-48 focus:outline-none focus:border-[#0B1F3A]"
            />
          </div>
        </template>
        <div v-if="loadingBank" class="py-6 text-center text-sm text-slate-500">Loading…</div>
        <div v-else-if="!filteredBank.length" class="py-6 text-center text-sm text-slate-500">No questions found.</div>
        <div v-else class="space-y-3 pt-4 max-h-[480px] overflow-y-auto pr-1">
          <article
            v-for="q in filteredBank"
            :key="q.id"
            class="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <p class="text-sm font-medium text-slate-900 leading-6">{{ q.content || q.question_text || 'Untitled' }}</p>
              <AppButton
                v-if="!isOnExam(q.id)"
                text="Add"
                variant="primary"
                size="xs"
                :processing="addingId === q.id"
                @click="addQuestion(q)"
              />
              <span v-else class="text-xs text-emerald-600 font-semibold whitespace-nowrap">✓ Added</span>
            </div>
            <p class="mt-1 text-xs text-slate-400">{{ q.subject || '' }}{{ q.topic ? ' · ' + q.topic : '' }} · {{ q.default_marks ?? q.marks ?? 1 }} mark(s)</p>
          </article>
        </div>
      </SectionCard>

      <!-- Exam Questions -->
      <SectionCard title="Exam Questions" subtitle="Questions currently on this exam.">
        <div v-if="loadingExamQ" class="py-6 text-center text-sm text-slate-500">Loading…</div>
        <div v-else-if="!examQuestions.length" class="py-6 text-center text-sm text-slate-500 border border-dashed border-slate-300 rounded-2xl mt-4">
          No questions added yet. Add from the question bank.
        </div>
        <div v-else class="space-y-3 pt-4">
          <article
            v-for="(eq, idx) in examQuestions"
            :key="eq.id || eq.exam_question_id"
            class="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0B1F3A] text-xs font-bold text-white">{{ idx + 1 }}</span>
                <p class="text-sm font-medium text-slate-900 leading-6">{{ getQText(eq) }}</p>
              </div>
              <AppButton
                text="Remove"
                variant="danger"
                size="xs"
                :processing="removingId === (eq.exam_question_id || eq.id)"
                @click="removeQuestion(eq)"
              />
            </div>
            <div class="mt-3 flex items-center gap-3">
              <label class="flex items-center gap-2 text-sm text-slate-600">
                Marks:
                <input
                  v-model.number="eq._marks"
                  type="number"
                  min="0"
                  class="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm focus:outline-none"
                />
              </label>
            </div>
          </article>
        </div>
      </SectionCard>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '../../shared/AppButton.vue'
import SectionCard from '../components/SectionCard.vue'
import { useTeacherExamsStore } from '../stores/exams'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'

const route  = useRoute()
const store  = useTeacherExamsStore()
const ui     = useSchoolAdminUiStore()
const examId = route.params.id

const exam         = ref(null)
const examQuestions = ref([])
const questionBank  = ref([])
const search        = ref('')
const loadingBank   = ref(false)
const loadingExamQ  = ref(false)
const addingId      = ref(null)
const removingId    = ref(null)

const totalMarks = computed(() => examQuestions.value.reduce((s, q) => s + (q._marks ?? q.marks ?? 0), 0))

const filteredBank = computed(() => {
  const q = search.value.toLowerCase()
  return questionBank.value.filter((item) => {
    const text = (item.content || item.question_text || '').toLowerCase()
    return !q || text.includes(q)
  })
})

const isOnExam = (qId) => examQuestions.value.some((eq) => String(eq.question_id || eq.id) === String(qId))

const getQText = (eq) =>
  eq.question?.content || eq.content || eq.question_text || eq.question?.question_text || 'Question'

const loadData = async () => {
  try {
    exam.value = await store.fetchExam(examId)
  } catch {
    ui.addToast({ title: 'Error', message: 'Failed to load exam.', variant: 'error' })
  }

  loadingExamQ.value = true
  try {
    const res = await store.fetchExamQuestions(examId)
    examQuestions.value = res.map((q) => ({ ...q, _marks: q.marks ?? q.default_marks ?? 1 }))
  } catch {
    ui.addToast({ title: 'Warning', message: 'Could not load exam questions.', variant: 'error' })
  } finally {
    loadingExamQ.value = false
  }

  loadingBank.value = true
  try {
    const res = await store.fetchQuestionBank()
    questionBank.value = Array.isArray(res) ? res : res?.data || []
  } catch {
    ui.addToast({ title: 'Warning', message: 'Could not load question bank.', variant: 'error' })
  } finally {
    loadingBank.value = false
  }
}

onMounted(loadData)

const addQuestion = async (q) => {
  addingId.value = q.id
  try {
    const order = examQuestions.value.length + 1
    const marks = q.default_marks ?? q.marks ?? 1
    await store.addQuestion(examId, { question_id: q.id, marks, order })
    await reloadExamQuestions()
    ui.addToast({ title: 'Question added', message: 'Question added to exam.', variant: 'success' })
  } catch (err) {
    ui.addToast({ title: 'Error', message: err.message, variant: 'error' })
  } finally {
    addingId.value = null
  }
}

const removeQuestion = async (eq) => {
  const eqId = eq.exam_question_id || eq.id
  removingId.value = eqId
  try {
    await store.removeQuestion(examId, eqId)
    examQuestions.value = examQuestions.value.filter((q) => (q.exam_question_id || q.id) !== eqId)
    ui.addToast({ title: 'Removed', message: 'Question removed from exam.', variant: 'success' })
  } catch (err) {
    ui.addToast({ title: 'Error', message: err.message, variant: 'error' })
  } finally {
    removingId.value = null
  }
}

const reloadExamQuestions = async () => {
  const res = await store.fetchExamQuestions(examId)
  examQuestions.value = res.map((q) => ({ ...q, _marks: q.marks ?? q.default_marks ?? 1 }))
}
</script>
