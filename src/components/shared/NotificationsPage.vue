<template>
  <div class="min-h-screen bg-slate-50 px-4 py-8 text-xs">
    <div class="mx-auto max-w-5xl space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Notifications</h1>
          <p class="mt-1 text-sm text-slate-500">Your latest alerts and updates across exams, students, teachers, and sessions.</p>
        </div>
        <button class="rounded-2xl bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" @click="markAllRead">
          Mark all as read
        </button>
      </div>

      <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Unread</p>
            <p class="mt-3 text-3xl font-bold text-slate-900">{{ totalUnread }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Students</p>
            <p class="mt-3 text-3xl font-bold text-slate-900">{{ unreadByCategory('students') }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Teachers</p>
            <p class="mt-3 text-3xl font-bold text-slate-900">{{ unreadByCategory('teachers') }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Exams</p>
            <p class="mt-3 text-3xl font-bold text-slate-900">{{ unreadByCategory('exams') }}</p>
          </div>
        </div>

        <div class="space-y-4">
          <article
            v-for="notification in roleNotifications"
            :key="notification.id"
            class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="text-xs uppercase tracking-[0.24em] text-[#D4AF37]">{{ notification.category.replace(/_/g, ' ') }}</p>
                <h2 class="mt-2 text-lg font-semibold text-slate-900">{{ notification.title }}</h2>
                <p class="mt-2 text-sm text-slate-600">{{ notification.description }}</p>
              </div>
              <div class="text-right">
                <p class="text-xs uppercase tracking-[0.24em] text-slate-500">{{ notification.time }}</p>
                <span
                  v-if="notification.unread"
                  class="mt-2 inline-flex rounded-full bg-[#D4AF37]/15 px-3 py-1 text-xs font-semibold text-[#D4AF37]"
                >
                  New
                </span>
              </div>
            </div>
            <div class="mt-4 flex items-center gap-2">
              <button
                type="button"
                class="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                @click="goTo(notification.link.to)"
              >
                View details
              </button>
              <span class="text-xs text-slate-500">Role: {{ notification.roles.join(', ') }}</span>
            </div>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNotificationStore } from './stores/notifications'
import { getAuthRole } from '../../js/lib/auth'

const router = useRouter()
const route = useRoute()
const notificationStore = useNotificationStore()

const role = computed(() => getAuthRole() || 'student')

const totalUnread = computed(() => notificationStore.totalUnread)

const unreadByCategory = (category) => notificationStore.unreadByCategory(category, role.value)

const roleNotifications = computed(() => notificationStore.notificationsForRole(role.value))

const markAllRead = () => notificationStore.markAllRead()

const goTo = (to) => router.push(to)
</script>
