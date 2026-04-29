<template>
  <div class="space-y-6">
    <SectionCard title="Subjects" subtitle="Manage subjects and teacher assignments.">
      <template #header>
        <div class="flex gap-3">
          <AppButton 
            v-if="!isSelectMode" 
            @click="openModal()" 
            :icon="Plus" 
            text="Create Subject" 
            variant="primary" 
          />
          <AppButton 
            v-if="isSelectMode" 
            @click="cancelSelectMode()" 
            text="Cancel Select" 
            variant="outline" 
          />
          <AppButton 
            v-if="selectedSubjects.size > 0" 
            @click="deleteSelected()" 
            text="Delete Selected" 
            variant="danger" 
          />
          <AppButton 
            v-if="!isSelectMode" 
            @click="startSelectMode()" 
            text="Select" 
            variant="secondary" 
          />
        </div>
      </template>
      <SkeletonRows v-if="subjectsStore.loading" :columns="5" />
      <div v-else class="overflow-hidden rounded-[24px] border border-slate-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th v-if="isSelectMode" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <input 
                    type="checkbox" 
                    @change="toggleSelectAll($event.target.checked)"
                    :checked="areAllSelected"
                    class="rounded border-slate-300"
                  />
                </th>
                <th v-for="heading in headings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ heading }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="subject in paginatedSubjects" :key="subject.id" class="transition hover:bg-slate-50/80">
                <td v-if="isSelectMode" class="px-5 py-4">
                  <input 
                    type="checkbox" 
                    :checked="selectedSubjects.has(subject.id)"
                    @change="toggleItemSelection(subject.id, $event.target.checked)"
                    class="rounded border-slate-300"
                  />
                </td>
                <td class="px-5 py-4 font-semibold text-slate-900">{{ subject.name }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ subject.code || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ formatClassLevels(subject) }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ formatAssignedTeachers(subject) }}</td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <AppButton text="Edit" @click="openModal(subject)" variant="outline" size="xs" />
                    <AppButton text="Assign Teacher" @click="$router.push(`/school-admin/subjects/${subject.id}/assign-teacher`)" variant="warning" size="xs" />
                    <AppButton 
                      text="Delete" 
                      @click="deleteSubject(subject.id)" 
                      variant="danger" 
                      size="xs"
                      loadingText="Deleting..."
                      :processing="deleteLoading.has(subject.id)"
                      :disabled="deleteLoading.has(subject.id) || isSelectMode"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Pagination Controls -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-5 py-4 bg-white border-t border-slate-200">
        <div class="text-sm text-slate-600">
          Showing {{ ((currentPage - 1) * itemsPerPage) + 1 }} to {{ Math.min(currentPage * itemsPerPage, subjectsStore.subjects.length) }} of {{ subjectsStore.subjects.length }} subjects
        </div>
        <div class="flex gap-2">
          <AppButton 
            @click="previousPage" 
            text="Previous"
            :disabled="!hasPreviousPage"
            variant="outline"
            size="sm"
          />
          
          <span class="flex items-center gap-1">
            <AppButton 
              v-for="page in totalPages" 
              :key="page"
              @click="goToPage(page)"
              :text="page.toString()"
              :variant="page === currentPage ? 'primary' : 'outline'"
              size="sm"
              rounded="md"
            />
          </span>
          
          <AppButton 
            @click="nextPage" 
            text="Next"
            :disabled="!hasNextPage"
            variant="outline"
            size="sm"
          />
        </div>
      </div>
    </SectionCard>

    <SubjectModal 
      :show="showModal" 
      :subject="selectedSubject"
      @close="closeModal"
      @submit="submitSubject"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, reactive } from 'vue'
import { Plus } from 'lucide-vue-next'
import FormField from '../components/FormField.vue'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import AppButton from '../../shared/AppButton.vue'
import SubjectModal from '../components/SubjectModal.vue'
import TagMultiSelect from '../components/TagMultiSelect.vue'
import { useSchoolAdminSubjectsStore } from '../stores/subjects'
import { useSchoolAdminUiStore } from '../stores/ui'

const headings = ['Subject Name', 'Code', 'Class Levels', 'Assigned Teachers', 'Actions']
const subjectsStore = useSchoolAdminSubjectsStore()
const uiStore = useSchoolAdminUiStore()

// Multi-select state
const isSelectMode = ref(false)
const selectedSubjects = ref(new Set())

// Modal state
const showModal = ref(false)
const selectedSubject = ref(null)

// Loading states
const deleteLoading = ref(new Set())

// Computed properties for multi-select
const areAllSelected = computed(() => {
  return subjectsStore.subjects.length > 0 && 
         subjectsStore.subjects.every(subject => selectedSubjects.value.has(subject.id))
})

const hasAnySelected = computed(() => selectedSubjects.value.size > 0)

// Form state
const form = reactive({ id: null, name: '', code: '', class_level_ids: [] })
const errors = reactive({ name: '', code: '', class_level_ids: '' })

