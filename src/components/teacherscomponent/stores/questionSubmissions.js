import { defineStore } from 'pinia'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { useAssessmentsStore } from '../../schooladmincomponents/stores/assessments'
import { getAuthUser, getDisplayName } from '../../../js/lib/auth'
import {
  getQuestionSubmissions as apiGetQuestionSubmissions,
  createQuestionSubmission as apiCreateQuestionSubmission,
} from '../services/api/questionSubmissions'

const STORAGE_KEY = 'teacher_question_submissions_v1'

export const getQuestionSubmissionStatusLabel = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'accepted': return 'Accepted'
    case 'in_review': return 'In Review'
    case 'changes_requested': return 'Changes Requested'
    default: return status || 'Unknown'
  }
}

export const getQuestionSubmissionStatusVariant = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'accepted': return 'success'
    case 'in_review': return 'info'
    case 'changes_requested': return 'warning'
    default: return 'default'
  }
}

const readLocal = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeLocal = (byAssessment) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(byAssessment))
  } catch {
    // Best-effort only — an unavailable/full localStorage shouldn't break submission.
  }
}

export const useQuestionSubmissionsStore = defineStore('teacher-question-submissions', {
  state: () => ({
    byAssessment: {}, // assessmentId -> QuestionSubmission[]
    loading: false,
    saving: false,
    error: null,
  }),

  getters: {
    submissionsFor: (state) => (assessmentId) => state.byAssessment[assessmentId] || [],
  },

  actions: {
    _toast(title, message, variant = 'error') {
      try {
        useSchoolAdminUiStore().addToast({ title, message, variant })
      } catch {
        // UI store unavailable outside a component tree — degrade silently.
      }
    },

    async fetchSubmissions(assessmentId) {
      this.loading = true
      this.error = null
      try {
        const data = await apiGetQuestionSubmissions(assessmentId)
        const apiRecords = Array.isArray(data) ? data : (data?.data ?? [])
        if (apiRecords.length) {
          this.byAssessment = { ...this.byAssessment, [assessmentId]: apiRecords }
          return apiRecords
        }
      } catch {
        // No backend endpoint yet — fall through to the local cache below.
      } finally {
        this.loading = false
      }
      const local = readLocal()[assessmentId] || []
      this.byAssessment = { ...this.byAssessment, [assessmentId]: local }
      return local
    },

    /**
     * payload: { session_id, term_id, subject_id, question }
     * Tries the real endpoint first; if it isn't wired up yet, falls back to
     * a locally-persisted record built from already-loaded reference data so
     * the review workflow is usable end-to-end before the backend exists.
     */
    async createSubmission(assessmentId, payload) {
      this.saving = true
      try {
        let record
        try {
          record = await apiCreateQuestionSubmission(assessmentId, payload)
        } catch {
          record = null
        }

        if (!record?.id) {
          const refStore = useAssessmentsStore()
          const user = getAuthUser()
          record = {
            id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            assessment_id: assessmentId,
            session: refStore.sessionOptions.find((o) => String(o.value) === String(payload.session_id)) || null,
            term: refStore.termOptions.find((o) => String(o.value) === String(payload.term_id)) || null,
            subject: refStore.subjectOptions.find((o) => String(o.value) === String(payload.subject_id)) || null,
            teacher: { id: user?.id, name: getDisplayName(user) || 'You' },
            submitted_at: new Date().toISOString(),
            status: 'in_review',
            reviews: [],
            question: payload.question,
            __local: true,
          }
        }

        const existing = this.byAssessment[assessmentId] || []
        const next = [record, ...existing.filter((item) => String(item.id) !== String(record.id))]
        this.byAssessment = { ...this.byAssessment, [assessmentId]: next }

        const currentLocal = readLocal()
        writeLocal({ ...currentLocal, [assessmentId]: next })

        this._toast('Question submitted', 'Your question was sent for review.', 'success')
        return record
      } catch (error) {
        this.error = error?.message || 'Failed to submit your question.'
        this._toast('Unable to submit question', this.error)
        throw error
      } finally {
        this.saving = false
      }
    },
  },
})
