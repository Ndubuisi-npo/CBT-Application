<template>
  <div class="space-y-6">
    <SectionCard title="Subscription Plans" subtitle="View available subscription plans for tenant provisioning.">
      <template #header>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton @click="openCreateModal" :icon="Plus" text="Create Plan" variant="primary" />
        </div>
      </template>
      <div v-if="loading" class="grid gap-6 xl:grid-cols-3">
        <div v-for="_ in 3" :key="_" class="h-96 rounded-3xl bg-slate-200 animate-pulse"></div>
      </div>

      <div v-else-if="plans.length === 0" class="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div class="mb-4 rounded-full bg-slate-100 p-3">
          <CreditCard class="h-8 w-8 text-slate-400" />
        </div>
        <h3 class="mb-2 text-lg font-semibold text-slate-900">No plans found</h3>
        <p class="mb-6 text-sm text-slate-500">
          Create your first subscription plan to start provisioning tenant workspaces
        </p>
        <AppButton @click="openCreateModal" :icon="Plus" text="Create Plan" variant="primary" />
      </div>

      <div v-else class="grid gap-6 xl:grid-cols-3">
        <article v-for="plan in plans" :key="plan.id" class="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10">
          <div class="absolute top-4 right-4 z-10 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <AppButton @click="editPlan(plan)" :icon="Edit" variant="ghost" class="rounded-lg bg-white/90 p-2 text-slate-600 shadow-md hover:bg-white hover:text-[#0B1F3A]" />
            <AppButton 
              @click="handleDeletePlan(plan.id)" 
              :icon="Trash" 
              variant="ghost" 
              class="rounded-lg bg-white/90 p-2 text-slate-600 shadow-md hover:bg-white hover:text-red-600"
              loadingText="Deleting..."
              :processing="deleteLoading.has(plan.id)"
              :disabled="deleteLoading.has(plan.id)"
            />
          </div>
          
          <div class="bg-gradient-to-br from-[#0B1F3A] to-[#163154] p-6 text-white">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm uppercase tracking-[0.22em] text-[#D4AF37]">{{ plan.interval || 'Monthly' }}</p>
                <h3 class="mt-2 text-2xl font-semibold">{{ plan.name }}</h3>
              </div>
              <div class="rounded-2xl bg-white/10 px-3 py-2 text-sm font-semibold text-[#D4AF37]">
                ${{ plan.price_monthly || 0 }}/mo
              </div>
            </div>
          </div>

          <div class="p-6">
            <div class="mb-4 space-y-2 text-sm text-slate-600">
              <div class="flex justify-between">
                <span>Max Students:</span>
                <span class="font-medium">{{ plan.max_students || 0 }}</span>
              </div>
              <div class="flex justify-between">
                <span>Max Teachers:</span>
                <span class="font-medium">{{ plan.max_teachers || 0 }}</span>
              </div>
              <div class="flex justify-between">
                <span>Max Exams/Term:</span>
                <span class="font-medium">{{ plan.max_exams_per_term || 0 }}</span>
              </div>
            </div>
            
            <div class="border-t border-slate-100 pt-4">
              <h4 class="mb-3 text-sm font-medium text-slate-700">Features</h4>
              <ul class="space-y-3">
                <li v-for="feature in plan.features" :key="feature" class="flex items-start gap-3 text-sm text-slate-600">
                  <Check class="mt-0.5 h-4 w-4 text-[#D4AF37]" />
                  <span>{{ feature }}</span>
                </li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </SectionCard>
    
    <!-- Plan Modal -->
    <PlanModal 
      :is-open="showModal" 
      :plan="selectedPlan" 
      @close="closeModal" 
      @created="onPlanCreated" 
      @updated="onPlanUpdated" 
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { Edit, Plus, Trash, CreditCard } from 'lucide-vue-next'
import SectionCard from '../components/SectionCard.vue'
import PlanModal from '../components/PlanModal.vue'
import AppButton from '../../shared/AppButton.vue'
import { useSuperAdminPlans } from '../composables/useSuperAdminPlans'
import { useSuperAdminUiStore } from '../stores/ui'

const { fetchPlans, plans, loading, deletePlan } = useSuperAdminPlans()
const uiStore = useSuperAdminUiStore()

// Loading states
const deleteLoading = ref(new Set())

// Modal state
const showModal = ref(false)
const selectedPlan = ref(null)

onMounted(() => {
  fetchPlans()
})

const openCreateModal = () => {
  selectedPlan.value = null
  showModal.value = true
}

const editPlan = (plan) => {
  selectedPlan.value = plan
  showModal.value = true
}

const handleDeletePlan = async (id) => {
  if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
    return
  }
  
  deleteLoading.value = new Set([...deleteLoading.value, id])
  
  try {
    await deletePlan(id)
    uiStore.addToast({
      title: 'Plan deleted',
      message: 'Plan has been deleted successfully.',
      variant: 'success',
    })
  } catch (error) {
    uiStore.addToast({
      title: 'Error',
      message: error.message || 'Failed to delete plan.',
      variant: 'error',
    })
  } finally {
    deleteLoading.value = new Set([...deleteLoading.value].filter(loadingId => loadingId !== id))
  }
}

const closeModal = () => {
  showModal.value = false
  selectedPlan.value = null
}

const onPlanCreated = () => {
  fetchPlans() // Refresh the plans list
}

const onPlanUpdated = () => {
  fetchPlans() // Refresh the plans list
}
</script>
