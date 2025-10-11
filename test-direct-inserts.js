import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDirectInserts() {
  try {
    console.log('🧪 Testing direct database operations...\n');
    
    // Get student and teacher IDs
    const { data: student } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'student')
      .single();
    
    const { data: teacher } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'teacher')
      .single();
    
    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, name')
      .limit(3);
    
    console.log(`Student: ${student?.full_name}`);
    console.log(`Teacher: ${teacher?.full_name}`);
    console.log(`Subjects available: ${subjects?.length}`);
    
    if (!student || !teacher || !subjects || subjects.length === 0) {
      console.log('❌ Missing required data');
      return;
    }
    
    // Test 1: Try to create a teacher assignment
    console.log('\n1️⃣ Testing teacher assignment creation...');
    const { data: ta, error: taError } = await supabase
      .from('teacher_assignments')
      .insert({
        teacher_id: teacher.id,
        subject_id: subjects[0].id,
        is_active: true,
        assigned_date: new Date().toISOString()
      })
      .select();
    
    if (taError) {
      console.log('❌ Teacher assignment error:', taError.message);
    } else {
      console.log('✅ Teacher assignment created');
    }
    
    // Test 2: Try to create a student enrollment
    console.log('\n2️⃣ Testing student enrollment creation...');
    const { data: se, error: seError } = await supabase
      .from('subject_enrollments')
      .insert({
        student_id: student.id,
        subject_id: subjects[0].id,
        is_active: true,
        enrollment_date: new Date().toISOString()
      })
      .select();
    
    if (seError) {
      console.log('❌ Student enrollment error:', seError.message);
    } else {
      console.log('✅ Student enrollment created');
    }
    
    // Test 3: Check what we can read
    console.log('\n3️⃣ Testing read operations...');
    
    const { data: assignments, error: aError } = await supabase
      .from('teacher_assignments')
      .select('*');
    
    console.log(`Teacher assignments readable: ${assignments?.length || 0}`);
    if (aError) console.log('Error reading assignments:', aError.message);
    
    const { data: enrollments, error: eError } = await supabase
      .from('subject_enrollments')
      .select('*');
    
    console.log(`Student enrollments readable: ${enrollments?.length || 0}`);
    if (eError) console.log('Error reading enrollments:', eError.message);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDirectInserts();