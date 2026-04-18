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
      <div v-else class="overflow-hidden rounded-[24px] border border-slate-200">
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
import { useSchoolAdminClassesStore } from '../stores/classes'
import { useSchoolAdminSessionsStore } from '../stores/sessions'
import { useSchoolAdminSubjectsStore } from '../stores/subjects'
import { useSchoolAdminTeachersStore } from '../stores/teachers'
import { useSchoolAdminUiStore } from '../stores/ui'

const route = useRoute()
const headings = ['Teacher', 'Class Level', 'Academic Session', 'Assigned Date', 'Actions']
const subjectsStore = useSchoolAdminSubjectsStore()
const classesStore = useSchoolAdminClassesStore()
const teachersStore = useSchoolAdminTeachersStore()
const sessionsStore = useSchoolAdminSessionsStore()
const uiStore = useSchoolAdminUiStore()

const isLoading = computed(() => subjectsStore.loading || classesStore.loading || teachersStore.loading || sessionsStore.loading)
const hasError = computed(() => !isLoading.value && !subject.value && subjectsStore.subjects.length > 0)

const subjectId = computed(() => route.params.id)
const subject = computed(() => {
  console.log('Looking for subject with ID:', subjectId.value)
  console.log('Available subjects:', subjectsStore.subjects)
  const found = subjectsStore.subjects.find(s => s.id === subjectId.value)
  console.log('Found subject:', found)
  return found
})
const assignments = computed(() => {
  if (!subject.value) return []
  const assignments = subject.value?.teacher_assignments || []
  console.log('Subject assignments:', assignments)
  return assignments
})

// Modal state
const showModal = ref(false)
const selectedAssignment = ref(null)

// Loading states
const deleteLoading = ref(new Set())

const getTeacherName = (teacherId) => {
  const teacher = teachersStore.teachers.find(t => t.id === teacherId)
  return teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown'
}

const getClassName = (classId) => {
  const classLevel = classesStore.classes.find(c => c.id === classId)
  return classLevel ? classLevel.name : 'Unknown'
}

const getSessionName = (sessionId) => {
  const session = sessionsStore.sessions.find(s => s.id === sessionId)
  return session ? session.name : 'Unknown'
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
    console.error('Assignment error:', error)
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
    console.error('Assignment error:', error)
    uiStore.addToast({ title: 'Error', message: error.message || 'Failed to remove assignment.', variant: 'error' })
  } finally {
    deleteLoading.value = new Set([...deleteLoading.value].filter(loadingId => loadingId !== id))
  }
}

onMounted(async () => {
  try {
    await subjectsStore.fetchSubjects()
    await classesStore.fetchClasses()
    await teachersStore.fetchTeachers()
    await sessionsStore.fetchSessions()
    
    // Debug: Log teacher data structure
    console.log('Teachers data structure:', teachersStore.teachers)
    if (teachersStore.teachers.length > 0) {
      console.log('First teacher structure:', teachersStore.teachers[0])
    }
  } catch (error) {
    console.error('Error loading data:', error)
    uiStore.addToast({ title: 'Error', message: 'Failed to load data. Please check your connection.', variant: 'error' })
  }
})
</script>
