<template>
  <AppDrawer
    :model-value="show"
    :title="isView ? 'Teacher Details' : (isEdit ? 'Edit Teacher' : 'Create Teacher')"
    :eyebrow="isView ? 'Staff Profile' : 'Teachers'"
    :subtitle="isView ? teacherInfo.fullName : 'Fill in the teacher information below.'"
    size="lg"
    @update:model-value="$emit('close')"
  >
    <!-- VIEW mode -->
    <div v-if="isView && teacher" class="space-y-6">

      <!-- Avatar + header -->
      <div class="flex items-start gap-4">
        <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-xs font-bold text-emerald-700">
          {{ teacherInfo.initials }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold text-slate-900">{{ teacherInfo.fullName }}</p>
          <p class="text-xs text-slate-500">{{ displayValue(teacherInfo.email) }}</p>
          <span
            class="mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
            :class="teacher.is_active !== false
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
              : 'bg-red-50 text-red-700 ring-1 ring-red-200'"
          >
            <span class="h-1.5 w-1.5 rounded-full" :class="teacher.is_active !== false ? 'bg-emerald-500' : 'bg-red-500'" />
            {{ teacher.is_active !== false ? 'Active' : 'Inactive' }}
          </span>
        </div>
      </div>

      <!-- A. Personal Information -->
      <div>
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Personal Information</p>
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-400">First Name</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(teacherInfo.firstName) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-400">Last Name</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(teacherInfo.lastName) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-4 py-3 col-span-2">
            <p class="text-xs font-medium text-slate-400">Email</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(teacherInfo.email) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-400">Phone</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(teacherInfo.phone) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-400">Status</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(teacherInfo.status) }}</p>
          </div>
        </div>
      </div>

      <!-- B. Professional Information -->
      <div>
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Professional Information</p>
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-400">Staff ID</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(teacherInfo.staffId) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-400">Qualification</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(teacherInfo.qualification) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-400">Department</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(teacherInfo.department) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-400">Date Joined</p>
            <p class="mt-0.5 break-words text-xs font-semibold text-slate-900">{{ displayValue(teacherInfo.dateJoined) }}</p>
          </div>
        </div>
      </div>

      <!-- C. Assigned Classes -->
      <div>
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Assigned Classes</p>
        <div v-if="resolvedClasses.length" class="space-y-2">
          <div
            v-for="cls in resolvedClasses"
            :key="cls.id || cls.name"
            class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
          >
            <div>
              <p class="text-xs font-semibold text-slate-900">{{ displayValue(cls.name) }}</p>
              <p v-if="cls.levelName && cls.levelName !== 'N/A'" class="text-xs text-slate-500">{{ cls.levelName }}</p>
            </div>
            <span v-if="cls.studentCount && cls.studentCount !== 'N/A'" class="text-xs text-slate-400">{{ cls.studentCount }} students</span>
          </div>
        </div>
        <div v-else class="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
          No classes assigned yet.
        </div>
      </div>

      <!-- D. Teaching Assignments -->
      <div>
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Teaching Assignments</p>
        <div v-if="resolvedAssignments.length" class="space-y-2">
          <div
            v-for="(asgn, i) in resolvedAssignments"
            :key="asgn.id || i"
            class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
          >
            <p class="text-xs font-semibold text-slate-900">{{ displayValue(asgn.subjectName) }}</p>
            <span v-if="asgn.levelName && asgn.levelName !== 'N/A'" class="inline-flex items-center rounded-full bg-[#0B1F3A]/8 px-2.5 py-0.5 text-xs font-semibold text-[#0B1F3A]">
              {{ asgn.levelName }}
            </span>
          </div>
        </div>
        <div v-else class="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
          No subject assignments yet.
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
        <FormField label="Staff ID" :error="errors.staff_id" required>
          <input v-model="form.staff_id" class="sa-input" placeholder="STF-001" />
        </FormField>
        <FormField label="Qualification" :error="errors.qualification" required>
          <input v-model="form.qualification" class="sa-input" placeholder="B.Sc. Mathematics" />
        </FormField>
      </div>

      <div v-if="!isEdit" class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Default Password</p>
        <p class="mt-1 font-mono text-sm font-semibold text-slate-900">teach12345</p>
        <p class="mt-1 text-xs text-slate-500">Teacher must change this on first login.</p>
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
          :text="isEdit ? 'Update Teacher' : 'Create Teacher'"
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

const props = defineProps({
  show: { type: Boolean, default: false },
  teacher: { type: Object, default: null },
  mode: { type: String, default: 'edit', validator: (v) => ['view', 'edit'].includes(v) },
})
const emit = defineEmits(['close', 'submit'])

