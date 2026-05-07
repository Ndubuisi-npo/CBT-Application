<template>
  <div class="space-y-6">
    <SectionCard title="Exams" subtitle="Manage and monitor all created exams.">
      <template #header>
        <AppButton @click="$router.push('/teachers/exam-wizard')" :icon="Plus" text="Create Exam" variant="primary" size="base" />
      </template>
      
      <!-- Filters -->
      <div v-if="examsStore.loading" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div v-for="i in 3" :key="i">
          <div class="h-4 bg-slate-100 rounded animate-pulse mb-2"></div>
          <div class="h-10 bg-slate-100 rounded animate-pulse"></div>
        </div>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Status</label>
          <select v-model="filters.status" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All Status</option>
            <option v-for="status in examsStore.examStatuses" :key="status" :value="status">{{ status }}</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Subject</label>
          <select v-model="filters.subject" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All Subjects</option>
            <option v-for="subject in subjects" :key="subject" :value="subject">{{ subject }}</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Class</label>
          <select v-model="filters.class" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All Classes</option>
            <option v-for="classItem in classes" :key="classItem" :value="classItem">{{ classItem }}</option>
          </select>
        </div>
      </div>
      
      <div class="flex justify-between items-center">
        <AppButton @click="clearFilters" text="Clear Filters" variant="outline" size="sm" />
        <AppButton @click="applyFilters" text="Apply Filters" variant="primary" size="sm" />
      </div>
    </SectionCard>

    <!-- Exams List -->
    <SkeletonRows v-if="examsStore.loading" :columns="6" />
    <div v-else-if="examsStore.filteredExams.length === 0" class="rounded-[24px] border border-slate-200 bg-white p-12 text-center">
      <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
        <ClipboardList class="h-12 w-12 text-slate-400" />
      </div>
      <h3 class="mt-6 text-xl font-semibold text-slate-900">No Exams Found</h3>
      <p class="mt-2 text-slate-600">Try adjusting your filters or create your first exam.</p>
      <div class="mt-8">
        <AppButton @click="$router.push('/teachers/exam-wizard')" :icon="Plus" text="Create Exam" variant="primary" size="lg" />
      </div>
    </div>
    
    <div v-else class="overflow-hidden rounded-[24px] border border-slate-200">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 bg-white">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Title</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Subject</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Class</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Type</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Created</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="exam in examsStore.filteredExams" :key="exam.id" class="transition hover:bg-slate-50/80">
              <td class="px-5 py-4 text-sm text-slate-600 font-medium">{{ exam.title }}</td>
              <td class="px-5 py-4 text-sm text-slate-600">{{ exam.subject }}</td>
              <td class="px-5 py-4 text-sm text-slate-600">{{ exam.class }}</td>
              <td class="px-5 py-4 text-sm text-slate-600">{{ exam.type }}</td>
              <td class="px-5 py-4 text-sm text-slate-600">
                <span class="rounded-full px-2 py-1 text-xs font-medium" :class="getStatusClass(exam.status)">
                  {{ exam.status }}
                </span>
              </td>
              <td class="px-5 py-4 text-sm text-slate-600">{{ formatDate(exam.created_at) }}</td>
              <td class="px-5 py-4 text-sm text-slate-600">
                <div class="flex gap-2">
                  <AppButton @click="viewExam(exam)" :icon="Eye" variant="ghost" size="xs" />
                  <AppButton @click="editExam(exam)" :icon="Edit" variant="ghost" size="xs" />
                  <AppButton @click="publishExam(exam)" v-if="exam.status === 'Draft'" :icon="Upload" variant="ghost" size="xs" />
                  <AppButton @click="unpublishExam(exam)" v-if="exam.status === 'Published'" :icon="Download" variant="ghost" size="xs" />
                  <AppButton @click="viewResults(exam)" v-if="exam.status === 'Completed'" :icon="BarChart3" variant="ghost" size="xs" />
                  <AppButton @click="deleteExam(exam.id)" :icon="Trash2" variant="ghost" size="xs" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Plus, ClipboardList, Eye, Edit, Upload, Download, BarChart3, Trash2 } from 'lucide-vue-next'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import AppButton from '../../shared/AppButton.vue'
import { useTeachersExamsStore } from '../stores/exams'

const examsStore = useTeachersExamsStore()

// Reactive state
const filters = ref({
  status: '',
  subject: '',
  class: ''
})

// Sample data
const subjects = computed(() => ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'])
const classes = computed(() => ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'])

const applyFilters = () => {
  examsStore.setFilters(filters.value)
}

const clearFilters = () => {
  filters.value = {
    status: '',
    subject: '',
    class: ''
  }
  examsStore.clearFilters()
}

const getStatusClass = (status) => {
  const statusClasses = {
    'Draft': 'bg-gray-100 text-gray-800',
    'Published': 'bg-green-100 text-green-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    'Completed': 'bg-blue-100 text-blue-800'
  }
  return statusClasses[status] || 'bg-gray-100 text-gray-800'
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

const viewExam = (exam) => {
  console.log('View exam:', exam)
  // Navigate to exam detail/preview page
}

const editExam = (exam) => {
  console.log('Edit exam:', exam)
  // Navigate to exam edit page
}

const publishExam = async (exam) => {
  if (!confirm(`Are you sure you want to publish "${exam.title}"?`)) {
    return
  }
  
  try {
    await examsStore.publishExam(exam.id)
  } catch (error) {
    console.error('Failed to publish exam:', error)
  }
}

const unpublishExam = async (exam) => {
  if (!confirm(`Are you sure you want to unpublish "${exam.title}"?`)) {
    return
  }
  
  try {
    await examsStore.unpublishExam(exam.id)
  } catch (error) {
    console.error('Failed to unpublish exam:', error)
  }
}

const viewResults = (exam) => {
  console.log('View results:', exam)
  // Navigate to results page
}

const deleteExam = async (id) => {
  if (!confirm('Are you sure you want to delete this exam?')) {
    return
  }
  
  try {
    await examsStore.deleteExam(id)
  } catch (error) {
    console.error('Failed to delete exam:', error)
  }
}

onMounted(() => {
  examsStore.fetchExams()
})
</script>
