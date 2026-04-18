<template>
  <header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
    <div class="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-3">
        <AppButton type="button" :icon="PanelLeft" variant="ghost" class="lg:hidden" @click="$emit('toggle-sidebar')" />
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">{{ authStore.tenant?.name || 'School Admin' }}</p>
          <h2 class="text-xl font-semibold tracking-tight text-slate-900">{{ pageTitle }}</h2>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <AppButton type="button" :icon="Bell" variant="ghost" class="relative">
          <span class="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#D4AF37]"></span>
        </AppButton>
        <ProfileDropdown />
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Bell, PanelLeft } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import ProfileDropdown from './ProfileDropdown.vue'
import { useSchoolAdminAuthStore } from '../stores/auth'
import { useSchoolAdminProfileStore } from '../stores/profile'
import { useSchoolAdminUiStore } from '../stores/ui'

defineEmits(['toggle-sidebar'])

const route = useRoute()
const authStore = useSchoolAdminAuthStore()
const profileStore = useSchoolAdminProfileStore()
const uiStore = useSchoolAdminUiStore()

// Only fetch profile on pages that need it (profile/settings pages)
onMounted(() => {
  const pagesNeedingProfile = ['/school-admin/profile', '/school-admin/settings']
  if (pagesNeedingProfile.includes(route.path) && !profileStore.profile.schoolName && !profileStore.loading) {
    profileStore.fetchProfile()
  }
})

const titles = {
  '/school-admin/dashboard': 'Dashboard Overview',
  '/school-admin/sessions': 'Academic Sessions',
  '/school-admin/terms': 'Terms',
  '/school-admin/classes': 'Classes',
  '/school-admin/teachers': 'Teachers',
  '/school-admin/subjects': 'Subjects',
  '/school-admin/settings': 'School Settings',
  '/school-admin/profile': 'School Profile',
}

const pageTitle = computed(() => titles[route.path] || 'School Admin')
</script>
