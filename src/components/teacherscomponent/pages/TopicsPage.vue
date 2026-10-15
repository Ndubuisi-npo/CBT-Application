<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <SectionCard title="Topics Management" subtitle="Create and manage topics for your questions.">
      <template #header>
        <AppButton @click="openCreateModal()" :icon="Plus" text="Create Topic" variant="primary" size="base" />
      </template>
      
      <!-- Search and Filter -->
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <div class="flex-1">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search topics..."
              class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </SectionCard>
</div>

    <!-- Topics Grid -->
    <div v-if="questionsStore.loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="space-y-4">
          <div class="h-6 bg-slate-100 rounded animate-pulse"></div>
          <div class="h-4 bg-slate-100 rounded animate-pulse"></div>
          <div class="h-4 bg-slate-100 rounded animate-pulse w-3/4"></div>
          <div class="flex gap-2">
            <div class="h-8 bg-slate-100 rounded animate-pulse flex-1"></div>
            <div class="h-8 bg-slate-100 rounded animate-pulse flex-1"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="filteredTopics.length === 0" class="text-center py-12">
      <div class="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Tag class="h-12 w-12 text-slate-400" />
      </div>
      <h3 class="text-lg font-medium text-slate-900 mb-2">No topics found</h3>
      <p class="text-slate-500 mb-6">{{ searchQuery ? 'Try adjusting your search terms' : 'Get started by organizing your content with topic management' }}</p>
      <AppButton v-if="!searchQuery" @click="openCreateModal()" :icon="Plus" text="Add Your First Topic" variant="primary" size="base" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="topic in filteredTopics" :key="topic.id" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">{{ topic.name }}</h3>
            <p class="text-sm text-slate-600 mt-1">{{ topic.description || 'No description available' }}</p>
          </div>
          
          <div class="flex items-center justify-between text-sm text-slate-500">
            <span>{{ getQuestionCount(topic.id) }} questions</span>
            <span>{{ formatDate(topic.created_at) }}</span>
          </div>
          
          <div class="flex gap-2">
            <AppButton @click="editTopic(topic)" :icon="Edit" text="Edit" variant="outline" size="sm" full-width />
            <AppButton @click="deleteTopic(topic.id)" :icon="Trash2" text="Delete" variant="outline" size="sm" full-width />
          </div>
        </div>
      </div>
    </div>

    <!-- Topic Modal -->
    <TopicModal 
      :show="showModal" 
      :topic="selectedTopic"
      :availableTopics="questionsStore.topics"
      @close="closeModal"
      @submit="submitTopic"
    />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Search, Tag, Edit, Trash2 } from 'lucide-vue-next'
import SectionCard from '../components/SectionCard.vue'
import AppButton from '../../shared/AppButton.vue'
import TopicModal from '../components/TopicModal.vue'
import { useTeachersQuestionsStore } from '../stores/questions'

const questionsStore = useTeachersQuestionsStore()

const showModal = ref(false)
const selectedTopic = ref(null)
const searchQuery = ref('')

const filteredTopics = computed(() => {
  if (!searchQuery.value) return questionsStore.topics
  
  return questionsStore.topics.filter(topic =>
    topic.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    (topic.description && topic.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
})

const getQuestionCount = (topicId) => {
  return questionsStore.questions.filter(q => q.topic_id === topicId).length
}

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString()
}

const openCreateModal = () => {
  selectedTopic.value = null
  showModal.value = true
}

const openEditModal = (topic) => {
  selectedTopic.value = topic
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedTopic.value = null
}

const submitTopic = async (topicData) => {
  try {
    if (topicData.id) {
      // Update existing topic
      await questionsStore.updateTopic(topicData.id, topicData)
    } else {
      // Create new topic
      await questionsStore.createTopic(topicData)
    }
    closeModal()
    // Refresh topics list
    fetchTopics()
  } catch (error) {
    console.error('Failed to save topic:', error)
  }
}

const deleteTopic = async (id) => {
  if (!confirm('Are you sure you want to delete this topic? This action cannot be undone.')) return
  
  try {
    await questionsStore.deleteTopic(id)
  } catch (error) {
    console.error('Failed to delete topic:', error)
  }
}

onMounted(() => {
  questionsStore.fetchTopics()
})
</script>
