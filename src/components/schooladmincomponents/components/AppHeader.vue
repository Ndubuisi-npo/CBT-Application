<template>
  <header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
    <div class="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
      <!-- Left: mobile hamburger + breadcrumb/title -->
      <div class="flex min-w-0 items-center gap-3">
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] lg:hidden"
          @click="$emit('toggle-sidebar')"
          aria-label="Toggle sidebar"
        >
          <Menu class="h-5 w-5" />
        </button>

        <!-- Breadcrumb trail -->
        <nav class="hidden items-center gap-1.5 text-sm sm:flex" aria-label="Breadcrumb">
          <span class="font-medium text-slate-400">{{ rootLabel }}</span>
          <ChevronRight class="h-3.5 w-3.5 text-slate-300" />
          <span class="font-semibold text-slate-900 truncate max-w-[200px]">{{ pageTitle }}</span>
        </nav>
        <!-- Mobile: just page title -->
        <span class="truncate text-base font-semibold text-slate-900 sm:hidden">{{ pageTitle }}</span>
      </div>

      <!-- Right: profile -->
      <div class="flex shrink-0 items-center gap-2">
        <NotificationBell />
        <ProfileDropdown />
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight, Menu } from 'lucide-vue-next'
import ProfileDropdown from './ProfileDropdown.vue'
import NotificationBell from '../../shared/NotificationBell.vue'

defineEmits(['toggle-sidebar'])

const route = useRoute()

const isTeacher = computed(() => route.path.startsWith('/teachers'))

const rootLabel = computed(() => isTeacher.value ? 'Teacher Portal' : 'School Admin')

const titles = {
  '/school-admin/dashboard': 'Dashboard',
  '/school-admin/sessions': 'Academic Sessions',
  '/school-admin/terms': 'Terms',
  '/school-admin/classes': 'Classes',
  '/school-admin/class-levels': 'Class Levels',
  '/school-admin/teachers': 'Teachers',
  '/school-admin/teachers/import': 'Import Teachers',
  '/school-admin/students': 'Students',
  '/school-admin/students/import': 'Import Students',
  '/school-admin/subjects': 'Subjects',
  '/school-admin/settings': 'Settings',
  '/school-admin/profile': 'Profile',
  '/school-admin/exams': 'Exam Approvals',
  '/school-admin/notifications': 'Notifications',
  '/teachers/dashboard': 'Dashboard',
  '/teachers/my-classes': 'My Classes',
  '/teachers/questions': 'Question Bank',
  '/teachers/exam-wizard': 'Exam Wizard',
  '/teachers/exams': 'My Exams',
  '/teachers/notifications': 'Notifications',
  '/teachers/students': 'Students',
  '/teachers/attendance': 'Attendance',
  '/teachers/grading': 'Grading',
  '/teachers/results': 'Results',
  '/teachers/settings': 'Settings',
  '/teachers/profile': 'Profile',
}

const pageTitle = computed(() => titles[route.path] || route.path.split('/').pop()?.replace(/-/g, ' ') || 'Home')
</script>
