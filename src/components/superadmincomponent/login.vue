<template>
  <div
    class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.18),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] px-6 py-12"
  >
    <div class="absolute inset-0 bg-[linear-gradient(rgba(11,31,58,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(11,31,58,0.03)_1px,transparent_1px)] bg-[size:72px_72px]"></div>

    <div class="relative z-10 w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-900/10">
      <div class="mb-8 flex items-center gap-4">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B1F3A] text-lg font-bold text-white shadow-lg shadow-[#0B1F3A]/25">
          SA
        </div>
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">Super Admin</p>
          <h1 class="text-3xl font-semibold tracking-tight text-slate-900">Sign in to control center</h1>
        </div>
      </div>

      <p class="mb-8 text-sm leading-6 text-slate-500">
        Manage tenants, plans, and platform operations from one secure workspace.
      </p>

      <form class="space-y-6" @submit.prevent="submitLogin">
        <div class="space-y-2">
          <label for="email" class="block text-sm font-medium text-slate-700">Email address</label>
          <div class="relative">
            <Mail class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input id="email" v-model="form.email" type="email" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-3 pl-12 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="admin@educbt.com" autocomplete="email" />
          </div>
          <p v-if="errors.email" class="text-sm text-red-600">{{ errors.email }}</p>
        </div>

        <div class="space-y-2">
          <label for="password" class="block text-sm font-medium text-slate-700">Password</label>
          <div class="relative">
            <LockKeyhole class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-3 pl-12 pr-12 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition"
              placeholder="Enter your password"
              autocomplete="current-password"
            />
            <AppButton type="button" variant="ghost" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" @click="showPassword = !showPassword" :icon="showPassword ? EyeOff : Eye" />
          </div>
          <p v-if="errors.password" class="text-sm text-red-600">{{ errors.password }}</p>
        </div>

        <div class="flex items-center justify-between gap-4">
          <label class="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
            <input v-model="form.remember" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-[#0B1F3A] focus:ring-[#D4AF37]" />
            Remember me
          </label>
        </div>

        <p v-if="errors.general" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {{ errors.general }}
        </p>

        <AppButton 
          type="submit" 
          :text="authLoading ? 'Signing in...' : 'Login to Dashboard'" 
          :processing="authLoading" 
          full-width 
          variant="primary" 
          size="lg" 
          :icon="authLoading ? LoaderCircle : null" 
        />
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Eye, EyeOff, LoaderCircle } from 'lucide-vue-next'
import AppButton from '../shared/AppButton.vue'
import { useSuperAdminAuth } from './composables/useSuperAdminAuth'
import { useSuperAdminUiStore } from './stores/ui'

const router = useRouter()
const { login, loading: authLoading } = useSuperAdminAuth()
const uiStore = useSuperAdminUiStore()

const form = reactive({
  email: '',
  password: '',
  remember: false,
})

const errors = reactive({
  email: '',
  password: '',
  general: '',
})

const showPassword = ref(false)

const validate = () => {
  errors.email = ''
  errors.password = ''
  errors.general = ''

  if (!form.email.trim()) errors.email = 'Email is required.'
  else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Enter a valid email address.'

  if (!form.password.trim()) errors.password = 'Password is required.'
  else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters.'

  return !errors.email && !errors.password
}

const submitLogin = async () => {
  if (!validate()) return

  try {
    await login(form)
    uiStore.addToast({
      title: 'Welcome back',
      message: 'Super admin session started successfully.',
      variant: 'success',
    })
    router.push('/super-admin/dashboard')
  } catch (error) {
    errors.general = error.message || 'Unable to sign in.'
    uiStore.addToast({
      title: 'Sign in failed',
      message: errors.general,
      variant: 'error',
    })
  }
}
</script>
