<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-4xl max-h-[90vh] transform overflow-y-auto rounded-lg bg-white shadow-xl transition-all">
      <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-6 h-full flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900">{{ isEdit ? 'Edit Question' : 'Create Question' }}</h3>
          <AppButton @click="$emit('close')" :icon="X" variant="ghost" class="text-slate-400 hover:text-slate-600" />
        </div>
        
        <div class="flex-1 overflow-y-auto">
          <form class="space-y-6" @submit.prevent="submit">
            <!-- Question Type Selection -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-slate-700">Question Type</label>
              <select v-model="form.type" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" @change="onTypeChange">
                <option value="">Select Question Type</option>
                <option value="Multiple Choice">Multiple Choice</option>
                <option value="True/False">True/False</option>
                <option value="Fill in the Blank">Fill in the Blank</option>
                <option value="Essay">Essay</option>
                <option value="Match Pairs">Match the Pairs</option>
                <option value="Ordering">Ordering</option>
              </select>
            </div>

            <!-- Basic Question Fields -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700">Subject</label>
                <input v-model="form.subject" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700">Topic</label>
                <input v-model="form.topic" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700">Class</label>
                <input v-model="form.class" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700">Difficulty</label>
                <select v-model="form.difficulty" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700">Points</label>
                <input v-model="form.points" type="number" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
              </div>
            </div>

            <!-- Question Content -->
            <div>
              <label class="block text-sm font-medium text-slate-700">Question</label>
              <div class="border border-slate-300 rounded-lg">
                <textarea 
                  v-model="form.question_text" 
                  class="w-full p-3 text-sm min-h-[120px]" 
                  placeholder="Enter your question here..."
                  required
                ></textarea>
              </div>
            </div>

            <!-- Image Upload -->
            <div>
              <label class="block text-sm font-medium text-slate-700">Question Image (Optional)</label>
              <div class="flex items-center gap-4">
                <input 
                  type="file" 
                  @change="handleImageUpload" 
                  accept="image/*" 
                  class="text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <div v-if="form.image_url" class="h-20 w-20 rounded-lg border border-slate-200 overflow-hidden">
                  <img :src="form.image_url" alt="Question image" class="h-full w-full object-cover" />
                </div>
              </div>
            </div>

            <!-- Dynamic Fields Based on Question Type -->
            <div v-if="form.type === 'Multiple Choice'" class="space-y-4">
              <h4 class="font-medium text-slate-900">Answer Options</h4>
              <div v-for="(option, index) in form.options" :key="index" class="flex items-center gap-2">
                <input 
                  type="radio" 
                  :name="'correct_answer'" 
                  :value="index" 
                  v-model="form.correct_answer" 
                  class="h-4 w-4"
                />
                <input 
                  v-model="form.options[index]" 
                  class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" 
                  :placeholder="`Option ${index + 1}`"
                  required
                />
                <AppButton 
                  v-if="form.options.length > 2"
                  @click="removeOption(index)" 
                  :icon="X" 
                  variant="ghost" 
                  size="xs"
                />
              </div>
              <AppButton @click="addOption" :icon="Plus" text="Add Option" variant="outline" size="sm" />
            </div>

            <div v-if="form.type === 'True/False'" class="space-y-4">
              <h4 class="font-medium text-slate-900">Answer</h4>
              <div class="flex gap-4">
                <label class="flex items-center gap-2">
                  <input type="radio" v-model="form.correct_answer" :value="true" class="h-4 w-4" />
                  <span>True</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="radio" v-model="form.correct_answer" :value="false" class="h-4 w-4" />
                  <span>False</span>
                </label>
              </div>
            </div>

            <div v-if="form.type === 'Fill in the Blank'" class="space-y-4">
              <h4 class="font-medium text-slate-900">Acceptable Answers</h4>
              <div v-for="(answer, index) in form.acceptable_answers" :key="index" class="flex items-center gap-2">
                <input 
                  v-model="form.acceptable_answers[index]" 
                  class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" 
                  placeholder="Acceptable answer"
                  required
                />
                <AppButton 
                  v-if="form.acceptable_answers.length > 1"
                  @click="removeAcceptableAnswer(index)" 
                  :icon="X" 
                  variant="ghost" 
                  size="xs"
                />
              </div>
              <AppButton @click="addAcceptableAnswer" :icon="Plus" text="Add Answer" variant="outline" size="sm" />
            </div>

            <div v-if="form.type === 'Essay'" class="space-y-4">
              <h4 class="font-medium text-slate-900">Essay Settings</h4>
              <div>
                <label class="block text-sm font-medium text-slate-700">Word Limit (Optional)</label>
                <input 
                  v-model="form.word_limit" 
                  type="number" 
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" 
                  placeholder="Maximum number of words"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700">Sample Answer (Optional)</label>
                <textarea 
                  v-model="form.sample_answer" 
                  class="w-full p-3 text-sm min-h-[100px]" 
                  placeholder="Sample answer for reference"
                ></textarea>
              </div>
            </div>

            <div v-if="form.type === 'Match Pairs'" class="space-y-4">
              <h4 class="font-medium text-slate-900">Matching Pairs</h4>
              <div v-for="(pair, index) in form.matching_pairs" :key="index" class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700">Item {{ index + 1 }}</label>
                  <input 
                    v-model="form.matching_pairs[index].item" 
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" 
                    placeholder="Item to match"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700">Match {{ index + 1 }}</label>
                  <input 
                    v-model="form.matching_pairs[index].match" 
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" 
                    placeholder="Matching item"
                    required
                  />
                </div>
              </div>
              <AppButton @click="addMatchingPair" :icon="Plus" text="Add Pair" variant="outline" size="sm" />
            </div>

            <div v-if="form.type === 'Ordering'" class="space-y-4">
              <h4 class="font-medium text-slate-900">Ordering Items</h4>
              <div v-for="(item, index) in form.ordering_items" :key="index" class="flex items-center gap-2">
                <span class="w-8 text-center font-medium">{{ index + 1 }}.</span>
                <input 
                  v-model="form.ordering_items[index]" 
                  class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" 
                  placeholder="Item to order"
                  required
                />
                <AppButton 
                  v-if="form.ordering_items.length > 2"
                  @click="removeOrderingItem(index)" 
                  :icon="X" 
                  variant="ghost" 
                  size="xs"
                />
              </div>
              <AppButton @click="addOrderingItem" :icon="Plus" text="Add Item" variant="outline" size="sm" />
            </div>

            <div class="flex gap-2">
              <AppButton 
                type="submit" 
                :text="isEdit ? 'Update Question' : 'Create Question'" 
                full-width 
                variant="primary" 
                :loadingText="isEdit ? 'Updating Question...' : 'Creating Question...'"
                :processing="loading" 
                :disabled="loading"
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
import { reactive, watch, computed, ref } from 'vue'
import { X, Plus } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  question: { type: Object, default: null }
})

