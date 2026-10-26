import { getMySubmission } from '../../schooladmincomponents/services/api/assessments'
import { getStudents } from '../../schooladmincomponents/services/api/students'
import { useSchoolAdminSessionsStore } from '../../schooladmincomponents/stores/sessions'
import { useAssessmentsStore } from '../../schooladmincomponents/stores/assessments'
import { useNotificationStore } from '../../shared/stores/notifications'

const CACHE_PREFIX = 'teacher-dashboard-cache'
const CACHE_TTL_MS = 10 * 60 * 1000
const pendingPreloads = new Map()

const cacheKey = (userId, tenantHandle) =>
  `${CACHE_PREFIX}:${tenantHandle || 'default'}:${userId}`

const getOpenAssessments = (assessments) => assessments
  .filter((assessment) => (
    !!assessment.schedule_id &&
    (assessment.question_submission_status || 'open').toLowerCase() === 'open' &&
    assessment.question_submission_ends
  ))
  .sort((a, b) => new Date(a.question_submission_ends) - new Date(b.question_submission_ends))

const getScheduledAssessments = (assessments) => assessments.filter((assessment) => !!assessment.schedule_id)

const readCache = (userId, tenantHandle) => {
  if (typeof window === 'undefined') return null

  const key = cacheKey(userId, tenantHandle)
  try {
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return null

    const cached = JSON.parse(raw)
    if (
      cached.userId !== String(userId) ||
      Date.now() - cached.cachedAt > CACHE_TTL_MS ||
      cached.complete !== true ||
      !Array.isArray(cached.assessments) ||
      !cached.refData ||
      !Array.isArray(cached.students) ||
      !cached.mySubmissions ||
      !cached.assessmentSubmissions ||
      !Array.isArray(cached.notifications) ||
      cached.hasLoadedNotifications !== true ||
      cached.hasLoadedNotificationCount !== true ||
      !Array.isArray(cached.loadedEndpoints)
    ) {
      window.sessionStorage.removeItem(key)
      return null
    }
    return cached
  } catch (error) {
    console.warn('Unable to read teacher dashboard cache.', error)
    return null
  }
}

const removeCache = (userId, tenantHandle) => {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(cacheKey(userId, tenantHandle))
  } catch (error) {
    console.warn('Unable to clear teacher dashboard cache.', error)
  }
}

const writeCache = (userId, tenantHandle, snapshot) => {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(cacheKey(userId, tenantHandle), JSON.stringify({
      ...snapshot,
      userId: String(userId),
      cachedAt: Date.now(),
    }))
  } catch (error) {
    console.warn('Unable to cache teacher dashboard data.', error)
  }
}

const restoreSnapshot = (snapshot, store) => {
  store.assessments = snapshot.assessments
  store.refData = { ...store.refData, ...snapshot.refData }
  const sessionsStore = useSchoolAdminSessionsStore()
  sessionsStore.sessions = snapshot.sessions || []
  const notificationStore = useNotificationStore()
  notificationStore.notifications = snapshot.notifications
  notificationStore.unreadCount = snapshot.unreadCount
  notificationStore.hasLoadedList = snapshot.hasLoadedNotifications
  notificationStore.hasLoadedCount = snapshot.hasLoadedNotificationCount
  notificationStore.serverTotal = snapshot.notificationTotal
  return snapshot
}

