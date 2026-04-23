<template>
  <div class="mt-10 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-10">
    <div class="mx-auto max-w-4xl text-center">
      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-500 shadow-sm">
        <Sparkles class="h-6 w-6" />
      </div>

      <h1 class="mt-8 text-4xl font-bold tracking-tight text-slate-800">
        Choose Your Plan
      </h1>

      <p class="mt-5 text-lg leading-relaxed text-slate-600">
        Based on your school setup, we recommend the
        <span class="font-semibold text-slate-800">{{ recommendedPlan?.name || '...' }}</span>
        plan.
      </p>

      <div class="mt-8 flex items-center justify-center gap-3 text-base">
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

    <div class="mt-12 grid grid-cols-1 gap-5 xl:grid-cols-4">
      <!-- Loading state -->
      <div v-if="loading" class="col-span-full flex items-center justify-center py-12">
        <div class="text-center">
          <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800"></div>
          <p class="mt-4 text-slate-600">Loading plans...</p>
        </div>
      </div>
      
      <!-- Plans -->
      <article
        v-else
        v-for="plan in plans"
        :key="plan.id || plan.name"
        :class="[
          'relative flex h-full flex-col rounded-2xl border p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md',
          plan.id === props.formData.plan_id 
            ? 'border-[#D4AF37] bg-amber-50 shadow-lg border-2' 
            : plan.name === recommendedPlan?.name 
              ? 'border-slate-300 bg-slate-50 shadow-md' 
              : 'bg-white border-slate-200'
        ]"
      >
        <div
          v-if="plan.name === recommendedPlan?.name"
          class="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800 px-4 py-1 text-sm font-semibold text-amber-400"
        >
          Recommended
        </div>

        <h2 class="text-2xl font-bold tracking-tight text-slate-800">
          {{ plan.name }}
        </h2>
        <p class="mt-2 text-base text-slate-500">{{ plan.range }}</p>

        <div class="mt-8">
          <template v-if="plan.price">
            <div class="flex items-end gap-2">
              <span class="text-2xl font-bold tracking-tight text-slate-800">
                {{ displayedPrice(plan.price) }}
              </span>
              <span class="pb-1 text-lg text-slate-500">/mo</span>
            </div>
            <p class="mt-2 text-base font-medium text-emerald-600">
              {{ isAnnual ? 'Billed annually' : 'Billed monthly' }}
            </p>
          </template>

          <template v-else>
            <div class="text-2xl font-bold tracking-tight text-slate-800">Custom</div>
          </template>
        </div>

        <ul class="mt-8 flex-1 space-y-4">
          <li
            v-for="feature in plan.features"
            :key="feature"
            class="flex items-start gap-3 text-base text-slate-700"
          >
            <span class="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <Check class="h-3.5 w-3.5" />
            </span>
            <span>{{ feature }}</span>
          </li>
        </ul>

        <button
          type="button"
          @click="selectPlan(plan)"
          :class="[
            'cursor-pointer mt-10 w-full rounded-xl px-5 py-4 text-base font-semibold shadow-sm transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2',
            plan.id === props.formData.plan_id
              ? 'bg-[#D4AF37] text-white hover:bg-[#B8941F] focus:ring-[#D4AF37]'
              : plan.name === recommendedPlan?.name
                ? 'bg-[#0B1F3A] text-white hover:bg-[#0F2940] focus:ring-[#D4AF37]'
                : 'border-2 border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus:ring-[#D4AF37]'
          ]"
        >
          {{ plan.id === props.formData.plan_id ? 'Selected' : plan.name === recommendedPlan?.name ? 'Select Recommended' : 'Select Plan' }}
        </button>
      </article>
    </div>

    <div class="mt-10 flex items-center justify-center gap-3 text-base text-slate-500">
      <ShieldCheck class="h-5 w-5 text-amber-500" />
      <span>30-day free trial. You will be requested for your card details only after your 30-day free trial is over.</span>
    </div>

    <div class="mt-8 flex justify-between">
      <button
        type="button"
        class="inline-flex items-center gap-3 rounded-xl border-2 border-[#0B1F3A] bg-white px-7 py-3 text-base font-medium text-[#0B1F3A] shadow-sm transition duration-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2"
        @click="emit('back')"
      >
        Back
      </button>

      <button
        type="button"
        @click="emit('continue')"
        :disabled="!props.formData.plan_id"
        class="inline-flex items-center gap-3 rounded-xl bg-[#0B1F3A] px-7 py-3 text-base font-semibold text-white shadow-lg shadow-[#0B1F3A]/10 transition duration-300 hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ props.formData.plan_id ? 'Continue' : 'Select a Plan First' }}
        <ArrowRight class="h-5 w-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowRight, Check, ShieldCheck, Sparkles } from 'lucide-vue-next'
import { fetchPlans } from '../superadmincomponent/api/plans'

const props = defineProps<{
  formData: {
    subjectCount: string
    plan_id: string
  }
}>()

const emit = defineEmits<{
  back: []
  continue: []
}>()

const isAnnual = ref(true)
const plans = ref([])
const loading = ref(true)

// Transform API plan data to match the expected format
const transformPlans = (apiPlans) => {
  return apiPlans.map(plan => ({
    name: plan.name,
    range: plan.max_students ? `Up to ${plan.max_students} students` : 'Unlimited students',
    price: plan.price_monthly || plan.price || null,
    features: plan.features || [],
    id: plan.id
  }))
}

onMounted(async () => {
  try {
    const apiPlans = await fetchPlans()
    plans.value = transformPlans(apiPlans)
  } catch (error) {
    // Fallback to basic plans if API fails
    plans.value = [
      {
        name: 'Basic Plan',
        range: 'Up to 100 students',
        price: 29.99,
        features: ['Up to 100 students', 'Basic grading', 'Email support'],
        id: 'basic'
      },
      {
        name: 'Premium Plan',
        range: 'Up to 500 students',
        price: 79.99,
        features: ['Up to 500 students', 'Advanced grading', 'Priority support'],
        id: 'premium'
      }
    ]
  } finally {
    loading.value = false
  }
})

const recommendedPlan = computed(() => {
  if (plans.value.length === 0) return null
  const count = Number(props.formData.subjectCount || 0)

  if (count >= 20) return plans.value[2]
  if (count >= 10) return plans.value[1]
  if (count > 0) return plans.value[0]
  return plans.value[1]
})

const displayedPrice = (price: number) => {
  const value = isAnnual.value ? Math.round(price * 0.8) : price
  return `$ ${value}`
}

const selectPlan = (plan) => {
  props.formData.plan_id = plan.id
  // Don't emit submit-registration here - just select the plan
}
</script>
