<template>
  <div class="space-y-6">
    <!-- Filters Section -->
    <SectionCard title="Question Bank" subtitle="Manage your question bank with advanced filtering.">
      <template #header>
        <AppButton @click="openCreateModal()" :icon="Plus" text="Create Question" variant="primary" size="base" />
      </template>
      
      <div v-if="questionsStore.loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div v-for="i in 5" :key="i">
          <div class="h-4 bg-slate-100 rounded animate-pulse mb-2"></div>
          <div class="h-10 bg-slate-100 rounded animate-pulse"></div>
        </div>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 mt-8">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Subject</label>
          <select v-model="filters.subject" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All Subjects</option>
            <option v-for="(subject, index) in subjects" :key="index" :value="subject">{{ subject }}</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Topic</label>
          <select v-model="filters.topic" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All Topics</option>
            <option v-for="topic in questionsStore.topics" :key="topic.id" :value="topic.name">{{ topic.name }}</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Class</label>
          <select v-model="filters.class" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All Classes</option>
            <option v-for="(classItem, index) in classes" :key="index" :value="classItem">{{ classItem }}</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Question Type</label>
          <select v-model="filters.type" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All Types</option>
            <option v-for="type in questionsStore.questionTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
          <select v-model="filters.difficulty" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All Difficulties</option>
            <option v-for="difficulty in questionsStore.difficulties" :key="difficulty" :value="difficulty">{{ difficulty }}</option>
          </select>
        </div>
      </div>
      
      <div class="flex justify-between items-center">
        <AppButton @click="clearFilters" text="Clear Filters" variant="outline" size="sm" />
        <AppButton @click="applyFilters" text="Apply Filters" variant="primary" size="sm" />
      </div>
    </SectionCard>

    <!-- Questions List -->
    <SkeletonRows v-if="questionsStore.loading" :columns="6" />
    <div v-else-if="questionsStore.filteredQuestions.length === 0" class="rounded-[24px] border border-slate-200 bg-white p-12 text-center">
      <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
        <FileQuestion class="h-12 w-12 text-slate-400" />
      </div>
      <h3 class="mt-6 text-xl font-semibold text-slate-900">No Questions Found</h3>
      <p class="mt-2 text-slate-600">Try adjusting your filters or create a new question.</p>
      <div class="mt-8">
        <AppButton @click="openCreateModal()" :icon="Plus" text="Create Question" variant="primary" size="lg" />
      </div>
    </div>
    
    <div v-else class="overflow-hidden rounded-[24px] border border-slate-200">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 bg-white">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Question</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Type</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Subject</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Topic</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Class</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Difficulty</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="question in questionsStore.filteredQuestions" :key="question.id" class="transition hover:bg-slate-50/80">
              <td class="px-5 py-4 text-sm text-slate-600 max-w-xs truncate">{{ question.content }}</td>
              <td class="px-5 py-4 text-sm text-slate-600">
                <span class="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">{{ question.type }}</span>
              </td>
              <td class="px-5 py-4 text-sm text-slate-600">{{ question.subject?.name || 'N/A' }}</td>
              <td class="px-5 py-4 text-sm text-slate-600">{{ question.topic?.name || 'N/A' }}</td>
              <td class="px-5 py-4 text-sm text-slate-600">{{ question.class_level?.name || 'N/A' }}</td>
              <td class="px-5 py-4 text-sm text-slate-600">
                <span class="rounded-full" :class="getDifficultyClass(question.difficulty)">{{ capitalizeFirst(question.difficulty) }}</span>
              </td>
              <td class="px-5 py-4 text-sm text-slate-600">
                <div class="flex gap-2">
                  <AppButton @click="previewQuestion(question)" :icon="Eye" variant="ghost" size="xs" />
                  <AppButton @click="editQuestion(question)" :icon="Edit" variant="ghost" size="xs" />
                  <AppButton @click="deleteQuestion(question.id)" :icon="Trash2" variant="ghost" size="xs" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Question Modal -->
  <QuestionModal 
    :show="showModal" 
    :question="selectedQuestion"
    @close="closeModal"
    @submit="submitQuestion"
  />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Plus, FileQuestion, Eye, Edit, Trash2 } from 'lucide-vue-next'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import AppButton from '../../shared/AppButton.vue'
import QuestionModal from '../components/QuestionModal.vue'
import { useTeachersQuestionsStore } from '../stores/questions'

const questionsStore = useTeachersQuestionsStore()

// Reactive state
const showModal = ref(false)
const selectedQuestion = ref(null)

// Sample data - in real app, this would come from API
const subjects = computed(() => ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'])
const classes = computed(() => ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'])

const filters = ref({
  subject: '',
  topic: '',
  class: '',
  type: '',
  difficulty: ''
})

const openCreateModal = () => {
  selectedQuestion.value = null
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedQuestion.value = null
}

const editQuestion = (question) => {
  selectedQuestion.value = question
  showModal.value = true
}

const previewQuestion = (question) => {
  console.log('Preview question:', question)
  // Navigate to preview page
}

const deleteQuestion = async (id) => {
  if (!confirm('Are you sure you want to delete this question?')) {
    return
  }
  
  try {
    await questionsStore.deleteQuestion(id)
  } catch (error) {
    console.error('Failed to delete question:', error)
  }
}

const submitQuestion = async (questionData) => {
  try {
    if (questionData.id) {
      await questionsStore.updateQuestion(questionData.id, questionData)
    } else {
      await questionsStore.createQuestion(questionData)
    }
    closeModal()
  } catch (error) {
    console.error('Failed to save question:', error)
  }
}

const applyFilters = () => {
  questionsStore.setFilters(filters.value)
}

const clearFilters = () => {
  filters.value = {
    subject: '',
    topic: '',
    class: '',
    type: '',
    difficulty: ''
  }
  questionsStore.clearFilters()
}

const getDifficultyClass = (difficulty) => {
  const classes = {
    'easy': 'bg-green-100 px-2 py-1 text-xs font-medium text-green-800',
    'medium': 'bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800',
    'hard': 'bg-red-100 px-2 py-1 text-xs font-medium text-red-800'
  }
  return classes[difficulty] || 'bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800'
}

const capitalizeFirst = (str) => {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

onMounted(() => {
  questionsStore.fetchQuestions()
})
</script>
