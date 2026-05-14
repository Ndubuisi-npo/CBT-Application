<template>
  <div class="space-y-6">
    <SectionCard v-if="!showArchived" title="Teachers" subtitle="Manage staff records, contacts, department ownership, and class/subject assignments.">
      <template #header>
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex-1 min-w-[150px]">
            <div class="relative">
              <Search class="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                v-model="searchQuery" 
                type="text" 
                class="sa-input pl-12" 
                placeholder="Search teachers..."
                style="padding-left: 2.5rem;"
              />
            </div>
          </div>
          <AppButton v-if="!isSelectMode" @click="openModal()" :icon="Plus" text="Create Teacher" variant="primary" size="base" />
          <AppButton 
            v-if="!isSelectMode"
            @click="toggleView" 
            text="Show Archived"
            variant="outline"
            size="base"
          />
          <AppButton
            v-if="!isSelectMode"
            @click="startSelectMode"
            text="Select"
            variant="secondary"
            size="base"
          />
          <AppButton
            v-if="isSelectMode"
            @click="cancelSelectMode"
            text="Cancel Select"
            variant="outline"
            size="base"
          />
          <AppButton
            v-if="selectedTeachers.size > 0"
            @click="deleteSelectedTeachers"
            text="Delete Selected"
            variant="danger"
            size="base"
            loadingText="Deleting..."
            :processing="isDeletingSelected"
            :disabled="isDeletingSelected"
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
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher?.teacher_profile?.staff_id || '-' }}</td>
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
        <div class="flex flex-wrap items-center gap-3">
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
                <th v-for="heading in archivedHeadings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ heading }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="teacher in paginatedArchivedTeachers" :key="teacher.id" class="transition hover:bg-slate-50/80 opacity-60">
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher?.teacher_profile?.staff_id || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher?.first_name || '-' }} {{ teacher?.last_name || '' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher?.email || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher?.phone || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher.teacher_profile?.qualification || '-' }}</td>
                <td class="px-5 py-4">
                  <span class="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">Archived</span>
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
import { onMounted, reactive, computed, ref, watch } from "vue";
import { Plus, Users, Search } from 'lucide-vue-next';
import FormField from "../components/FormField.vue";
import SectionCard from "../components/SectionCard.vue";
import SkeletonRows from "../components/SkeletonRows.vue";
import AppButton from '../../shared/AppButton.vue';
import TeacherModal from '../components/TeacherModal.vue'
import { useSchoolAdminTeachersStore } from "../stores/teachers";
import { useSchoolAdminUiStore } from "../stores/ui";

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
];
const teachersStore = useSchoolAdminTeachersStore();
const uiStore = useSchoolAdminUiStore();

// Modal state
const showModal = ref(false)
const selectedTeacher = ref(null)
const modalMode = ref('edit') // 'view' or 'edit'

// Loading states
const revokeLoading = ref(new Set())
const deleteLoading = ref(new Set())
const isDeletingSelected = ref(false)

// Multi-select state
const isSelectMode = ref(false)
const selectedTeachers = ref(new Set())

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

watch(searchQuery, () => {
  teachersPage.value = 1
  selectedTeachers.value = new Set()
})

watch(teachersTotalPages, (totalPages) => {
  if (teachersPage.value > totalPages) teachersPage.value = totalPages
})

watch(archivedTeachersTotalPages, (totalPages) => {
  if (archivedTeachersPage.value > totalPages) archivedTeachersPage.value = totalPages
})

const startSelectMode = () => {
  isSelectMode.value = true
  selectedTeachers.value = new Set()
}

const cancelSelectMode = () => {
  isSelectMode.value = false
  selectedTeachers.value = new Set()
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

const deleteSelectedTeachers = async () => {
  const selectedCount = selectedTeachers.value.size

  if (!confirm(`Are you sure you want to delete ${selectedCount} selected teacher(s)? This action cannot be undone.`)) {
    return
  }

  isDeletingSelected.value = true
  deleteLoading.value = new Set(selectedTeachers.value)

  try {
    const selectedIds = Array.from(selectedTeachers.value)

    for (const id of selectedIds) {
      await teachersStore.deleteTeacherFromStore(id)
    }

    selectedTeachers.value = new Set()
    isSelectMode.value = false
    uiStore.addToast({
      title: 'Teachers deleted',
      message: `${selectedCount} teacher(s) have been deleted successfully.`,
      variant: 'success',
    })
  } catch (error) {
    uiStore.addToast({
      title: 'Error',
      message: error.message || 'Failed to delete selected teachers.',
      variant: 'error',
    })
  } finally {
    deleteLoading.value = new Set()
    isDeletingSelected.value = false
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
      await teachersStore.createTeacher(payload)
    }
    
    uiStore.addToast({ title: 'Teacher saved', message: 'Teacher has been saved successfully.', variant: 'success' })
    // Close modal after a short delay to ensure toast is visible
    setTimeout(() => {
      closeModal()
    }, 100)
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to save teacher.', variant: 'error' })
    // Close modal after error toast as well
    setTimeout(() => {
      closeModal()
    }, 100)
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

const resetForm = () => {
  Object.assign(form, { id: null, firstName: '', lastName: '', email: '', phone: '', qualification: '', staffId: '' });
  Object.assign(errors, { firstName: '', lastName: '', email: '', phone: '', qualification: '', staffId: '' });
};

onMounted(() => {
    teachersStore.fetchTeachers();
});
</script>
