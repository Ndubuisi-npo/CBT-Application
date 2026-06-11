<template>
  <div class="space-y-6">
    <SectionCard title="Arms" subtitle="Manage class arms (e.g., JSS 1A, JSS 1B).">
      <template #header>
        <AppButton @click="openModal()" :icon="Plus" text="Create" variant="primary" size="sm" />
      </template>
      <SkeletonRows v-if="classArmsStore.loading" :columns="3" />
      <div v-else-if="classArmsStore.classArms.length === 0" class="text-center py-12">
        <div class="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <svg class="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-slate-900 mb-2">No arms created</h3>
        <p class="text-slate-600 mb-6">Get started by creating your first class.</p>
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
              <tr v-for="classArm in classArmsStore.classArms" :key="classArm.id" class="transition hover:bg-slate-50/80">
                <td class="px-5 py-4 font-semibold text-slate-900">{{ classArm.name }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ getAssignedTeacher(classArm) }}</td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <AppButton text="Edit" @click="editClass(classArm)" variant="outline" size="xs" />
                    <AppButton text="Assign Teacher" @click="openAssignTeacherModal(classArm)" variant="primary" size="xs" />
                    <AppButton 
                      text="Delete" 
                      @click="deleteClass(classArm.id)" 
                      variant="danger" 
                      size="xs"
                      loadingText="Deleting..."
                      :processing="deleteLoading.has(classArm.id)"
                      :disabled="deleteLoading.has(classArm.id)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <ClassModal 
      :show="showModal" 
      :classItem="selectedClass"
      @close="closeModal"
      @submit="submitClass"
    />

    <AssignTeacherModal 
      :show="showAssignTeacherModal" 
      :classItem="selectedClass"
      @close="closeAssignTeacherModal"
      @submit="assignTeacher"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import AppButton from '../../shared/AppButton.vue'
import ClassModal from '../components/ClassModal.vue'
import AssignTeacherModal from '../components/AssignTeacherModal.vue'
import { Plus } from 'lucide-vue-next'
import { useSchoolAdminClassArmsStore } from '../stores/classArms'
import { useSchoolAdminUiStore } from '../stores/ui'

const route = useRoute()
const headings = ['Class Name', 'Teacher', 'Actions']
const classArmsStore = useSchoolAdminClassArmsStore()
const uiStore = useSchoolAdminUiStore()

// Modal state
const showModal = ref(false)
const selectedClass = ref(null)
const showAssignTeacherModal = ref(false)

// Loading states
const deleteLoading = ref(new Set())

const classLevelId = computed(() => route.params.id)

onMounted(async () => {
  try {
    if (classLevelId.value) {
      await classArmsStore.fetchClassArms(classLevelId.value)
    }
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to load data. Please check your connection.', variant: 'error' })
  }
})

watch(() => classLevelId.value, async (newId) => {
  if (newId) {
    await classArmsStore.fetchClassArms(newId)
  }
})

// Modal functions
const openModal = () => {
  selectedClass.value = null
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedClass.value = null
}

const editClass = (classItem) => {
  selectedClass.value = classItem
  showModal.value = true
}

const submitClass = async (classData) => {
  try {
    if (classData.id) {
      // Update existing class
      await classArmsStore.saveClassArm(classLevelId.value, {
        id: classData.id,
        name: classData.name
      })
      uiStore.addToast({ title: 'Class updated', message: 'Class has been updated.', variant: 'success' })
    } else {
      // Create new class
      await classArmsStore.saveClassArm(classLevelId.value, {
        name: classData.name
      })
      uiStore.addToast({ title: 'Class created', message: 'Class has been created.', variant: 'success' })
    }
    
    // Close modal after a short delay to ensure toast is visible
    setTimeout(() => {
      closeModal()
    }, 100)
    await classArmsStore.fetchClassArms(classLevelId.value) // Refresh to get updated list
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: error.message || 'Failed to save class.', variant: 'error' })
    // Close modal after error toast as well
    setTimeout(() => {
      closeModal()
    }, 100)
  }
}

const deleteClass = async (id) => {
  if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
    return
  }
  
  deleteLoading.value = new Set([...deleteLoading.value, id])
  
  try {
    await classArmsStore.deleteClassArm(classLevelId.value, id)
    uiStore.addToast({ title: 'Class deleted', message: 'Class has been deleted.', variant: 'success' })
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to delete class.', variant: 'error' })
  } finally {
    deleteLoading.value = new Set([...deleteLoading.value].filter(loadingId => loadingId !== id))
  }
}

// Teacher assignment functions
const openAssignTeacherModal = (classItem) => {
  selectedClass.value = classItem
  showAssignTeacherModal.value = true
}

const closeAssignTeacherModal = () => {
  showAssignTeacherModal.value = false
  selectedClass.value = null
}

const assignTeacher = async (assignmentData) => {
  try {
    await classArmsStore.assignTeacher(classLevelId.value, assignmentData.classId, {
      assigned_teacher_id: assignmentData.teacherId,
    })

    uiStore.addToast({ title: 'Teacher assigned', message: 'Teacher has been assigned to the class.', variant: 'success' })
    
    // Close modal after a short delay to ensure toast is visible
    setTimeout(() => {
      closeAssignTeacherModal()
    }, 100)
    
    await classArmsStore.fetchClassArms(classLevelId.value)
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: error.message || 'Failed to assign teacher.', variant: 'error' })
    // Close modal after error toast as well
    setTimeout(() => {
      closeAssignTeacherModal()
    }, 100)
  }
}

const getAssignedTeacher = (classItem) => {
  const teacher = classItem.assigned_teacher || classItem.teacher

  if (teacher?.first_name || teacher?.last_name) {
    return `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim()
  }

  if (classItem.assigned_teacher_id) {
    return `Assigned (${classItem.assigned_teacher_id})`
  }

  if (classItem.class_teacher_id) {
    return `Assigned (${classItem.class_teacher_id})`
  }

  return 'Not assigned'
}
</script>