// Pagination state
const currentPage = ref(1)
const itemsPerPage = 10


const formatClassLevels = (subject) => {
  if (!subject.class_levels || !Array.isArray(subject.class_levels)) {
    return '-'
  }
  
  return subject.class_levels.map(classLevel => classLevel.name).join(' | ')
}

const formatAssignedTeachers = (subject) => {
  if (!subject.teacher_assignments || !Array.isArray(subject.teacher_assignments)) {
    return '-'
  }
  
  const teacherNames = subject.teacher_assignments
    .map(assignment => {
      if (assignment.user && assignment.user.first_name && assignment.user.last_name) {
        return `${assignment.user.first_name} ${assignment.user.last_name}`.trim()
      }
      return null
    })
    .filter(Boolean)
  
  return teacherNames.length > 0 ? teacherNames.join(', ') : '-'
}

// Pagination computed properties
const paginatedSubjects = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return subjectsStore.subjects.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(subjectsStore.subjects.length / itemsPerPage)
})

const hasNextPage = computed(() => {
  return currentPage.value < totalPages.value
})

const hasPreviousPage = computed(() => {
  return currentPage.value > 1
})

onMounted(async () => {
  try {
    await subjectsStore.fetchSubjects()
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to load subjects. Please check your connection.', variant: 'error' })
  }
})

const closeModal = () => {
  showModal.value = false
  selectedSubject.value = null
}

const openModal = (subject) => {
  selectedSubject.value = subject
  showModal.value = true
}

const validate = () => {
  errors.name = form.name ? '' : 'Subject name is required.'
  errors.code = form.code ? '' : 'Subject code is required.'
  errors.class_level_ids = form.class_level_ids.length === 0 ? 'At least one class level is required.' : ''
  return !errors.name && !errors.code && !errors.class_level_ids
}

// Multi-select functionality
const startSelectMode = () => {
  isSelectMode.value = true
  selectedSubjects.value.clear()
}

const cancelSelectMode = () => {
  isSelectMode.value = false
  selectedSubjects.value.clear()
}

const toggleSelectAll = (checked) => {
  if (checked) {
    subjectsStore.subjects.forEach(subject => {
      selectedSubjects.value.add(subject.id)
    })
  } else {
    selectedSubjects.value.clear()
  }
}

const toggleItemSelection = (id, checked) => {
  if (checked) {
    selectedSubjects.value.add(id)
  } else {
    selectedSubjects.value.delete(id)
  }
}

const deleteSelected = async () => {
  if (!confirm(`Are you sure you want to delete ${selectedSubjects.value.size} selected subject(s)? This action cannot be undone.`)) {
    return
  }

  try {
    for (const id of selectedSubjects.value) {
      deleteLoading.value.add(id)
    }
    
    for (const id of selectedSubjects.value) {
      await subjectsStore.deleteSubject(id)
    }
    
    selectedSubjects.value.clear()
    isSelectMode.value = false
    uiStore.addToast({ 
      title: 'Subjects Deleted', 
      message: `${selectedSubjects.value.size} subject(s) have been deleted successfully.`, 
      variant: 'success' 
    })
  } catch (error) {
    uiStore.addToast({ 
      title: 'Error', 
      message: 'Failed to delete selected subjects.', 
      variant: 'error' 
    })
  } finally {
    // Clear all loading states
    deleteLoading.value.clear()
  }
}

const submitSubject = async (subjectData) => {
  try {
    const payload = {
      name: subjectData.name,
      code: subjectData.code,
      class_level_ids: subjectData.class_level_ids
    }
    
    if (subjectData.id) {
      await subjectsStore.updateSubject(subjectData.id, payload)
    } else {
      await subjectsStore.createSubject(payload)
    }
    
    uiStore.addToast({ title: 'Subject saved', message: 'Subject has been saved successfully.', variant: 'success' })
    // Close modal after a short delay to ensure toast is visible
    setTimeout(() => {
      closeModal()
    }, 100)
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to save subject.', variant: 'error' })
    // Close modal after error toast as well
    setTimeout(() => {
      closeModal()
    }, 100)
  }
}

// Pagination functions
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const nextPage = () => {
  if (hasNextPage.value) {
    currentPage.value++
  }
}

const previousPage = () => {
  if (hasPreviousPage.value) {
    currentPage.value--
  }
}

const deleteSubject = async (id) => {
  if (!confirm('Are you sure you want to delete this subject? This action cannot be undone.')) {
    return
  }
  
  // Create new Set to trigger reactivity
  deleteLoading.value = new Set([...deleteLoading.value, id])
  
  try {
    await subjectsStore.deleteSubject(id)
    uiStore.addToast({ title: 'Subject deleted', message: 'Subject has been deleted.', variant: 'success' })
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to delete subject.', variant: 'error' })
  } finally {
    // Create new Set to trigger reactivity
    deleteLoading.value = new Set([...deleteLoading.value].filter(loadingId => loadingId !== id))
  }
}
</script>
