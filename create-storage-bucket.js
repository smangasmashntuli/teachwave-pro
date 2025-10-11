import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Use service role for admin operations

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createStorageBucket() {
  try {
    console.log('🔧 Creating learning-materials storage bucket with service role...');
    
    // Use service role to create bucket (bypasses RLS)
    const { data, error } = await supabase.storage.createBucket('learning-materials', {
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
        'image/gif',
        'text/plain'
      ]
    });
    
    if (error) {
      if (error.message?.includes('already exists')) {
        console.log('✅ Bucket already exists, that\'s fine!');
      } else {
        console.error('❌ Error creating bucket:', error);
        return false;
      }
    } else {
      console.log('✅ Storage bucket created successfully');
    }
    
    // Verify bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
    } else {
      const learningBucket = buckets.find(b => b.id === 'learning-materials');
      if (learningBucket) {
        console.log('✅ Bucket confirmed in bucket list');
        console.log('📊 Bucket configuration:', {
          public: learningBucket.public,
          fileSizeLimit: learningBucket.file_size_limit,
          allowedMimeTypes: learningBucket.allowed_mime_types?.length || 0
        });
      } else {
        console.log('⚠️  Bucket not visible in list (may be permissions issue)');
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return false;
  }
}

createStorageBucket();