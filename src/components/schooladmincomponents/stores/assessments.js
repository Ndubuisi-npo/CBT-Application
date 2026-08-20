import { defineStore } from 'pinia'
import { useSchoolAdminUiStore } from './ui'
import {
  getAssessments,
  getAssessment,
  createAssessment as apiCreateAssessment,
  updateAssessment as apiUpdateAssessment,
  deleteAssessment as apiDeleteAssessment,
  openAssessment as apiOpenAssessment,
  closeSubmissions as apiCloseSubmissions,
  reopenAssessment as apiReopenAssessment,
  activateAssessment as apiActivateAssessment,
  completeAssessment as apiCompleteAssessment,
  getMySubmission,
  createSubmission as apiCreateSubmission,
  updateSubmission as apiUpdateSubmission,
  addQuestion as apiAddQuestion,
  deleteQuestion as apiDeleteQuestion,
  submitForReview as apiSubmitForReview,
  getSubmissions,
  getSubmission,
  requestChanges as apiRequestChanges,
  approveSubmission as apiApproveSubmission,
  getSubjects,
  getClassLevels,
  getClassArms,
  getAcademicSessions,
  getTerms,
  getTeacherAssessments,
} from '../services/api/assessments'

/* Submission question types — the three the backend supports (§3/§7). */
export const QUESTION_TYPES = [
  { label: 'Multiple Choice', value: 'mcq' },
  { label: 'True / False', value: 'true_false' },
  { label: 'Fill in the Blank', value: 'fill_in_blank' },
]

/* Assessment status → badge variant. The five real statuses (§2). */
export const getStatusVariant = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'draft': return 'warning'
    case 'open':
    case 'active': return 'success'
    case 'submissions_closed': return 'info'
    case 'completed': return 'default'
    default: return 'default'
  }
}

/* Assessment status → human label. Driven by the single `status` string (§4);
 * there are no isOpenForTeachers/isOpenForStudents flags on the contract. */
export const getAssessmentStatusLabel = (assessment) => {
  const status = (typeof assessment === 'string' ? assessment : assessment?.status || '').toLowerCase()
  switch (status) {
    case 'draft': return 'Draft'
    case 'open': return 'Open for Teachers'
    case 'submissions_closed': return 'Submissions Closed'
    case 'active': return 'Active for Students'
    case 'completed': return 'Completed'
    default: return 'Unknown'
  }
}

export const getSubmissionStatusLabel = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'submitted': return 'Submitted'
    case 'changes_requested': return 'Changes Requested'
    case 'approved': return 'Approved'
    case 'draft': return 'Draft'
    default: return status || 'Unknown'
  }
}

export const getSubmissionStatusVariant = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'submitted': return 'info'
    case 'approved': return 'success'
    case 'changes_requested': return 'warning'
    default: return 'default'
  }
}

const toOptions = (list, labelKey = 'name', valueKey = 'id') =>
  (Array.isArray(list) ? list : []).map((item) => ({
    label: item[labelKey] ?? item.title ?? item.label ?? String(item[valueKey]),
    value: item[valueKey],
  }))

