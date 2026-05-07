import { defineStore } from "pinia";
import {
    getExams,
    createExam,
    updateExam,
    deleteExam,
    publishExam,
    unpublishExam,
    generateQuestions,
    getExamResults,
} from "../services/api/exams";
import { useActivities } from "../composables/useActivities";

export const useTeachersExamsStore = defineStore(
    "teachers-exams",
    {
        state: () => ({
            exams: [],
            totalExams: 0,
            loading: false,
            examWizard: {
                step: 1,
                data: {
                    title: '',
                    subject: '',
                    class: '',
                    type: '',
                    term: '',
                    duration: 60,
                    passMark: 50,
                    randomization: false,
                    showResults: true,
                    questions: []
                }
            },
            filters: {
                status: '',
                subject: '',
                class: ''
            }
        }),

        getters: {
            filteredExams(state) {
                return state.exams.filter(exam => {
                    return (
                        (!state.filters.status || exam.status?.toLowerCase().includes(state.filters.status.toLowerCase())) &&
                        (!state.filters.subject || exam.subject?.toLowerCase().includes(state.filters.subject.toLowerCase())) &&
                        (!state.filters.class || exam.class?.toLowerCase().includes(state.filters.class.toLowerCase()))
                    );
                });
            },
            examTypes() {
                return ['Multiple Choice', 'Essay', 'Mixed', 'Practical'];
            },
            examStatuses() {
                return ['Draft', 'Published', 'In Progress', 'Completed'];
            }
        },

        actions: {
            async fetchExams(params = {}) {
                this.loading = true;
                try {
                    const response = await getExams(params);

                    if (Array.isArray(response)) {
                        this.exams = response || [];
                        this.totalExams = response.length || 0;
                    } else if (response && response.data) {
                        this.exams = response.data || [];
                        this.totalExams = response.total ?? response.data.length ?? 0;
                    } else {
                        this.exams = [];
                        this.totalExams = 0;
                    }
                } finally {
                    this.loading = false;
                }
            },

            async saveExam(payload) {
                const { addActivity } = useActivities();
                const isNew = !payload.id;
                const record = await createExam(payload);
                const exists = this.exams.some(
                    (item) => item.id === record.id,
                );

                try {
                    await addActivity({
                        entity_type: 'exam',
                        action_type: isNew ? 'create' : 'update',
                        details: {
                            title: record.title,
                            subject: record.subject,
                            id: record.id
                        }
                    });
                } catch (error) {
                    console.error('Failed to log activity:', error);
                }

                if (exists) {
                    this.exams = this.exams.map((item) =>
                        item.id === record.id ? record : item,
                    );
                } else {
                    this.exams = [record, ...this.exams];
                    this.totalExams++;
                }
            },

            async updateExam(id, payload) {
                const record = await updateExam(id, payload);
                this.exams = this.exams.map((item) =>
                    item.id === record.id ? record : item,
                );
                return record;
            },

            async createExam(payload) {
                const record = await createExam(payload);
                this.exams = [record, ...this.exams];
                this.totalExams++;
                return record;
            },

            async deleteExam(id) {
                const { addActivity } = useActivities();
                const examToDelete = this.exams.find(item => item.id === id);
                
                await deleteExam(id);
                
                try {
                    await addActivity({
                        entity_type: 'exam',
                        action_type: 'delete',
                        details: {
                            title: examToDelete?.title || 'Unknown',
                            id: id
                        }
                    });
                } catch (error) {
                    console.error('Failed to log activity:', error);
                }
                
                this.exams = this.exams.filter((item) => item.id !== id);
                this.totalExams--;
            },

            async publishExam(id) {
                const { addActivity } = useActivities();
                const exam = this.exams.find(item => item.id === id);
                
                await publishExam(id);
                
                try {
                    await addActivity({
                        entity_type: 'exam',
                        action_type: 'publish',
                        details: {
                            title: exam?.title || 'Unknown',
                            id: id
                        }
                    });
                } catch (error) {
                    console.error('Failed to log activity:', error);
                }
                
                // Update exam status in store
                this.exams = this.exams.map(item => 
                    item.id === id ? { ...item, status: 'Published' } : item
                );
            },

            async unpublishExam(id) {
                const { addActivity } = useActivities();
                const exam = this.exams.find(item => item.id === id);
                
                await unpublishExam(id);
                
                try {
                    await addActivity({
                        entity_type: 'exam',
                        action_type: 'unpublish',
                        details: {
                            title: exam?.title || 'Unknown',
                            id: id
                        }
                    });
                } catch (error) {
                    console.error('Failed to log activity:', error);
                }
                
                // Update exam status in store
                this.exams = this.exams.map(item => 
                    item.id === id ? { ...item, status: 'Draft' } : item
                );
            },

            async generateQuestions(payload) {
                const questions = await generateQuestions(payload);
                return questions;
            },

            async fetchExamResults(id) {
                try {
                    const results = await getExamResults(id);
                    return results;
                } catch (error) {
                    console.error('Failed to fetch exam results:', error);
                    return null;
                }
            },

            setWizardStep(step) {
                this.examWizard.step = step;
            },

            updateWizardData(data) {
                this.examWizard.data = { ...this.examWizard.data, ...data };
            },

            resetWizard() {
                this.examWizard.step = 1;
                this.examWizard.data = {
                    title: '',
                    subject: '',
                    class: '',
                    type: '',
                    term: '',
                    duration: 60,
                    passMark: 50,
                    randomization: false,
                    showResults: true,
                    questions: []
                };
            },

            setFilters(filters) {
                this.filters = { ...this.filters, ...filters };
            },

            clearFilters() {
                this.filters = {
                    status: '',
                    subject: '',
                    class: ''
                };
            }
        },
    },
);
