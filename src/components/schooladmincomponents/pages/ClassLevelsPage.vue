<template>
  <div class="space-y-6">
    <SectionCard title="Class Levels" subtitle="Manage class levels (e.g., JSS 1, SS 1).">
      <template #header>
        <AppButton @click="openModal()" :icon="Plus" text="Create Class Level" variant="primary" />
      </template>
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
                <td class="px-5 py-4 text-sm text-slate-600">{{ getArmsCount(classLevel) }} arms</td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <AppButton text="Edit" @click="editClassLevel(classLevel)" variant="outline" size="xs" />
                    <ActionButton tag="RouterLink" :to="`/school-admin/class-arms/${classLevel.id}`" text="View Arms" variant="primary" size="xs" />
                    <AppButton 
                      text="Delete" 
                      @click="deleteClassLevel(classLevel.id)" 
                      variant="danger" 
                      size="xs"
                      loadingText="Deleting..."
                      :processing="deleteLoading.has(classLevel.id)"
                      :disabled="deleteLoading.has(classLevel.id)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <ClassLevelModal 
      :show="showModal" 
      :classLevel="selectedClassLevel"
      @close="closeModal"
      @submit="submitClassLevel"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus } from 'lucide-vue-next'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import AppButton from '../../shared/AppButton.vue'
import ActionButton from '../../shared/ActionButton.vue'
import ClassLevelModal from '../components/ClassLevelModal.vue'
import { useSchoolAdminClassLevelsStore } from '../stores/classLevels'
import { useSchoolAdminClassArmsStore } from '../stores/classArms'
import { useSchoolAdminUiStore } from '../stores/ui'

const headings = ['Class Level', 'Number of Arms', 'Actions']
const classLevelsStore = useSchoolAdminClassLevelsStore()
const classArmsStore = useSchoolAdminClassArmsStore()
const uiStore = useSchoolAdminUiStore()

// Modal state
const showModal = ref(false)
const selectedClassLevel = ref(null)

// Loading states
const deleteLoading = ref(new Set())

// Form state
const form = reactive({ id: null, name: '' })
const errors = reactive({ name: '' })

onMounted(async () => {
  try {
    await classLevelsStore.fetchClassLevels()
  } catch (error) {
    console.error('Error loading class levels:', error)
    uiStore.addToast({ title: 'Error', message: 'Failed to load class levels. Please check your connection.', variant: 'error' })
  }
})

const closeModal = () => {
  showModal.value = false
  selectedClassLevel.value = null
}

const openModal = (classLevel) => {
  selectedClassLevel.value = classLevel
  showModal.value = true
}

const validate = () => {
  errors.name = form.name ? '' : 'Class level name is required.'
  return !errors.name
}

const submit = async () => {
  if (!validate()) return
  const savedClassLevel = await classLevelsStore.saveClassLevel({ ...form })
  uiStore.addToast({ title: 'Class level saved', message: 'Class level configuration was updated.', variant: 'success' })
  // Load arms count for new/updated class level
  await loadArmsCount(savedClassLevel.id)
  Object.assign(form, { id: null, name: '' })
}

const editClassLevel = (classLevel) => {
  form.id = classLevel.id
  form.name = classLevel.name
  openModal(classLevel)
}

const deleteClassLevel = async (id) => {
  if (!confirm('Are you sure you want to delete this class level? This action cannot be undone and will also delete all associated class arms.')) {
    return
  }
  
  deleteLoading.value = new Set([...deleteLoading.value, id])
  
  try {
    await classLevelsStore.deleteClassLevel(id)
    uiStore.addToast({ title: 'Class level deleted', message: 'Class level has been deleted.', variant: 'success' })
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to delete class level.', variant: 'error' })
  } finally {
    deleteLoading.value = new Set([...deleteLoading.value].filter(loadingId => loadingId !== id))
  }
}

const submitClassLevel = async (classLevelData) => {
  try {
    const payload = {
      name: classLevelData.name
    }
    
    if (classLevelData.id) {
      await classLevelsStore.updateClassLevel(classLevelData.id, payload)
    } else {
      await classLevelsStore.createClassLevel(payload)
    }
    
    closeModal()
    uiStore.addToast({ title: 'Class level saved', message: 'Class level has been saved successfully.', variant: 'success' })
  } catch (error) {
    console.error('Class level form error:', error)
    uiStore.addToast({ title: 'Error', message: 'Failed to save class level.', variant: 'error' })
  }
}

const getArmsCount = (classLevel) => {
  return classLevel.class_arms_count || 0
}

</script>
