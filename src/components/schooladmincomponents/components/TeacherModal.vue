<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="fixed inset-0 bg-black opacity-25" @click="$emit('close')"></div>
      
      <div class="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-900">{{ isView ? 'Teacher Details' : (isEdit ? 'Edit Teacher' : 'Create Teacher') }}</h3>
          <AppButton @click="$emit('close')" :icon="X" variant="ghost" class="text-slate-400 hover:text-slate-600" />
        </div>
        
        <div v-if="isView && teacher" class="space-y-6">
          <!-- Basic Information -->
          <div>
            <h4 class="text-sm font-medium text-slate-700 mb-3">Basic Information</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-slate-500">Staff ID</label>
                <p class="text-sm font-medium text-slate-900">{{ teacher.teacherProfile?.staff_id || teacher.teacher_profile?.staff_id || teacher.staff_id || 'Not specified' }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">First Name</label>
                <p class="text-sm font-medium text-slate-900">{{ teacher.first_name || 'Not specified' }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">Last Name</label>
                <p class="text-sm font-medium text-slate-900">{{ teacher.last_name || 'Not specified' }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">Qualification</label>
                <p class="text-sm font-medium text-slate-900">{{ teacher.teacherProfile?.qualification || teacher.teacher_profile?.qualification || teacher.qualification || 'Not specified' }}</p>
              </div>
            </div>

            <!-- Assigned Classes (under Basic Information) -->
            <div class="mt-4">
              <label class="block text-sm text-slate-500">Assigned Classes</label>
                <div class="mt-2">
                  <div v-if="assignedClasses.length">
                    <ul class="space-y-2">
                      <li v-for="cls in assignedClasses" :key="cls.id" class="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                        <div class="font-semibold text-slate-900">{{ cls.name }}</div>
                        <div class="text-xs text-slate-500">{{ cls.student_count ? cls.student_count + ' students' : (cls.studentCount ? cls.studentCount + ' students' : '') }}</div>
                      </li>
                    </ul>
                  </div>
                  <p v-else class="text-sm text-slate-600">No assigned classes</p>
                </div>
            </div>

            <div class="mt-4">
              <label class="block text-sm text-slate-500">Assigned Subjects</label>
              <div class="mt-2">
                <div v-if="assignedSubjects.length">
                  <ul class="space-y-2">
                    <li v-for="subject in assignedSubjects" :key="subject.id || subject.name" class="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                      <div class="font-semibold text-slate-900">{{ subject.name }}</div>
                      <div v-if="subject.meta" class="text-xs text-slate-500">{{ subject.meta }}</div>
                    </li>
                  </ul>
                </div>
                <p v-else class="text-sm text-slate-600">No assigned subjects</p>
              </div>
            </div>
          </div>
          
          <!-- Contact Information -->
          <div>
            <h4 class="text-sm font-medium text-slate-700 mb-3">Contact Information</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-slate-500">Email</label>
                <p class="text-sm font-medium text-slate-900">{{ teacher.email || 'Not provided' }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">Phone</label>
                <p class="text-sm font-medium text-slate-900">{{ teacher.phone || 'Not provided' }}</p>
              </div>
            </div>
          </div>
          
          <!-- System Information -->
          <div>
            <h4 class="text-sm font-medium text-slate-700 mb-3">System Information</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-slate-500">Teacher ID</label>
                <p class="text-sm font-medium text-slate-900">{{ teacher.id }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">Status</label>
                <p class="text-sm font-medium text-slate-900">Active</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Edit/Create Form -->
        <div v-else class="space-y-4">
          <form @submit.prevent="submit">
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
          
          <FormField label="Staff ID" :error="errors.staff_id">
            <input v-model="form.staff_id" class="sa-input" placeholder="STF001" required />
          </FormField>
          
          <FormField label="Qualification" :error="errors.qualification">
            <input v-model="form.qualification" class="sa-input" placeholder="B.Sc. Mathematics" required />
          </FormField>

          <div class="flex gap-2">
            <AppButton 
              type="submit" 
              :text="isEdit ? 'Update Teacher' : 'Create Teacher'" 
              full-width 
              variant="primary" 
              :loadingText="isEdit ? 'Updating Teacher...' : 'Creating Teacher...'"
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
</template>

<script setup>
import { reactive, watch, computed, ref } from 'vue'
import { X } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import FormField from './FormField.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  teacher: { type: Object, default: null },
  mode: { type: String, default: 'edit', validator: (value) => ['view', 'edit'].includes(value) }
})

const emit = defineEmits(['close', 'submit', 'submitted'])

const isEdit = computed(() => props.mode === 'edit' && !!props.teacher)
const isView = computed(() => props.mode === 'view')

const assignedSubjects = computed(() => {
  const subjectsSrc = props.teacher?.assigned_subjects || props.teacher?.assignedSubjects || props.teacher?.teacherAssignments || props.teacher?.assignments || []

  return subjectsSrc.map((item) => {
    const source = item?.subject && typeof item.subject === 'object' ? item.subject : item
    const name = source?.name || source?.title || item?.subject_name || 'Unnamed subject'
    const code = source?.code || item?.subject_code || ''
    const className = item?.class_level?.name || item?.class?.name || item?.class_name || ''

    return {
      id: source?.id || item?.subject_id || item?.id || name,
      name,
      meta: [code, className].filter(Boolean).join(' - '),
    }
  })
})

const assignedClasses = computed(() => {
  const direct = props.teacher?.assigned_classes || props.teacher?.assignedClasses || []
  const fromAssignments = (props.teacher?.teacherAssignments || props.teacher?.assignments || []).map(a => a.class_level || a.class || a)

  const combined = [...direct, ...fromAssignments].filter(Boolean)

  // normalize and dedupe by id or name
  const seen = new Map()
  combined.forEach((c) => {
    const id = c?.id || c?.class_level_id || c?.class_id || c?.name || JSON.stringify(c)
    if (!seen.has(id)) {
      seen.set(id, {
        id,
        name: c?.name || c?.class_name || c?.title || 'Unnamed class',
        student_count: c?.student_count || c?.studentCount || 0,
      })
    }
  })

  return Array.from(seen.values())
})

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  qualification: '',
  staff_id: ''
})

const errors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  qualification: '',
  staff_id: ''
})