const isEdit = computed(() => props.mode === 'edit' && !!props.teacher)
const isView = computed(() => props.mode === 'view')
const displayValue = (value) => (value === null || value === undefined || value === '' ? 'N/A' : value)
const firstValue = (...values) => values.find((value) => value !== null && value !== undefined && value !== '')

// teacher profile shorthand
const tp = computed(() => {
  if (!props.teacher) return null
  return props.teacher.teacherProfile
    || props.teacher.teacher_profile
    || props.teacher.profile
    || props.teacher.user?.teacherProfile
    || props.teacher.user?.teacher_profile
    || null
})

const teacherInfo = computed(() => {
  const teacher = props.teacher || {}
  const profile = tp.value || {}
  const firstName = firstValue(teacher.first_name, teacher.firstName, teacher.user?.first_name, teacher.user?.firstName)
  const lastName = firstValue(teacher.last_name, teacher.lastName, teacher.user?.last_name, teacher.user?.lastName)
  const fullName = firstValue(
    teacher.name,
    teacher.full_name,
    teacher.fullName,
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
    email: firstValue(teacher.email, teacher.user?.email),
    phone: firstValue(teacher.phone, teacher.user?.phone),
    status: teacher.is_active !== false ? 'Active' : 'Inactive',
    staffId: firstValue(profile.staff_id, profile.staffId, teacher.staff_id, teacher.staffId),
    qualification: firstValue(profile.qualification, teacher.qualification),
    department: firstValue(profile.department, teacher.department),
    dateJoined: firstValue(profile.date_joined, profile.dateJoined, teacher.date_joined, teacher.dateJoined),
  }
})

// Resolved assigned classes — flatten multiple sources
const resolvedClasses = computed(() => {
  if (!props.teacher) return []
  const direct = props.teacher.assignedClasses || props.teacher.assigned_classes || []
  const fromAsgn = (props.teacher.teacherAssignments || props.teacher.assignments || [])
    .map((a) => a.class_level || a.class || null)
    .filter(Boolean)
  const combined = [...direct, ...fromAsgn]
  const seen = new Map()
  combined.forEach((c) => {
    const key = c?.id || c?.name
    if (key && !seen.has(key)) {
      seen.set(key, {
        id: c.id,
        name: c.name || c.class_name || 'N/A',
        levelName: c.class_level?.name || c.class_level_name || 'N/A',
        studentCount: c.student_count ?? c.studentCount ?? 'N/A',
      })
    }
  })
  return Array.from(seen.values())
})

// Resolved teaching assignments
const resolvedAssignments = computed(() => {
  if (!props.teacher) return []
  const src = props.teacher.teacherAssignments || props.teacher.assignments || props.teacher.assignedSubjects || []
  return src.map((a, i) => ({
    id: a.id || i,
    subjectName: a.subject?.name || a.subject_name || 'N/A',
    levelName: a.class_level?.name || a.class_level_name || 'N/A',
  }))
})

// Form state
const form = reactive({ firstName: '', lastName: '', email: '', phone: '', qualification: '', staff_id: '' })
const errors = reactive({ firstName: '', lastName: '', email: '', phone: '', qualification: '', staff_id: '' })
const loading = ref(false)

const resetForm = () => {
  Object.assign(form, { firstName: '', lastName: '', email: '', phone: '', qualification: '', staff_id: '' })
  Object.assign(errors, { firstName: '', lastName: '', email: '', phone: '', qualification: '', staff_id: '' })
}

watch(() => props.teacher, (t) => {
  if (t) {
    form.firstName = t.user?.first_name || t.first_name || ''
    form.lastName = t.user?.last_name || t.last_name || ''
    form.email = t.user?.email || t.email || ''
    form.phone = t.user?.phone || t.phone || ''
    form.qualification = tp.value?.qualification || t.qualification || ''
    form.staff_id = tp.value?.staff_id || t.staff_id || ''
  } else {
    resetForm()
  }
}, { immediate: true })

watch(() => props.show, (show) => {
  if (!show) { loading.value = false; resetForm() }
})

const validate = () => {
  errors.firstName = form.firstName?.trim() ? '' : 'First name is required.'
  errors.lastName = form.lastName?.trim() ? '' : 'Last name is required.'
  errors.email = form.email?.trim() ? '' : 'Email is required.'
  errors.phone = form.phone?.trim() ? '' : 'Phone is required.'
  errors.qualification = form.qualification?.trim() ? '' : 'Qualification is required.'
  errors.staff_id = form.staff_id?.trim() ? '' : 'Staff ID is required.'
  return !Object.values(errors).some(Boolean)
}

const submit = () => {
  if (!validate()) return
  loading.value = true
  emit('submit', {
    id: props.teacher?.id,
    first_name: form.firstName,
    last_name: form.lastName,
    email: form.email,
    phone: form.phone,
    qualification: form.qualification,
    staff_id: form.staff_id,
  })
  loading.value = false
}
</script>
