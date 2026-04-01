<template>
  <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
    <SectionCard title="Subjects" subtitle="Assign subjects to classes and teachers with relationship mapping.">
      <SkeletonRows v-if="subjectsStore.loading" :columns="4" />
      <div v-else class="overflow-hidden rounded-[24px] border border-slate-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th v-for="heading in headings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ heading }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="subject in subjectsStore.subjects" :key="subject.id" class="transition hover:bg-slate-50/80">
                <td class="px-5 py-4 font-semibold text-slate-900">{{ subject.name }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ subject.classes.join(', ') }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ subject.teachers.join(', ') }}</td>
                <td class="px-5 py-4">
                  <button type="button" class="sa-button-secondary px-3 py-2 text-xs" @click="editSubject(subject)">Edit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <SectionCard :title="form.id ? 'Edit Subject' : 'Create Subject'" subtitle="Use chips-style selectors to assign classes and teachers.">
      <form class="space-y-5" @submit.prevent="submit">
        <FormField label="Subject name" :error="errors.name">
          <input v-model="form.name" class="sa-input" placeholder="Mathematics" />
        </FormField>
        <FormField label="Assigned classes" :error="errors.classes">
          <TagMultiSelect v-model="form.classes" :options="classOptions" placeholder="Select classes" />
        </FormField>
        <FormField label="Assigned teachers" :error="errors.teachers">
          <TagMultiSelect v-model="form.teachers" :options="teacherOptions" placeholder="Select teachers" />
        </FormField>
        <button type="submit" class="sa-button-primary w-full">{{ form.id ? 'Update Subject' : 'Create Subject' }}</button>
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

const headings = ['Subject Name', 'Assigned Classes', 'Assigned Teachers', 'Actions']
const subjectsStore = useSchoolAdminSubjectsStore()
const classesStore = useSchoolAdminClassesStore()
const teachersStore = useSchoolAdminTeachersStore()
const uiStore = useSchoolAdminUiStore()

const form = reactive({ id: null, name: '', classes: [], teachers: [] })
const errors = reactive({ name: '', classes: '', teachers: '' })

onMounted(() => {
  subjectsStore.fetchSubjects()
  classesStore.fetchClasses()
  teachersStore.fetchTeachers()
})

const classOptions = computed(() => classesStore.classes.map((item) => item.name))
const teacherOptions = computed(() => teachersStore.teacherNames)

const editSubject = (subject) => {
  form.id = subject.id
  form.name = subject.name
  form.classes = [...subject.classes]
  form.teachers = [...subject.teachers]
}

const validate = () => {
  errors.name = form.name ? '' : 'Subject name is required.'
  errors.classes = form.classes.length ? '' : 'Select at least one class.'
  errors.teachers = form.teachers.length ? '' : 'Select at least one teacher.'
  return !errors.name && !errors.classes && !errors.teachers
}

const submit = async () => {
  if (!validate()) return
  await subjectsStore.saveSubject({ ...form, classes: [...form.classes], teachers: [...form.teachers] })
  uiStore.addToast({ title: 'Subject saved', message: 'Subject mapping was updated successfully.', variant: 'success' })
  form.id = null
  form.name = ''
  form.classes = []
  form.teachers = []
}
</script>
