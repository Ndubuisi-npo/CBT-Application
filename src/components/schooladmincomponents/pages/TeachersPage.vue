<template>
  <div class="space-y-6">
    <SectionCard v-if="!showArchived" title="Teachers" subtitle="Manage staff records, contacts, department ownership, and class/subject assignments.">
      <template #header>
        <div class="flex w-full min-w-0 flex-nowrap items-center justify-end gap-2 overflow-x-auto pb-1">
          <div
            class="overflow-hidden transition-all duration-300 ease-out"
            :class="isSearchExpanded ? 'min-w-[180px] flex-1' : 'w-11 flex-none'"
          >
            <button
              v-if="!isSearchExpanded"
              type="button"
              class="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2"
              title="Search teachers"
              aria-label="Search teachers"
              @click="expandSearch"
            >
              <Search class="h-4 w-4" />
            </button>
            <div v-else class="relative">
              <Search class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input 
                ref="searchInput"
                v-model="searchQuery" 
                type="text" 
                class="h-11 w-full rounded-lg border-2 border-[#0B1F3A] bg-white py-2 pl-12 pr-11 text-sm text-slate-900 placeholder:text-slate-500 transition-colors duration-200 focus:border-[#D4AF37] focus:outline-none focus:ring-0" 
                placeholder="Search teachers..."
                @keydown.esc="collapseSearch"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                title="Close search"
                aria-label="Close search"
                @click="collapseSearch"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
          </div>
          <AppButton
            v-if="!isSelectMode"
            @click="openModal()"
            :icon="Plus"
            :text="isSearchExpanded ? '' : 'Create Teacher'"
            variant="primary"
            size="base"
            class="shrink-0 whitespace-nowrap"
            title="Create teacher"
            aria-label="Create teacher"
          />
          <AppButton
            v-if="!isSelectMode"
            @click="goToImport"
            :icon="UploadCloud"
            :text="isSearchExpanded ? '' : 'Import Teachers'"
            variant="outline"
            size="base"
            class="shrink-0 whitespace-nowrap"
            title="Import teachers"
            aria-label="Import teachers"
          />
          <AppButton 
            v-if="!isSelectMode"
            @click="toggleView" 
            :icon="Archive"
            :text="isSearchExpanded ? '' : 'Show Archived'"
            variant="outline"
            size="base"
            class="shrink-0 whitespace-nowrap"
            title="Show archived"
            aria-label="Show archived"
          />
          <AppButton
            v-if="!isSelectMode"
            @click="startSelectMode"
            :icon="CheckSquare"
            :text="isSearchExpanded ? '' : 'Select'"
            variant="secondary"
            size="base"
            class="shrink-0 whitespace-nowrap"
            title="Select teachers"
            aria-label="Select teachers"
          />
          <AppButton
            v-if="isSelectMode"
            @click="cancelSelectMode"
            text="Cancel Select"
            variant="outline"
            size="base"
            class="shrink-0 whitespace-nowrap"
          />
          <AppButton
            v-if="selectedTeachers.size > 0"
            @click="revokeSelectedTeachers"
            text="Revoke Selected"
            variant="warning"
            size="base"
            loadingText="Revoking..."
            :processing="isRevokingSelected"
            :disabled="isRevokingSelected"
            class="shrink-0 whitespace-nowrap"
          />
          
        </div>
      </template>
      <SkeletonRows v-if="teachersStore.loading" :columns="5" />
      <div v-else-if="filteredTeachers.length === 0" class="rounded-[24px] border border-slate-200 bg-white p-12 text-center">
        <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
          <Users class="h-12 w-12 text-slate-400" />
        </div>
        <h3 class="mt-6 text-xl font-semibold text-slate-900">No Teachers Found</h3>
        <p class="mt-2 text-slate-600">
          {{ searchQuery ? 'No teachers match your search criteria.' : 'Get started by adding your first teacher to manage your school staff.' }}
        </p>
        <div class="mt-8">
          <AppButton 
            v-if="!searchQuery" 
            @click="openModal()" 
            :icon="Plus" 
            text="Add Your First Teacher" 
            variant="primary" 
            size="lg" 
          />
          <AppButton 
            v-else 
            @click="clearSearch" 
            text="Clear Search" 
            variant="outline" 
            size="lg" 
          />
        </div>
      </div>
      <div v-else class="overflow-hidden rounded-[24px] border border-slate-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th v-if="isSelectMode" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <input
                    type="checkbox"
                    :checked="areAllVisibleTeachersSelected"
                    class="rounded border-slate-300"
                    @change="toggleVisibleTeachers($event.target.checked)"
                  />
                </th>
                <th v-for="heading in activeHeadings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ heading }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="teacher in paginatedTeachers" :key="teacher.id" class="transition hover:bg-slate-50/80">
                <td v-if="isSelectMode" class="px-5 py-4">
                  <input
                    type="checkbox"
                    :checked="selectedTeachers.has(teacher.id)"
                    class="rounded border-slate-300"
                    @change="toggleTeacherSelection(teacher.id, $event.target.checked)"
                  />
                </td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher?.teacherProfile?.staff_id || teacher?.teacher_profile?.staff_id || teacher?.staff_id || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher?.first_name }} {{ teacher?.last_name || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher?.email || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher?.phone || '-' }}</td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <AppButton text="View" @click="viewTeacher(teacher)" variant="outline" size="xs" />
                    <AppButton text="Edit" @click="editTeacher(teacher)" variant="outline" size="xs" />
                    <AppButton 
                      text="Revoke" 
                      @click="revokeTeacher(teacher.id)" 
                      variant="warning" 
                      size="xs"
                      loadingText="Revoking..."
                      :processing="revokeLoading.has(teacher.id)"
                      :disabled="revokeLoading.has(teacher.id) || isSelectMode"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4">
          <div class="text-sm text-slate-600">
            Showing {{ teachersStartIndex }} to {{ teachersEndIndex }} of {{ filteredTeachers.length }} teachers
          </div>
          <div class="flex items-center gap-2">
            <AppButton
              text="Previous"
              @click="previousTeachersPage"
              variant="outline"
              size="xs"
              :disabled="teachersPage === 1"
            />
            <div class="px-3 py-2 text-sm text-slate-600">Page {{ teachersPage }} of {{ teachersTotalPages }}</div>
            <AppButton
              text="Next"
              @click="nextTeachersPage"
              variant="outline"
              size="xs"
              :disabled="teachersPage === teachersTotalPages"
            />
          </div>
        </div>
      </div>
    </SectionCard>

    <SectionCard v-if="showArchived" title="Archived Teachers" subtitle="View and manage revoked teachers.">
      <template #header>
        <div class="flex w-full flex-wrap items-center justify-end gap-3">
          <AppButton
            v-if="!isArchivedSelectMode"
            @click="startArchivedSelectMode"
            :icon="CheckSquare"
            text="Select"
            variant="secondary"
            size="base"
            class="shrink-0 whitespace-nowrap"
          />
          <AppButton
            v-if="isArchivedSelectMode"
            @click="cancelArchivedSelectMode"
            text="Cancel Select"
            variant="outline"
            size="base"
            class="shrink-0 whitespace-nowrap"
          />
          <AppButton
            v-if="selectedArchivedTeachers.size > 0"
            @click="restoreSelectedArchivedTeachers"
            text="Restore Selected"
            variant="success"
            size="base"
            loadingText="Restoring..."
            :processing="isRestoringArchivedSelected"
            :disabled="isRestoringArchivedSelected || isDeletingArchivedSelected"
            class="shrink-0 whitespace-nowrap"
          />
          <AppButton
            v-if="selectedArchivedTeachers.size > 0"
            @click="deleteSelectedArchivedTeachers"
            text="Delete Selected"
            variant="danger"
            size="base"
            loadingText="Deleting..."
            :processing="isDeletingArchivedSelected"
            :disabled="isRestoringArchivedSelected || isDeletingArchivedSelected"
            class="shrink-0 whitespace-nowrap"
          />
          <AppButton 
            @click="toggleView" 
            text="Show Active"
            variant="success"
            size="sm"
          />
        </div>
      </template>
      <SkeletonRows v-if="teachersStore.loading" :columns="5" />
      <div v-else-if="teachersStore.archivedTeachers.length === 0" class="text-center py-12">
        <div class="text-slate-400 text-lg">No teachers archived</div>
        <div class="text-slate-500 text-sm mt-2">Teachers will appear here when their privileges are revoked</div>
      </div>
      <div v-else class="overflow-hidden rounded-[24px] border border-slate-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th v-if="isArchivedSelectMode" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <input
                    type="checkbox"
                    :checked="areAllVisibleArchivedTeachersSelected"
                    class="rounded border-slate-300"
                    @change="toggleVisibleArchivedTeachers($event.target.checked)"
                  />
                </th>
                <th v-for="heading in archivedHeadings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ heading }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="teacher in paginatedArchivedTeachers" :key="teacher.id" class="transition hover:bg-slate-50/80 opacity-60">
                <td v-if="isArchivedSelectMode" class="px-5 py-4">
                  <input
                    type="checkbox"
                    :checked="selectedArchivedTeachers.has(teacher.id)"
                    class="rounded border-slate-300"
                    @change="toggleArchivedTeacherSelection(teacher.id, $event.target.checked)"
                  />
                </td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher?.teacherProfile?.staff_id || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher?.first_name || '-' }} {{ teacher?.last_name || '' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher?.email || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher?.phone || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher.teacherProfile?.qualification || '-' }}</td>
                <td class="px-5 py-4">
                  <span class="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">Archived</span>
                </td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <AppButton
                      text="Restore"
                      @click="restoreArchivedTeacher(teacher.id)"
                      variant="success"
                      size="xs"
                      loadingText="Restoring..."
                      :processing="restoreLoading.has(teacher.id)"
                      :disabled="restoreLoading.has(teacher.id) || deleteLoading.has(teacher.id) || isArchivedSelectMode"
                    />
                    <AppButton
                      text="Delete"
                      @click="deleteArchivedTeacher(teacher.id)"
                      variant="danger"
                      size="xs"
                      loadingText="Deleting..."
                      :processing="deleteLoading.has(teacher.id)"
                      :disabled="restoreLoading.has(teacher.id) || deleteLoading.has(teacher.id) || isArchivedSelectMode"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4">
          <div class="text-sm text-slate-600">
            Showing {{ archivedTeachersStartIndex }} to {{ archivedTeachersEndIndex }} of {{ teachersStore.archivedTeachers.length }} archived teachers
          </div>
          <div class="flex items-center gap-2">
            <AppButton
              text="Previous"
              @click="previousArchivedTeachersPage"
              variant="outline"
              size="xs"
              :disabled="archivedTeachersPage === 1"
            />
            <div class="px-3 py-2 text-sm text-slate-600">
              Page {{ archivedTeachersPage }} of {{ archivedTeachersTotalPages }}
            </div>
            <AppButton
              text="Next"
              @click="nextArchivedTeachersPage"
              variant="outline"
              size="xs"
              :disabled="archivedTeachersPage === archivedTeachersTotalPages"
            />
          </div>
        </div>
      </div>
    </SectionCard>

    <TeacherModal 
      :show="showModal" 
      :teacher="selectedTeacher"
      :mode="modalMode"
      @close="closeModal"
      @submit="submitTeacher"
    />
  </div>
