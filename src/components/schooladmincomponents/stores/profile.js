import { defineStore } from 'pinia'
import { getProfile, saveProfile } from '../services/api/profile'

export const useSchoolAdminProfileStore = defineStore('school-admin-profile', {
  state: () => ({
    profile: {
      schoolName: 'Greenfield International School',
      domain: 'greenfield.educbt.app',
      logo: '',
      address: '',
      email: '',
      phone: '',
    },
    loading: false,
  }),
  actions: {
    async fetchProfile() {
      this.loading = true
      try {
        this.profile = await getProfile()
      } finally {
        this.loading = false
      }
    },
    async saveProfile(payload) {
      this.profile = await saveProfile(payload)
    },
  },
})
