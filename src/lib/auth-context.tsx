import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { clearStudioSessionPointer } from "./studio-session";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "user" | "admin";
  is_active: boolean;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // getSession() awaits token-refresh before deciding the user is logged out.
    // Without this, an expired access token causes onAuthStateChange to fire
    // INITIAL_SESSION with null — the shell redirects to /login before the
    // refresh completes and the profile is never fetched.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setLoading(false);
    });

    // Keep the callback synchronous — making Supabase DB calls inside
    // onAuthStateChange is unreliable because the client may not have
    // committed the new JWT yet, causing RLS (auth.uid()) to resolve as null.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch the profile in a separate effect so it runs after onAuthStateChange
  // has fully committed the session JWT to the Supabase client.
  useEffect(() => {
    if (!session?.user?.id) return;

    supabase
      .from("profiles")
      .select("id, email, full_name, role, is_active")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) console.error("[auth] profile fetch failed:", error.message);
        setProfile(data ?? null);
        setLoading(false);
      });
  }, [session?.user?.id]);

  async function signOut() {
    // Studio's active-workspace pointer is a raw localStorage key, not part
    // of Supabase's session — it has to be cleared explicitly so the next
    // login (even the same user) starts on a fresh Studio instead of
    // resuming whatever post was open before logout.
    const userId = session?.user?.id;
    await supabase.auth.signOut();
    if (userId) clearStudioSessionPointer(userId);
    // Remaining auth state is cleared by the onAuthStateChange listener above
  }

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, profile, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
