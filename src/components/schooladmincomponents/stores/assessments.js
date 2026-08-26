import { defineStore } from 'pinia'
import { useSchoolAdminUiStore } from './ui'
import { useSchoolAdminSessionsStore } from './sessions'
import {
  getAssessments,
  getAssessment,
  createAssessment as apiCreateAssessment,
  updateAssessment as apiUpdateAssessment,
  deleteAssessment as apiDeleteAssessment,
  createSchedule as apiCreateSchedule,
  updateSchedule as apiUpdateSchedule,
  deleteSchedule as apiDeleteSchedule,
  getScheduleSubjects,
  createScheduleSubject as apiCreateScheduleSubject,
  updateScheduleSubject as apiUpdateScheduleSubject,
  deleteScheduleSubject as apiDeleteScheduleSubject,
  closeSubmissions as apiCloseSubmissions,
  reopenSubmissions as apiReopenSubmissions,
  activateSchedule as apiActivateSchedule,
  completeSchedule as apiCompleteSchedule,
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
  if (status && typeof status === 'object') status = status.assessment_status || status.assessmentStatus || status.status
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
  const status = (typeof assessment === 'string' ? assessment : assessment?.assessment_status || assessment?.assessmentStatus || assessment?.status || '').toLowerCase()
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

/**
 * The UI works with one flat "assessment" object that carries both the
 * Assessment DEFINITION (title/description/marks/class) and its current
 * SCHEDULE's dates/statuses (§1/§5.2 of the refactor spec split these into
 * two real resources). This flattens a schedule onto its parent definition
 * so the calendar/forms don't need to change shape — `schedule_id` is kept
 * so store actions know which schedule to call.
 */
const flattenScheduleOntoAssessment = (assessment, schedule) => {
  if (!schedule) {
    return {
      ...assessment,
      schedule_id: assessment?.schedule_id ?? null,
      scheduled_date: assessment?.scheduled_date ?? '',
      question_submission_ends: assessment?.question_submission_ends ?? '',
      assessment_starts: assessment?.assessment_starts ?? '',
      assessment_ends: assessment?.assessment_ends ?? '',
      question_submission_status: assessment?.question_submission_status ?? 'open',
      assessment_status: assessment?.assessment_status ?? 'draft',
      academic_session_id: assessment?.academic_session_id ?? '',
      term_id: assessment?.term_id ?? '',
    }
  }
  const scheduledDate = schedule.assessment_starts || schedule.question_submission_ends || ''
  return {
    ...assessment,
    schedule_id: schedule.id,
    scheduled_date: scheduledDate,
    scheduledDate,
    __calendarOnly: false,
    class_level_id: schedule.class_level_id ?? schedule.classLevelId ?? schedule.classLevel?.id ?? assessment.class_level_id ?? '',
    class_arm_id: schedule.class_arm_id ?? schedule.classArmId ?? schedule.classArm?.id ?? assessment.class_arm_id ?? '',
    classLevel: schedule.classLevel ?? assessment.classLevel,
    classArm: schedule.classArm ?? assessment.classArm,
    term: schedule.term ?? assessment.term,
    academicSession: schedule.academicSession ?? assessment.academicSession,
    academic_session_id: schedule.academic_session_id ?? schedule.academicSessionId ?? schedule.academicSession?.id ?? '',
    term_id: schedule.term_id ?? schedule.termId ?? schedule.term?.id ?? '',
    question_submission_ends: schedule.question_submission_ends ?? schedule.questionSubmissionEnds ?? '',
    assessment_starts: schedule.assessment_starts ?? schedule.assessmentStarts ?? '',
    assessment_ends: schedule.assessment_ends ?? schedule.assessmentEnds ?? '',
    question_submission_status: (schedule.question_submission_status ?? schedule.questionSubmissionStatus ?? 'open').toLowerCase(),
    assessment_status: (schedule.assessment_status ?? schedule.assessmentStatus ?? 'draft').toLowerCase(),
  }
}

const normalizeAssessment = (assessment) => ({
  ...assessment,
  class_level_id: assessment?.class_level_id ?? assessment?.classLevelId ?? '',
  class_arm_id: assessment?.class_arm_id ?? assessment?.classArmId ?? '',
  total_marks: assessment?.total_marks ?? assessment?.totalMarks ?? 0,
  duration_minutes: assessment?.duration_minutes ?? assessment?.durationMinutes ?? null,
  description: assessment?.description ?? assessment?.instructions ?? '',
  schedule_id: assessment?.schedule_id ?? null,
  scheduled_date: assessment?.scheduled_date ?? '',
  question_submission_ends: assessment?.question_submission_ends ?? '',
  assessment_starts: assessment?.assessment_starts ?? '',
  assessment_ends: assessment?.assessment_ends ?? '',
  question_submission_status: assessment?.question_submission_status ?? 'open',
  assessment_status: assessment?.assessment_status ?? 'draft',
})

/** Pick the schedule to surface on the flat object when an assessment has more than one: prefer the one still in play. */
const pickRelevantSchedule = (schedules) => {
  if (!schedules?.length) return null
  const byPriority = (s) => {
    const status = (s.assessment_status ?? s.assessmentStatus ?? '').toLowerCase()
    if (status === 'draft') return 0
    if (status === 'active') return 1
    return 2 // completed
  }
  return [...schedules].sort((a, b) => byPriority(a) - byPriority(b))[0]
}

export const useAssessmentsStore = defineStore('assessments', {
  state: () => ({
    assessments: [],
    submissions: [],
    current: null,
    currentSubmission: null,
    scheduleSubjects: [],
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

    /**
     * Assessment definitions don't carry dates — the calendar needs each
     * one's current schedule merged on. The assessments endpoint includes
     * `schedules[]`, so no per-assessment schedule request is needed.
     */
    async _hydrateWithSchedules(definitions) {
      return definitions.map((assessment) => {
        const schedules = Array.isArray(assessment.schedules)
          ? assessment.schedules
          : (assessment.schedules?.data ?? [])
        return flattenScheduleOntoAssessment(normalizeAssessment(assessment), pickRelevantSchedule(schedules))
      })
    },

    async fetchAssessments(params = {}) {
      this.loading = true
      this.error = null
      try {
        const data = await getAssessments(params)
        const apiRecords = Array.isArray(data) ? data : (data?.data ?? [])
        this.assessments = await this._hydrateWithSchedules(apiRecords)
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
        const definition = normalizeAssessment(await getAssessment(id))
        const schedules = Array.isArray(definition.schedules)
          ? definition.schedules
          : (definition.schedules?.data ?? [])
        const schedule = pickRelevantSchedule(schedules)
        this.current = flattenScheduleOntoAssessment(definition, schedule)
        this.assessments = this.assessments.map((item) => (String(item.id) === String(id) ? { ...item, ...this.current } : item))
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
        this.assessments = await this._hydrateWithSchedules(apiRecords)
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
        // 409: definitions freeze while any schedule is active/completed.
        this.error = error?.message || 'Failed to update assessment.'
        this._toast('Unable to update assessment', this.error)
        throw error
      }
    },

    async deleteAssessment(id) {
      try {
        await apiDeleteAssessment(id)
        this.assessments = this.assessments.filter((item) => String(item.id) !== String(id))
        this._toast('Assessment deleted', 'The assessment was removed.', 'success')
      } catch (error) {
        this.error = error?.message || 'Failed to delete assessment.'
        this._toast('Unable to delete assessment', this.error)
        throw error
      }
    },

    /* ------------------------------------------------------------------ *
     * Lifecycle — real actions all target the SCHEDULE now, not the
     * definition. "Open" no longer exists: creating a schedule opens its
     * question window immediately (§2 Locked Decision #6).
     * ------------------------------------------------------------------ */
    async closeSubmissions(assessmentId) {
      const scheduleId = this.getAssessmentById(assessmentId)?.schedule_id
      if (!scheduleId) throw new Error('This assessment has not been scheduled yet.')
      try {
        const record = await apiCloseSubmissions(scheduleId)
        this._applySchedule(assessmentId, record, { question_submission_status: 'closed' })
        this._toast('Submissions closed', 'The teacher submission window is closed.', 'success')
        return record
      } catch (error) {
        this.error = error?.message || 'Failed to close submissions.'
        this._toast('Unable to close submissions', this.error)
        throw error
      }
    },

    /** payload: { question_submission_ends: future ISO } */
    async reopenSubmissions(assessmentId, payload) {
      const scheduleId = this.getAssessmentById(assessmentId)?.schedule_id
      if (!scheduleId) throw new Error('This assessment has not been scheduled yet.')
      try {
        const record = await apiReopenSubmissions(scheduleId, payload)
        this._applySchedule(assessmentId, record, { question_submission_status: 'open', ...payload })
        this._toast('Submissions reopened', 'Teachers can submit again before the new deadline.', 'success')
        return record
      } catch (error) {
        this.error = error?.message || 'Failed to reopen submissions.'
        this._toast('Unable to reopen submissions', this.error)
        throw error
      }
    },

    async activateAssessment(assessmentId) {
      const scheduleId = this.getAssessmentById(assessmentId)?.schedule_id
      if (!scheduleId) throw new Error('This assessment has not been scheduled yet.')
      try {
        const record = await apiActivateSchedule(scheduleId)
        this._applySchedule(assessmentId, record, { assessment_status: 'active' })
        this._toast('Schedule activated', 'Approved submissions are now live exams for students.', 'success')
        return record
      } catch (error) {
        // 409: question window still open / master window not set / no approved
        // submission / a subject is missing its slot (§6.2).
        this.error = error?.message || 'Failed to activate assessment.'
        this._toast('Unable to activate assessment', this.error)
        throw error
      }
    },

    async completeAssessment(assessmentId) {
      const scheduleId = this.getAssessmentById(assessmentId)?.schedule_id
      if (!scheduleId) throw new Error('This assessment has not been scheduled yet.')
      try {
        const record = await apiCompleteSchedule(scheduleId)
        this._applySchedule(assessmentId, record, { assessment_status: 'completed' })
        this._toast('Assessment completed', 'The assessment is now marked complete.', 'success')
        return record
      } catch (error) {
        this.error = error?.message || 'Failed to complete assessment.'
        this._toast('Unable to complete assessment', this.error)
        throw error
      }
    },

    _applySchedule(assessmentId, record, fallbackPatch = {}) {
      const existing = this.getAssessmentById(assessmentId) || (this.current?.id === assessmentId ? this.current : null)
      const patch = record && record.id
        ? flattenScheduleOntoAssessment(existing || {}, record)
        : { ...existing, ...fallbackPatch }
      this.assessments = this.assessments.map((item) => (String(item.id) === String(assessmentId) ? { ...item, ...patch } : item))
      if (this.current?.id === assessmentId) this.current = { ...this.current, ...patch }
    },

    /**
     * "Save Assessment" on the calendar page. Creates the DEFINITION only
     * (§5.1 body: title/class_level_id/class_arm_id/total_marks/
     * duration_minutes/description) — session/term/dates don't belong here,
     * they live on the schedule (§2 Locked Decision #4). The assessment
     * won't appear dated on the calendar until a schedule is added via
     * saveSubmissionConfiguration below.
     */
    async createScheduledAssessment(payload) {
      try {
        const createdRecord = normalizeAssessment(
          await apiCreateAssessment({
            title: payload.title,
            total_marks: payload.total_marks,
            duration_minutes: payload.duration_minutes || null,
            description: payload.description || null,
          })
        )
        const record = {
          ...createdRecord,
          scheduled_date: payload.scheduled_date || '',
          scheduledDate: payload.scheduled_date || '',
          __calendarOnly: true,
        }
        this.assessments = [record, ...this.assessments.filter((item) => String(item.id) !== String(record.id))]
        this.selectAssessment(record.id)
        this._toast('Assessment created', 'Set its question window below to put it on the calendar.', 'success')
        return record
      } catch (error) {
        this.error = error?.message || 'Failed to create assessment.'
        this._toast('Unable to create assessment', this.error)
        throw error
      }
    },

    /** Editing an existing assessment — definition fields only; PATCH /api/assessments/{id}. */
    async saveScheduledAssessment(id, payload) {
      try {
        const record = normalizeAssessment(
          await apiUpdateAssessment(id, {
            title: payload.title,
            total_marks: payload.total_marks,
            duration_minutes: payload.duration_minutes || null,
            description: payload.description || null,
          })
        )
        const existing = this.getAssessmentById(id)
        const merged = { ...existing, ...record }
        this.assessments = this.assessments.map((item) => (String(item.id) === String(id) ? merged : item))
        if (this.current?.id === id) this.current = merged
        this.selectAssessment(id)
        this._toast('Assessment updated', 'The assessment was updated successfully.', 'success')
        return merged
      } catch (error) {
        // 409: definition frozen while a schedule is active/completed.
        this.error = error?.message || 'Failed to update assessment.'
        this._toast('Unable to update assessment', this.error)
        throw error
      }
    },

    /**
     * The "Continue to Submission Setup" panel — this is the real Schedule
     * resource (§5.2). Creates the schedule (opens the question window
     * immediately) the first time, PATCHes it thereafter. session_id/term_id
     * are never sent — the backend resolves them from the current term.
     */
    async saveSubmissionConfiguration(assessmentId, payload) {
      const existing = this.getAssessmentById(assessmentId)
      if (!existing) throw new Error('Assessment not found.')
      const classLevelId = payload.class_level_id ?? payload.classLevelId ?? existing.class_level_id ?? existing.classLevelId
      if (!classLevelId) throw new Error('Class level is required to save the schedule.')

      const body = {
        class_level_id: classLevelId,
        ...(payload.class_arm_id ? { class_arm_id: payload.class_arm_id } : { class_arm_id: null }),
        question_submission_ends: payload.question_submission_ends,
        ...(payload.assessment_starts ? { assessment_starts: payload.assessment_starts } : {}),
        ...(payload.assessment_ends ? { assessment_ends: payload.assessment_ends } : {}),
      }

      try {
        const record = existing.schedule_id
          ? await apiUpdateSchedule(existing.schedule_id, body)
          : await apiCreateSchedule(assessmentId, body)

        const merged = flattenScheduleOntoAssessment(existing, record)
        this.assessments = this.assessments.map((item) => (String(item.id) === String(assessmentId) ? merged : item))
        if (this.current?.id === assessmentId) this.current = merged
        this.selectAssessment(assessmentId)
        this._toast('Submission configuration saved', 'The question window is now open for teachers.', 'success')
        return merged
      } catch (error) {
        // 422: past deadline / bad window. 409: already scheduled this term /
        // no current term configured / schedule no longer in draft.
        this.error = error?.message || 'Failed to save submission configuration.'
        this._toast('Unable to save submission configuration', this.error)
        throw error
      }
    },

    async deleteSchedule(assessmentId) {
      const existing = this.getAssessmentById(assessmentId)
      if (!existing?.schedule_id) throw new Error('This assessment has not been scheduled yet.')

      try {
        await apiDeleteSchedule(existing.schedule_id)
        const cleared = {
          ...existing,
          schedule_id: null,
          scheduled_date: '',
          scheduledDate: '',
          question_submission_ends: '',
          assessment_starts: '',
          assessment_ends: '',
          question_submission_status: 'open',
          assessment_status: 'draft',
          academic_session_id: '',
          term_id: '',
        }
        this.assessments = this.assessments.map((item) => (String(item.id) === String(assessmentId) ? cleared : item))
        if (this.current?.id === assessmentId) this.current = cleared
        this.selectedAssessmentId = null
        this._toast('Schedule deleted', 'The assessment schedule was deleted.', 'success')
        return cleared
      } catch (error) {
        this.error = error?.message || 'Failed to delete schedule.'
        this._toast('Unable to delete schedule', this.error)
        throw error
      }
    },

    async fetchScheduleSubjects(assessmentId) {
      const scheduleId = this.getAssessmentById(assessmentId)?.schedule_id
      if (!scheduleId) {
        this.scheduleSubjects = []
        return []
      }
      try {
        const data = await getScheduleSubjects(scheduleId)
        this.scheduleSubjects = Array.isArray(data) ? data : (data?.data ?? [])
      } catch (error) {
        this.scheduleSubjects = []
        throw error
      }
      return this.scheduleSubjects
    },

    async createScheduleSubject(assessmentId, payload) {
      const scheduleId = this.getAssessmentById(assessmentId)?.schedule_id
      if (!scheduleId) throw new Error('This assessment has not been scheduled yet.')
      const record = await apiCreateScheduleSubject(scheduleId, payload)
      this.scheduleSubjects = [...this.scheduleSubjects, record]
      return record
    },

    async updateScheduleSubject(assessmentId, slotId, payload) {
      const scheduleId = this.getAssessmentById(assessmentId)?.schedule_id
      if (!scheduleId) throw new Error('This assessment has not been scheduled yet.')
      const record = await apiUpdateScheduleSubject(scheduleId, slotId, payload)
      this.scheduleSubjects = this.scheduleSubjects.map((slot) => (String(slot.id) === String(slotId) ? record : slot))
      return record
    },

    async deleteScheduleSubject(assessmentId, slotId) {
      const scheduleId = this.getAssessmentById(assessmentId)?.schedule_id
      if (!scheduleId) throw new Error('This assessment has not been scheduled yet.')
      await apiDeleteScheduleSubject(scheduleId, slotId)
      this.scheduleSubjects = this.scheduleSubjects.filter((slot) => String(slot.id) !== String(slotId))
    },

    async fetchMySubmission(assessmentId) {
      const scheduleId = this.getAssessmentById(assessmentId)?.schedule_id || (this.current?.id === assessmentId ? this.current.schedule_id : null)
      if (!scheduleId) {
        this.currentSubmission = null
        return null
      }
      try {
        this.currentSubmission = await getMySubmission(scheduleId)
        return this.currentSubmission
      } catch {
        this.currentSubmission = null
        return null
      }
    },

    async createSubmission(assessmentId, payload) {
      const scheduleId = this.getAssessmentById(assessmentId)?.schedule_id || (this.current?.id === assessmentId ? this.current.schedule_id : null)
      if (!scheduleId) {
        this.error = 'This assessment has not been scheduled yet.'
        this._toast('Unable to create submission', this.error)
        throw new Error(this.error)
      }
      try {
        this.currentSubmission = await apiCreateSubmission(scheduleId, payload)
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
      const scheduleId = this.getAssessmentById(assessmentId)?.schedule_id
      if (!scheduleId) {
        this.submissions = []
        this.loading = false
        return
      }
      try {
        const data = await getSubmissions(scheduleId)
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
