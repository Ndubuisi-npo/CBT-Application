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
import AppHeader from '../components/AppHeader.vue'
import AppSidebar from '../components/AppSidebar.vue'
import ToastStack from '../components/ToastStack.vue'
import { useSchoolAdminUiStore } from '../stores/ui'

const uiStore = useSchoolAdminUiStore()
</script>
