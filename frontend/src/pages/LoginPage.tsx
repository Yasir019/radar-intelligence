import { Loader2, Radar, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { inputClass, primaryBtn } from "../components/Modal";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const tryDemo = async () => {
    setError(null);
    setBusy(true);
    try {
      await login("demo@radar.app", "demo1234");
      navigate("/");
    } catch {
      setError("Demo account not found — run `python -m app.seed_demo` in the backend first.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
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
                onClick={() => setMode(m)}
                className={`rounded-md py-1.5 transition-colors ${
                  mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button type="submit" disabled={busy} className={`${primaryBtn} w-full`}>
              {busy && <Loader2 size={14} className="animate-spin" />}
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-gray-300">
            <div className="h-px flex-1 bg-gray-100" />
            or
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          <button
            onClick={tryDemo}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            <Sparkles size={15} />
            Explore the live demo
          </button>
          <p className="mt-2 text-center text-[11px] text-gray-400">
            Pre-seeded with 4 competitors and 30 days of AI-analyzed changes
          </p>
        </div>
      </div>
    </div>
  );
}
