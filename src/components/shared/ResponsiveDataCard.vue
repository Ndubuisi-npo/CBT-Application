<!--
  ResponsiveDataCard.vue
  ────────────────────────────────────────────────────────────────────────
  The "card" half of the responsive table pattern. Every list page renders:

    <table class="hidden lg:table"> ... </table>          (desktop, unchanged)
    <div class="grid gap-3 lg:hidden">
      <ResponsiveDataCard v-for="row in items" :key="row.id" ...>
        <template #actions><ResponsiveTableActions :actions="..." /></template>
      </ResponsiveDataCard>
    </div>

  This is a presentational shell only — it does not know about your data
  shape. Pass `fields` for the common label/value grid (ID, Class, Email,
  Phone, etc.) and use the slots for anything bespoke (avatar, badges,
  footer content, actions).

  Props:
    avatarText   string   initials shown in the default circular avatar (ignored if #avatar slot used)
    avatarSrc    string   photo URL — renders an <img> avatar instead of initials
    avatarColor  string   tailwind classes for the initials circle background/text
    title        string   primary heading (e.g. full name)
    subtitle     string   secondary line under the title (e.g. email)
    fields       Array<{ label: string, value: string|number, span?: 1|2 }>
    clickable    boolean  adds hover/active affordance + emits `click` on the card body (for "tap card to view")
-->
<template>
  <div
    class="group relative min-w-0 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition"
    :class="clickable ? 'cursor-pointer active:scale-[0.99] hover:border-slate-300 hover:shadow-md' : ''"
    @click="clickable && $emit('click')"
  >
    <div class="flex min-w-0 flex-wrap items-start gap-3">
      <!-- Avatar -->
      <slot name="avatar">
        <img
          v-if="avatarSrc"
          :src="avatarSrc"
          :alt="title"
          class="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
        />
        <div
          v-else
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
          :class="avatarColor"
        >
          {{ avatarText }}
        </div>
      </slot>

      <!-- Title block -->
      <div class="min-w-0 flex-1 basis-0">
        <div class="flex min-w-0 flex-wrap items-start justify-between gap-2">
          <div class="min-w-0 flex-1 basis-0">
            <slot name="title">
              <p class="truncate text-sm font-semibold text-slate-900">{{ title }}</p>
            </slot>
            <slot name="subtitle">
              <p v-if="subtitle" class="truncate text-xs text-slate-500">{{ subtitle }}</p>
            </slot>
          </div>
          <slot name="badge" />
        </div>
      </div>

      <!-- Kebab actions (top-right, always accessible on touch) -->
      <div v-if="$slots.actions" class="ml-auto shrink-0" @click.stop>
        <slot name="actions" />
      </div>
    </div>

    <!-- Field grid -->
    <dl v-if="fields.length" class="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-slate-100 pt-3.5">
      <div
        v-for="field in fields"
        :key="field.label"
        :class="field.span === 2 ? 'col-span-2' : 'col-span-1'"
        class="min-w-0"
      >
        <dt class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{{ field.label }}</dt>
        <dd class="mt-0.5 truncate text-xs font-medium text-slate-700">{{ field.value ?? '—' }}</dd>
      </div>
    </dl>

    <!-- Custom body content -->
    <div v-if="$slots.default" class="mt-3.5" :class="fields.length ? '' : 'border-t border-slate-100 pt-3.5'">
      <slot />
    </div>

    <!-- Footer (e.g. secondary badges, quick stats) -->
    <div v-if="$slots.footer" class="mt-3.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  avatarText: { type: String, default: '?' },
  avatarSrc: { type: String, default: '' },
  avatarColor: { type: String, default: 'bg-slate-100 text-slate-600' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  fields: { type: Array, default: () => [] },
  clickable: { type: Boolean, default: false },
})

defineEmits(['click'])
</script>
