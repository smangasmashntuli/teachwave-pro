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
    
    // Get initial session with timeout
    const initAuth = async () => {
      try {
        console.log("Getting initial session...");
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Got session:", !!session);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log("User found, fetching profile...");
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error("Auth init error:", error);
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
        
        // Set loading to false immediately after starting profile fetch
        setLoading(false);
        
        try {
          await fetchProfile(session.user.id);
        } catch (error) {
          console.error("Auth: fetchProfile failed:", error);
        }
        
        console.log("Auth: Profile fetch process complete");
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
      console.log("Step 1: Attempting to get user info with timeout...");
      
      // Add timeout to auth call
      const getUserPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('getUser timeout')), 5000)
      );
      
      const { data: { user } } = await Promise.race([getUserPromise, timeoutPromise]) as any;
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
      console.log("Auth getUser failed or timed out, creating emergency profile:", error.message);
      
      // Emergency fallback
      const emergencyProfile = {
        id: userId,
        email: "emergency@example.com",
        full_name: "User",
        role: "student" as const,
        avatar_url: null,
        phone: null,
        date_of_birth: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setProfile(emergencyProfile);
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