import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTeacherStudentConnection() {
  try {
    console.log('🔍 Debugging Teacher-Student Content Visibility...\n');
    
    // 1. Check if we have any students
    console.log('1️⃣ CHECKING STUDENTS:');
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('role', 'student');
    
    if (studentsError) throw studentsError;
    console.log(`   📊 Found ${students?.length || 0} students`);
    students?.slice(0, 3).forEach((student, i) => 
      console.log(`   ${i+1}. ${student.full_name} (${student.email})`)
    );
    
    // 2. Check if we have any teachers
    console.log('\n2️⃣ CHECKING TEACHERS:');
    const { data: teachers, error: teachersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('role', 'teacher');
    
    if (teachersError) throw teachersError;
    console.log(`   📊 Found ${teachers?.length || 0} teachers`);
    teachers?.slice(0, 3).forEach((teacher, i) => 
      console.log(`   ${i+1}. ${teacher.full_name} (${teacher.email})`)
    );
    
    // 3. Check subjects
    console.log('\n3️⃣ CHECKING SUBJECTS:');
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('id, name, code');
    
    if (subjectsError) throw subjectsError;
    console.log(`   📊 Found ${subjects?.length || 0} subjects`);
    subjects?.slice(0, 5).forEach((subject, i) => 
      console.log(`   ${i+1}. ${subject.name} (${subject.code})`)
    );
    
    // 4. Check student enrollments
    console.log('\n4️⃣ CHECKING STUDENT ENROLLMENTS:');
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('subject_enrollments')
      .select(`
        id,
        student_id,
        subject_id,
        is_active,
        profiles:student_id(full_name, email),
        subjects:subject_id(name, code)
      `);
    
    if (enrollmentsError) throw enrollmentsError;
    console.log(`   📊 Found ${enrollments?.length || 0} subject enrollments`);
    enrollments?.slice(0, 5).forEach((enrollment, i) => 
      console.log(`   ${i+1}. ${enrollment.profiles?.full_name} → ${enrollment.subjects?.name} (Active: ${enrollment.is_active})`)
    );
    
    // 5. Check assignments created by teachers
    console.log('\n5️⃣ CHECKING ASSIGNMENTS:');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        id,
        title,
        subject_id,
        teacher_id,
        is_published,
        created_at,
        subjects:subject_id(name),
        profiles:teacher_id(full_name)
      `);
    
    if (assignmentsError) throw assignmentsError;
    console.log(`   📊 Found ${assignments?.length || 0} assignments`);
    assignments?.forEach((assignment, i) => 
      console.log(`   ${i+1}. "${assignment.title}" by ${assignment.profiles?.full_name} (${assignment.subjects?.name}) - Published: ${assignment.is_published}`)
    );
    
    // 6. Check learning content
    console.log('\n6️⃣ CHECKING LEARNING CONTENT:');
    const { data: content, error: contentError } = await supabase
      .from('learning_content')
      .select(`
        id,
        title,
        subject_id,
        is_published,
        content_type,
        subjects:subject_id(name)
      `);
    
    if (contentError) throw contentError;
    console.log(`   📊 Found ${content?.length || 0} learning materials`);
    content?.forEach((item, i) => 
      console.log(`   ${i+1}. "${item.title}" (${item.content_type}) - ${item.subjects?.name} - Published: ${item.is_published}`)
    );
    
    // 7. Test a specific student's view
    if (students && students.length > 0 && enrollments && enrollments.length > 0) {
      const testStudent = students[0];
      console.log(`\n7️⃣ TESTING STUDENT VIEW (${testStudent.full_name}):`);
      
      // Get student's enrolled subjects
      const { data: studentSubjects } = await supabase
        .from('subject_enrollments')
        .select('subject_id')
        .eq('student_id', testStudent.id)
        .eq('is_active', true);
      
      const subjectIds = studentSubjects?.map(se => se.subject_id) || [];
      console.log(`   📚 Student enrolled in ${subjectIds.length} subjects`);
      
      if (subjectIds.length > 0) {
        // Get assignments visible to this student
        const { data: visibleAssignments } = await supabase
          .from('assignments')
          .select('id, title, is_published')
          .in('subject_id', subjectIds)
          .eq('is_published', true);
        
        console.log(`   📝 Student can see ${visibleAssignments?.length || 0} published assignments`);
        
        // Get content visible to this student
        const { data: visibleContent } = await supabase
          .from('learning_content')
          .select('id, title, is_published')
          .in('subject_id', subjectIds)
          .eq('is_published', true);
        
        console.log(`   📖 Student can see ${visibleContent?.length || 0} published materials`);
      }
    }
    
    console.log('\n✅ Debug complete!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugTeacherStudentConnection();