import { Check, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../api/supabase";
import { inputClass, primaryBtn } from "../components/Modal";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "One number", test: (v: string) => /\d/.test(v) },
];

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [provider, setProvider] = useState("Email");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? "");
        setProvider(data.user.app_metadata?.provider === "google" ? "Google" : "Email");
      }
      setLoading(false);
    });
  }, []);

  const checks = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password) })),
    [password],
  );
  const passwordValid = checks.every((rule) => rule.passed);

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!passwordValid) {
      setMessage({ text: "Use at least 8 characters with uppercase, lowercase, and a number.", error: true });
      return;
    }
    if (password !== confirm) {
      setMessage({ text: "Passwords do not match.", error: true });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setMessage({ text: error.message, error: true });
      return;
    }
    setPassword("");
    setConfirm("");
    setMessage({ text: "Password updated successfully." });
  };

  if (loading) return <div className="p-10 text-center text-sm text-gray-400">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-0.5 text-sm text-gray-500">Manage your account information and security.</p>
      </div>

      <section className="card space-y-4 p-6">
        <h2 className="text-sm font-semibold text-gray-900">Account information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Email address</label>
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-gray-400" />
              <input value={email} readOnly className={`${inputClass} bg-gray-50`} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Sign-in method</label>
            <div className="flex items-center gap-2">
              <Lock size={15} className="text-gray-400" />
              <input value={provider} readOnly className={`${inputClass} bg-gray-50`} />
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={updatePassword} className="card space-y-4 p-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Change password</h2>
          <p className="mt-1 text-xs text-gray-500">Choose a strong password for your Radar account.</p>
        </div>
        <div className="relative">
          <input type={showPassword ? "text" : "password"} placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-10`} autoComplete="new-password" />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <div className="relative">
          <input type={showConfirm ? "text" : "password"} placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${inputClass} pr-10`} autoComplete="new-password" />
          <button type="button" onClick={() => setShowConfirm((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-label={showConfirm ? "Hide confirmation" : "Show confirmation"}>
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-[#ece9f3] bg-[#faf9fd] px-3 py-2.5">
          {checks.map((rule) => <span key={rule.label} className={`flex items-center gap-1.5 text-[10px] ${rule.passed ? "text-emerald-600" : "text-gray-400"}`}><Check size={11} />{rule.label}</span>)}
        </div>
        {message && <p className={`text-xs ${message.error ? "text-red-600" : "text-emerald-600"}`}>{message.text}</p>}
        <button type="submit" disabled={saving || !password || !confirm} className={primaryBtn}>
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
