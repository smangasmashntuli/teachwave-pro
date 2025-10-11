# Storage Bucket Setup Instructions

## Issue
The application requires a storage bucket called `learning-materials` for file uploads, but no storage buckets currently exist in your Supabase project.

## Solution
You need to create the storage bucket through the Supabase Dashboard:

### Step 1: Open Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Log in to your account
3. Select your project: `wuphxvleskoqwfevyeqh`

### Step 2: Create Storage Bucket
1. Click on **"Storage"** in the left sidebar
2. Click **"Create a new bucket"**
3. Enter bucket configuration:
   - **Bucket ID**: `learning-materials`
   - **Bucket name**: `learning-materials`
   - **Public bucket**: ✅ **Yes** (checked)
   - **File size limit**: `10485760` (10MB)
   - **Allowed MIME types**: Add these types:
     ```
     application/pdf
     application/msword
     application/vnd.openxmlformats-officedocument.wordprocessingml.document
     application/vnd.ms-powerpoint
     application/vnd.openxmlformats-officedocument.presentationml.presentation
     video/mp4
     image/jpeg
     image/png
     image/gif
     ```
4. Click **"Create bucket"**

### Step 3: Set Up Policies (Optional but Recommended)
The bucket will work without custom policies since it's public, but you can add these for better security:

1. In the Storage section, click on your `learning-materials` bucket
2. Go to the **"Policies"** tab
3. Add these policies:

**Policy 1: Allow authenticated teachers to upload**
```sql
CREATE POLICY "Teachers can upload learning materials" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'learning-materials' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'teacher'
  )
);
```

**Policy 2: Allow everyone to view (since it's public)**
```sql
CREATE POLICY "Public can view learning materials" ON storage.objects
FOR SELECT USING (bucket_id = 'learning-materials');
```

### Step 4: Test the Setup
After creating the bucket:
1. Restart your development server if it's running
2. Try uploading a file as a teacher
3. The upload should now work without errors

## What This Fixes
- ✅ Teachers can upload learning materials
- ✅ Students can access uploaded documents
- ✅ No more "Bucket not found" errors
- ✅ Proper file type and size restrictions

## Quick Test Command
After setup, you can test with:
```bash
node test-bucket-exists.js
```

This should show the bucket exists and upload/download works properly.