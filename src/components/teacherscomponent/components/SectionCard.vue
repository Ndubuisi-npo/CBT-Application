<template>
  <section class="rounded-2xl border border-slate-200 bg-white">
    <div
      v-if="title || subtitle || $slots.header"
      class="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
    >
      <div>
        <h2 v-if="title" class="text-lg font-semibold tracking-tight text-slate-900">{{ title }}</h2>
        <p v-if="subtitle" class="mt-0.5 text-sm leading-6 text-slate-500">{{ subtitle }}</p>
      </div>
      <slot name="header" />
    </div>
    <div class="p-6">
      <slot />
    </div>
  </section>
</template>

<script setup>
defineProps({ title: String, subtitle: String })
</script>
