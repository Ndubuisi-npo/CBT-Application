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
        'This sidebar is where you manage your school—from teachers and students to classes, subjects, and settings.',
      side: 'right',
      align: 'start',
    },
    {
      id: 'dashboard-overview',
      route: '/school-admin/dashboard',
      selector: '[data-tour="admin-stats-cards"]',
      title: 'School overview',
      description:
        'These cards give you a quick snapshot of your school, including student, teacher, class, and subject totals.',
      side: 'bottom',
    },
    {
      id: 'teachers',
      route: '/school-admin/teachers',
      selector: '[data-tour="create-teacher-btn"]',
      title: 'Start by adding teachers',
      description:
        'Create teacher accounts here. Each new teacher automatically receives their own guided tour when they sign in for the first time.',
      side: 'bottom',
    },
    {
      id: 'students',
      route: '/school-admin/students',
      selector: '[data-tour="create-student-btn"]',
      title: 'Enroll students',
      description:
        'Add students individually or import them in bulk using a spreadsheet.',
      side: 'bottom',
    },
    {
      id: 'subjects',
      route: '/school-admin/subjects',
      selector: '[data-tour="create-subject-btn"]',
      title: 'Set up your subjects',
      description:
        'Create the subjects taught in your school and assign them to the appropriate class levels and teachers.',
      side: 'bottom',
    },
    {
      id: 'settings',
      route: '/school-admin/settings',
      selector: '[data-tour="settings-page"]',
      title: 'Configure your school',
      description:
        'Update your password here.',
      side: 'top',
    },
    {
      id: 'finish',
      route: '/school-admin/settings',
      selector: '[data-tour="profile-menu-button"]',
      title: "You're all set! 🎉",
      description:
        'You can replay this tour anytime from your profile menu by selecting "Take Product Tour".',
      side: 'bottom',
      align: 'end',
    },
  ]
}
