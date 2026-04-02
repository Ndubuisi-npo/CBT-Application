<template>
  <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
    <SectionCard title="Terms" subtitle="Configure academic terms and link them to the correct session.">
      <SkeletonRows v-if="termsStore.loading" :columns="4" />
      <div v-else class="overflow-hidden rounded-[24px] border border-slate-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th v-for="heading in headings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ heading }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="term in termsStore.terms" :key="term.id" class="transition hover:bg-slate-50/80">
                <td class="px-5 py-4 font-semibold text-slate-900">{{ term.name }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ term.session }}</td>
                <td class="px-5 py-4"><StatusBadge :status="term.status" /></td>
                <td class="px-5 py-4">
                  <button type="button" class="rounded-lg border-2 border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2" @click="editTerm(term)">Edit</button>
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
        <FormField label="Linked session" :error="errors.session">
          <select v-model="form.session" class="sa-input">
            <option value="">Select session</option>
            <option v-for="session in sessionsStore.sessions" :key="session.id" :value="session.name">{{ session.name }}</option>
          </select>
        </FormField>
        <FormField label="Start date" :error="errors.startDate">
          <input v-model="form.startDate" type="date" class="sa-input" />
        </FormField>
        <FormField label="End date" :error="errors.endDate">
          <input v-model="form.endDate" type="date" class="sa-input" />
        </FormField>
        <button type="submit" class="w-full rounded-lg bg-[#0B1F3A] px-4 py-2.5 font-medium text-white transition hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2">{{ form.id ? 'Update Term' : 'Create Term' }}</button>
      </form>
    </SectionCard>
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import FormField from '../components/FormField.vue'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { useSchoolAdminSessionsStore } from '../stores/sessions'
import { useSchoolAdminTermsStore } from '../stores/terms'
import { useSchoolAdminUiStore } from '../stores/ui'

const headings = ['Term Name', 'Session', 'Status', 'Actions']
const termsStore = useSchoolAdminTermsStore()
const sessionsStore = useSchoolAdminSessionsStore()
const uiStore = useSchoolAdminUiStore()

const form = reactive({ id: null, name: '', session: '', startDate: '', endDate: '', status: 'Inactive' })
const errors = reactive({ name: '', session: '', startDate: '', endDate: '' })

onMounted(() => {
  termsStore.fetchTerms()
  sessionsStore.fetchSessions()
})

const editTerm = (term) => Object.assign(form, term)

const validate = () => {
  errors.name = form.name ? '' : 'Term name is required.'
  errors.session = form.session ? '' : 'Session is required.'
  errors.startDate = form.startDate ? '' : 'Start date is required.'
  errors.endDate = form.endDate ? '' : 'End date is required.'
  return !errors.name && !errors.session && !errors.startDate && !errors.endDate
}

const submit = async () => {
  if (!validate()) return
  form.status = 'Active'
  await termsStore.saveTerm({ ...form })
  uiStore.addToast({ title: 'Term saved', message: 'Academic term changes were saved.', variant: 'success' })
  Object.assign(form, { id: null, name: '', session: '', startDate: '', endDate: '', status: 'Inactive' })
}
</script>
