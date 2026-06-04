<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
      <div class="relative w-full max-w-2xl max-h-[80vh] transform overflow-y-auto rounded-lg bg-white shadow-xl transition-all">
        <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-6 h-full flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-slate-900">{{ isView ? 'Student Details' : (isEdit ? 'Edit Student' : 'Create Student') }}</h3>
            <AppButton @click="$emit('close')" :icon="X" variant="ghost" class="text-slate-400 hover:text-slate-600" />
          </div>

          <div class="flex-1 overflow-y-auto">
            <div v-if="isView && student" class="space-y-6">
              <div>
                <h4 class="text-sm font-medium text-slate-700 mb-3">Basic Information</h4>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm text-slate-500">First Name</label>
                    <p class="text-sm font-medium text-slate-900">{{ student.first_name || student.user?.first_name || 'Not specified' }}</p>
                  </div>
                  <div>
                    <label class="block text-sm text-slate-500">Last Name</label>
                    <p class="text-sm font-medium text-slate-900">{{ student.last_name || student.user?.last_name || 'Not specified' }}</p>
                  </div>
                  <div>
                    <label class="block text-sm text-slate-500">Email</label>
                    <p class="text-sm font-medium text-slate-900">{{ student.email || student.user?.email || 'Not specified' }}</p>
                  </div>
                  <div>
                    <label class="block text-sm text-slate-500">Phone</label>
                    <p class="text-sm font-medium text-slate-900">{{ student.phone || student.user?.phone || 'Not specified' }}</p>
                  </div>
                  <div>
                    <label class="block text-sm text-slate-500">Gender</label>
                    <p class="text-sm font-medium text-slate-900">{{ student.gender || student.student_profile?.gender || 'Not specified' }}</p>
                  </div>
                  <div>
                    <label class="block text-sm text-slate-500">Date of Birth</label>
                    <p class="text-sm font-medium text-slate-900">{{ student.date_of_birth || student.student_profile?.date_of_birth || 'Not specified' }}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 class="text-sm font-medium text-slate-700 mb-3">School Profile</h4>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm text-slate-500">Admission Number</label>
                    <p class="text-sm font-medium text-slate-900">{{ student.student_profile?.admission_number || 'Not specified' }}</p>
                  </div>
                  <div>
                    <label class="block text-sm text-slate-500">Class</label>
                    <p class="text-sm font-medium text-slate-900">{{ student.student_profile?.class_arm?.name || student.student_profile?.class_name || 'Not specified' }}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 class="text-sm font-medium text-slate-700 mb-3">Account Status</h4>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm text-slate-500">Student ID</label>
                    <p class="text-sm font-medium text-slate-900">{{ student.id }}</p>
                  </div>
                  <div>
                    <label class="block text-sm text-slate-500">Active</label>
                    <p class="text-sm font-medium text-slate-900">{{ student.is_active ? 'Yes' : 'No' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <form v-else class="space-y-4" @submit.prevent="submit">
              <FormField label="First Name" :error="errors.firstName">
                <input v-model="form.firstName" class="sa-input" placeholder="John" required />
              </FormField>
              
              <FormField label="Last Name" :error="errors.lastName">
                <input v-model="form.lastName" class="sa-input" placeholder="Doe" required />
              </FormField>
              
              <FormField label="Email" :error="errors.email">
                <input v-model="form.email" type="email" class="sa-input" placeholder="john.doe@example.com" required />
              </FormField>
              
              <FormField label="Phone" :error="errors.phone">
                <input v-model="form.phone" class="sa-input" placeholder="+1 (555) 123-4567" required />
              </FormField>

              <div class="grid grid-cols-2 gap-4">
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

              <FormField label="Admission Number" :error="errors.admission_number">
                <input v-model="form.admission_number" class="sa-input" placeholder="ADM001" required />
              </FormField>

              <div class="grid grid-cols-2 gap-4">
                <FormField label="Class Level" :error="errors.class_name">
                  <select v-model="form.class_level_id" class="sa-input" :disabled="loadingClassLevels">
                    <option value="">Select class level</option>
                    <option v-for="level in classLevels" :key="level.id" :value="level.id">
                      {{ level.name }}
                    </option>
                  </select>
                  <p v-if="loadingClassLevels" class="mt-1 text-xs text-slate-500">Loading class levels...</p>
                </FormField>

                <FormField label="Class Arm" :error="errors.class_name">
                  <select v-model="form.class_arm_id" class="sa-input" :disabled="!form.class_level_id || loadingClassArms">
                    <option value="">Select class arm</option>
                    <option v-for="arm in classArms" :key="arm.id" :value="arm.id">
                      {{ arm.name }}
                    </option>
                  </select>
                  <p v-if="loadingClassArms" class="mt-1 text-xs text-slate-500">Loading class arms...</p>
                  <p v-if="form.class_level_id && !loadingClassArms && classArms.length === 0" class="mt-1 text-xs text-slate-500">No arms available for this class level.</p>
                </FormField>
              </div>

              <div class="flex gap-2">
                <AppButton 
                  type="submit" 
                  :text="isEdit ? 'Update Student' : 'Create Student'" 
                  full-width 
                  variant="primary" 
                  :loadingText="isEdit ? 'Updating Student...' : 'Creating Student...'"
                  :processing="loading" 
                  :disabled="loading"
                />
                <AppButton type="button" text="Cancel" variant="outline" @click="$emit('close')" />
              </div>
            </form>
          </div>

          <div v-if="isView" class="mt-6 flex justify-end">
            <AppButton @click="$emit('close')" text="Close" variant="primary" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, computed, ref, onMounted } from 'vue'
import { X } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import FormField from './FormField.vue'
import { fetchClassLevels, fetchClassArms } from '../../../js/api/classManagement'

const props = defineProps({
  show: { type: Boolean, default: false },
  student: { type: Object, default: null },
  mode: { type: String, default: 'edit', validator: (value) => ['view', 'edit'].includes(value) }
})

const emit = defineEmits(['close', 'submit', 'submitted'])

const isEdit = computed(() => props.mode === 'edit' && !!props.student)
const isView = computed(() => props.mode === 'view')

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: '',
  date_of_birth: '',
  admission_number: '',
  class_level_id: '',
  class_arm_id: '',
  class_name: ''
})

