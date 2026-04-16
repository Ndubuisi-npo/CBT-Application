<template>
  <span
    class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
    :class="getStatusClass(status)"
  >
    {{ getStatusText(status) }}
  </span>
</template>

<script setup>
const props = defineProps({
  status: {
    type: String,
    default: 'Active',
  },
})

const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    case 'suspended':
      return 'bg-red-50 text-red-700 ring-1 ring-red-200'
    case 'trial':
      return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
    case 'expired':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
    case 'not active':
      return 'bg-slate-50 text-slate-700 ring-1 ring-slate-200'
    default:
      return 'bg-slate-50 text-slate-700 ring-1 ring-slate-200'
  }
}

const getStatusText = (status) => {
  if (!status) return 'Unknown'
  
  // Capitalize first letter of each word
  return status.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}
</script>
