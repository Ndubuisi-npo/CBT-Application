import { defineStore } from 'pinia'
import { getSubjects, saveSubject, deleteSubject, assignTeacher, removeAssignment } from '../services/api/subjects'

export const useSchoolAdminSubjectsStore = defineStore('school-admin-subjects', {
  state: () => ({
    subjects: [],
    loading: false,
  }),
  actions: {
    async fetchSubjects() {
      this.loading = true
      try {
        const data = await getSubjects()
        console.log('Fetched subjects:', data)
        this.subjects = Array.isArray(data) ? data : []
        console.log('Subjects set to:', this.subjects)
        console.log('Subject structure:', this.subjects[0])
      } catch (error) {
        console.error('Error fetching subjects:', error)
        this.subjects = []
        // Don't throw the error, just log it and continue with empty subjects
        // The UI component will handle showing the error message
        console.error('Subjects API Error Details:', {
          status: error.status,
          message: error.message,
          data: error.data
        })
      } finally {
        this.loading = false
      }
    },
    async saveSubject(payload) {
      const record = await saveSubject(payload)
      const exists = this.subjects.some((item) => item.id === record.id)
      this.subjects = exists
        ? this.subjects.map((item) => (item.id === record.id ? record : item))
        : [record, ...this.subjects]
    },
    async deleteSubject(id) {
      await deleteSubject(id)
      this.subjects = this.subjects.filter((item) => item.id !== id)
    },
    async assignTeacher(subjectId, payload) {
      return await assignTeacher(subjectId, payload)
    },
    async removeAssignment(subjectId, assignmentId) {
      return await removeAssignment(subjectId, assignmentId)
    },
  },
})