const emit = defineEmits(['close', 'submit'])

const isEdit = computed(() => !!props.question)
const loading = ref(false)

const form = reactive({
  id: null,
  type: '',
  subject: '',
  topic: '',
  class: '',
  difficulty: 'Medium',
  points: 1,
  question_text: '',
  image_url: '',
  correct_answer: null,
  options: ['', ''],
  acceptable_answers: [''],
  word_limit: null,
  sample_answer: '',
  matching_pairs: [{ item: '', match: '' }],
  ordering_items: ['', '']
})

const resetForm = () => {
  Object.assign(form, {
    id: null,
    type: '',
    subject: '',
    topic: '',
    class: '',
    difficulty: 'Medium',
    points: 1,
    question_text: '',
    image_url: '',
    correct_answer: null,
    options: ['', ''],
    acceptable_answers: [''],
    word_limit: null,
    sample_answer: '',
    matching_pairs: [{ item: '', match: '' }],
    ordering_items: ['', '']
  })
}

// Watch for question changes and update form
watch(() => props.question, (question) => {
  if (question) {
    Object.assign(form, {
      id: question.id,
      type: question.type || '',
      subject: question.subject || '',
      topic: question.topic || '',
      class: question.class || '',
      difficulty: question.difficulty || 'Medium',
      points: question.points || 1,
      question_text: question.question_text || '',
      image_url: question.image_url || '',
      correct_answer: question.correct_answer || null,
      options: question.options || ['', ''],
      acceptable_answers: question.acceptable_answers || [''],
      word_limit: question.word_limit || null,
      sample_answer: question.sample_answer || '',
      matching_pairs: question.matching_pairs || [{ item: '', match: '' }],
      ordering_items: question.ordering_items || ['', '']
    })
  } else {
    resetForm()
  }
}, { immediate: true })

// Watch for modal close to reset form
watch(() => props.show, (show) => {
  if (!show) {
    loading.value = false
    resetForm()
  }
})

const onTypeChange = () => {
  // Reset type-specific fields when type changes
  form.correct_answer = null
  form.options = ['', '']
  form.acceptable_answers = ['']
  form.word_limit = null
  form.sample_answer = ''
  form.matching_pairs = [{ item: '', match: '' }]
  form.ordering_items = ['', '']
}

const addOption = () => {
  form.options.push('')
}

const removeOption = (index) => {
  form.options.splice(index, 1)
  if (form.correct_answer === index) {
    form.correct_answer = null
  }
}

const addAcceptableAnswer = () => {
  form.acceptable_answers.push('')
}

const removeAcceptableAnswer = (index) => {
  form.acceptable_answers.splice(index, 1)
}

const addMatchingPair = () => {
  form.matching_pairs.push({ item: '', match: '' })
}

const removeOrderingItem = (index) => {
  form.ordering_items.splice(index, 1)
}

const addOrderingItem = () => {
  form.ordering_items.push('')
}

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    // In a real app, you would upload to server and get URL
    const reader = new FileReader()
    reader.onload = (e) => {
      form.image_url = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const validate = () => {
  // Basic validation
  if (!form.type) return false
  if (!form.question_text?.trim()) return false
  if (!form.subject?.trim()) return false
  if (!form.topic?.trim()) return false
  if (!form.class?.trim()) return false
  
  // Type-specific validation
  if (form.type === 'Multiple Choice' && (!form.options.filter(opt => opt.trim()).length >= 2)) return false
  if (form.type === 'True/False' && form.correct_answer === null) return false
  if (form.type === 'Fill in the Blank' && !form.acceptable_answers.filter(ans => ans.trim()).length) return false
  if (form.type === 'Match Pairs' && !form.matching_pairs.filter(pair => pair.item.trim() && pair.match.trim()).length) return false
  if (form.type === 'Ordering' && !form.ordering_items.filter(item => item.trim()).length) return false
  
  return true
}

const submit = async () => {
  if (!validate()) return
  
  loading.value = true
  
  try {
    const payload = { ...form }
    
    emit('submit', {
      id: props.question?.id,
      ...payload
    })
  } catch (error) {
    console.error('Failed to save question:', error)
  } finally {
    // Keep loading state active until parent closes modal
  }
}
</script>
