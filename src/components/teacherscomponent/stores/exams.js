/**
 * Teacher Exams Store (Pinia)
 *
 * REFACTOR: Complete lifecycle ownership by teacher.
 * REMOVED states: submitted, pending_approval, scheduled_by_admin, approved
 * NEW states: draft | active | grading | published | locked
 * REMOVED actions: submitForReview, adminActivate, adminReject
 * NEW actions: activateExam (draft→active), endSession (active→grading),
 *              publishExam (grading→published), lockExam, unlockExam
 *
 * The store mirrors the backend state machine exactly.
 * Action buttons are derived from VALID_TRANSITIONS map.
 */
import { defineStore } from 'pinia'
import {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  activateExam,
  endSession,
  publishExam,
  lockExam,
  unlockExam,
  getExamQuestions,
  addQuestionToExam,
  removeQuestionFromExam,
  updateExamQuestion,
  getClassStudentsForAttendance,
  saveAttendance,
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
export const EXAM_STATUSES = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  GRADING: 'grading',
  PUBLISHED: 'published',
  LOCKED: 'locked',
}

export const VALID_TRANSITIONS = {
  draft: [
    {
      action: 'activate',
      label: 'Launch Exam',
      variant: 'primary',
      confirm: false,
      description: 'Make exam live so students can take it.',
    },
    {
      action: 'lock',
      label: 'Lock',
      variant: 'outline',
      confirm: true,
      description: 'Freeze exam — no edits or transitions until unlocked.',
    },
  ],
  active: [
    {
      action: 'endSession',
      label: 'End Session',
      variant: 'danger',
      confirm: true,
      description: 'End the live exam session. All remaining attempts will be force-submitted.',
    },
    {
      action: 'lock',
      label: 'Lock (Emergency)',
      variant: 'outline',
      confirm: true,
      description: 'Freeze the active exam immediately.',
    },
  ],
  grading: [
    {
      action: 'publish',
      label: 'Publish Results',
      variant: 'primary',
      confirm: false,
      description: 'Release results so students can view their scores.',
    },
    {
      action: 'lock',
      label: 'Lock',
      variant: 'outline',
      confirm: true,
      description: 'Freeze exam.',
    },
  ],
  published: [
    {
      action: 'lock',
      label: 'Lock',
      variant: 'outline',
      confirm: true,
      description: 'Freeze exam.',
    },
  ],
  locked: [
    {
      action: 'unlock',
      label: 'Unlock (revert to Draft)',
      variant: 'secondary',
      confirm: true,
      description: 'Unfreeze exam and return it to Draft status.',
    },
  ],
}

export const STATUS_LABELS = {
  draft: 'Draft',
  active: 'Live',
  grading: 'Grading',
  published: 'Published',
  locked: 'Locked',
}

