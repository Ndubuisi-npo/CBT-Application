import { ref, computed } from 'vue'
import { fetchActivities, logActivity, getActivityTypes } from '../services/api/activities'

const activities = ref([])
const activityTypes = ref([])
const loading = ref(false)
const error = ref(null)
const filters = ref({
  entity_type: 'All',
  action_type: 'All',
  date_range: null
})

export function useActivities() {
  const fetchAllActivities = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetchActivities(params)
      activities.value = Array.isArray(response) ? response : (response.data || [])
      return activities.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchAllActivityTypes = async () => {
    try {
      const response = await getActivityTypes()
      activityTypes.value = Array.isArray(response) ? response : (response.data || [])
      return activityTypes.value
    } catch (err) {
      console.error('Failed to fetch activity types:', err)
      return []
    }
  }

  const addActivity = async (activityData) => {
    try {
      const newActivity = await logActivity(activityData)
      activities.value.unshift(newActivity)
      return newActivity
    } catch (err) {
      console.error('Failed to log activity:', err)
      throw err
    }
  }

  const getActivityIcon = (activityType) => {
    const iconMap = {
      'create': 'Plus',
      'update': 'Edit',
      'delete': 'Trash2',
      'activate': 'CheckCircle',
      'suspend': 'XCircle',
      'revoke': 'Shield',
      'assign': 'UserPlus',
      'enroll': 'Users',
      'session_start': 'PlayCircle',
      'session_end': 'PauseCircle',
      'login': 'LogIn',
      'logout': 'LogOut',
      'export': 'Download',
      'import': 'Upload',
      'backup': 'Database',
      'restore': 'RefreshCw'
    }
    return iconMap[activityType] || 'Activity'
  }

  const formatActivityDescription = (activity) => {
    const templates = {
      'class.create': `Class "${activity.details?.name || 'Unknown'}" was created`,
      'class.update': `Class "${activity.details?.name || 'Unknown'}" was updated`,
      'class.delete': `Class "${activity.details?.name || 'Unknown'}" was deleted`,
      'class.activate': `Class "${activity.details?.name || 'Unknown'}" was activated`,
      'class.suspend': `Class "${activity.details?.name || 'Unknown'}" was suspended`,
      
      'teacher.create': `Teacher "${activity.details?.name || 'Unknown'}" was added`,
      'teacher.update': `Teacher "${activity.details?.name || 'Unknown'}" was updated`,
      'teacher.delete': `Teacher "${activity.details?.name || 'Unknown'}" was removed`,
      'teacher.assign': `Teacher "${activity.details?.name || 'Unknown'}" was assigned to ${activity.details?.class || 'class'}`,
      'teacher.revoke': `Teacher "${activity.details?.name || 'Unknown'}" assignment was revoked`,
      
      'session.create': `Session "${activity.details?.name || 'Unknown'}" was created`,
      'session.activate': `Session "${activity.details?.name || 'Unknown'}" was activated`,
      'session.end': `Session "${activity.details?.name || 'Unknown'}" was ended`,
      
      'subject.create': `Subject "${activity.details?.name || 'Unknown'}" was created`,
      'subject.update': `Subject "${activity.details?.name || 'Unknown'}" was updated`,
      'subject.delete': `Subject "${activity.details?.name || 'Unknown'}" was deleted`,
      'subject.assign': `Subject "${activity.details?.name || 'Unknown'}" was assigned to ${activity.details?.class || 'class'}`,
      
      'student.enroll': `Student "${activity.details?.name || 'Unknown'}" was enrolled`,
      'student.withdraw': `Student "${activity.details?.name || 'Unknown'}" was withdrawn`,
      'student.update': `Student "${activity.details?.name || 'Unknown'}" was updated`,
      
      'user.login': `User "${activity.details?.name || 'Unknown'}" logged in`,
      'user.logout': `User "${activity.details?.name || 'Unknown'}" logged out`,
      'user.password_change': `Password was changed for user "${activity.details?.name || 'Unknown'}"`,
      
      'system.backup': `System backup was created`,
      'system.restore': `System was restored from backup`,
      'system.export': `Data export was completed`,
      'system.import': `Data import was completed`
    }
    
    const key = `${activity.entity_type}.${activity.action_type}`
    return templates[key] || `${activity.action_type} operation on ${activity.entity_type}`
  }

  const recentActivities = computed(() => 
    activities.value.slice(0, 10) // Show only 10 most recent
  )

  const activitiesByEntity = computed(() => (entityType) => 
    activities.value.filter(activity => activity.entity_type === entityType)
  )

  const activitiesByDate = computed(() => (date) => 
    activities.value.filter(activity => 
      new Date(activity.created_at).toDateString() === new Date(date).toDateString()
    )
  )

  const filteredActivities = computed(() => {
    let filtered = activities.value

    // Filter by entity type
    if (filters.value.entity_type !== 'All') {
      filtered = filtered.filter(activity => activity.entity_type === filters.value.entity_type)
    }

    // Filter by action type
    if (filters.value.action_type !== 'All') {
      filtered = filtered.filter(activity => activity.action_type === filters.value.action_type)
    }

    // Filter by date range
    if (filters.value.date_range) {
      const today = new Date()
      const filterDate = new Date()

      switch (filters.value.date_range) {
        case 'today':
          filterDate.setDate(today.getDate())
          break
        case 'week':
          filterDate.setDate(today.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(today.getMonth() - 1)
          break
        case 'year':
          filterDate.setFullYear(today.getFullYear() - 1)
          break
      }

      filtered = filtered.filter(activity => 
        new Date(activity.created_at) >= filterDate
      )
    }

    return filtered
  })

  const setFilter = (key, value) => {
    filters.value[key] = value
  }

  const clearFilters = () => {
    filters.value = {
      entity_type: 'All',
      action_type: 'All',
      date_range: null
    }
  }

  const uniqueEntityTypes = computed(() => {
    const types = [...new Set(activities.value.map(activity => activity.entity_type))]
    return types.sort()
  })

  const uniqueActionTypes = computed(() => {
    const types = [...new Set(activities.value.map(activity => activity.action_type))]
    return types.sort()
  })

  return {
    activities,
    activityTypes,
    loading,
    error,
    filters,
    fetchAllActivities,
    fetchAllActivityTypes,
    addActivity,
    getActivityIcon,
    formatActivityDescription,
    recentActivities,
    activitiesByEntity,
    activitiesByDate,
    filteredActivities,
    setFilter,
    clearFilters,
    uniqueEntityTypes,
    uniqueActionTypes
  }
}
