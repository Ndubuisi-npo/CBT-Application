<template>
  <button
    :type="type"
    :disabled="disabled || processing"
    :class="buttonClasses"
    @click="handleClick"
  >
    <component v-if="icon && iconPosition === 'left'" :is="icon" class="h-4 w-4" />
    <LoaderCircle v-if="processing" class="h-4 w-4 animate-spin" />
    <span v-if="text" :class="{ 'ml-2': (icon && iconPosition === 'left') || processing, 'mr-2': icon && iconPosition === 'right' }">
      {{ text }}
    </span>
    <component v-if="icon && iconPosition === 'right'" :is="icon" class="h-4 w-4" />
    <slot v-if="!text"></slot>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'

const props = defineProps({
  // Button content
  text: { type: String, default: '' },
  icon: { type: [Object, Function], default: null },
  iconPosition: { type: String, default: 'left', validator: (value) => ['left', 'right'].includes(value) },
  
  // Button behavior
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  processing: { type: Boolean, default: false },
  
  // Button variants
  variant: { 
    type: String, 
    default: 'primary',
    validator: (value) => [
      'primary', 'secondary', 'outline', 'ghost', 'success', 'warning', 'danger', 'info'
    ].includes(value)
  },
  
  // Button sizes
  size: { 
    type: String, 
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  
  // Additional options
  fullWidth: { type: Boolean, default: false },
  rounded: { type: [String, Boolean], default: 'lg' },
  href: { type: String, default: null }
})

const emit = defineEmits(['click'])

const handleClick = (event) => {
  if (!props.disabled && !props.processing) {
    emit('click', event)
  }
}

const buttonClasses = computed(() => {
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'transition',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-[#D4AF37]',
    'focus:ring-offset-2',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed'
  ]

  // Size classes
  const sizeClasses = {
    xs: ['px-2', 'py-1', 'text-xs'],
    sm: ['px-3', 'py-2', 'text-xs'],
    md: ['px-4', 'py-2.5', 'text-sm'],
    lg: ['px-6', 'py-3', 'text-base'],
    xl: ['px-8', 'py-4', 'text-lg']
  }

  // Variant classes
  const variantClasses = {
    primary: [
      'bg-[#0B1F3A]',
      'text-white',
      'hover:bg-[#0F2940]',
      'shadow-sm'
    ],
    secondary: [
      'bg-slate-100',
      'text-slate-700',
      'hover:bg-slate-200'
    ],
    outline: [
      'border-2',
      'border-slate-300',
      'text-slate-700',
      'hover:bg-slate-50'
    ],
    ghost: [
      'text-slate-600',
      'hover:bg-slate-100',
      'hover:text-slate-700'
    ],
    success: [
      'bg-emerald-600',
      'text-white',
      'hover:bg-emerald-700'
    ],
    warning: [
      'bg-amber-50',
      'text-amber-700',
      'hover:bg-amber-100'
    ],
    danger: [
      'bg-red-50',
      'text-red-700',
      'hover:bg-red-100'
    ],
    info: [
      'bg-blue-50',
      'text-blue-700',
      'hover:bg-blue-100'
    ]
  }

  // Rounded classes
  const roundedClasses = {
    none: [],
    sm: ['rounded-sm'],
    md: ['rounded-md'],
    lg: ['rounded-lg'],
    xl: ['rounded-xl'],
    '2xl': ['rounded-2xl'],
    '3xl': ['rounded-3xl'],
    full: ['rounded-full']
  }

  // Width classes
  const widthClasses = props.fullWidth ? ['w-full'] : []

  return [
    ...baseClasses,
    ...sizeClasses[props.size] || sizeClasses.md,
    ...variantClasses[props.variant] || variantClasses.primary,
    ...roundedClasses[typeof props.rounded === 'string' ? props.rounded : props.rounded ? 'lg' : 'none'],
    ...widthClasses
  ].filter(Boolean).join(' ')
})
</script>
