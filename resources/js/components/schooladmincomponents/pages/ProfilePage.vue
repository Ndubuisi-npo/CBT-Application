<template>
  <div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
    <SectionCard title="School Identity" subtitle="Upload branding assets and confirm tenant profile details.">
      <div class="space-y-5">
        <div class="rounded-[28px] border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <div class="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <img v-if="form.logo" :src="form.logo" :alt="form.schoolName" class="h-full w-full object-cover" />
            <ImagePlus v-else class="h-8 w-8 text-slate-400" />
          </div>
          <p class="mt-4 text-sm font-medium text-slate-700">Logo upload</p>
          <p class="mt-1 text-sm text-slate-500">Choose a logo image for tenant branding.</p>
          <input type="file" accept="image/*" class="mt-4 block w-full text-sm text-slate-500 file:mr-4 file:rounded-2xl file:border-0 file:bg-[#0B1F3A] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:text-[#D4AF37]" @change="handleLogo" />
        </div>
      </div>
    </SectionCard>

    <SectionCard title="School Profile" subtitle="Maintain name, address, and contact details for the school workspace.">
      <form class="space-y-5" @submit.prevent="submit">
        <FormField label="School name">
          <input v-model="form.schoolName" class="sa-input" />
        </FormField>
        <FormField label="Address">
          <input v-model="form.address" class="sa-input" />
        </FormField>
        <div class="grid gap-5 md:grid-cols-2">
          <FormField label="Contact email">
            <input v-model="form.email" type="email" class="sa-input" />
          </FormField>
          <FormField label="Contact phone">
            <input v-model="form.phone" class="sa-input" />
          </FormField>
        </div>
        <button type="submit" class="sa-button-primary w-full">Save Profile</button>
      </form>
    </SectionCard>
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import { ImagePlus } from 'lucide-vue-next'
import FormField from '../components/FormField.vue'
import SectionCard from '../components/SectionCard.vue'
import { useSchoolAdminProfileStore } from '../stores/profile'
import { useSchoolAdminUiStore } from '../stores/ui'

const profileStore = useSchoolAdminProfileStore()
const uiStore = useSchoolAdminUiStore()
const form = reactive({ schoolName: '', logo: '', address: '', email: '', phone: '', domain: '' })

onMounted(async () => {
  await profileStore.fetchProfile()
  Object.assign(form, profileStore.profile)
})

const handleLogo = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  form.logo = URL.createObjectURL(file)
}

const submit = async () => {
  await profileStore.saveProfile({ ...form })
  uiStore.addToast({ title: 'Profile updated', message: 'School profile changes were saved.', variant: 'success' })
}
</script>
