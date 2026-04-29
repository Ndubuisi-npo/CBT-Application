import { defineStore } from "pinia";
import {
    getTeachers,
    saveTeacher,
    updateTeacher,
    createTeacher,
    revokeTeacher,
    deleteTeacher,
    toggleActive,
    resetPassword,
    restoreTeacher,
} from "../services/api/teachers";
import { useActivities } from "../composables/useActivities";

export const useSchoolAdminTeachersStore = defineStore(
    "school-admin-teachers",
    {
        state: () => ({
            teachers: [],
            archivedTeachers: [],
            totalTeachers: 0,
            totalArchivedTeachers: 0,
            loading: false,
        }),

        getters: {
            teacherNames(state) {
                return state.teachers.map((teacher) => {
                    const first = teacher.first_name || "";
                    const last = teacher.last_name || "";
                    return `${first} ${last}`.trim();
                });
            },
            archivedTeacherNames(state) {
                return state.archivedTeachers.map((teacher) => {
                    const first = teacher.first_name || "";
                    const last = teacher.last_name || "";
                    return `${first} ${last}`.trim();
                });
            },
        },

        actions: {
            async fetchTeachers(params = {}) {
                this.loading = true;
                try {
                    const response = await getTeachers(params);

                    // Support either an array response (legacy/simple) or an object with `data` and `total`
                    if (Array.isArray(response)) {
                        this.teachers = response || [];
                        this.totalTeachers = response.length || 0;
                    } else if (response && response.data) {
                        this.teachers = response.data || [];
                        // prefer explicit total, fall back to data length if total is not provided
                        this.totalTeachers =
                            response.total ??
                            (Array.isArray(response.data)
                                ? response.data.length
                                : 0);
                    } else {
                        // Unknown shape — reset to sensible defaults
                        this.teachers = [];
                        this.totalTeachers = 0;
                    }
                } finally {
                    this.loading = false;
                }
            },

            async saveTeacher(payload) {
                const { addActivity } = useActivities();
                const isNew = !payload.id;
                const record = await saveTeacher(payload);
                const exists = this.teachers.some(
                    (item) => item.id === record.id,
                );

                // Log activity
                try {
                    await addActivity({
                        entity_type: 'teacher',
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
                    this.teachers = this.teachers.map((item) =>
                        item.id === record.id ? record : item,
                    );
                } else {
                    // Add new
                    this.teachers = [record, ...this.teachers];
                    this.totalTeachers++;
                }
            },

            async updateTeacher(id, payload) {
                const record = await updateTeacher(id, payload);
                this.teachers = this.teachers.map((item) =>
                    item.id === record.id ? record : item,
                );
                return record;
            },

            async createTeacher(payload) {
                const record = await createTeacher(payload);
                this.teachers = [record, ...this.teachers];
                this.totalTeachers++;
                return record;
            },

            async revokeTeacher(id) {
                const { addActivity } = useActivities();
                const teacher = this.teachers.find((t) => t.id === id);
                if (teacher) {
                    await revokeTeacher(id);
                    
                    // Log activity
                    try {
                        await addActivity({
                            entity_type: 'teacher',
                            action_type: 'revoke',
                            details: {
                                name: `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || 'Unknown',
                                id: id
                            }
                        });
                    } catch (error) {
                        console.error('Failed to log activity:', error);
                    }
                    
                    // Move teacher from active to archived
                    this.teachers = this.teachers.filter((item) => item.id !== id);
                    this.totalTeachers--;
                    this.archivedTeachers = [teacher, ...this.archivedTeachers];
                    this.totalArchivedTeachers++;
                }
            },

            async fetchArchivedTeachers(params = {}) {
                this.loading = true;
                try {
                    const response = await getTeachers({ ...params, archived: true });
                    
                    if (Array.isArray(response)) {
                        this.archivedTeachers = response || [];
                        this.totalArchivedTeachers = response.length || 0;
                    } else if (response && response.data) {
                        this.archivedTeachers = response.data || [];
                        this.totalArchivedTeachers = response.total ?? (Array.isArray(response.data) ? response.data.length : 0);
                    } else {
                        this.archivedTeachers = [];
                        this.totalArchivedTeachers = 0;
                    }
                } finally {
                    this.loading = false;
                }
            },

            async deleteTeacherFromStore(id) {
                const { addActivity } = useActivities();
                const teacherToDelete = this.teachers.find(item => item.id === id);
                
                await deleteTeacher(id);
                
                // Log activity
                try {
                    await addActivity({
                        entity_type: 'teacher',
                        action_type: 'delete',
                        details: {
                            name: teacherToDelete ? `${teacherToDelete.first_name || ''} ${teacherToDelete.last_name || ''}`.trim() : 'Unknown',
                            id: id
                        }
                    });
                } catch (error) {
                    console.error('Failed to log activity:', error);
                }
                
                this.teachers = this.teachers.filter((item) => item.id !== id);
                this.totalTeachers--;
            },
            async toggleActive(id) {
                try {
                    await toggleActive(id);
                    uiStore.addToast({
                        title: "Teacher status toggled",
                        message: "Teacher active status has been updated.",
                        variant: "success",
                    });
                } catch (error) {
                    uiStore.addToast({
                        title: "Error",
                        message: error.message || "Failed to toggle teacher status.",
                        variant: "error",
                    });
                }
            },
            async resetPassword(id) {
                try {
                    await resetPassword(id);
                    uiStore.addToast({
                        title: "Password reset",
                        message: "Teacher password has been reset successfully.",
                        variant: "success",
                    });
                } catch (error) {
                    uiStore.addToast({
                        title: "Error",
                        message: error.message || "Failed to reset teacher password.",
                        variant: "error",
                    });
                }
            },
            async restoreTeacher(id) {
                const { addActivity } = useActivities();
                try {
                    await restoreTeacher(id);
                    // Move teacher from archived to active
                    const teacher = this.archivedTeachers.find(t => t.id === id);
                    if (teacher) {
                        this.archivedTeachers = this.archivedTeachers.filter(item => item.id !== id);
                        this.totalArchivedTeachers--;
                        this.teachers = [teacher, ...this.teachers];
                        this.totalTeachers++;
                        
                        // Log activity
                        try {
                            await addActivity({
                                entity_type: 'teacher',
                                action_type: 'activate',
                                details: {
                                    name: `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || 'Unknown',
                                    id: id
                                }
                            });
                        } catch (error) {
                            console.error('Failed to log activity:', error);
                        }
                    }
                    uiStore.addToast({
                        title: "Teacher restored",
                        message: "Teacher has been restored successfully.",
                        variant: "success",
                    });
                } catch (error) {
                    uiStore.addToast({
                        title: "Error",
                        message: error.message || "Failed to restore teacher.",
                        variant: "error",
                    });
                }
            },
        },
    },
);
