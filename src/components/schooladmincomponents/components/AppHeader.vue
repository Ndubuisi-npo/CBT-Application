<template>
  <header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
    <div class="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-3">
        <button type="button" class="sa-icon-button lg:hidden" @click="$emit('toggle-sidebar')">
          <PanelLeft class="h-5 w-5" />
        </button>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">{{ profile.schoolName }}</p>
          <h2 class="text-xl font-semibold tracking-tight text-slate-900">{{ pageTitle }}</h2>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button type="button" class="sa-icon-button relative">
          <Bell class="h-5 w-5" />
          <span class="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#D4AF37]"></span>
        </button>
        <button
          type="button"
          class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] cursor-pointer"
          @click="handleLogout"
          title="Logout"
        >
          <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0B1F3A] text-sm font-semibold text-white">{{ adminInitials }}</div>
          <div class="hidden text-left sm:block">
            <p class="text-sm font-semibold text-slate-900">{{ authStore.user?.name || 'School Admin' }}</p>
            <p class="text-xs text-slate-500">{{ authStore.user?.role || 'Tenant administrator' }}</p>
          </div>
          <LogOut class="h-4 w-4 text-slate-400" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bell, PanelLeft, LogOut } from 'lucide-vue-next'
import { useSchoolAdminAuthStore } from '../stores/auth'
import { useSchoolAdminProfileStore } from '../stores/profile'
import { useSchoolAdminUiStore } from '../stores/ui'

defineEmits(['toggle-sidebar'])

const route = useRoute()
const router = useRouter()
const authStore = useSchoolAdminAuthStore()
const profileStore = useSchoolAdminProfileStore()
const uiStore = useSchoolAdminUiStore()

const profile = computed(() => profileStore.profile)
const adminInitials = computed(() => (authStore.user?.name || 'School Admin').split(' ').map((part) => part[0]).slice(0, 2).join(''))

const handleLogout = async () => {
  try {
    await authStore.logout()
    uiStore.addToast({
      title: 'Logged out',
      message: 'You have been signed out successfully.',
      variant: 'success',
    })
    router.push('/school-admin/login')
  } catch (error) {
    console.error('Logout failed:', error)
    uiStore.addToast({
      title: 'Logout failed',
      message: error?.message || 'Unable to sign out.',
      variant: 'error',
    })
  }
}

const titles = {
  '/school-admin/dashboard': 'Dashboard Overview',
  '/school-admin/sessions': 'Academic Sessions',
  '/school-admin/terms': 'Terms',
  '/school-admin/classes': 'Class Arms',
  '/school-admin/teachers': 'Teachers',
  '/school-admin/subjects': 'Subjects',
  '/school-admin/settings': 'School Settings',
  '/school-admin/profile': 'School Profile',
}

const pageTitle = computed(() => titles[route.path] || 'School Admin')
</script>
