import { defineStore } from "pinia";
import {
    getQuestions,
    getQuestion,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    restoreQuestion,
    cloneQuestionsFromTerm,
} from "../services/api/questions";
import {
    getTopics,
    createTopic,
    updateTopic,
    deleteTopic,
} from "../services/api/topic";
import {
    createQuestionOption,
    updateQuestionOption,
    deleteQuestionOption,
    reorderQuestionOptions,
} from "../services/api/questionoption";
import { useActivities } from "../composables/useActivities";

export const useTeachersQuestionsStore = defineStore(
    "teachers-questions",
    {
        state: () => ({
            questions: [],
            topics: [],
            totalQuestions: 0,
            totalTopics: 0,
            loading: false,
            filters: {
                subject: '',
                topic: '',
                class: '',
                type: '',
                difficulty: ''
            }
        }),

        getters: {
            filteredQuestions(state) {
                return state.questions.filter(question => {
                    return (
                        (!state.filters.subject || question.subject?.name?.toLowerCase().includes(state.filters.subject.toLowerCase())) &&
                        (!state.filters.topic || question.topic?.name?.toLowerCase().includes(state.filters.topic.toLowerCase())) &&
                        (!state.filters.class || question.class_level?.name?.toLowerCase().includes(state.filters.class.toLowerCase())) &&
                        (!state.filters.type || question.type?.toLowerCase().includes(state.filters.type.toLowerCase())) &&
                        (!state.filters.difficulty || question.difficulty?.toLowerCase().includes(state.filters.difficulty.toLowerCase()))
                    );
                });
            },
            questionTypes() {
                return ['Multiple Choice', 'True/False', 'Fill in the Blank', 'Essay', 'Match the Pairs', 'Ordering'];
            },
            difficulties() {
                return ['Easy', 'Medium', 'Hard'];
            }
        },

        actions: {
            async fetchQuestions(params = {}) {
                this.loading = true;
                try {
                    const response = await getQuestions(params);

                    if (Array.isArray(response)) {
                        this.questions = response || [];
                        this.totalQuestions = response.length || 0;
                    } else if (response && response.data) {
                        this.questions = response.data || [];
                        this.totalQuestions = response.total ?? response.data.length ?? 0;
                    } else {
                        this.questions = [];
                        this.totalQuestions = 0;
                    }
                } finally {
                    this.loading = false;
                }
            },

            async saveQuestion(payload) {
                const { addActivity } = useActivities();
                const isNew = !payload.id;
                const record = isNew ? await createQuestion(payload) : await updateQuestion(payload.id, payload);
                const exists = this.questions.some(
                    (item) => item.id === record.id,
                );

                try {
                    await addActivity({
                        entity_type: 'question',
                        action_type: isNew ? 'create' : 'update',
                        details: {
                            question: record.content?.substring(0, 100) || 'Unknown',
                            type: record.type,
                            id: record.id
                        }
                    });
                } catch (error) {
                    console.error('Failed to log activity:', error);
                }

                if (exists) {
                    this.questions = this.questions.map((item) =>
                        item.id === record.id ? record : item,
                    );
                } else {
                    this.questions = [record, ...this.questions];
                    this.totalQuestions++;
                }
            },

            async updateQuestion(id, payload) {
                const record = await updateQuestion(id, payload);
                this.questions = this.questions.map((item) =>
                    item.id === record.id ? record : item,
                );
                return record;
            },

            async createQuestion(payload) {
                const record = await createQuestion(payload);
                const options = Array.isArray(payload.options) ? payload.options : [];
                const savedOptions = [];
                for (const option of options) {
                    const content = String(option.content || option.text || '').trim();
                    if (!content) continue;
                    savedOptions.push(await createQuestionOption(record.id, {
                        content,
                        is_correct: Boolean(option.is_correct),
                    }));
                }
                if (savedOptions.length) record.options = savedOptions;
                this.questions = [record, ...this.questions];
                this.totalQuestions++;
                return record;
            },

            async deleteQuestion(id) {
                const { addActivity } = useActivities();
                const questionToDelete = this.questions.find(item => item.id === id);
                
                await deleteQuestion(id);
                
                try {
                    await addActivity({
                        entity_type: 'question',
                        action_type: 'delete',
                        details: {
                            question: questionToDelete?.content?.substring(0, 100) || 'Unknown',
                            type: questionToDelete?.type || 'Unknown',
                            id: id
                        }
                    });
                } catch (error) {
                    console.error('Failed to log activity:', error);
                }
                
                this.questions = this.questions.filter((item) => item.id !== id);
                this.totalQuestions--;
            },

            async restoreQuestion(id) {
                const { addActivity } = useActivities();
                const record = await restoreQuestion(id);
                const exists = this.questions.some((item) => item.id === record.id);

                try {
                    await addActivity({
                        entity_type: 'question',
                        action_type: 'restore',
                        details: {
                            question: record.content?.substring(0, 100) || 'Unknown',
                            type: record.type,
                            id: record.id
                        }
                    });
                } catch (error) {
                    console.error('Failed to log activity:', error);
                }

                if (!exists) {
                    this.questions = [record, ...this.questions];
                    this.totalQuestions++;
                }
            },

            async fetchTopics(params = {}) {
                try {
                    const response = await getTopics(params);
                    this.topics = Array.isArray(response) ? response : (response.data || []);
                    this.totalTopics = this.topics.length;
                } catch (error) {
                    console.error('Failed to fetch topics:', error);
                    this.topics = [];
                    this.totalTopics = 0;
                }
            },

            async saveTopic(payload) {
                const { addActivity } = useActivities();
                const isNew = !payload.id;
                const record = await createTopic(payload);
                const exists = this.topics.some((item) => item.id === record.id);

                try {
                    await addActivity({
                        entity_type: 'topic',
                        action_type: isNew ? 'create' : 'update',
                        details: {
                            name: record.name,
                            id: record.id
                        }
                    });
                } catch (error) {
                    console.error('Failed to log activity:', error);
                }

                if (exists) {
                    this.topics = this.topics.map((item) =>
                        item.id === record.id ? record : item,
                    );
                } else {
                    this.topics = [record, ...this.topics];
                    this.totalTopics++;
                }
            },

            async deleteTopic(id) {
                const { addActivity } = useActivities();
                const topicToDelete = this.topics.find(item => item.id === id);
                
                await deleteTopic(id);
                
                try {
                    await addActivity({
                        entity_type: 'topic',
                        action_type: 'delete',
                        details: {
                            name: topicToDelete?.name || 'Unknown',
                            id: id
                        }
                    });
                } catch (error) {
                    console.error('Failed to log activity:', error);
                }
                
                this.topics = this.topics.filter((item) => item.id !== id);
                this.totalTopics--;
            },

            setFilters(filters) {
                this.filters = { ...this.filters, ...filters };
            },

            clearFilters() {
                this.filters = {
                    subject: '',
                    topic: '',
                    class: '',
                    type: '',
                    difficulty: ''
                };
            },

            // Question Options Management
            async createOption(questionId, payload) {
                const record = await createQuestionOption(questionId, payload);
                
                // Update the question in the store with the new option
                const questionIndex = this.questions.findIndex(q => q.id === questionId);
                if (questionIndex !== -1) {
                    if (!this.questions[questionIndex].options) {
                        this.questions[questionIndex].options = [];
                    }
                    this.questions[questionIndex].options.push(record);
                }
                
                return record;
            },

            async updateOption(questionId, optionId, payload) {
                const record = await updateQuestionOption(questionId, optionId, payload);
                
                // Update the option in the question
                const questionIndex = this.questions.findIndex(q => q.id === questionId);
                if (questionIndex !== -1 && this.questions[questionIndex].options) {
                    const optionIndex = this.questions[questionIndex].options.findIndex(o => o.id === optionId);
                    if (optionIndex !== -1) {
                        this.questions[questionIndex].options[optionIndex] = record;
                    }
                }
                
                return record;
            },

            async deleteOption(questionId, optionId) {
                await deleteQuestionOption(questionId, optionId);
                
                // Remove the option from the question
                const questionIndex = this.questions.findIndex(q => q.id === questionId);
                if (questionIndex !== -1 && this.questions[questionIndex].options) {
                    this.questions[questionIndex].options = this.questions[questionIndex].options.filter(o => o.id !== optionId);
                }
            },

            async reorderOptions(questionId, payload) {
                const result = await reorderQuestionOptions(questionId, payload);
                
                // Refresh the question to get updated options order
                const updatedQuestion = await getQuestion(questionId);
                const questionIndex = this.questions.findIndex(q => q.id === questionId);
                if (questionIndex !== -1) {
                    this.questions[questionIndex] = updatedQuestion;
                }
                
                return result;
            },

            async cloneFromTerm(payload) {
                const result = await cloneQuestionsFromTerm(payload);
                if (Array.isArray(result)) {
                    this.questions = [...result, ...this.questions];
                    this.totalQuestions = this.questions.length;
                }
                return result;
            }
        },
    },
);
