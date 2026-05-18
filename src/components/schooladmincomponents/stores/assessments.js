import { defineStore } from 'pinia'
import { apiFetch } from '../../../js/lib/api'

const STORAGE_KEY = 'schoolAdminAssessments'

const readLocalAssessments = () => {
  if (typeof window === 'undefined') return []

  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(stored) ? stored.map(normalizeAssessment) : []
  } catch (error) {
    return []
  }
}

const writeLocalAssessments = (assessments) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assessments))
}

const apiPayload = (assessment) => ({
  title: assessment.title,
  subject: assessment.subject,
  class: assessment.className,
  class_name: assessment.className,
  term: assessment.term,
  type: assessment.type,
  purpose: assessment.purpose,
  duration: assessment.duration,
  pass_mark: assessment.passMark,
  start_time: assessment.startTime,
  end_time: assessment.endTime,
  instructions: assessment.instructions,
  status: assessment.status,
  question_ids: assessment.questions,
})

const parseDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const getEffectiveStatus = (assessment) => {
  const status = assessment.status === 'Published' ? 'Live' : assessment.status || 'Draft'
  const startTime = parseDate(assessment.startTime)
  const endTime = parseDate(assessment.endTime)
  const now = new Date()

  if (endTime && now >= endTime) return 'Completed'
  if (status === 'Scheduled' && startTime && now >= startTime) return 'Live'
  if (status === 'Live') return 'Live'
  return status
}

const normalizeAssessment = (payload) => {
  const normalizedStatus = payload.status === 'Published' ? 'Live' : payload.status || 'Draft'
  const record = {
    id: payload.id || `ASM-${Date.now()}`,
    title: payload.title || '',
    subject: payload.subject || '',
    className: payload.className || payload.class_name || payload.class || '',
    term: payload.term || '',
    type: payload.type || 'Multiple Choice',
    purpose: payload.purpose || '',
    duration: Number(payload.duration || 60),
    passMark: Number(payload.passMark || payload.pass_mark || 50),
    startTime: payload.startTime || payload.start_time || '',
    endTime: payload.endTime || payload.end_time || '',
    instructions: payload.instructions || '',
    status: normalizedStatus,
    questions: payload.questions || payload.questionIds || payload.question_ids || [],
    candidates: payload.candidates || 0,
    submitted: payload.submitted || 0,
    createdAt: payload.createdAt || payload.created_at || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return { ...record, status: getEffectiveStatus(record) }
}

export const useSchoolAdminAssessmentsStore = defineStore('school-admin-assessments', {
  state: () => ({
    assessments: readLocalAssessments(),
    loading: false,
    usingLocalFallback: false,
  }),

  getters: {
    totalAssessments: (state) => state.assessments.length,
    liveAssessments: (state) => state.assessments.filter((item) => item.status === 'Live').length,
    completedAssessments: (state) => state.assessments.filter((item) => item.status === 'Completed').length,
  },

  actions: {
    persistLocal() {
      writeLocalAssessments(this.assessments)
    },

    async fetchAssessments(params = {}) {
      this.loading = true
      try {
        const response = await apiFetch('/api/exams', { params })
        const records = Array.isArray(response) ? response : response?.data || []
        this.assessments = records.map(normalizeAssessment)
        this.refreshStatuses()
        this.usingLocalFallback = false
        this.persistLocal()
      } catch (error) {
        this.assessments = readLocalAssessments()
        this.usingLocalFallback = true
      } finally {
        this.loading = false
      }
    },

    refreshStatuses() {
      let updated = false
      const now = new Date()

      this.assessments = this.assessments.map((assessment) => {
        const nextStatus = getEffectiveStatus(assessment)
        if (nextStatus !== assessment.status) {
          updated = true
          return { ...assessment, status: nextStatus, updatedAt: now.toISOString() }
        }
        return assessment
      })

      if (updated) {
        this.persistLocal()
      }
    },

    async publishAssessment(id) {
      const assessment = this.assessments.find((item) => String(item.id) === String(id))
      if (!assessment) {
        throw new Error('Assessment was not found.')
      }

      const updatedAssessment = {
        ...assessment,
        status: 'Live',
        startTime: assessment.startTime || new Date().toISOString(),
      }

      return this.saveAssessment(updatedAssessment)
    },

    async saveAssessment(payload) {
      const assessment = normalizeAssessment(payload)
      const exists = this.assessments.some((item) => item.id === assessment.id)

      try {
        const response = exists
          ? await apiFetch(`/api/exams/${assessment.id}`, {
              method: 'PATCH',
              body: JSON.stringify(apiPayload(assessment)),
            })
          : await apiFetch('/api/exams', {
              method: 'POST',
              body: JSON.stringify(apiPayload(assessment)),
            })

        const record = normalizeAssessment(response)
        this.assessments = exists
          ? this.assessments.map((item) => (item.id === record.id ? record : item))
          : [record, ...this.assessments]
        this.usingLocalFallback = false
        this.persistLocal()
        return record
      } catch (error) {
        this.assessments = exists
          ? this.assessments.map((item) => (item.id === assessment.id ? assessment : item))
          : [assessment, ...this.assessments]
        this.usingLocalFallback = true
        this.persistLocal()
        return assessment
      }
    },

    async deleteAssessment(id) {
      this.assessments = this.assessments.filter((item) => item.id !== id)
      this.persistLocal()

      try {
        await apiFetch(`/api/exams/${id}`, { method: 'DELETE' })
        this.usingLocalFallback = false
      } catch (error) {
        this.usingLocalFallback = true
      }
    },

    async addQuestionsToAssessment(id, questionIds) {
      const assessment = this.assessments.find((item) => String(item.id) === String(id))
      if (!assessment) {
        throw new Error('Assessment was not found.')
      }

      const mergedQuestions = [...new Set([...(assessment.questions || []), ...questionIds])]
      const updated = { ...assessment, questions: mergedQuestions }
      await this.saveAssessment(updated)
      return updated
    },
  },
})
