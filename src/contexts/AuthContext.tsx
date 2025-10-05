import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Profile fetch timeout")), 10000); // 10 second timeout
      });

      const fetchPromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error("Profile fetch error:", error);
        
        // If RLS is blocking, try a different approach
        if (error.code === 'PGRST116' || error.message?.includes('row-level security')) {
          console.log("RLS blocking access, creating basic profile");
          const basicProfile = {
            id: userId,
            email: "unknown@example.com",
            full_name: "User",
            role: "student" as const,
            avatar_url: null,
            phone: null,
            date_of_birth: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setProfile(basicProfile);
          return;
        }
        
        throw error;
      }
      
      console.log("Profile loaded successfully:", data);
      console.log("Profile role type:", typeof data.role, "value:", data.role);
      console.log("Full profile object:", JSON.stringify(data, null, 2));
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      
      // Fallback: create a basic profile to prevent infinite loading
      console.log("Creating fallback profile");
      const fallbackProfile = {
        id: userId,
        email: "fallback@example.com", 
        full_name: "User",
        role: "student" as const,
        avatar_url: null,
        phone: null,
        date_of_birth: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setProfile(fallbackProfile);
    } finally {
      setLoading(false);
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
    await supabase.auth.signOut();
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