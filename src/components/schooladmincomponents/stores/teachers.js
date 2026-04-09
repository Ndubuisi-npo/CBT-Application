import { defineStore } from 'pinia'
import { getTeachers, saveTeacher, deleteTeacher } from '../services/api/teachers'

export const useSchoolAdminTeachersStore = defineStore('school-admin-teachers', {
  state: () => ({
    teachers: [],
    loading: false,
  }),
  getters: {
    teacherNames(state) {
      return state.teachers.map((teacher) => teacher.name)
    },
  },
  actions: {
    async fetchTeachers() {
      this.loading = true
      try {
        this.teachers = await getTeachers()
      } finally {
        this.loading = false
      }
    },
    async saveTeacher(payload) {
      const record = await saveTeacher(payload)
      const exists = this.teachers.some((item) => item.id === record.id)
      this.teachers = exists
        ? this.teachers.map((item) => (item.id === record.id ? record : item))
        : [record, ...this.teachers]
    },
    async deleteTeacher(id) {
      await deleteTeacher(id)
      this.teachers = this.teachers.filter((item) => item.id !== id)
    },
  },
})
