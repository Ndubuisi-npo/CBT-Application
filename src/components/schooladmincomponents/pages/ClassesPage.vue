<template>
  <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
    <SectionCard title="Classes" subtitle="Manage classes and class levels.">
      <SkeletonRows v-if="classesStore.loading" :columns="3" />
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
                <td class="px-5 py-4">
                  <AppButton text="Edit" @click="editClass(item)" variant="outline" size="xs" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <SectionCard :title="form.id ? 'Edit Class' : 'Create Class'" subtitle="Create and manage class configurations.">
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
        <AppButton 
          type="submit" 
          :text="form.id ? 'Update Class' : 'Create Class'" 
          full-width 
          variant="primary" 
          :processing="classesStore.loading" 
          :disabled="classesStore.loading"
        />
      </form>
    </SectionCard>
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import FormField from '../components/FormField.vue'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import AppButton from '../../shared/AppButton.vue'
import { useSchoolAdminClassesStore } from '../stores/classes'
import { useSchoolAdminUiStore } from '../stores/ui'

const headings = ['Class Name', 'Class Level', 'Actions']
const levels = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3']
const classesStore = useSchoolAdminClassesStore()
const uiStore = useSchoolAdminUiStore()

const form = reactive({ id: null, name: '', level: '' })
const errors = reactive({ name: '', level: '' })

onMounted(async () => {
  try {
    await classesStore.fetchClasses()
  } catch (error) {
    console.error('Error loading classes:', error)
    uiStore.addToast({ title: 'Error', message: 'Failed to load classes. Please check your connection.', variant: 'error' })
  }
})

const editClass = (item) => Object.assign(form, item)

const validate = () => {
  errors.name = form.name ? '' : 'Class name is required.'
  errors.level = form.level ? '' : 'Class level is required.'
  return !errors.name && !errors.level
}

const submit = async () => {
  if (!validate()) return
  await classesStore.saveClass({ ...form })
  uiStore.addToast({ title: 'Class saved', message: 'Class configuration was updated.', variant: 'success' })
  Object.assign(form, { id: null, name: '', level: '' })
}
</script>
