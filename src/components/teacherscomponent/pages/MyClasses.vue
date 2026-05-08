<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <SectionCard title="My Classes" subtitle="View and manage your assigned classes.">
      <template #header>
        <div class="flex items-center gap-3">
          <div v-if="isClassTeacher" class="text-sm text-slate-600">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Class Teacher
            </span>
          </div>
          <div v-else-if="isSubjectTeacher" class="text-sm text-slate-600">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Subject Teacher
            </span>
          </div>
        </div>
      </template>
    </SectionCard>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="space-y-4">
          <div class="h-6 bg-slate-100 rounded animate-pulse"></div>
          <div class="h-4 bg-slate-100 rounded animate-pulse"></div>
          <div class="h-4 bg-slate-100 rounded animate-pulse w-3/4"></div>
          <div class="flex gap-2">
            <div class="h-8 bg-slate-100 rounded animate-pulse flex-1"></div>
            <div class="h-8 bg-slate-100 rounded animate-pulse flex-1"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!hasClasses" class="text-center py-12">
      <div class="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Users class="h-12 w-12 text-slate-400" />
      </div>
      <h3 class="text-lg font-medium text-slate-900 mb-2">No Classes Assigned</h3>
      <p class="text-slate-500 mb-6">You haven't been assigned to any classes yet.</p>
    </div>

    <!-- Classes Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="classAssignment in classAssignments" :key="classAssignment.id" class="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
        <div class="space-y-4">
          <!-- Class Header -->
          <div>
            <h3 class="text-lg font-semibold text-slate-900">{{ classAssignment.name }}</h3>
            <p class="text-sm text-slate-600 mt-1">{{ classAssignment.description || 'No description available' }}</p>
          </div>
          
          <!-- Subjects List -->
          <div>
            <h4 class="text-sm font-medium text-slate-700 mb-2">Subjects</h4>
            <div class="space-y-1">
              <div v-for="subject in classAssignment.subjects" :key="subject.id" class="flex items-center justify-between py-1">
                <span class="text-sm text-slate-600">{{ subject.name }}</span>
                <span 
                  v-if="!canEditSubject(subject.name)"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                  title="Subject has dedicated teacher"
                >
                  <Lock class="h-3 w-3" />
                </span>
                <span 
                  v-else
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  title="You can edit this subject"
                >
                  <Check class="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>

          <!-- Class Details -->
          <div class="flex items-center justify-between text-sm text-slate-500">
            <span>{{ classAssignment.student_count || 0 }} students</span>
            <span>{{ formatDate(classAssignment.created_at) }}</span>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex gap-2">
            <AppButton 
              @click="viewClassDetails(classAssignment)" 
              :icon="Eye" 
              text="View Details" 
              variant="outline" 
              size="sm" 
              full-width 
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Users, Eye, Check, Lock } from 'lucide-vue-next'
import SectionCard from '../components/SectionCard.vue'
import AppButton from '../../shared/AppButton.vue'
import { usePermissions } from '../composables/usePermissions'

const { canEditSubject, isClassTeacher, isSubjectTeacher, classAssignments } = usePermissions()

const loading = ref(false)

const hasClasses = computed(() => {
  return classAssignments.value && classAssignments.value.length > 0
})

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString()
}

const viewClassDetails = (classAssignment) => {
  // Navigate to class details or show modal
  console.log('View class details:', classAssignment)
}

onMounted(() => {
  // Fetch class assignments from API
  loading.value = true
  try {
    // In real implementation, this would fetch from API
    // For now, using mock data from permissions composable
    loading.value = false
  } catch (error) {
    console.error('Failed to fetch classes:', error)
    loading.value = false
  }
})
</script>
