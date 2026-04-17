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
        <AppButton type="button" text="Create First Term" variant="primary" @click="resetForm" />
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
                    <StatusBadge class="text-nowrap" :status="termStatus(term)" />
                    <AppButton text="Edit" @click="editTerm(term)" variant="outline" size="xs" />
                    <AppButton 
                      :text="termStatus(term) === 'Current' ? 'Deactivate' : 'Activate'" 
                      @click="toggleTerm(term.id)" 
                      :variant="termStatus(term) === 'Current' ? 'danger' : 'warning'" 
                      size="xs" 
                    />
                    <AppButton text="Delete" @click="deleteTerm(term.id)" variant="danger" size="xs" />
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
        <div class="flex items-center gap-2">
          <input v-model="form.isCurrent" type="checkbox" id="is-current-term" class="h-4 w-4 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]" />
          <label for="is-current-term" class="text-sm font-medium text-slate-700">Set as current term</label>
        </div>
        <div class="flex gap-2">
          <AppButton type="submit" :text="form.id ? 'Update Term' : 'Create Term'" variant="primary" class="flex-1" :processing="sessionsStore.loading" />
          <AppButton type="button" text="Clear" variant="outline" @click="resetForm" />
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
import AppButton from '../../shared/AppButton.vue'
import { useSchoolAdminSessionsStore } from '../stores/sessions'
import { useSchoolAdminUiStore } from '../stores/ui'
import { fmtDate } from '@/lib/helpers'

const route = useRoute()
const headings = ['Term Name', 'Start Date', 'End Date', 'Actions']
const sessionsStore = useSchoolAdminSessionsStore()
const uiStore = useSchoolAdminUiStore()

const form = reactive({ name: '', startDate: '', endDate: '', isCurrent: false })
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
  Object.assign(form, { name: '', startDate: '', endDate: '', isCurrent: false })
  Object.assign(errors, { name: '', startDate: '', endDate: '' })
}

const validate = () => {
  errors.name = form.name ? '' : 'Term name is required.'
  errors.startDate = form.startDate ? '' : 'Start date is required.'
  errors.endDate = form.endDate ? '' : 'End date is required.'
  return !errors.name && !errors.startDate && !errors.endDate
}

const editTerm = (term) => {
  form.name = term.name || ''
  form.startDate = term.startDate || term.start_date || ''
  form.endDate = term.endDate || term.end_date || ''
  form.isCurrent = term.current || term.is_current || term.status === 'Active'
}

const termStatus = (term) => (term.current ? 'Current' : 'Not current')

const toggleTerm = async (termId) => {
  const term = currentTerms.value.find(t => t.id === termId)
  const isActive = termStatus(term) === 'Current'
  
  if (isActive) {
    // Deactivate - set is_current to false
    try {
      await sessionsStore.saveTerm(sessionId.value, { 
        id: termId,
        is_current: false 
      })
      uiStore.addToast({ title: 'Term deactivated', message: 'Academic term has been deactivated.', variant: 'success' })
    } catch (error) {
      uiStore.addToast({ title: 'Error', message: 'Failed to deactivate term.', variant: 'error' })
    }
  } else {
    // Activate - use set-current endpoint
    try {
      await sessionsStore.activateTerm(sessionId.value, termId)
      uiStore.addToast({ title: 'Term activated', message: 'Current academic term updated.', variant: 'success' })
    } catch (error) {
      uiStore.addToast({ title: 'Error', message: 'Failed to activate term.', variant: 'error' })
    }
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
  
  const payload = {
    name: form.name,
    start_date: form.startDate,
    end_date: form.endDate,
  }
  
  // Only include isCurrent if it's true, to avoid sending false
  if (form.isCurrent) {
    payload.is_current = true
  }
  
  try {
    await sessionsStore.saveTerm(sessionId.value, payload)
    uiStore.addToast({ title: 'Term saved', message: 'Academic term changes were saved.', variant: 'success' })
    resetForm()
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to save term.', variant: 'error' })
  }
}
</script>
