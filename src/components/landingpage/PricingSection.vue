<template>
  <section id="pricing" class="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-0 lg:py-20">
    <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-10">
      <div class="mx-auto max-w-4xl text-center">
        <h2 class="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">Simple, transparent pricing</h2>
        <p class="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">Plans that grow with your school.</p>

        <div class="mt-8 flex flex-wrap items-center justify-center gap-3 text-base">
          <span :class="isAnnual ? 'text-slate-400' : 'text-slate-800'" class="transition">Monthly</span>
          <button
            type="button"
            class="relative flex h-8 w-14 items-center rounded-full bg-slate-200 p-1 transition"
            @click="isAnnual = !isAnnual"
          >
            <span
              class="h-6 w-6 rounded-full bg-slate-800 transition-transform duration-300"
              :class="isAnnual ? 'translate-x-6' : 'translate-x-0'"
            ></span>
          </button>
          <span :class="isAnnual ? 'text-slate-800' : 'text-slate-400'" class="transition">Annually</span>
          <span class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-600">
            Save 20%
          </span>
        </div>
      </div>

      <div class="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="(plan, idx) in plans"
          :key="plan.id || plan.name || idx"
          :class="[
            'relative flex min-h-full flex-col rounded-2xl border p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md sm:p-6',
            idx === 1
              ? 'border-[#D4AF37] bg-amber-50 shadow-lg border-2'
              : 'bg-white border-slate-200'
          ]"
        >
          <div
            v-if="idx === 1"
            class="absolute left-1/2 top-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800 px-4 py-1 text-sm font-semibold text-amber-400"
          >
            Most Popular
          </div>

          <div>
            <h3 class="text-2xl font-bold tracking-tight text-slate-800">{{ plan.name }}</h3>
            <p class="mt-2 text-base text-slate-500">{{ plan.range }}</p>
          </div>

          <div class="mt-8">
            <div class="flex items-end gap-2">
              <span class="text-2xl font-bold tracking-tight text-slate-800">
                {{ displayPrice(plan) }}
              </span>
              <span class="pb-1 text-lg text-slate-500">/{{ isAnnual ? 'yr' : 'mo' }}</span>
            </div>
            <p class="mt-2 text-base font-medium text-emerald-600">
              {{ isAnnual ? 'Billed annually' : 'Billed monthly' }}
            </p>
          </div>

          <div class="mt-6 grid gap-2 text-sm text-slate-600">
            <div class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span>Students</span>
              <span class="font-semibold text-slate-800">{{ plan.max_students ? `Up to ${plan.max_students}` : 'Unlimited' }}</span>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span>Teachers</span>
              <span class="font-semibold text-slate-800">{{ plan.max_teachers ? `Up to ${plan.max_teachers}` : 'Unlimited' }}</span>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span>Exams / term</span>
              <span class="font-semibold text-slate-800">{{ plan.max_exams_per_term ? `Up to ${plan.max_exams_per_term}` : 'Unlimited' }}</span>
            </div>
          </div>

          <ul class="mt-8 flex-1 space-y-4">
            <li
              v-for="feature in plan.features"
              :key="feature"
              class="flex items-start gap-3 text-base text-slate-700"
            >
              <span class="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-amber-500 flex-shrink-0">
                <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clip-rule="evenodd"/></svg>
              </span>
              <span class="break-words">{{ feature }}</span>
            </li>
          </ul>

          <button
            type="button"
            @click="goToOnboarding(plan)"
            :class="[
              'mt-10 min-h-[44px] w-full cursor-pointer rounded-xl px-5 py-4 text-base font-semibold shadow-sm transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2',
              idx === 1
                ? 'bg-[#D4AF37] text-white hover:bg-[#B8941F] focus:ring-[#D4AF37]'
                : 'border-2 border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus:ring-[#D4AF37]'
            ]"
          >
            Start Free Trial
          </button>
        </article>
      </div>

      <div class="mt-10 flex items-center justify-center gap-3 text-base text-slate-500">
        <span>30-day free trial. You will be requested for your card details only after your 30-day free trial is over.</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchPlans } from '../onboardingpage/api/plans'
import { normalizePlanFeatures, storeSelectedPlan } from '../../js/lib/plans'

const plans = ref([])
const isAnnual = ref(false)

const formatPrice = (price) => {
  if (price == null || price === '') return 'Custom'
  const rounded = Math.round(Number(price))
  return `₦${rounded.toLocaleString('en-US')}`
}

const displayPrice = (plan) => {
  if (!plan) return 'Custom'
  const price = isAnnual.value ? plan.price_yearly : plan.price_monthly
  if (!price) return 'Custom'
  return formatPrice(price)
}

const goToOnboarding = (plan) => {
  const billingCycle = isAnnual.value ? 'yearly' : 'monthly'

  // Persist the selected plan (tier + billing cycle) so the onboarding
  // "Choose Plan" step can preselect the exact same variant once it loads
  // (navigation below is a full page load, so Pinia state would be lost -
  // sessionStorage survives it).
  storeSelectedPlan(plan, billingCycle)

  // navigate to onboarding with the plan slug and billing cycle as query
  // params (sessionStorage is the primary source of truth; the query
  // string is a fallback in case storage gets cleared along the way).
  const url = `/onboarding?plan=${plan.slug || plan.id}&billing=${billingCycle}`
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
          price_monthly: p.price_monthly ?? null,
          price_yearly: p.price_yearly ?? null,
          max_students: p.max_students ?? null,
          max_teachers: p.max_teachers ?? null,
          max_exams_per_term: p.max_exams_per_term ?? null,
          features: normalizePlanFeatures(p.features),
        }))
      : []
  } catch (err) {
    console.error('Error fetching plans:', err)
    plans.value = []
  }
})
</script>

