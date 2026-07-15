/**
 * teacherTour.js
 *
 * Step definitions for the Teacher onboarding tour.
 *
 * This is the "much more detailed" tour required by the task, but still
 * trimmed to the essential workflow: dashboard orientation, the exam
 * lifecycle, a real walk-through of the Create Exam form (not just a
 * pointer at the page), Question Bank, Students, and Settings — plus how
 * to restart the tour later.
 */

import { useSchoolAdminUiStore } from '../components/schooladmincomponents/stores/ui'
import { expandSidebar, openMobileSidebarIfNeeded } from './tourDom'

function revealSidebar() {
  const uiStore = useSchoolAdminUiStore()
  expandSidebar(uiStore)
  openMobileSidebarIfNeeded(uiStore)
}

export function getTeacherTourSteps() {
  return [
    {
      id: 'sidebar-intro',
      route: '/teachers/dashboard',
      selector: '[data-tour="sidebar-nav"]',
      beforeShow: revealSidebar,
      title: 'Welcome to your Teacher workspace 👋',
      description:
        'You own the full exam lifecycle here — creating, launching, grading, and publishing results. Let\'s walk through it.',
      side: 'right',
      align: 'start',
    },
    {
      id: 'dashboard-stats',
      route: '/teachers/dashboard',
      selector: '[data-tour="teacher-stats-cards"]',
      title: 'Your teaching snapshot',
      description: 'Track your total exams, what\'s live right now, and upcoming activity at a glance.',
      side: 'bottom',
    },
    {
      id: 'nav-exams',
      route: '/teachers/dashboard',
      selector: '[data-tour="nav-exams"]',
      beforeShow: revealSidebar,
      title: 'My Exams',
      description: 'Every exam you create moves through a clear lifecycle: Draft → Active → Grading → Published.',
      side: 'right',
    },
    {
      id: 'create-exam-btn',
      route: '/teachers/exams',
      selector: '[data-tour="create-exam-btn"]',
      title: 'Create an exam',
      description: 'Let\'s create one together — click "Create Exam" to open the exam form, then hit Next.',
      side: 'bottom',
      allowInteraction: true,
    },
    {
      id: 'exam-title-field',
      route: '/teachers/exams/create',
      selector: '[data-tour="exam-title-field"]',
      title: 'Give it a title',
      description: 'Start with a clear, descriptive title — students and admins will see this everywhere.',
      side: 'bottom',
      allowInteraction: true,
    },
    {
      id: 'exam-duration-field',
      route: '/teachers/exams/create',
      selector: '[data-tour="exam-duration-field"]',
      title: 'Set the duration',
      description: 'This is how long students get once they start the exam, in minutes.',
      side: 'bottom',
      allowInteraction: true,
    },
    {
      id: 'exam-save-draft-btn',
      route: '/teachers/exams/create',
      selector: '[data-tour="exam-save-draft-btn"]',
      title: 'Save as a draft',
      description:
        'Save your progress any time as a Draft. Once you\'re ready, you\'ll add questions and move it to Active.',
      side: 'bottom',
    },
    {
      id: 'question-bank',
      route: '/teachers/exams',
      selector: '[data-tour="nav-question-bank"]',
      beforeShow: revealSidebar,
      title: 'Question Bank',
      description:
        'Build reusable questions here — Multiple Choice, Theory, True/False, and more — then attach them to any exam.',
      side: 'right',
    },
    {
      id: 'question-bank-page',
      route: '/teachers/questions',
      selector: '[data-tour="question-bank-page"]',
      title: 'Reusing questions',
      description: 'Questions you create here can be reused across multiple exams, saving you time each term.',
      side: 'top',
    },
    {
      id: 'nav-students',
      route: '/teachers/questions',
      selector: '[data-tour="nav-students"]',
      beforeShow: revealSidebar,
      title: 'Students & Results',
      description: 'View your students, their exam history, and score breakdowns from here.',
      side: 'right',
    },
    {
      id: 'nav-settings',
      route: '/teachers/students',
      selector: '[data-tour="nav-settings"]',
      beforeShow: revealSidebar,
      title: 'Settings',
      description: 'Manage your account preferences and password here.',
      side: 'right',
    },
    {
      id: 'finish',
      route: '/teachers/settings',
      selector: '[data-tour="profile-menu-button"]',
      title: 'You are now ready to create and manage exams 🎉',
      description:
        'Need a refresher later? Open this profile menu any time and choose "Take Product Tour".',
      side: 'bottom',
      align: 'end',
    },
  ]
}
