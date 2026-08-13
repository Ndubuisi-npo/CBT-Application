/**
 * teacherTour.js
 *
 * Step definitions for the Teacher onboarding tour.
 *
 * This is the "much more detailed" tour required by the task, but still
 * trimmed to the essential workflow: dashboard orientation, the Question
 * Bank, Students, and Settings — plus how to restart the tour later.
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
        'From here you can build assessment submissions, manage questions, monitor student performance, and access your teaching tools.',
      side: 'right',
      align: 'start',
    },
    {
      id: 'dashboard-overview',
      route: '/teachers/dashboard',
      selector: '[data-tour="teacher-stats-cards"]',
      title: 'Teaching overview',
      description:
        'Keep track of your assessments, submissions, and recent activity at a glance.',
      side: 'bottom',
    },
    {
      id: 'question-bank',
      route: '/teachers/questions',
      selector: '[data-tour="question-bank-page"]',
      title: 'Question Bank',
      description:
        'Create reusable questions and use them across multiple assessments to save time.',
      side: 'top',
    },
    {
      id: 'students-results',
      route: '/teachers/students',
      selector: '[data-tour="students-page"]',
      title: 'Students & Results',
      description:
        'View your students info here and review their results from here.',
      side: 'top',
    },
    {
      id: 'settings',
      route: '/teachers/settings',
      selector: '[data-tour="settings-page"]',
      title: 'Account settings',
      description:
        'Update your password here.',
      side: 'top',
    },
    {
      id: 'finish',
      route: '/teachers/settings',
      selector: '[data-tour="profile-menu-button"]',
      title: "You're ready to start teaching! 🎉",
      description:
        'You can replay this tour anytime from your profile menu by selecting "Take Product Tour".',
      side: 'bottom',
      align: 'end',
    },
  ]
}
