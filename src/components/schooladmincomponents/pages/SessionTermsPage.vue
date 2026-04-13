<template>
  <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
    <SectionCard :title="`Terms for ${session?.name || '...'}`" subtitle="Manage academic terms for this session.">
      <SkeletonRows v-if="sessionsStore.loading" :columns="4" />
      <div v-else-if="currentTerms.length === 0" class="text-center py-12">
        <div class="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <svg class="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-slate-900 mb-2">No terms found</h3>
        <p class="text-slate-600 mb-6">Get started by creating your first term for {{ session?.name || 'this session' }}.</p>
        <button type="button" class="rounded-lg bg-[#0B1F3A] px-4 py-2 font-medium text-white transition hover:bg-[#0F2940]" @click="resetForm">Create First Term</button>
      </div>
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
                <td class="px-5 py-4 text-sm text-slate-600 text-nowrap">{{ fmtDate(term.startDate || term.start_date || '-') }}</td>
                <td class="px-5 py-4 text-sm text-slate-600 text-nowrap">{{ fmtDate(term.endDate || term.end_date || '-') }}</td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <StatusBadge :status="termStatus(term)" />
                    <button type="button" class="rounded-lg border-2 border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2" @click="editTerm(term)">Edit</button>
                    <button type="button" :class="termStatus(term) === 'Active' ? 'rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100' : 'rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100'" @click="toggleTerm(term.id)">
                      {{ termStatus(term) === 'Active' ? 'Deactivate' : 'Activate' }}
                    </button>
                    <button type="button" class="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100" @click="deleteTerm(term.id)">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <SectionCard :title="form.id ? 'Edit Term' : 'Create Term'" subtitle="Create and manage academic terms for this session.">
      <form class="space-y-5" @submit.prevent="submit">
        <FormField label="Term name" :error="errors.name">
          <input v-model="form.name" class="sa-input" placeholder="1st Term" />
        </FormField>
        <FormField label="Start date" :error="errors.startDate">
          <input v-model="form.startDate" type="date" class="sa-input" />
        </FormField>
        <FormField label="End date" :error="errors.endDate">
          <input v-model="form.endDate" type="date" class="sa-input" />
        </FormField>
        <div class="flex gap-2">
          <button type="submit" class="flex-1 rounded-lg bg-[#0B1F3A] px-4 py-2.5 font-medium text-white transition hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2">{{ form.id ? 'Update Term' : 'Create Term' }}</button>
          <button type="button" class="rounded-lg border-2 border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-100" @click="resetForm">Clear</button>
        </div>
      </form>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import FormField from '../components/FormField.vue'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { useSchoolAdminSessionsStore } from '../stores/sessions'
import { useSchoolAdminUiStore } from '../stores/ui'
import { fmtDate } from '@/lib/helpers'

const route = useRoute()
const headings = ['Term Name', 'Start Date', 'End Date', 'Actions']
const sessionsStore = useSchoolAdminSessionsStore()
const uiStore = useSchoolAdminUiStore()

const form = reactive({ id: null, name: '', startDate: '', endDate: '' })
const errors = reactive({ name: '', startDate: '', endDate: '' })

const sessionId = computed(() => route.params.id)
const session = computed(() => sessionsStore.sessions.find(s => s.id === sessionId.value))
const currentTerms = computed(() => sessionsStore.terms[sessionId.value] || [])

onMounted(async () => {
  try {
    await sessionsStore.fetchSessions()
    if (sessionId.value) {
      await sessionsStore.fetchTerms(sessionId.value)
    }
  } catch (error) {
    console.error('Error loading data:', error)
    uiStore.addToast({ title: 'Error', message: 'Failed to load data. Please check your connection.', variant: 'error' })
  }
})

watch(() => sessionId.value, async (newId) => {
  if (newId) {
    await sessionsStore.fetchTerms(newId)
  }
})

const resetForm = () => {
  form.id = null
  form.name = ''
  form.startDate = ''
  form.endDate = ''
  Object.assign(errors, { name: '', startDate: '', endDate: '' })
}

const validate = () => {
  errors.name = form.name ? '' : 'Term name is required.'
  errors.startDate = form.startDate ? '' : 'Start date is required.'
  errors.endDate = form.endDate ? '' : 'End date is required.'
  return !errors.name && !errors.startDate && !errors.endDate
}

const editTerm = (term) => {
  form.id = term.id
  form.name = term.name || ''
  form.startDate = term.startDate || term.start_date || ''
  form.endDate = term.endDate || term.end_date || ''
}

const termStatus = (term) => ((term.current ?? term.status === 'Active') ? 'Active' : 'Inactive')

const toggleTerm = async (termId) => {
  const term = currentTerms.value.find(t => t.id === termId)
  const isActive = termStatus(term) === 'Active'
  
  if (isActive) {
    uiStore.addToast({ title: 'Term deactivated', message: 'Academic term has been deactivated.', variant: 'success' })
  } else {
    await sessionsStore.activateTerm(sessionId.value, termId)
    uiStore.addToast({ title: 'Term activated', message: 'Active academic term updated.', variant: 'success' })
  }
}

const deleteTerm = async (termId) => {
  if (!confirm('Are you sure you want to delete this term? This action cannot be undone.')) {
    return
  }
  
  try {
    await sessionsStore.deleteTerm(sessionId.value, termId)
    uiStore.addToast({ title: 'Term deleted', message: 'Academic term has been deleted.', variant: 'success' })
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to delete term.', variant: 'error' })
  }
}

const submit = async () => {
  if (!validate() || !sessionId.value) return
  
  try {
    await sessionsStore.saveTerm(sessionId.value, {
      ...form,
      start_date: form.startDate,
      end_date: form.endDate,
    })
    uiStore.addToast({ title: 'Term saved', message: 'Academic term changes were saved.', variant: 'success' })
    resetForm()
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to save term.', variant: 'error' })
  }
}
</script>
