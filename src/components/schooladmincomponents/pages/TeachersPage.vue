<template>
  <div class="space-y-6">
    <SectionCard v-if="!showArchived" title="Teachers" subtitle="Manage staff records, contacts, department ownership, and class/subject assignments.">
      <template #header>
        <div class="flex flex-wrap items-center gap-3">
          <button 
            @click="toggleView" 
            class="rounded-lg bg-[#0B1F3A] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0F2940]"
          >
            Show Archived
          </button>
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
                    <button type="button" class="rounded-lg border-2 border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2" @click="editTeacher(teacher)">Edit</button>
                    <button type="button" class="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100" @click="revokeTeacher(teacher.id)">Revoke</button>
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
          <button 
            @click="toggleView" 
            class="rounded-lg bg-emerald-50 border-2 border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
          >
            Show Active
          </button>
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

    <SectionCard
        :title="form.id ? 'Edit Teacher' : 'Create Teacher'"
        subtitle="Create staff records and assign classes and subjects."
    >
      <form class="space-y-5" @submit.prevent="submit">
        <div class="grid gap-5 md:grid-cols-2">
          <FormField label="First name" :error="errors.firstName">
            <input
                v-model="form.firstName"
                class="sa-input"
                placeholder="Ada"
            />
          </FormField>
          <FormField label="Last name" :error="errors.lastName">
            <input
                v-model="form.lastName"
                class="sa-input"
                placeholder="Nwosu"
            />
          </FormField>
        </div>
        <FormField label="Email address" :error="errors.email">
          <input
              v-model="form.email"
              type="email"
              class="sa-input"
              placeholder="teacher@greenfield.edu"
          />
        </FormField>
        <FormField label="Phone number" :error="errors.phone">
          <input
              v-model="form.phone"
              class="sa-input"
              placeholder="+234 800 000 0000"
          />
        </FormField>
        <div class="grid gap-5 md:grid-cols-2">
          <FormField
              label="Qualification"
              :error="errors.qualification"
          >
            <input
                v-model="form.qualification"
                class="sa-input"
                placeholder="MSc Mathematics"
            />
          </FormField>
          <FormField label="Staff ID" :error="errors.staffId">
            <input
                v-model="form.staffId"
                class="sa-input"
                placeholder="STF-0392"
            />
          </FormField>
        </div>
        <button
            type="submit"
            class="w-full rounded-lg bg-[#0B1F3A] px-4 py-2.5 font-medium text-white transition hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2"
        >
          {{ form.id ? "Update Teacher" : "Create Teacher" }}
        </button>
      </form>
    </SectionCard>
  </div>
</template>

<script setup>
import { onMounted, reactive, computed, ref } from "vue";
import FormField from "../components/FormField.vue";
import SectionCard from "../components/SectionCard.vue";
import SkeletonRows from "../components/SkeletonRows.vue";
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

// Toggle state for active/archived view
const showArchived = ref(false);

// Computed property to determine which teachers to show
const currentTeachers = computed(() => {
  return showArchived.value ? teachersStore.archivedTeachers : teachersStore.teachers;
});

const toggleView = () => {
  showArchived.value = !showArchived.value;
  if (showArchived.value) {
    teachersStore.fetchArchivedTeachers();
  }
};

const form = reactive({
    id: null,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    qualification: "",
    staffId: "",
});

const errors = reactive({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    qualification: "",
    staffId: "",
});

onMounted(() => {
    teachersStore.fetchTeachers();
});

const formatTeacherName = (teacher) => {
    const first = teacher.user?.first_name || "";
    const last = teacher.user?.last_name || "";
    return `${first} ${last}`.trim();
};

const editTeacher = (teacher) => {
    form.id = teacher.id;
    form.firstName = teacher.user?.first_name || "";
    form.lastName = teacher.user?.last_name || "";
    form.email = teacher.user?.email || "";
    form.phone = teacher.user?.phone || "";
    form.qualification = teacher.qualification || "";
    form.staffId = teacher.staff_id || "";
};

const reset = () => {
    form.id = null;
    form.firstName = "";
    form.lastName = "";
    form.email = "";
    form.phone = "";
    form.qualification = "";
    form.staffId = "";
};

const validate = () => {
    errors.firstName = form.firstName ? "" : "First name is required.";
    errors.lastName = form.lastName ? "" : "Last name is required.";
    errors.email = /\S+@\S+\.\S+/.test(form.email)
        ? ""
        : "Enter a valid email address.";
    errors.phone = form.phone ? "" : "Phone number is required.";
    errors.qualification = form.qualification
        ? ""
        : "Qualification is required.";
    errors.staffId = form.staffId ? "" : "Staff ID is required.";
    return (
        !errors.firstName &&
        !errors.lastName &&
        !errors.email &&
        !errors.phone &&
        !errors.qualification &&
        !errors.staffId
    );
};

const revokeTeacher = async (id) => {
    if (
        !confirm(
            "Are you sure you want to revoke this teacher's privileges? This will move them to the archived section.",
        )
    ) {
        return;
    }

    try {
        console.log("Attempting to revoke teacher with ID:", id);
        await teachersStore.revokeTeacher(id);
        uiStore.addToast({
            title: "Teacher revoked",
            message: "Teacher privileges have been revoked and moved to archive.",
            variant: "success",
        });
    } catch (error) {
        console.error("Error revoking teacher:", error);
        uiStore.addToast({
            title: "Error",
            message: error.message || "Failed to revoke teacher.",
            variant: "error",
        });
    }
};

const submit = async () => {
    if (!validate()) return;

    const payload = {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone: form.phone,
        qualification: form.qualification,
        staff_id: form.staffId,
    };

    // Include ID if editing (form.id exists)
    if (form.id) {
        payload.id = form.id;
    }

    await teachersStore.saveTeacher(payload);
    uiStore.addToast({
        title: "Teacher saved",
        message: "Teacher record was updated successfully.",
        variant: "success",
    });
    reset();
};
</script>
