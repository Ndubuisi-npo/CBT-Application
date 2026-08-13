<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-2xl max-h-[90vh] transform overflow-y-auto rounded-lg bg-white shadow-xl transition-all">
      <div class="flex h-full flex-col bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-900">{{ isEdit ? 'Edit Question' : 'Add Question' }}</h3>
          <AppButton @click="$emit('close')" :icon="X" variant="ghost" class="text-slate-400 hover:text-slate-600" />
        </div>

        <div class="flex-1 overflow-y-auto">
          <form class="space-y-5" @submit.prevent="submit">
            <AppSelect
              v-model="form.type"
              :options="typeOptions"
              label="Question Type"
              placeholder="Select question type"
              required
              :error="errors.type"
              @update:modelValue="onTypeChange"
            />

            <AppTextarea
              v-model="form.content"
              label="Question"
              placeholder="Enter your question here…"
              :rows="4"
              :error="errors.content"
            />

            <AppInput
              v-model="form.marks"
              type="number"
              label="Marks"
              placeholder="1"
              required
              :error="errors.marks"
            />

            <div>
              <label class="block text-sm font-medium text-slate-700">Question Image URL (optional)</label>
              <input
                v-model="form.image_url"
                type="text"
                placeholder="https://…"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <!-- MCQ options -->
            <div v-if="form.type === 'mcq'" class="space-y-3">
              <h4 class="text-sm font-semibold text-slate-900">Answer Options</h4>
              <div v-for="(option, index) in form.options" :key="index" class="flex items-center gap-2">
                <input
                  type="radio"
                  name="mcq_correct"
                  :checked="option.is_correct"
                  @change="setCorrect(index)"
                  class="h-4 w-4"
                />
                <input
                  v-model="option.label"
                  class="w-14 rounded-lg border border-slate-300 px-2 py-2 text-sm"
                  placeholder="A"
                />
                <input
                  v-model="option.content"
                  class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  :placeholder="`Option ${index + 1}`"
                />
                <AppButton
                  v-if="form.options.length > 2"
                  type="button"
                  @click="removeOption(index)"
                  :icon="X"
                  variant="ghost"
                  size="xs"
                />
              </div>
              <p v-if="errors.options" class="text-xs text-rose-600">{{ errors.options }}</p>
              <AppButton type="button" @click="addOption" :icon="Plus" text="Add Option" variant="outline" size="sm" />
            </div>

            <!-- True/False -->
            <div v-if="form.type === 'true_false'" class="space-y-3">
              <h4 class="text-sm font-semibold text-slate-900">Correct Answer</h4>
              <div class="flex gap-4">
                <label class="flex items-center gap-2 text-sm text-slate-700">
                  <input type="radio" :checked="trueFalseAnswer === true" @change="trueFalseAnswer = true" class="h-4 w-4" />
                  True
                </label>
                <label class="flex items-center gap-2 text-sm text-slate-700">
                  <input type="radio" :checked="trueFalseAnswer === false" @change="trueFalseAnswer = false" class="h-4 w-4" />
                  False
                </label>
              </div>
              <p v-if="errors.options" class="text-xs text-rose-600">{{ errors.options }}</p>
            </div>

            <!-- Fill in the blank: backend contract omits `options` entirely
                 for this type (§3/§7) — there's no acceptable-answers array
                 documented, so we don't invent one. -->
            <p v-if="form.type === 'fill_in_blank'" class="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
              Fill-in-the-blank questions don't use options. Use the explanation field below to note the expected
              answer for reviewers if needed.
            </p>

            <AppTextarea
              v-model="form.explanation"
              label="Explanation (optional)"
              placeholder="Shown to students after grading, if your workflow surfaces it…"
              :rows="3"
            />

            <div class="flex gap-2 pt-2">
              <AppButton
                type="submit"
                :text="isEdit ? 'Save Question' : 'Add Question'"
                full-width
                variant="primary"
                :processing="saving"
                :disabled="saving"
              />
              <AppButton type="button" text="Cancel" variant="outline" @click="$emit('close')" />
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { X, Plus } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import AppInput from '../../shared/AppInput.vue'
import AppSelect from '../../shared/AppSelect.vue'
import AppTextarea from '../../shared/AppTextarea.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  question: { type: Object, default: null },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'submit'])

