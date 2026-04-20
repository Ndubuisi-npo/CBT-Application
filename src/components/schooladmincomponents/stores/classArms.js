import { defineStore } from 'pinia'
import {
  getClassArms,
  saveClassArm,
  deleteClassArm,
} from '../services/api/classes'

export const useSchoolAdminClassArmsStore = defineStore('school-admin-class-arms', {
  state: () => ({
    classArms: [],
    loading: false,
  }),
  actions: {
    async fetchClassArms(classLevelId) {
      this.loading = true
      try {
        const data = await getClassArms(classLevelId)
        this.classArms = data || []
      } finally {
        this.loading = false
      }
    },
    async saveClassArm(classLevelId, payload) {
      const record = await saveClassArm(classLevelId, payload)
      const exists = this.classArms.some((item) => item.id === record.id)
      this.classArms = exists
        ? this.classArms.map((item) => (item.id === record.id ? record : item))
        : [record, ...this.classArms]
    },
    async deleteClassArm(classLevelId, id) {
      await deleteClassArm(classLevelId, id)
      this.classArms = this.classArms.filter((item) => item.id !== id)
    },
  },
})
