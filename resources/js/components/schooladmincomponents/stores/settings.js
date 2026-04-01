import { defineStore } from 'pinia'
import { getSettings, saveSettings } from '../services/api/settings'

export const useSchoolAdminSettingsStore = defineStore('school-admin-settings', {
  state: () => ({
    settings: {
      gradingScale: [],
      caWeight: 40,
      examWeight: 60,
    },
    loading: false,
  }),
  actions: {
    async fetchSettings() {
      this.loading = true
      try {
        this.settings = await getSettings()
      } finally {
        this.loading = false
      }
    },
    async saveSettings(payload) {
      this.settings = await saveSettings(payload)
    },
  },
})
