import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createStudentEnrollments() {
  try {
    console.log('🔧 Creating student enrollments...\n');
    
    // Get the student
    const { data: students } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'student');
    
    // Get some subjects to enroll the student in (let's pick first 5-10)
    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, name, code')
      .limit(10);
    
    if (!students || students.length === 0) {
      console.log('❌ No students found');
      return;
    }
    
    if (!subjects || subjects.length === 0) {
      console.log('❌ No subjects found');
      return;
    }
    
    const student = students[0];
    console.log(`📚 Enrolling ${student.full_name} in subjects...`);
    
    // Create enrollments for the first 6 subjects (reasonable course load)
    const enrollmentsToCreate = subjects.slice(0, 6).map(subject => ({
      student_id: student.id,
      subject_id: subject.id,
      is_active: true,
      enrollment_date: new Date().toISOString()
    }));
    
    const { data: enrollments, error } = await supabase
      .from('subject_enrollments')
      .insert(enrollmentsToCreate)
      .select(`
        id,
        subjects:subject_id(name, code)
      `);
    
    if (error) {
      console.error('❌ Error creating enrollments:', error);
      return;
    }
    
    console.log(`✅ Successfully enrolled ${student.full_name} in ${enrollments.length} subjects:`);
    enrollments.forEach((enrollment, i) => {
      console.log(`   ${i+1}. ${enrollment.subjects.name} (${enrollment.subjects.code})`);
    });
    
    console.log('\n🎉 Student enrollments created successfully!');
    
  } catch (error) {
    console.error('❌ Failed to create enrollments:', error);
  }
}

createStudentEnrollments();