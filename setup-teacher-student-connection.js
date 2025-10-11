import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTeacherStudentConnection() {
  try {
    console.log('🔧 Setting up Teacher-Student connection...\n');
    
    // Step 1: Create teacher assignments
    console.log('1️⃣ Creating teacher assignments...');
    const teacherAssignmentSQL = `
      DO $$
      DECLARE
          teacher_id_val UUID;
          subject_record RECORD;
          assignment_count INTEGER := 0;
      BEGIN
          SELECT id INTO teacher_id_val 
          FROM profiles 
          WHERE role = 'teacher' 
          LIMIT 1;
          
          IF teacher_id_val IS NULL THEN
              RAISE EXCEPTION 'No teachers found';
          END IF;
          
          FOR subject_record IN (
              SELECT id, name, code 
              FROM subjects 
              ORDER BY created_at 
              LIMIT 4
          ) LOOP
              INSERT INTO teacher_assignments (
                  teacher_id,
                  subject_id,
                  is_active,
                  assigned_date
              ) VALUES (
                  teacher_id_val,
                  subject_record.id,
                  TRUE,
                  NOW()
              ) ON CONFLICT (teacher_id, subject_id) DO UPDATE SET
                  is_active = TRUE,
                  updated_at = NOW();
              
              assignment_count := assignment_count + 1;
          END LOOP;
          
          RAISE NOTICE 'Created % teacher assignments', assignment_count;
      END $$;
    `;
    
    const { error: teacherError } = await supabase.rpc('exec_sql', { sql: teacherAssignmentSQL });
    if (teacherError) {
      console.log('   Using direct insert method...');
      // Fallback: Try direct assignment
      const { data: teacher } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'teacher')
        .single();
        
      const { data: subjects } = await supabase
        .from('subjects')
        .select('id')
        .limit(4);
        
      if (teacher && subjects) {
        const assignments = subjects.map(subject => ({
          teacher_id: teacher.id,
          subject_id: subject.id,
          is_active: true,
          assigned_date: new Date().toISOString()
        }));
        
        const { error } = await supabase
          .from('teacher_assignments')
          .upsert(assignments);
          
        if (!error) {
          console.log('   ✅ Teacher assignments created');
        }
      }
    } else {
      console.log('   ✅ Teacher assignments created');
    }
    
    // Step 2: Create student enrollments
    console.log('2️⃣ Creating student enrollments...');
    const { data: student } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'student')
      .single();
      
    const { data: subjects } = await supabase
      .from('subjects')
      .select('id')
      .limit(6);
      
    if (student && subjects) {
      const enrollments = subjects.map(subject => ({
        student_id: student.id,
        subject_id: subject.id,
        is_active: true,
        enrollment_date: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('subject_enrollments')
        .upsert(enrollments);
        
      if (!error) {
        console.log('   ✅ Student enrollments created');
      } else {
        console.log('   ❌ Error:', error.message);
      }
    }
    
    // Step 3: Verify the setup
    console.log('3️⃣ Verifying setup...');
    
    const { data: teacherAssignments } = await supabase
      .from('teacher_assignments')
      .select(`
        profiles:teacher_id(full_name),
        subjects:subject_id(name)
      `)
      .eq('is_active', true);
      
    console.log(`   📚 Teacher assignments: ${teacherAssignments?.length || 0}`);
    
    const { data: studentEnrollments } = await supabase
      .from('subject_enrollments')
      .select(`
        profiles:student_id(full_name),
        subjects:subject_id(name)
      `)
      .eq('is_active', true);
      
    console.log(`   👨‍🎓 Student enrollments: ${studentEnrollments?.length || 0}`);
    
    console.log('\n🎉 Setup complete! Teachers can now upload content and students can see it.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupTeacherStudentConnection();