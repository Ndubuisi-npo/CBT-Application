<template>
  <AppDrawer
    :model-value="show"
    :title="isView ? 'Student Details' : (isEdit ? 'Edit Student' : 'Create Student')"
    :eyebrow="isView ? 'Profile' : 'Students'"
    :subtitle="isView ? studentInfo.fullName : 'Fill in the student information below.'"
    size="lg"
    @update:model-value="$emit('close')"
  >
    <!-- VIEW mode -->
    <div v-if="isView && student" class="space-y-6">

      <!-- Avatar + header -->
      <div class="flex items-start gap-4">
        <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#0B1F3A]/10 text-xs font-bold text-[#0B1F3A]">
          {{ studentInfo.initials }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold text-slate-900">{{ studentInfo.fullName }}</p>
          <p class="text-xs text-slate-500">{{ displayValue(studentInfo.email) }}</p>
          <span
            class="mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
            :class="student.is_active !== false
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
              : 'bg-red-50 text-red-700 ring-1 ring-red-200'"
          >
            <span class="h-1.5 w-1.5 rounded-full" :class="student.is_active !== false ? 'bg-emerald-500' : 'bg-red-500'" />
            {{ student.is_active !== false ? 'Active' : 'Inactive' }}
          </span>
        </div>
      </div>

      <!-- A. Personal Information -->
      <div>
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Personal Information</p>
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-400">First Name</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(studentInfo.firstName) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-400">Last Name</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(studentInfo.lastName) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-4 py-3 col-span-2">
            <p class="text-xs font-medium text-slate-400">Email</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(studentInfo.email) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-400">Phone</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(studentInfo.phone) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-400">Gender</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(studentInfo.gender) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-400">Date of Birth</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(studentInfo.dateOfBirth) }}</p>
          </div>
        </div>
      </div>

      <!-- B. Academic Information -->
      <div>
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Academic Information</p>
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-400">Admission Number</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(studentInfo.admissionNumber) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-400">Admission Date</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(studentInfo.admissionDate) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-400">Class</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(studentInfo.classArmName) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-400">Class Level</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(studentInfo.classLevelName) }}</p>
          </div>
        </div>
      </div>

      <!-- C. Guardian Information -->
      <div>
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Guardian Information</p>
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-xl bg-slate-50 px-4 py-3 col-span-2">
            <p class="text-xs font-medium text-slate-400">Guardian Name</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(studentInfo.guardianName) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-400">Guardian Email</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(studentInfo.guardianEmail) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-400">Guardian Phone</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(studentInfo.guardianPhone) }}</p>
          </div>
        </div>
      </div>

      <!-- D. Additional Information -->
      <div>
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Additional Information</p>
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-400">State of Origin</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(studentInfo.stateOfOrigin) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-400">Blood Group</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(studentInfo.bloodGroup) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- EDIT / CREATE mode -->
    <form v-else class="space-y-5" @submit.prevent="submit">
      <div class="grid gap-4 sm:grid-cols-2">
        <FormField label="First Name" :error="errors.firstName" required>
          <input v-model="form.firstName" class="sa-input" placeholder="John" />
        </FormField>
        <FormField label="Last Name" :error="errors.lastName" required>
          <input v-model="form.lastName" class="sa-input" placeholder="Doe" />
        </FormField>
      </div>

      <FormField label="Email" :error="errors.email" required>
        <input v-model="form.email" type="email" class="sa-input" placeholder="john.doe@school.edu" />
      </FormField>

      <FormField label="Phone" :error="errors.phone" required>
        <input v-model="form.phone" class="sa-input" placeholder="+234 800 000 0000" />
      </FormField>

      <div class="grid gap-4 sm:grid-cols-2">
        <FormField label="Gender" :error="errors.gender">
          <select v-model="form.gender" class="sa-input">
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </FormField>
        <FormField label="Date of Birth" :error="errors.date_of_birth">
          <input v-model="form.date_of_birth" type="date" class="sa-input" />
        </FormField>
      </div>

      <FormField label="Admission Number" :error="errors.admission_number" required>
        <input v-model="form.admission_number" class="sa-input" placeholder="ADM2024-001" />
      </FormField>

      <div v-if="!isEdit" class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Default Password</p>
        <p class="mt-1 font-mono text-sm font-semibold text-slate-900">Cbt@2026</p>
        <p class="mt-1 text-xs text-slate-500">Student must change this on first login.</p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <FormField label="Class Level" :error="errors.class_level_id">
          <select v-model="form.class_level_id" class="sa-input" :disabled="loadingClassLevels">
            <option value="">Select class level</option>
            <option v-for="level in classLevels" :key="level.id" :value="level.id">{{ level.name }}</option>
          </select>
          <p v-if="loadingClassLevels" class="mt-1 text-xs text-slate-400">Loading…</p>
        </FormField>
        <FormField label="Class Arm" :error="errors.class_arm_id">
          <select v-model="form.class_arm_id" class="sa-input" :disabled="!form.class_level_id || loadingClassArms">
            <option value="">Select class arm</option>
            <option v-for="arm in classArms" :key="arm.id" :value="arm.id">{{ arm.name }}</option>
          </select>
          <p v-if="loadingClassArms" class="mt-1 text-xs text-slate-400">Loading…</p>
          <p v-if="form.class_level_id && !loadingClassArms && !classArms.length" class="mt-1 text-xs text-slate-400">No arms found.</p>
        </FormField>
      </div>
    </form>

    <template #footer>
      <div v-if="isView" class="flex justify-end">
        <button
          type="button"
          class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          @click="$emit('close')"
        >Close</button>
      </div>
      <div v-else class="flex gap-3">
        <AppButton
          :text="isEdit ? 'Update Student' : 'Create Student'"
          :loading-text="isEdit ? 'Updating…' : 'Creating…'"
          :processing="loading"
          :disabled="loading"
          variant="primary"
          class="flex-1"
          @click="submit"
        />
        <AppButton text="Cancel" variant="outline" @click="$emit('close')" />
      </div>
    </template>
  </AppDrawer>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import AppDrawer from '../../shared/AppDrawer.vue'
import AppButton from '../../shared/AppButton.vue'
import FormField from './FormField.vue'
import { fetchClassLevels, fetchClassArms } from '../../../js/api/classManagement'


const props = defineProps({
  show: { type: Boolean, default: false },
  student: { type: Object, default: null },
  mode: { type: String, default: 'edit', validator: (v) => ['view', 'edit'].includes(v) },
})
const emit = defineEmits(['close', 'submit'])

const isEdit = computed(() => props.mode === 'edit' && !!props.student)
const isView = computed(() => props.mode === 'view')
const displayValue = (value) => (value === null || value === undefined || value === '' ? 'N/A' : value)
const firstValue = (...values) => values.find((value) => value !== null && value !== undefined && value !== '')

// Student profile shorthand N/A check both camelCase and snake_case
const sp = computed(() => {
  if (!props.student) return null
  return props.student.studentProfile
    || props.student.student_profile
    || props.student.profile
    || props.student.user?.studentProfile
    || props.student.user?.student_profile
    || null
})

const studentInfo = computed(() => {
  const student = props.student || {}
  const profile = sp.value || {}
  const classArm = firstValue(profile.class_arm, profile.classArm) || {}
  const classLevel = firstValue(profile.class_level, profile.classLevel, classArm.class_level, classArm.classLevel) || {}
  const firstName = firstValue(student.first_name, student.firstName, student.user?.first_name, student.user?.firstName)
  const lastName = firstValue(student.last_name, student.lastName, student.user?.last_name, student.user?.lastName)
  const fullName = firstValue(
    student.name,
    student.full_name,
    student.fullName,
    `${firstName || ''} ${lastName || ''}`.trim(),
  )

  return {
    firstName,
    lastName,
    fullName: fullName || 'N/A',
    initials: (fullName || '')
      .split(' ')
      .map((part) => part[0] || '')
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'NA',
    email: firstValue(student.email, student.user?.email),
    phone: firstValue(student.phone, student.user?.phone),
    gender: firstValue(profile.gender, student.gender),
    dateOfBirth: firstValue(profile.date_of_birth, profile.dateOfBirth, student.date_of_birth, student.dateOfBirth),
    admissionNumber: firstValue(profile.admission_number, profile.admissionNumber, student.admission_number, student.admissionNumber),
    admissionDate: firstValue(profile.admission_date, profile.admissionDate, student.admission_date, student.admissionDate),
    classArmName: firstValue(classArm.name, profile.class_name, profile.className, student.class_name, student.className),
    classArmId: firstValue(profile.class_arm_id, profile.classArmId, classArm.id, student.class_arm_id, student.classArmId),
    classLevelName: firstValue(classLevel.name, profile.class_level_name, profile.classLevelName, student.class_level_name, student.classLevelName),
    classLevelId: firstValue(profile.class_level_id, profile.classLevelId, classLevel.id, student.class_level_id, student.classLevelId),
    guardianName: firstValue(profile.guardian_name, profile.guardianName, student.guardian_name, student.guardianName),
    guardianEmail: firstValue(profile.guardian_email, profile.guardianEmail, student.guardian_email, student.guardianEmail),
    guardianPhone: firstValue(profile.guardian_phone, profile.guardianPhone, student.guardian_phone, student.guardianPhone),
    stateOfOrigin: firstValue(profile.state_of_origin, profile.stateOfOrigin, student.state_of_origin, student.stateOfOrigin),
    bloodGroup: firstValue(profile.blood_group, profile.bloodGroup, student.blood_group, student.bloodGroup),
    profileId: firstValue(profile.id, student.student_profile_id, student.studentProfileId),
  }
})

