import { defineStore } from 'pinia'
import { useSchoolAdminUiStore } from './ui'
import { useSchoolAdminSessionsStore } from './sessions'
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

export const QUESTION_TYPES = [
  { label: 'Multiple Choice', value: 'mcq' },
  { label: 'True / False', value: 'true_false' },
  { label: 'Fill in the Blank', value: 'fill_in_blank' },
]

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

export const getAssessmentStatusLabel = (assessment) => {
  const status = (typeof assessment === 'string' ? assessment : assessment?.status || '').toLowerCase()
  switch (status) {
    case 'draft': return 'Draft'
    case 'open': return 'Open for Teachers'
    case 'submissions_closed': return 'Submissions Closed'
    case 'active': return 'Active for Students'
    case 'completed': return 'Completed'
    case 'pending': return 'Pending'
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

const STORAGE_KEY = 'sa_assessment_workflow_v1'

const toOptions = (list, labelKey = 'name', valueKey = 'id') =>
  (Array.isArray(list) ? list : []).map((item) => ({
    label: item[labelKey] ?? item.title ?? item.label ?? String(item[valueKey]),
    value: item[valueKey],
  }))

const toDateKey = (value) => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const toInputDateTime = (value) => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const normalizeAssessment = (assessment) => {
  const submission = assessment?.submission_configuration || assessment?.submissionConfiguration || null
  const scheduledDate =
    assessment?.scheduled_date ||
    assessment?.scheduledDate ||
    assessment?.assessment_date ||
    assessment?.assessmentDate ||
    assessment?.created_at ||
    assessment?.createdAt ||
    ''

  return {
    ...assessment,
    scheduled_date: scheduledDate,
    scheduledDate: scheduledDate,
    created_at: assessment?.created_at ?? assessment?.createdAt ?? scheduledDate,
    createdAt: assessment?.createdAt ?? assessment?.created_at ?? scheduledDate,
    session_id: assessment?.session_id ?? assessment?.sessionId ?? '',
    class_level_id: assessment?.class_level_id ?? assessment?.classLevelId ?? '',
    class_arm_id: assessment?.class_arm_id ?? assessment?.classArmId ?? '',
    term_id: assessment?.term_id ?? assessment?.termId ?? submission?.term_id ?? submission?.termId ?? '',
    question_submission_ends: assessment?.question_submission_ends ?? assessment?.questionSubmissionEnds ?? submission?.question_submission_ends ?? submission?.questionSubmissionEnds ?? '',
    assessment_starts: assessment?.assessment_starts ?? assessment?.assessmentStarts ?? submission?.assessment_starts ?? submission?.assessmentStarts ?? '',
    assessment_ends: assessment?.assessment_ends ?? assessment?.assessmentEnds ?? submission?.assessment_ends ?? submission?.assessmentEnds ?? '',
    question_submission_status: assessment?.question_submission_status ?? assessment?.questionSubmissionStatus ?? submission?.question_submission_status ?? submission?.questionSubmissionStatus ?? 'open',
    assessment_status: assessment?.assessment_status ?? assessment?.assessmentStatus ?? submission?.assessment_status ?? submission?.assessmentStatus ?? 'pending',
    submission_configuration: submission
      ? {
          ...submission,
          question_submission_ends: submission.question_submission_ends ?? submission.questionSubmissionEnds ?? '',
          assessment_starts: submission.assessment_starts ?? submission.assessmentStarts ?? '',
          assessment_ends: submission.assessment_ends ?? submission.assessmentEnds ?? '',
          question_submission_status: submission.question_submission_status ?? submission.questionSubmissionStatus ?? 'open',
          assessment_status: submission.assessment_status ?? submission.assessmentStatus ?? 'pending',
        }
      : null,
    __workflowLocal: assessment?.__workflowLocal ?? false,
  }
}

const readWorkflowState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { schedules: [] }
    const parsed = JSON.parse(raw)
    return { schedules: Array.isArray(parsed?.schedules) ? parsed.schedules : [] }
  } catch {
    return { schedules: [] }
  }
}

