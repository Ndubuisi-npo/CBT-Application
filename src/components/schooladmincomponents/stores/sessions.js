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
  console.log('Normalizing session:', session)
  const current = session.current ?? session.is_current ?? (session.status === 'Active' || session.status === 'Current')
  const status = session.status ?? (session.current ? 'Current' : 'Not current')
  console.log('Session normalization result:', { current, status })
  return {
    ...session,
    current,
    status,
  }
}

const normalizeTerm = (term) => {
  console.log('Normalizing term:', term)
  const current = term.current ?? term.is_current ?? (term.status === 'Active' || term.status === 'Current')
  const status = term.status ?? (term.current ? 'Current' : 'Not current')
  console.log('Term normalization result:', { current, status })
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
        console.log('Raw sessions data from API:', data)
        const normalizedSessions = (data || []).map(normalizeSession)
        console.log('Normalized sessions:', normalizedSessions)
        console.log('Session statuses:', normalizedSessions.map(s => ({ id: s.id, name: s.name, current: s.current, status: s.status })))
        this.sessions = normalizedSessions
        console.log('Store sessions after update:', this.sessions)
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
      console.log('Activating session:', id)
      console.log('Before activation - current sessions:', this.sessions.filter(s => s.current))
      try {
        await activateSessionAPI(id)
        console.log('Session activation successful, refetching sessions...')
        // Refetch sessions to get updated current status from backend
        await this.fetchSessions()
        console.log('After activation - current sessions:', this.sessions.filter(s => s.current))
        console.log('Sessions refetched after activation')
      } catch (error) {
        console.error('Error activating session:', error)
        throw error
      }
    },
    async fetchTerms(sessionId) {
      try {
        const data = await getTerms(sessionId)
        console.log('Fetched terms for session', sessionId, ':', data)
        const normalizedTerms = data.map(normalizeTerm)
        console.log('Normalized terms:', normalizedTerms)
        this.terms[sessionId] = normalizedTerms
      } catch (error) {
        console.error('Failed to fetch terms:', error)
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
      console.log('Activating term:', termId, 'for session:', sessionId)
      try {
        await activateTermAPI(sessionId, termId)
        console.log('Term activation successful, refetching terms...')
        // Refetch terms to get updated current status from backend
        await this.fetchTerms(sessionId)
        console.log('Terms refetched after activation')
      } catch (error) {
        console.error('Error activating term:', error)
        throw error
      }
    },
  },
})
