import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, clearToken, getToken, setToken } from "../api/client";
import { supabase } from "../api/supabase";
import type { Me } from "../api/types";

interface RegisterResult {
  needsConfirmation: boolean;
}

interface AuthContextValue {
  user: Me | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<RegisterResult>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    const { data } = await api.get<Me>("/auth/me");
    setUser(data);
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // 1) Supabase session (email/password or Google — survives refresh + OAuth redirect)
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setToken(data.session.access_token);
      }
      // 2) Whatever token we have (Supabase or legacy demo), resolve the user
      if (getToken()) {
        try {
          await fetchMe();
        } catch {
          clearToken();
        }
      }
      if (!cancelled) setLoading(false);
    };
    init();

    // Keep the API token in sync with Supabase (refresh, OAuth redirect, sign-out)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setToken(session.access_token);
        fetchMe().catch(() => clearToken());
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    // Supabase Auth first; fall back to the legacy account store (demo user)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.session) {
      setToken(data.session.access_token);
      await fetchMe();
      return;
    }
    const legacy = await api.post("/auth/login", { email, password });
    setToken(legacy.data.access_token);
    await fetchMe();
  };

  const register = async (email: string, password: string): Promise<RegisterResult> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.session) {
      setToken(data.session.access_token);
      await fetchMe();
      return { needsConfirmation: false };
    }
    // Email confirmation is enabled in Supabase — user must click the link first
    return { needsConfirmation: true };
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      // Return to Radar's auth route on the same origin that started OAuth.
      // App.tsx will send an authenticated session to the dashboard.
      options: { redirectTo: `${window.location.origin}/login` },
    });
    if (error) throw error;
    // Browser redirects to Google; on return, onAuthStateChange picks up the session.
  };

  const logout = () => {
    supabase.auth.signOut();
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
