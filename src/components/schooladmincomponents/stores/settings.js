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
      // Only send the specific fields we want to update to avoid duplicates
      const cleanPayload = {
        ca_weight: payload.caWeight?.toString() || payload.ca_weight,
        exam_weight: payload.examWeight?.toString() || payload.exam_weight,
        school_name: payload.schoolName || payload.school_name,
        terms_per_session: payload.termsPerSession || payload.terms_per_session,
        result_approval_required: payload.resultApprovalRequired || payload.result_approval_required,
        allow_result_viewing: payload.allowResultViewing || payload.allow_result_viewing
      }
      
      // Remove undefined values
      Object.keys(cleanPayload).forEach(key => {
        if (cleanPayload[key] === undefined) {
          delete cleanPayload[key]
        }
      })
      
      this.settings = await saveSettings(cleanPayload)
    },
  },
})
