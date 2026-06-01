/**
 * School Admin Assessments Store
 *
 * REFACTOR: School Admin has been completely removed from the exam workflow.
 *
 * REMOVED:
 * - createAssessment / updateAssessment / deleteAssessment actions
 * - publishAssessment action
 * - endAssessment action
 * - randomizeAssessment action
 * - All state transitions (draft→submitted, submitted→approved, etc.)
 * - localStorage persistence of assessment data
 * - Lifecycle action methods
 *
 * This store is now READ-ONLY for school admin and is ONLY used
 * by teacher components that previously depended on it.
 *
 * Teacher exam management is handled entirely by:
 *   src/components/teacherscomponent/stores/exams.js
 *
 * This file is retained only to avoid breaking existing teacher
 * components that import from it (ExamList.vue, etc.) until those
 * components are fully migrated to use useTeacherExamsStore.
 *
 * TODO: After completing migration, delete this store and remove
 * all imports of useSchoolAdminAssessmentsStore from teacher components.
 */

import { defineStore } from 'pinia'

export const useSchoolAdminAssessmentsStore = defineStore('school-admin-assessments', {
  state: () => ({
    // Empty — school admin has no exam data to manage
    assessments: [],
    loading: false,
    error: null,
  }),

  getters: {
    totalAssessments: (state) => state.assessments.length,
    liveAssessments: (state) =>
      state.assessments.filter((a) => (a.status || '').toLowerCase() === 'active').length,
  },

  actions: {
    /**
     * School Admin can READ exam list for reporting purposes only.
     * No create/edit/delete/lifecycle actions.
     */
    async fetchAssessments() {
      // School admin has read access to exam list for dashboard stats only.
      // All write operations are forbidden for this role.
      this.loading = true
      this.error = null
      try {
        const { apiFetch } = await import('../../../js/lib/api')
        const response = await apiFetch('/api/exams')
        const data = Array.isArray(response) ? response : (response?.data || [])
        this.assessments = data
      } catch (err) {
        this.error = err?.message || 'Failed to load assessments.'
        // Don't throw — read-only failure is non-critical for admin dashboard
        this.assessments = []
      } finally {
        this.loading = false
      }
    },

    async fetchAssessmentDetails(id) {
      try {
        const { apiFetch } = await import('../../../js/lib/api')
        const response = await apiFetch(`/api/exams/${id}`)
        return response
      } catch {
        return null
      }
    },
  },
})
