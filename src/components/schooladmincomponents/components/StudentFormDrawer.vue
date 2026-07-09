<!--
  StudentFormDrawer.vue
  ────────────────────────────────────────────────────────────────────────
  Create/Edit drawer for students. Replaces the old StudentModal.vue,
  which mixed a read-only "view" mode into the same component — that view
  mode has been removed in favour of the dedicated /school-admin/students/:id
  profile page. This component is now create/edit only.
-->
<template>
  <AppDrawer
    :model-value="show"
    :title="isEdit ? 'Edit Student' : 'Create Student'"
    eyebrow="Students"
    :subtitle="isEdit ? 'Update this student\u2019s information.' : 'Fill in the student information below.'"
    size="lg"
    :has-unsaved-changes="isDirty"
    :persistent="saving"
    @close="$emit('close')"
  >
    <form id="student-form" class="space-y-6" @submit.prevent="submit">
      <FormSection title="Personal Information" description="Who this student is.">
        <ResponsiveFormGrid :cols="2">
          <AppInput v-model="form.firstName" label="First Name" placeholder="Jane" required :error="errors.firstName" @blur="touch('firstName')" />
          <AppInput v-model="form.lastName" label="Last Name" placeholder="Doe" required :error="errors.lastName" @blur="touch('lastName')" />
          <AppInput v-model="form.email" type="email" label="Email" placeholder="jane.doe@school.edu" required :error="errors.email" @blur="touch('email')" />
          <AppInput v-model="form.phone" label="Phone" placeholder="+234 800 000 0000" required :error="errors.phone" @blur="touch('phone')" />
          <AppSelect
            v-model="form.gender"
            label="Gender"
            placeholder="Select gender"
            :options="[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]"
          />
          <AppInput v-model="form.date_of_birth" type="date" label="Date of Birth" />
        </ResponsiveFormGrid>
      </FormSection>

      <FormSection title="Academic Information" description="Class placement and admission record.">
        <ResponsiveFormGrid :cols="2">
          <AppInput v-model="form.admission_number" label="Admission Number" placeholder="ADM2024-001" required :error="errors.admission_number" @blur="touch('admission_number')" />
          <div />
          <AppSelect
            v-model="form.class_level_id"
            label="Class Level"
            placeholder="Select class level"
            :disabled="loadingClassLevels"
            :hint="loadingClassLevels ? 'Loading…' : ''"
            :options="classLevels.map((l) => ({ value: l.id, label: l.name }))"
          />
          <AppSelect
            v-model="form.class_arm_id"
            label="Class Arm"
            placeholder="Select class arm"
            :disabled="!form.class_level_id || loadingClassArms"
            :hint="loadingClassArms ? 'Loading…' : (form.class_level_id && !classArms.length ? 'No arms found.' : '')"
            :options="classArms.map((a) => ({ value: a.id, label: a.name }))"
          />
        </ResponsiveFormGrid>
      </FormSection>

      <FormSection title="Parent / Guardian" description="Who to contact about this student.">
        <ResponsiveFormGrid :cols="2">
          <AppInput v-model="form.guardian_name" label="Guardian Name" placeholder="Full name" class="sm:col-span-2" />
          <AppInput v-model="form.guardian_phone" label="Guardian Phone" placeholder="+234 800 000 0000" />
          <AppInput v-model="form.guardian_email" type="email" label="Guardian Email" placeholder="guardian@example.com" />
        </ResponsiveFormGrid>
      </FormSection>

      <FormSection v-if="!isEdit" title="Account Access" description="Login details for this student's first sign-in.">
        <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Default Password</p>
          <p class="mt-1 font-mono text-sm font-semibold text-slate-900">Cbt@2026</p>
          <p class="mt-1 text-xs text-slate-500">The student must change this on first login.</p>
        </div>
      </FormSection>
    </form>

    <template #footer>
      <DrawerFooter
        :processing="saving"
        :submit-label="isEdit ? 'Update Student' : 'Create Student'"
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
import { fetchClassLevels, fetchClassArms } from '../../../js/api/classManagement'

const props = defineProps({
  show: { type: Boolean, default: false },
  student: { type: Object, default: null },
  /** Parent-controlled: true while the actual create/update API call is in flight. */
  saving: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'submit'])

const isEdit = computed(() => !!props.student)

const sp = computed(() => {
  if (!props.student) return null
  return props.student.studentProfile || props.student.student_profile || props.student.profile
    || props.student.user?.studentProfile || props.student.user?.student_profile || null
})

