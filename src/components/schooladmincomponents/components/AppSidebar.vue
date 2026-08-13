<template>
  <!-- Mobile overlay -->
  <div
    v-if="mobileOpen"
    class="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
    @click="$emit('close-mobile')"
  />

  <aside
    class="fixed left-0 top-0 z-50 flex h-screen shrink-0 flex-col bg-[#0B1F3A] text-white shadow-2xl transition-all duration-300 lg:relative lg:min-h-screen lg:translate-x-0 lg:shadow-none"
    :class="[
      collapsed ? 'w-[72px]' : 'w-64',
      mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <!-- Branding -->
    <div
      class="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4"
      :class="collapsed ? 'justify-center' : ''"
    >
      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
        <component :is="isTeacherSection ? BookOpenCheck : Building2" class="h-5 w-5 text-[#D4AF37]" />
      </div>
      <div v-if="!collapsed" class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold leading-tight text-white">
          {{ isTeacherSection ? 'Teacher Portal' : (profile.schoolName || 'School Admin') }}
        </p>
        <p class="text-xs font-medium uppercase tracking-widest text-[#D4AF37]/70">
          {{ isTeacherSection ? 'Teaching Hub' : 'Administration' }}
        </p>
      </div>
    </div>

    <!-- Nav -->
    <nav data-tour="sidebar-nav" class="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
      <template v-for="group in navGroups" :key="group.label">
        <!-- Group label -->
        <p
          v-if="!collapsed && group.label"
          class="mb-1 mt-5 px-2 text-xs font-semibold uppercase tracking-widest text-white/30 first:mt-0"
        >
          {{ group.label }}
        </p>
        <div v-if="collapsed && group.label" class="my-2 border-t border-white/10" />

        <RouterLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          custom
          v-slot="{ navigate }"
        >
          <button
            type="button"
            :data-tour="item.tour"
            class="group relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-xs font-medium transition-all duration-150"
            :class="[
              isActive(item.to)
                ? 'bg-white/12 text-white'
                : 'text-white/60 hover:bg-white/8 hover:text-white',
              collapsed ? 'justify-center' : '',
            ]"
            :title="collapsed ? item.label : undefined"
            @click="() => { navigate(); $emit('close-mobile') }"
          >
            <!-- Active left bar -->
            <span
              v-if="isActive(item.to)"
              class="absolute left-0 h-6 w-0.5 rounded-r-full bg-[#D4AF37]"
            />
            <component
              :is="item.icon"
              class="h-5 w-5 shrink-0 transition-colors"
              :class="isActive(item.to) ? 'text-[#D4AF37]' : 'text-white/50 group-hover:text-white/80'"
            />
            <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
            <span v-if="!collapsed && item.count > 0" class="ml-auto rounded-full bg-[#D4AF37]/90 px-2 py-0.5 text-[10px] font-semibold text-white">
              {{ item.count }}
            </span>
          </button>
        </RouterLink>
      </template>
    </nav>

    <!-- Bottom: collapse toggle -->
    <div class="shrink-0 border-t border-white/10 p-3">
      <button
        type="button"
        class="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium text-white/50 transition hover:bg-white/8 hover:text-white"
        :class="collapsed ? 'justify-center' : ''"
        :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="$emit('toggle')"
      >
        <component :is="collapsed ? PanelLeftOpen : PanelLeftClose" class="h-5 w-5 shrink-0" />
        <span v-if="!collapsed" class="text-xs">Collapse</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import {
  BarChart3,
  BookOpenCheck,
  Building2,
  CalendarRange,
  CheckSquare,
  ClipboardList,
  Columns3,
  FileQuestion,
  GraduationCap,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shapes,
  Users,
} from 'lucide-vue-next'
import { useSchoolAdminProfileStore } from '../stores/profile'
import { useNotificationStore } from '../../shared/stores/notifications'

defineProps({
  collapsed: { type: Boolean, default: false },
  mobileOpen: { type: Boolean, default: false },
})
defineEmits(['toggle', 'close-mobile'])

const route = useRoute()
const profileStore = useSchoolAdminProfileStore()
const profile = computed(() => profileStore.profile || {})
const isTeacherSection = computed(() => route.path.startsWith('/teachers'))
const notificationStore = useNotificationStore()

const teacherStudentNotifications = computed(() => notificationStore.unreadByCategory('students', 'teacher'))
const adminStudentNotifications = computed(() => notificationStore.unreadByCategory('students', 'school_admin'))
const adminTeacherNotifications = computed(() => notificationStore.unreadByCategory('teachers', 'school_admin'))
const adminSessionNotifications = computed(() => notificationStore.unreadByCategory('academic_sessions', 'school_admin'))

const navGroups = computed(() => {
  if (isTeacherSection.value) {
    return [
      {
        label: '',
        items: [
          { label: 'Dashboard', to: '/teachers/dashboard', icon: LayoutDashboard },
        ],
      },
      {
        label: 'Assessments',
        items: [
          { label: 'Assessments', to: '/teachers/assessments', icon: ClipboardList, tour: 'nav-assessments' },
          { label: 'Question Bank', to: '/teachers/questions', icon: FileQuestion, tour: 'nav-question-bank' },
        ],
      },
      {
        label: 'People',
        items: [
          { label: 'Students', to: '/teachers/students', icon: GraduationCap, count: teacherStudentNotifications.value, tour: 'nav-students' },
        ],
      },
      {
        label: 'Account',
        items: [
          { label: 'Settings', to: '/teachers/settings', icon: Settings, tour: 'nav-settings' },
        ],
      },
    ]
  }

  return [
    {
      label: '',
      items: [
        { label: 'Dashboard', to: '/school-admin/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Academics',
      items: [
        { label: 'Sessions', to: '/school-admin/sessions', icon: CalendarRange, count: adminSessionNotifications.value, tour: 'nav-sessions' },
        { label: 'Class Levels', to: '/school-admin/class-levels', icon: Columns3, tour: 'nav-class-levels' },
        { label: 'Subjects', to: '/school-admin/subjects', icon: Shapes, tour: 'nav-subjects' },
        { label: 'Assessment Management', to: '/school-admin/assessments', icon: ClipboardList, tour: 'nav-assessments' },
      ],
    },
    {
      label: 'People',
      items: [
        { label: 'Teachers', to: '/school-admin/teachers', icon: Users, count: adminTeacherNotifications.value, tour: 'nav-teachers' },
        { label: 'Students', to: '/school-admin/students', icon: GraduationCap, count: adminStudentNotifications.value, tour: 'nav-students' },
      ],
    },
    {
      label: 'Account',
      items: [
        { label: 'Settings', to: '/school-admin/settings', icon: Settings, tour: 'nav-settings' },
      ],
    },
  ]
})

const isActive = (target) =>
  route.path === target || route.path.startsWith(`${target}/`)
</script>
