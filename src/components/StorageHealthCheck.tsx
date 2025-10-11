import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StorageHealthCheck() {
  const [storageStatus, setStorageStatus] = useState<{
    isChecking: boolean;
    hasLearningMaterialsBucket: boolean;
    canUpload: boolean;
    error?: string;
  }>({
    isChecking: true,
    hasLearningMaterialsBucket: false,
    canUpload: false
  });

  const checkStorageHealth = async () => {
    try {
      setStorageStatus(prev => ({ ...prev, isChecking: true }));

      // Test 1: Check if learning-materials bucket exists by trying to list files
      const { data: files, error: listError } = await supabase.storage
        .from('learning-materials')
        .list('', { limit: 1 });

      if (listError && listError.message?.includes('Bucket not found')) {
        setStorageStatus({
          isChecking: false,
          hasLearningMaterialsBucket: false,
          canUpload: false,
          error: 'learning-materials bucket does not exist'
        });
        return;
      }

      // Test 2: Try a test upload to verify write permissions
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const testPath = `health-check-${Date.now()}.txt`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('learning-materials')
        .upload(testPath, testBlob);

      if (uploadError) {
        setStorageStatus({
          isChecking: false,
          hasLearningMaterialsBucket: true,
          canUpload: false,
          error: `Upload test failed: ${uploadError.message}`
        });
      } else {
        // Clean up test file
        await supabase.storage.from('learning-materials').remove([testPath]);
        
        setStorageStatus({
          isChecking: false,
          hasLearningMaterialsBucket: true,
          canUpload: true
        });
      }
    } catch (error) {
      setStorageStatus({
        isChecking: false,
        hasLearningMaterialsBucket: false,
        canUpload: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  useEffect(() => {
    checkStorageHealth();
  }, []);

  if (storageStatus.isChecking) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Checking storage system...
        </AlertDescription>
      </Alert>
    );
  }

  if (storageStatus.canUpload) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Storage system is working properly. File uploads are enabled.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        <div className="space-y-3">
          <div>
            <strong>Storage Setup Required</strong>
            <p className="text-sm mt-1">
              The file upload system needs to be configured. {storageStatus.error}
            </p>
          </div>
          
          <div className="text-sm">
            <p><strong>To fix this:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Go to your Supabase Dashboard</li>
              <li>Navigate to Storage section</li>
              <li>Create a bucket named "learning-materials"</li>
              <li>Set it as public with 10MB file size limit</li>
              <li>Refresh this page</li>
            </ol>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={checkStorageHealth}
            >
              Recheck Storage
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open Supabase Dashboard
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}