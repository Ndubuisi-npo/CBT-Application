<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Question Bank</p>
          <h3 class="mt-1 text-lg font-semibold text-slate-900">Add questions from your bank</h3>
        </div>
        <AppButton :icon="X" variant="ghost" size="xs" @click="$emit('close')" />
      </div>

      <div class="space-y-3 border-b border-slate-200 px-5 py-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <AppInput v-model="search" placeholder="Search your questions…" />
          <AppSelect v-model="typeFilter" :options="typeFilterOptions" placeholder="All types" />
        </div>
        <p class="text-xs text-slate-500">
          Showing questions you've created for <span class="font-medium text-slate-700">{{ subjectLabel }}</span>.
          Pick as many as you need, then set the marks for each before adding them to your submission.
        </p>
      </div>

      <div class="flex-1 overflow-y-auto px-5 py-4">
        <div v-if="loading" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          Loading your question bank…
        </div>
        <div v-else-if="loadError" class="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-6 text-sm text-rose-700">
          {{ loadError }}
        </div>
        <div v-else-if="!filteredQuestions.length" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          <p v-if="questions.length">No questions match your search.</p>
          <p v-else>
            You haven't created any {{ subjectLabel !== 'this subject' ? subjectLabel.toLowerCase() : '' }} questions in
            your question bank yet. Head to the Question Bank to create some first.
          </p>
        </div>

        <div v-else class="space-y-3">
          <label
            v-for="question in filteredQuestions"
            :key="question.id"
            class="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition"
            :class="isSelected(question.id) ? 'border-[#0B1F3A] bg-[#0B1F3A]/5' : 'border-slate-200 bg-white hover:border-slate-300'"
          >
            <input
              type="checkbox"
              class="mt-1 h-4 w-4 rounded border-slate-300 text-[#0B1F3A] focus:ring-[#D4AF37]"
              :checked="isSelected(question.id)"
              @change="toggle(question)"
            />
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {{ questionTypeLabel(question.type) }}
                </span>
                <span v-if="question.topic?.name" class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">
                  {{ question.topic.name }}
                </span>
              </div>
              <p class="mt-2 text-sm font-medium text-slate-900">{{ question.content }}</p>
              <div v-if="question.options?.length" class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span
                  v-for="(option, idx) in question.options"
                  :key="option.id ?? idx"
                  :class="option.is_correct ? 'font-semibold text-emerald-600' : ''"
                >
                  {{ String.fromCharCode(65 + idx) }}. {{ option.content }}
                </span>
              </div>

              <div v-if="isSelected(question.id)" class="mt-3 flex items-center gap-2" @click.prevent>
                <label class="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Marks for this question</label>
                <input
                  v-model.number="selections[question.id]"
                  type="number"
                  min="1"
                  step="1"
                  class="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-800 focus:border-[#0B1F3A] focus:outline-none"
                  @click.stop
                />
              </div>
            </div>
          </label>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
        <div class="text-sm text-slate-600">
          <span class="font-medium text-slate-900">{{ selectedIds.length }}</span> selected
          <span v-if="selectedIds.length"> • {{ totalSelectedMarks }} marks total</span>
          <span v-if="remainingMarks != null && totalSelectedMarks > remainingMarks" class="ml-2 font-medium text-rose-600">
            Exceeds the {{ remainingMarks }} marks remaining
          </span>
        </div>
        <div class="flex gap-2">
          <AppButton text="Cancel" variant="outline" @click="$emit('close')" />
          <AppButton
            text="Add to Submission"
            variant="primary"
            :disabled="!selectedIds.length || saving"
            :processing="saving"
            @click="submit"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import AppInput from '../../shared/AppInput.vue'
import AppSelect from '../../shared/AppSelect.vue'
import { useTeacherExamsStore } from '../stores/exams'

const props = defineProps({
  show: { type: Boolean, default: false },
  subjectId: { type: [String, Number], default: '' },
  subjectLabel: { type: String, default: 'this subject' },
  classLevelId: { type: [String, Number], default: '' },
  // Marks still available under the assessment's cap — used only as a soft
  // warning, the backend remains the source of truth (§4: sum(marks) <= cap).
  remainingMarks: { type: Number, default: null },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'submit'])

const examStore = useTeacherExamsStore()

const questions = ref([])
const loading = ref(false)
const loadError = ref('')
const search = ref('')
const typeFilter = ref('')
const selections = reactive({}) // { [questionId]: marks }

const typeFilterOptions = [
  { label: 'Multiple Choice', value: 'mcq' },
  { label: 'True / False', value: 'true_false' },
  { label: 'Fill in the Blank', value: 'fill_in_blank' },
]

const questionTypeLabel = (type) => {
  switch (type) {
    case 'mcq': return 'Multiple Choice'
    case 'true_false': return 'True / False'
    case 'fill_in_blank': return 'Fill in the Blank'
    default: return type || 'Unknown'
  }
}

const load = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const params = {}
    if (props.subjectId) params.subject_id = props.subjectId
    if (props.classLevelId) params.class_level_id = props.classLevelId
    const result = await examStore.fetchQuestionBank(params)
    const list = Array.isArray(result) ? result : (result?.data ?? [])
    // Defensive client-side filter in case the backend doesn't honor the
    // query params — we only ever want this teacher's own bank questions
    // for the subject/class this submission is scoped to.
    questions.value = list.filter((q) => {
      const matchesSubject = props.subjectId
        ? String(q.subject_id ?? q.subject?.id) === String(props.subjectId)
        : true
      const matchesClass = props.classLevelId
        ? String(q.class_level_id ?? q.class_level?.id ?? q.classLevel?.id) === String(props.classLevelId)
        : true
      // Only the three types the Submission contract supports (§3/§7).
      const supportedType = ['mcq', 'true_false', 'fill_in_blank'].includes(q.type)
      return matchesSubject && matchesClass && supportedType
    })
  } catch (error) {
    loadError.value = error?.message || 'Unable to load your question bank right now.'
    questions.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => props.show,
  (show) => {
    if (show) {
      Object.keys(selections).forEach((key) => delete selections[key])
      search.value = ''
      typeFilter.value = ''
      load()
    }
  }
)

onMounted(() => {
  if (props.show) load()
})

const filteredQuestions = computed(() => {
  const query = search.value.trim().toLowerCase()
  return questions.value.filter((q) => {
    const matchesQuery = query ? (q.content || '').toLowerCase().includes(query) : true
    const matchesType = typeFilter.value ? q.type === typeFilter.value : true
    return matchesQuery && matchesType
  })
})

const selectedIds = computed(() => Object.keys(selections).map((id) => (isNaN(Number(id)) ? id : id)))
const isSelected = (id) => Object.prototype.hasOwnProperty.call(selections, id)
const toggle = (question) => {
  if (isSelected(question.id)) {
    delete selections[question.id]
  } else {
    selections[question.id] = 1
  }
}

const totalSelectedMarks = computed(() =>
  selectedIds.value.reduce((sum, id) => sum + (Number(selections[id]) || 0), 0)
)

const submit = () => {
  const chosen = selectedIds.value
    .map((id) => questions.value.find((q) => String(q.id) === String(id)))
    .filter(Boolean)
    .map((question) => ({
      question,
      marks: Math.max(1, Number(selections[question.id]) || 1),
    }))
  if (!chosen.length) return
  emit('submit', chosen)
}
</script>
