<template>
  <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
    <SectionCard title="Class Arms" subtitle="Manage class arms, class levels, and teacher ownership.">
      <SkeletonRows v-if="classesStore.loading" :columns="4" />
      <div v-else class="overflow-hidden rounded-[24px] border border-slate-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th v-for="heading in headings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ heading }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="item in classesStore.classes" :key="item.id" class="transition hover:bg-slate-50/80">
                <td class="px-5 py-4 font-semibold text-slate-900">{{ item.name }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ item.level }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ item.teacher }}</td>
                <td class="px-5 py-4">
                  <button type="button" class="sa-button-secondary px-3 py-2 text-xs" @click="editClass(item)">Edit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <SectionCard :title="form.id ? 'Edit Class Arm' : 'Create Class Arm'" subtitle="Map class arms to levels and class teachers.">
      <form class="space-y-5" @submit.prevent="submit">
        <FormField label="Class name" :error="errors.name">
          <input v-model="form.name" class="sa-input" placeholder="JSS1A" />
        </FormField>
        <FormField label="Class level" :error="errors.level">
          <select v-model="form.level" class="sa-input">
            <option value="">Select level</option>
            <option v-for="level in levels" :key="level" :value="level">{{ level }}</option>
          </select>
        </FormField>
        <FormField label="Assigned teacher" :error="errors.teacher">
          <select v-model="form.teacher" class="sa-input">
            <option value="">Assign teacher</option>
            <option v-for="teacher in teachersStore.teacherNames" :key="teacher" :value="teacher">{{ teacher }}</option>
          </select>
        </FormField>
        <button type="submit" class="sa-button-primary w-full">{{ form.id ? 'Update Class Arm' : 'Create Class Arm' }}</button>
      </form>
    </SectionCard>
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import FormField from '../components/FormField.vue'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import { useSchoolAdminClassesStore } from '../stores/classes'
import { useSchoolAdminTeachersStore } from '../stores/teachers'
import { useSchoolAdminUiStore } from '../stores/ui'

const headings = ['Class Name', 'Class Level', 'Assigned Teacher', 'Actions']
const levels = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3']
const classesStore = useSchoolAdminClassesStore()
const teachersStore = useSchoolAdminTeachersStore()
const uiStore = useSchoolAdminUiStore()

const form = reactive({ id: null, name: '', level: '', teacher: '' })
const errors = reactive({ name: '', level: '', teacher: '' })

onMounted(() => {
  classesStore.fetchClasses()
  teachersStore.fetchTeachers()
})

const editClass = (item) => Object.assign(form, item)

const validate = () => {
  errors.name = form.name ? '' : 'Class name is required.'
  errors.level = form.level ? '' : 'Class level is required.'
  errors.teacher = form.teacher ? '' : 'Assigned teacher is required.'
  return !errors.name && !errors.level && !errors.teacher
}

const submit = async () => {
  if (!validate()) return
  await classesStore.saveClass({ ...form })
  uiStore.addToast({ title: 'Class arm saved', message: 'Class arm configuration was updated.', variant: 'success' })
  Object.assign(form, { id: null, name: '', level: '', teacher: '' })
}
</script>
