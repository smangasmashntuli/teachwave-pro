import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeBucketCreationSQL() {
  try {
    console.log('🔧 Creating storage bucket via direct SQL...');
    
    // Execute the bucket creation SQL
    const { data, error } = await supabase.rpc('exec_sql', { 
      query: `
        INSERT INTO storage.buckets (
            id,
            name, 
            public,
            file_size_limit,
            allowed_mime_types,
            created_at,
            updated_at
        ) VALUES (
            'learning-materials',
            'learning-materials',
            true,
            10485760,
            ARRAY[
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
            ],
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            public = EXCLUDED.public,
            file_size_limit = EXCLUDED.file_size_limit,
            allowed_mime_types = EXCLUDED.allowed_mime_types,
            updated_at = NOW();
      `
    });
    
    if (error) {
      console.error('❌ SQL execution failed:', error);
      
      // Try alternative approach - direct storage API with admin privileges
      console.log('🔄 Trying alternative approach...');
      
      const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('learning-materials', {
        public: true,
        fileSizeLimit: 10485760,
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
      
      if (bucketError) {
        if (bucketError.message?.includes('already exists')) {
          console.log('✅ Bucket already exists!');
        } else {
          console.error('❌ Alternative approach failed:', bucketError);
          return false;
        }
      } else {
        console.log('✅ Bucket created via storage API');
      }
    } else {
      console.log('✅ Bucket created via SQL');
    }
    
    // Verify bucket exists and is accessible
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (!listError) {
      const learningBucket = buckets.find(b => b.id === 'learning-materials');
      if (learningBucket) {
        console.log('✅ Bucket verified and accessible');
        console.log('📊 Configuration:', {
          public: learningBucket.public,
          fileSizeLimit: learningBucket.file_size_limit
        });
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return false;
  }
}

executeBucketCreationSQL();