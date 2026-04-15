import { defineStore } from "pinia";
import {
    getTeachers,
    saveTeacher,
    deleteTeacher,
} from "../services/api/teachers";

export const useSchoolAdminTeachersStore = defineStore(
    "school-admin-teachers",
    {
        state: () => ({
            teachers: [],
            totalTeachers: 0,
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
        },

        actions: {
            async fetchTeachers(params = {}) {
                this.loading = true;
                try {
                    const response = await getTeachers(params);
                    // Keep some debug information from both branches so it's easier to troubleshoot API shape issues
                    console.log("Teachers API response:", response);
                    console.log("Teachers data type:", typeof response);
                    console.log(
                        "Teachers data is array:",
                        Array.isArray(response),
                    );

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
                const record = await saveTeacher(payload);
                const exists = this.teachers.some(
                    (item) => item.id === record.id,
                );

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

            async deleteTeacher(id) {
                await deleteTeacher(id);
                this.teachers = this.teachers.filter((item) => item.id !== id);
                this.totalTeachers--;
            },
        },
    },
);