</template>

<script setup>
import { nextTick, onMounted, reactive, computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Archive, CheckSquare, Plus, Users, Search, UploadCloud, X } from 'lucide-vue-next';
import FormField from "../components/FormField.vue";
import SectionCard from "../components/SectionCard.vue";
import SkeletonRows from "../components/SkeletonRows.vue";
import AppButton from '../../shared/AppButton.vue';
import TeacherModal from '../components/TeacherModal.vue'
import { useSchoolAdminTeachersStore } from "../stores/teachers";
import { useSchoolAdminUiStore } from "../stores/ui";
import { isNameTakenError } from '../../../js/lib/api'

const activeHeadings = [
  "Staff ID",
  "Full Name",
  "Email",
  "Phone",
  "Actions",
];
const archivedHeadings = [
  "Staff ID",
  "Full Name",
  "Email",
  "Phone",
  "Qualification",
  "Status",
  "Actions",
];
const teachersStore = useSchoolAdminTeachersStore();
const uiStore = useSchoolAdminUiStore();
const router = useRouter();

// Modal state
const showModal = ref(false)
const selectedTeacher = ref(null)
const modalMode = ref('edit') // 'view' or 'edit'

// Loading states
const revokeLoading = ref(new Set())
const restoreLoading = ref(new Set())
const deleteLoading = ref(new Set())
const isRevokingSelected = ref(false)
const isRestoringArchivedSelected = ref(false)
const isDeletingArchivedSelected = ref(false)

