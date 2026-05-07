<template>
  <div class="space-y-6">
    <SectionCard :title="`Step ${examsStore.examWizard.step} of 4: ${getStepTitle()}`" :subtitle="getStepSubtitle()">
      <!-- Step 1: Basic Info -->
      <div v-if="examsStore.examWizard.step === 1" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Exam Title</label>
            <input 
              v-model="examsStore.examWizard.data.title" 
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" 
              placeholder="Enter exam title"
              required 
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Subject</label>
            <select v-model="examsStore.examWizard.data.subject" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required>
              <option value="">Select Subject</option>
              <option v-for="subject in subjects" :key="subject" :value="subject">{{ subject }}</option>
            </select>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Class</label>
            <select v-model="examsStore.examWizard.data.class" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required>
              <option value="">Select Class</option>
              <option v-for="classItem in classes" :key="classItem" :value="classItem">{{ classItem }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Exam Type</label>
            <select v-model="examsStore.examWizard.data.type" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required>
              <option value="">Select Type</option>
              <option v-for="type in examsStore.examTypes" :key="type" :value="type">{{ type }}</option>
            </select>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Term</label>
          <select v-model="examsStore.examWizard.data.term" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required>
            <option value="">Select Term</option>
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
      </div>

      <!-- Step 2: Question Selection -->
      <div v-if="examsStore.examWizard.step === 2" class="space-y-6">
        <div class="mb-6">
          <h4 class="text-lg font-medium text-slate-900 mb-4">Question Selection Method</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="border rounded-lg p-4 cursor-pointer" :class="selectionMethod === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-slate-300'" @click="selectionMethod = 'manual'">
              <h5 class="font-medium text-slate-900 mb-2">Manual Selection</h5>
              <p class="text-sm text-slate-600">Browse and select questions from your question bank</p>
            </div>
            <div class="border rounded-lg p-4 cursor-pointer" :class="selectionMethod === 'auto' ? 'border-blue-500 bg-blue-50' : 'border-slate-300'" @click="selectionMethod = 'auto'">
              <h5 class="font-medium text-slate-900 mb-2">Auto-Generate</h5>
              <p class="text-sm text-slate-600">Generate questions based on rules and criteria</p>
            </div>
          </div>
        </div>

        <!-- Manual Selection -->
        <div v-if="selectionMethod === 'manual'" class="space-y-4">
          <div class="flex justify-between items-center mb-4">
            <h4 class="text-lg font-medium text-slate-900">Select Questions</h4>
            <div class="text-sm text-slate-600">
              {{ examsStore.examWizard.data.questions.length }} questions selected
            </div>
          </div>
          
          <div class="border rounded-lg max-h-96 overflow-y-auto">
            <div v-for="question in availableQuestions" :key="question.id" class="p-4 border-b hover:bg-slate-50">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <input 
                      type="checkbox" 
                      :id="`question-${question.id}`" 
                      :value="question.id"
                      v-model="selectedQuestionIds"
                      class="h-4 w-4"
                    />
                    <label :for="`question-${question.id}`" class="text-sm font-medium text-slate-900">
                      {{ question.question_text?.substring(0, 100) }}...
                    </label>
                  </div>
                  <div class="flex gap-2 text-xs">
                    <span class="rounded-full bg-blue-100 px-2 py-1">{{ question.type }}</span>
                    <span class="rounded-full bg-green-100 px-2 py-1">{{ question.difficulty }}</span>
                    <span class="rounded-full bg-purple-100 px-2 py-1">{{ question.points }} pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Auto-Generate -->
        <div v-if="selectionMethod === 'auto'" class="space-y-6">
          <h4 class="text-lg font-medium text-slate-900 mb-4">Generation Rules</h4>
          <div class="space-y-4">
            <div v-for="(rule, index) in generationRules" :key="index" class="border rounded-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <h5 class="font-medium text-slate-900">Rule {{ index + 1 }}</h5>
                <AppButton 
                  v-if="generationRules.length > 1"
                  @click="removeRule(index)" 
                  :icon="X" 
                  variant="ghost" 
                  size="xs"
                />
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Topic</label>
                  <select v-model="rule.topic" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                    <option value="">Any Topic</option>
                    <option v-for="topic in questionsStore.topics" :key="topic.id" :value="topic.name">{{ topic.name }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
                  <select v-model="rule.difficulty" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                    <option value="">Any Difficulty</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Question Type</label>
                  <select v-model="rule.type" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                    <option value="">Any Type</option>
                    <option v-for="type in questionsStore.questionTypes" :key="type" :value="type">{{ type }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Count</label>
                  <input 
                    v-model="rule.count" 
                    type="number" 
                    min="1" 
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" 
                    placeholder="Number of questions"
                  />
                </div>
              </div>
            </div>
            <AppButton @click="addRule" :icon="Plus" text="Add Rule" variant="outline" size="sm" />
            <AppButton @click="generateQuestions" :icon="Sparkles" text="Generate Questions" variant="primary" size="sm" />
          </div>
        </div>
      </div>

      <!-- Step 3: Settings -->
      <div v-if="examsStore.examWizard.step === 3" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Duration (minutes)</label>
            <input 
              v-model="examsStore.examWizard.data.duration" 
              type="number" 
              min="1" 
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" 
              placeholder="Exam duration in minutes"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Pass Mark (%)</label>
            <input 
              v-model="examsStore.examWizard.data.passMark" 
              type="number" 
              min="0" 
              max="100" 
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" 
              placeholder="Percentage to pass"
            />
          </div>
        </div>
        
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <input 
              type="checkbox" 
              id="randomization" 
              v-model="examsStore.examWizard.data.randomization" 
              class="h-4 w-4"
            />
            <label for="randomization" class="text-sm font-medium text-slate-700">
              Randomize question order for each student
            </label>
          </div>
          
          <div class="flex items-center gap-3">
            <input 
              type="checkbox" 
              id="showResults" 
              v-model="examsStore.examWizard.data.showResults" 
              class="h-4 w-4"
            />
            <label for="showResults" class="text-sm font-medium text-slate-700">
              Show results to students immediately after completion
            </label>
          </div>
        </div>
      </div>

      <!-- Step 4: Review -->
      <div v-if="examsStore.examWizard.step === 4" class="space-y-6">
        <div class="bg-slate-50 rounded-lg p-6">
          <h4 class="text-lg font-medium text-slate-900 mb-4">Exam Summary</h4>
          <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt class="text-sm font-medium text-slate-600">Title</dt>
              <dd class="text-sm font-semibold text-slate-900">{{ examsStore.examWizard.data.title || 'Not set' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-slate-600">Subject</dt>
              <dd class="text-sm font-semibold text-slate-900">{{ examsStore.examWizard.data.subject || 'Not set' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-slate-600">Class</dt>
              <dd class="text-sm font-semibold text-slate-900">{{ examsStore.examWizard.data.class || 'Not set' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-slate-600">Type</dt>
              <dd class="text-sm font-semibold text-slate-900">{{ examsStore.examWizard.data.type || 'Not set' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-slate-600">Duration</dt>
              <dd class="text-sm font-semibold text-slate-900">{{ examsStore.examWizard.data.duration || 0 }} minutes</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-slate-600">Pass Mark</dt>
              <dd class="text-sm font-semibold text-slate-900">{{ examsStore.examWizard.data.passMark || 0 }}%</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-slate-600">Questions</dt>
              <dd class="text-sm font-semibold text-slate-900">{{ examsStore.examWizard.data.questions.length }} questions</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-slate-600">Total Points</dt>
              <dd class="text-sm font-semibold text-slate-900">{{ totalPoints }} points</dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex justify-between items-center pt-6 border-t">
        <AppButton 
          v-if="examsStore.examWizard.step > 1" 
          @click="previousStep" 
          text="Previous" 
          variant="outline" 
          size="base"
        />
        <div class="flex gap-2">
          <AppButton 
            v-if="examsStore.examWizard.step < 4" 
            @click="nextStep" 
            text="Next" 
            variant="primary" 
            size="base"
          />
          <AppButton 
            v-if="examsStore.examWizard.step === 4" 
            @click="createExam" 
            text="Create Exam" 
            variant="primary" 
            size="base"
            :loadingText="'Creating Exam...'"
            :processing="loading"
            :disabled="loading"
          />
        </div>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { X, Plus, Sparkles } from 'lucide-vue-next'
import SectionCard from '../components/SectionCard.vue'
import AppButton from '../../shared/AppButton.vue'
import { useTeachersQuestionsStore } from '../stores/questions'
import { useTeachersExamsStore } from '../stores/exams'

const questionsStore = useTeachersQuestionsStore()
const examsStore = useTeachersExamsStore()

// Reactive state
const loading = ref(false)
const selectionMethod = ref('manual')
const selectedQuestionIds = ref([])
const generationRules = ref([
  { topic: '', difficulty: '', type: '', count: 5 }
])

// Sample data
const subjects = computed(() => ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'])
const classes = computed(() => ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'])

const availableQuestions = computed(() => questionsStore.questions)

const selectedQuestions = computed(() => 
  questionsStore.questions.filter(q => selectedQuestionIds.value.includes(q.id))
)

const totalPoints = computed(() => 
  examsStore.examWizard.data.questions.reduce((sum, q) => sum + (q.points || 1), 0)
)

const getStepTitle = () => {
  const titles = {
    1: 'Basic Information',
    2: 'Question Selection',
    3: 'Exam Settings',
    4: 'Review & Confirm'
  }
  return titles[examsStore.examWizard.step] || ''
}

const getStepSubtitle = () => {
  const subtitles = {
    1: 'Enter basic exam details and configuration.',
    2: 'Select questions manually or generate automatically.',
    3: 'Configure exam behavior and scoring.',
    4: 'Review exam details before creating.'
  }
  return subtitles[examsStore.examWizard.step] || ''
}

const previousStep = () => {
  if (examsStore.examWizard.step > 1) {
    examsStore.setWizardStep(examsStore.examWizard.step - 1)
  }
}

const nextStep = () => {
  if (examsStore.examWizard.step < 4) {
    // Validate current step before proceeding
    if (validateCurrentStep()) {
      examsStore.setWizardStep(examsStore.examWizard.step + 1)
    }
  }
}

const validateCurrentStep = () => {
  switch (examsStore.examWizard.step) {
    case 1:
      return examsStore.examWizard.data.title && 
             examsStore.examWizard.data.subject && 
             examsStore.examWizard.data.class && 
             examsStore.examWizard.data.type
    case 2:
      return selectionMethod.value === 'manual' ? 
             selectedQuestionIds.value.length > 0 : 
             generationRules.value.some(rule => rule.count > 0)
    case 3:
      return examsStore.examWizard.data.duration > 0 && 
             examsStore.examWizard.data.passMark >= 0 && 
             examsStore.examWizard.data.passMark <= 100
    case 4:
      return true // Review step doesn't need validation
    default:
      return false
  }
}

const addRule = () => {
  generationRules.value.push({ topic: '', difficulty: '', type: '', count: 5 })
}

const removeRule = (index) => {
  generationRules.value.splice(index, 1)
}

const generateQuestions = async () => {
  try {
    const questions = await examsStore.generateQuestions(generationRules.value)
    examsStore.updateWizardData({ questions })
  } catch (error) {
    console.error('Failed to generate questions:', error)
  }
}

const createExam = async () => {
  if (!validateCurrentStep()) return
  
  loading.value = true
  
  try {
    await examsStore.createExam(examsStore.examWizard.data)
    examsStore.resetWizard()
    // Navigate to exam list or show success message
  } catch (error) {
    console.error('Failed to create exam:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  questionsStore.fetchQuestions()
  questionsStore.fetchTopics()
})
</script>
