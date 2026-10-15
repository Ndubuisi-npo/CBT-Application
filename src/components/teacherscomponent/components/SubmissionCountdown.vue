<template>
  <div
    class="inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium"
    :class="toneClass"
  >
    <Clock class="h-4 w-4 shrink-0" />
    <span v-if="expired">Submission window closed</span>
    <span v-else>Closes in {{ formatted }}</span>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Clock } from 'lucide-vue-next'

const props = defineProps({
  // ISO datetime string the submission window closes at.
  deadline: { type: [String, Number, Date], default: null },
})

const emit = defineEmits(['expired'])

const remaining = ref(0) // seconds
const expired = ref(false)
let timerEnd = 0
let intervalId = null

const pad = (value) => String(Math.floor(value)).padStart(2, '0')

const formatted = computed(() => {
  const total = Math.max(0, remaining.value)
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = Math.floor(total % 60)
  if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
  return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
})

const toneClass = computed(() => {
  if (expired.value) return 'border-slate-200 bg-slate-100 text-slate-500'
  if (remaining.value <= 60) return 'border-rose-200 bg-rose-50 text-rose-700'
  if (remaining.value <= 300) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
})

const tick = () => {
  // Recompute from an absolute anchor each tick so the countdown stays
  // accurate even if the tab is backgrounded (drift-proof pattern).
  remaining.value = Math.max(0, (timerEnd - Date.now()) / 1000)
  if (remaining.value <= 0) {
    remaining.value = 0
    if (!expired.value) {
      expired.value = true
      emit('expired')
    }
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }
}

const start = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  const when = props.deadline ? new Date(props.deadline).getTime() : NaN
  if (Number.isNaN(when)) {
    expired.value = false
    remaining.value = 0
    return
  }
  timerEnd = when
  expired.value = false
  tick()
  if (!expired.value) {
    intervalId = setInterval(tick, 1000)
  }
}

onMounted(start)
onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>
