<template>
  <div class="space-y-6">
    <SectionCard :title="`Class Arms for ${classLevel?.name || '...'}`" subtitle="Manage class arms (e.g., JSS 1A, JSS 1B).">
      <template #header>
        <AppButton @click="openModal()" :icon="Plus" text="Create" variant="primary" size="sm" />
      </template>
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
                    <AppButton 
                      text="Delete" 
                      @click="deleteClassArm(classArm.id)" 
                      variant="danger" 
                      size="xs"
                      loadingText="Deleting..."
                      :processing="deleteLoading.has(classArm.id)"
                      :disabled="deleteLoading.has(classArm.id)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <ClassArmModal 
      :show="showModal" 
      :classArm="selectedClassArm"
      @close="closeModal"
      @submit="submitClassArm"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import AppButton from '../../shared/AppButton.vue'
import ClassArmModal from '../components/ClassArmModal.vue'
import { Plus } from 'lucide-vue-next'
import { useSchoolAdminClassArmsStore } from '../stores/classArms'
import { useSchoolAdminClassLevelsStore } from '../stores/classLevels'
import { useSchoolAdminUiStore } from '../stores/ui'

const route = useRoute()
const headings = ['Class Arm Name', 'Class Level', 'Actions']
const classLevelsStore = useSchoolAdminClassLevelsStore()
const classArmsStore = useSchoolAdminClassArmsStore()
const uiStore = useSchoolAdminUiStore()

// Modal state
const showModal = ref(false)
const selectedClassArm = ref(null)

// Loading states
const deleteLoading = ref(new Set())

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

// Modal functions
const openModal = () => {
  selectedClassArm.value = null
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedClassArm.value = null
}

const editClassArm = (classArm) => {
  selectedClassArm.value = classArm
  showModal.value = true
}

const submitClassArm = async (classArmData) => {
  try {
    if (classArmData.id) {
      // Update existing class arm
      await classArmsStore.saveClassArm(classLevelId.value, {
        id: classArmData.id,
        name: classArmData.name
      })
      uiStore.addToast({ title: 'Class arm updated', message: 'Class arm has been updated.', variant: 'success' })
    } else {
      // Create new class arm
      await classArmsStore.saveClassArm(classLevelId.value, {
        name: classArmData.name
      })
      uiStore.addToast({ title: 'Class arm created', message: 'Class arm has been created.', variant: 'success' })
    }
    
    closeModal()
    await classArmsStore.fetchClassArms(classLevelId.value) // Refresh to get updated list
  } catch (error) {
    console.error('Class arm error:', error)
    uiStore.addToast({ title: 'Error', message: error.message || 'Failed to save class arm.', variant: 'error' })
  }
}

const deleteClassArm = async (id) => {
  if (!confirm('Are you sure you want to delete this class arm? This action cannot be undone.')) {
    return
  }
  
  deleteLoading.value = new Set([...deleteLoading.value, id])
  
  try {
    await classArmsStore.deleteClassArm(classLevelId.value, id)
    uiStore.addToast({ title: 'Class arm deleted', message: 'Class arm has been deleted.', variant: 'success' })
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to delete class arm.', variant: 'error' })
  } finally {
    deleteLoading.value = new Set([...deleteLoading.value].filter(loadingId => loadingId !== id))
  }
}
</script>