// Multi-select state
const isSelectMode = ref(false)
const selectedTeachers = ref(new Set())
const isArchivedSelectMode = ref(false)
const selectedArchivedTeachers = ref(new Set())

// Pagination state
const itemsPerPage = 10
const teachersPage = ref(1)
const archivedTeachersPage = ref(1)

// Form state
const form = reactive({ id: null, firstName: '', lastName: '', email: '', phone: '', qualification: '', staffId: '' })
const errors = reactive({ firstName: '', lastName: '', email: '', phone: '', qualification: '', staffId: '' })

// Toggle state for active/archived view
const showArchived = ref(false);

// Search state
const searchQuery = ref('');
const isSearchExpanded = ref(false)
const searchInput = ref(null)

// Computed property to determine which teachers to show
const currentTeachers = computed(() => {
  return showArchived.value ? teachersStore.archivedTeachers : teachersStore.teachers;
});

// Computed property for filtered teachers
const filteredTeachers = computed(() => {
  if (!searchQuery.value.trim()) {
    return currentTeachers.value;
  }
  
  const query = searchQuery.value.toLowerCase().trim();
  return currentTeachers.value.filter(teacher => {
    // Search in staff ID
    const staffId = teacher?.teacher_profile?.staff_id?.toLowerCase() || '';
    
    // Search in full name
    const fullName = `${teacher?.first_name || ''} ${teacher?.last_name || ''}`.toLowerCase();
    
    // Search in email
    const email = teacher?.email?.toLowerCase() || '';
    
    // Search in phone
    const phone = teacher?.phone?.toLowerCase() || '';
    
    // Search in qualification
    const qualification = teacher?.teacher_profile?.qualification?.toLowerCase() || '';
    
    return staffId.includes(query) || 
           fullName.includes(query) || 
           email.includes(query) || 
           phone.includes(query) || 
           qualification.includes(query);
  });
});

