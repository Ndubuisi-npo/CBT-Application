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

const normalizeSession = (session) => ({
  ...session,
  current: session.current ?? session.status === 'Active',
  status: session.status ?? (session.current ? 'Active' : 'Inactive'),
})

const normalizeTerm = (term) => ({
  ...term,
  current: term.current ?? term.status === 'Active',
  status: term.status ?? (term.current ? 'Active' : 'Inactive'),
})

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
        console.log('Fetched sessions:', data)
        this.sessions = (data || []).map(normalizeSession)
      } finally {
        this.loading = false
      }
    },
    async saveSession(payload) {
      const record = normalizeSession(await saveSession(payload))
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
        current: item.id === id,
        status: item.id === id ? 'Active' : 'Inactive',
      }))
    },
    async fetchTerms(sessionId) {
      try {
        this.terms[sessionId] = (await getTerms(sessionId)).map(normalizeTerm)
      } catch (error) {
        console.error('Failed to fetch terms:', error)
      }
    },
    async saveTerm(sessionId, payload) {
      const record = normalizeTerm(await saveTerm(sessionId, payload))
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
          current: item.id === termId,
          status: item.id === termId ? 'Active' : 'Inactive',
        }))
      }
    },
  },
})
