<template>
  <div class="space-y-6">
    <SectionCard :title="`Assign Teachers to ${subject?.name || 'Subject'}`" subtitle="Manage teacher assignments for this subject.">
      <template #header>
        <AppButton @click="openModal()" :icon="Plus" text="Create and Assign" variant="primary" size="sm" />
      </template>
      <SkeletonRows v-if="isLoading" :columns="5" />
      <div v-else-if="hasError" class="text-center py-8">
        <p class="text-slate-600">Subject not found or an error occurred.</p>
        <AppButton @click="$router.push('/school-admin/subjects')" text="Back to Subjects" variant="ghost" class="mt-4" />
      </div>
      <div v-else-if="!subject" class="text-center py-8">
        <p class="text-slate-600">Loading subject information...</p>
      </div>
      <div v-else class="overflow-hidden rounded-2xl border border-slate-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th v-for="heading in headings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ heading }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="assignments.length === 0">
                <td colspan="5" class="px-5 py-8 text-center text-slate-600">
                  No teacher assignments found for this subject.
                </td>
              </tr>
              <tr v-for="assignment in assignments" :key="assignment.id" class="transition hover:bg-slate-50/80">
                <td class="px-5 py-4 font-semibold text-slate-900">{{ getTeacherName(assignment.user_id) }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ getClassName(assignment.class_level_id) }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ getSessionName(assignment.academic_session_id) }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ formatDate(assignment.created_at) }}</td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <AppButton 
                      text="Remove" 
                      @click="deleteAssignment(assignment.id)" 
                      variant="danger" 
                      size="xs"
                      :processing="deleteLoading.has(assignment.id)"
                      :disabled="deleteLoading.has(assignment.id)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <TeacherAssignmentModal 
      :show="showModal" 
      :assignment="selectedAssignment"
      @close="closeModal"
      @submit="submitAssignment"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import AppButton from '../../shared/AppButton.vue'
import TeacherAssignmentModal from '../components/TeacherAssignmentModal.vue'
import { Plus } from 'lucide-vue-next'
import { useSchoolAdminSubjectsStore } from '../stores/subjects'
import { useSchoolAdminUiStore } from '../stores/ui'

const route = useRoute()
const headings = ['Teacher', 'Class Level', 'Academic Session', 'Assigned Date', 'Actions']
const subjectsStore = useSchoolAdminSubjectsStore()
const uiStore = useSchoolAdminUiStore()

const isLoading = computed(() => subjectsStore.loading)
const hasError = computed(() => !isLoading.value && !subject.value && subjectsStore.subjects.length > 0)

const subjectId = computed(() => route.params.id)
const subject = computed(() => {
  const found = subjectsStore.subjects.find(s => s.id === subjectId.value)
  return found
})
const assignments = computed(() => {
  if (!subject.value) return []
  const assignments = Array.isArray(subject.value.teacher_assignments)
    ? subject.value.teacher_assignments
    : Array.isArray(subject.value.teacherAssignments)
      ? subject.value.teacherAssignments
      : []
  return assignments
})

// Modal state
const showModal = ref(false)
const selectedAssignment = ref(null)

// Loading states
const deleteLoading = ref(new Set())

const getTeacherName = (teacherId) => {
  // Extract teacher name from teacher_assignments in subject
  const teacherAssignments = Array.isArray(subject.value?.teacher_assignments)
    ? subject.value.teacher_assignments
    : Array.isArray(subject.value?.teacherAssignments)
      ? subject.value.teacherAssignments
      : []
  const assignment = teacherAssignments.find(a => a.user_id === teacherId)
  if (assignment?.user) {
    return `${assignment.user.first_name} ${assignment.user.last_name}`.trim()
  }
  return 'Unknown'
}

const getClassName = (classId) => {
  // Extract class level name from subject's class_levels
  const classLevels = Array.isArray(subject.value?.class_levels)
    ? subject.value.class_levels
    : Array.isArray(subject.value?.classLevels)
      ? subject.value.classLevels
      : []
  const classLevel = classLevels.find(c => c.id === classId)
  if (classLevel) {
    return classLevel.name
  }
  return 'Unknown'
}

const getSessionName = (sessionId) => {
  // Since academic_session is nested in the assignment object
  const teacherAssignments = Array.isArray(subject.value?.teacher_assignments)
    ? subject.value.teacher_assignments
    : Array.isArray(subject.value?.teacherAssignments)
      ? subject.value.teacherAssignments
      : []
  const assignment = teacherAssignments.find(a => a.academic_session_id === sessionId || a.id === sessionId)
  if (assignment?.academic_session) {
    return assignment.academic_session.name || sessionId || 'Unknown'
  }
  return sessionId || 'Unknown'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString()
}

// Modal functions
const openModal = () => {
  selectedAssignment.value = null
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedAssignment.value = null
}

const editAssignment = (assignment) => {
  selectedAssignment.value = assignment
  showModal.value = true
}

const submitAssignment = async (assignmentData) => {
  try {
    if (assignmentData.id) {
      // Update existing assignment
      await subjectsStore.updateAssignment(subjectId.value, assignmentData.id, {
        user_id: assignmentData.user_id,
        class_level_id: assignmentData.class_level_id,
        academic_session_id: assignmentData.academic_session_id
      })
      uiStore.addToast({ title: 'Assignment updated', message: 'Teacher assignment has been updated.', variant: 'success' })
    } else {
      // Create new assignment
      await subjectsStore.assignTeacher(subjectId.value, {
        user_id: assignmentData.user_id,
        class_level_id: assignmentData.class_level_id,
        academic_session_id: assignmentData.academic_session_id
      })
      uiStore.addToast({ title: 'Teacher assigned', message: 'Teacher has been successfully assigned to the subject.', variant: 'success' })
    }
    
    // Close modal after a short delay to ensure toast is visible
    setTimeout(() => {
      closeModal()
    }, 100)
    await subjectsStore.fetchSubjects() // Refresh to get updated assignments
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: error.message || 'Failed to save assignment.', variant: 'error' })
    // Close modal after error toast as well
    setTimeout(() => {
      closeModal()
    }, 100)
  }
}

const deleteAssignment = async (id) => {
  if (!confirm('Are you sure you want to remove this teacher assignment? This action cannot be undone.')) {
    return
  }
  
  deleteLoading.value = new Set([...deleteLoading.value, id])
  
  try {
    await subjectsStore.deleteAssignment(subjectId.value, id)
    uiStore.addToast({ title: 'Assignment removed', message: 'Teacher assignment has been removed.', variant: 'success' })
    await subjectsStore.fetchSubjects() // Refresh to get updated assignments
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: error.message || 'Failed to remove assignment.', variant: 'error' })
  } finally {
    deleteLoading.value = new Set([...deleteLoading.value].filter(loadingId => loadingId !== id))
  }
}

onMounted(async () => {
  try {
    // Only fetch subjects if not already loaded
    if (subjectsStore.subjects.length === 0) {
      await subjectsStore.fetchSubjects()
    }
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to load data. Please check your connection.', variant: 'error' })
  }
})
</script>
