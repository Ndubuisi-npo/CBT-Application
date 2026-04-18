<template>
  <div class="space-y-6">
    <SectionCard v-if="!showArchived" title="Teachers" subtitle="Manage staff records, contacts, department ownership, and class/subject assignments.">
      <template #header>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton @click="openModal()" :icon="Plus" text="Create Teacher" variant="primary" size="base" />
          <AppButton 
            @click="toggleView" 
            text="Show Archived"
            variant="outline"
            size="base"
          />
        </div>
      </template>
      <SkeletonRows v-if="teachersStore.loading" :columns="5" />
      <div v-else class="overflow-hidden rounded-[24px] border border-slate-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th v-for="heading in headings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ heading }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="teacher in teachersStore.teachers" :key="teacher.id" class="transition hover:bg-slate-50/80">
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher?.first_name || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher?.last_name || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher?.email || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher?.phone || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher.teacher_profile?.qualification || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher.teacher_profile?.staff_id || '-' }}</td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <AppButton text="Edit" @click="editTeacher(teacher)" variant="outline" size="xs" />
                    <AppButton 
                      text="Revoke" 
                      @click="revokeTeacher(teacher.id)" 
                      variant="warning" 
                      size="xs"
                      loadingText="Revoking..."
                      :processing="revokeLoading.has(teacher.id)"
                      :disabled="revokeLoading.has(teacher.id)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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
                <th v-for="heading in headings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ heading }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="teacher in teachersStore.archivedTeachers" :key="teacher.id" class="transition hover:bg-slate-50/80 opacity-60">
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher?.first_name || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher?.last_name || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher?.email || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher?.phone || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher.teacher_profile?.qualification || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher.teacher_profile?.staff_id || '-' }}</td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <span class="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">Archived</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <TeacherModal 
      :show="showModal" 
      :teacher="selectedTeacher"
      @close="closeModal"
      @submit="submitTeacher"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, computed, ref } from "vue";
import { Plus } from 'lucide-vue-next';
import FormField from "../components/FormField.vue";
import SectionCard from "../components/SectionCard.vue";
import SkeletonRows from "../components/SkeletonRows.vue";
import AppButton from '../../shared/AppButton.vue';
import TeacherModal from '../components/TeacherModal.vue'
import { useSchoolAdminTeachersStore } from "../stores/teachers";
import { useSchoolAdminUiStore } from "../stores/ui";

const headings = [
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Qualification",
    "Staff ID",
    "Actions",
];
const teachersStore = useSchoolAdminTeachersStore();
const uiStore = useSchoolAdminUiStore();

// Modal state
const showModal = ref(false)
const selectedTeacher = ref(null)

// Loading states
const revokeLoading = ref(new Set())

// Form state
const form = reactive({ id: null, firstName: '', lastName: '', email: '', phone: '', qualification: '', staffId: '' })
const errors = reactive({ firstName: '', lastName: '', email: '', phone: '', qualification: '', staffId: '' })

// Toggle state for active/archived view
const showArchived = ref(false);

// Computed property to determine which teachers to show
const currentTeachers = computed(() => {
  return showArchived.value ? teachersStore.archivedTeachers : teachersStore.teachers;
});

const closeModal = () => {
  showModal.value = false
  selectedTeacher.value = null
}

const openModal = (teacher) => {
  selectedTeacher.value = teacher
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
  showModal.value = true
}

const submitTeacher = async (teacherData) => {
  try {
    console.log('Teacher data received in page:', teacherData)
    
    const payload = {
      first_name: teacherData.firstName,
      last_name: teacherData.lastName,
      email: teacherData.email,
      phone: teacherData.phone,
      qualification: teacherData.qualification,
      staff_id: teacherData.staffId
    }
    
    console.log('Payload to be sent to API:', payload)
    
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
    console.error('Teacher form error:', error)
    uiStore.addToast({ title: 'Error', message: 'Failed to save teacher.', variant: 'error' })
    // Close modal after error toast as well
    setTimeout(() => {
      closeModal()
    }, 100)
  }
}

const toggleView = () => {
  showArchived.value = !showArchived.value;
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
