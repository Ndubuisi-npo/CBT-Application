import { defineStore } from 'pinia'
import { getSubjects, saveSubject } from '../services/api/subjects'

export const useSchoolAdminSubjectsStore = defineStore('school-admin-subjects', {
  state: () => ({
    subjects: [],
    loading: false,
  }),
  actions: {
    async fetchSubjects() {
      this.loading = true
      try {
        this.subjects = await getSubjects()
      } finally {
        this.loading = false
      }
    },
    async saveSubject(payload) {
      const record = await saveSubject(payload)
      const exists = this.subjects.some((item) => item.id === record.id)
      this.subjects = exists ? this.subjects.map((item) => (item.id === record.id ? record : item)) : [record, ...this.subjects]
    },
  },
})
