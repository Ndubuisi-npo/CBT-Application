import { defineStore } from 'pinia'
import { getClassLevels, getClassArms, saveClassArm, deleteClassArm } from '../services/api/classes'

export const useSchoolAdminClassesStore = defineStore('school-admin-classes', {
  state: () => ({
    classes: [],
    classLevels: [],
    classArms: {},
    loading: false,
  }),
  actions: {
    async fetchClasses() {
      this.loading = true
      try {
        this.classLevels = await getClassLevels()
        this.classes = this.classLevels // Alias for compatibility
      } catch (error) {
        console.error('Failed to fetch classes:', error)
      } finally {
        this.loading = false
      }
    },
    async fetchClassLevels() {
      this.loading = true
      try {
        this.classLevels = await getClassLevels()
      } catch (error) {
        console.error('Failed to fetch class levels:', error)
      } finally {
        this.loading = false
      }
    },
    async fetchClassArms(classLevelId) {
      try {
        this.classArms[classLevelId] = await getClassArms(classLevelId)
      } catch (error) {
        console.error('Failed to fetch class arms:', error)
      }
    },
    async saveClassArm(classLevelId, payload) {
      const record = await saveClassArm(classLevelId, payload)
      if (!this.classArms[classLevelId]) {
        this.classArms[classLevelId] = []
      }
      const exists = this.classArms[classLevelId].some((item) => item.id === record.id)
      this.classArms[classLevelId] = exists
        ? this.classArms[classLevelId].map((item) => (item.id === record.id ? record : item))
        : [record, ...this.classArms[classLevelId]]
    },
    async deleteClassArm(classLevelId, armId) {
      await deleteClassArm(classLevelId, armId)
      if (this.classArms[classLevelId]) {
        this.classArms[classLevelId] = this.classArms[classLevelId].filter((item) => item.id !== armId)
      }
    },
    async saveClass(payload) {
      // For now, just add to classes array (no API call)
      if (payload.id) {
        const index = this.classes.findIndex((item) => item.id === payload.id)
        if (index !== -1) {
          this.classes[index] = payload
        }
      } else {
        this.classes.push({ ...payload, id: Date.now() })
      }
    },
  },
})
