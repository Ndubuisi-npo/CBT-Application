<template>
  <div class="min-h-screen bg-[#f6f7fb] px-6 pb-16 pt-28 text-slate-900 md:px-20">
    <div class="mx-auto max-w-6xl">
      <RouterLink to="/" class="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        ← Back to Home
      </RouterLink>

      <div class="mt-10 rounded-[32px] bg-white p-10 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <div class="text-center">
          <p class="text-sm uppercase tracking-[0.28em] text-amber-500">Pricing</p>
          <h1 class="mt-3 text-4xl font-black tracking-tight text-slate-900">Affordable plans built for schools</h1>
          <p class="mt-4 text-lg leading-relaxed text-slate-600">
            Choose the best plan for your institution. Pricing is shown in Nigerian Naira and charged per student.
          </p>
        </div>

        <div class="mt-12 grid gap-6 lg:grid-cols-3">
          <article
            v-for="plan in plans"
            :key="plan.id || plan.name"
            class="rounded-[28px] border border-slate-200 bg-slate-50 p-8 shadow-sm"
          >
            <div class="flex items-center justify-between gap-4">
              <div>
                <h2 class="text-2xl font-semibold text-slate-900">{{ plan.name }}</h2>
                <p class="mt-2 text-sm text-slate-500">{{ plan.range }}</p>
              </div>
              <span class="rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Per student</span>
            </div>

            <div class="mt-8">
              <p class="text-5xl font-black tracking-tight text-slate-900">{{ formatPrice(plan.price) }}</p>
              <p class="mt-2 text-sm text-slate-500">{{ billingLabel }}</p>
            </div>

            <ul class="mt-8 space-y-3 text-slate-700">
              <li v-for="feature in plan.features" :key="feature" class="flex items-start gap-3">
                <span class="mt-1 h-2.5 w-2.5 rounded-full bg-slate-900"></span>
                <span>{{ feature }}</span>
              </li>
            </ul>

            <button
              type="button"
              class="mt-8 w-full rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Choose {{ plan.name }}
            </button>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchPlans } from '../onboardingpage/api/plans'

const plans = ref([])
const loading = ref(true)
const errorMessage = ref('')

const formatPrice = (price) => {
  if (price == null || price === '') return 'N/A'
  const rounded = Math.round(Number(price))
  return `₦${rounded.toLocaleString('en-NG')}`
}

const billingLabel = computed(() => 'per student / month')

onMounted(async () => {
  try {
    const apiPlans = await fetchPlans()
    plans.value = Array.isArray(apiPlans)
      ? apiPlans.map((plan: any) => ({
          id: plan.id,
          name: plan.name || 'Plan',
          range: plan.max_students ? `Up to ${plan.max_students} students` : 'Unlimited students',
          price: plan.price_monthly ?? plan.price ?? null,
          features: Array.isArray(plan.features) ? plan.features : [],
        }))
      : []
  } catch (err) {
    errorMessage.value = err?.message || 'Unable to load pricing plans.'
  } finally {
    loading.value = false
  }
})
</script>
