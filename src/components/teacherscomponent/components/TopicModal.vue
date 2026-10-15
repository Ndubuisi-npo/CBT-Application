<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-2xl max-h-[90vh] transform overflow-y-auto rounded-lg bg-white shadow-xl transition-all">
      <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-6 h-full flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900">{{ isEdit ? 'Edit Topic' : 'Create Topic' }}</h3>
          <AppButton @click="$emit('close')" :icon="X" variant="ghost" class="text-slate-400 hover:text-slate-600" />
        </div>
        
        <div class="flex-1 overflow-y-auto">
          <form class="space-y-6" @submit.prevent="submit">
            <!-- Topic Name -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Topic Name</label>
              <input 
                v-model="form.name" 
                type="text" 
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Enter topic name"
                required 
              />
            </div>

            <!-- Subject Selection -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Subject</label>
              <select 
                v-model="form.subject_id" 
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                required 
              >
                <option value="">Select Subject</option>
                <option value="d637006d-929a-4a0b-adcd-cc5eb46f8738">Mathematics</option>
                <option value="d637006d-929a-4a0b-adcd-cc5eb46f8739">English</option>
                <option value="d637006d-929a-4a0b-adcd-cc5eb46f8740">Physics</option>
                <option value="d637006d-929a-4a0b-adcd-cc5eb46f8741">Chemistry</option>
                <option value="d637006d-929a-4a0b-adcd-cc5eb46f8742">Biology</option>
              </select>
            </div>

            <!-- Class Level Selection -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Class Level</label>
              <select 
                v-model="form.class_level_id" 
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                required 
              >
                <option value="">Select Class Level</option>
                <option value="019d9770-2da8-724e-b606-be821a38ac2f">JSS 1</option>
                <option value="019d9770-2da8-724e-b606-be821a38ac30">JSS 2</option>
                <option value="019d9770-2da8-724e-b606-be821a38ac31">JSS 3</option>
                <option value="019d9770-2da8-724e-b606-be821a38ac2f">SS 1</option>
                <option value="019d9770-2da8-724e-b606-be821a38ac32">SS 2</option>
                <option value="019d9770-2da8-724e-b606-be821a38ac33">SS 3</option>
              </select>
            </div>

            <!-- Parent Topic (Optional) -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Parent Topic (Optional)</label>
              <select 
                v-model="form.parent_id" 
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Parent (Root Topic)</option>
                <option v-for="topic in availableTopics" :key="topic.id" :value="topic.id">
                  {{ topic.name }}
                </option>
              </select>
            </div>

            <!-- Order -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Order</label>
              <input 
                v-model="form.order" 
                type="number" 
                min="0"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Display order (optional)"
              />
            </div>

            <!-- Form Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <AppButton 
                @click="$emit('close')" 
                text="Cancel" 
                variant="outline" 
                :disabled="loading" 
              />
              <AppButton 
                type="submit" 
                text="Save Topic" 
                variant="primary" 
                :processing="loading" 
                :disabled="loading"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { X } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'

const props = defineProps({
  show: { type: Boolean, required: true },
  topic: { type: Object, default: null },
  availableTopics: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'submit'])
const loading = ref(false)

const isEdit = computed(() => !!props.topic)

const form = reactive({
  name: '',
  subject_id: '',
  class_level_id: '',
  parent_id: '',
  order: 0
})

// Initialize form when topic prop changes
watch(() => props.topic, (newTopic) => {
  if (newTopic) {
    form.name = newTopic.name || ''
    form.subject_id = newTopic.subject_id || ''
    form.class_level_id = newTopic.class_level_id || ''
    form.parent_id = newTopic.parent_id || ''
    form.order = newTopic.order || 0
  } else {
    // Reset form for new topic creation
    form.name = ''
    form.subject_id = ''
    form.class_level_id = ''
    form.parent_id = ''
    form.order = 0
  }
}, { immediate: true })

const resetForm = () => {
  form.name = ''
  form.subject_id = ''
  form.class_level_id = ''
  form.parent_id = ''
  form.order = 0
}

const validate = () => {
  if (!form.name?.trim()) {
    return false
  }
  if (!form.subject_id) {
    return false
  }
  if (!form.class_level_id) {
    return false
  }
  return true
}

const submit = async () => {
  if (!validate()) {
    return
  }

  loading.value = true

  try {
    const payload = {
      name: form.name.trim(),
      subject_id: form.subject_id,
      class_level_id: form.class_level_id,
      parent_id: form.parent_id || null,
      order: parseInt(form.order) || 0
    }

    emit('submit', {
      id: props.topic?.id,
      ...payload
    })
  } catch (error) {
    console.error('Failed to save topic:', error)
  } finally {
    loading.value = false
  }
}
</script>
