import { defineStore } from 'pinia'
import {
  activateSession as activateSessionAPI,
  activateTerm as activateTermAPI,
  deleteSession,
  deleteTerm,
  getSessions,
  getTerms,
  saveSession as saveSessionAPI,
  updateSession as updateSessionAPI,
  createSession as createSessionAPI,
  saveTerm as saveTermAPI,
} from '../services/api/sessions'

const normalizeSession = (session) => {
  const current = session.current ?? session.is_current ?? (session.status === 'Active' || session.status === 'Current')
  const status = session.status ?? (session.current ? 'Current' : 'Not current')
  return {
    ...session,
    current,
    status,
  }
}

const normalizeTerm = (term) => {
  const current = term.current ?? term.is_current ?? (term.status === 'Active' || term.status === 'Current')
  const status = term.status ?? (term.current ? 'Current' : 'Not current')
  return {
    ...term,
    current,
    status,
  }
}

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
        const data = await getSessions()
        const normalizedSessions = (data || []).map(normalizeSession)
        this.sessions = normalizedSessions
      } finally {
        this.loading = false
      }
    },
    async saveSession(payload) {
      const record = normalizeSession(await saveSessionAPI(payload))
      const exists = this.sessions.some((item) => item.id === record.id)
      this.sessions = exists
        ? this.sessions.map((item) => (item.id === record.id ? record : item))
        : [record, ...this.sessions]
    },
    async updateSession(id, payload) {
      const record = normalizeSession(await updateSessionAPI(id, payload))
      this.sessions = this.sessions.map((item) => (item.id === record.id ? record : item))
      return record
    },
    async createSession(payload) {
      const record = normalizeSession(await createSessionAPI(payload))
      this.sessions = [record, ...this.sessions]
      return record
    },
    async deleteSession(id) {
      await deleteSession(id)
      this.sessions = this.sessions.filter((item) => item.id !== id)
    },
    async activateSession(id) {
      try {
        await activateSessionAPI(id)
        // Refetch sessions to get updated current status from backend
        await this.fetchSessions()
      } catch (error) {
        throw error
      }
    },
    async fetchTerms(sessionId) {
      try {
        const data = await getTerms(sessionId)
        const normalizedTerms = data.map(normalizeTerm)
        this.terms[sessionId] = normalizedTerms
      } catch (error) {
      }
    },
    async saveTerm(sessionId, payload) {
      const record = normalizeTerm(await saveTermAPI(sessionId, payload))
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
      try {
        await activateTermAPI(sessionId, termId)
        // Refetch terms to get updated current status from backend
        await this.fetchTerms(sessionId)
      } catch (error) {
        throw error
      }
    },
  },
})
