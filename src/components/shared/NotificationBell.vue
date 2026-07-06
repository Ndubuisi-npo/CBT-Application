<template>
  <button type="button" class="relative inline-flex items-center justify-center rounded-full bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200" @click="openNotifications">
    <Bell class="h-5 w-5" />
    <span v-if="count > 0" class="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#D4AF37]/90 px-1.5 text-[10px] font-bold text-white ring-2 ring-white">
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
