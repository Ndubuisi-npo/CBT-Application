<template>
  <div class="space-y-6">
    <SectionCard v-if="!showArchived" title="Students" subtitle="Manage student records, enrollment, academic progress, and class assignments.">
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
              title="Search students"
              aria-label="Search students"
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
                placeholder="Search students..."
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
            :text="isSearchExpanded ? '' : 'Create Student'"
            variant="primary"
            size="base"
            class="shrink-0 whitespace-nowrap"
            title="Create student"
            aria-label="Create student"
          />
          <AppButton
            v-if="!isSelectMode"
            @click="goToImport"
            :icon="UploadCloud"
            :text="isSearchExpanded ? '' : 'Import Students'"
            variant="outline"
            size="base"
            class="shrink-0 whitespace-nowrap"
            title="Import students"
            aria-label="Import students"
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
            title="Select students"
            aria-label="Select students"
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
            v-if="selectedStudents.size > 0"
            @click="revokeSelectedStudents"
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
      <SkeletonRows v-if="studentsStore.loading" :columns="5" />
      <div v-else-if="filteredStudents.length === 0" class="rounded-[24px] border border-slate-200 bg-white p-12 text-center">
        <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
          <GraduationCap class="h-12 w-12 text-slate-400" />
        </div>
        <h3 class="mt-6 text-xl font-semibold text-slate-900">{{ searchQuery ? 'No Students Found' : 'No Students' }}</h3>
        <p class="mt-2 text-slate-600">
          {{ searchQuery ? 'No students match your search criteria.' : 'Get started by adding your first student to manage your school enrollment.' }}
        </p>
        <div class="mt-8">
          <AppButton v-if="!searchQuery" @click="openModal()" :icon="Plus" text="Add Your First Student" variant="primary" size="lg" />
          <AppButton v-else @click="clearSearch" text="Clear Search" variant="outline" size="lg" />
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
                    :checked="areAllVisibleStudentsSelected"
                    class="rounded border-slate-300"
                    @change="toggleVisibleStudents($event.target.checked)"
                  />
                </th>
                <th v-for="heading in headings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ heading }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="student in paginatedStudents" :key="student.id" class="transition hover:bg-slate-50/80">
                <td v-if="isSelectMode" class="px-5 py-4">
                  <input
                    type="checkbox"
                    :checked="selectedStudents.has(student.id)"
                    class="rounded border-slate-300"
                    @change="toggleStudentSelection(student.id, $event.target.checked)"
                  />
                </td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student?.first_name || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student?.last_name || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student?.email || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student?.phone || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student.studentProfile?.admission_number || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student.studentProfile?.class_level?.name || student.student_profile?.class_name || '-' }}</td>
                <td class="px-5 py-4">
                  <div class="flex flex-wrap gap-2">
                    <AppButton text="View" @click="viewStudent(student)" variant="outline" size="xs" />
                    <AppButton text="Edit" @click="editStudent(student)" variant="outline" size="xs" />
                    <AppButton 
                      text="Revoke" 
                      @click="revokeStudent(student.id)" 
                      variant="warning" 
                      size="xs"
                      loadingText="Revoking..."
                      :processing="revokeLoading.has(student.id)"
                      :disabled="revokeLoading.has(student.id) || isSelectMode"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4">
          <div class="text-sm text-slate-600">
            Showing {{ studentsStartIndex }} to {{ studentsEndIndex }} of {{ filteredStudents.length }} students
          </div>
          <div class="flex items-center gap-2">
            <AppButton
              text="Previous"
              @click="previousStudentsPage"
              variant="outline"
              size="xs"
              :disabled="studentsPage === 1"
            />
            <div class="px-3 py-2 text-sm text-slate-600">Page {{ studentsPage }} of {{ studentsTotalPages }}</div>
            <AppButton
              text="Next"
              @click="nextStudentsPage"
              variant="outline"
              size="xs"
              :disabled="studentsPage === studentsTotalPages"
            />
          </div>
        </div>
      </div>
    </SectionCard>

    <SectionCard v-if="showArchived" title="Archived Students" subtitle="View and manage revoked students.">
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
            v-if="selectedArchivedStudents.size > 0"
            @click="restoreSelectedArchivedStudents"
            text="Restore Selected"
            variant="success"
            size="base"
            loadingText="Restoring..."
            :processing="isRestoringArchivedSelected"
            :disabled="isRestoringArchivedSelected || isDeletingArchivedSelected"
            class="shrink-0 whitespace-nowrap"
          />
          <AppButton
            v-if="selectedArchivedStudents.size > 0"
            @click="deleteSelectedArchivedStudents"
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
      <SkeletonRows v-if="studentsStore.loading" :columns="5" />
      <div v-else-if="studentsStore.archivedStudents.length === 0" class="text-center py-12">
        <div class="text-slate-400 text-lg">No students archived</div>
        <div class="text-slate-500 text-sm mt-2">Students will appear here when their privileges are revoked</div>
      </div>
      <div v-else class="overflow-hidden rounded-[24px] border border-slate-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th v-if="isArchivedSelectMode" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <input
                    type="checkbox"
                    :checked="areAllVisibleArchivedStudentsSelected"
                    class="rounded border-slate-300"
                    @change="toggleVisibleArchivedStudents($event.target.checked)"
                  />
                </th>
                <th v-for="heading in headings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ heading }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="student in paginatedArchivedStudents" :key="student.id" class="transition hover:bg-slate-50/80 opacity-60">
                <td v-if="isArchivedSelectMode" class="px-5 py-4">
                  <input
                    type="checkbox"
                    :checked="selectedArchivedStudents.has(student.id)"
                    class="rounded border-slate-300"
                    @change="toggleArchivedStudentSelection(student.id, $event.target.checked)"
                  />
                </td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student?.first_name || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student?.last_name || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student?.email || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student?.phone || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student.student_profile?.admission_number || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student.student_profile?.class_arm?.name || student.student_profile?.class_name || '-' }}</td>
                <td class="px-5 py-4">
                  <div class="flex flex-wrap gap-2">
                    <AppButton text="View" @click="viewStudent(student)" variant="outline" size="xs" />
                    <AppButton
                      text="Restore"
                      @click="restoreArchivedStudent(student.id)"
                      variant="success"
                      size="xs"
                      loadingText="Restoring..."
                      :processing="restoreLoading.has(student.id)"
                      :disabled="restoreLoading.has(student.id) || deleteLoading.has(student.id) || isArchivedSelectMode"
                    />
                    <AppButton
                      text="Delete"
                      @click="deleteArchivedStudent(student.id)"
                      variant="danger"
                      size="xs"
                      loadingText="Deleting..."
                      :processing="deleteLoading.has(student.id)"
                      :disabled="restoreLoading.has(student.id) || deleteLoading.has(student.id) || isArchivedSelectMode"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4">
          <div class="text-sm text-slate-600">
            Showing {{ archivedStudentsStartIndex }} to {{ archivedStudentsEndIndex }} of {{ studentsStore.archivedStudents.length }} archived students
          </div>
          <div class="flex items-center gap-2">
            <AppButton
              text="Previous"
              @click="previousArchivedStudentsPage"
              variant="outline"
              size="xs"
              :disabled="archivedStudentsPage === 1"
            />
            <div class="px-3 py-2 text-sm text-slate-600">
              Page {{ archivedStudentsPage }} of {{ archivedStudentsTotalPages }}
            </div>
            <AppButton
              text="Next"
              @click="nextArchivedStudentsPage"
              variant="outline"
              size="xs"
              :disabled="archivedStudentsPage === archivedStudentsTotalPages"
            />
          </div>
        </div>
      </div>
    </SectionCard>

    <StudentModal 
      :show="showModal" 
      :student="selectedStudent"
      :mode="modalMode"
      @close="closeModal"
      @submit="submitStudent"
    />
  </div>
