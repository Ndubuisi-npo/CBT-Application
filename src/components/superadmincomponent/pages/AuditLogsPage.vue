<template>
  <div class="space-y-6">
    <SectionCard title="Audit Logs" subtitle="Review administrative activity across authentication, provisioning, billing, and support operations.">
      <div class="space-y-4">
        <div v-for="log in logs" :key="log.id" class="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-start gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B1F3A] text-[#D4AF37]">
              <History class="h-5 w-5" />
            </div>
            <div>
              <p class="font-semibold text-slate-900">{{ log.action }}</p>
              <p class="mt-1 text-sm leading-6 text-slate-500">{{ log.description }}</p>
            </div>
          </div>
          <div class="text-sm text-slate-500">
            <p>{{ log.actor }}</p>
            <p>{{ log.timestamp }}</p>
          </div>
        </div>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { History } from 'lucide-vue-next'
import SectionCard from '../components/SectionCard.vue'

const logs = [
  { id: 1, action: 'Tenant suspended', description: 'Riverdale Academy was suspended after repeated failed billing sync attempts.', actor: 'Olivia Admin', timestamp: 'Mar 26, 2026 • 09:41' },
  { id: 2, action: 'Plan updated', description: 'Growth plan feature limits were adjusted for multi-campus reporting.', actor: 'Billing Ops', timestamp: 'Mar 26, 2026 • 08:16' },
  { id: 3, action: 'Login successful', description: 'Super admin session established from Lagos, Nigeria.', actor: 'Olivia Admin', timestamp: 'Mar 26, 2026 • 07:55' },
]
</script>
