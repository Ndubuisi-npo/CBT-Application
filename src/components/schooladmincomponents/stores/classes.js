import { defineStore } from 'pinia'
import { getClasses, saveClassArm } from '../services/api/classes'

export const useSchoolAdminClassesStore = defineStore('school-admin-classes', {
  state: () => ({
    classes: [],
    loading: false,
  }),
  actions: {
    async fetchClasses() {
      this.loading = true
      try {
        this.classes = await getClasses()
      } finally {
        this.loading = false
      }
    },
    async saveClass(payload) {
      const record = await saveClassArm(payload)
      const exists = this.classes.some((item) => item.id === record.id)
      this.classes = exists ? this.classes.map((item) => (item.id === record.id ? record : item)) : [record, ...this.classes]
    },
  },
})
