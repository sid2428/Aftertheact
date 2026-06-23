"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    if (res?.error) {
      setError("Invalid credentials. The internet is watching.");
      setLoading(false);
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 selection:bg-latent-crimson/30">
      <div className="border border-brand-border p-12 shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-[#111111] max-w-md w-full rounded-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-latent-crimson to-latent-gold" />
        <h1 className="text-4xl font-display font-black uppercase text-white mb-2 tracking-tighter">Showrunner</h1>
        <p className="text-white/50 font-medium font-mono text-sm mb-8">
          Restricted access. Authenticate to enter the control panel.
        </p>

        {error && (
          <div className="bg-latent-crimson/10 border border-latent-crimson/50 text-latent-crimson font-mono text-xs font-bold p-3 mb-6 rounded-sm shadow-[0_0_10px_rgba(139,30,45,0.2)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-display font-black uppercase tracking-widest text-white/50 mb-2">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-brand-border p-4 font-mono font-bold bg-[#050505] text-white focus:outline-none focus:border-latent-gold transition-colors rounded-sm shadow-inner"
              placeholder="Enter username"
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
            className="w-full bg-white text-[#0A0A0A] hover:bg-latent-gold hover:text-[#0A0A0A] px-8 py-5 font-display font-black uppercase tracking-widest transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-50 mt-4 rounded-sm border border-transparent"
          >
            {loading ? "Authenticating..." : "Engage"}
          </button>
        </form>
      </div>
    </div>
  );
}
