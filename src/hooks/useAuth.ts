import { useCallback, useMemo, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSessionContext } from "@supabase/auth-helpers-react";

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
  role: "user" | "admin";
  status: string;
  profile_photo?: string;
  [key: string]: any;
}

export function useAuth() {
  const { session, isLoading: sessionLoading } = useSessionContext();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get auth user session
        if (!session?.user?.id) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Fetch full profile from user_profiles table
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle(); // Returns null if 0 rows, instead of throwing error

        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile:", profileError);
          setError(profileError);
          setUser(null);
          return;
        }

        if (!profile) {
          console.warn("No profile found for user:", session.user.id);
          // User exists in auth but not in profiles yet
          // Return basic user info from auth session
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            full_name: session.user.user_metadata?.full_name || "",
            role: "user",
            status: "active",
          } as AuthUser);
          return;
        }

        setUser(profile as AuthUser);
      } catch (err: any) {
        console.error("Auth error:", err);
        setError(err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [session?.user?.id]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      window.location.href = "/";
    } catch (err: any) {
      console.error("Logout error:", err);
      setError(err);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (session?.user?.id) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      if (profile) {
        setUser(profile as AuthUser);
      }
    }
  }, [session?.user?.id]);

  return useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      isAgent: user?.role === "agent",
      isLoading: sessionLoading || isLoading,
      error,
      logout,
      refresh,
    }),
    [user, sessionLoading, isLoading, error, logout, refresh],
  );
}
