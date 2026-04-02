<template>
  <div class="space-y-6">
    <SectionCard title="Platform Settings" subtitle="High-level controls for branding, security, and operational automation.">
      <div class="grid gap-6 lg:grid-cols-2">
        <div class="rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">Security</p>
          <h3 class="mt-2 text-lg font-semibold text-slate-900">Session controls</h3>
          <p class="mt-2 text-sm leading-6 text-slate-500">Configure MFA enforcement, idle session limits, and audit retention policy.</p>
          <button type="button" class="mt-4 rounded-lg border-2 border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2" @click="notify('Security settings connected to backend later.')">Configure</button>
        </div>

        <div class="rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">Branding</p>
          <h3 class="mt-2 text-lg font-semibold text-slate-900">Tenant defaults</h3>
          <p class="mt-2 text-sm leading-6 text-slate-500">Control default plan assignment, welcome email branding, and provisioning templates.</p>
          <button type="button" class="mt-4 rounded-lg border-2 border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2" @click="notify('Branding settings connected to backend later.')">Manage</button>
        </div>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import SectionCard from '../components/SectionCard.vue'
import { useSuperAdminUiStore } from '../stores/ui'

const uiStore = useSuperAdminUiStore()

const notify = (message) => {
  uiStore.addToast({
    title: 'Settings',
    message,
    variant: 'success',
  })
}
</script>
