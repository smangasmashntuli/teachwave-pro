// Grade Isolation Validation Utilities
// These functions help ensure that content, classes, and assignments are properly isolated by grade

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Validates that a user has access to a specific subject
 * Ensures grade-level isolation
 */
export async function validateSubjectAccess(userId: string, subjectId: string, userRole: 'teacher' | 'student'): Promise<boolean> {
  try {
    if (userRole === 'teacher') {
      // Check if teacher is assigned to this specific subject
      const { data: assignment } = await supabase
        .from('teacher_assignments')
        .select('id')
        .eq('teacher_id', userId)
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .single();
      
      return !!assignment;
    } else {
      // Check if student is enrolled in this specific subject
      const { data: enrollment } = await supabase
        .from('subject_enrollments')
        .select('id')
        .eq('student_id', userId)
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .single();
      
      return !!enrollment;
    }
  } catch (error) {
    console.error('Error validating subject access:', error);
    return false;
  }
}

/**
 * Gets the grade information for a subject
 * Used to display grade-specific warnings
 */
export async function getSubjectGrade(subjectId: string) {
  try {
    const { data: subject } = await (supabase as any)
      .from('subjects')
      .select(`
        name,
        code,
        grades(name)
      `)
      .eq('id', subjectId)
      .single();
    
    if (!subject) {
      return null;
    }
    
    return {
      subjectName: subject.name || null,
      subjectCode: subject.code || null,
      gradeName: subject.grades?.name || null
    };
  } catch (error) {
    console.error('Error fetching subject grade:', error);
    return null;
  }
}

/**
 * Validates content upload to ensure it's being uploaded to the correct grade
 */
export async function validateContentUpload(teacherId: string, subjectId: string): Promise<{ isValid: boolean; gradeInfo?: any }> {
  const hasAccess = await validateSubjectAccess(teacherId, subjectId, 'teacher');
  
  if (!hasAccess) {
    toast({
      title: "Access Denied",
      description: "You don't have permission to upload content to this subject.",
      variant: "destructive",
    });
    return { isValid: false };
  }

  const gradeInfo = await getSubjectGrade(subjectId);
  
  if (!gradeInfo?.gradeName) {
    toast({
      title: "Warning",
      description: "Could not determine grade level for this subject.",
      variant: "destructive",
    });
    return { isValid: false };
  }

  return { isValid: true, gradeInfo };
}

/**
 * Shows a grade isolation warning when creating content
 */
export function showGradeIsolationWarning(gradeName: string, subjectName: string) {
  return {
    title: `Grade-Specific Content Upload`,
    message: `You are uploading content to ${subjectName} for ${gradeName}. This content will ONLY be visible to students enrolled in ${gradeName}.`,
    type: 'info' as const
  };
}

/**
 * Validates that a virtual class is being created for the correct grade
 */
export async function validateClassCreation(teacherId: string, subjectId: string): Promise<boolean> {
  const validation = await validateContentUpload(teacherId, subjectId);
  
  if (validation.isValid && validation.gradeInfo) {
    const warning = showGradeIsolationWarning(validation.gradeInfo.gradeName, validation.gradeInfo.subjectName);
    
    toast({
      title: warning.title,
      description: warning.message,
    });
    
    return true;
  }
  
  return false;
}

/**
 * Gets all subjects a teacher teaches across different grades
 * Useful for showing grade-specific subject listings
 */
export async function getTeacherSubjectsByGrade(teacherId: string) {
  try {
    const { data: assignments } = await supabase
      .from('teacher_assignments')
      .select(`
        subjects(
          id,
          name,
          code,
          grades(id, name)
        )
      `)
      .eq('teacher_id', teacherId)
      .eq('is_active', true);

    // Group subjects by grade
    const subjectsByGrade: { [gradeName: string]: any[] } = {};
    
    assignments?.forEach((assignment: any) => {
      const subject = assignment.subjects;
      if (subject && subject.grades) {
        const gradeName = subject.grades.name;
        if (!subjectsByGrade[gradeName]) {
          subjectsByGrade[gradeName] = [];
        }
        subjectsByGrade[gradeName].push(subject);
      }
    });

    return subjectsByGrade;
  } catch (error) {
    console.error('Error fetching teacher subjects by grade:', error);
    return {};
  }
}

/**
 * Ensures that students only see content for their enrolled grade
 */
export async function getStudentSubjectsByGrade(studentId: string) {
  try {
    const { data: enrollments } = await supabase
      .from('subject_enrollments')
      .select(`
        subjects(
          id,
          name,
          code,
          grades(id, name)
        )
      `)
      .eq('student_id', studentId)
      .eq('is_active', true);

    // Group subjects by grade
    const subjectsByGrade: { [gradeName: string]: any[] } = {};
    
    enrollments?.forEach((enrollment: any) => {
      const subject = enrollment.subjects;
      if (subject && subject.grades) {
        const gradeName = subject.grades.name;
        if (!subjectsByGrade[gradeName]) {
          subjectsByGrade[gradeName] = [];
        }
        subjectsByGrade[gradeName].push(subject);
      }
    });

    return subjectsByGrade;
  } catch (error) {
    console.error('Error fetching student subjects by grade:', error);
    return {};
  }
}

/**
 * Debug function to check for potential grade isolation issues
 */
export async function debugGradeIsolation() {
  try {
    console.log('🔍 Debugging Grade Isolation...');

    // Check for subjects with similar names across grades
    const { data: subjects } = await supabase
      .from('subjects')
      .select(`
        id, name, code,
        grades(name)
      `);

    const subjectNames: { [name: string]: any[] } = {};
    subjects?.forEach((subject: any) => {
      if (!subjectNames[subject.name]) {
        subjectNames[subject.name] = [];
      }
      subjectNames[subject.name].push(subject);
    });

    console.log('📚 Subjects with multiple grade versions:');
    Object.entries(subjectNames).forEach(([name, subjects]) => {
      if (subjects.length > 1) {
        console.log(`   ${name}:`, subjects.map(s => `${s.code} (${s.grades?.name})`).join(', '));
      }
    });

    return subjectNames;
  } catch (error) {
    console.error('Error debugging grade isolation:', error);
    return {};
  }
}