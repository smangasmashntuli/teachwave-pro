import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useSessionManagement = () => {
  const { user, signOut } = useAuth();
  
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh failed:', error);
        throw error;
      }
      console.log('Session refreshed successfully');
      return data;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      // Don't automatically sign out on refresh failure
      // Let the user continue and handle it gracefully
      return null;
    }
  }, []);

  const checkSessionValidity = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session check failed:', error);
        return false;
      }
      
      if (!session) {
        console.log('No active session found');
        return false;
      }

      // Check if session is close to expiring (within 5 minutes)
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;
      
      if (timeUntilExpiry < 300) { // Less than 5 minutes
        console.log('Session expiring soon, attempting refresh');
        const refreshResult = await refreshSession();
        return !!refreshResult;
      }
      
      return true;
    } catch (error) {
      console.error('Session validity check failed:', error);
      return false;
    }
  }, [refreshSession]);

  useEffect(() => {
    if (!user) return;

    // Set up periodic session checks (every 5 minutes)
    const sessionCheckInterval = setInterval(async () => {
      const isValid = await checkSessionValidity();
      if (!isValid) {
        console.log('Session invalid, user may need to re-authenticate');
        // Don't force logout, let the auth state handler deal with it
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Check session on visibility change (when user returns to tab)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const isValid = await checkSessionValidity();
        if (!isValid) {
          console.log('Session may have expired while away');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(sessionCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, checkSessionValidity]);

  return {
    refreshSession,
    checkSessionValidity,
  };
};