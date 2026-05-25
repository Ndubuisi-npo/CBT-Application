import { defineStore } from 'pinia'
import { apiFetch } from '../../../js/lib/api'
import { useSchoolAdminSubjectsStore } from './subjects'
import { useSchoolAdminClassLevelsStore } from './classLevels'
import { useSchoolAdminClassArmsStore } from './classArms'
import { useSchoolAdminSessionsStore } from './sessions'

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
  subject_id: assessment.subject_id || assessment.subject,
  class_level_id: assessment.class_level_id || assessment.className,
  class_arm_id: assessment.class_arm_id,
  term_id: assessment.term_id,
  type: assessment.type || 'assessment',
  purpose: assessment.purpose,
  duration_minutes: assessment.duration,
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
    subject: payload.subject?.name || payload.subject?.title || payload.subject?.code || payload.subject || '',
    subject_id: payload.subject_id || payload.subject?.id || '',
    className: payload.class_level?.name || payload.class_level_name || payload.class_name || payload.class || '',
    class_level_id: payload.class_level_id || payload.class_level?.id || '',
    class_arm_id: payload.class_arm_id || payload.class_arm?.id || '',
    term: payload.term?.name || payload.term?.title || payload.term_name || payload.term || '',
    term_id: payload.term_id || payload.term?.id || '',
    type: payload.type || 'assessment',
    duration: Number(payload.duration || payload.duration_minutes || 60),
    passMark: Number(payload.passMark || payload.pass_mark || 50),
    startTime: payload.startTime || payload.start_time || payload.scheduled_start || '',
    endTime: payload.endTime || payload.end_time || payload.scheduled_end || '',
    instructions: payload.instructions || '',
    questions: payload.questions || payload.questionIds || payload.question_ids || [],
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

        // Try to reuse included/nested data from the exams response to
        // populate subjects, class levels and sessions stores and avoid
        // making duplicate API calls from the UI.
        try {
          const subjectsStore = useSchoolAdminSubjectsStore()
          const classLevelsStore = useSchoolAdminClassLevelsStore()
          const classArmsStore = useSchoolAdminClassArmsStore()
          const sessionsStore = useSchoolAdminSessionsStore()

          // collect unique subjects, class levels, sessions and terms
          const subjMap = {}
          const classLevelMap = {}
          const sessionMap = {}
          const termMapBySession = {}

          records.forEach((rec) => {
            const s = rec.subject
            if (s && typeof s === 'object' && s.id) subjMap[s.id] = s

            const cl = rec.class_level
            if (cl && typeof cl === 'object' && cl.id) classLevelMap[cl.id] = cl

            const arm = rec.class_arm
            if (arm && typeof arm === 'object' && arm.id) {
              // rough prefill for class arms when appropriate
              // only set arms array if classArmsStore is empty for now
              if (!classArmsStore.classArms || !classArmsStore.classArms.length) {
                classArmsStore.classArms = Object.values({ ...(classArmsStore.classArms || {}), [arm.id]: arm })
              }
            }

            const term = rec.term
            if (term && typeof term === 'object' && term.id) {
              const session = rec.session || term.session || rec.academic_session || rec.session_id
              if (session && typeof session === 'object' && session.id) {
                sessionMap[session.id] = session
                termMapBySession[session.id] = termMapBySession[session.id] || {}
                termMapBySession[session.id][term.id] = term
              } else {
                // if no explicit session object, try to attach term to a pseudo-session key
                const pseudo = '__no_session__'
                sessionMap[pseudo] = sessionMap[pseudo] || { id: pseudo, name: 'Default' }
                termMapBySession[pseudo] = termMapBySession[pseudo] || {}
                termMapBySession[pseudo][term.id] = term
              }
            }
          })

          if ((!subjectsStore.subjects || !subjectsStore.subjects.length) && Object.keys(subjMap).length) {
            subjectsStore.subjects = Object.values(subjMap)
          }

          if ((!classLevelsStore.classLevels || !classLevelsStore.classLevels.length) && Object.keys(classLevelMap).length) {
            classLevelsStore.classLevels = Object.values(classLevelMap)
          }

          if ((!sessionsStore.sessions || !sessionsStore.sessions.length) && Object.keys(sessionMap).length) {
            sessionsStore.sessions = Object.values(sessionMap).map((s) => ({ ...s, current: s.current ?? s.is_current }))
            // populate terms per session
            Object.keys(termMapBySession).forEach((sessionId) => {
              const termsObj = termMapBySession[sessionId]
              sessionsStore.terms = sessionsStore.terms || {}
              sessionsStore.terms[sessionId] = Object.values(termsObj).map((t) => ({ ...t, current: t.current ?? t.is_current }))
            })
          }
        } catch (e) {
          // ignore populate failures and fall back to explicit fetches in the UI
        }

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

      try {
        await apiFetch(`/api/exams/${id}/publish`, { method: 'POST' })
        this.usingLocalFallback = false
      } catch (error) {
        this.usingLocalFallback = true
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

      // Try to add questions via dedicated exam-question endpoint where available
      try {
        await Promise.all(
          questionIds.map((questionId) =>
            apiFetch(`/api/exams/${id}/questions`, {
              method: 'POST',
              body: JSON.stringify({ question_id: questionId, marks_override: null }),
            })
          )
        )

        // Refresh assessments from backend to reflect added questions
        await this.fetchAssessments()
        return this.assessments.find((item) => String(item.id) === String(id))
      } catch (error) {
        // Fallback to local merge/save when API isn't available
        const mergedQuestions = [...new Set([...(assessment.questions || []), ...questionIds])]
        const updated = { ...assessment, questions: mergedQuestions }
        await this.saveAssessment(updated)
        return updated
      }
    },
  },
})
