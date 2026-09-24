import { useState } from "react";
import Logo from "./Logo";

// Demo-only gate: no real backend auth, just a hardcoded check so the app
// has a login screen in front of the assistant, as a fintech product would.
const DEMO_USERNAME = "demo";
const DEMO_PASSWORD = "veltra2026";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      setError("");
      onLogin();
    } else {
      setError("Incorrect username or password.");
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-ink-50 via-brand-50 to-ink-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo size={44} />
        </div>

        <div className="bg-white border border-ink-100 rounded-2xl shadow-xl shadow-brand-900/5 p-8">
          <h1 className="text-xl font-semibold text-ink-900 mb-1">Sign in</h1>
          <p className="text-sm text-ink-400 mb-6">
            Access the Veltra Pay compliance research assistant.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
                placeholder="demo"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg py-2.5 transition shadow-sm shadow-brand-500/30"
            >
              Sign in
            </button>
          </form>

          <p className="text-xs text-ink-400 text-center mt-6">
            Demo credentials — username <code className="text-ink-600">demo</code>,
            password <code className="text-ink-600">veltra2026</code>
          </p>
        </div>
      </div>
    </div>
  );
}
