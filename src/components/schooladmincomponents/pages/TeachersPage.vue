<template>
  <div class="space-y-6">
    <SectionCard title="Teachers" subtitle="Manage staff records, contacts, department ownership, and class/subject assignments.">
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
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher.user?.first_name || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher.user?.last_name || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher.user?.email || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher.user?.phone || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher.qualification || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher.staff_id || '-' }}</td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <button type="button" class="rounded-lg border-2 border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2" @click="editTeacher(teacher)">Edit</button>
                    <button type="button" class="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100" @click="deleteTeacher(teacher.id)">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <SectionCard :title="form.id ? 'Edit Teacher' : 'Create Teacher'" subtitle="Create staff records and assign classes and subjects.">
      <form class="space-y-5" @submit.prevent="submit">
        <div class="grid gap-5 md:grid-cols-2">
          <FormField label="First name" :error="errors.firstName">
            <input v-model="form.firstName" class="sa-input" placeholder="Ada" />
          </FormField>
          <FormField label="Last name" :error="errors.lastName">
            <input v-model="form.lastName" class="sa-input" placeholder="Nwosu" />
          </FormField>
        </div>
        <FormField label="Email address" :error="errors.email">
          <input v-model="form.email" type="email" class="sa-input" placeholder="teacher@greenfield.edu" />
        </FormField>
        <FormField label="Phone number" :error="errors.phone">
          <input v-model="form.phone" class="sa-input" placeholder="+234 800 000 0000" />
        </FormField>
        <div class="grid gap-5 md:grid-cols-2">
          <FormField label="Qualification" :error="errors.qualification">
            <input v-model="form.qualification" class="sa-input" placeholder="MSc Mathematics" />
          </FormField>
          <FormField label="Staff ID" :error="errors.staffId">
            <input v-model="form.staffId" class="sa-input" placeholder="STF-0392" />
          </FormField>
        </div>
        <button type="submit" class="w-full rounded-lg bg-[#0B1F3A] px-4 py-2.5 font-medium text-white transition hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2">{{ form.id ? 'Update Teacher' : 'Create Teacher' }}</button>
      </form>
    </SectionCard>
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import FormField from '../components/FormField.vue'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import { useSchoolAdminTeachersStore } from '../stores/teachers'
import { useSchoolAdminUiStore } from '../stores/ui'

const headings = ['First Name', 'Last Name', 'Email', 'Phone', 'Qualification', 'Staff ID', 'Actions']
const teachersStore = useSchoolAdminTeachersStore()
const uiStore = useSchoolAdminUiStore()

const form = reactive({
  id: null,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  qualification: '',
  staffId: '',
})

const errors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  qualification: '',
  staffId: '',
})

onMounted(() => {
  teachersStore.fetchTeachers()
})

const formatTeacherName = (teacher) => {
  const first = teacher.user?.first_name || ''
  const last = teacher.user?.last_name || ''
  return `${first} ${last}`.trim()
}

const editTeacher = (teacher) => {
  form.id = teacher.id
  form.firstName = teacher.user?.first_name || ''
  form.lastName = teacher.user?.last_name || ''
  form.email = teacher.user?.email || ''
  form.phone = teacher.user?.phone || ''
  form.qualification = teacher.qualification || ''
  form.staffId = teacher.staff_id || ''
}

const reset = () => {
  form.id = null
  form.firstName = ''
  form.lastName = ''
  form.email = ''
  form.phone = ''
  form.qualification = ''
  form.staffId = ''
}

const validate = () => {
  errors.firstName = form.firstName ? '' : 'First name is required.'
  errors.lastName = form.lastName ? '' : 'Last name is required.'
  errors.email = /\S+@\S+\.\S+/.test(form.email) ? '' : 'Enter a valid email address.'
  errors.phone = form.phone ? '' : 'Phone number is required.'
  errors.qualification = form.qualification ? '' : 'Qualification is required.'
  errors.staffId = form.staffId ? '' : 'Staff ID is required.'
  return !errors.firstName && !errors.lastName && !errors.email && !errors.phone && !errors.qualification && !errors.staffId
}

const deleteTeacher = async (id) => {
  if (!confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) {
    return
  }
  
  try {
    console.log('Attempting to delete teacher with ID:', id)
    await teachersStore.deleteTeacher(id)
    uiStore.addToast({ title: 'Teacher deleted', message: 'Teacher record has been deleted.', variant: 'success' })
  } catch (error) {
    console.error('Error deleting teacher:', error)
    uiStore.addToast({ title: 'Error', message: error.message || 'Failed to delete teacher.', variant: 'error' })
  }
}

const submit = async () => {
  if (!validate()) return
  
  const payload = {
    first_name: form.firstName,
    last_name: form.lastName,
    email: form.email,
    phone: form.phone,
    qualification: form.qualification,
    staff_id: form.staffId,
  }
  
  // Include ID if editing (form.id exists)
  if (form.id) {
    payload.id = form.id
  }
  
  await teachersStore.saveTeacher(payload)
  uiStore.addToast({ title: 'Teacher saved', message: 'Teacher record was updated successfully.', variant: 'success' })
  reset()
}
</script>
