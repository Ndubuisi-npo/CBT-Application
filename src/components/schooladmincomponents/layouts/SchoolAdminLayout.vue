<template>
  <div class="h-screen overflow-hidden bg-[#F3F6FB] text-slate-900">
    <div class="flex h-full">
      <AppSidebar
        :collapsed="uiStore.sidebarCollapsed"
        :mobile-open="uiStore.mobileSidebarOpen"
        @toggle="uiStore.toggleSidebar"
        @close-mobile="uiStore.closeMobileSidebar"
      />

      <!-- Main content — sidebar is sticky on desktop so it takes natural space in flex -->
      <div class="flex min-w-0 flex-1 flex-col">
        <AppHeader @toggle-sidebar="uiStore.toggleSidebar" />

        <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" style="zoom: 0.9;">
          <router-view />
        </main>
      </div>
    </div>

    <ToastStack />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import AppSidebar from '../components/AppSidebar.vue'
import ToastStack from '../components/ToastStack.vue'
import { useSchoolAdminUiStore } from '../stores/ui'
import { getAuthRole } from '../../../js/lib/auth'
import { isTourEligibleRole, resumeProductTour } from '../../../tours'

const uiStore = useSchoolAdminUiStore()

// Product Tour: this layout is shared by both /school-admin and /teachers
// routes, so it's the single best place to kick off onboarding. Students
// never render this layout at all, and `isTourEligibleRole` double-guards
// against loading Driver.js for any role other than school_admin/teacher.
//
// `resumeProductTour` handles both cases in one call:
//  - Brand new user (nothing completed, no saved progress) -> starts at step 0.
//  - User refreshed mid-tour -> resumes from the last saved step.
//  - Tour already completed/skipped previously -> no-op.
onMounted(() => {
  const role = getAuthRole()
  if (!isTourEligibleRole(role)) return
  void resumeProductTour(role)
})
</script>
