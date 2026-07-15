/**
 * schoolAdminTour.js
 *
 * Step definitions for the School Admin onboarding tour.
 *
 * Kept intentionally lean — only the handful of stops a brand new school
 * admin actually needs to get oriented: the sidebar, the dashboard, how to
 * add a teacher and a student, where exam oversight/settings live, and how
 * to restart the tour later. Every step points at a `data-tour="..."`
 * attribute (never a CSS class) so it survives styling changes.
 */

import { useSchoolAdminUiStore } from '../components/schooladmincomponents/stores/ui'
import { expandSidebar, openMobileSidebarIfNeeded } from './tourDom'

function revealSidebar() {
  const uiStore = useSchoolAdminUiStore()
  expandSidebar(uiStore)
  openMobileSidebarIfNeeded(uiStore)
}

export function getSchoolAdminTourSteps() {
  return [
    {
      id: 'sidebar-intro',
      route: '/school-admin/dashboard',
      selector: '[data-tour="sidebar-nav"]',
      beforeShow: revealSidebar,
      title: 'Welcome to your School Admin workspace 👋',
      description:
        'This sidebar is your control center — academics, people, and oversight tools are all one click away. Let\'s take a quick tour.',
      side: 'right',
      align: 'start',
    },
    {
      id: 'dashboard-stats',
      route: '/school-admin/dashboard',
      selector: '[data-tour="admin-stats-cards"]',
      title: 'Your school at a glance',
      description: 'These cards track your live student, teacher, class, and subject counts — always up to date.',
      side: 'bottom',
    },
    {
      id: 'dashboard-quick-nav',
      route: '/school-admin/dashboard',
      selector: '[data-tour="admin-quick-nav"]',
      title: 'Quick navigation',
      description: 'Jump straight into the sections you\'ll use most, right from the dashboard.',
      side: 'top',
    },
    {
      id: 'nav-teachers',
      route: '/school-admin/dashboard',
      selector: '[data-tour="nav-teachers"]',
      beforeShow: revealSidebar,
      title: 'Teachers',
      description: 'Manage your teaching staff here — add new teachers, review profiles, and assign subjects.',
      side: 'right',
    },
    {
      id: 'create-teacher',
      route: '/school-admin/teachers',
      selector: '[data-tour="create-teacher-btn"]',
      title: 'Add a teacher',
      description:
        'Click here to add a new teacher. The first time that teacher logs in, they\'ll get their own guided tour automatically — you don\'t need to explain anything!',
      side: 'bottom',
    },
    {
      id: 'nav-students',
      route: '/school-admin/teachers',
      selector: '[data-tour="nav-students"]',
      beforeShow: revealSidebar,
      title: 'Students',
      description: 'Enroll students individually or in bulk, assign them to classes, and manage promotions.',
      side: 'right',
    },
    {
      id: 'create-student',
      route: '/school-admin/students',
      selector: '[data-tour="create-student-btn"]',
      title: 'Add a student',
      description: 'Add students one at a time here, or use the Import option for bulk enrollment via spreadsheet.',
      side: 'bottom',
    },
    {
      id: 'nav-sessions',
      route: '/school-admin/students',
      selector: '[data-tour="nav-sessions"]',
      beforeShow: revealSidebar,
      title: 'Academic Sessions',
      description: 'Set up your school year here — e.g. "2025/2026" — with terms that everything else (classes, exams) runs on.',
      side: 'right',
    },
    {
      id: 'create-session',
      route: '/school-admin/sessions',
      selector: '[data-tour="create-session-btn"]',
      title: 'Create a session',
      description: 'Start a new academic session here, then add its terms so teachers can schedule exams within them.',
      side: 'bottom',
    },
    {
      id: 'nav-class-levels',
      route: '/school-admin/sessions',
      selector: '[data-tour="nav-class-levels"]',
      beforeShow: revealSidebar,
      title: 'Class Levels',
      description: 'Define the class levels your school uses (e.g. JSS1, SS2) — students and subjects are organized under these.',
      side: 'right',
    },
    {
      id: 'create-class-level',
      route: '/school-admin/class-levels',
      selector: '[data-tour="create-class-level-btn"]',
      title: 'Add a class level',
      description: 'Click here to add a new class level for your school.',
      side: 'bottom',
    },
    {
      id: 'nav-subjects',
      route: '/school-admin/class-levels',
      selector: '[data-tour="nav-subjects"]',
      beforeShow: revealSidebar,
      title: 'Subjects',
      description: 'Manage the subjects taught at your school and assign teachers to them here.',
      side: 'right',
    },
    {
      id: 'create-subject',
      route: '/school-admin/subjects',
      selector: '[data-tour="create-subject-btn"]',
      title: 'Add a subject',
      description: 'Click here to add a new subject, then assign it to the class levels and teachers that need it.',
      side: 'bottom',
    },
    {
      id: 'nav-exam-approvals',
      route: '/school-admin/subjects',
      selector: '[data-tour="nav-exam-approvals"]',
      beforeShow: revealSidebar,
      title: 'Exam oversight',
      description:
        'Teachers own the full exam lifecycle — creating, launching, and publishing results. You can review that activity here at any time.',
      side: 'right',
    },
    {
      id: 'nav-settings',
      route: '/school-admin/subjects',
      selector: '[data-tour="nav-settings"]',
      beforeShow: revealSidebar,
      title: 'Settings',
      description: 'Configure your school\'s grading scale and general preferences here.',
      side: 'right',
    },
    {
      id: 'settings-page',
      route: '/school-admin/settings',
      selector: '[data-tour="settings-page"]',
      title: 'School settings',
      description: 'This is where your grading system, password, and other school-wide preferences live.',
      side: 'top',
    },
    {
      id: 'finish',
      route: '/school-admin/settings',
      selector: '[data-tour="profile-menu-button"]',
      title: 'You are ready to manage your school 🎉',
      description:
        'Need this tour again? Open this profile menu any time and choose "Take Product Tour".',
      side: 'bottom',
      align: 'end',
    },
  ]
}
