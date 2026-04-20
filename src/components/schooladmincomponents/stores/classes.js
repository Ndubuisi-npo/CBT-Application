import { defineStore } from 'pinia'
import { getClasses, saveClass, deleteClass } from '../services/api/classes'

export const useSchoolAdminClassesStore = defineStore('school-admin-classes', {
  state: () => ({
    classes: [],
    loading: false,
  }),
  actions: {
    async fetchClasses() {
      this.loading = true
      try {
        const rawClasses = await getClasses()
        // Use the API data directly without transformations
        this.classes = rawClasses
      } catch (error) {
        this.classes = []
      } finally {
        this.loading = false
      }
    },
    async saveClass(payload) {
      const record = await saveClass(payload)
      const exists = this.classes.some((item) => item.id === record.id)
      this.classes = exists
        ? this.classes.map((item) => (item.id === record.id ? record : item))
        : [record, ...this.classes]
    },
    async deleteClass(id) {
      await deleteClass(id)
      this.classes = this.classes.filter((item) => item.id !== id)
    },
  },
})
