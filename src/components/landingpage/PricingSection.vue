<template>
  <section id="pricing" class="mx-auto max-w-6xl py-16 px-6 lg:px-0">
    <div class="text-center">
      <h2 class="text-4xl font-extrabold text-slate-900">Simple, transparent pricing</h2>
      <p class="mt-3 text-lg text-slate-600">Plans that grow with your school. See full pricing during onboarding.</p>
    </div>

    <div class="mt-10 grid gap-6 lg:grid-cols-3">
      <article
        v-for="(plan, idx) in plans"
        :key="plan.id || plan.name || idx"
        :class="cardClass(idx) + ' rounded-2xl border p-8 shadow-sm transition'"
      >
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">{{ plan.name }}</h3>
            <p class="mt-1 text-sm text-slate-500">{{ plan.range }}</p>
          </div>
          <div v-if="plan.badge" class="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{{ plan.badge }}</div>
        </div>

        <div class="mt-6">
          <p :class="priceClass(idx)">{{ formatPrice(plan.price) }}<span class="text-base font-medium text-slate-500">/mo</span></p>
        </div>

        <ul class="mt-6 space-y-3 text-slate-700">
          <li v-for="(feature, fidx) in plan.features" :key="fidx" class="flex items-start gap-3">
            <svg class="mt-1 h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clip-rule="evenodd"/></svg>
            <span>{{ feature }}</span>
          </li>
        </ul>

        <button type="button" class="mt-6 w-full rounded-2xl px-4 py-3 font-semibold" :class="buttonClass(idx)" @click="goToOnboarding(plan)">
          Start Free Trial
        </button>
      </article>
    </div>

    <p class="mt-8 text-center text-sm text-slate-500">Not sure? Choose any plan — start a free trial. <span class="font-semibold text-amber-600">Cancel Anytime</span></p>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchPlans } from '../onboardingpage/api/plans'

const plans = ref([])

const formatPrice = (price) => {
  if (price == null || price === '') return 'N/A'
  const rounded = Math.round(Number(price))
  return `₦${rounded.toLocaleString('en-NG')}`
}

const featureLabelMap = {
  cbt_exams: 'Auto-gradable CBT exams',
  api_access: 'API access & integrations',
  custom_branding: 'Custom branding',
  priority_support: 'Priority support',
  multi_campus: 'Multi-campus support',
}

const featuresFromObject = (obj) => {
  if (!obj || typeof obj !== 'object') return []
  return Object.keys(obj)
    .filter((k) => obj[k])
    .map((k) => featureLabelMap[k] || k.replace(/_/g, ' '))
}


const cardClass = (idx) => {
  // highlight center card with gold accent
  return idx === 1
    ? 'border-amber-200 bg-amber-50/20 text-slate-900'
    : 'border-slate-200 bg-white text-slate-700'
}

const priceClass = (idx) => (idx === 1 ? 'text-4xl font-extrabold text-[#0B1F3A]' : 'text-3xl font-extrabold text-slate-900')

const buttonClass = (idx) => (idx === 1 ? 'bg-[#D4AF37] text-white hover:brightness-95' : 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50')

const goToOnboarding = (plan) => {
  // navigate to onboarding with optional plan slug as query
  const url = `/onboarding?plan=${plan.slug || plan.id}`
  window.location.href = url
}

onMounted(async () => {
  try {
    const apiPlans = await fetchPlans()
    plans.value = Array.isArray(apiPlans)
      ? apiPlans.map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name || 'Plan',
          range: p.max_students ? `Up to ${p.max_students} students` : 'Unlimited students',
          price: p.price_monthly ?? p.price ?? null,
          features: Array.isArray(p.features) ? p.features : featuresFromObject(p.features),
          badge: p.popular ? 'Most Popular' : '',
        }))
      : []
  } catch (err) {
    plans.value = []
  }
})
</script>

<style scoped>
.price-highlight {
  color: #0b1f3a;
}
</style>