const emptyForm = () => ({
  firstName: '', lastName: '', email: '', phone: '',
  gender: '', date_of_birth: '', admission_number: '',
  class_level_id: '', class_arm_id: '',
  guardian_name: '', guardian_phone: '', guardian_email: '',
})
const form = reactive(emptyForm())
const errors = reactive({ firstName: '', lastName: '', email: '', phone: '', admission_number: '' })
const touched = reactive({})
const initialSnapshot = ref(JSON.stringify(form))

const isDirty = computed(() => JSON.stringify(form) !== initialSnapshot.value)

const classLevels = ref([])
const classArms = ref([])
const loadingClassLevels = ref(false)
const loadingClassArms = ref(false)

const loadClassLevels = async () => {
  loadingClassLevels.value = true
  try {
    const data = await fetchClassLevels()
    classLevels.value = Array.isArray(data) ? data : (data?.class_levels || data?.data || [])
  } catch { classLevels.value = [] }
  finally { loadingClassLevels.value = false }
}

const loadClassArms = async (id) => {
  if (!id) { classArms.value = []; return }
  loadingClassArms.value = true
  try {
    const data = await fetchClassArms(id)
    classArms.value = Array.isArray(data) ? data : (data?.arms || data?.class_arms || data?.data || [])
  } catch { classArms.value = [] }
  finally { loadingClassArms.value = false }
}

const resetForm = (source) => {
  const t = source || {}
  const profile = sp.value || {}
  const classArm = profile.class_arm || profile.classArm || {}
  const classLevel = profile.class_level || profile.classLevel || classArm.class_level || classArm.classLevel || {}
  Object.assign(form, {
    firstName: t.first_name || t.user?.first_name || '',
    lastName: t.last_name || t.user?.last_name || '',
    email: t.email || t.user?.email || '',
    phone: t.phone || t.user?.phone || '',
    gender: profile.gender || t.gender || '',
    date_of_birth: profile.date_of_birth || t.date_of_birth || '',
    admission_number: profile.admission_number || t.admission_number || '',
    class_level_id: classLevel.id || profile.class_level_id || '',
    class_arm_id: classArm.id || profile.class_arm_id || '',
    guardian_name: profile.guardian_name || t.guardian_name || '',
    guardian_phone: profile.guardian_phone || t.guardian_phone || '',
    guardian_email: profile.guardian_email || t.guardian_email || '',
  })
  Object.keys(errors).forEach((k) => (errors[k] = ''))
  Object.keys(touched).forEach((k) => (touched[k] = false))
  if (form.class_level_id) loadClassArms(form.class_level_id)
  initialSnapshot.value = JSON.stringify(form)
}

watch(() => props.student, (t) => resetForm(t), { immediate: true })
watch(() => props.show, async (show) => {
  if (show) await loadClassLevels()
  else resetForm(props.student)
})
watch(() => form.class_level_id, (id, prevId) => {
  if (id === prevId) return
  form.class_arm_id = ''
  loadClassArms(id)
})

const touch = (field) => { touched[field] = true; validateField(field) }

const validators = {
  firstName: (v) => (v?.trim() ? '' : 'First name is required.'),
  lastName: (v) => (v?.trim() ? '' : 'Last name is required.'),
  email: (v) => {
    if (!v?.trim()) return 'Email is required.'
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email address.'
  },
  phone: (v) => (v?.trim() ? '' : 'Phone number is required.'),
  admission_number: (v) => (v?.trim() ? '' : 'Admission number is required.'),
}

const validateField = (field) => { errors[field] = validators[field]?.(form[field]) || '' }

const validate = () => {
  Object.keys(validators).forEach((field) => { touched[field] = true; validateField(field) })
  return !Object.values(errors).some(Boolean)
}

const submit = () => {
  if (props.saving) return
  if (!validate()) return

  const existingAdmNo = sp.value?.admission_number || props.student?.admission_number || ''
  const payload = {
    id: props.student?.id,
    first_name: form.firstName,
    last_name: form.lastName,
    email: form.email,
    phone: form.phone,
    gender: form.gender || undefined,
    date_of_birth: form.date_of_birth || undefined,
    class_level_id: form.class_level_id || undefined,
    class_arm_id: form.class_arm_id || undefined,
    guardian_name: form.guardian_name || undefined,
    guardian_phone: form.guardian_phone || undefined,
    guardian_email: form.guardian_email || undefined,
  }
  if (!props.student || form.admission_number !== existingAdmNo) {
    payload.admission_number = form.admission_number
  }
  emit('submit', payload)
}

const requestCancel = () => {
  if (isDirty.value && !window.confirm('You have unsaved changes. Are you sure you want to discard them?')) return
  emit('close')
}
</script>
