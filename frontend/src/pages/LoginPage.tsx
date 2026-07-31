import { Check, Eye, EyeOff, Loader2, Radar, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { inputClass, primaryBtn } from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import TurnstileWidget from "../components/TurnstileWidget";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface PasswordRule {
  label: string;
  test: (value: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "8+ characters", test: (v) => v.length >= 8 },
  { label: "Uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "Lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "Number", test: (v) => /\d/.test(v) },
];

export default function LoginPage() {
  const { login, register, resendVerification, sendPasswordReset, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">(
    searchParams.get("mode") === "register" ? "register" : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [busy, setBusy] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resendAvailable, setResendAvailable] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");

  const showToast = (message: string, tone: "success" | "error" = "success") => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    if (sessionStorage.getItem("radar_email_verified_notice") === "1") {
      sessionStorage.removeItem("radar_email_verified_notice");
      showToast("Email verified. You can sign in now.");
    }
  }, []);

  const emailValid = EMAIL_REGEX.test(email.trim());
  const passwordChecks = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password) })),
    [password],
  );
  const passwordValid = passwordChecks.every((r) => r.passed);

  const emailError = touched.email && email.length > 0 && !emailValid;
  const canSubmit =
    mode === "login" ? emailValid && password.length > 0 : emailValid && passwordValid;

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setResetMode(false);
    setResendAvailable(false);
    setCaptchaToken("");
    setTouched({ email: false, password: false });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!canSubmit) return;
    if (!captchaToken) {
      showToast("Complete the security check before continuing.", "error");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email.trim().toLowerCase(), password, captchaToken || undefined);
        navigate("/");
      } else {
        const result = await register(email.trim().toLowerCase(), password, captchaToken || undefined);
        if (result.needsConfirmation) {
          showToast("Account created. Verification email sent—check your inbox and spam folder.");
          setResendAvailable(true);
        } else {
          navigate("/");
        }
      }
    } catch (err: any) {
      const message = err?.response?.data?.detail ?? err?.message ?? "Something went wrong";
      const needsVerification = /confirm|verified|verify/i.test(message);
      setResendAvailable(needsVerification);
      showToast(message, "error");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!emailValid) {
      showToast("Enter your email address first.", "error");
      return;
    }
    if (!captchaToken) {
      showToast("Complete the security check before resending.", "error");
      return;
    }
    setBusy(true);
    try {
      await resendVerification(email, captchaToken || undefined);
      showToast("A new verification email has been sent. Check your inbox and spam folder.");
    } catch (err: any) {
      showToast(err?.message ?? "Unable to resend verification email.", "error");
    } finally {
      setBusy(false);
    }
  };

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!emailValid) {
      showToast("Enter a valid email address first.", "error");
      return;
    }
    if (!captchaToken) {
      showToast("Complete the security check before requesting a reset link.", "error");
      return;
    }
    setBusy(true);
    try {
      await sendPasswordReset(email, captchaToken || undefined);
      showToast("If an account exists, a password reset email has been sent.");
    } catch (err: any) {
      showToast(err?.message ?? "Unable to send reset email.", "error");
    } finally {
      setBusy(false);
    }
  };

  const googleLogin = async () => {
    setBusy(true);
    try {
      await loginWithGoogle(mode); // redirects to Google
    } catch (err: any) {
      showToast(err?.message ?? "Google sign-in is not enabled yet", "error");
      setBusy(false);
    }
  };

  return (
    <div className="soft-grid flex min-h-screen items-center justify-center bg-[#f3f1f8] px-4">
      {toast && (
        <div className={`fixed right-5 top-5 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg ${toast.tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-[#d9f0e3] bg-[#eaf8ef] text-[#168451]"}`} role="status">
          {toast.message}
        </div>
      )}
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7457ea] shadow-[0_10px_24px_rgba(116,87,234,0.24)]">
            <Radar size={24} className="text-white" />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Radar</h1>
          <p className="mt-1 text-sm text-gray-500">AI-powered competitor intelligence</p>
        </div>

        <div className="card p-6">
          <div className="mb-5 grid grid-cols-2 rounded-lg bg-gray-100 p-1 text-sm font-medium">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`rounded-md py-1.5 transition-colors ${
                  mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {resetMode ? (
            <form onSubmit={requestReset} className="space-y-3" noValidate>
              <p className="text-sm font-semibold text-[#302938]">Reset your password</p>
              <p className="text-xs leading-5 text-[#8d8794]">Enter your email and we’ll send you a secure reset link.</p>
              <input type="email" required placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="email" />
              <TurnstileWidget onToken={setCaptchaToken} />
              <button type="submit" disabled={busy} className={`${primaryBtn} w-full`}>{busy && <Loader2 size={14} className="animate-spin" />} Send reset link</button>
              <button type="button" onClick={() => setResetMode(false)} className="w-full text-xs font-semibold text-[#7457ea]">Back to sign in</button>
            </form>
          ) : <form onSubmit={submit} className="space-y-3" noValidate>
            <div>
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                autoComplete="email"
                className={`${inputClass} ${
                  emailError ? "!border-[#e43d6c] focus:!ring-red-100" : ""
                }`}
              />
              {emailError && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-[#e43d6c]">
                  <X size={11} /> Enter a valid email address (e.g. name@gmail.com)
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className={`${inputClass} pr-10 ${
                    mode === "register" && touched.password && password.length > 0 && !passwordValid
                      ? "!border-[#e43d6c] focus:!ring-red-100"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9b97a8] hover:text-[#46425a]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {mode === "register" && (password.length > 0 || touched.password) && (
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-[#ece9f3] bg-[#faf9fd] px-3 py-2.5">
                  {passwordChecks.map((rule) => (
                    <span
                      key={rule.label}
                      className={`flex min-w-0 items-center gap-1.5 whitespace-nowrap text-[10px] leading-4 ${
                        rule.passed ? "text-[#168451]" : "text-[#9a95a8]"
                      }`}
                    >
                      {rule.passed ? <Check size={11} /> : <X size={11} />}
                      {rule.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {resendAvailable && (
              <button type="button" onClick={resend} disabled={busy} className="w-full text-left text-xs font-semibold text-[#7457ea] hover:text-[#6043d6]">
                Resend verification email
              </button>
            )}
            <TurnstileWidget onToken={setCaptchaToken} />
            <button
              type="submit"
              disabled={busy || (touched.email && touched.password && !canSubmit)}
              className={`${primaryBtn} w-full`}
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>}

          {!resetMode && mode === "login" && (
              <button type="button" onClick={() => { setResetMode(true); }} className="mt-3 w-full text-center text-xs font-semibold text-[#7457ea] hover:text-[#6043d6]">
              Forgot password?
            </button>
          )}

          <div className="my-4 flex items-center gap-3 text-xs text-gray-300">
            <div className="h-px flex-1 bg-gray-100" />
            or
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          <button
            onClick={googleLogin}
            disabled={busy}
            className="mb-2.5 flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#ded9eb] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#46425a] transition-colors hover:bg-[#faf9fd] disabled:opacity-50"
          >
            <svg width="17" height="17" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

        </div>
      </div>
    </div>
  );
}
