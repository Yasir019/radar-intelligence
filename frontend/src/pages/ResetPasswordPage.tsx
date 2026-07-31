import { Loader2, Radar } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../api/supabase";
import { inputClass, primaryBtn } from "../components/Modal";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      setError("Use at least 8 characters with uppercase, lowercase, and a number.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(() => navigate("/"), 1200);
    } catch (err: any) {
      setError(err?.message ?? "Unable to update password. Please request a new reset link.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="soft-grid flex min-h-screen items-center justify-center bg-[#f3f1f8] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7457ea] shadow-[0_10px_24px_rgba(116,87,234,0.24)]"><Radar size={24} className="text-white" /></span>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Set a new password</h1>
          <p className="mt-1 text-center text-sm text-gray-500">Choose a strong password for your Radar account.</p>
        </div>
        <div className="card p-6">
          {done ? (
            <div className="rounded-lg border border-[#d9f0e3] bg-[#eaf8ef] px-3 py-3 text-center text-sm text-[#168451]">Password updated. Redirecting…</div>
          ) : (
            <form onSubmit={submit} className="space-y-3" noValidate>
              <input type="password" required placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} autoComplete="new-password" />
              <input type="password" required placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} autoComplete="new-password" />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button type="submit" disabled={busy} className={`${primaryBtn} w-full`}>{busy && <Loader2 size={14} className="animate-spin" />} Update password</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
