<template>
  <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div>
      <!-- Breadcrumbs -->
      <nav
        v-if="breadcrumbs && breadcrumbs.length"
        class="mb-2 flex items-center gap-1.5 text-xs text-slate-500"
        aria-label="Breadcrumb"
      >
        <template v-for="(crumb, i) in breadcrumbs" :key="i">
          <RouterLink v-if="crumb.to" :to="crumb.to" class="transition hover:text-[#0B1F3A]">
            {{ crumb.label }}
          </RouterLink>
          <span v-else class="font-medium text-slate-700">{{ crumb.label }}</span>
          <ChevronRight v-if="i < breadcrumbs.length - 1" class="h-3 w-3 text-slate-300" />
        </template>
      </nav>

      <!-- Eyebrow -->
      <p v-if="eyebrow" class="mb-1 text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">{{ eyebrow }}</p>

      <!-- Title -->
      <h1 class="text-2xl font-semibold tracking-tight text-slate-900">{{ title }}</h1>
      <p v-if="subtitle" class="mt-1.5 text-sm leading-6 text-slate-500">{{ subtitle }}</p>
    </div>

    <!-- Actions slot -->
    <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
import { ChevronRight } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  breadcrumbs: { type: Array, default: null },
})
</script>
