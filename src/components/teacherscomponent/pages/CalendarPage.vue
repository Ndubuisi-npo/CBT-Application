<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Calendar"
      subtitle="Keep track of assessment dates scheduled by your school admin."
      eyebrow="Teacher Workspace"
    />

    <ScheduleCalendarPreview />
  </div>
</template>

<script setup>
import AppPageHeader from '../../shared/AppPageHeader.vue'
import ScheduleCalendarPreview from '../components/ScheduleCalendarPreview.vue'
</script>