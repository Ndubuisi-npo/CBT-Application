import { defineStore } from 'pinia'
import { getClasses, saveClass, deleteClass } from '../services/api/classes'

// Helper function to convert level ID to name
function getLevelName(levelId) {
  const levelMap = {
    1: 'JSS1',
    2: 'JSS2',
    3: 'JSS3',
    4: 'SS1',
    5: 'SS2',
    6: 'SS3',
  }
  return levelMap[levelId] || 'Unknown'
}

// Helper function to convert level name to ID
function getLevelId(levelName) {
  const levelMap = {
    'JSS1': 1,
    'JSS2': 2,
    'JSS3': 3,
    'SS1': 4,
    'SS2': 5,
    'SS3': 6,
  }
  return levelMap[levelName] || 1
}

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
        console.log('Fetched classes:', rawClasses)
        this.classes = rawClasses.map(cls => ({
          ...cls,
          level: getLevelName(cls.level_id),
        }))
      } catch (error) {
        console.error('Failed to fetch classes:', error)
        this.classes = []
      } finally {
        this.loading = false
      }
    },
    async saveClass(payload) {
      const record = await saveClass({
        ...payload,
        level_id: getLevelId(payload.level),
      })
      const processedRecord = {
        ...record,
        level: getLevelName(record.level_id),
      }
      const exists = this.classes.some((item) => item.id === processedRecord.id)
      this.classes = exists
        ? this.classes.map((item) => (item.id === processedRecord.id ? processedRecord : item))
        : [processedRecord, ...this.classes]
    },
    async deleteClass(id) {
      await deleteClass(id)
      this.classes = this.classes.filter((item) => item.id !== id)
    },
  },
})