const loading = ref(false)

const resetForm = () => {
  Object.assign(form, { firstName: '', lastName: '', email: '', phone: '', qualification: '', staff_id: '' })
  Object.assign(errors, { firstName: '', lastName: '', email: '', phone: '', qualification: '', staff_id: '' })
}

// Watch for teacher changes and update form
watch(() => props.teacher, (teacher) => {
  if (teacher) {
    // Try multiple possible paths for the data
    form.firstName = teacher.user?.first_name || teacher.first_name || ''
    form.lastName = teacher.user?.last_name || teacher.last_name || ''
    form.email = teacher.user?.email || teacher.email || ''
    form.phone = teacher.user?.phone || teacher.phone || ''
    form.qualification = teacher.teacherProfile?.qualification || teacher.teacher_profile?.qualification || teacher.qualification || ''
    form.staff_id = teacher.teacherProfile?.staff_id || teacher.teacher_profile?.staff_id || teacher.staff_id || ''
  } else {
    resetForm()
  }
}, { immediate: true })

// Watch for modal close to reset loading state
watch(() => props.show, (show) => {
  if (!show) {
    loading.value = false
    resetForm()
  }
})

const validate = () => {
  errors.firstName = form.firstName?.trim() ? '' : 'First name is required.'
  errors.lastName = form.lastName?.trim() ? '' : 'Last name is required.'
  errors.email = form.email?.trim() ? '' : 'Email is required.'
  errors.phone = form.phone?.trim() ? '' : 'Phone is required.'
  errors.qualification = form.qualification?.trim() ? '' : 'Qualification is required.'
  errors.staff_id = form.staff_id?.trim() ? '' : 'Staff ID is required.'
  return !errors.firstName && !errors.lastName && !errors.email && !errors.phone && !errors.qualification && !errors.staff_id
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
      qualification: form.qualification,
      staff_id: form.staff_id
    }
    
    emit('submit', {
      id: props.teacher?.id,
      ...payload
    })
    
    // Don't reset form or close here - let parent handle after toast
  } catch (error) {
  } finally {
    loading.value = false
  }
}
</script>
