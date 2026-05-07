<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <SectionCard title="Exam Results" subtitle="View and analyze student exam performance.">
      <template #header>
        <AppButton @click="exportResults()" :icon="Download" text="Export" variant="outline" size="base" />
      </template>
      
      <!-- Search and Filter -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search students or exams..."
            class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select v-model="filters.exam" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Exams</option>
          <option v-for="exam in exams" :key="exam.id" :value="exam.id">{{ exam.title }}</option>
        </select>
        
        <select v-model="filters.status" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="in_progress">In Progress</option>
          <option value="not_started">Not Started</option>
        </select>
      </div>
    </SectionCard>

    <!-- Results Loading State -->
    <div v-if="loading" class="space-y-6">
      <div v-for="i in 5" :key="i" class="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="h-6 bg-slate-100 rounded animate-pulse w-1/3"></div>
            <div class="h-4 bg-slate-100 rounded animate-pulse w-1/4"></div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="h-16 bg-slate-100 rounded animate-pulse"></div>
            <div class="h-16 bg-slate-100 rounded animate-pulse"></div>
            <div class="h-16 bg-slate-100 rounded animate-pulse"></div>
            <div class="h-16 bg-slate-100 rounded animate-pulse"></div>
          </div>
          <div class="h-20 bg-slate-100 rounded animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- Results Empty State -->
    <div v-else-if="filteredResults.length === 0" class="text-center py-12">
      <div class="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <BarChart3 class="h-12 w-12 text-slate-400" />
      </div>
      <h3 class="text-lg font-medium text-slate-900 mb-2">No results found</h3>
      <p class="text-slate-500 mb-6">{{ searchQuery ? 'Try adjusting your search terms' : 'No exam results available yet' }}</p>
      <AppButton v-if="!searchQuery" @click="$router.push('/teachers/exams')" :icon="ClipboardList" text="Create Exam" variant="primary" size="base" />
    </div>

    <!-- Results List -->
    <div v-else class="space-y-6">
      <div v-for="result in filteredResults" :key="result.id" class="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="space-y-4">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-slate-900">{{ result.exam_title }}</h3>
              <p class="text-sm text-slate-600">{{ result.student_name }} • {{ formatDate(result.submitted_at) }}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="rounded-full px-3 py-1 text-xs font-medium" :class="getStatusClass(result.status)">
                {{ formatStatus(result.status) }}
              </span>
              <AppButton @click="viewDetails(result)" :icon="Eye" text="View Details" variant="outline" size="sm" />
            </div>
          </div>

          <!-- Score Overview -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="text-center p-4 bg-slate-50 rounded-lg">
              <div class="text-2xl font-bold text-slate-900">{{ result.score || 0 }}%</div>
              <div class="text-sm text-slate-600">Score</div>
            </div>
            <div class="text-center p-4 bg-slate-50 rounded-lg">
              <div class="text-2xl font-bold text-green-600">{{ result.correct_answers || 0 }}</div>
              <div class="text-sm text-slate-600">Correct</div>
            </div>
            <div class="text-center p-4 bg-slate-50 rounded-lg">
              <div class="text-2xl font-bold text-red-600">{{ result.incorrect_answers || 0 }}</div>
              <div class="text-sm text-slate-600">Incorrect</div>
            </div>
            <div class="text-center p-4 bg-slate-50 rounded-lg">
              <div class="text-2xl font-bold text-blue-600">{{ formatDuration(result.time_spent) }}</div>
              <div class="text-sm text-slate-600">Time Spent</div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="space-y-2">
            <div class="flex justify-between text-sm text-slate-600">
              <span>Progress</span>
              <span>{{ result.answered_questions || 0 }}/{{ result.total_questions || 0 }} questions</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2">
              <div 
                class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                :style="{ width: `${(result.answered_questions / result.total_questions) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Result Details Modal -->
    <div v-if="showDetailsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-slate-900">Exam Details</h3>
          <AppButton @click="closeDetailsModal()" :icon="X" text="Close" variant="ghost" size="sm" />
        </div>
        
        <div v-if="selectedResult" class="space-y-6">
          <!-- Student Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 class="font-medium text-slate-900 mb-2">Student Information</h4>
              <div class="space-y-1 text-sm">
                <p><span class="text-slate-600">Name:</span> {{ selectedResult.student_name }}</p>
                <p><span class="text-slate-600">Email:</span> {{ selectedResult.student_email || 'N/A' }}</p>
                <p><span class="text-slate-600">Class:</span> {{ selectedResult.class_name || 'N/A' }}</p>
              </div>
            </div>
            <div>
              <h4 class="font-medium text-slate-900 mb-2">Exam Information</h4>
              <div class="space-y-1 text-sm">
                <p><span class="text-slate-600">Title:</span> {{ selectedResult.exam_title }}</p>
                <p><span class="text-slate-600">Submitted:</span> {{ formatDate(selectedResult.submitted_at) }}</p>
                <p><span class="text-slate-600">Duration:</span> {{ formatDuration(selectedResult.time_spent) }}</p>
              </div>
            </div>
          </div>

          <!-- Questions Breakdown -->
          <div>
            <h4 class="font-medium text-slate-900 mb-4">Questions Breakdown</h4>
            <div class="space-y-3">
              <div v-for="question in selectedResult.questions" :key="question.id" class="border border-slate-200 rounded-lg p-4">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <p class="font-medium text-slate-900 mb-2">{{ question.question_text }}</p>
                    <div class="text-sm space-y-1">
                      <p><span class="text-slate-600">Student Answer:</span> 
                        <span :class="question.is_correct ? 'text-green-600' : 'text-red-600'">
                          {{ question.student_answer || 'Not answered' }}
                        </span>
                      </p>
                      <p v-if="!question.is_correct"><span class="text-slate-600">Correct Answer:</span> {{ question.correct_answer }}</p>
                    </div>
                  </div>
                  <div class="ml-4">
                    <span class="rounded-full px-2 py-1 text-xs font-medium" :class="question.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                      {{ question.is_correct ? 'Correct' : 'Incorrect' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Download, Eye, BarChart3, X, ClipboardList } from 'lucide-vue-next'
