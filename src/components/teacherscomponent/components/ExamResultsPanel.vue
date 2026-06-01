<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
    <div class="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
      <div class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Results</p>
          <h2 class="mt-1 text-xl font-semibold text-slate-900">{{ exam.title }}</h2>
          <p class="mt-1 text-sm text-slate-500">{{ results.length }} results loaded</p>
        </div>
        <div class="flex items-center gap-2">
          <AppButton
            v-if="canPublish"
            text="Publish Results"
            variant="primary"
            size="sm"
            :processing="publishing"
            @click="publishResults"
          />
          <button type="button" class="p-2 text-slate-400 hover:text-slate-600" @click="$emit('close')">✕</button>
        </div>
      </div>

      <div class="p-6">
        <div v-if="loading" class="space-y-3">
          <div v-for="i in 5" :key="i" class="h-14 animate-pulse rounded-xl bg-slate-100" />
        </div>

        <div v-else-if="!results.length" class="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No results available yet.
        </div>

        <div v-else class="overflow-hidden rounded-[20px] border border-slate-200">
          <table class="min-w-full divide-y divide-slate-100 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Student</th>
                <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Score</th>
                <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">%</th>
                <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Grade</th>
                <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="result in results" :key="result.id" class="hover:bg-slate-50/80">
                <td class="px-5 py-4">
                  <p class="font-semibold text-slate-900">{{ result.student_name || result.student?.name || '—' }}</p>
                </td>
                <td class="px-5 py-4 text-sm text-slate-700">{{ result.score ?? '—' }} / {{ result.total_marks ?? '—' }}</td>
                <td class="px-5 py-4 text-sm font-semibold" :class="pctClass(result.percentage)">
                  {{ result.percentage != null ? `${result.percentage}%` : '—' }}
                </td>
                <td class="px-5 py-4">
                  <span class="rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700">
                    {{ result.grade || '—' }}
                  </span>
                </td>
                <td class="px-5 py-4 text-sm text-slate-500">{{ result.status || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppButton from '../../shared/AppButton.vue'
import { useTeacherExamsStore } from '../stores/exams'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'

const props = defineProps({ exam: { type: Object, required: true } })
defineEmits(['close'])

const store = useTeacherExamsStore()
const uiStore = useSchoolAdminUiStore()

const results = ref([])
const loading = ref(false)
const publishing = ref(false)

const canPublish = computed(() =>
  ['grading', 'completed', 'active'].includes((props.exam.status || '').toLowerCase()),
)

const pctClass = (pct) => {
  if (pct == null) return 'text-slate-700'
  if (pct >= 70) return 'text-emerald-600'
  if (pct >= 50) return 'text-amber-600'
  return 'text-rose-600'
}

onMounted(async () => {
  loading.value = true
  try {
    results.value = await store.fetchResults(props.exam.id)
  } catch (err) {
    uiStore.addToast({ title: 'Error', message: err.message, variant: 'error' })
  } finally {
    loading.value = false
  }
})

const publishResults = async () => {
  publishing.value = true
  try {
    await store.publishExam(props.exam.id)
    uiStore.addToast({
      title: 'Results published!',
      message: 'Students can now view their scores.',
      variant: 'success',
    })
  } catch (err) {
    uiStore.addToast({ title: 'Error', message: err.message, variant: 'error' })
  } finally {
    publishing.value = false
  }
}
</script>
