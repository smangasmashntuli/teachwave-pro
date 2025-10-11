import { supabase } from './src/integrations/supabase/client.js';

async function setupStoragePolicies() {
  try {
    console.log('Setting up storage policies for learning-materials bucket...');
    
    // First, ensure the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const learningMaterialsBucket = buckets.find(bucket => bucket.id === 'learning-materials');
    
    if (!learningMaterialsBucket) {
      console.log('Creating learning-materials bucket...');
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
          'image/gif'
        ]
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
        return;
      }
      
      console.log('Learning materials bucket created successfully');
    } else {
      console.log('Learning materials bucket already exists');
    }
    
    console.log('Storage setup completed successfully!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

setupStoragePolicies();