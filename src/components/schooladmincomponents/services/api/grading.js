import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'

export const gradingApi = {
  // Get all grading scales
  async getGradingScales() {
    try {
      return await apiFetch('/api/grading-scales')
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Unable to fetch grading scales.'))
    }
  },

  // Get a specific grading scale
  async getGradingScale(id) {
    try {
      return await apiFetch(`/api/grading-scales/${id}`)
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Unable to fetch grading scale.'))
    }
  },

  // Create a new grading scale
  async createGradingScale(gradingData) {
    try {
      return await apiFetch('/api/grading-scales', {
        method: 'POST',
        body: JSON.stringify({
          grades: gradingData.grades
        })
      })
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Unable to create grading scale.'))
    }
  },

  // Update a grading scale
  async updateGradingScale(id, gradingData) {
    try {
      return await apiFetch(`/api/grading-scales/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          grades: gradingData.grades
        })
      })
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Unable to update grading scale.'))
    }
  },

  // Delete a grading scale
  async deleteGradingScale(id) {
    try {
      return await apiFetch(`/api/grading-scales/${id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Unable to delete grading scale.'))
    }
  }
}
