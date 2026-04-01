<template>
  <div class="min-h-screen bg-[#F3F6FB] text-slate-900">
    <div class="flex min-h-screen">
      <AppSidebar
        :collapsed="uiStore.sidebarCollapsed"
        :mobile-open="uiStore.mobileSidebarOpen"
        @toggle="uiStore.toggleSidebar"
        @close-mobile="uiStore.closeMobileSidebar"
      />

      <div class="flex min-w-0 flex-1 flex-col">
        <AppHeader @toggle-sidebar="uiStore.toggleSidebar" />
        <main class="flex-1 p-4 sm:p-6 lg:p-8">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import AppHeader from '../components/AppHeader.vue'
import AppSidebar from '../components/AppSidebar.vue'
import { useSuperAdminUiStore } from '../stores/ui'

const uiStore = useSuperAdminUiStore()
</script>
