import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBucketAccess() {
  try {
    console.log('🔍 Testing direct bucket access...');
    
    // Test 1: Try to list files (this should work if bucket exists)
    const { data: files, error: listError } = await supabase.storage
      .from('learning-materials')
      .list('', {
        limit: 1
      });
    
    if (listError) {
      console.log('❌ List files error:', listError);
      
      if (listError.message?.includes('Bucket not found')) {
        console.log('📋 Bucket definitely does not exist');
      } else {
        console.log('📋 Bucket might exist but has access restrictions');
      }
    } else {
      console.log('✅ Bucket exists and is accessible!');
      console.log(`📁 Listed ${files?.length || 0} items`);
    }
    
    // Test 2: Try to upload a simple test file 
    console.log('📤 Testing file upload directly...');
    
    const testData = new Blob(['test content'], { type: 'text/plain' });
    const testPath = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('learning-materials')  
      .upload(testPath, testData, {
        contentType: 'text/plain'
      });
    
    if (uploadError) {
      console.log('❌ Upload test error:', uploadError);
    } else {
      console.log('✅ Upload test succeeded!');
      console.log('📄 Uploaded to:', uploadData?.path);
      
      // Clean up test file
      await supabase.storage.from('learning-materials').remove([testPath]);
      console.log('🧹 Cleaned up test file');
    }
    
    // Test 3: Check public URL generation
    const { data: urlData } = supabase.storage
      .from('learning-materials')
      .getPublicUrl('test/sample.pdf');
      
    console.log('🔗 Public URL format:', urlData.publicUrl);
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testBucketAccess();