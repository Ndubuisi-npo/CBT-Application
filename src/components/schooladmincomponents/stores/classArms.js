import { defineStore } from 'pinia'
import { apiFetch } from '../../../js/lib/api'
import { assignClassArmTeacher } from '../services/api/classes'

export const useSchoolAdminClassArmsStore = defineStore('school-admin-class-arms', {
  state: () => ({
    classArms: [],
    loading: false,
  }),
  actions: {
    async fetchClassArms(classLevelId) {
      this.loading = true
      try {
        const data = await apiFetch(`/api/class-levels/${classLevelId}/arms`)
        this.classArms = data || []
      } finally {
        this.loading = false
      }
    },
    async saveClassArm(classLevelId, payload) {
      const record = await apiFetch(
        payload.id
          ? `/api/class-levels/${classLevelId}/arms/${payload.id}`
          : `/api/class-levels/${classLevelId}/arms`,
        {
          method: payload.id ? 'PATCH' : 'POST',
          body: JSON.stringify({ name: payload.name }),
        }
      )

      const exists = this.classArms.some((item) => item.id === record.id)
      this.classArms = exists
        ? this.classArms.map((item) => (item.id === record.id ? record : item))
        : [record, ...this.classArms]
    },
    async deleteClassArm(classLevelId, id) {
      await apiFetch(`/api/class-levels/${classLevelId}/arms/${id}`, {
        method: 'DELETE',
      })
      this.classArms = this.classArms.filter((item) => item.id !== id)
    },
    async assignTeacher(classLevelId, id, payload) {
      const record = await assignClassArmTeacher(classLevelId, id, payload)

      if (record?.id) {
        this.classArms = this.classArms.map((item) => (item.id === record.id ? record : item))
      }

      return record
    },
  },
})
