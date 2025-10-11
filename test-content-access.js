import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testContentAccess() {
  try {
    console.log('🧪 Testing student content access...');
    
    // Check if RLS policies exist
    console.log('📋 Checking existing policies...');
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'learning_content');
    
    if (policyError) {
      console.log('⚠️ Could not fetch policies:', policyError.message);
    } else {
      console.log('📝 Current learning_content policies:');
      policies?.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.cmd}`);
      });
    }
    
    // Check sample content
    console.log('\n📚 Checking published learning content...');
    const { data: content, error: contentError } = await supabase
      .from('learning_content')
      .select(`
        id,
        title,
        subject_id,
        is_published,
        subjects(name, grade_id, grades(name))
      `)
      .eq('is_published', true)
      .limit(5);
    
    if (contentError) {
      console.log('❌ Error fetching content:', contentError.message);
    } else {
      console.log(`📖 Found ${content?.length || 0} published content items:`);
      content?.forEach(item => {
        console.log(`  - "${item.title}" for ${item.subjects?.name} (${item.subjects?.grades?.name})`);
      });
    }
    
    // Check student enrollments
    console.log('\n👨‍🎓 Checking student enrollments...');
    const { data: enrollments, error: enrollError } = await supabase
      .from('student_enrollments')
      .select(`
        student_id,
        is_active,
        grades(name),
        subject_groups(name),
        subject_group_assignments(subjects(name, id))
      `)
      .eq('is_active', true)
      .limit(3);
    
    if (enrollError) {
      console.log('❌ Error fetching enrollments:', enrollError.message);
    } else {
      console.log(`🎒 Found ${enrollments?.length || 0} active student enrollments:`);
      enrollments?.forEach(enrollment => {
        const subjects = enrollment.subject_group_assignments?.map(sga => sga.subjects?.name).join(', ');
        console.log(`  - Student in ${enrollment.grades?.name} (${enrollment.subject_groups?.name}): ${subjects}`);
      });
    }
    
    console.log('\n✅ Content access test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. If policies are missing, run the SQL in content_access_fix.sql in Supabase SQL Editor');
    console.log('2. Ensure students are properly enrolled in subject groups');
    console.log('3. Verify that learning content is marked as published');
    console.log('4. Test student login and content access in the UI');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testContentAccess();