<template>
  <div class="space-y-6">
    <SectionCard title="Subscription Plans" subtitle="View available subscription plans for tenant provisioning.">
      <div v-if="loading" class="grid gap-6 xl:grid-cols-3">
        <div v-for="_ in 3" :key="_" class="h-96 rounded-3xl bg-slate-200 animate-pulse"></div>
      </div>

      <div v-else class="grid gap-6 xl:grid-cols-3">
        <article v-for="plan in plans" :key="plan.id" class="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10">
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
          </div>
        </article>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { Check } from 'lucide-vue-next'
import SectionCard from '../components/SectionCard.vue'
import { useSuperAdminPlans } from '../composables/useSuperAdminPlans'

const { fetchPlans, plans, loading } = useSuperAdminPlans()

onMounted(() => {
  fetchPlans()
})
</script>
