import { defineStore } from 'pinia'
import { getTerms, saveTerm } from '../services/api/terms'

export const useSchoolAdminTermsStore = defineStore('school-admin-terms', {
  state: () => ({
    terms: [],
    loading: false,
  }),
  actions: {
    async fetchTerms() {
      this.loading = true
      try {
        this.terms = await getTerms()
      } finally {
        this.loading = false
      }
    },
    async saveTerm(payload) {
      const record = await saveTerm(payload)
      const exists = this.terms.some((item) => item.id === record.id)
      this.terms = exists ? this.terms.map((item) => (item.id === record.id ? record : item)) : [record, ...this.terms]
    },
  },
})
