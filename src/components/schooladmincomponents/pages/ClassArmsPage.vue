<template>
  <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
    <SectionCard :title="`Class Arms for ${classLevel?.name || '...'}`" subtitle="Manage class arms (e.g., JSS 1A, JSS 1B).">
      <SkeletonRows v-if="classArmsStore.loading" :columns="3" />
      <div v-else-if="classArmsStore.classArms.length === 0" class="text-center py-12">
        <div class="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <svg class="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-slate-900 mb-2">No class arms created</h3>
        <p class="text-slate-600 mb-6">Get started by creating your first class arm for {{ classLevel?.name || 'this class level' }}.</p>
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
              <tr v-for="classArm in classArmsStore.classArms" :key="classArm.id" class="transition hover:bg-slate-50/80">
                <td class="px-5 py-4 font-semibold text-slate-900">{{ classArm.name }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ classLevel?.name || '-' }}</td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <AppButton text="Edit" @click="editClassArm(classArm)" variant="outline" size="xs" />
                    <AppButton text="Delete" @click="deleteClassArm(classArm.id)" variant="danger" size="xs" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <SectionCard :title="form.id ? 'Edit Class Arm' : 'Create Class Arm'" subtitle="Create class arms for this class level.">
      <form class="space-y-5" @submit.prevent="submit">
        <FormField label="Class arm name" :error="errors.name">
          <input v-model="form.name" class="sa-input" placeholder="JSS 1A" />
        </FormField>
        <AppButton 
          type="submit" 
          :text="form.id ? 'Update Class Arm' : 'Create Class Arm'" 
          full-width 
          variant="primary" 
          :processing="classArmsStore.loading" 
        />
      </form>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import AppButton from '../../shared/AppButton.vue'
import { useSchoolAdminClassArmsStore } from '../stores/classArms'
import { useSchoolAdminClassLevelsStore } from '../stores/classLevels'
import { useSchoolAdminUiStore } from '../stores/ui'

const route = useRoute()
const headings = ['Class Arm Name', 'Class Level', 'Actions']
const classLevelsStore = useSchoolAdminClassLevelsStore()
const classArmsStore = useSchoolAdminClassArmsStore()
const uiStore = useSchoolAdminUiStore()

const form = reactive({ id: null, name: '' })
const errors = reactive({ name: '' })

const classLevelId = computed(() => route.params.id)
const classLevel = computed(() => classLevelsStore.classLevels.find(cl => cl.id === classLevelId.value))

onMounted(async () => {
  try {
    await classLevelsStore.fetchClassLevels()
    if (classLevelId.value) {
      await classArmsStore.fetchClassArms(classLevelId.value)
    }
  } catch (error) {
    console.error('Error loading data:', error)
    uiStore.addToast({ title: 'Error', message: 'Failed to load data. Please check your connection.', variant: 'error' })
  }
})

watch(() => classLevelId.value, async (newId) => {
  if (newId) {
    await classArmsStore.fetchClassArms(newId)
  }
})

const resetForm = () => {
  form.id = null
  form.name = ''
  Object.assign(errors, { name: '' })
}

const editClassArm = (classArm) => {
  form.id = classArm.id
  form.name = classArm.name
}

const validate = () => {
  errors.name = form.name ? '' : 'Class arm name is required.'
  return !errors.name
}

const deleteClassArm = async (id) => {
  if (!confirm('Are you sure you want to delete this class arm? This action cannot be undone.')) {
    return
  }
  
  try {
    await classArmsStore.deleteClassArm(classLevelId.value, id)
    uiStore.addToast({ title: 'Class arm deleted', message: 'Class arm has been deleted.', variant: 'success' })
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to delete class arm.', variant: 'error' })
  }
}

const submit = async () => {
  if (!validate() || !classLevelId.value) return
  await classArmsStore.saveClassArm(classLevelId.value, { ...form })
  uiStore.addToast({ title: 'Class arm saved', message: 'Class arm configuration was updated.', variant: 'success' })
  Object.assign(form, { id: null, name: '' })
}
</script>