const isEdit = computed(() => !!props.question)

// The three types the backend supports (§3/§7) — no essay/matching/ordering.
const typeOptions = [
  { label: 'Multiple Choice', value: 'mcq' },
  { label: 'True / False', value: 'true_false' },
  { label: 'Fill in the Blank', value: 'fill_in_blank' },
]

const blankOption = () => ({ label: '', content: '', is_correct: false, image_url: null })
const trueFalseOptions = () => [
  { label: 'True', content: 'True', is_correct: false, image_url: null },
  { label: 'False', content: 'False', is_correct: false, image_url: null },
]

const defaultForm = () => ({
  id: null,
  type: '',
  content: '',
  marks: 1,
  image_url: '',
  explanation: '',
  options: [blankOption(), blankOption()],
})

const form = reactive(defaultForm())
const errors = reactive({ type: '', content: '', marks: '', options: '' })

const trueFalseAnswer = computed({
  get: () => {
    const correct = form.options.find((o) => o.is_correct)
    if (!correct) return null
    return correct.content === 'True'
  },
  set: (value) => {
    form.options = trueFalseOptions().map((o) => ({ ...o, is_correct: o.content === (value ? 'True' : 'False') }))
  },
})

const resetForm = () => Object.assign(form, defaultForm())
const resetErrors = () => Object.assign(errors, { type: '', content: '', marks: '', options: '' })

watch(
  () => props.question,
  (question) => {
    resetErrors()
    if (question) {
      Object.assign(form, {
        id: question.id ?? null,
        type: question.type || '',
        content: question.content || '',
        marks: question.marks ?? 1,
        image_url: question.image_url || '',
        explanation: question.explanation || '',
        options: Array.isArray(question.options) && question.options.length
          ? question.options.map((o) => ({
              label: o.label ?? '',
              content: o.content ?? '',
              is_correct: !!o.is_correct,
              image_url: o.image_url ?? null,
            }))
          : question.type === 'true_false'
            ? trueFalseOptions()
            : [blankOption(), blankOption()],
      })
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

watch(
  () => props.show,
  (show) => {
    if (!show) {
      resetErrors()
    }
  }
)

const onTypeChange = (type) => {
  errors.options = ''
  if (type === 'true_false') {
    form.options = trueFalseOptions()
  } else if (type === 'mcq') {
    form.options = [blankOption(), blankOption()]
  } else {
    form.options = []
  }
}

const addOption = () => form.options.push(blankOption())
const removeOption = (index) => form.options.splice(index, 1)
const setCorrect = (index) => {
  form.options = form.options.map((o, i) => ({ ...o, is_correct: i === index }))
}

const validate = () => {
  resetErrors()
  if (!form.type) errors.type = 'Select a question type.'
  if (!form.content.trim()) errors.content = 'Question content is required.'
  if (!(Number(form.marks) > 0)) errors.marks = 'Marks must be greater than zero.'

  if (form.type === 'mcq') {
    const filled = form.options.filter((o) => o.content.trim())
    if (filled.length < 2) errors.options = 'Add at least two options.'
    else if (!form.options.some((o) => o.is_correct)) errors.options = 'Mark one option as correct.'
  }
  if (form.type === 'true_false' && !form.options.some((o) => o.is_correct)) {
    errors.options = 'Select True or False as the correct answer.'
  }

  return !Object.values(errors).some(Boolean)
}

const submit = () => {
  if (!validate()) return

  const payload = {
    id: form.id,
    type: form.type,
    content: form.content.trim(),
    marks: Number(form.marks),
    explanation: form.explanation?.trim() || null,
    image_url: form.image_url?.trim() || null,
  }

  if (form.type !== 'fill_in_blank') {
    payload.options = form.options
      .filter((o) => o.content.trim())
      .map((o, index) => ({
        content: o.content.trim(),
        is_correct: !!o.is_correct,
        label: o.label?.trim() || null,
        image_url: o.image_url || null,
        order: index + 1,
      }))
  }

  emit('submit', payload)
}
</script>