const errors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: '',
  date_of_birth: '',
  admission_number: '',
  class_name: ''
})

const loading = ref(false)
const classLevels = ref([])
const classArms = ref([])
const loadingClassLevels = ref(false)
const loadingClassArms = ref(false)

const resetForm = () => {
  Object.assign(form, { firstName: '', lastName: '', email: '', phone: '', gender: '', date_of_birth: '', admission_number: '', class_level_id: '', class_arm_id: '', class_name: '' })
  Object.assign(errors, { firstName: '', lastName: '', email: '', phone: '', gender: '', date_of_birth: '', admission_number: '', class_name: '' })
}

const loadClassLevels = async () => {
  loadingClassLevels.value = true
  try {
    const data = await fetchClassLevels()
    classLevels.value = Array.isArray(data) ? data : (data?.class_levels || data?.data || [])
  } catch (error) {
    console.error('Failed to load class levels:', error)
    classLevels.value = []
  } finally {
    loadingClassLevels.value = false
  }
}

const loadClassArms = async (classLevelId) => {
  if (!classLevelId) {
    classArms.value = []
    return
  }

  loadingClassArms.value = true
  try {
    const data = await fetchClassArms(classLevelId)
    classArms.value = Array.isArray(data) ? data : (data?.arms || data?.class_arms || data?.data || [])
  } catch (error) {
    console.error('Failed to load class arms:', error)
    classArms.value = []
  } finally {
    loadingClassArms.value = false
  }
}

// Watch for student changes and update form
watch(() => props.student, (student) => {
  if (student) {
    form.firstName = student.user?.first_name || student.first_name || ''
    form.lastName = student.user?.last_name || student.last_name || ''
    form.email = student.user?.email || student.email || ''
    form.phone = student.user?.phone || student.phone || ''
    form.gender = student.gender || student.student_profile?.gender || ''
    form.date_of_birth = student.date_of_birth || student.student_profile?.date_of_birth || ''
    form.admission_number = student.student_profile?.admission_number || student.admission_number || ''
    form.class_level_id = student.student_profile?.class_level?.id || ''
    form.class_arm_id = student.student_profile?.class_arm?.id || ''
    form.class_name = student.student_profile?.class_arm?.name || student.student_profile?.class_name || student.class_name || ''
    
    // Load class arms if class level is set
    if (form.class_level_id) {
      loadClassArms(form.class_level_id)
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// Watch for modal close to reset loading state
watch(() => props.show, async (show) => {
  if (show) {
    // Load class levels when modal opens
    await loadClassLevels()
  } else {
    loading.value = false
    resetForm()
  }
})

// Watch class level changes to load arms
watch(() => form.class_level_id, (newClassLevelId) => {
  form.class_arm_id = '' // Reset class arm when class level changes
  loadClassArms(newClassLevelId)
})

const validate = () => {
  errors.firstName = form.firstName?.trim() ? '' : 'First name is required.'
  errors.lastName = form.lastName?.trim() ? '' : 'Last name is required.'
  errors.email = form.email?.trim() ? '' : 'Email is required.'
  errors.phone = form.phone?.trim() ? '' : 'Phone is required.'
  errors.admission_number = form.admission_number?.trim() ? '' : 'Admission number is required.'
  return !errors.firstName && !errors.lastName && !errors.email && !errors.phone && !errors.admission_number
}

const submit = async () => {
  if (!validate()) return

  loading.value = true

  try {
    const payload = {
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email,
      phone: form.phone,
      gender: form.gender || undefined,
      date_of_birth: form.date_of_birth || undefined,
      class_level_id: form.class_level_id || undefined,
      class_arm_id: form.class_arm_id || undefined,
      class_name: form.class_name
    }

    if (!props.student || form.admission_number !== (props.student.student_profile?.admission_number || props.student.admission_number || '')) {
      payload.admission_number = form.admission_number
    }

    emit('submit', {
      id: props.student?.id,
      ...payload
    })
  } catch (error) {
  } finally {
    // Keep loading state active until parent closes modal
  }
}
</script>
