<template>
  <AppDrawer
    :model-value="show"
    :title="isEdit ? 'Edit Session' : 'Create Session'"
    eyebrow="Academic Sessions"
    :subtitle="isEdit ? 'Update this session\u2019s timeline.' : 'Add a new academic session.'"
    size="sm"
    :has-unsaved-changes="isDirty"
    :persistent="saving"
    @close="$emit('close')"
  >
    <form id="session-form" class="space-y-6" @submit.prevent="submit">
      <FormSection title="Session Details" description="The name and timeline for this academic year.">
        <ResponsiveFormGrid :cols="1">
          <AppInput v-model="form.name" label="Session Name" placeholder="2025/2026" required :error="errors.name" @blur="touch('name')" />
        </ResponsiveFormGrid>
        <ResponsiveFormGrid :cols="2" class="mt-5">
          <AppInput v-model="form.startDate" type="date" label="Start Date" required :error="errors.startDate" @blur="touch('startDate')" />
          <AppInput v-model="form.endDate" type="date" label="End Date" required :error="errors.endDate" @blur="touch('endDate')" />
        </ResponsiveFormGrid>
        <label class="mt-4 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <input v-model="form.isCurrent" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]" />
          <span class="text-sm font-medium text-slate-700">Set as current academic session</span>
        </label>
      </FormSection>
    </form>

    <template #footer>
      <DrawerFooter
        :processing="saving"
        :submit-label="isEdit ? 'Update Session' : 'Create Session'"
        :submit-loading-label="isEdit ? 'Updating…' : 'Creating…'"
        submit-type="button"
        @cancel="requestCancel"
        @submit="submit"
      />
    </template>
  </AppDrawer>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import AppDrawer from '../../shared/AppDrawer.vue'
import AppInput from '../../shared/AppInput.vue'
import FormSection from '../../shared/FormSection.vue'
import ResponsiveFormGrid from '../../shared/ResponsiveFormGrid.vue'
import DrawerFooter from '../../shared/DrawerFooter.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  session: { type: Object, default: null },
  saving: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'submit'])

const isEdit = computed(() => !!props.session)

const emptyForm = () => ({ name: '', startDate: '', endDate: '', isCurrent: false })
const form = reactive(emptyForm())
const errors = reactive({ name: '', startDate: '', endDate: '' })
const touched = reactive({})
const initialSnapshot = ref(JSON.stringify(form))
const isDirty = computed(() => JSON.stringify(form) !== initialSnapshot.value)

const resetForm = (source) => {
  const s = source || {}
  const startDate = s.startDate || s.start_date || ''
  const endDate = s.endDate || s.end_date || ''
  Object.assign(form, {
    name: s.name || '',
    startDate: startDate ? startDate.split('T')[0] : '',
    endDate: endDate ? endDate.split('T')[0] : '',
    isCurrent: s.current || s.is_current || false,
  })
  Object.assign(errors, { name: '', startDate: '', endDate: '' })
  Object.keys(touched).forEach((k) => (touched[k] = false))
  initialSnapshot.value = JSON.stringify(form)
}

watch(() => props.session, (s) => resetForm(s), { immediate: true })
watch(() => props.show, (show) => { if (!show) resetForm(props.session) })

const touch = (field) => { touched[field] = true; validateField(field) }
const validators = {
  name: (v) => (v?.trim() ? '' : 'Session name is required.'),
  startDate: (v) => (v ? '' : 'Start date is required.'),
  endDate: (v) => (v ? '' : 'End date is required.'),
}
const validateField = (field) => { errors[field] = validators[field]?.(form[field]) || '' }
const validate = () => {
  Object.keys(validators).forEach((field) => { touched[field] = true; validateField(field) })
  return !Object.values(errors).some(Boolean)
}

const submit = () => {
  if (props.saving) return
  if (!validate()) return
  emit('submit', {
    id: props.session?.id,
    name: form.name,
    startDate: form.startDate,
    endDate: form.endDate,
    isCurrent: Boolean(form.isCurrent),
  })
}

const requestCancel = () => {
  if (isDirty.value && !window.confirm('You have unsaved changes. Are you sure you want to discard them?')) return
  emit('close')
}
</script>
