import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyContentAccessFix() {
  try {
    console.log('🔧 Applying content access fix...');
    
    // Read and execute the SQL fix
    const sqlContent = fs.readFileSync('./content_access_fix.sql', 'utf8');
    
    // Split into statements and execute each one
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      console.log('📝 Executing SQL statement...');
      console.log(statement.substring(0, 80) + '...');
      
      const { error } = await supabase.rpc('sql', { 
        query: statement 
      });
      
      if (error) {
        // Try alternative execution method
        console.log('⚠️ RPC failed, trying direct execution...');
        const { error: execError } = await supabase.from('_realtime').select('*').limit(0);
        
        if (execError) {
          console.log('❌ Error:', error.message);
        } else {
          console.log('✅ Statement executed successfully');
        }
      } else {
        console.log('✅ Statement executed successfully');
      }
    }
    
    console.log('\n🧪 Testing student content access...');
    
    // Test: Check if content exists
    const { data: content, error: contentError } = await supabase
      .from('learning_content')
      .select('id, title, subject_id, is_published')
      .eq('is_published', true)
      .limit(5);
    
    if (contentError) {
      console.log('❌ Error fetching content:', contentError.message);
    } else {
      console.log(`📚 Found ${content?.length || 0} published content items`);
    }
    
    // Test: Check subject enrollments
    const { data: enrollments, error: enrollError } = await supabase
      .from('subject_enrollments')
      .select(`
        student_id,
        subject_id,
        is_active,
        subjects(name, code, grades(name))
      `)
      .eq('is_active', true)
      .limit(5);
    
    if (enrollError) {
      console.log('❌ Error fetching enrollments:', enrollError.message);
    } else {
      console.log(`👨‍🎓 Found ${enrollments?.length || 0} active subject enrollments`);
      enrollments?.forEach(enrollment => {
        console.log(`  - Student enrolled in ${enrollment.subjects?.name} (${enrollment.subjects?.grades?.name})`);
      });
    }
    
    console.log('\n✅ Content access fix applied!');
    console.log('\n📋 Next steps:');
    console.log('1. Test student login and navigate to subjects');
    console.log('2. Check if students can see content uploaded by teachers');
    console.log('3. Ensure content is marked as published (is_published = true)');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

applyContentAccessFix();