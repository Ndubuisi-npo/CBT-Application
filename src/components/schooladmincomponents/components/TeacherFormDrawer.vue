<template>
  <AppDrawer
    :model-value="show"
    :title="isEdit ? 'Edit Teacher' : 'Create Teacher'"
    eyebrow="Teachers"
    :subtitle="isEdit ? 'Update this teacher\u2019s information.' : 'Fill in the teacher information below.'"
    size="md"
    :has-unsaved-changes="isDirty"
    :persistent="saving"
    @close="$emit('close')"
  >
    <form id="teacher-form" class="space-y-6" @submit.prevent="submit">
      <FormSection title="Personal Information" description="Who this teacher is.">
        <ResponsiveFormGrid :cols="2">
          <AppInput v-model="form.firstName" label="First Name" placeholder="John" required :error="errors.firstName" @blur="touch('firstName')" />
          <AppInput v-model="form.lastName" label="Last Name" placeholder="Doe" required :error="errors.lastName" @blur="touch('lastName')" />
          <AppInput v-model="form.email" type="email" label="Email" placeholder="john.doe@school.edu" required :error="errors.email" class="sm:col-span-2" @blur="touch('email')" />
          <AppInput v-model="form.phone" label="Phone" placeholder="+234 800 000 0000" required :error="errors.phone" @blur="touch('phone')" />
          <AppSelect
            v-model="form.gender"
            label="Gender"
            placeholder="Select gender"
            :options="[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]"
          />
        </ResponsiveFormGrid>
      </FormSection>

      <FormSection title="Professional Information" description="Staff record details.">
        <ResponsiveFormGrid :cols="2">
          <AppInput v-model="form.staff_id" label="Staff ID" placeholder="STF-001" required :error="errors.staff_id" @blur="touch('staff_id')" />
          <AppInput v-model="form.qualification" label="Qualification" placeholder="B.Sc. Mathematics" required :error="errors.qualification" @blur="touch('qualification')" />
          <AppInput v-model="form.date_joined" type="date" label="Date Joined" />
        </ResponsiveFormGrid>
      </FormSection>

      <FormSection v-if="!isEdit" title="Account Access" description="Login details for this teacher's first sign-in.">
        <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Default Password</p>
          <p class="mt-1 font-mono text-sm font-semibold text-slate-900">teach12345</p>
          <p class="mt-1 text-xs text-slate-500">The teacher must change this on first login.</p>
        </div>
      </FormSection>
    </form>

    <template #footer>
      <DrawerFooter
        :processing="saving"
        :submit-label="isEdit ? 'Update Teacher' : 'Create Teacher'"
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
import AppSelect from '../../shared/AppSelect.vue'
import FormSection from '../../shared/FormSection.vue'
import ResponsiveFormGrid from '../../shared/ResponsiveFormGrid.vue'
import DrawerFooter from '../../shared/DrawerFooter.vue'
import { validateAccountEmail } from '../../../js/lib/validators'
import { toDateInputValue } from '../../../js/lib/helpers'

const props = defineProps({
  show: { type: Boolean, default: false },
  teacher: { type: Object, default: null },
  /** Parent-controlled: true while the actual create/update API call is in flight. */
  saving: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'submit'])

const isEdit = computed(() => !!props.teacher)

const tp = computed(() => {
  if (!props.teacher) return null
  return props.teacher.teacherProfile || props.teacher.teacher_profile || props.teacher.profile || null
})

const emptyForm = () => ({ firstName: '', lastName: '', email: '', phone: '', gender: '', qualification: '', staff_id: '', date_joined: '' })
const form = reactive(emptyForm())
const errors = reactive(emptyForm())
const touched = reactive({})
const initialSnapshot = ref(JSON.stringify(form))

const isDirty = computed(() => JSON.stringify(form) !== initialSnapshot.value)

const resetForm = (source) => {
  const t = source || {}
  const profile = tp.value || {}
  Object.assign(form, {
    firstName: t.first_name || t.user?.first_name || '',
    lastName: t.last_name || t.user?.last_name || '',
    email: t.email || t.user?.email || '',
    phone: t.phone || t.user?.phone || '',
    gender: profile.gender || t.gender || '',
    qualification: profile.qualification || t.qualification || '',
    staff_id: profile.staff_id || t.staff_id || '',
    date_joined: toDateInputValue(profile.date_joined || profile.dateJoined || t.date_joined || t.dateJoined),
  })
  Object.assign(errors, emptyForm())
  Object.keys(touched).forEach((k) => (touched[k] = false))
  initialSnapshot.value = JSON.stringify(form)
}

watch(() => props.teacher, (t) => resetForm(t), { immediate: true })
watch(() => props.show, (show) => {
  if (!show) resetForm(props.teacher)
})

const touch = (field) => { touched[field] = true; validateField(field) }

const validators = {
  firstName: (v) => (v?.trim() ? '' : 'First name is required.'),
  lastName: (v) => (v?.trim() ? '' : 'Last name is required.'),
  email: (v) => validateAccountEmail(v),
  phone: (v) => (v?.trim() ? '' : 'Phone number is required.'),
  qualification: (v) => (v?.trim() ? '' : 'Qualification is required.'),
  staff_id: (v) => (v?.trim() ? '' : 'Staff ID is required.'),
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
    id: props.teacher?.id,
    first_name: form.firstName,
    last_name: form.lastName,
    email: form.email,
    phone: form.phone,
    gender: form.gender || undefined,
    qualification: form.qualification,
    staff_id: form.staff_id,
    date_joined: form.date_joined || undefined,
  })
}

const requestCancel = () => {
  if (isDirty.value && !window.confirm('You have unsaved changes. Are you sure you want to discard them?')) return
  emit('close')
}
</script>
