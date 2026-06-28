"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export default function ShowrunnerLoginForm() {
  const [step, setStep] = useState(0); // 0: request code, 1: enter code + credentials
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Tick down the resend cooldown.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const requestCode = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/showrunner-otp", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        if (data.retryAfter) setCooldown(data.retryAfter);
      } else {
        setStep(1);
        setCooldown(30); // matches server COOLDOWN_SEC
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || !username || !password) return;
    setLoading(true);
    setError("");

    const res = await signIn("showrunner-login", {
      redirect: false,
      otp,
      username,
      password,
    });

    if (res?.error) {
      setError("Authentication failed. Check your code and credentials.");
      setLoading(false);
    } else {
      // Full reload, not router.push — avoids serving the stale pre-login
      // Router Cache entry for /admin.
      window.location.href = "/admin";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 selection:bg-latent-crimson/30">
      <div className="border border-brand-border p-12 shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-[#111111] max-w-md w-full rounded-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-latent-crimson to-latent-gold" />
        <h1 className="text-4xl font-display font-black uppercase text-white mb-2 tracking-tighter">Showrunner</h1>
        <p className="text-white/50 font-medium font-mono text-sm mb-8">
          Restricted access. A one-time code is required to authenticate.
        </p>

        {error && (
          <div className="bg-latent-crimson/10 border border-latent-crimson/50 text-latent-crimson font-mono text-xs font-bold p-3 mb-6 rounded-sm shadow-[0_0_10px_rgba(139,30,45,0.2)]">
            {error}
          </div>
        )}

        {step === 0 ? (
          <div className="space-y-6">
            <p className="text-white/40 font-mono text-xs leading-relaxed">
              A code will be sent to the registered showrunner inbox. You&apos;ll
              enter it along with your id and password.
            </p>
            <button
              type="button"
              onClick={requestCode}
              disabled={loading || cooldown > 0}
              className="w-full bg-white text-[#0A0A0A] hover:bg-latent-gold hover:text-[#0A0A0A] px-8 py-5 font-display font-black uppercase tracking-widest transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-50 rounded-sm border border-transparent"
            >
              {loading ? "Sending..." : cooldown > 0 ? `Wait ${cooldown}s` : "Request Access Code"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-display font-black uppercase tracking-widest text-white/50 mb-2">Access Code</label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="w-full border border-brand-border p-4 font-mono font-bold bg-[#050505] text-white focus:outline-none focus:border-latent-gold transition-colors rounded-sm shadow-inner text-center tracking-[0.5em]"
                placeholder="------"
              />
            </div>
            <div>
              <label className="block text-xs font-display font-black uppercase tracking-widest text-white/50 mb-2">Showrunner ID</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-brand-border p-4 font-mono font-bold bg-[#050505] text-white focus:outline-none focus:border-latent-gold transition-colors rounded-sm shadow-inner"
                placeholder="Enter id"
              />
            </div>
            <div>
              <label className="block text-xs font-display font-black uppercase tracking-widest text-white/50 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-brand-border p-4 font-mono font-bold bg-[#050505] text-white focus:outline-none focus:border-latent-gold transition-colors rounded-sm shadow-inner"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-[#0A0A0A] hover:bg-latent-gold hover:text-[#0A0A0A] px-8 py-5 font-display font-black uppercase tracking-widest transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-50 mt-2 rounded-sm border border-transparent"
            >
              {loading ? "Authenticating..." : "Engage"}
            </button>

            <button
              type="button"
              onClick={requestCode}
              disabled={loading || cooldown > 0}
              className="w-full text-center text-[10px] uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors disabled:opacity-40"
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
