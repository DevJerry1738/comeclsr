import { useCallback, useMemo, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useSessionContext } from "@supabase/auth-helpers-react";

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
  role: "user" | "admin" | "agent";
  status: string;
  profile_photo?: string;
  [key: string]: any;
}

export function useAuth() {
  const { session, isLoading: sessionLoading } = useSessionContext();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const fetchUser = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Always check Supabase storage for session, even if context hasn't loaded yet
        const { data: { session: storedSession } } = await supabase.auth.getSession();
        let activeSession = session || storedSession;

        if (!activeSession?.user?.id) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Validate session is still valid by checking refresh
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn("Session refresh failed:", refreshError);
          // Don't set user to null, just continue with existing session
        }

        // Fetch full profile from user_profiles table
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", activeSession.user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile:", profileError);
          setError(profileError);
          // Don't clear user on profile fetch failure - auth is still valid
          // Create a minimal user object from auth data
          if (isMountedRef.current) {
            setUser({
              id: activeSession.user.id,
              email: activeSession.user.email || "",
              full_name: activeSession.user.user_metadata?.full_name || "",
              role: "user",
              status: "active",
            } as AuthUser);
          }
          return;
        }

        if (!profile) {
          console.warn("No profile found for user:", activeSession.user.id);
          // User exists in auth but no profile - create minimal user object
          if (isMountedRef.current) {
            setUser({
              id: activeSession.user.id,
              email: activeSession.user.email || "",
              full_name: activeSession.user.user_metadata?.full_name || "",
              role: "user",
              status: "active",
            } as AuthUser);
          }
          return;
        }

        if (isMountedRef.current) {
          setUser(profile as AuthUser);
        }
      } catch (err: any) {
        console.error("Auth error:", err);
        if (isMountedRef.current) {
          setError(err);
          // Don't set user to null - keep them authenticated if possible
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      isMountedRef.current = false;
    };
  }, [session?.user?.id]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      // Use navigate if available, otherwise use window.location
      window.location.href = "/";
    } catch (err: any) {
      console.error("Logout error:", err);
      setError(err);
      // Still navigate even if signOut fails
      window.location.href = "/";
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
