<!--
  FormSection.vue
  ────────────────────────────────────────────────────────────────────────
  Groups related fields inside a drawer form with a heading + optional
  description, separated by a divider. Used to break long forms (Student,
  Teacher, Exam, School Profile...) into "Personal Information", "Contact
  Information", "Academic Information", etc.

  Usage:
    <FormSection title="Personal Information" description="Basic identity details.">
      <ResponsiveFormGrid>
        <AppInput ... />
        <AppInput ... />
      </ResponsiveFormGrid>
    </FormSection>

    Collapsible variant:
    <FormSection title="Additional Information" collapsible :default-open="false">
      ...
    </FormSection>
-->
<template>
  <section class="border-t border-slate-100 pt-6 first:border-t-0 first:pt-0">
    <component
      :is="collapsible ? 'button' : 'div'"
      :type="collapsible ? 'button' : undefined"
      class="flex w-full items-center justify-between gap-3 text-left"
      :class="collapsible ? 'focus:outline-none' : ''"
      :aria-expanded="collapsible ? isOpen : undefined"
      @click="collapsible && (isOpen = !isOpen)"
    >
      <div class="flex min-w-0 items-center gap-2">
        <div class="min-w-0">
          <h3 class="text-sm font-semibold text-slate-900">{{ title }}</h3>
          <p v-if="description" class="mt-0.5 text-xs text-slate-500">{{ description }}</p>
        </div>
        <span v-if="badge" class="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
          {{ badge }}
        </span>
      </div>
      <ChevronDown
        v-if="collapsible"
        class="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200"
        :class="{ '-rotate-180': isOpen }"
      />
    </component>

    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      leave-active-class="transition-all duration-150 ease-in"
      enter-from-class="opacity-0 -translate-y-1"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div v-if="!collapsible || isOpen" class="mt-4">
        <slot />
      </div>
    </Transition>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  badge: { type: String, default: '' },
  collapsible: { type: Boolean, default: false },
  defaultOpen: { type: Boolean, default: true },
})

const isOpen = ref(props.defaultOpen)
</script>
