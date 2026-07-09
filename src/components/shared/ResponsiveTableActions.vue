<!--
  ResponsiveTableActions.vue
  ────────────────────────────────────────────────────────────────────────
  Single source of truth for row/card actions across every data table in
  the app (Students, Teachers, Subjects, Classes, Departments, Sessions,
  Terms, Schools, Notifications, Exams, Questions, ...).

  Desktop (lg and up):  actions render as the existing hover button row.
  Tablet & Mobile:      actions collapse into a single kebab (⋮) trigger
                         that opens an accessible radix-vue dropdown menu.

  Usage:
    <ResponsiveTableActions
      :actions="[
        { key: 'view',   label: 'View',           icon: Eye,     onClick: () => viewTeacher(t) },
        { key: 'edit',   label: 'Edit',            icon: Pencil,  onClick: () => editTeacher(t) },
        { key: 'reset',  label: 'Reset Password',  icon: KeyRound,onClick: () => resetPw(t) },
        { key: 'suspend',label: 'Suspend', icon: Ban, variant: 'warning', onClick: () => suspend(t), hidden: t.is_suspended },
        { key: 'delete', label: 'Delete', icon: Trash2, variant: 'danger', onClick: () => remove(t), loading: deleteLoading.has(t.id) },
      ]"
    />

  Each action:
    key       string   unique key (required)
    label     string   visible label
    icon      Component (lucide icon, optional)
    onClick   Function
    variant   'default' | 'warning' | 'danger' | 'success'  (colors the desktop button + menu item)
    disabled  boolean
    loading   boolean  (shows a spinner / "…ing" state on desktop button)
    loadingLabel string  optional label shown while loading
    hidden    boolean  (action omitted entirely, e.g. "Suspend" once already suspended)
-->
<template>
  <div class="flex items-center justify-end gap-2" @click.stop>
    <!-- Desktop: hover action row (unchanged behaviour) -->
    <div
      class="hidden items-center gap-1.5 lg:flex"
      :class="alwaysVisible ? 'opacity-100' : 'opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100'"
    >
      <button
        v-for="action in visibleActions"
        :key="action.key"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 transition focus:outline-none focus:ring-2 focus:ring-offset-1"
        :class="desktopButtonClasses(action)"
        :disabled="action.disabled || action.loading"
        @click="handleClick(action)"
      >
        <LoaderCircle v-if="action.loading" class="h-3.5 w-3.5 animate-spin" />
        <component :is="action.icon" v-else-if="action.icon" class="h-3.5 w-3.5" />
        <span>{{ action.loading ? (action.loadingLabel || 'Working…') : action.label }}</span>
      </button>
    </div>

    <!-- Tablet & Mobile: kebab menu -->
    <DropdownMenuRoot v-model:open="isOpen">
      <DropdownMenuTrigger
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] lg:hidden"
        :aria-label="`Actions for ${entityLabel || 'this row'}`"
      >
        <MoreVertical class="h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent
          :side-offset="6"
          align="end"
          class="z-50 min-w-[180px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/10 will-change-[opacity,transform] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <DropdownMenuItem
            v-for="action in visibleActions"
            :key="action.key"
            class="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition data-[highlighted]:bg-slate-50"
            :class="menuItemClasses(action)"
            :disabled="action.disabled || action.loading"
            @select="handleSelect(action)"
          >
            <LoaderCircle v-if="action.loading" class="h-4 w-4 shrink-0 animate-spin" />
            <component :is="action.icon" v-else-if="action.icon" class="h-4 w-4 shrink-0" />
            <span>{{ action.loading ? (action.loadingLabel || 'Working…') : action.label }}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { LoaderCircle, MoreVertical } from 'lucide-vue-next'
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} from 'radix-vue'

const props = defineProps({
  /** Array of action descriptors, see file header for shape. */
  actions: { type: Array, default: () => [] },
  /** Optional label used for the kebab's aria-label, e.g. a person's name. */
  entityLabel: { type: String, default: '' },
  /** Force the desktop action row to always be visible (skip the hover-reveal). */
  alwaysVisible: { type: Boolean, default: false },
})

const isOpen = ref(false)

const visibleActions = computed(() => props.actions.filter(a => !a.hidden))

const handleClick = (action) => {
  if (action.disabled || action.loading) return
  action.onClick?.()
}

const handleSelect = (action) => {
  if (action.disabled || action.loading) return
  // Defer so the menu can finish closing before any confirm()/route change fires.
  requestAnimationFrame(() => action.onClick?.())
}

const desktopButtonClasses = (action) => {
  if (action.disabled || action.loading) return 'cursor-not-allowed opacity-50 ring-slate-200 text-slate-400'
  const variants = {
    default: 'text-slate-600 ring-slate-200 hover:bg-slate-100 focus:ring-slate-300',
    warning: 'text-amber-600 ring-amber-200 hover:bg-amber-50 focus:ring-amber-300',
    danger: 'text-red-600 ring-red-200 hover:bg-red-50 focus:ring-red-300',
    success: 'text-emerald-600 ring-emerald-200 hover:bg-emerald-50 focus:ring-emerald-300',
  }
  return variants[action.variant] || variants.default
}

const menuItemClasses = (action) => {
  if (action.disabled || action.loading) return 'cursor-not-allowed opacity-50 text-slate-400'
  const variants = {
    default: 'text-slate-700 data-[highlighted]:text-slate-900',
    warning: 'text-amber-700 data-[highlighted]:bg-amber-50',
    danger: 'text-red-600 data-[highlighted]:bg-red-50',
    success: 'text-emerald-700 data-[highlighted]:bg-emerald-50',
  }
  return variants[action.variant] || variants.default
}
</script>
