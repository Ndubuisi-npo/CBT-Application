import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated, getAuthRole } from '../js/lib/auth'
import { getTenantHandle } from '../js/lib/api'

// pages
import LandingPage from '../components/landingpage/landingPage.vue';
import Onboarding from '../components/onboardingpage/onboarding.vue';
import SchoolAdminRoot from '../components/schooladmincomponents/SchoolAdminRoot.vue';
import SchoolAdminLogin from '../components/schooladmincomponents/Login.vue';
import SchoolAdminLayout from '../components/schooladmincomponents/layouts/SchoolAdminLayout.vue';
import SchoolAdminDashboard from '../components/schooladmincomponents/pages/DashboardPage.vue';
import SchoolAdminSessions from '../components/schooladmincomponents/pages/SessionsPage.vue';
import SchoolAdminSessionTerms from '../components/schooladmincomponents/pages/SessionTermsPage.vue';
import SchoolAdminClassLevels from '../components/schooladmincomponents/pages/ClassLevelsPage.vue';
import SchoolAdminClassArms from '../components/schooladmincomponents/pages/ClassArmsPage.vue';
import SchoolAdminTeachers from '../components/schooladmincomponents/pages/TeachersPage.vue';
import SchoolAdminStudents from '../components/schooladmincomponents/pages/StudentsPage.vue';
import TeachersDashboard from '../components/teacherscomponent/pages/TeachersDashboard.vue';
import TeachersQuestionBank from '../components/teacherscomponent/pages/QuestionBank.vue';
import TeachersExamWizard from '../components/teacherscomponent/pages/ExamWizard.vue';
import TeachersExamList from '../components/teacherscomponent/pages/ExamList.vue';
import TeachersTopicsPage from '../components/teacherscomponent/pages/TopicsPage.vue';
import TeachersResultsPage from '../components/teacherscomponent/pages/ResultsPage.vue';
import TeachersSettingsPage from '../components/teacherscomponent/pages/TeachersSettingsPage.vue';
import TeachersMyClasses from '../components/teacherscomponent/pages/MyClasses.vue';
import TeachersStudentsPage from '../components/teacherscomponent/pages/StudentsPage.vue';
import TeachersAttendancePage from '../components/teacherscomponent/pages/AttendancePage.vue';
import TeachersGradingPage from '../components/teacherscomponent/pages/GradingPage.vue';
import TeachersTimetablePage from '../components/teacherscomponent/pages/TimetablePage.vue';
import SchoolAdminSubjects from '../components/schooladmincomponents/pages/SubjectsPage.vue';
import SchoolAdminSubjectAssignTeacher from '../components/schooladmincomponents/pages/SubjectAssignTeacherPage.vue';
import SchoolAdminSettings from '../components/schooladmincomponents/pages/SettingsPage.vue';
import SchoolAdminProfile from '../components/schooladmincomponents/pages/ProfilePage.vue';
import SuperAdminRoot from '../components/superadmincomponent/SuperAdminRoot.vue';
import SuperAdminLayout from '../components/superadmincomponent/layouts/SuperAdminLayout.vue';
import SuperAdminDashboard from '../components/superadmincomponent/pages/DashboardPage.vue';
import SuperAdminTenants from '../components/superadmincomponent/pages/TenantsPage.vue';
import SuperAdminTenantCreate from '../components/superadmincomponent/pages/TenantCreatePage.vue';
import SuperAdminTenantEdit from '../components/superadmincomponent/pages/TenantEditPage.vue';
import SuperAdminPlans from '../components/superadmincomponent/pages/PlansPage.vue';
import SuperAdminAuditLogs from '../components/superadmincomponent/pages/AuditLogsPage.vue';
import SuperAdminSettings from '../components/superadmincomponent/pages/SettingsPage.vue';
import StudentImportPage from '../components/schooladmincomponents/pages/StudentImportPage.vue';
import TeacherImportPage from '../components/schooladmincomponents/pages/TeacherImportPage.vue';

