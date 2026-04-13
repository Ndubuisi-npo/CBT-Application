<template>
  <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
    <SectionCard title="Class Levels" subtitle="Manage class levels (e.g., JSS 1, SS 1).">
      <SkeletonRows v-if="classLevelsStore.loading" :columns="3" />
      <div v-else class="overflow-hidden rounded-[24px] border border-slate-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th v-for="heading in headings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ heading }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="classLevel in classLevelsStore.classLevels" :key="classLevel.id" class="transition hover:bg-slate-50/80">
                <td class="px-5 py-4 font-semibold text-slate-900">{{ classLevel.name }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ getArmsCount(classLevel.id) }} arms</td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <button type="button" class="rounded-lg border-2 border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2" @click="editClassLevel(classLevel)">Edit</button>
                    <RouterLink :to="`/school-admin/class-arms/${classLevel.id}`" class="rounded-lg bg-[#0B1F3A] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2">View Arms</RouterLink>
                    <button type="button" class="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100" @click="deleteClassLevel(classLevel.id)">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <SectionCard :title="form.id ? 'Edit Class Level' : 'Create Class Level'" subtitle="Define class levels for your school.">
      <form class="space-y-5" @submit.prevent="submit">
        <FormField label="Class level name" :error="errors.name">
          <input v-model="form.name" class="sa-input" placeholder="JSS 1" />
        </FormField>
        <button type="submit" class="w-full rounded-lg bg-[#0B1F3A] px-4 py-2.5 font-medium text-white transition hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2">{{ form.id ? 'Update Class Level' : 'Create Class Level' }}</button>
      </form>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue'
import FormField from '../components/FormField.vue'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import { useSchoolAdminClassLevelsStore } from '../stores/classLevels'
import { useSchoolAdminClassArmsStore } from '../stores/classArms'
import { useSchoolAdminUiStore } from '../stores/ui'

const headings = ['Class Level', 'Number of Arms', 'Actions']
const classLevelsStore = useSchoolAdminClassLevelsStore()
const classArmsStore = useSchoolAdminClassArmsStore()
const uiStore = useSchoolAdminUiStore()

const form = reactive({ id: null, name: '' })
const errors = reactive({ name: '' })

onMounted(async () => {
  try {
    await classLevelsStore.fetchClassLevels()
    // Load arms counts for all class levels
    for (const classLevel of classLevelsStore.classLevels) {
      await loadArmsCount(classLevel.id)
    }
  } catch (error) {
    console.error('Error loading class levels:', error)
    uiStore.addToast({ title: 'Error', message: 'Failed to load class levels. Please check your connection.', variant: 'error' })
  }
})

const editClassLevel = (classLevel) => {
  form.name = classLevel.name
}

const reset = () => {
  form.name = ''
}

const validate = () => {
  errors.name = form.name ? '' : 'Class level name is required.'
  return !errors.name
}

const deleteClassLevel = async (id) => {
  if (!confirm('Are you sure you want to delete this class level? This action cannot be undone and will also delete all associated class arms.')) {
    return
  }
  
  try {
    await classLevelsStore.deleteClassLevel(id)
    uiStore.addToast({ title: 'Class level deleted', message: 'Class level has been deleted.', variant: 'success' })
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to delete class level.', variant: 'error' })
  }
}

const armsCounts = reactive({})

const getArmsCount = (classLevelId) => {
  return armsCounts[classLevelId] || 0
}

// Function to load arms count for a specific class level directly from API
const loadArmsCount = async (classLevelId) => {
  try {
    // Import the API function directly to avoid store conflicts
    const { getClassArms } = await import('../services/api/classes')
    const arms = await getClassArms(classLevelId)
    console.log(`Arms for class level ${classLevelId}:`, arms)
    armsCounts[classLevelId] = arms.length
  } catch (error) {
    console.error(`Error loading arms count for class level ${classLevelId}:`, error)
    armsCounts[classLevelId] = 0
  }
}

const submit = async () => {
  if (!validate()) return
  const savedClassLevel = await classLevelsStore.saveClassLevel({ ...form })
  uiStore.addToast({ title: 'Class level saved', message: 'Class level configuration was updated.', variant: 'success' })
  // Load arms count for the new/updated class level
  await loadArmsCount(savedClassLevel.id)
  Object.assign(form, { id: null, name: '' })
}
</script>
