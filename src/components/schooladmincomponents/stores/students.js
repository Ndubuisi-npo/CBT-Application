import { defineStore } from "pinia";
import {
    getStudents,
    saveStudent,
    updateStudent,
    createStudent,
    revokeStudent,
    deleteStudent,
    toggleActive,
    resetPassword,
    restoreStudent,
} from "../services/api/students";
import { useActivities } from "../composables/useActivities";
import { useSchoolAdminUiStore } from "./ui";

export const useSchoolAdminStudentsStore = defineStore(
    "school-admin-students",
    {
        state: () => ({
            students: [],
            archivedStudents: [],
            totalStudents: 0,
            totalArchivedStudents: 0,
            loading: false,
        }),

        getters: {
            studentNames(state) {
                return state.students.map((student) => {
                    const first = student.first_name || "";
                    const last = student.last_name || "";
                    return `${first} ${last}`.trim();
                });
            },
            archivedStudentNames(state) {
                return state.archivedStudents.map((student) => {
                    const first = student.first_name || "";
                    const last = student.last_name || "";
                    return `${first} ${last}`.trim();
                });
            },
        },

        actions: {
            async fetchStudents(params = {}) {
                this.loading = true;
                try {
                    const response = await getStudents({ status: 'active', ...params });

                    // Support either an array response (legacy/simple) or an object with `data` and `total`
                    if (Array.isArray(response)) {
                        this.students = response || [];
                        this.totalStudents = response.length || 0;
                    } else if (response && response.data) {
                        this.students = response.data || [];
                        // prefer explicit total, fall back to data length if total is not provided
                        this.totalStudents =
                            response.total ??
                            (Array.isArray(response.data)
                                ? response.data.length
                                : 0);
                    } else {
                        // Unknown shape — reset to sensible defaults
                        this.students = [];
                        this.totalStudents = 0;
                    }
                } finally {
                    this.loading = false;
                }
            },

            async saveStudent(payload) {
                const { addActivity } = useActivities();
                const isNew = !payload.id;
                const record = await saveStudent(payload);
                const exists = this.students.some(
                    (item) => item.id === record.id,
                );

                // Log activity
                try {
                    await addActivity({
                        entity_type: 'student',
                        action_type: isNew ? 'create' : 'update',
                        details: {
                            name: `${record.first_name || ''} ${record.last_name || ''}`.trim() || 'Unknown',
                            id: record.id
                        }
                    });
                } catch (error) {
                    console.error('Failed to log activity:', error);
                }

                if (exists) {
                    // Update existing
                    this.students = this.students.map((item) =>
                        item.id === record.id ? record : item,
                    );
                } else {
                    // Add new
                    this.students = [record, ...this.students];
                    this.totalStudents++;
                }
            },

            async updateStudent(id, payload) {
                const record = await updateStudent(id, payload);
                this.students = this.students.map((item) =>
                    item.id === record.id ? record : item,
                );
                return record;
            },

            async createStudent(payload) {
                const record = await createStudent(payload);
                this.students = [record, ...this.students];
                this.totalStudents++;
                return record;
            },

            async revokeStudent(id) {
                const { addActivity } = useActivities();
                const student = this.students.find((s) => s.id === id);
                if (student) {
                    await revokeStudent(id);
                    
                    // Log activity
                    try {
                        await addActivity({
                            entity_type: 'student',
                            action_type: 'revoke',
                            details: {
                                name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown',
                                id: id
                            }
                        });
                    } catch (error) {
                        console.error('Failed to log activity:', error);
                    }
                    
                    // Move student from active to archived
                    const wasArchived = this.archivedStudents.some((item) => item.id === id);
                    this.students = this.students.filter((item) => item.id !== id);
                    this.totalStudents = Math.max(0, this.totalStudents - 1);
                    this.archivedStudents = [student, ...this.archivedStudents.filter((item) => item.id !== id)];
                    if (!wasArchived) {
                        this.totalArchivedStudents++;
                    }
                }
            },

            async fetchArchivedStudents(params = {}) {
                this.loading = true;
                try {
                    const response = await getStudents({ ...params, status: 'archived' });
                    
                    if (Array.isArray(response)) {
                        this.archivedStudents = response || [];
                        this.totalArchivedStudents = response.length || 0;
                    } else if (response && response.data) {
                        this.archivedStudents = response.data || [];
                        this.totalArchivedStudents = response.total ?? (Array.isArray(response.data) ? response.data.length : 0);
                    } else {
                        this.archivedStudents = [];
                        this.totalArchivedStudents = 0;
                    }
                } finally {
                    this.loading = false;
                }
            },

            async deleteStudentFromStore(id) {
                const { addActivity } = useActivities();
                const studentToDelete = this.students.find(item => item.id === id) || this.archivedStudents.find(item => item.id === id);
                
                await deleteStudent(id);
                
                // Log activity
                try {
                    await addActivity({
                        entity_type: 'student',
                        action_type: 'delete',
                        details: {
                            name: studentToDelete ? `${studentToDelete.first_name || ''} ${studentToDelete.last_name || ''}`.trim() : 'Unknown',
                            id: id
                        }
                    });
                } catch (error) {
                    console.error('Failed to log activity:', error);
                }
                
                if (this.students.some((item) => item.id === id)) {
                    this.students = this.students.filter((item) => item.id !== id);
                    this.totalStudents--;
                }

                if (this.archivedStudents.some((item) => item.id === id)) {
                    this.archivedStudents = this.archivedStudents.filter((item) => item.id !== id);
                    this.totalArchivedStudents--;
                }
            },
            async toggleActive(id) {
                const uiStore = useSchoolAdminUiStore();
                try {
                    await toggleActive(id);
                    uiStore.addToast({
                        title: "Student status toggled",
                        message: "Student active status has been updated.",
                        variant: "success",
                    });
                } catch (error) {
                    uiStore.addToast({
                        title: "Error",
                        message: error.message || "Failed to toggle student status.",
                        variant: "error",
                    });
                }
            },
            async resetPassword(id) {
                const uiStore = useSchoolAdminUiStore();
                try {
                    await resetPassword(id);
                    uiStore.addToast({
                        title: "Password reset",
                        message: "Student password has been reset successfully.",
                        variant: "success",
                    });
                } catch (error) {
                    uiStore.addToast({
                        title: "Error",
                        message: error.message || "Failed to reset student password.",
                        variant: "error",
                    });
                }
            },
            async restoreStudent(id) {
                const { addActivity } = useActivities();
                try {
                    await restoreStudent(id);
                    // Move student from archived to active
                    const student = this.archivedStudents.find(s => s.id === id);
                    if (student) {
                        this.archivedStudents = this.archivedStudents.filter(item => item.id !== id);
                        this.totalArchivedStudents = Math.max(0, this.totalArchivedStudents - 1);
                        const wasActive = this.students.some(item => item.id === id);
                        this.students = [student, ...this.students.filter(item => item.id !== id)];
                        if (!wasActive) {
                            this.totalStudents++;
                        }
                        
                        // Log activity
                        try {
                            await addActivity({
                                entity_type: 'student',
                                action_type: 'activate',
                                details: {
                                    name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown',
                                    id: id
                                }
                            });
                        } catch (error) {
                            console.error('Failed to log activity:', error);
                        }
                    }
                } catch (error) {
                    throw error;
                }
            },
        },
    },
);