export const useAssessmentsStore = defineStore('assessments', {
  state: () => ({
    assessments: [],
    submissions: [],
    current: null,
    currentSubmission: null,
    refData: {
      subjects: [],
      classLevels: [],
      classArms: [],
      sessions: [],
      terms: [],
      teachers: [],
    },
    loading: false,
    error: null,
  }),

  getters: {
    questionTypeOptions: () => QUESTION_TYPES,
    subjectOptions: (state) => toOptions(state.refData.subjects),
    classLevelOptions: (state) => toOptions(state.refData.classLevels),
    classArmOptions: (state) => [{ label: 'All arms', value: '' }, ...toOptions(state.refData.classArms)],
    sessionOptions: (state) => toOptions(state.refData.sessions),
    termOptions: (state) => toOptions(state.refData.terms),
    teacherOptions: (state) =>
      toOptions(state.refData.teachers).map((option, index) => {
        const teacher = state.refData.teachers[index]
        const name = teacher
          ? `${teacher.first_name ?? teacher.firstName ?? ''} ${teacher.last_name ?? teacher.lastName ?? ''}`.trim()
          : ''
        return { label: name || option.label, value: option.value }
      }),
  },

  actions: {
    _toast(title, message, variant = 'error') {
      try {
        useSchoolAdminUiStore().addToast({ title, message, variant })
      } catch {
        // UI store may be unavailable in non-UI contexts; degrade silently.
      }
    },

    /* ------------------------------------------------------------------ *
     * Reference data — reused endpoints, loaded once per surface.
     * ------------------------------------------------------------------ */
    async fetchRefData() {
      const [subjects, classLevels, sessions] = await Promise.all([
        getSubjects().catch(() => []),
        getClassLevels().catch(() => []),
        getAcademicSessions().catch(() => []),
      ])
      this.refData.subjects = Array.isArray(subjects) ? subjects : []
      this.refData.classLevels = Array.isArray(classLevels) ? classLevels : []
      this.refData.sessions = Array.isArray(sessions) ? sessions : []
    },

    async fetchClassArms(classLevelId) {
      if (!classLevelId) {
        this.refData.classArms = []
        return []
      }
      try {
        const arms = await getClassArms(classLevelId)
        this.refData.classArms = Array.isArray(arms) ? arms : []
      } catch {
        this.refData.classArms = []
      }
      return this.refData.classArms
    },

    async fetchTerms(sessionId) {
      if (!sessionId) {
        this.refData.terms = []
        return []
      }
      try {
        const terms = await getTerms(sessionId)
        this.refData.terms = Array.isArray(terms) ? terms : []
      } catch {
        this.refData.terms = []
      }
      return this.refData.terms
    },

    /* ------------------------------------------------------------------ *
     * Assessments (school admin)
     * ------------------------------------------------------------------ */
    async fetchAssessments(params = {}) {
      this.loading = true
      this.error = null
      try {
        const data = await getAssessments(params)
        this.assessments = Array.isArray(data) ? data : (data?.data ?? [])
      } catch (error) {
        this.error = error?.message || 'Failed to load assessments.'
        this.assessments = []
        this._toast('Unable to load assessments', this.error)
      } finally {
        this.loading = false
      }
    },

    async fetchAssessment(id) {
      this.loading = true
      this.error = null
      try {
        this.current = await getAssessment(id)
        return this.current
      } catch (error) {
        this.error = error?.message || 'Failed to load assessment.'
        this.current = null
        this._toast('Unable to load assessment', this.error)
        return null
      } finally {
        this.loading = false
      }
    },

    async fetchTeacherAssessments(params = {}) {
      this.loading = true
      this.error = null
      try {
        const data = await getTeacherAssessments(params)
        this.assessments = Array.isArray(data) ? data : (data?.data ?? [])
      } catch (error) {
        this.error = error?.message || 'Failed to load assessments.'
        this.assessments = []
        this._toast('Unable to load assessments', this.error)
      } finally {
        this.loading = false
      }
    },

    async createAssessment(payload) {
      try {
        const record = await apiCreateAssessment(payload)
        if (record?.id) this.assessments = [record, ...this.assessments]
        this._toast('Assessment created', 'The assessment was created successfully.', 'success')
        return record
      } catch (error) {
        this.error = error?.message || 'Failed to create assessment.'
        this._toast('Unable to create assessment', this.error)
        throw error
      }
    },

    async updateAssessment(id, payload) {
      try {
        const record = await apiUpdateAssessment(id, payload)
        this.assessments = this.assessments.map((item) => (item.id === id ? { ...item, ...record } : item))
        if (this.current?.id === id) this.current = { ...this.current, ...record }
        this._toast('Assessment updated', 'The assessment was updated successfully.', 'success')
        return record
      } catch (error) {
        this.error = error?.message || 'Failed to update assessment.'
        this._toast('Unable to update assessment', this.error)
        throw error
      }
    },

    async deleteAssessment(id) {
      try {
        await apiDeleteAssessment(id)
        this.assessments = this.assessments.filter((item) => item.id !== id)
        this._toast('Assessment deleted', 'The assessment was removed.', 'success')
      } catch (error) {
        this.error = error?.message || 'Failed to delete assessment.'
        this._toast('Unable to delete assessment', this.error)
        throw error
      }
    },

    /* ------------------------------------------------------------------ *
     * Assessment transitions (§4). Timing windows are captured at draft
     * create/edit time; only reopen accepts a datetime body here.
     * ------------------------------------------------------------------ */
    async openAssessment(id) {
      try {
        const record = await apiOpenAssessment(id)
        this._applyAssessment(id, record, { status: 'open' })
        this._toast('Assessment opened', 'Teachers can now build submissions.', 'success')
        return record
      } catch (error) {
        this.error = error?.message || 'Failed to open assessment.'
        this._toast('Unable to open assessment', this.error)
        throw error
      }
    },

    async closeSubmissions(id) {
      try {
        const record = await apiCloseSubmissions(id)
        this._applyAssessment(id, record, { status: 'submissions_closed' })
        this._toast('Submissions closed', 'The teacher submission window is closed.', 'success')
        return record
      } catch (error) {
        this.error = error?.message || 'Failed to close submissions.'
        this._toast('Unable to close submissions', this.error)
        throw error
      }
    },

    async reopenAssessment(id, payload) {
      try {
        const record = await apiReopenAssessment(id, payload)
        this._applyAssessment(id, record, { status: 'open' })
        this._toast('Assessment reopened', 'Teachers can submit again before the new deadline.', 'success')
        return record
      } catch (error) {
        this.error = error?.message || 'Failed to reopen assessment.'
        this._toast('Unable to reopen assessment', this.error)
        throw error
      }
    },

    async activateAssessment(id) {
      try {
        const record = await apiActivateAssessment(id)
        this._applyAssessment(id, record, { status: 'active' })
        this._toast('Assessment activated', 'Approved submissions are now live exams for students.', 'success')
        return record
      } catch (error) {
        this.error = error?.message || 'Failed to activate assessment.'
        this._toast('Unable to activate assessment', this.error)
        throw error
      }
    },

    async completeAssessment(id) {
      try {
        const record = await apiCompleteAssessment(id)
        this._applyAssessment(id, record, { status: 'completed' })
        this._toast('Assessment completed', 'The assessment is now marked complete.', 'success')
        return record
      } catch (error) {
        this.error = error?.message || 'Failed to complete assessment.'
        this._toast('Unable to complete assessment', this.error)
        throw error
      }
    },

    _applyAssessment(id, record, fallbackPatch = {}) {
      const patch = record && record.id ? record : fallbackPatch
      this.assessments = this.assessments.map((item) => (item.id === id ? { ...item, ...patch } : item))
      if (this.current?.id === id) this.current = { ...this.current, ...patch }
    },

    /* ------------------------------------------------------------------ *
     * Teacher submission
     * ------------------------------------------------------------------ */
    async fetchMySubmission(assessmentId) {
      try {
        this.currentSubmission = await getMySubmission(assessmentId)
        return this.currentSubmission
      } catch (error) {
        // No submission yet is not a hard error — show the create form.
        this.currentSubmission = null
        return null
      }
    },

    async createSubmission(assessmentId, payload) {
      try {
        this.currentSubmission = await apiCreateSubmission(assessmentId, payload)
        this._toast('Submission created', 'You can now add questions.', 'success')
        return this.currentSubmission
      } catch (error) {
        this.error = error?.message || 'Failed to create submission.'
        this._toast('Unable to create submission', this.error)
        throw error
      }
    },

    async updateSubmission(submissionId, payload) {
      try {
        const record = await apiUpdateSubmission(submissionId, payload)
        if (record?.id) this.currentSubmission = record
        else if (this.currentSubmission) this.currentSubmission = { ...this.currentSubmission, ...payload }
        this._toast('Submission updated', 'Your changes were saved.', 'success')
        return record
      } catch (error) {
        this.error = error?.message || 'Failed to update submission.'
        this._toast('Unable to update submission', this.error)
        throw error
      }
    },

    async addQuestion(submissionId, payload) {
      try {
        const response = await apiAddQuestion(submissionId, payload)
        // New response shape: { success: true, data: { question: {...}, submission: {...} } }
        const responseData = response?.data ? response : response
        if (responseData?.submission) {
          // Update submission with new totals from response
          if (this.currentSubmission) {
            this.currentSubmission.total_marks = responseData.submission.total_marks
            this.currentSubmission.question_count = responseData.submission.question_count
          }
          // Fetch full submission to get the questions array
          await this.fetchSubmission(submissionId, { silent: true })
        }
        return responseData?.question || response
      } catch (error) {
        // Handle 422 cap breach error with user-friendly message
        if (error?.status === 422) {
          this.error = error?.data?.message || 'Adding this question would exceed the assessment cap.'
        } else {
          this.error = error?.message || 'Failed to add question.'
        }
        this._toast('Unable to add question', this.error)
        throw error
      }
    },

    /**
     * Add several questions in one go (e.g. importing from the question
     * bank). Still calls the documented single-question POST endpoint (§7)
     * once per question — there's no bulk-create endpoint — but only
     * refetches the submission once at the end instead of after every item.
     */
    async addQuestions(submissionId, payloads) {
      try {
        for (const payload of payloads) {
          await apiAddQuestion(submissionId, payload)
        }
        await this.fetchSubmission(submissionId, { silent: true })
        this._toast('Questions added', `${payloads.length} question${payloads.length === 1 ? '' : 's'} added to your submission.`, 'success')
      } catch (error) {
        // Handle 422 cap breach error with user-friendly message
        if (error?.status === 422) {
          this.error = error?.data?.message || 'Adding this question would exceed the assessment cap.'
        } else {
          this.error = error?.message || 'Failed to add questions.'
        }
        this._toast('Unable to add questions', this.error)
        // Refresh anyway so the UI reflects whatever succeeded before the failure.
        await this.fetchSubmission(submissionId, { silent: true }).catch(() => {})
        throw error
      }
    },

    async deleteQuestion(submissionId, questionId) {
      try {
        const response = await apiDeleteQuestion(submissionId, questionId)
        // New response shape: { success: true, data: { submission: {...} } }
        const responseData = response?.data ? response : response
        if (responseData?.submission) {
          // Update submission with new totals from response
          if (this.currentSubmission) {
            this.currentSubmission.total_marks = responseData.submission.total_marks
            this.currentSubmission.question_count = responseData.submission.question_count
          }
          // Fetch full submission to get the updated questions array
          await this.fetchSubmission(submissionId, { silent: true })
        }
      } catch (error) {
        this.error = error?.message || 'Failed to delete question.'
        this._toast('Unable to delete question', this.error)
        throw error
      }
    },

    async submitForReview(submissionId) {
      try {
        const record = await apiSubmitForReview(submissionId)
        if (record?.id) this.currentSubmission = record
        else if (this.currentSubmission) this.currentSubmission = { ...this.currentSubmission, status: 'submitted' }
        this._toast('Submitted for review', 'Your submission is now awaiting review.', 'success')
        return record
      } catch (error) {
        this.error = error?.message || 'Failed to submit for review.'
        this._toast('Unable to submit for review', this.error)
        throw error
      }
    },

    /* ------------------------------------------------------------------ *
     * Admin review
     * ------------------------------------------------------------------ */
    async fetchSubmissions(assessmentId) {
      this.loading = true
      this.error = null
      try {
        const data = await getSubmissions(assessmentId)
        this.submissions = Array.isArray(data) ? data : (data?.data ?? [])
      } catch (error) {
        this.error = error?.message || 'Failed to load submissions.'
        this.submissions = []
        this._toast('Unable to load submissions', this.error)
      } finally {
        this.loading = false
      }
    },

    async fetchSubmission(submissionId, { silent = false } = {}) {
      if (!silent) {
        this.loading = true
        this.error = null
      }
      try {
        // GET /submissions/{id} includes submissionQuestions array when eager-loaded
        this.currentSubmission = await getSubmission(submissionId)
        return this.currentSubmission
      } catch (error) {
        if (!silent) {
          this.error = error?.message || 'Failed to load submission.'
          this._toast('Unable to load submission', this.error)
        }
        return null
      } finally {
        if (!silent) this.loading = false
      }
    },

    async requestChanges(submissionId, payload) {
      try {
        const record = await apiRequestChanges(submissionId, payload)
        this._applySubmission(submissionId, record, { status: 'changes_requested' })
        this._toast('Changes requested', 'The submission was sent back to the teacher.', 'success')
        return record
      } catch (error) {
        this.error = error?.message || 'Failed to request changes.'
        this._toast('Unable to request changes', this.error)
        throw error
      }
    },

    async approveSubmission(submissionId) {
      try {
        const record = await apiApproveSubmission(submissionId)
        this._applySubmission(submissionId, record, { status: 'approved' })
        this._toast('Submission approved', 'The submission was approved.', 'success')
        return record
      } catch (error) {
        this.error = error?.message || 'Failed to approve submission.'
        this._toast('Unable to approve submission', this.error)
        throw error
      }
    },

    _applySubmission(submissionId, record, fallbackPatch = {}) {
      const patch = record && record.id ? record : fallbackPatch
      this.submissions = this.submissions.map((item) => (item.id === submissionId ? { ...item, ...patch } : item))
      if (this.currentSubmission?.id === submissionId) {
        this.currentSubmission = { ...this.currentSubmission, ...patch }
      }
    },
  },
})
