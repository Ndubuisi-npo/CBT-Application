<template>
  <div class="space-y-6">
    <SectionCard title="Arms" subtitle="Manage class arms (e.g., JSS 1A, JSS 1B).">
      <template #header>
        <AppButton @click="openModal()" :icon="Plus" text="Create" variant="primary" size="sm" />
      </template>
      <SkeletonRows v-if="classArmsStore.loading" :columns="3" class="hidden lg:block" />
      <div v-if="classArmsStore.loading" class="grid gap-3 sm:grid-cols-2 lg:hidden">
        <div v-for="i in 4" :key="i" class="h-28 animate-pulse rounded-2xl bg-slate-100" />
      </div>

      <AppEmptyState
        v-else-if="classArmsStore.classArms.length === 0"
        :icon="LayoutGrid"
        title="No arms created"
        description="Get started by creating your first class."
      />

      <template v-else>
        <!-- Desktop table -->
        <div class="hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 bg-white">
              <thead class="bg-slate-50">
                <tr>
                  <th v-for="heading in headings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ heading }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="classArm in classArmsStore.classArms" :key="classArm.id" class="group transition hover:bg-slate-50/80">
                  <td class="px-5 py-4 font-semibold text-slate-900">{{ classArm.name }}</td>
                  <td class="px-5 py-4 text-sm text-slate-600">{{ getAssignedTeacher(classArm) }}</td>
                  <td class="px-5 py-4">
                    <ResponsiveTableActions :actions="classArmActions(classArm)" :entity-label="classArm.name" always-visible />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Tablet & mobile cards -->
        <div class="grid gap-3 sm:grid-cols-2 lg:hidden">
          <ResponsiveDataCard
            v-for="classArm in classArmsStore.classArms"
            :key="classArm.id"
            avatar-color="bg-slate-100 text-slate-600"
            :avatar-text="(classArm.name || '?').slice(0, 2).toUpperCase()"
            :title="classArm.name"
            :fields="[{ label: 'Teacher', value: getAssignedTeacher(classArm), span: 2 }]"
          >
            <template #actions>
              <ResponsiveTableActions :actions="classArmActions(classArm)" :entity-label="classArm.name" always-visible />
            </template>
          </ResponsiveDataCard>
        </div>
      </template>
    </SectionCard>

    <ClassArmFormDrawer
      :show="showModal"
      :class-item="selectedClass"
      :class-level-name="classLevelName"
      :saving="savingClass"
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
import { LayoutGrid, Pencil, Trash2, UserCog } from 'lucide-vue-next'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import AppButton from '../../shared/AppButton.vue'
import AppEmptyState from '../../shared/AppEmptyState.vue'
import ResponsiveTableActions from '../../shared/ResponsiveTableActions.vue'
import ResponsiveDataCard from '../../shared/ResponsiveDataCard.vue'
import ClassArmFormDrawer from '../components/ClassArmFormDrawer.vue'
import AssignTeacherModal from '../components/AssignTeacherModal.vue'
import { Plus } from 'lucide-vue-next'
import { useSchoolAdminClassArmsStore } from '../stores/classArms'
import { useSchoolAdminClassLevelsStore } from '../stores/classLevels'
import { useSchoolAdminUiStore } from '../stores/ui'
import { isNameTakenError } from '../../../js/lib/api'

const route = useRoute()
const headings = ['Class Arm Name', 'Teacher', 'Actions']
const classArmsStore = useSchoolAdminClassArmsStore()
const classLevelsStore = useSchoolAdminClassLevelsStore()
const uiStore = useSchoolAdminUiStore()

const classLevelId = computed(() => route.params.id)
const currentClassLevel = computed(() => classLevelsStore.classLevels.find(level => String(level.id) === String(classLevelId.value)))
const classLevelName = computed(() => currentClassLevel.value?.name || '')

// Modal state
const showModal = ref(false)
const selectedClass = ref(null)
const savingClass = ref(false)
const showAssignTeacherModal = ref(false)

// Loading states
const deleteLoading = ref(new Set())

const classArmActions = (classArm) => [
  { key: 'edit', label: 'Edit', icon: Pencil, onClick: () => editClass(classArm) },
  { key: 'assign', label: 'Assign Teacher', icon: UserCog, onClick: () => openAssignTeacherModal(classArm) },
  {
    key: 'delete',
    label: 'Delete',
    icon: Trash2,
    variant: 'danger',
    loading: deleteLoading.value.has(classArm.id),
    loadingLabel: 'Deleting…',
    onClick: () => deleteClass(classArm.id),
  },
]

onMounted(async () => {
  try {
    if (!classLevelsStore.classLevels.length) {
      await classLevelsStore.fetchClassLevels()
    }

    if (classLevelId.value) {
      await classArmsStore.fetchClassArms(classLevelId.value)
    }
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to load data. Please check your connection.', variant: 'error' })
  }
})

watch(() => classLevelId.value, async (newId) => {
  if (newId) {
    if (!classLevelsStore.classLevels.length) {
      await classLevelsStore.fetchClassLevels()
    }
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
  savingClass.value = true
  try {
    if (classData.id) {
      await classArmsStore.saveClassArm(classLevelId.value, { id: classData.id, name: classData.name })
      uiStore.addToast({ title: 'Class updated', message: 'Class has been updated.', variant: 'success' })
    } else {
      await classArmsStore.saveClassArm(classLevelId.value, { name: classData.name })
      uiStore.addToast({ title: 'Class created', message: 'Class has been created.', variant: 'success' })
    }
    closeModal()
    await classArmsStore.fetchClassArms(classLevelId.value)
  } catch (error) {
    if (isNameTakenError(error)) {
      uiStore.addToast({ title: 'Name taken', message: 'Name has already been taken.', variant: 'error' })
    } else {
      uiStore.addToast({ title: 'Error', message: error.message || 'Failed to save class.', variant: 'error' })
    }
  } finally {
    savingClass.value = false
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
  const teacher = classItem.assignedTeacher || classItem.teacher

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