</template>

<script setup>
import { nextTick, onMounted, reactive, computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Archive, CheckSquare, Plus, GraduationCap, Search, UploadCloud, X } from 'lucide-vue-next';
import FormField from "../components/FormField.vue";
import SectionCard from "../components/SectionCard.vue";
import SkeletonRows from "../components/SkeletonRows.vue";
import AppButton from '../../shared/AppButton.vue';
import StudentModal from '../components/StudentModal.vue'
import { useSchoolAdminStudentsStore } from "../stores/students";
import { useSchoolAdminUiStore } from "../stores/ui";

const router = useRouter();
const headings = [
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Admission Number",
    "Class",
    "Actions",
];
const studentsStore = useSchoolAdminStudentsStore();
const uiStore = useSchoolAdminUiStore();

// Modal state
const showModal = ref(false)
const selectedStudent = ref(null)
const modalMode = ref('edit')

// Loading states
const revokeLoading = ref(new Set())
const restoreLoading = ref(new Set())
const deleteLoading = ref(new Set())
const isRevokingSelected = ref(false)
const isRestoringArchivedSelected = ref(false)
const isDeletingArchivedSelected = ref(false)

// Multi-select state
const isSelectMode = ref(false)
const selectedStudents = ref(new Set())
const isArchivedSelectMode = ref(false)
const selectedArchivedStudents = ref(new Set())

