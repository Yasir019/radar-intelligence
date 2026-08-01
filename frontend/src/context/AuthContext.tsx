import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, clearToken, getToken, setToken } from "../api/client";
import { supabase } from "../api/supabase";
import type { Me } from "../api/types";

const verificationReturn = () => new URLSearchParams(window.location.search).get("verified") === "1";

interface RegisterResult {
  needsConfirmation: boolean;
}

interface AuthContextValue {
  user: Me | null;
  loading: boolean;
  login: (email: string, password: string, captchaToken?: string) => Promise<void>;
  register: (email: string, password: string, captchaToken?: string) => Promise<RegisterResult>;
  resendVerification: (email: string, captchaToken?: string) => Promise<void>;
  sendPasswordReset: (email: string, captchaToken?: string) => Promise<void>;
  loginWithGoogle: (flow?: "login" | "register") => Promise<void>;
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
        const isVerificationReturn = window.location.pathname === "/login" && verificationReturn();
        if (isVerificationReturn) {
          sessionStorage.setItem("radar_email_verified_notice", "1");
          await supabase.auth.signOut();
          clearToken();
        } else {
          setToken(data.session.access_token);
        }
      }
      // 2) Whatever token we have (Supabase or legacy demo), resolve the user
      if (getToken()) {
        try {
          await fetchMe();
        } catch {
          clearToken();
          setUser(null);
        }
      }
      if (!cancelled) setLoading(false);
    };
    init();

    // Keep the API token in sync with Supabase (refresh, OAuth redirect, sign-out)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        if (window.location.pathname === "/login" && verificationReturn()) {
          sessionStorage.setItem("radar_email_verified_notice", "1");
          supabase.auth.signOut();
          clearToken();
          setUser(null);
          return;
        }
        setToken(session.access_token);
        fetchMe().catch(() => {
          clearToken();
          setUser(null);
        });
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, captchaToken?: string) => {
    // Supabase Auth is the source of truth for real accounts. Only the seeded
    // demo account uses the legacy store; falling back for every Supabase
    // error masks real credential/verification errors and can produce a
    // misleading "Invalid or expired token" response from /auth/me.
    const { data, error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
    if (!error && data.session) {
      setToken(data.session.access_token);
      await fetchMe();
      return;
    }
    if (email.trim().toLowerCase() !== "demo@radar.app") {
      throw error ?? new Error("Unable to sign in.");
    }
    // Demo account remains available for the public demo workspace.
    const legacy = await api.post("/auth/login", { email, password });
    setToken(legacy.data.access_token);
    await fetchMe();
  };

  const register = async (email: string, password: string, captchaToken?: string): Promise<RegisterResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/login?verified=1`, captchaToken },
    });
    if (error) throw error;
    if (data.session) {
      setToken(data.session.access_token);
      await fetchMe();
      return { needsConfirmation: false };
    }
    // Email confirmation is enabled in Supabase — user must click the link first
    return { needsConfirmation: true };
  };

  const resendVerification = async (email: string, captchaToken?: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/login?verified=1`, captchaToken },
    });
    if (error) throw error;
  };

  const sendPasswordReset = async (email: string, captchaToken?: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
      captchaToken,
    });
    if (error) throw error;
  };

  const loginWithGoogle = async (_flow: "login" | "register" = "login") => {
    // Do not let a stale local Supabase session silently reuse the previous
    // account when the user starts a new Google auth flow.
    await supabase.auth.signOut();
    clearToken();
    setUser(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      // Return to Radar's auth route on the same origin that started OAuth.
      // App.tsx will send an authenticated session to the dashboard.
      options: {
        redirectTo: `${window.location.origin}/login`,
        // Always show the Google account/consent step instead of silently
        // reusing the last Google account after a user was removed.
        queryParams: { prompt: "select_account consent" },
      },
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
    <AuthContext.Provider
      value={{ user, loading, login, register, resendVerification, sendPasswordReset, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
