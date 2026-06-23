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
    <div className="min-h-screen flex items-center justify-center p-6 selection:bg-broadcast-red/30">
      <div className="border-4 border-brand-black p-12 shadow-[16px_16px_0px_0px_#0A0A0A] bg-white max-w-md w-full">
        <h1 className="text-4xl font-display font-black uppercase text-brand-black mb-2 tracking-tighter">Showrunner</h1>
        <p className="text-brand-black/70 font-medium font-mono text-sm mb-8">
          Restricted access. Authenticate to enter the control panel.
        </p>

        {error && (
          <div className="bg-broadcast-red/10 border-2 border-broadcast-red text-broadcast-red font-mono text-xs font-bold p-3 mb-6 animate-pulse-fast">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-display font-black uppercase tracking-widest text-brand-black mb-2">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border-4 border-brand-black p-4 font-mono font-bold bg-brand-gray focus:outline-none focus:border-broadcast-red transition-colors"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-xs font-display font-black uppercase tracking-widest text-brand-black mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-4 border-brand-black p-4 font-mono font-bold bg-brand-gray focus:outline-none focus:border-broadcast-red transition-colors"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-black text-white hover:bg-broadcast-red px-8 py-5 font-display font-black uppercase tracking-widest transition-colors shadow-[4px_4px_0px_0px_#0A0A0A] disabled:opacity-50 mt-4"
          >
            {loading ? "Authenticating..." : "Engage"}
          </button>
        </form>
      </div>
    </div>
  );
}
