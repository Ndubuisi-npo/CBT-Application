<template>
  <div class="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
    <SectionCard title="Terms" subtitle="Configure academic terms and link them to the correct session.">
      <SkeletonRows v-if="loading" :columns="4" />
      <div v-else class="overflow-hidden rounded-[24px] border border-slate-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th v-for="heading in headings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ heading }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="term in currentTerms" :key="term.id" class="transition hover:bg-slate-50/80">
                <td class="px-5 py-4 font-semibold text-slate-900 text-nowrap">{{ term.name }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ currentSessionName }}</td>
                <td class="px-5 py-4 text-sm text-slate-600 text-nowrap">{{ fmtDate(term.startDate || term.start_date || '-') }}</td>
                <td class="px-5 py-4 text-sm text-slate-600 text-nowrap">{{ fmtDate(term.endDate || term.end_date || '-') }}</td>
                <td class="px-5 py-4"><StatusBadge :status="termStatus(term)" /></td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <button type="button" class="rounded-lg border-2 border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2" @click="editTerm(term)">Edit</button>
                    <button type="button" class="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100" @click="activateTerm(term.id)">Activate</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <SectionCard :title="form.id ? 'Edit Term' : 'Create Term'" subtitle="Set term dates and session ownership.">
      <form class="space-y-5" @submit.prevent="submit">
        <FormField label="Term name" :error="errors.name">
          <input v-model="form.name" class="sa-input" placeholder="1st Term" />
        </FormField>
        <FormField label="Linked session" :error="errors.sessionId">
          <select v-model="form.sessionId" class="sa-input">
            <option value="">Select session</option>
            <option v-for="session in sessionsStore.sessions" :key="session.id" :value="session.id">{{ session.name }}</option>
          </select>
        </FormField>
        <FormField label="Start date" :error="errors.startDate">
          <input v-model="form.startDate" type="date" class="sa-input" />
        </FormField>
        <FormField label="End date" :error="errors.endDate">
          <input v-model="form.endDate" type="date" class="sa-input" />
        </FormField>
        <FormField label="Current term">
          <label class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            <input v-model="form.current" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-[#0B1F3A] focus:ring-[#D4AF37]" />
            Mark as current term
          </label>
        </FormField>
        <button type="submit" class="w-full rounded-lg bg-[#0B1F3A] px-4 py-2.5 font-medium text-white transition hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2">{{ form.id ? 'Update Term' : 'Create Term' }}</button>
      </form>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import FormField from '../components/FormField.vue'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { useSchoolAdminSessionsStore } from '../stores/sessions'
import { useSchoolAdminUiStore } from '../stores/ui'
import { fmtDate } from '@/lib/helpers'

const headings = ['Term Name', 'Session', 'Start Date', 'End Date', 'Is Current', 'Actions']
const sessionsStore = useSchoolAdminSessionsStore()
const uiStore = useSchoolAdminUiStore()

const loading = ref(false)
const form = reactive({ id: null, name: '', sessionId: '', startDate: '', endDate: '', current: false })
const errors = reactive({ name: '', sessionId: '', startDate: '', endDate: '' })

const currentTerms = computed(() => sessionsStore.terms[form.sessionId] || [])
const currentSessionName = computed(() => {
  const session = sessionsStore.sessions.find(s => s.id === form.sessionId)
  return session?.name || ''
})

onMounted(async () => {
  await sessionsStore.fetchSessions()
  if (sessionsStore.sessions.length > 0) {
    form.sessionId = sessionsStore.sessions[0].id
  }
})

watch(() => form.sessionId, async (sessionId) => {
  if (sessionId) {
    await sessionsStore.fetchTerms(sessionId)
  }
})

const editTerm = (term) => {
  form.id = term.id
  form.name = term.name || ''
  form.sessionId = term.sessionId || term.session_id || ''
  form.startDate = term.startDate || term.start_date || ''
  form.endDate = term.endDate || term.end_date || ''
  form.current = term.current ?? term.status === 'Active'
}

const validate = () => {
  errors.name = form.name ? '' : 'Term name is required.'
  errors.sessionId = form.sessionId ? '' : 'Session is required.'
  errors.startDate = form.startDate ? '' : 'Start date is required.'
  errors.endDate = form.endDate ? '' : 'End date is required.'
  return !errors.name && !errors.sessionId && !errors.startDate && !errors.endDate
}

const termStatus = (term) => ((term.current ?? term.status === 'Active') ? 'Active' : 'Inactive')

const activateTerm = async (termId) => {
  await sessionsStore.activateTerm(form.sessionId, termId)
  uiStore.addToast({ title: 'Term activated', message: 'Active academic term updated.', variant: 'success' })
}

const submit = async () => {
  if (!validate()) return
  loading.value = true
  try {
    await sessionsStore.saveTerm(form.sessionId, {
      ...form,
      start_date: form.startDate,
      end_date: form.endDate,
      current: form.current,
      status: form.current ? 'Active' : 'Inactive',
      session_id: form.sessionId,
    })
    uiStore.addToast({ title: 'Term saved', message: 'Academic term changes were saved.', variant: 'success' })
    Object.assign(form, { id: null, name: '', sessionId: '', startDate: '', endDate: '', current: false })
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: error.message, variant: 'error' })
  } finally {
    loading.value = false
  }
}
</script>
