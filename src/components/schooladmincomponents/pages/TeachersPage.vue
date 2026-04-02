<template>
  <div class="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
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
                <td class="px-5 py-4">
                  <p class="font-semibold text-slate-900">{{ teacher.name }}</p>
                  <p class="text-sm text-slate-500">{{ teacher.email }}</p>
                </td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher.department }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher.assignedClasses.join(', ') || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ teacher.assignedSubjects.join(', ') || '-' }}</td>
                <td class="px-5 py-4">
                  <button type="button" class="rounded-lg border-2 border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2" @click="editTeacher(teacher)">Edit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <SectionCard :title="form.id ? 'Edit Teacher' : 'Create Teacher'" subtitle="Create staff records and assign classes and subjects.">
      <form class="space-y-5" @submit.prevent="submit">
        <FormField label="Teacher name" :error="errors.name">
          <input v-model="form.name" class="sa-input" placeholder="Mrs. Ada Nwosu" />
        </FormField>
        <div class="grid gap-5 md:grid-cols-2">
          <FormField label="Email address" :error="errors.email">
            <input v-model="form.email" type="email" class="sa-input" placeholder="teacher@greenfield.edu" />
          </FormField>
          <FormField label="Phone number" :error="errors.phone">
            <input v-model="form.phone" class="sa-input" placeholder="+234 800 000 0000" />
          </FormField>
        </div>
        <FormField label="Department" :error="errors.department">
          <input v-model="form.department" class="sa-input" placeholder="Sciences" />
        </FormField>
        <FormField label="Assigned classes" :error="errors.assignedClasses">
          <TagMultiSelect v-model="form.assignedClasses" :options="classOptions" placeholder="Select classes" />
        </FormField>
        <FormField label="Assigned subjects" :error="errors.assignedSubjects">
          <TagMultiSelect v-model="form.assignedSubjects" :options="subjectOptions" placeholder="Select subjects" />
        </FormField>
        <button type="submit" class="w-full rounded-lg bg-[#0B1F3A] px-4 py-2.5 font-medium text-white transition hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2">{{ form.id ? 'Update Teacher' : 'Create Teacher' }}</button>
      </form>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue'
import FormField from '../components/FormField.vue'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import TagMultiSelect from '../components/TagMultiSelect.vue'
import { useSchoolAdminClassesStore } from '../stores/classes'
import { useSchoolAdminSubjectsStore } from '../stores/subjects'
import { useSchoolAdminTeachersStore } from '../stores/teachers'
import { useSchoolAdminUiStore } from '../stores/ui'

const headings = ['Teacher', 'Department', 'Assigned Classes', 'Assigned Subjects', 'Actions']
const teachersStore = useSchoolAdminTeachersStore()
const classesStore = useSchoolAdminClassesStore()
const subjectsStore = useSchoolAdminSubjectsStore()
const uiStore = useSchoolAdminUiStore()

const form = reactive({
  id: null,
  name: '',
  email: '',
  phone: '',
  department: '',
  assignedClasses: [],
  assignedSubjects: [],
})

const errors = reactive({
  name: '',
  email: '',
  phone: '',
  department: '',
  assignedClasses: '',
  assignedSubjects: '',
})

onMounted(() => {
  teachersStore.fetchTeachers()
  classesStore.fetchClasses()
  subjectsStore.fetchSubjects()
})

const classOptions = computed(() => classesStore.classes.map((item) => item.name))
const subjectOptions = computed(() => subjectsStore.subjects.map((item) => item.name))

const editTeacher = (teacher) => {
  form.id = teacher.id
  form.name = teacher.name
  form.email = teacher.email
  form.phone = teacher.phone
  form.department = teacher.department
  form.assignedClasses = [...teacher.assignedClasses]
  form.assignedSubjects = [...teacher.assignedSubjects]
}

const reset = () => {
  form.id = null
  form.name = ''
  form.email = ''
  form.phone = ''
  form.department = ''
  form.assignedClasses = []
  form.assignedSubjects = []
}

const validate = () => {
  errors.name = form.name ? '' : 'Teacher name is required.'
  errors.email = /\S+@\S+\.\S+/.test(form.email) ? '' : 'Enter a valid email address.'
  errors.phone = form.phone ? '' : 'Phone number is required.'
  errors.department = form.department ? '' : 'Department is required.'
  errors.assignedClasses = ''
  errors.assignedSubjects = ''
  return !errors.name && !errors.email && !errors.phone && !errors.department
}

const submit = async () => {
  if (!validate()) return
  await teachersStore.saveTeacher({
    ...form,
    assignedClasses: [...form.assignedClasses],
    assignedSubjects: [...form.assignedSubjects],
  })
  uiStore.addToast({ title: 'Teacher saved', message: 'Teacher record was updated successfully.', variant: 'success' })
  reset()
}
</script>