const writeWorkflowState = (schedules) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schedules }))
  } catch {}
}

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
    calendarLoading: false,
    currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    selectedDate: '',
    selectedAssessmentId: null,
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
    scheduledAssessments: (state) => state.assessments.map(normalizeAssessment).filter((item) => item.scheduled_date),
    selectedAssessment: (state) => state.assessments.find((item) => String(item.id) === String(state.selectedAssessmentId)) || null,
    selectedDateAssessments: (state) => {
      const key = toDateKey(state.selectedDate)
      return state.assessments.map(normalizeAssessment).filter((item) => toDateKey(item.scheduled_date) === key)
    },
    activeTermLabel: (state) => {
      const currentTerm = state.refData.terms.find((term) => term.current || term.is_current || term.status === 'Current' || term.status === 'Active')
      return currentTerm?.name || currentTerm?.title || currentTerm?.label || 'Active term'
    },
  },

  actions: {
    _toast(title, message, variant = 'error') {
      try {
        useSchoolAdminUiStore().addToast({ title, message, variant })
      } catch {}
    },

    _persistLocalWorkflow() {
      const localRecords = this.assessments.filter((item) => item.__workflowLocal)
      writeWorkflowState(localRecords)
    },

    _mergeLocalWorkflow() {
      const local = readWorkflowState().schedules.map(normalizeAssessment)
      if (!local.length) return
      const byId = new Map(this.assessments.map((item) => [String(item.id), item]))
      local.forEach((item) => byId.set(String(item.id), item))
      this.assessments = Array.from(byId.values())
    },

    getAssessmentById(id) {
      return this.assessments.find((item) => String(item.id) === String(id)) || null
    },

    setCurrentMonth(value) {
      const date = value instanceof Date ? value : new Date(value)
      if (Number.isNaN(date.getTime())) return
      this.currentMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
    },

    selectDate(value) {
      this.selectedDate = toDateKey(value)
      if (this.selectedDate) {
        this.setCurrentMonth(new Date(this.selectedDate))
      }
    },

    selectAssessment(id) {
      this.selectedAssessmentId = id
      const assessment = this.getAssessmentById(id)
      if (assessment?.scheduled_date) this.selectDate(assessment.scheduled_date)
    },

    async fetchRefData() {
      const sessionsStore = useSchoolAdminSessionsStore()
      const [subjects, classLevels, sessions] = await Promise.all([
        getSubjects().catch(() => []),
        getClassLevels().catch(() => []),
        sessionsStore.sessions.length ? Promise.resolve(sessionsStore.sessions) : getAcademicSessions().catch(() => []),
      ])
      this.refData.subjects = Array.isArray(subjects) ? subjects : []
      this.refData.classLevels = Array.isArray(classLevels) ? classLevels : []
      this.refData.sessions = Array.isArray(sessions) ? sessions : []
      this._mergeLocalWorkflow()
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

    async fetchAssessments(params = {}) {
      this.loading = true
      this.error = null
      try {
        const data = await getAssessments(params)
        const apiRecords = Array.isArray(data) ? data : (data?.data ?? [])
        const localRecords = readWorkflowState().schedules
        const byId = new Map()
        ;[...apiRecords, ...localRecords].map(normalizeAssessment).forEach((item) => {
          if (item?.id != null) byId.set(String(item.id), item)
        })
        this.assessments = Array.from(byId.values())
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
        this.current = normalizeAssessment(await getAssessment(id))
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
        const apiRecords = Array.isArray(data) ? data : (data?.data ?? [])
        // Merge in locally-scheduled assessments (see the Assessment Schedule
        // workflow — no backend endpoint exists for these yet, §_persistLocalWorkflow)
        // so the calendar the school admin builds is also visible to teachers.
        const localRecords = readWorkflowState().schedules
        const byId = new Map()
        ;[...apiRecords, ...localRecords].map(normalizeAssessment).forEach((item) => {
          if (item?.id != null) byId.set(String(item.id), item)
        })
        this.assessments = Array.from(byId.values())
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
        const record = normalizeAssessment(await apiCreateAssessment(payload))
        if (record?.id) this.assessments = [record, ...this.assessments.filter((item) => String(item.id) !== String(record.id))]
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
        const record = normalizeAssessment(await apiUpdateAssessment(id, payload))
        this.assessments = this.assessments.map((item) => (String(item.id) === String(id) ? { ...item, ...record } : item))
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
        this.assessments = this.assessments.filter((item) => String(item.id) !== String(id))
        this._persistLocalWorkflow()
        this._toast('Assessment deleted', 'The assessment was removed.', 'success')
      } catch (error) {
        this.error = error?.message || 'Failed to delete assessment.'
        this._toast('Unable to delete assessment', this.error)
        throw error
      }
    },

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
      const patch = record && record.id ? normalizeAssessment(record) : fallbackPatch
      this.assessments = this.assessments.map((item) => (String(item.id) === String(id) ? normalizeAssessment({ ...item, ...patch }) : item))
      if (this.current?.id === id) this.current = normalizeAssessment({ ...this.current, ...patch })
      this._persistLocalWorkflow()
    },

    async createScheduledAssessment(payload) {
      const record = normalizeAssessment({
        ...payload,
        id: payload.id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        __workflowLocal: true,
      })
      this.assessments = [record, ...this.assessments.filter((item) => String(item.id) !== String(record.id))]
      this.selectAssessment(record.id)
      this._persistLocalWorkflow()
      this._toast('Assessment scheduled', 'The assessment was added to your calendar.', 'success')
      return record
    },

    async saveScheduledAssessment(id, payload) {
      const existing = this.getAssessmentById(id)
      const record = normalizeAssessment({ ...(existing || {}), ...payload, id, __workflowLocal: true })
      this.assessments = this.assessments.map((item) => (String(item.id) === String(id) ? record : item))
      this.selectAssessment(record.id)
      this._persistLocalWorkflow()
      this._toast('Assessment updated', 'The schedule changes were saved.', 'success')
      return record
    },

    async saveSubmissionConfiguration(assessmentId, payload) {
      const existing = this.getAssessmentById(assessmentId)
      if (!existing) throw new Error('Assessment not found.')
      const submission = {
        id: existing.submission_configuration?.id || `submission-${assessmentId}`,
        assessment_id: assessmentId,
        question_submission_ends: payload.question_submission_ends,
        assessment_starts: payload.assessment_starts,
        assessment_ends: payload.assessment_ends,
        question_submission_status: payload.question_submission_status || 'open',
        assessment_status: payload.assessment_status || 'pending',
      }
      const record = normalizeAssessment({
        ...existing,
        submission_configuration: submission,
        question_submission_ends: submission.question_submission_ends,
        assessment_starts: submission.assessment_starts,
        assessment_ends: submission.assessment_ends,
        question_submission_status: submission.question_submission_status,
        assessment_status: submission.assessment_status,
        __workflowLocal: true,
      })
      this.assessments = this.assessments.map((item) => (String(item.id) === String(assessmentId) ? record : item))
      this._persistLocalWorkflow()
      this._toast('Submission configuration saved', 'The submission workflow is now attached to the assessment.', 'success')
      return record.submission_configuration
    },

    async fetchMySubmission(assessmentId) {
      try {
        this.currentSubmission = await getMySubmission(assessmentId)
        return this.currentSubmission
      } catch {
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
        const responseData = response?.data ? response : response
        if (responseData?.submission) {
          if (this.currentSubmission) {
            this.currentSubmission.total_marks = responseData.submission.total_marks
            this.currentSubmission.question_count = responseData.submission.question_count
          }
          await this.fetchSubmission(submissionId, { silent: true })
        }
        return responseData?.question || response
      } catch (error) {
        this.error = error?.status === 422
          ? error?.data?.message || 'Adding this question would exceed the assessment cap.'
          : error?.message || 'Failed to add question.'
        this._toast('Unable to add question', this.error)
        throw error
      }
    },

    async addQuestions(submissionId, payloads) {
      try {
        for (const payload of payloads) {
          await apiAddQuestion(submissionId, payload)
        }
        await this.fetchSubmission(submissionId, { silent: true })
        this._toast('Questions added', `${payloads.length} question${payloads.length === 1 ? '' : 's'} added to your submission.`, 'success')
      } catch (error) {
        this.error = error?.status === 422
          ? error?.data?.message || 'Adding this question would exceed the assessment cap.'
          : error?.message || 'Failed to add questions.'
        this._toast('Unable to add questions', this.error)
        await this.fetchSubmission(submissionId, { silent: true }).catch(() => {})
        throw error
      }
    },

    async deleteQuestion(submissionId, questionId) {
      try {
        const response = await apiDeleteQuestion(submissionId, questionId)
        const responseData = response?.data ? response : response
        if (responseData?.submission) {
          if (this.currentSubmission) {
            this.currentSubmission.total_marks = responseData.submission.total_marks
            this.currentSubmission.question_count = responseData.submission.question_count
          }
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
      this.submissions = this.submissions.map((item) => (String(item.id) === String(submissionId) ? { ...item, ...patch } : item))
      if (this.currentSubmission?.id === submissionId) {
        this.currentSubmission = { ...this.currentSubmission, ...patch }
      }
    },

    formatDateTimeValue: toInputDateTime,
  },
})
