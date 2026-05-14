<template>
  <div class="space-y-6">
    <SectionCard v-if="!showArchived" title="Students" subtitle="Manage student records, enrollment, academic progress, and class assignments.">
      <template #header>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton @click="openModal()" :icon="Plus" text="Create Student" variant="primary" size="base" />
          <AppButton @click="goToImport" :icon="UploadCloud" text="Import Students" variant="outline" size="base" />
          <AppButton 
            @click="toggleView" 
            text="Show Archived"
            variant="outline"
            size="base"
          />
        </div>
      </template>
      <SkeletonRows v-if="studentsStore.loading" :columns="5" />
      <div v-else-if="studentsStore.students.length === 0" class="rounded-[24px] border border-slate-200 bg-white p-12 text-center">
        <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
          <GraduationCap class="h-12 w-12 text-slate-400" />
        </div>
        <h3 class="mt-6 text-xl font-semibold text-slate-900">No Students</h3>
        <p class="mt-2 text-slate-600">Get started by adding your first student to manage your school enrollment.</p>
        <div class="mt-8">
          <AppButton @click="openModal()" :icon="Plus" text="Add Your First Student" variant="primary" size="lg" />
        </div>
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
              <tr v-for="student in studentsStore.students" :key="student.id" class="transition hover:bg-slate-50/80">
                <td class="px-5 py-4 text-sm text-slate-600">{{ student?.first_name || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student?.last_name || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student?.email || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student?.phone || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student.student_profile?.admission_number || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student.student_profile?.class_name || '-' }}</td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <AppButton text="Edit" @click="editStudent(student)" variant="outline" size="xs" />
                    <AppButton 
                      text="Revoke" 
                      @click="revokeStudent(student.id)" 
                      variant="warning" 
                      size="xs"
                      loadingText="Revoking..."
                      :processing="revokeLoading.has(student.id)"
                      :disabled="revokeLoading.has(student.id)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <SectionCard v-if="showArchived" title="Archived Students" subtitle="View and manage revoked students.">
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
                <th v-for="heading in headings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ heading }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="student in studentsStore.archivedStudents" :key="student.id" class="transition hover:bg-slate-50/80 opacity-60">
                <td class="px-5 py-4 text-sm text-slate-600">{{ student?.first_name || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student?.last_name || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student?.email || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student?.phone || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student.student_profile?.admission_number || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student.student_profile?.class_name || '-' }}</td>
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

    <StudentModal 
      :show="showModal" 
      :student="selectedStudent"
      @close="closeModal"
      @submit="submitStudent"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, computed, ref } from "vue";
import { useRouter } from "vue-router";
import { Plus, GraduationCap, UploadCloud } from 'lucide-vue-next';
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

// Loading states
const revokeLoading = ref(new Set())

// Form state
const form = reactive({ id: null, firstName: '', lastName: '', email: '', phone: '', admissionNumber: '', className: '' })
const errors = reactive({ firstName: '', lastName: '', email: '', phone: '', admissionNumber: '', className: '' })

// Toggle state for active/archived view
const showArchived = ref(false);

// Computed property to determine which students to show
const currentStudents = computed(() => {
  return showArchived.value ? studentsStore.archivedStudents : studentsStore.students;
});

const closeModal = () => {
  showModal.value = false
  selectedStudent.value = null
}

const openModal = (student) => {
  selectedStudent.value = student
  showModal.value = true
}

const goToImport = () => {
  router.push('/school-admin/students/import')
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
      class_name: studentData.class_name
    }
    
    if (studentData.id) {
      await studentsStore.updateStudent(studentData.id, payload)
    } else {
      await studentsStore.createStudent(payload)
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

const resetForm = () => {
  Object.assign(form, { id: null, firstName: '', lastName: '', email: '', phone: '', admissionNumber: '', className: '' });
  Object.assign(errors, { firstName: '', lastName: '', email: '', phone: '', admissionNumber: '', className: '' });
};

onMounted(() => {
    studentsStore.fetchStudents();
});
</script>