import SectionCard from '../components/SectionCard.vue'
import AppButton from '../../shared/AppButton.vue'

const loading = ref(false)
const searchQuery = ref('')
const showDetailsModal = ref(false)
const selectedResult = ref(null)

const filters = ref({
  exam: '',
  status: ''
})

// Mock data - replace with actual API calls
const results = ref([
  {
    id: 1,
    exam_title: 'Mathematics Final Exam',
    student_name: 'John Doe',
    student_email: 'john@example.com',
    class_name: 'SSS 1A',
    status: 'completed',
    score: 85,
    correct_answers: 17,
    incorrect_answers: 3,
    total_questions: 20,
    answered_questions: 20,
    time_spent: 3600,
    submitted_at: '2024-01-15T10:30:00Z',
    questions: [
      {
        id: 1,
        question_text: 'What is 2 + 2?',
        student_answer: '4',
        correct_answer: '4',
        is_correct: true
      },
      {
        id: 2,
        question_text: 'What is 5 × 3?',
        student_answer: '15',
        correct_answer: '15',
        is_correct: true
      }
    ]
  }
])

const exams = ref([
  { id: 1, title: 'Mathematics Final Exam' },
  { id: 2, title: 'English Language Test' },
  { id: 3, title: 'Science Quiz' }
])

const filteredResults = computed(() => {
  let filtered = results.value

  if (searchQuery.value) {
    filtered = filtered.filter(result =>
      result.exam_title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      result.student_name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (filters.value.exam) {
    filtered = filtered.filter(result => result.exam_id === filters.value.exam)
  }

  if (filters.value.status) {
    filtered = filtered.filter(result => result.status === filters.value.status)
  }

  return filtered
})

const getStatusClass = (status) => {
  const statusClasses = {
    'completed': 'bg-green-100 text-green-800',
    'in_progress': 'bg-yellow-100 text-yellow-800',
    'not_started': 'bg-gray-100 text-gray-800'
  }
  return statusClasses[status] || 'bg-gray-100 text-gray-800'
}

const formatStatus = (status) => {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = (seconds) => {
  if (!seconds) return 'N/A'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

const viewDetails = (result) => {
  selectedResult.value = result
  showDetailsModal.value = true
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedResult.value = null
}

const exportResults = () => {
  // Implement export functionality
  console.log('Exporting results...')
}

const fetchResults = async () => {
  loading.value = true
  try {
    // Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    // results.value = await fetchExamResults()
  } catch (error) {
    console.error('Failed to fetch results:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchResults()
})
</script>
