<template>
  <div class="mt-10 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6 lg:p-10">
    <div class="mx-auto max-w-4xl text-center">
      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-500 shadow-sm">
        <Sparkles class="h-6 w-6" />
      </div>

      <h1 class="mt-8 text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
        Choose Your Plan
      </h1>

      <p class="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
        Based on your school setup, we recommend the
        <span class="font-semibold text-slate-800">{{ recommendedPlan?.name || '...' }}</span>
        plan.
      </p>

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

    <div :class="['mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3', loading ? 'justify-center' : '']">
      <!-- Loading state -->
      <div v-if="loading" class="w-full flex items-center justify-center py-12">
        <div class="text-center">
          <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800"></div>
          <p class="mt-4 text-slate-600">Loading plans...</p>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="errorMessage" class="col-span-full rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
        <p class="text-lg font-semibold">Unable to get plans</p>
        <p class="mt-2">{{ errorMessage }}</p>
      </div>

      <!-- Plans -->
      <article
        v-else
        v-for="(plan, idx) in plans"
        :key="plan.id || plan.name"
        :class="[
          'relative flex min-h-full flex-col rounded-2xl border p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md sm:p-6',
          idx === 1
            ? 'border-[#D4AF37] bg-amber-50 shadow-lg border-2'
            : 'bg-white border-slate-200'
        ]"
      >
        <div
          v-if="plan.name === recommendedPlan?.name"
          class="mb-4 flex items-center justify-center rounded-full bg-slate-800 px-4 py-1 text-sm font-semibold text-amber-400"
        >
          Recommended
        </div>

        <div
          v-else-if="idx === 1"
          class="mb-4 flex items-center justify-center rounded-full bg-slate-800 px-4 py-1 text-sm font-semibold text-amber-400"
        >
          Most Popular
        </div>

        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-2xl font-bold tracking-tight text-slate-800">
              {{ plan.name }}
            </h2>
            <p class="mt-2 text-sm text-slate-500">{{ plan.range }}</p>
          </div>
          <div class="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {{ isAnnual ? 'Annual' : 'Monthly' }}
          </div>
        </div>

        <div class="mt-8 rounded-2xl border border-slate-200 bg-white/80 p-4">
          <template v-if="plan.price">
            <div class="flex items-end gap-2">
              <span class="text-3xl font-bold tracking-tight text-slate-800">
                {{ displayedPrice(plan) }}
              </span>
              <span class="pb-1 text-base text-slate-500">/{{ isAnnual ? 'yr' : 'mo' }}</span>
            </div>
            <p class="mt-2 text-sm font-medium text-emerald-600">
              {{ isAnnual ? 'Billed annually' : 'Billed monthly' }}
            </p>
          </template>

          <template v-else>
            <div class="text-2xl font-bold tracking-tight text-slate-800">Custom</div>
          </template>
        </div>

        <div class="mt-6 grid gap-2 text-sm text-slate-600">
          <div class="flex items-center justify-between rounded-xl bg-slate-100/80 px-3 py-2">
            <span>Students</span>
            <span class="font-semibold text-slate-800">{{ plan.maxStudents }}</span>
          </div>
          <div class="flex items-center justify-between rounded-xl bg-slate-100/80 px-3 py-2">
            <span>Teachers</span>
            <span class="font-semibold text-slate-800">{{ plan.maxTeachers }}</span>
          </div>
          <div class="flex items-center justify-between rounded-xl bg-slate-100/80 px-3 py-2">
            <span>Exams / term</span>
            <span class="font-semibold text-slate-800">{{ plan.maxExamsPerTerm }}</span>
          </div>
        </div>

        <div class="mt-6 flex-1">
          <p class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Includes</p>
          <ul class="space-y-3">
            <li
              v-for="feature in plan.features"
              :key="feature"
              class="flex items-start gap-3 text-sm text-slate-700"
            >
              <span class="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                <Check class="h-3.5 w-3.5" />
              </span>
              <span class="break-words">{{ feature }}</span>
            </li>
          </ul>
        </div>

        <button
          type="button"
          @click="selectPlan(plan)"
          :class="[
            'mt-8 min-h-[44px] w-full cursor-pointer rounded-xl px-5 py-4 text-base font-semibold shadow-sm transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2',
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

    <div class="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
      <button
        type="button"
        class="inline-flex min-h-[44px] items-center justify-center gap-3 rounded-xl border-2 border-[#0B1F3A] bg-white px-6 py-3 text-base font-medium text-[#0B1F3A] shadow-sm transition duration-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 sm:px-7"
        @click="emit('back')"
      >
        Back
      </button>

      <button
        type="button"
        @click="emit('continue')"
        :disabled="!props.formData.plan_id"
        class="inline-flex min-h-[44px] items-center justify-center gap-3 rounded-xl bg-[#0B1F3A] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[#0B1F3A]/10 transition duration-300 hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:px-7"
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
import { fetchPlans } from './api/plans'
import { normalizePlanFeatures } from '../../js/lib/plans'

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

interface Plan {
  id: string
  name: string
  range: string
  price: number | null
  monthlyPrice: number | null
  yearlyPrice: number | null
  maxStudents: string
  maxTeachers: string
  maxExamsPerTerm: string
  features: string[]
}

const isAnnual = ref(true)
const plans = ref<Plan[]>([])
const loading = ref(true)
const errorMessage = ref('')

// Transform API plan data to match the expected format
const transformPlans = (apiPlans: any[]): Plan[] => {
  return apiPlans.map(plan => ({
    name: plan.name,
    range: plan.max_students ? `Up to ${plan.max_students} students` : 'Unlimited students',
    price: plan.price_monthly || plan.price || null,
    monthlyPrice: plan.price_monthly ?? null,
    yearlyPrice: plan.price_yearly ?? null,
    maxStudents: plan.max_students ? `Up to ${plan.max_students}` : 'Unlimited',
    maxTeachers: plan.max_teachers ? `Up to ${plan.max_teachers}` : 'Unlimited',
    maxExamsPerTerm: plan.max_exams_per_term ? `Up to ${plan.max_exams_per_term}` : 'Unlimited',
    features: normalizePlanFeatures(plan.features),
    id: plan.id
  }))
}

onMounted(async () => {
  try {
    const apiPlans = await fetchPlans()
    plans.value = transformPlans(Array.isArray(apiPlans) ? apiPlans : [])
    if (plans.value.length === 0) {
      throw new Error('No plans were returned from the server.')
    }
  } catch (error) {
    const planError = error instanceof Error ? error.message : String(error)
    errorMessage.value = planError || 'Unable to get plans.'
  } finally {
    loading.value = false
  }
})

const recommendedPlan = computed(() => {
  if (!plans.value?.length) return null
  const count = Number(props.formData.subjectCount || 0)

  if (count >= 20 && plans.value[2]) return plans.value[2]
  if (count >= 10 && plans.value[1]) return plans.value[1]
  if (count > 0 && plans.value[0]) return plans.value[0]
  return plans.value[0]
})

const displayedPrice = (plan: Plan) => {
  const selectedPrice = isAnnual.value ? plan.yearlyPrice : plan.monthlyPrice
  if (selectedPrice == null) return 'Custom'
  return `₦${Math.round(Number(selectedPrice)).toLocaleString('en-US')}`
}

const selectPlan = (plan: Plan) => {
  props.formData.plan_id = plan.id
  // Don't emit submit-registration here - just select the plan
}
</script>
