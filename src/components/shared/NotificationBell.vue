<template>
  <button type="button" class="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50" aria-label="Notifications" @click="openNotifications">
    <Bell class="h-[18px] w-[18px]" />
    <span v-if="count > 0" class="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#D4AF37] px-1 text-[10px] font-bold leading-none text-[#0B1F3A] ring-2 ring-white">
      {{ count }}
    </span>
  </button>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Bell } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useNotificationStore } from './stores/notifications'
import { getAuthRole } from '../../js/lib/auth'

const router = useRouter()
const notificationStore = useNotificationStore()
const { totalUnread } = storeToRefs(notificationStore)

const count = totalUnread

const routeByRole = {
  school_admin: 'SchoolAdminNotifications',
  teacher: 'TeachersNotifications',
  student: 'StudentNotifications',
}

const openNotifications = () => {
  const role = getAuthRole()
  const routeName = routeByRole[role] || 'NotificationsPage'
  router.push({ name: routeName })
}
</script>
