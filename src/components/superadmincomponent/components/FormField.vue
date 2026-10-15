<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-slate-700">{{ label }}</label>
    <div class="[&_input]:border-2 [&_input]:border-[#0B1F3A] [&_input]:rounded-lg [&_input]:px-4 [&_input]:py-2.5 [&_input]:w-full [&_input]:text-slate-900 [&_input]:placeholder:text-slate-400 [&_input]:focus:border-[#D4AF37] [&_input]:focus:outline-none [&_input]:focus:ring-0 [&_input]:transition [&_select]:border-2 [&_select]:border-[#0B1F3A] [&_select]:rounded-lg [&_select]:px-4 [&_select]:py-2.5 [&_select]:w-full [&_select]:text-slate-900 [&_select]:focus:border-[#D4AF37] [&_select]:focus:outline-none [&_select]:focus:ring-0 [&_select]:transition [&_textarea]:border-2 [&_textarea]:border-[#0B1F3A] [&_textarea]:rounded-lg [&_textarea]:px-4 [&_textarea]:py-2.5 [&_textarea]:w-full [&_textarea]:text-slate-900 [&_textarea]:placeholder:text-slate-400 [&_textarea]:focus:border-[#D4AF37] [&_textarea]:focus:outline-none [&_textarea]:focus:ring-0 [&_textarea]:transition">
      <slot />
    </div>
    <p v-if="error" class="text-sm text-red-600 font-medium">{{ error }}</p>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  error: String,
})
</script>
