<!--
  AppDrawer.vue
  ────────────────────────────────────────────────────────────────────────
  The single, shared slide-over drawer used for every Create/Edit flow in
  the app. Do not build page-specific drawers — extend this one.

  Widths (per size prop, desktop lg+):
    sm   480px    md   600px    lg   720px    xl   860px    full  100%
  Below lg the drawer is 90% width (tablet) down to 100% width (mobile),
  regardless of size, so small screens always get a comfortable, native
  full-bleed sheet.

  Slots:
    default   drawer body (wrap long forms in <FormSection>)
    footer    sticky footer, typically <DrawerFooter> or two <AppButton>s

  Props of note:
    hasUnsavedChanges   when true, closing via backdrop/Esc/X asks for confirmation
    persistent          when true, backdrop click and Esc are ignored entirely (e.g. while saving)
-->
<template>
  <Teleport to="body">
    <Transition name="drawer-backdrop">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm"
        @click="!persistent && closeOnBackdrop && requestClose()"
      />
    </Transition>

    <Transition name="drawer-panel">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-2xl focus:outline-none"
        :class="widthClass"
        role="dialog"
        :aria-label="title"
        aria-modal="true"
        tabindex="-1"
        ref="panelRef"
      >
        <!-- Header -->
        <div class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div class="min-w-0">
            <p v-if="eyebrow" class="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">{{ eyebrow }}</p>
            <h2 class="mt-0.5 truncate text-xl font-semibold tracking-tight text-slate-900">{{ title }}</h2>
            <p v-if="subtitle" class="mt-1 text-sm text-slate-500">{{ subtitle }}</p>
          </div>
          <button
            type="button"
            class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="persistent"
            @click="requestClose()"
            aria-label="Close panel"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-6">
          <slot />
        </div>

        <!-- Sticky footer -->
        <div v-if="$slots.footer" class="shrink-0 border-t border-slate-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          <slot name="footer" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  size: { type: String, default: 'md', validator: v => ['sm', 'md', 'lg', 'xl', 'full'].includes(v) },
  closeOnBackdrop: { type: Boolean, default: true },
  /** When true, prompts the user before closing (dirty form). */
  hasUnsavedChanges: { type: Boolean, default: false },
  /** When true, backdrop click / Escape / close button are all disabled (e.g. mid-save). */
  persistent: { type: Boolean, default: false },
  unsavedChangesMessage: { type: String, default: 'You have unsaved changes. Are you sure you want to discard them?' },
})

const emit = defineEmits(['update:modelValue', 'close'])

const panelRef = ref(null)

const widthClass = computed(() => {
  const desktopWidth = {
    sm: 'lg:w-[480px]',
    md: 'lg:w-[600px]',
    lg: 'lg:w-[720px]',
    xl: 'lg:w-[860px]',
    full: 'lg:w-full',
  }[props.size] || 'lg:w-[600px]'
  // Mobile: 100% (default w-full). Tablet (sm–lg): 90%. Desktop (lg+): fixed px width above.
  return `sm:w-[90%] ${desktopWidth}`
})

const requestClose = () => {
  if (props.persistent) return
  if (props.hasUnsavedChanges && !window.confirm(props.unsavedChangesMessage)) return
  emit('update:modelValue', false)
  emit('close')
}

const onKeydown = (e) => {
  if (e.key === 'Escape' && props.modelValue) requestClose()
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      document.addEventListener('keydown', onKeydown)
      document.body.style.overflow = 'hidden'
      nextTick(() => panelRef.value?.focus())
    } else {
      document.removeEventListener('keydown', onKeydown)
      document.body.style.overflow = ''
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.drawer-backdrop-enter-active,
.drawer-backdrop-leave-active { transition: opacity 0.2s ease; }
.drawer-backdrop-enter-from,
.drawer-backdrop-leave-to { opacity: 0; }

.drawer-panel-enter-active,
.drawer-panel-leave-active { transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.drawer-panel-enter-from,
.drawer-panel-leave-to { transform: translateX(100%); }
</style>