export const STATUS_CLASSES = {
  draft: 'bg-slate-100 text-slate-700',
  active: 'bg-emerald-100 text-emerald-700',
  grading: 'bg-amber-100 text-amber-700',
  published: 'bg-blue-100 text-blue-700',
  locked: 'bg-rose-100 text-rose-700',
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
    currentExamAttempts: [],   // monitoring
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
    canDelete: () => (exam) => ['draft', 'locked', 'published'].includes((exam?.status || '').toLowerCase()),

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

    liveExams: (state) => state.exams.filter((e) => (e.status || '').toLowerCase() === 'active'),
    draftExams: (state) => state.exams.filter((e) => (e.status || '').toLowerCase() === 'draft'),
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

    // ── Lifecycle (Teacher-owned, no admin) ───────────────────────────────────

    /**
     * draft → active
     * Teacher launches exam directly. No admin approval gate.
     */
    async activateExam(id, sessionDurationMinutes) {
      const result = await activateExam(id, { session_duration_minutes: sessionDurationMinutes })
      await this.fetchExam(id)
      return result
    },

    /**
     * active → grading
     * Teacher ends session. All ongoing student attempts are force-submitted by backend.
     */
    async endSession(id) {
      const result = await endSession(id)
      await this.fetchExam(id)
      return result
    },

    /**
     * grading → published
     * Teacher publishes results.
     */
    async publishExam(id) {
      const result = await publishExam(id)
      await this.fetchExam(id)
      return result
    },

    /**
     * any → locked
     */
    async lockExam(id) {
      const result = await lockExam(id)
      await this.fetchExam(id)
      return result
    },

    /**
     * locked → draft
     */
    async unlockExam(id) {
      const result = await unlockExam(id)
      await this.fetchExam(id)
      return result
    },

    // ── Questions ─────────────────────────────────────────────────────────────

    async fetchExamQuestions(examId) {
      const questions = await getExamQuestions(examId)
      this.currentExamQuestions = Array.isArray(questions) ? questions : (questions?.data || [])
      return this.currentExamQuestions
    },

    async addQuestion(examId, payload) {
      const result = await addQuestionToExam(examId, payload)
      this.currentExamQuestions.push(result)
      return result
    },

    async removeQuestion(examId, examQuestionId) {
      await removeQuestionFromExam(examId, examQuestionId)
      this.currentExamQuestions = this.currentExamQuestions.filter(
        (q) => q.id !== examQuestionId && q.exam_question_id !== examQuestionId,
      )
    },

    async updateQuestion(examId, examQuestionId, payload) {
      const result = await updateExamQuestion(examId, examQuestionId, payload)
      this.currentExamQuestions = this.currentExamQuestions.map((q) =>
        (q.id === examQuestionId || q.exam_question_id === examQuestionId) ? result : q,
      )
      return result
    },

    // ── Attendance ────────────────────────────────────────────────────────────

    async fetchClassStudents(examId) {
      const students = await getClassStudentsForAttendance(examId)
      this.currentExamStudents = Array.isArray(students) ? students : (students?.data || [])
      return this.currentExamStudents
    },

    async fetchAttendanceStudents(examId) {
      return this.fetchClassStudents(examId)
    },

    async saveAttendance(examId, attendance) {
      return await saveAttendance(examId, attendance)
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

    // ── Results ───────────────────────────────────────────────────────────────

    async fetchResults(examId) {
      const results = await getExamResults(examId)
      this.currentExamResults = Array.isArray(results) ? results : (results?.data || [])
      return this.currentExamResults
    },

    // ── Metadata ──────────────────────────────────────────────────────────────

    async loadFormMetadata() {
      const [subjects, classLevels, sessions] = await Promise.allSettled([
        getSubjects(),
        getClassLevels(),
        getAcademicSessions(),
      ])
      if (subjects.status === 'fulfilled') this.subjects = subjects.value?.data ?? subjects.value ?? []
      if (classLevels.status === 'fulfilled') this.classLevels = classLevels.value?.data ?? classLevels.value ?? []
      if (sessions.status === 'fulfilled') this.academicSessions = sessions.value?.data ?? sessions.value ?? []
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
      this.questionBank = result?.data ?? result ?? []
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
     * Generic lifecycle action dispatcher — used by ExamWizard publish flow.
     * NOTE: admin-approval actions (submit-for-review, activate) are no-ops since
     * we removed the admin workflow. Only teacher-owned transitions are honoured.
     */
    async performLifecycleAction(examId, action, payload = {}) {
      switch (action) {
        case 'activate':
          return this.activateExam(examId, payload.session_duration_minutes || 60)
        case 'end-session':
          return this.endSession(examId)
        case 'publish':
          return this.publishExam(examId)
        case 'lock':
          return this.lockExam(examId)
        case 'unlock':
          return this.unlockExam(examId)
        case 'submit-for-review':
          // Admin review removed — silently treat as no-op save (exam stays draft)
          console.info('[ExamStore] submit-for-review is a no-op in teacher-only mode')
          return null
        default:
          throw new Error(`Unknown lifecycle action: ${action}`)
      }
    },

    // ── Private ───────────────────────────────────────────────────────────────

    _replaceInList(record) {
      const idx = this.exams.findIndex((e) => e.id === record.id)
      if (idx !== -1) this.exams[idx] = record
    },
  },
})
/* ── Patch: missing aliases used by ExamWizard ── */