const routes = [
  { path: '/', name: 'LandingPage', component: LandingPage },
  { path: '/onboarding', name: 'Onboarding', component: Onboarding },
  { path: '/login', name: 'SchoolAdminLogin', component: SchoolAdminLogin },
  { path: '/signin', redirect: '/login' },
  { path: '/super-admin/login', redirect: '/login' },
  { path: '/dashboard', redirect: '/school-admin/dashboard' },
  {
    path: '/school-admin',
    component: SchoolAdminRoot,
    children: [
      { path: '', redirect: '/login' },
      {
        path: '',
        component: SchoolAdminLayout,
        children: [
          { path: 'dashboard', name: 'SchoolAdminDashboard', component: SchoolAdminDashboard },
          { path: 'sessions', name: 'SchoolAdminSessions', component: SchoolAdminSessions },
          { path: 'terms/:id', name: 'SchoolAdminSessionTerms', component: SchoolAdminSessionTerms },
          { path: 'class-levels', name: 'SchoolAdminClassLevels', component: SchoolAdminClassLevels },
          { path: 'classes/:id', name: 'SchoolAdminClasses', component: SchoolAdminClassArms },
          { path: 'teachers', name: 'SchoolAdminTeachers', component: SchoolAdminTeachers },
          { path: 'teachers/import', name: 'SchoolAdminTeacherImport', component: TeacherImportPage },
          { path: 'students', name: 'SchoolAdminStudents', component: SchoolAdminStudents },
          { path: 'students/import', name: 'SchoolAdminStudentImport', component: StudentImportPage },
          { path: 'subjects', name: 'SchoolAdminSubjects', component: SchoolAdminSubjects },
          { path: 'subjects/:id/assign-teacher', name: 'SchoolAdminSubjectAssignTeacher', component: SchoolAdminSubjectAssignTeacher },
          { path: 'settings', name: 'SchoolAdminSettings', component: SchoolAdminSettings },
          { path: 'profile', name: 'SchoolAdminProfile', component: SchoolAdminProfile },
        ],
      },
    ],
  },
  {
    path: '/teachers',
    component: SchoolAdminRoot,
    children: [
      { path: '', redirect: '/login' },
      {
        path: '',
        component: SchoolAdminLayout,
        children: [
          { path: 'dashboard', name: 'TeachersDashboard', component: TeachersDashboard },
          { path: 'my-classes', name: 'TeachersMyClasses', component: TeachersMyClasses },
          { path: 'questions', name: 'TeachersQuestionBank', component: TeachersQuestionBank },
          { path: 'topics', name: 'TeachersTopicsPage', component: TeachersTopicsPage },
          { path: 'exam-wizard', name: 'TeachersExamWizard', component: TeachersExamWizard },
          { path: 'exams', name: 'TeachersExamList', component: TeachersExamList },
          { path: 'students', name: 'TeachersStudentsPage', component: TeachersStudentsPage },
          { path: 'attendance', name: 'TeachersAttendancePage', component: TeachersAttendancePage },
          { path: 'grading', name: 'TeachersGradingPage', component: TeachersGradingPage },
          { path: 'results', name: 'TeachersResultsPage', component: TeachersResultsPage },
          { path: 'timetable', name: 'TeachersTimetablePage', component: TeachersTimetablePage },
          { path: 'settings', name: 'TeachersSettings', component: TeachersSettingsPage },
          { path: 'profile', name: 'TeachersProfile', component: SchoolAdminProfile },
        ],
      },
    ],
  },
  {
    path: '/super-admin',
    component: SuperAdminRoot,
    children: [
      { path: '', redirect: '/login' },
      {
        path: '',
        component: SuperAdminLayout,
        children: [
          { path: 'dashboard', name: 'SuperAdminDashboard', component: SuperAdminDashboard },
          { path: 'tenants', name: 'SuperAdminTenants', component: SuperAdminTenants },
          { path: 'tenants/new', name: 'SuperAdminTenantCreate', component: SuperAdminTenantCreate },
          { path: 'tenants/:id/edit', name: 'SuperAdminTenantEdit', component: SuperAdminTenantEdit },
          { path: 'plans', name: 'SuperAdminPlans', component: SuperAdminPlans },
          { path: 'audit-logs', name: 'SuperAdminAuditLogs', component: SuperAdminAuditLogs },
          { path: 'settings', name: 'SuperAdminSettings', component: SuperAdminSettings },
        ],
      },
    ],
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const roleRedirectMap = {
  super_admin: '/super-admin/dashboard',
  school_admin: '/school-admin/dashboard',
  teacher: '/teachers/dashboard',
  student: '/student/dashboard',
}

const buildRedirectUrl = (path) => {
  const tenantHandle = getTenantHandle()
  if (!tenantHandle) return path
  return `${window.location.origin}${path}`
}

router.beforeEach((to, from, next) => {
  const requiresAuth = to.path.startsWith('/school-admin') || to.path.startsWith('/super-admin') || to.path.startsWith('/teachers')
  const isLoginPage = to.path === '/login'

  if (requiresAuth && !isLoginPage) {
    if (!isAuthenticated()) {
      next('/login')
      return
    }

    const userRole = getAuthRole()

    if (to.path.startsWith('/super-admin') && userRole !== 'super_admin') {
      const redirectPath = roleRedirectMap[userRole] || '/school-admin/dashboard'
      next(buildRedirectUrl(redirectPath))
      return
    }

    if (to.path.startsWith('/school-admin') && userRole !== 'school_admin') {
      const redirectPath = roleRedirectMap[userRole] || '/super-admin/dashboard'
      next(buildRedirectUrl(redirectPath))
      return
    }
  }

  next()
})

export default router
