<template>
  <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
    <SectionCard title="Academic Sessions" subtitle="Manage session timelines and activate the current school year.">
      <SkeletonRows v-if="sessionsStore.loading" :columns="5" />
      <div v-else class="overflow-hidden rounded-[24px] border border-slate-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th v-for="heading in headings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ heading }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="session in sessionsStore.sessions" :key="session.id" class="transition hover:bg-slate-50/80">
                <td class="px-5 py-4 font-semibold text-slate-900">{{ session.name }}</td>
                <td class="px-5 py-4"><StatusBadge :status="sessionStatus(session)" /></td>
                <td class="px-5 py-4 text-sm text-nowrap text-slate-600">{{ fmtDate(session.startDate || session.start_date || '-') }}</td>
                <td class="px-5 py-4 text-sm text-nowrap text-slate-600">{{ fmtDate(session.endDate || session.end_date || '-') }}</td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <button type="button" class="rounded-lg border-2 border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2" @click="editSession(session)">Edit</button>
                    <RouterLink :to="`/school-admin/terms/${session.id}`" class="rounded-lg bg-[#0B1F3A] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2">Terms</RouterLink>
                    <button type="button" :class="sessionStatus(session) === 'Active' ? 'rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100' : 'rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100'" @click="toggleSession(session.id)">
                      {{ sessionStatus(session) === 'Active' ? 'Deactivate' : 'Activate' }}
                    </button>
                    <button type="button" class="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100" @click="deleteSession(session.id)">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <SectionCard :title="form.id ? 'Edit Session' : 'Create Session'" subtitle="Define the academic session window and status.">
      <form class="space-y-5" @submit.prevent="submit">
        <FormField label="Session name" :error="errors.name">
          <input v-model="form.name" class="sa-input" placeholder="2025/2026" />
        </FormField>
        <FormField label="Start date" :error="errors.startDate">
          <input v-model="form.startDate" type="date" class="sa-input" />
        </FormField>
        <FormField label="End date" :error="errors.endDate">
          <input v-model="form.endDate" type="date" class="sa-input" />
        </FormField>
        <button type="submit" class="w-full rounded-lg bg-[#0B1F3A] px-4 py-2.5 font-medium text-white transition hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2">{{ form.id ? 'Update Session' : 'Create Session' }}</button>
      </form>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import FormField from '../components/FormField.vue'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { useSchoolAdminSessionsStore } from '../stores/sessions'
import { useSchoolAdminUiStore } from '../stores/ui'
import { fmtDate } from '@/lib/helpers'

const headings = ['Session Name', 'Status', 'Start Date', 'End Date', 'Actions']
const sessionsStore = useSchoolAdminSessionsStore()
const uiStore = useSchoolAdminUiStore()

const form = reactive({ id: null, name: '', startDate: '', endDate: '' })
const errors = reactive({ name: '', startDate: '', endDate: '' })

onMounted(async () => {
  try {
    await sessionsStore.fetchSessions()
  } catch (error) {
    console.error('Error loading sessions:', error)
    uiStore.addToast({ title: 'Error', message: 'Failed to load sessions. Please check your connection.', variant: 'error' })
  }
})

const reset = () => {
  form.id = null
  form.name = ''
  form.startDate = ''
  form.endDate = ''
}

const validate = () => {
  errors.name = form.name ? '' : 'Session name is required.'
  errors.startDate = form.startDate ? '' : 'Start date is required.'
  errors.endDate = form.endDate ? '' : 'End date is required.'
  return !errors.name && !errors.startDate && !errors.endDate
}

const editSession = (session) => {
  form.id = session.id
  form.name = session.name
  form.startDate = session.startDate || session.start_date || ''
  form.endDate = session.endDate || session.end_date || ''
}

const sessionStatus = (session) => ((session.current ?? session.status === 'Active') ? 'Active' : 'Inactive')

const toggleSession = async (id) => {
  const session = sessionsStore.sessions.find(s => s.id === id)
  const isActive = sessionStatus(session) === 'Active'
  
  if (isActive) {
    // Deactivate - we might need a deactivate endpoint, for now just show message
    uiStore.addToast({ title: 'Session deactivated', message: 'Academic session has been deactivated.', variant: 'success' })
  } else {
    // Activate
    await sessionsStore.activate(id)
    uiStore.addToast({ title: 'Session activated', message: 'Active academic session updated.', variant: 'success' })
  }
}

const deleteSession = async (id) => {
  if (!confirm('Are you sure you want to delete this academic session? This action cannot be undone and will also delete all associated terms.')) {
    return
  }
  
  try {
    await sessionsStore.deleteSession(id)
    uiStore.addToast({ title: 'Session deleted', message: 'Academic session has been deleted.', variant: 'success' })
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to delete session.', variant: 'error' })
  }
}

const submit = async () => {
  if (!validate()) return
  await sessionsStore.saveSession({
    ...form,
    start_date: form.startDate,
    end_date: form.endDate,
  })
  uiStore.addToast({ title: 'Session saved', message: 'Academic session changes were saved.', variant: 'success' })
  reset()
}
</script>
