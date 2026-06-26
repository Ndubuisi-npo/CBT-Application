<template>
  <AppBadge :label="label" :variant="variant" dot />
</template>

<script setup>
import { computed } from 'vue'
import AppBadge from '../../shared/AppBadge.vue'

const props = defineProps({
  status: { type: String, default: '' },
})

const label = computed(() => {
  const s = (props.status || '').toLowerCase()
  const map = {
    current: 'Current', active: 'Active', live: 'Live',
    draft: 'Draft', submitted: 'Submitted', concluded: 'Concluded',
    completed: 'Completed', published: 'Published', pending: 'Pending',
    rejected: 'Rejected', archived: 'Archived', inactive: 'Inactive',
    'not current': 'Not Current',
  }
  return map[s] || props.status || '—'
})

const variant = computed(() => {
  const s = (props.status || '').toLowerCase()
  if (['current', 'active', 'live', 'published'].includes(s)) return 'success'
  if (['draft', 'not current', 'pending'].includes(s)) return 'warning'
  if (['submitted'].includes(s)) return 'info'
  if (['concluded', 'completed'].includes(s)) return 'purple'
  if (['rejected', 'inactive', 'archived'].includes(s)) return 'danger'
  return 'default'
})
</script>