const form = reactive({
  firstName: '', lastName: '', email: '', phone: '',
  gender: '', date_of_birth: '', admission_number: '',
  class_level_id: '', class_arm_id: '',
})
const errors = reactive({
  firstName: '', lastName: '', email: '', phone: '',
  gender: '', date_of_birth: '', admission_number: '',
  class_level_id: '', class_arm_id: '',
})
const loading = ref(false)
const classLevels = ref([])
const classArms = ref([])
const loadingClassLevels = ref(false)
const loadingClassArms = ref(false)

const resetForm = () => {
  Object.assign(form, { firstName: '', lastName: '', email: '', phone: '', gender: '', date_of_birth: '', admission_number: '', class_level_id: '', class_arm_id: '' })
  Object.assign(errors, { firstName: '', lastName: '', email: '', phone: '', gender: '', date_of_birth: '', admission_number: '', class_level_id: '', class_arm_id: '' })
}

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

watch(() => props.student, (student) => {
  if (student) {
    const profile = student.studentProfile || student.student_profile
    form.firstName = student.user?.first_name || student.first_name || ''
    form.lastName = student.user?.last_name || student.last_name || ''
    form.email = student.user?.email || student.email || ''
    form.phone = student.user?.phone || student.phone || ''
    form.gender = profile?.gender || student.gender || ''
    form.date_of_birth = profile?.date_of_birth || student.date_of_birth || ''
    form.admission_number = profile?.admission_number || student.admission_number || ''
    form.class_level_id = profile?.class_arm?.class_level?.id || profile?.class_level?.id || ''
    form.class_arm_id = profile?.class_arm?.id || ''
    if (form.class_level_id) loadClassArms(form.class_level_id)
  } else {
    resetForm()
  }
}, { immediate: true })

watch(() => props.show, async (show) => {
  if (show) { await loadClassLevels() }
  else { loading.value = false; resetForm() }
})

watch(() => form.class_level_id, (id) => {
  form.class_arm_id = ''
  loadClassArms(id)
})

const validate = () => {
  errors.firstName = form.firstName?.trim() ? '' : 'First name is required.'
  errors.lastName = form.lastName?.trim() ? '' : 'Last name is required.'
  errors.email = form.email?.trim() ? '' : 'Email is required.'
  errors.phone = form.phone?.trim() ? '' : 'Phone is required.'
  errors.admission_number = form.admission_number?.trim() ? '' : 'Admission number is required.'
  return !Object.values(errors).some(Boolean)
}

const submit = () => {
  if (!validate()) return
  loading.value = true
  const payload = {
    first_name: form.firstName,
    last_name: form.lastName,
    email: form.email,
    phone: form.phone,
    gender: form.gender || undefined,
    date_of_birth: form.date_of_birth || undefined,
    class_level_id: form.class_level_id || undefined,
    class_arm_id: form.class_arm_id || undefined,
  }
  const existingAdmNo = props.student?.studentProfile?.admission_number
    || props.student?.student_profile?.admission_number
    || props.student?.admission_number
    || ''
  if (!props.student || form.admission_number !== existingAdmNo) {
    payload.admission_number = form.admission_number
  }
  emit('submit', { id: props.student?.id, ...payload })
}
</script>
