import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'

export function useActivities() {
  const uiStore = useSchoolAdminUiStore()

  const addActivity = async (activityData) => {
    try {
      // Log activity - in real app, this would make API call
      
      // Show success toast
      uiStore.addToast({
        title: 'Activity Logged',
        message: `${activityData.action_type} action completed for ${activityData.entity_type}`,
        variant: 'success'
      })
    } catch (error) {
      console.error('Failed to log activity:', error)
      
      // Show error toast
      uiStore.addToast({
        title: 'Error',
        message: 'Failed to log activity',
        variant: 'error'
      })
    }
  }

  return {
    addActivity
  }
}