const teachersTotalPages = computed(() => Math.max(1, Math.ceil(filteredTeachers.value.length / itemsPerPage)))
const archivedTeachersTotalPages = computed(() => Math.max(1, Math.ceil(teachersStore.archivedTeachers.length / itemsPerPage)))

const teachersStartIndex = computed(() => getStartIndex(teachersPage.value, filteredTeachers.value.length))
const teachersEndIndex = computed(() => getEndIndex(teachersPage.value, filteredTeachers.value.length))
const archivedTeachersStartIndex = computed(() => getStartIndex(archivedTeachersPage.value, teachersStore.archivedTeachers.length))
const archivedTeachersEndIndex = computed(() => getEndIndex(archivedTeachersPage.value, teachersStore.archivedTeachers.length))

const paginatedTeachers = computed(() => paginate(filteredTeachers.value, teachersPage.value))
const paginatedArchivedTeachers = computed(() => paginate(teachersStore.archivedTeachers, archivedTeachersPage.value))
const areAllVisibleTeachersSelected = computed(() => {
  return paginatedTeachers.value.length > 0 && paginatedTeachers.value.every((teacher) => selectedTeachers.value.has(teacher.id))
})
const areAllVisibleArchivedTeachersSelected = computed(() => {
  return paginatedArchivedTeachers.value.length > 0 && paginatedArchivedTeachers.value.every((teacher) => selectedArchivedTeachers.value.has(teacher.id))
})

