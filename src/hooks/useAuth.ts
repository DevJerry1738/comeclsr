import { createContext, useContext, useCallback, useMemo, useEffect, useState, useRef, createElement } from "react";
import type { ReactNode } from "react";
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

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isLoading: boolean;
  error: Error | null;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, isLoading: sessionLoading } = useSessionContext();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetchedUserIdRef = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string, email: string, metadata: any) => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch full profile from user_profiles table
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error fetching profile:", profileError);
        setError(profileError as any);
        // Don't clear user on profile fetch failure - auth is still valid
        // Create a minimal user object from auth data
        setUser({
          id: userId,
          email: email,
          full_name: metadata?.full_name || "",
          role: "user",
          status: "active",
        } as AuthUser);
        return;
      }

      if (!profile) {
        console.warn("No profile found for user:", userId);
        // User exists in auth but no profile - create minimal user object
        setUser({
          id: userId,
          email: email,
          full_name: metadata?.full_name || "",
          role: "user",
          status: "active",
        } as AuthUser);
        return;
      }

      setUser(profile as AuthUser);
      fetchedUserIdRef.current = userId;
    } catch (err: any) {
      console.error("Auth error in fetchProfile:", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) {
      setIsLoading(true);
      return;
    }

    if (!session?.user?.id) {
      setUser(null);
      fetchedUserIdRef.current = null;
      setIsLoading(false);
      return;
    }

    // Only fetch if session user id has changed
    if (session.user.id !== fetchedUserIdRef.current) {
      fetchProfile(
        session.user.id,
        session.user.email || "",
        session.user.user_metadata
      );
    } else {
      setIsLoading(false);
    }
  }, [session, sessionLoading, fetchProfile]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      fetchedUserIdRef.current = null;
      window.location.href = "/";
    } catch (err: any) {
      console.error("Logout error:", err);
      setError(err);
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

  const value = useMemo(
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
    [user, sessionLoading, isLoading, error, logout, refresh]
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