// Pagination state
const itemsPerPage = 10
const studentsPage = ref(1)
const archivedStudentsPage = ref(1)

// Form state
const form = reactive({ id: null, firstName: '', lastName: '', email: '', phone: '', admissionNumber: '', className: '' })
const errors = reactive({ firstName: '', lastName: '', email: '', phone: '', admissionNumber: '', className: '' })

// Toggle state for active/archived view
const showArchived = ref(false);

// Search state
const searchQuery = ref('');
const isSearchExpanded = ref(false)
const searchInput = ref(null)

// Computed property to determine which students to show
const currentStudents = computed(() => {
  return showArchived.value ? studentsStore.archivedStudents : studentsStore.students;
});

const filteredStudents = computed(() => {
  if (!searchQuery.value.trim()) {
    return currentStudents.value
  }

  const query = searchQuery.value.toLowerCase().trim()
  return currentStudents.value.filter((student) => {
    const firstName = student?.first_name?.toLowerCase() || ''
    const lastName = student?.last_name?.toLowerCase() || ''
    const fullName = `${student?.first_name || ''} ${student?.last_name || ''}`.toLowerCase()
    const email = student?.email?.toLowerCase() || ''
    const phone = student?.phone?.toLowerCase() || ''
    const admissionNumber = student?.student_profile?.admission_number?.toLowerCase() || ''
    const className = (
      student?.student_profile?.class_arm?.name ||
      student?.student_profile?.class_name ||
      ''
    ).toLowerCase()

    return firstName.includes(query) ||
      lastName.includes(query) ||
      fullName.includes(query) ||
      email.includes(query) ||
      phone.includes(query) ||
      admissionNumber.includes(query) ||
      className.includes(query)
  })
})

const studentsTotalPages = computed(() => Math.max(1, Math.ceil(filteredStudents.value.length / itemsPerPage)))
const archivedStudentsTotalPages = computed(() => Math.max(1, Math.ceil(studentsStore.archivedStudents.length / itemsPerPage)))

const studentsStartIndex = computed(() => getStartIndex(studentsPage.value, filteredStudents.value.length))
const studentsEndIndex = computed(() => getEndIndex(studentsPage.value, filteredStudents.value.length))
const archivedStudentsStartIndex = computed(() => getStartIndex(archivedStudentsPage.value, studentsStore.archivedStudents.length))
const archivedStudentsEndIndex = computed(() => getEndIndex(archivedStudentsPage.value, studentsStore.archivedStudents.length))

