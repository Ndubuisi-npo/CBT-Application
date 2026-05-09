<template>
  <div class="space-y-6">
    <SectionCard title="Grading System" subtitle="Configure grade ranges and names for student assessments.">
      <div class="space-y-6">
        <!-- Grade Range Configuration -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-medium text-slate-700">Grade Ranges</h4>
            <AppButton 
              @click="addNewGrade" 
              :icon="Plus" 
              text="Add Grade" 
              variant="outline" 
              size="sm"
            />
          </div>
          
          <!-- Dynamic Grade List -->
          <div class="space-y-3">
            <div 
              v-for="(grade, index) in gradingSystem.grades" 
              :key="grade.id"
              class="border border-slate-200 rounded-lg p-4 bg-white"
            >
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <!-- Grade Name -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-slate-700">Grade Name</label>
                  <input 
                    v-model="grade.name" 
                    type="text" 
                    class="sa-input" 
                    placeholder="e.g., A, Excellent"
                  />
                </div>

                <!-- Min Score -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-slate-700">Minimum Score</label>
                  <div class="flex items-center gap-2">
                    <input 
                      v-model="grade.min" 
                      type="number" 
                      class="sa-input w-20" 
                      placeholder="Min"
                      min="0"
                      max="100"
                    />
                    <span class="text-sm text-slate-500">%</span>
                  </div>
                </div>

                <!-- Max Score -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-slate-700">Maximum Score</label>
                  <div class="flex items-center gap-2">
                    <input 
                      v-model="grade.max" 
                      type="number" 
                      class="sa-input w-20" 
                      placeholder="Max"
                      min="0"
                      max="100"
                    />
                    <span class="text-sm text-slate-500">%</span>
                  </div>
                </div>

                <!-- Remove Button -->
                <div class="flex gap-2">
                  <AppButton 
                    v-if="gradingSystem.grades.length > 1"
                    @click="removeGrade(index)" 
                    :icon="X" 
                    variant="danger" 
                    size="sm"
                    text="Remove"
                  />
                </div>
              </div>
              
              <!-- Error Display -->
              <div v-if="errors[`grade_${index}`]" class="text-sm text-red-600 mt-2">
                {{ errors[`grade_${index}`] }}
              </div>
            </div>
          </div>
        </div>

        <!-- Preview Section -->
        <div class="border-t pt-6">
          <h4 class="text-sm font-medium text-slate-700 mb-4">Grade Preview</h4>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div 
              v-for="(grade, index) in gradingSystem.grades" 
              :key="grade.id"
              class="text-center p-3 rounded-lg border"
              :class="getGradeColorClass(index)"
            >
              <div class="text-lg font-bold">{{ grade.name }}</div>
              <div class="text-sm">{{ grade.min }}% - {{ grade.max }}%</div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-4 border-t">
          <AppButton 
            @click="saveGradingSystem" 
            text="Save Grading System" 
            variant="primary"
            :loadingText="'Saving...'"
            :processing="loading"
            :disabled="loading"
          />
          <AppButton 
            @click="resetToDefaults" 
            text="Reset to Defaults" 
            variant="outline"
            :disabled="loading"
          />
        </div>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import SectionCard from './SectionCard.vue'
import AppButton from '../../shared/AppButton.vue'
import { useSchoolAdminUiStore } from '../stores/ui'

const uiStore = useSchoolAdminUiStore()

const loading = ref(false)
let nextGradeId = 1

const gradingSystem = reactive({
  grades: [
    { id: 1, name: 'A', min: 90, max: 100 },
    { id: 2, name: 'B', min: 80, max: 89 },
    { id: 3, name: 'C', min: 70, max: 79 },
    { id: 4, name: 'D', min: 60, max: 69 },
    { id: 5, name: 'F', min: 0, max: 59 }
  ]
})

const errors = reactive({})

const resetErrors = () => {
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
}

const getGradeColorClass = (index) => {
  const colors = [
    'bg-green-50 border-green-200 text-green-700',
    'bg-blue-50 border-blue-200 text-blue-700', 
    'bg-yellow-50 border-yellow-200 text-yellow-700',
    'bg-orange-50 border-orange-200 text-orange-700',
    'bg-red-50 border-red-200 text-red-700',
    'bg-purple-50 border-purple-200 text-purple-700',
    'bg-indigo-50 border-indigo-200 text-indigo-700',
    'bg-pink-50 border-pink-200 text-pink-700'
  ]
  return colors[index % colors.length]
}

const addNewGrade = () => {
  const newGrade = {
    id: ++nextGradeId,
    name: '',
    min: 0,
    max: 0
  }
  gradingSystem.grades.push(newGrade)
}

const removeGrade = (index) => {
  if (gradingSystem.grades.length > 1) {
    gradingSystem.grades.splice(index, 1)
  }
}

const validateGradingSystem = () => {
  resetErrors()
  let isValid = true

  gradingSystem.grades.forEach((grade, index) => {
    const errorKey = `grade_${index}`
    
    // Validate grade name
    if (!grade.name || grade.name.trim() === '') {
      errors[errorKey] = 'Grade name is required'
      isValid = false
      return
    }

    // Validate min/max values
    if (grade.min < 0 || grade.min > 100) {
      errors[errorKey] = 'Minimum score must be between 0 and 100'
      isValid = false
      return
    }
    
    if (grade.max < 0 || grade.max > 100) {
      errors[errorKey] = 'Maximum score must be between 0 and 100'
      isValid = false
      return
    }
    
    if (grade.min >= grade.max) {
      errors[errorKey] = 'Minimum score must be less than maximum score'
      isValid = false
      return
    }

    // Check for overlapping ranges
    const hasOverlap = gradingSystem.grades.some((otherGrade, otherIndex) => {
      if (index !== otherIndex) {
        return (grade.min <= otherGrade.max && grade.max >= otherGrade.min)
      }
      return false
    })
    
    if (hasOverlap) {
      errors[errorKey] = 'Grade range overlaps with another grade'
      isValid = false
      return
    }
  })

  return isValid
}

const resetToDefaults = () => {
  gradingSystem.grades = [
    { id: 1, name: 'A', min: 90, max: 100 },
    { id: 2, name: 'B', min: 80, max: 89 },
    { id: 3, name: 'C', min: 70, max: 79 },
    { id: 4, name: 'D', min: 60, max: 69 },
    { id: 5, name: 'F', min: 0, max: 59 }
  ]
  nextGradeId = 5
  resetErrors()
}

const saveGradingSystem = async () => {
  if (!validateGradingSystem()) {
    return
  }

  loading.value = true

  try {
    // This would need an API endpoint to save grading system
    // For now, we'll simulate saving and show success message
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    
    uiStore.addToast({ 
      title: 'Grading System Saved', 
      message: 'Grade ranges and names have been successfully updated.', 
      variant: 'success' 
    })
  } catch (error) {
    uiStore.addToast({ 
      title: 'Error', 
      message: error.message || 'Failed to save grading system. Please try again.', 
      variant: 'error' 
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Load existing grading system settings from API when component mounts
  // For now, using default values
  nextGradeId = 5
})
</script>
