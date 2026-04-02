<template>
  <div class="space-y-6">
    <SectionCard title="Subscription Plans" subtitle="Maintain pricing tiers, durations, and feature packaging for every tenant segment.">
      <template #header>
        <button type="button" class="inline-flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-4 py-2.5 font-medium text-white transition hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2" @click="createPlan">
          <Plus class="h-4 w-4" />
          <span>Add Plan</span>
        </button>
      </template>

      <div class="grid gap-6 xl:grid-cols-3">
        <article v-for="plan in plansStore.plans" :key="plan.id" class="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10">
          <div class="bg-gradient-to-br from-[#0B1F3A] to-[#163154] p-6 text-white">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm uppercase tracking-[0.22em] text-[#D4AF37]">{{ plan.duration }}</p>
                <h3 class="mt-2 text-2xl font-semibold">{{ plan.name }}</h3>
              </div>
              <div class="rounded-2xl bg-white/10 px-3 py-2 text-sm font-semibold text-[#D4AF37]">{{ plan.price }}</div>
            </div>
          </div>

          <div class="p-6">
            <ul class="space-y-3">
              <li v-for="feature in plan.features" :key="feature" class="flex items-start gap-3 text-sm text-slate-600">
                <Check class="mt-0.5 h-4 w-4 text-[#D4AF37]" />
                <span>{{ feature }}</span>
              </li>
            </ul>

            <div class="mt-6 flex gap-3">
              <button type="button" class="flex-1 rounded-2xl border-2 border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2" @click="editPlan(plan.name)">Edit</button>
              <button type="button" class="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100" @click="deleteExistingPlan(plan.id)">
                Delete
              </button>
            </div>
          </div>
        </article>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { Check, Plus } from 'lucide-vue-next'
import SectionCard from '../components/SectionCard.vue'
import { useSuperAdminPlansStore } from '../stores/plans'
import { useSuperAdminUiStore } from '../stores/ui'

const plansStore = useSuperAdminPlansStore()
const uiStore = useSuperAdminUiStore()

onMounted(() => {
  plansStore.fetchPlans()
})

const createPlan = async () => {
  await plansStore.createPlan()
  uiStore.addToast({
    title: 'Plan created',
    message: 'A new starter plan placeholder was added.',
    variant: 'success',
  })
}

const editPlan = (planName) => {
  uiStore.addToast({
    title: 'Edit plan',
    message: `${planName} is ready for modal or routed editing.`,
    variant: 'success',
  })
}

const deleteExistingPlan = async (planId) => {
  await plansStore.deletePlan(planId)
  uiStore.addToast({
    title: 'Plan removed',
    message: 'Subscription plan was removed from the catalog.',
    variant: 'success',
  })
}
</script>