const paginatedStudents = computed(() => paginate(filteredStudents.value, studentsPage.value))
const paginatedArchivedStudents = computed(() => paginate(studentsStore.archivedStudents, archivedStudentsPage.value))
const areAllVisibleStudentsSelected = computed(() => {
  return paginatedStudents.value.length > 0 && paginatedStudents.value.every((student) => selectedStudents.value.has(student.id))
})
const areAllVisibleArchivedStudentsSelected = computed(() => {
  return paginatedArchivedStudents.value.length > 0 && paginatedArchivedStudents.value.every((student) => selectedArchivedStudents.value.has(student.id))
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

const nextStudentsPage = () => {
  if (studentsPage.value < studentsTotalPages.value) studentsPage.value++
}

const previousStudentsPage = () => {
  if (studentsPage.value > 1) studentsPage.value--
}

const nextArchivedStudentsPage = () => {
  if (archivedStudentsPage.value < archivedStudentsTotalPages.value) archivedStudentsPage.value++
}

const previousArchivedStudentsPage = () => {
  if (archivedStudentsPage.value > 1) archivedStudentsPage.value--
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
  studentsPage.value = 1
  selectedStudents.value = new Set()
  selectedArchivedStudents.value = new Set()
})

watch(studentsTotalPages, (totalPages) => {
  if (studentsPage.value > totalPages) studentsPage.value = totalPages
})

watch(archivedStudentsTotalPages, (totalPages) => {
  if (archivedStudentsPage.value > totalPages) archivedStudentsPage.value = totalPages
})

watch(showArchived, () => {
  cancelSelectMode()
  cancelArchivedSelectMode()
})

const startSelectMode = () => {
  isSelectMode.value = true
  selectedStudents.value = new Set()
}

const cancelSelectMode = () => {
  isSelectMode.value = false
  selectedStudents.value = new Set()
}

const startArchivedSelectMode = () => {
  isArchivedSelectMode.value = true
  selectedArchivedStudents.value = new Set()
}

const cancelArchivedSelectMode = () => {
  isArchivedSelectMode.value = false
  selectedArchivedStudents.value = new Set()
}

const toggleVisibleStudents = (checked) => {
  const nextSelection = new Set(selectedStudents.value)

  paginatedStudents.value.forEach((student) => {
    if (checked) {
      nextSelection.add(student.id)
    } else {
      nextSelection.delete(student.id)
    }
  })

  selectedStudents.value = nextSelection
}

const toggleStudentSelection = (id, checked) => {
  const nextSelection = new Set(selectedStudents.value)

  if (checked) {
    nextSelection.add(id)
  } else {
    nextSelection.delete(id)
  }

  selectedStudents.value = nextSelection
}

const toggleVisibleArchivedStudents = (checked) => {
  const nextSelection = new Set(selectedArchivedStudents.value)

  paginatedArchivedStudents.value.forEach((student) => {
    if (checked) {
      nextSelection.add(student.id)
    } else {
      nextSelection.delete(student.id)
    }
  })

  selectedArchivedStudents.value = nextSelection
}

const toggleArchivedStudentSelection = (id, checked) => {
  const nextSelection = new Set(selectedArchivedStudents.value)

  if (checked) {
    nextSelection.add(id)
  } else {
    nextSelection.delete(id)
  }

  selectedArchivedStudents.value = nextSelection
}

const revokeSelectedStudents = async () => {
  const selectedCount = selectedStudents.value.size
  const selectedIds = Array.from(selectedStudents.value)

  if (!confirm(`Are you sure you want to revoke ${selectedCount} selected student(s)? This will move them to the archived section.`)) {
    return
  }

  isRevokingSelected.value = true
  revokeLoading.value = new Set([...revokeLoading.value, ...selectedIds])

  try {
    for (const id of selectedIds) {
      await studentsStore.revokeStudent(id)
    }

    selectedStudents.value = new Set()
    isSelectMode.value = false
    uiStore.addToast({
      title: 'Students revoked',
      message: `${selectedCount} student(s) have been revoked and moved to archive.`,
      variant: 'success',
    })
  } catch (error) {
    uiStore.addToast({
      title: 'Error',
      message: error.message || 'Failed to revoke selected students.',
      variant: 'error',
    })
  } finally {
    revokeLoading.value = new Set([...revokeLoading.value].filter((loadingId) => !selectedIds.includes(loadingId)))
    isRevokingSelected.value = false
  }
}

const restoreSelectedArchivedStudents = async () => {
  const selectedCount = selectedArchivedStudents.value.size
  const selectedIds = Array.from(selectedArchivedStudents.value)

  if (!confirm(`Are you sure you want to restore ${selectedCount} selected student(s)?`)) {
    return
  }

  isRestoringArchivedSelected.value = true
  restoreLoading.value = new Set([...restoreLoading.value, ...selectedIds])

  try {
    for (const id of selectedIds) {
      await studentsStore.restoreStudent(id)
    }

    selectedArchivedStudents.value = new Set()
    isArchivedSelectMode.value = false
    uiStore.addToast({
      title: 'Students restored',
      message: `${selectedCount} student(s) have been restored successfully.`,
      variant: 'success',
    })
  } catch (error) {
    uiStore.addToast({
      title: 'Error',
      message: error.message || 'Failed to restore selected students.',
      variant: 'error',
    })
  } finally {
    restoreLoading.value = new Set([...restoreLoading.value].filter((loadingId) => !selectedIds.includes(loadingId)))
    isRestoringArchivedSelected.value = false
  }
}

const deleteSelectedArchivedStudents = async () => {
  const selectedCount = selectedArchivedStudents.value.size
  const selectedIds = Array.from(selectedArchivedStudents.value)

  if (!confirm(`Are you sure you want to permanently delete ${selectedCount} selected student(s)? This action cannot be undone.`)) {
    return
  }

  isDeletingArchivedSelected.value = true
  deleteLoading.value = new Set([...deleteLoading.value, ...selectedIds])

  try {
    for (const id of selectedIds) {
      await studentsStore.deleteStudentFromStore(id)
    }

    selectedArchivedStudents.value = new Set()
    isArchivedSelectMode.value = false
    uiStore.addToast({
      title: 'Students deleted',
      message: `${selectedCount} student(s) have been permanently deleted.`,
      variant: 'success',
    })
  } catch (error) {
    uiStore.addToast({
      title: 'Error',
      message: error.message || 'Failed to delete selected students.',
      variant: 'error',
    })
  } finally {
    deleteLoading.value = new Set([...deleteLoading.value].filter((loadingId) => !selectedIds.includes(loadingId)))
    isDeletingArchivedSelected.value = false
  }
}

const closeModal = () => {
  showModal.value = false
  selectedStudent.value = null
  modalMode.value = 'edit'
}

const openModal = (student) => {
  selectedStudent.value = student
  modalMode.value = 'edit'
  showModal.value = true
}

const viewStudent = (student) => {
  selectedStudent.value = student
  modalMode.value = 'view'
  showModal.value = true
}

const goToImport = () => {
  router.push('/school-admin/students/import')
}

const clearSearch = () => {
  searchQuery.value = ''
}

const validate = () => {
  errors.firstName = form.firstName ? '' : 'First name is required.'
  errors.lastName = form.lastName ? '' : 'Last name is required.'
  errors.email = form.email ? '' : 'Email is required.'
  errors.phone = form.phone ? '' : 'Phone is required.'
  errors.admissionNumber = form.admissionNumber ? '' : 'Admission number is required.'
  errors.className = form.className ? '' : 'Class is required.'
  return !errors.firstName && !errors.lastName && !errors.email && !errors.phone && !errors.admissionNumber && !errors.className
}

const submit = async () => {
  if (!validate()) return
  const savedStudent = await studentsStore.saveStudent({ ...form })
  uiStore.addToast({ title: 'Student saved', message: 'Student configuration was updated.', variant: 'success' })
  Object.assign(form, { id: null, firstName: '', lastName: '', email: '', phone: '', admissionNumber: '', className: '' })
}

const editStudent = (student) => {
  selectedStudent.value = student
  showModal.value = true
}

const submitStudent = async (studentData) => {
  try {
    const payload = {
      first_name: studentData.first_name,
      last_name: studentData.last_name,
      email: studentData.email,
      phone: studentData.phone,
      admission_number: studentData.admission_number,
      class_level_id: studentData.class_level_id,
      class_arm_id: studentData.class_arm_id,
      class_name: studentData.class_name
    }
    
    if (studentData.id) {
      await studentsStore.updateStudent(studentData.id, payload)
    } else {
      await studentsStore.createStudent({
        ...payload,
        password: 'Cbt@2026'
      })
    }
    
    uiStore.addToast({ title: 'Student saved', message: 'Student has been saved successfully.', variant: 'success' })
    // Close modal after a short delay to ensure toast is visible
    setTimeout(() => {
      closeModal()
    }, 100)
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to save student.', variant: 'error' })
    // Close modal after error toast as well
    setTimeout(() => {
      closeModal()
    }, 100)
  }
}

const toggleView = () => {
  showArchived.value = !showArchived.value;
  studentsPage.value = 1
  archivedStudentsPage.value = 1
  cancelSelectMode()
  if (showArchived.value) {
    studentsStore.fetchArchivedStudents();
  }
};

const revokeStudent = async (id) => {
    if (
        !confirm(
            "Are you sure you want to revoke this student's privileges? This will move them to the archived section.",
        )
    ) {
        return;
    }

    revokeLoading.value = new Set([...revokeLoading.value, id])

    try {
        await studentsStore.revokeStudent(id);
        uiStore.addToast({
            title: "Student revoked",
            message: "Student privileges have been revoked and moved to archive.",
            variant: "success",
        });
    } catch (error) {
        uiStore.addToast({
            title: "Error",
            message: error.message || "Failed to revoke student.",
            variant: "error",
        });
    } finally {
        revokeLoading.value = new Set([...revokeLoading.value].filter(loadingId => loadingId !== id))
    }
};

const restoreArchivedStudent = async (id) => {
    if (!confirm("Are you sure you want to restore this student?")) {
        return;
    }

    restoreLoading.value = new Set([...restoreLoading.value, id])

    try {
        await studentsStore.restoreStudent(id);
        uiStore.addToast({
            title: "Student restored",
            message: "Student has been restored successfully.",
            variant: "success",
        });
    } catch (error) {
        uiStore.addToast({
            title: "Error",
            message: error.message || "Failed to restore student.",
            variant: "error",
        });
    } finally {
        restoreLoading.value = new Set([...restoreLoading.value].filter(loadingId => loadingId !== id))
    }
};

const deleteArchivedStudent = async (id) => {
    if (!confirm("Are you sure you want to permanently delete this student? This action cannot be undone.")) {
        return;
    }

    deleteLoading.value = new Set([...deleteLoading.value, id])

    try {
        await studentsStore.deleteStudentFromStore(id);
        uiStore.addToast({
            title: "Student deleted",
            message: "Student has been permanently deleted.",
            variant: "success",
        });
    } catch (error) {
        uiStore.addToast({
            title: "Error",
            message: error.message || "Failed to delete student.",
            variant: "error",
        });
    } finally {
        deleteLoading.value = new Set([...deleteLoading.value].filter(loadingId => loadingId !== id))
    }
};

const resetForm = () => {
  Object.assign(form, { id: null, firstName: '', lastName: '', email: '', phone: '', admissionNumber: '', className: '' });
  Object.assign(errors, { firstName: '', lastName: '', email: '', phone: '', admissionNumber: '', className: '' });
};

onMounted(() => {
    studentsStore.fetchStudents();
});
</script>
