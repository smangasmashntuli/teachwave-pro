import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllBuckets() {
  try {
    console.log('📋 Checking all available storage buckets...');
    
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error);
      return;
    }
    
    console.log(`✅ Found ${buckets.length} buckets:`);
    
    for (const bucket of buckets) {
      console.log(`\n📁 Bucket: ${bucket.id}`);
      console.log(`   Name: ${bucket.name}`);
      console.log(`   Public: ${bucket.public}`);
      console.log(`   File Size Limit: ${bucket.file_size_limit || 'unlimited'}`);
      console.log(`   MIME Types: ${bucket.allowed_mime_types?.length || 0} types`);
      console.log(`   Created: ${bucket.created_at}`);
      
      // Test access to this bucket
      const { data: files, error: listError } = await supabase.storage
        .from(bucket.id)
        .list('', { limit: 1 });
        
      if (listError) {
        console.log(`   ❌ Access: Failed (${listError.message})`);
      } else {
        console.log(`   ✅ Access: OK (${files?.length || 0} items)`);
        
        // Try a test upload to see if it works
        const testBlob = new Blob(['test'], { type: 'text/plain' });
        const testPath = `test-${Date.now()}.txt`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket.id)
          .upload(testPath, testBlob);
          
        if (uploadError) {
          console.log(`   📤 Upload: Failed (${uploadError.message})`);
        } else {
          console.log(`   📤 Upload: Working!`);
          // Clean up
          await supabase.storage.from(bucket.id).remove([testPath]);
        }
      }
    }
    
    // If no buckets exist, or no working buckets, suggest creating one
    if (buckets.length === 0) {
      console.log('\n⚠️  No storage buckets found. The project needs storage setup.');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkAllBuckets();