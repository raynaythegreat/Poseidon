"use client";

import { useState } from "react";
import GlassesLogo from "@/components/ui/GlassesLogo";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("gatekeep-device-token", data.deviceToken);
      localStorage.setItem("gatekeep-token-hash", data.tokenHash);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 rounded-none gradient-sunset flex items-center justify-center shadow-none mx-auto mb-4 animate-gradient ring-1 ring-white/50 dark:ring-white/10">
            <GlassesLogo className="w-11 h-11 text-white drop-shadow-none" />
          </div>
          <h1 className="text-3xl font-semibold gradient-text font-display tracking-wide">GateKeep</h1>
          <p className="text-ink-muted mt-2 font-medium">Secure access to your AI command center</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="card shadow-none p-8 animate-fade-in">
          {error && (
            <div className="mb-4 p-3 rounded-none bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-semibold text-ink mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-none border border-line/60 bg-surface/90 text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 transition-all"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="btn-gold w-full"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-ink-muted mt-6 font-medium">
          AI development assistant powered by sunset vibes ✨
        </p>
      </div>
    </div>
  );
}