const getStartIndex = (page, total) => {
  if (total === 0) return 0
  return (page - 1) * itemsPerPage + 1
}

const getEndIndex = (page, total) => Math.min(page * itemsPerPage, total)

const paginate = (items, page) => {
  const start = (page - 1) * itemsPerPage
  return items.slice(start, start + itemsPerPage)
}

const nextTeachersPage = () => {
  if (teachersPage.value < teachersTotalPages.value) teachersPage.value++
}

const previousTeachersPage = () => {
  if (teachersPage.value > 1) teachersPage.value--
}

const nextArchivedTeachersPage = () => {
  if (archivedTeachersPage.value < archivedTeachersTotalPages.value) archivedTeachersPage.value++
}

const previousArchivedTeachersPage = () => {
  if (archivedTeachersPage.value > 1) archivedTeachersPage.value--
}

const expandSearch = async () => {
  isSearchExpanded.value = true
  await nextTick()
  searchInput.value?.focus()
}

const collapseSearch = () => {
  if (searchQuery.value) {
    searchQuery.value = ''
    return
  }

  isSearchExpanded.value = false
}

watch(searchQuery, () => {
  teachersPage.value = 1
  selectedTeachers.value = new Set()
  selectedArchivedTeachers.value = new Set()
})

watch(teachersTotalPages, (totalPages) => {
  if (teachersPage.value > totalPages) teachersPage.value = totalPages
})

watch(archivedTeachersTotalPages, (totalPages) => {
  if (archivedTeachersPage.value > totalPages) archivedTeachersPage.value = totalPages
})

watch(showArchived, () => {
  cancelSelectMode()
  cancelArchivedSelectMode()
})

const startSelectMode = () => {
  isSelectMode.value = true
  selectedTeachers.value = new Set()
}

const cancelSelectMode = () => {
  isSelectMode.value = false
  selectedTeachers.value = new Set()
}

const startArchivedSelectMode = () => {
  isArchivedSelectMode.value = true
  selectedArchivedTeachers.value = new Set()
}

const cancelArchivedSelectMode = () => {
  isArchivedSelectMode.value = false
  selectedArchivedTeachers.value = new Set()
}

const toggleVisibleTeachers = (checked) => {
  const nextSelection = new Set(selectedTeachers.value)

  paginatedTeachers.value.forEach((teacher) => {
    if (checked) {
      nextSelection.add(teacher.id)
    } else {
      nextSelection.delete(teacher.id)
    }
  })

  selectedTeachers.value = nextSelection
}

const toggleTeacherSelection = (id, checked) => {
  const nextSelection = new Set(selectedTeachers.value)

  if (checked) {
    nextSelection.add(id)
  } else {
    nextSelection.delete(id)
  }

  selectedTeachers.value = nextSelection
}

const toggleVisibleArchivedTeachers = (checked) => {
  const nextSelection = new Set(selectedArchivedTeachers.value)

  paginatedArchivedTeachers.value.forEach((teacher) => {
    if (checked) {
      nextSelection.add(teacher.id)
    } else {
      nextSelection.delete(teacher.id)
    }
  })

  selectedArchivedTeachers.value = nextSelection
}

const toggleArchivedTeacherSelection = (id, checked) => {
  const nextSelection = new Set(selectedArchivedTeachers.value)

  if (checked) {
    nextSelection.add(id)
  } else {
    nextSelection.delete(id)
  }

  selectedArchivedTeachers.value = nextSelection
}

const revokeSelectedTeachers = async () => {
  const selectedCount = selectedTeachers.value.size
  const selectedIds = Array.from(selectedTeachers.value)

  if (!confirm(`Are you sure you want to revoke ${selectedCount} selected teacher(s)? This will move them to the archived section.`)) {
    return
  }

  isRevokingSelected.value = true
  revokeLoading.value = new Set([...revokeLoading.value, ...selectedIds])

  try {
    for (const id of selectedIds) {
      await teachersStore.revokeTeacher(id)
    }

    selectedTeachers.value = new Set()
    isSelectMode.value = false
    uiStore.addToast({
      title: 'Teachers revoked',
      message: `${selectedCount} teacher(s) have been revoked and moved to archive.`,
      variant: 'success',
    })
  } catch (error) {
    uiStore.addToast({
      title: 'Error',
      message: error.message || 'Failed to revoke selected teachers.',
      variant: 'error',
    })
  } finally {
    revokeLoading.value = new Set([...revokeLoading.value].filter((loadingId) => !selectedIds.includes(loadingId)))
    isRevokingSelected.value = false
  }
}

