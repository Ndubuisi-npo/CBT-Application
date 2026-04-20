import { defineStore } from 'pinia'
import {
  getClassLevels,
  saveClassLevel,
  updateClassLevel,
  createClassLevel,
  deleteClassLevel,
} from '../services/api/classes'

export const useSchoolAdminClassLevelsStore = defineStore('school-admin-class-levels', {
  state: () => ({
    classLevels: [],
    loading: false,
  }),
  actions: {
    async fetchClassLevels() {
      this.loading = true
      try {
        const data = await getClassLevels()
        this.classLevels = data || []
      } finally {
        this.loading = false
      }
    },
    async saveClassLevel(payload) {
      const record = await saveClassLevel(payload)
      const exists = this.classLevels.some((item) => item.id === record.id)
      this.classLevels = exists
        ? this.classLevels.map((item) => (item.id === record.id ? record : item))
        : [record, ...this.classLevels]
    },
    async updateClassLevel(id, payload) {
      const record = await updateClassLevel(id, payload)
      this.classLevels = this.classLevels.map((item) => (item.id === record.id ? record : item))
      return record
    },
    async createClassLevel(payload) {
      const record = await createClassLevel(payload)
      this.classLevels = [record, ...this.classLevels]
      return record
    },
    async deleteClassLevel(id) {
      await deleteClassLevel(id)
      this.classLevels = this.classLevels.filter((item) => item.id !== id)
    },
  },
})
