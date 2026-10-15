<template>
  <section class="rounded-[28px] border border-slate-200 bg-white p-6">
    <div v-if="title || subtitle || $slots.header" class="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h3 v-if="title" class="text-xl font-semibold tracking-tight text-slate-900">{{ title }}</h3>
        <p v-if="subtitle" class="mt-1 text-sm leading-6 text-slate-500">{{ subtitle }}</p>
      </div>
      <slot name="header" />
    </div>
    <slot />
  </section>
</template>

<script setup>
defineProps({
  title: String,
  subtitle: String,
})
</script>
