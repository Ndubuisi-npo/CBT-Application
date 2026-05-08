import { computed } from 'vue'
import { getAuthUser, getAuthRole } from '../../../js/lib/auth'

export function usePermissions() {
  const user = computed(() => getAuthUser())
  const role = computed(() => getAuthRole())

  /**
   * Check if current user can edit questions for a specific subject
   * Class Teacher: Can edit all subjects their class takes
   * Subject Teacher: Can only edit their assigned subject(s)
   */
  const canEditSubject = (subjectName) => {
    if (!user.value || !subjectName) return false

    // If user is a subject teacher, check if this is their assigned subject
    if (user.value?.assigned_subjects && user.value.assigned_subjects.length > 0) {
      return user.value.assigned_subjects.some(
        assignedSubject => assignedSubject.name?.toLowerCase() === subjectName.toLowerCase()
      )
    }

    // If user is a class teacher, they can edit all subjects their class takes
    if (user.value?.class_assignments && user.value.class_assignments.length > 0) {
      // Check if any of their assigned classes include this subject
      return user.value.class_assignments.some(classAssignment => 
        classAssignment.subjects?.some(subject => 
          subject.name?.toLowerCase() === subjectName.toLowerCase()
        )
      )
    }

    return false
  }

  /**
   * Check if current user can create questions for a specific subject
   * Only subject teachers can create questions for their assigned subjects
   */
  const canCreateQuestionsForSubject = (subjectName) => {
    if (!user.value || !subjectName) return false

    // Only subject teachers can create questions
    if (user.value?.assigned_subjects && user.value.assigned_subjects.length > 0) {
      return user.value.assigned_subjects.some(
        assignedSubject => assignedSubject.name?.toLowerCase() === subjectName.toLowerCase()
      )
    }

    return false
  }

  /**
   * Get user type for UI display
   */
  const userType = computed(() => {
    if (!user.value) return 'unknown'
    
    if (user.value?.assigned_subjects && user.value.assigned_subjects.length > 0) {
      return 'subject_teacher'
    }
    
    if (user.value?.class_assignments && user.value.class_assignments.length > 0) {
      return 'class_teacher'
    }
    
    return 'unknown'
  })

  /**
   * Get user's assigned subjects (for subject teachers)
   */
  const assignedSubjects = computed(() => {
    return user.value?.assigned_subjects || []
  })

  /**
   * Get user's class assignments (for class teachers)
   */
  const classAssignments = computed(() => {
    return user.value?.class_assignments || []
  })

  /**
   * Check if user is a subject teacher
   */
  const isSubjectTeacher = computed(() => {
    return userType.value === 'subject_teacher'
  })

  /**
   * Check if user is a class teacher
   */
  const isClassTeacher = computed(() => {
    return userType.value === 'class_teacher'
  })

  return {
    user,
    role,
    userType,
    assignedSubjects,
    classAssignments,
    isSubjectTeacher,
    isClassTeacher,
    canEditSubject,
    canCreateQuestionsForSubject
  }
}