const runTeacherDashboardPreload = async (user, tenantHandle = '', { strict = false } = {}) => {
  if (!user?.id) return null

  const store = useAssessmentsStore()
  const sessionsStore = useSchoolAdminSessionsStore()
  const notificationStore = useNotificationStore()
  removeCache(user.id, tenantHandle)
  const [studentsResult, refDataResult, assessmentsResult, notificationListResult, notificationCountResult] = await Promise.allSettled([
    getStudents({ teacher_id: user.id }),
    store.fetchRefData({ forceSessions: true }),
    store.fetchTeacherAssessments(),
    notificationStore.fetchNotificationsList(),
    notificationStore.fetchUnreadCount(),
  ])

  const failures = []
  if (studentsResult.status === 'rejected') failures.push(studentsResult.reason)
  if (refDataResult.status === 'rejected') failures.push(refDataResult.reason)
  else failures.push(...refDataResult.value)
  if (assessmentsResult.status === 'rejected') failures.push(assessmentsResult.reason)
  else if (assessmentsResult.value === false) failures.push(new Error(store.error || 'Unable to load teacher assessments.'))
  if (notificationListResult.status === 'rejected') failures.push(notificationListResult.reason)
  if (notificationCountResult.status === 'rejected') failures.push(notificationCountResult.reason)
  if (!notificationStore.hasLoadedList || !notificationStore.hasLoadedCount) {
    failures.push(new Error('Unable to load all teacher dashboard notification data.'))
  }
  sessionsStore.sessions = store.refData.sessions

  const studentResponse = studentsResult.status === 'fulfilled' ? studentsResult.value : null
  const students = Array.isArray(studentResponse)
    ? studentResponse
    : (studentResponse?.data || studentResponse?.students || [])
  const studentCount = studentResponse?.total ?? studentResponse?.meta?.total ?? students.length

  const openAssessments = getOpenAssessments(store.assessments)
  const scheduledAssessments = getScheduledAssessments(store.assessments)
  const submissionResults = await Promise.all(
    scheduledAssessments.map(async (assessment) => {
      try {
        return { id: assessment.id, submission: await getMySubmission(assessment.schedule_id) }
      } catch (error) {
        failures.push(error)
        return { id: assessment.id, submission: null }
      }
    })
  )

  const mySubmissions = {}
  for (const { id, submission } of submissionResults) {
    if (submission) mySubmissions[id] = submission
  }
  const assessmentSubmissions = Object.fromEntries(submissionResults.map(({ id, submission }) => [id, submission]))

  const snapshot = {
    assessments: store.assessments,
    refData: store.refData,
    sessions: sessionsStore.sessions,
    students,
    studentCount,
    mySubmissions,
    assessmentSubmissions,
    notifications: notificationStore.notifications,
    unreadCount: notificationStore.unreadCount,
    hasLoadedNotifications: notificationStore.hasLoadedList,
    hasLoadedNotificationCount: notificationStore.hasLoadedCount,
    notificationTotal: notificationStore.serverTotal,
    loadedEndpoints: [
      'GET /api/students?teacher_id={teacherId}',
      'GET /api/subjects',
      'GET /api/class-levels',
      'GET /api/academic-sessions',
      'GET /api/assessments',
      'GET /api/notifications (all pages)',
      'GET /api/notifications/unread-count',
      ...scheduledAssessments.flatMap((assessment) => {
        const endpoints = [`GET /api/assessment-schedules/${assessment.schedule_id}/submissions`]
        const submission = mySubmissions[assessment.id]
        if (submission?.id) endpoints.push(`GET /api/submissions/${submission.id}`)
        return endpoints
      }),
    ],
    complete: failures.length === 0,
  }
  if (strict && !snapshot.complete) {
    throw failures[0] || new Error('Unable to finish loading teacher dashboard data.')
  }
  if (snapshot.complete) writeCache(user.id, tenantHandle, snapshot)

  if (failures.length) {
    console.warn(
      'Teacher dashboard preload was incomplete; failed requests will be retried when the dashboard loads.',
      failures.map((error) => error?.message || String(error))
    )
  }

  return snapshot
}

export const preloadTeacherDashboardData = (user, tenantHandle = '', options = {}) => {
  if (!user?.id) return Promise.resolve(null)
  const key = cacheKey(user.id, tenantHandle)
  if (pendingPreloads.has(key)) return pendingPreloads.get(key)
  const pending = runTeacherDashboardPreload(user, tenantHandle, options)
    .finally(() => pendingPreloads.delete(key))
  pendingPreloads.set(key, pending)
  return pending
}

export const loadTeacherDashboardData = async (user, tenantHandle = '') => {
  if (!user?.id) return null

  const store = useAssessmentsStore()
  const cached = readCache(user.id, tenantHandle)
  if (!cached) {
    const pending = pendingPreloads.get(cacheKey(user.id, tenantHandle))
    if (pending) {
      const snapshot = await pending
      if (snapshot?.complete) return restoreSnapshot(snapshot, store)
    }
    return null
  }
  return restoreSnapshot(cached, store)
}

export const restoreCachedTeacherDashboardData = (user, tenantHandle = '') => {
  if (!user?.id) return false
  const cached = readCache(user.id, tenantHandle)
  if (!cached) return false
  restoreSnapshot(cached, useAssessmentsStore())
  return true
}