const restoreSelectedArchivedTeachers = async () => {
  const selectedCount = selectedArchivedTeachers.value.size
  const selectedIds = Array.from(selectedArchivedTeachers.value)

  if (!confirm(`Are you sure you want to restore ${selectedCount} selected teacher(s)?`)) {
    return
  }

  isRestoringArchivedSelected.value = true
  restoreLoading.value = new Set([...restoreLoading.value, ...selectedIds])

  try {
    for (const id of selectedIds) {
      await teachersStore.restoreTeacher(id)
    }

    selectedArchivedTeachers.value = new Set()
    isArchivedSelectMode.value = false
    uiStore.addToast({
      title: 'Teachers restored',
      message: `${selectedCount} teacher(s) have been restored successfully.`,
      variant: 'success',
    })
  } catch (error) {
    uiStore.addToast({
      title: 'Error',
      message: error.message || 'Failed to restore selected teachers.',
      variant: 'error',
    })
  } finally {
    restoreLoading.value = new Set([...restoreLoading.value].filter((loadingId) => !selectedIds.includes(loadingId)))
    isRestoringArchivedSelected.value = false
  }
}

const deleteSelectedArchivedTeachers = async () => {
  const selectedCount = selectedArchivedTeachers.value.size
  const selectedIds = Array.from(selectedArchivedTeachers.value)

  if (!confirm(`Are you sure you want to permanently delete ${selectedCount} selected teacher(s)? This action cannot be undone.`)) {
    return
  }

  isDeletingArchivedSelected.value = true
  deleteLoading.value = new Set([...deleteLoading.value, ...selectedIds])

  try {
    for (const id of selectedIds) {
      await teachersStore.deleteTeacherFromStore(id)
    }

    selectedArchivedTeachers.value = new Set()
    isArchivedSelectMode.value = false
    uiStore.addToast({
      title: 'Teachers deleted',
      message: `${selectedCount} teacher(s) have been permanently deleted.`,
      variant: 'success',
    })
  } catch (error) {
    uiStore.addToast({
      title: 'Error',
      message: error.message || 'Failed to delete selected teachers.',
      variant: 'error',
    })
  } finally {
    deleteLoading.value = new Set([...deleteLoading.value].filter((loadingId) => !selectedIds.includes(loadingId)))
    isDeletingArchivedSelected.value = false
  }
}

const clearSearch = () => {
  searchQuery.value = '';
};

const closeModal = () => {
  showModal.value = false
  selectedTeacher.value = null
  modalMode.value = 'edit'
}

const openModal = (teacher) => {
  selectedTeacher.value = teacher
  modalMode.value = 'edit'
  showModal.value = true
}

const goToImport = () => {
  router.push('/school-admin/teachers/import')
}

const validate = () => {
  errors.firstName = form.firstName ? '' : 'First name is required.'
  errors.lastName = form.lastName ? '' : 'Last name is required.'
  errors.email = form.email ? '' : 'Email is required.'
  errors.phone = form.phone ? '' : 'Phone is required.'
  errors.qualification = form.qualification ? '' : 'Qualification is required.'
  errors.staffId = form.staffId ? '' : 'Staff ID is required.'
  return !errors.firstName && !errors.lastName && !errors.email && !errors.phone && !errors.qualification && !errors.staffId
}

const submit = async () => {
  if (!validate()) return
  const savedTeacher = await teachersStore.saveTeacher({ ...form })
  uiStore.addToast({ title: 'Teacher saved', message: 'Teacher configuration was updated.', variant: 'success' })
  Object.assign(form, { id: null, firstName: '', lastName: '', email: '', phone: '', qualification: '', staffId: '' })
}

