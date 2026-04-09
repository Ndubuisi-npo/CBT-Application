import { defineStore } from 'pinia'
import {
  activateSession,
  activateTerm,
  deleteSession,
  deleteTerm,
  getSessions,
  getTerms,
  saveSession,
  saveTerm,
} from '../services/api/sessions'

export const useSchoolAdminSessionsStore = defineStore('school-admin-sessions', {
  state: () => ({
    sessions: [],
    terms: {},
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
      this.sessions = exists
        ? this.sessions.map((item) => (item.id === record.id ? record : item))
        : [record, ...this.sessions]
    },
    async deleteSession(id) {
      await deleteSession(id)
      this.sessions = this.sessions.filter((item) => item.id !== id)
    },
    async activateSession(id) {
      await activateSession(id)
      this.sessions = this.sessions.map((item) => ({
        ...item,
        status: item.id === id ? 'Active' : 'Inactive',
      }))
    },
    async fetchTerms(sessionId) {
      try {
        this.terms[sessionId] = await getTerms(sessionId)
      } catch (error) {
        console.error('Failed to fetch terms:', error)
      }
    },
    async saveTerm(sessionId, payload) {
      const record = await saveTerm(sessionId, payload)
      if (!this.terms[sessionId]) {
        this.terms[sessionId] = []
      }
      const exists = this.terms[sessionId].some((item) => item.id === record.id)
      this.terms[sessionId] = exists
        ? this.terms[sessionId].map((item) => (item.id === record.id ? record : item))
        : [record, ...this.terms[sessionId]]
    },
    async deleteTerm(sessionId, termId) {
      await deleteTerm(sessionId, termId)
      if (this.terms[sessionId]) {
        this.terms[sessionId] = this.terms[sessionId].filter((item) => item.id !== termId)
      }
    },
    async activateTerm(sessionId, termId) {
      await activateTerm(sessionId, termId)
      if (this.terms[sessionId]) {
        this.terms[sessionId] = this.terms[sessionId].map((item) => ({
          ...item,
          status: item.id === termId ? 'Active' : 'Inactive',
        }))
      }
    },
  },
})
