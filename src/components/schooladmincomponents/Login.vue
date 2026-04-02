<template>
  <div class="min-h-screen bg-[#f3f6fb] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
    <div class="relative hidden overflow-hidden text-white lg:flex">
      <video autoplay muted loop playsinline class="absolute inset-0 h-full w-full object-cover">
        <source src="../../assets/signin_bg_vid.mp4" type="video/mp4" />
      </video>

      <div class="absolute inset-0 bg-gradient-to-br from-[#071426]/88 via-[#0B1F3A]/88 to-[#163154]/82"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.18),_transparent_32%)]"></div>

      <div class="relative z-10 flex w-full flex-col justify-between p-16 xl:p-20">
        <div class="flex items-center gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm">
            <Shield class="h-7 w-7 text-[#D4AF37]" />
          </div>
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.26em] text-[#D4AF37]">Tenant Portal</p>
            <span class="text-2xl font-semibold tracking-wide">{{ branding.schoolName }}</span>
          </div>
        </div>

        <div class="max-w-xl">
          <h1 class="mb-6 text-5xl font-semibold leading-[1.05] tracking-tight xl:text-6xl">
            Empowering education with calm, structured operations.
          </h1>

          <p class="max-w-lg text-lg leading-8 text-white/78 xl:text-xl">
            Sign in to manage academic sessions, classes, teachers, subjects, and school-wide configuration from one focused workspace.
          </p>

          <div class="mt-10 grid max-w-lg gap-4">
            <div class="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
              <Sparkles class="h-5 w-5 text-[#D4AF37]" />
              <span class="text-base text-white/88">Academic workflows, grading setup, and staff management in one place.</span>
            </div>

            <div class="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
              <Globe class="h-5 w-5 text-[#D4AF37]" />
              <span class="text-base text-white/88">{{ branding.domain }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 text-sm text-white/60">
          <div class="h-2 w-2 rounded-full bg-emerald-400"></div>
          Secure tenant-scoped access
        </div>
      </div>
    </div>

    <div class="flex min-h-screen items-center justify-center px-6 py-10 sm:px-8">
      <div class="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-900/8 sm:p-10">
        <div class="mb-10 text-center">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#0B1F3A] text-white shadow-lg shadow-[#0B1F3A]/20">
            <School class="h-8 w-8 text-[#D4AF37]" />
          </div>

          <h2 class="mt-6 text-4xl font-semibold tracking-tight text-slate-900">Welcome back</h2>

          <p class="mt-3 text-base leading-7 text-slate-500 sm:text-lg">
            Sign in to access the <span class="font-semibold text-slate-700">{{ branding.schoolName }}</span> admin workspace.
          </p>
        </div>

        <form class="space-y-6" @submit.prevent="submitLogin">
          <div class="space-y-2">
            <label class="block text-base font-semibold text-slate-700" for="school-email">Email address</label>

            <div class="relative">
              <Mail class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input id="school-email" v-model="form.email" type="email" placeholder="admin@school.edu" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-3 pl-12 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" />
            </div>

            <p v-if="errors.email" class="text-sm font-medium text-rose-600">{{ errors.email }}</p>
          </div>

          <div class="space-y-2">
            <label class="block text-base font-semibold text-slate-700" for="school-password">Password</label>

            <div class="relative">
              <LockKeyhole class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="school-password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your password"
                class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-3 pl-12 pr-12 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition"
              />

              <button type="button" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700" @click="showPassword = !showPassword">
                <component :is="showPassword ? EyeOff : Eye" class="h-5 w-5" />
              </button>
            </div>

            <p v-if="errors.password" class="text-sm font-medium text-rose-600">{{ errors.password }}</p>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 text-base">
            <label class="flex items-center gap-3 text-slate-600">
              <input v-model="form.remember" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-[#0B1F3A] focus:ring-[#D4AF37]" />
              Remember me
            </label>

            <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-500">
              <Globe class="h-4 w-4 text-[#D4AF37]" />
              {{ branding.domain }}
            </div>
          </div>

          <p v-if="errors.general" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
            {{ errors.general }}
          </p>

          <button type="submit" :disabled="authStore.loading" class="cursor-pointer flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B1F3A] px-4 py-4 text-base font-medium text-white transition hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2">
            <LoaderCircle v-if="authStore.loading" class="h-5 w-5 animate-spin" />
            {{ authStore.loading ? 'Signing in...' : 'Sign In' }}
          </button>

          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm leading-6 text-slate-500 sm:text-base">
            Need access to a new school workspace?
            <RouterLink to="/onboarding" class="font-semibold text-[#0B1F3A] transition hover:text-[#D4AF37]">
              Start onboarding
            </RouterLink>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Eye, EyeOff, Globe, LoaderCircle, LockKeyhole, Mail, School, Shield, Sparkles } from 'lucide-vue-next'
import { useSchoolAdminAuthStore } from './stores/auth'
import { useSchoolAdminProfileStore } from './stores/profile'
import { useSchoolAdminUiStore } from './stores/ui'

const router = useRouter()
const authStore = useSchoolAdminAuthStore()
const profileStore = useSchoolAdminProfileStore()
const uiStore = useSchoolAdminUiStore()

const branding = computed(() => profileStore.profile)

onMounted(() => {
  if (!profileStore.profile.address) profileStore.fetchProfile()
})

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
    await authStore.login(form)

    uiStore.addToast({
      title: 'Welcome back',
      message: `You are now signed in to ${branding.value.schoolName}.`,
      variant: 'success',
    })

    router.push('/school-admin/dashboard')
  } catch (error) {
    errors.general = error.message || 'Unable to sign in.'

    uiStore.addToast({
      title: 'Login failed',
      message: errors.general,
      variant: 'error',
    })
  }
}
</script>
