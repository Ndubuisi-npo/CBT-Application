/**
 * Teacher Exams Store (Pinia)
 *
 * Lifecycle: draft → submitted → active → completed.
 */
import { defineStore } from 'pinia'
import {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  submitForReview,
  activateExam,
  forceCompleteExam,
  publishExam,
  getExamQuestions,
  setExamQuestions,
  getStudentAttempts,
  forceSubmitAttempt,
  getExamResults,
  getSubjects,
  getClassLevels,
  getClassArms,
  getAcademicSessions,
  getTerms,
  getQuestionBank,
} from '../services/api/exams'

// ─── State machine ────────────────────────────────────────────────────────────
// Source of truth for which actions are valid from each status.
// Invalid transitions are HIDDEN (not just disabled) in the UI.
const unwrapList = (response) => {
  if (Array.isArray(response)) return response
  if (!response || typeof response !== 'object') return []
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.questions)) return response.questions
  if (Array.isArray(response.items)) return response.items
  if (Array.isArray(response.results)) return response.results
  if (response.data && typeof response.data === 'object') return unwrapList(response.data)
  return []
}

export const EXAM_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  ACTIVE: 'active',
  COMPLETED: 'completed',
}

export const VALID_TRANSITIONS = {
  draft: [
    {
      action: 'submit-for-review',
      label: 'Submit for Review',
      variant: 'primary',
      confirm: true,
      confirmLabel: 'Confirm Submit',
      description: 'You will be unable to make changes to this exam when it is submitted. Are you sure you want to continue?',
    },
  ],
  submitted: [],
  active: [],
  completed: [],
}

export const STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  active: 'Active',
  completed: 'Completed',
  published: 'Published',
}