const editTeacher = (teacher) => {
  selectedTeacher.value = teacher
  modalMode.value = 'edit'
  showModal.value = true
}

const viewTeacher = (teacher) => {
  selectedTeacher.value = teacher
  modalMode.value = 'view'
  showModal.value = true
}

const submitTeacher = async (teacherData) => {
  try {
    const payload = {
      first_name: teacherData.first_name,
      last_name: teacherData.last_name,
      email: teacherData.email,
      phone: teacherData.phone,
      qualification: teacherData.qualification,
      staff_id: teacherData.staff_id
    }
    
    if (teacherData.id) {
      await teachersStore.updateTeacher(teacherData.id, payload)
    } else {
      await teachersStore.createTeacher({
        ...payload,
        password: 'teach12345'
      })
    }
    
    uiStore.addToast({ title: 'Teacher saved', message: 'Teacher has been saved successfully.', variant: 'success' })
    // Close modal after a short delay to ensure toast is visible
    setTimeout(() => {
      closeModal()
    }, 100)
  } catch (error) {
    if (isNameTakenError(error)) {
      uiStore.addToast({ title: 'Name taken', message: 'Name has already been taken.', variant: 'error' })
    } else {
      const message = error?.response?.data?.message || error?.message || 'Failed to save teacher.'
      uiStore.addToast({ title: 'Error', message, variant: 'error' })
    }
  }
}

const toggleView = () => {
  showArchived.value = !showArchived.value;
  teachersPage.value = 1
  archivedTeachersPage.value = 1
  cancelSelectMode()
  if (showArchived.value) {
    teachersStore.fetchArchivedTeachers();
  }
};

const revokeTeacher = async (id) => {
    if (
        !confirm(
            "Are you sure you want to revoke this teacher's privileges? This will move them to the archived section.",
        )
    ) {
        return;
    }

    revokeLoading.value = new Set([...revokeLoading.value, id])

    try {
        await teachersStore.revokeTeacher(id);
        uiStore.addToast({
            title: "Teacher revoked",
            message: "Teacher privileges have been revoked and moved to archive.",
            variant: "success",
        });
    } catch (error) {
        uiStore.addToast({
            title: "Error",
            message: error.message || "Failed to revoke teacher.",
            variant: "error",
        });
    } finally {
        revokeLoading.value = new Set([...revokeLoading.value].filter(loadingId => loadingId !== id))
    }
};

const restoreArchivedTeacher = async (id) => {
    if (!confirm("Are you sure you want to restore this teacher?")) {
        return;
    }

    restoreLoading.value = new Set([...restoreLoading.value, id])

    try {
        await teachersStore.restoreTeacher(id);
        uiStore.addToast({
            title: "Teacher restored",
            message: "Teacher has been restored successfully.",
            variant: "success",
        });
    } catch (error) {
        uiStore.addToast({
            title: "Error",
            message: error.message || "Failed to restore teacher.",
            variant: "error",
        });
    } finally {
        restoreLoading.value = new Set([...restoreLoading.value].filter(loadingId => loadingId !== id))
    }
};

const deleteArchivedTeacher = async (id) => {
    if (!confirm("Are you sure you want to permanently delete this teacher? This action cannot be undone.")) {
        return;
    }

    deleteLoading.value = new Set([...deleteLoading.value, id])

    try {
        await teachersStore.deleteTeacherFromStore(id);
        uiStore.addToast({
            title: "Teacher deleted",
            message: "Teacher has been permanently deleted.",
            variant: "success",
        });
    } catch (error) {
        uiStore.addToast({
            title: "Error",
            message: error.message || "Failed to delete teacher.",
            variant: "error",
        });
    } finally {
        deleteLoading.value = new Set([...deleteLoading.value].filter(loadingId => loadingId !== id))
    }
};

const resetForm = () => {
  Object.assign(form, { id: null, firstName: '', lastName: '', email: '', phone: '', qualification: '', staffId: '' });
  Object.assign(errors, { firstName: '', lastName: '', email: '', phone: '', qualification: '', staffId: '' });
};

onMounted(() => {
    teachersStore.fetchTeachers();
});
</script>
