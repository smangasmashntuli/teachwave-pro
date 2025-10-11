import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: "student" | "teacher" | "admin";
  avatar_url: string | null;
  phone: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
};

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("=== AUTH CONTEXT INIT ===");
    
    // Get initial session - no timeout, let network handle naturally
    const initAuth = async () => {
      try {
        console.log("Getting initial session...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn("Session error (but continuing):", error.message);
        }
        
        console.log("Got session:", !!session);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log("User found, fetching profile...");
          // Don't await profile fetch to avoid blocking the UI
          fetchProfile(session.user.id).catch(err => {
            console.warn("Profile fetch failed, but user stays logged in:", err);
          });
        }
      } catch (error) {
        console.warn("Auth init error (continuing anyway):", error);
        // Don't throw - let the app continue even with auth issues
      } finally {
        console.log("Setting loading to false");
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("=== AUTH STATE CHANGE ===", event, session?.user?.id);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log("Auth: Signed out, clearing profile");
        setProfile(null);
        setLoading(false);
      } else if (session?.user) {
        console.log("Auth: User signed in, fetching profile");
        
        // Set loading to false immediately to avoid blocking UI
        setLoading(false);
        
        // Fetch profile without blocking - let user stay logged in even if this fails
        fetchProfile(session.user.id).catch(error => {
          console.warn("Auth: fetchProfile failed, but keeping user logged in:", error);
          
          // Create minimal profile to keep user authenticated
          const minimalProfile = {
            id: session.user.id,
            email: session.user.email || "user@example.com",
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "User",
            role: "student" as const, // Default role, can be updated later
            avatar_url: null,
            phone: null,
            date_of_birth: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          setProfile(minimalProfile);
        });
        
        console.log("Auth: Profile fetch process initiated");
      } else {
        console.log("Auth: No user, clearing profile");
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    console.log("=== FETCHING USER PROFILE ===", userId);
    
    try {
      console.log("Step 1: Getting user info...");
      
      // Remove timeout - let Supabase handle network issues gracefully
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Step 1 complete: Got user info:", user?.email);
      
      if (user?.email) {
        // Determine role based on email
        let role: "admin" | "teacher" | "student" = "student"; // Default
        const email = user.email.toLowerCase();
        
        if (email.includes("admin") || email.includes("administrator")) {
          role = "admin";
        } else if (email.includes("teacher") || email.includes("instructor")) {
          role = "teacher";
        } else if (email.includes("student")) {
          role = "student";
        } else {
          // If no clear role in email, check domain or default to student
          if (email.endsWith(".admin.school.edu")) {
            role = "admin";
          } else if (email.endsWith(".teacher.school.edu")) {
            role = "teacher";
          } else {
            role = "student";
          }
        }
        
        const profileWithRole = {
          id: userId,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email.split('@')[0] || "User",
          role: role,
          avatar_url: null,
          phone: null,
          date_of_birth: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log("Step 2: Setting profile with determined role:", profileWithRole);
        setProfile(profileWithRole);
      } else {
        // Fallback profile
        const fallbackProfile = {
          id: userId,
          email: "user@example.com",
          full_name: "User",
          role: "student" as const,
          avatar_url: null,
          phone: null,
          date_of_birth: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log("No user email, setting fallback profile:", fallbackProfile);
        setProfile(fallbackProfile);
      }
      
      console.log("=== PROFILE FETCH COMPLETE ===");
      
    } catch (error) {
      console.warn("Auth getUser failed, but keeping user logged in:", error.message);
      
      // Instead of creating emergency profile, try to preserve existing session
      // Only create fallback if we absolutely must
      if (!profile) {
        const fallbackProfile = {
          id: userId,
          email: session?.user?.email || "user@example.com",
          full_name: session?.user?.user_metadata?.full_name || "User",
          role: "student" as const,
          avatar_url: null,
          phone: null,
          date_of_birth: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log("Creating minimal profile to keep user logged in:", fallbackProfile);
        setProfile(fallbackProfile);
      }
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    try {
      setUser(null);
      setProfile(null);
      setSession(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
      }
      
      // Navigate to login page
      window.location.href = '/login';
    } catch (error) {
      console.error("Error during logout:", error);
      window.location.href = '/login';
    }
  };

  // Add session refresh function for handling token expiration
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.warn("Session refresh failed:", error.message);
        return false;
      }
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        console.log("Session refreshed successfully");
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn("Session refresh error:", error);
      return false;
    }
  };

  // Automatically refresh session before expiry
  useEffect(() => {
    if (session?.expires_at) {
      const expiresAt = session.expires_at * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      
      // Refresh 5 minutes before expiry
      const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000);
      
      if (refreshTime > 0) {
        const timeoutId = setTimeout(() => {
          console.log("Auto-refreshing session...");
          refreshSession();
        }, refreshTime);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [session?.expires_at]);

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};