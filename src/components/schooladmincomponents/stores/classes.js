import { defineStore } from 'pinia'
import { getClasses, saveClass, deleteClass } from '../services/api/classes'
import { useActivities } from '../composables/useActivities'

export const useSchoolAdminClassesStore = defineStore('school-admin-classes', {
  state: () => ({
    classes: [],
    loading: false,
  }),
  actions: {
    async fetchClasses() {
      this.loading = true
      try {
        const rawClasses = await getClasses()
        // Use the API data directly without transformations
        this.classes = rawClasses
      } catch (error) {
        this.classes = []
      } finally {
        this.loading = false
      }
    },
    async saveClass(payload) {
      const { addActivity } = useActivities()
      const isNew = !payload.id
      const record = await saveClass(payload)
      
      // Log activity
      try {
        await addActivity({
          entity_type: 'class',
          action_type: isNew ? 'create' : 'update',
          details: {
            name: record.name,
            id: record.id
          }
        })
      } catch (error) {
        console.error('Failed to log activity:', error)
      }
      
      const exists = this.classes.some((item) => item.id === record.id)
      this.classes = exists
        ? this.classes.map((item) => (item.id === record.id ? record : item))
        : [record, ...this.classes]
    },
    async deleteClass(id) {
      const { addActivity } = useActivities()
      const classToDelete = this.classes.find(item => item.id === id)
      
      await deleteClass(id)
      
      // Log activity
      try {
        await addActivity({
          entity_type: 'class',
          action_type: 'delete',
          details: {
            name: classToDelete?.name || 'Unknown',
            id: id
          }
        })
      } catch (error) {
        console.error('Failed to log activity:', error)
      }
      
      this.classes = this.classes.filter((item) => item.id !== id)
    },
  },
})