export const STATUS_CLASSES = {
  draft: 'bg-slate-100 text-slate-700',
  submitted: 'bg-slate-100 text-slate-700',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  published: 'bg-indigo-100 text-indigo-700',
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useTeacherExamsStore = defineStore('teacher-exams', {
  state: () => ({
    // Exam list
    exams: [],
    totalExams: 0,
    loading: false,
    error: null,

    // Active exam detail (when viewing/managing single exam)
    currentExam: null,
    currentExamQuestions: [],
    currentExamStudents: [],   // attendance list
    currentExamResults: [],

    // Metadata (loaded once for form dropdowns)
    subjects: [],
    classLevels: [],
    classArms: [],
    academicSessions: [],
    terms: [],
    questionBank: [],

    // Filters for exam list
    filters: {
      status: '',
      subject_id: '',
      class_level_id: '',
      search: '',
    },

    // Pagination
    pagination: {
      page: 1,
      perPage: 15,
      total: 0,
    },

    // Exam creation wizard
    wizard: {
      step: 1,
      data: {
        title: '',
        subject_id: '',
        class_level_id: '',
        class_arm_id: null,
        term_id: '',
        type: 'exam',
        duration_minutes: 60,
        pass_mark: 50,
        instructions: '',
      },
    },
  }),

  getters: {
    // Returns valid actions for a given exam based on current status
    getValidActions: () => (exam) => {
      const status = (exam?.status || 'draft').toLowerCase()
      return VALID_TRANSITIONS[status] || []
    },

    // Derives display label and CSS class from status
    getStatusLabel: () => (status) => STATUS_LABELS[(status || 'draft').toLowerCase()] || 'Draft',
    getStatusClass: () => (status) => STATUS_CLASSES[(status || 'draft').toLowerCase()] || 'bg-slate-100 text-slate-700',

    // Can the exam be edited (only draft)
    canEdit: () => (exam) => (exam?.status || '').toLowerCase() === 'draft',
    canDelete: () => (exam) => (exam?.status || '').toLowerCase() === 'draft',

    // Alias: ExamWizard reads examsStore.sessions
    sessions: (state) => state.academicSessions,

    // Filtered exams (client-side for search)
    filteredExams(state) {
      const { search, status } = state.filters
      return state.exams.filter((exam) => {
        const matchStatus = !status || (exam.status || '').toLowerCase() === status.toLowerCase()
        const matchSearch =
          !search ||
          (exam.title || '').toLowerCase().includes(search.toLowerCase()) ||
          (exam.subject || '').toLowerCase().includes(search.toLowerCase())
        return matchStatus && matchSearch
      })
    },

    draftExams: (state) => state.exams.filter((e) => (e.status || '').toLowerCase() === 'draft'),
    submittedExams: (state) => state.exams.filter((e) => {
      const s = (e.status || '').toLowerCase()
      return s === 'submitted' || s === 'completed'
    }),
    activeExams: (state) => state.exams.filter((e) => (e.status || '').toLowerCase() === 'active'),
    completedExams: (state) => state.exams.filter((e) => (e.status || '').toLowerCase() === 'completed'),
  },

  actions: {
    // ── List ──────────────────────────────────────────────────────────────────

    async fetchExams(params = {}) {
      this.loading = true
      this.error = null
      try {
        const response = await getExams({
          ...params,
          per_page: this.pagination.perPage,
          page: this.pagination.page,
        })

        if (Array.isArray(response)) {
          this.exams = response
          this.totalExams = response.length
        } else if (response?.data) {
          this.exams = response.data
          this.totalExams = response.total ?? response.data.length
          this.pagination.total = response.total ?? response.data.length
        } else {
          this.exams = []
          this.totalExams = 0
        }
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchExam(id) {
      try {
        const exam = await getExam(id)
        this.currentExam = exam
        // Replace in list if already loaded
        const idx = this.exams.findIndex((e) => e.id === id)
        if (idx !== -1) this.exams[idx] = exam
        return exam
      } catch (err) {
        throw err
      }
    },

    // ── CRUD ──────────────────────────────────────────────────────────────────

    async createExam(payload) {
      const record = await createExam(payload)
      this.exams = [record, ...this.exams]
      this.totalExams++
      return record
    },

    async updateExam(id, payload) {
      const record = await updateExam(id, payload)
      this._replaceInList(record)
      if (this.currentExam?.id === id) this.currentExam = record
      return record
    },

    async deleteExam(id) {
      await deleteExam(id)
      this.exams = this.exams.filter((e) => e.id !== id)
      this.totalExams = Math.max(0, this.totalExams - 1)
      if (this.currentExam?.id === id) this.currentExam = null
    },

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    async submitForReview(id) {
      const result = await submitForReview(id)
      await this.fetchExam(id)
      return result
    },

    async activateExam(id) {
      const result = await activateExam(id)
      await this.fetchExam(id)
      return result
    },
    async forceCompleteExam(id) {
      const result = await forceCompleteExam(id)
      await this.fetchExam(id)
      return result
    },
    async publishExam(id) {
      // Client-side validation with helpful messages
      const exam = this.exams.find((e) => e.id === id) || this.currentExam
      const status = (exam?.status || '').toLowerCase()

      if (status === 'active') {
        throw new Error('Cannot publish a live exam. Please end the exam before publishing results.')
      }

      if (status !== 'completed') {
        throw new Error('Exam must be completed before results can be published.')
      }

      const result = await publishExam(id)
      await this.fetchExam(id)
      return result
    },
    // ── Questions ─────────────────────────────────────────────────────────────

    async fetchExamQuestions(examId) {
      const questions = await getExamQuestions(examId)
      this.currentExamQuestions = Array.isArray(questions) ? questions : (questions?.data || [])
      return this.currentExamQuestions
    },

    /**
     * Set an exam's complete question set in one request. Not incremental —
     * this replaces the exam's entire question list with the given
     * selection, so callers must always send the full desired set (even a
     * single question still goes in the array).
     * questions: [{ question_id, order, marks, is_marks_locked }, ...]
     */
    async setQuestions(examId, questions) {
      const payload = questions.map((q) => ({
        question_id: q.question_id,
        order: q.order,
        marks: q.marks,
        is_marks_locked: Boolean(q.is_marks_locked),
      }))
      const result = await setExamQuestions(examId, payload)
      this.currentExamQuestions = Array.isArray(result) ? result : (result?.data || result?.questions || payload)

      // Keep the exams list's question count in sync so the list page
      // reflects the save immediately, without waiting on a refetch.
      const idx = this.exams.findIndex((e) => e.id === examId)
      if (idx !== -1) {
        this.exams[idx] = { ...this.exams[idx], question_count: payload.length, questions_count: payload.length }
      }

      return this.currentExamQuestions
    },

    // ── Monitoring ────────────────────────────────────────────────────────────

    async fetchAttempts(examId) {
      const attempts = await getStudentAttempts(examId)
      this.currentExamAttempts = Array.isArray(attempts) ? attempts : (attempts?.data || [])
      return this.currentExamAttempts
    },

    async forceSubmitAttempt(attemptId) {
      const result = await forceSubmitAttempt(attemptId)
      // Update attempt status in local list
      this.currentExamAttempts = this.currentExamAttempts.map((a) =>
        a.id === attemptId ? { ...a, status: 'submitted' } : a,
      )
      return result
    },

    async endSession(examId) {
      const attempts = await getStudentAttempts(examId)
      const activeAttempts = (Array.isArray(attempts) ? attempts : attempts?.data || [])
        .filter((attempt) => attempt && !['submitted', 'completed'].includes((attempt.status || '').toLowerCase()))

      for (const attempt of activeAttempts) {
        if (!attempt?.id) continue
        await forceSubmitAttempt(attempt.id)
      }

      await this.fetchExam(examId)
      return activeAttempts.length
    },

    // ── Results ───────────────────────────────────────────────────────────────

    async fetchResults(examId) {
      const results = await getExamResults(examId)
      this.currentExamResults = Array.isArray(results) ? results : (results?.data || [])
      return this.currentExamResults
    },

    // ── Metadata ──────────────────────────────────────────────────────────────

    async loadFormMetadata() {
      const classLevelId = this._teacherClassLevelId()
      const [subjects, classLevels, sessions] = await Promise.allSettled([
        getSubjects(classLevelId ? { class_level_id: classLevelId } : {}),
        getClassLevels(),
        getAcademicSessions(),
      ])
      if (subjects.status === 'fulfilled') this.subjects = subjects.value?.data ?? subjects.value ?? []
      if (classLevels.status === 'fulfilled') this.classLevels = classLevels.value?.data ?? classLevels.value ?? []
      if (classLevelId) {
        const scopedClass = this.classLevels.find((item) => String(item.id) === String(classLevelId))
        this.classLevels = scopedClass ? [scopedClass] : this.classLevels
      }
      if (sessions.status === 'fulfilled') this.academicSessions = sessions.value?.data ?? sessions.value ?? []
    },

    async loadSubjectsForClassLevel(classLevelId) {
      const subjects = await getSubjects(classLevelId ? { class_level_id: classLevelId } : {})
      this.subjects = subjects?.data ?? subjects ?? []
      return this.subjects
    },

    async loadClassArms(classLevelId) {
      const arms = await getClassArms(classLevelId)
      this.classArms = arms?.data ?? arms ?? []
      return this.classArms
    },

    async loadTerms(sessionId) {
      const terms = await getTerms(sessionId)
      this.terms = terms?.data ?? terms ?? []
      return this.terms
    },

    async fetchQuestionBank(params = {}) {
      const result = await getQuestionBank(params)
      this.questionBank = unwrapList(result)
      return this.questionBank
    },

    // ── Wizard ────────────────────────────────────────────────────────────────

    setWizardStep(step) {
      this.wizard.step = step
    },

    updateWizardData(data) {
      this.wizard.data = { ...this.wizard.data, ...data }
    },

    resetWizard() {
      this.wizard.step = 1
      this.wizard.data = {
        title: '',
        subject_id: '',
        class_level_id: '',
        class_arm_id: null,
        term_id: '',
        type: 'exam',
        duration_minutes: 60,
        pass_mark: 50,
        instructions: '',
      }
    },

    // ── Filters ───────────────────────────────────────────────────────────────

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
    },

    clearFilters() {
      this.filters = { status: '', subject_id: '', class_level_id: '', search: '' }
    },

    // ── Aliases used by ExamWizard.vue ─────────────────────────────────────

    /** Alias: loads class arms into state (called by ExamWizard on class-level change) */
    async fetchArms(classLevelId) {
      return this.loadClassArms(classLevelId)
    },

    /** Alias: loads terms into state (called by ExamWizard on session change) */
    async fetchTerms(sessionId) {
      return this.loadTerms(sessionId)
    },

    /** Alias: loads all reference data needed by ExamWizard */
    async fetchRefData() {
      return this.loadFormMetadata()
    },

    /**
     * Generic lifecycle action dispatcher.
     */
    async performLifecycleAction(examId, action, payload = {}) {
      switch (action) {
        case 'submit-for-review':
        case 'submitForReview':
          return this.submitForReview(examId)
        default:
          throw new Error(`Unknown lifecycle action: ${action}`)
      }
    },

    // ── Private ───────────────────────────────────────────────────────────────

    _replaceInList(record) {
      const idx = this.exams.findIndex((e) => e.id === record.id)
      if (idx !== -1) this.exams[idx] = record
    },

    _teacherClassLevelId() {
      if (typeof window === 'undefined') return null
      try {
        const auth = JSON.parse(window.localStorage.getItem('cbt_auth') || '{}')
        return auth.user?.teacher_profile?.class_level?.id
          ?? auth.user?.teacher_profile?.class_level_id
          ?? null
      } catch {
        return null
      }
    },
  },
})
/* ── Patch: missing aliases used by ExamWizard ── */
