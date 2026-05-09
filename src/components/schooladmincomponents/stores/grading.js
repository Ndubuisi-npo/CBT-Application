import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { gradingApi } from '../services/api/grading'

export const useSchoolAdminGradingStore = defineStore('schoolAdminGrading', () => {
  // State
  const gradingScales = ref([])
  const currentGradingScale = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Actions
  const fetchGradingScales = async () => {
    loading.value = true
    error.value = null
    
    try {
      const data = await gradingApi.getGradingScales()
      gradingScales.value = data
      return data
    } catch (err) {
      error.value = err.message || 'Failed to fetch grading scales'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchGradingScale = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const data = await gradingApi.getGradingScale(id)
      currentGradingScale.value = data
      return data
    } catch (err) {
      error.value = err.message || 'Failed to fetch grading scale'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createGradingScale = async (gradingData) => {
    loading.value = true
    error.value = null
    
    try {
      const data = await gradingApi.createGradingScale(gradingData)
      gradingScales.value.push(data)
      currentGradingScale.value = data
      return data
    } catch (err) {
      error.value = err.message || 'Failed to create grading scale'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateGradingScale = async (id, gradingData) => {
    loading.value = true
    error.value = null
    
    try {
      const data = await gradingApi.updateGradingScale(id, gradingData)
      
      // Update the grading scale in the array
      const index = gradingScales.value.findIndex(scale => scale.id === id)
      if (index !== -1) {
        gradingScales.value[index] = data
      }
      
      // Update current grading scale if it's the one being updated
      if (currentGradingScale.value?.id === id) {
        currentGradingScale.value = data
      }
      
      return data
    } catch (err) {
      error.value = err.message || 'Failed to update grading scale'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteGradingScale = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      await gradingApi.deleteGradingScale(id)
      
      // Remove from grading scales array
      gradingScales.value = gradingScales.value.filter(scale => scale.id !== id)
      
      // Clear current grading scale if it's the one being deleted
      if (currentGradingScale.value?.id === id) {
        currentGradingScale.value = null
      }
      
      return true
    } catch (err) {
      error.value = err.message || 'Failed to delete grading scale'
      throw err
    } finally {
      loading.value = false
    }
  }

  const setCurrentGradingScale = (scale) => {
    currentGradingScale.value = scale
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    gradingScales,
    currentGradingScale,
    loading,
    error,
    
    // Actions
    fetchGradingScales,
    fetchGradingScale,
    createGradingScale,
    updateGradingScale,
    deleteGradingScale,
    setCurrentGradingScale,
    clearError
  }
})
