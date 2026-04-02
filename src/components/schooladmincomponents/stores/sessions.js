import { defineStore } from 'pinia'
import { activateSession, getSessions, saveSession } from '../services/api/sessions'

export const useSchoolAdminSessionsStore = defineStore('school-admin-sessions', {
  state: () => ({
    sessions: [],
    loading: false,
  }),
  actions: {
    async fetchSessions() {
      this.loading = true
      try {
        this.sessions = await getSessions()
      } finally {
        this.loading = false
      }
    },
    async saveSession(payload) {
      const record = await saveSession(payload)
      const exists = this.sessions.some((item) => item.id === record.id)
      this.sessions = exists ? this.sessions.map((item) => (item.id === record.id ? record : item)) : [record, ...this.sessions]
    },
    async activate(id) {
      this.sessions = await activateSession(id)
    },
  },
})
