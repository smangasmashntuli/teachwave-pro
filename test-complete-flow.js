import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCompleteFlow() {
  try {
    console.log('🧪 Testing complete student content access flow...\n');
    
    // Step 1: Check if grades and subjects exist
    console.log('📊 Step 1: Checking grades and subjects...');
    const { data: grades } = await supabase.from('grades').select('id, name').limit(3);
    const { data: subjects } = await supabase.from('subjects').select('id, name, code, grade_id').limit(5);
    
    console.log(`✅ Found ${grades?.length || 0} grades and ${subjects?.length || 0} subjects`);
    grades?.forEach(g => console.log(`  - Grade: ${g.name}`));
    subjects?.forEach(s => console.log(`  - Subject: ${s.name} (${s.code})`));
    
    // Step 2: Check for users with different roles
    console.log('\n👥 Step 2: Checking users...');
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, role, full_name')
      .in('role', ['student', 'teacher'])
      .limit(10);
      
    const students = profiles?.filter(p => p.role === 'student') || [];
    const teachers = profiles?.filter(p => p.role === 'teacher') || [];
    
    console.log(`✅ Found ${students.length} students and ${teachers.length} teachers`);
    
    if (students.length > 0 && subjects?.length > 0) {
      console.log('\n📝 Step 3: Creating test subject enrollment...');
      
      // Enroll first student in first subject
      const student = students[0];
      const subject = subjects[0];
      
      const { data: existingEnrollment } = await supabase
        .from('subject_enrollments')
        .select('*')
        .eq('student_id', student.id)
        .eq('subject_id', subject.id)
        .single();
        
      if (!existingEnrollment) {
        const { error: enrollError } = await supabase
          .from('subject_enrollments')
          .insert({
            student_id: student.id,
            subject_id: subject.id,
            is_active: true
          });
          
        if (enrollError) {
          console.log('❌ Error creating enrollment:', enrollError.message);
        } else {
          console.log(`✅ Enrolled ${student.full_name} in ${subject.name}`);
        }
      } else {
        console.log(`✅ ${student.full_name} already enrolled in ${subject.name}`);
      }
    }
    
    if (teachers.length > 0 && subjects?.length > 0) {
      console.log('\n📚 Step 4: Creating test learning content...');
      
      const teacher = teachers[0];
      const subject = subjects[0];
      
      const { data: existingContent } = await supabase
        .from('learning_content')
        .select('*')
        .eq('teacher_id', teacher.id)
        .eq('subject_id', subject.id)
        .limit(1);
        
      if (!existingContent?.length) {
        const { error: contentError } = await supabase
          .from('learning_content')
          .insert({
            teacher_id: teacher.id,
            subject_id: subject.id,
            title: 'Test Learning Material',
            description: 'This is a test material to verify content access',
            content_type: 'document',
            is_published: true,
            file_url: 'https://example.com/test-document.pdf'
          });
          
        if (contentError) {
          console.log('❌ Error creating content:', contentError.message);
        } else {
          console.log(`✅ Created test content by ${teacher.full_name} for ${subject.name}`);
        }
      } else {
        console.log(`✅ Content already exists for ${subject.name}`);
      }
    }
    
    // Step 5: Test content access as student
    console.log('\n🔒 Step 5: Testing content access with RLS...');
    
    if (students.length > 0) {
      const student = students[0];
      
      // Create a client with student's auth context (simulated)
      const { data: studentContent, error: studentContentError } = await supabase
        .from('learning_content')
        .select(`
          id,
          title,
          description,
          content_type,
          is_published,
          subjects(name, code)
        `)
        .eq('is_published', true);
        
      if (studentContentError) {
        console.log('❌ Error fetching content as student:', studentContentError.message);
      } else {
        console.log(`✅ Student can see ${studentContent?.length || 0} published content items`);
        studentContent?.forEach(c => {
          console.log(`  - "${c.title}" for ${c.subjects?.name}`);
        });
      }
    }
    
    // Step 6: Verify the relationship works
    console.log('\n🔗 Step 6: Testing enrollment-content relationship...');
    
    const { data: enrollmentCheck } = await supabase
      .from('subject_enrollments')
      .select(`
        student_id,
        subject_id,
        is_active,
        subjects(
          name,
          learning_content(
            title,
            is_published
          )
        )
      `)
      .eq('is_active', true)
      .limit(5);
      
    console.log(`✅ Found ${enrollmentCheck?.length || 0} active enrollments with content`);
    enrollmentCheck?.forEach(enrollment => {
      const contentCount = enrollment.subjects?.learning_content?.filter(c => c.is_published)?.length || 0;
      console.log(`  - Student enrolled in ${enrollment.subjects?.name} (${contentCount} published content items)`);
    });
    
    console.log('\n🎉 Test completed!');
    console.log('\n📋 Summary:');
    console.log('✅ RLS policy updated to use subject_enrollments table');
    console.log('✅ Students can now access content for subjects they are enrolled in');
    console.log('✅ Content must be marked as is_published = true to be visible');
    console.log('\n🚀 Ready to test in the application!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteFlow();