<template>
  <div class="space-y-6">
    <!-- Dashboard Overview Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-600">Total Questions</p>
            <p class="text-2xl font-bold text-slate-900">{{ questionsStore.totalQuestions }}</p>
          </div>
          <div class="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <FileQuestion class="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div class="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-600">Total Exams</p>
            <p class="text-2xl font-bold text-slate-900">{{ examsStore.totalExams }}</p>
          </div>
          <div class="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <ClipboardList class="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      <div class="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-600">Published Exams</p>
            <p class="text-2xl font-bold text-slate-900">{{ publishedExamsCount }}</p>
          </div>
          <div class="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
            <CheckCircle class="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </div>

      <div class="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-600">Total Topics</p>
            <p class="text-2xl font-bold text-slate-900">{{ questionsStore.totalTopics }}</p>
          </div>
          <div class="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
            <Tag class="h-6 w-6 text-orange-600" />
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <SectionCard title="Quick Actions" subtitle="Create and manage questions and exams quickly.">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
        <AppButton 
          @click="$router.push('/teachers/questions')" 
          :icon="FileQuestion" 
          text="Question Bank" 
          variant="outline" 
          size="base" 
          full-width
        />
        <AppButton 
          @click="$router.push('/teachers/exams')" 
          :icon="ClipboardList" 
          text="Create Exam" 
          variant="outline" 
          size="base" 
          full-width
        />
        <AppButton 
          @click="$router.push('/teachers/topics')" 
          :icon="Tag" 
          text="Manage Topics" 
          variant="outline" 
          size="base" 
          full-width
        />
        <AppButton 
          @click="$router.push('/teachers/results')" 
          :icon="BarChart3" 
          text="View Results" 
          variant="outline" 
          size="base" 
          full-width
        />
      </div>
    </SectionCard>

    <!-- Recent Activity -->
    <SectionCard title="Recent Questions" subtitle="Latest questions added to the question bank.">
      <div v-if="questionsStore.loading" class="space-y-4">
        <div v-for="i in 5" :key="i" class="h-20 bg-slate-100 rounded-lg animate-pulse"></div>
      </div>
      <div v-else-if="recentQuestions.length === 0" class="text-center py-8">
        <p class="text-slate-500">No questions added yet. Start by creating your first question.</p>
      </div>
      <div v-else class="space-y-4 mt-6">
        <div v-for="question in recentQuestions" :key="question.id" class="border border-slate-200 rounded-lg p-4">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="font-medium text-slate-900">{{ question.content?.substring(0, 100) }}...</h4>
              <div class="mt-2 flex gap-2">
                <span class="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                  {{ question.type }}
                </span>
                <span class="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                  {{ question.difficulty }}
                </span>
              </div>
            </div>
            <AppButton 
              @click="editQuestion(question)" 
              :icon="Edit" 
              variant="ghost" 
              size="xs"
            />
          </div>
        </div>
      </div>
    </SectionCard>

    <!-- Recent Exams -->
    <SectionCard title="Recent Exams" subtitle="Latest exams created or updated.">
      <div v-if="examsStore.loading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="h-24 bg-slate-100 rounded-lg animate-pulse"></div>
      </div>
      <div v-else-if="recentExams.length === 0" class="text-center py-8">
        <p class="text-slate-500">No exams created yet. Start by creating your first exam.</p>
      </div>
      <div v-else class="space-y-4">
        <div v-for="exam in recentExams" :key="exam.id" class="border border-slate-200 rounded-lg p-4">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="font-medium text-slate-900">{{ exam.title }}</h4>
              <div class="mt-2 flex gap-2">
                <span class="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                  {{ exam.subject }}
                </span>
                <span class="rounded-full" :class="getStatusClass(exam.status)">
                  {{ exam.status }}
                </span>
              </div>
            </div>
            <div class="flex gap-2">
              <AppButton 
                @click="editExam(exam)" 
                :icon="Edit" 
                variant="ghost" 
                size="xs"
              />
              <AppButton 
                @click="previewExam(exam)" 
                :icon="Eye" 
                variant="ghost" 
                size="xs"
              />
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { FileQuestion, ClipboardList, CheckCircle, Tag, Edit, Eye, BarChart3 } from 'lucide-vue-next'
import SectionCard from '../components/SectionCard.vue'
import AppButton from '../../shared/AppButton.vue'
import { useTeachersQuestionsStore } from '../stores/questions'
import { useTeachersExamsStore } from '../stores/exams'

const questionsStore = useTeachersQuestionsStore()
const examsStore = useTeachersExamsStore()

const recentQuestions = computed(() => 
  questionsStore.questions.slice(0, 5)
)

const recentExams = computed(() => 
  examsStore.exams.slice(0, 3)
)

const publishedExamsCount = computed(() => 
  examsStore.exams.filter(exam => exam.status === 'Published').length
)

const getStatusClass = (status) => {
  const statusClasses = {
    'Draft': 'bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800',
    'Published': 'bg-green-100 px-2 py-1 text-xs font-medium text-green-800',
    'In Progress': 'bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800',
    'Completed': 'bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800'
  }
  return statusClasses[status] || 'bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800'
}

const editQuestion = (question) => {
  // Navigate to question edit page
  console.log('Edit question:', question)
}

const editExam = (exam) => {
  // Navigate to exam edit page
  console.log('Edit exam:', exam)
}

const previewExam = (exam) => {
  // Navigate to exam preview page
  console.log('Preview exam:', exam)
}

onMounted(() => {
  questionsStore.fetchQuestions()
  examsStore.fetchExams()
  questionsStore.fetchTopics()
})
</script>
