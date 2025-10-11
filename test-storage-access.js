import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorageBucketAccess() {
  try {
    console.log('Testing storage bucket access...');
    
    // Test 1: List buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
    } else {
      console.log('✅ Available buckets:', buckets.map(b => b.id));
      
      const learningMaterialsBucket = buckets.find(b => b.id === 'learning-materials');
      if (learningMaterialsBucket) {
        console.log('✅ Learning materials bucket exists');
        console.log('📊 Bucket config:', {
          public: learningMaterialsBucket.public,
          fileSizeLimit: learningMaterialsBucket.file_size_limit,
          allowedMimeTypes: learningMaterialsBucket.allowed_mime_types
        });
      } else {
        console.log('⚠️  Learning materials bucket not found');
      }
    }
    
    // Test 2: Try to list files in learning-materials bucket (should work even if empty)
    const { data: files, error: filesError } = await supabase.storage
      .from('learning-materials')
      .list();
      
    if (filesError) {
      if (filesError.message?.includes('Bucket not found')) {
        console.log('❌ Bucket not found - this is the error students would see');
        
        // Test 3: Try to create the bucket
        console.log('🔧 Attempting to create learning-materials bucket...');
        const { data: createData, error: createError } = await supabase.storage.createBucket('learning-materials', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'video/mp4',
            'image/jpeg',
            'image/png',
            'image/gif'
          ]
        });
        
        if (createError) {
          console.error('❌ Error creating bucket:', createError);
        } else {
          console.log('✅ Learning materials bucket created successfully');
        }
      } else {
        console.error('❌ Unexpected error accessing bucket:', filesError);
      }
    } else {
      console.log('✅ Successfully accessed learning-materials bucket');
      console.log(`📁 Found ${files.length} files in bucket`);
    }
    
    // Test 4: Test file access patterns
    const testFileName = 'test/sample.pdf';
    const { data: publicUrlData } = supabase.storage
      .from('learning-materials')
      .getPublicUrl(testFileName);
      
    console.log('🔗 Generated public URL format:', publicUrlData.publicUrl);
    
  } catch (error) {
    console.error('💥 Unexpected error during storage test:', error);
  }
}

testStorageBucketAccess();