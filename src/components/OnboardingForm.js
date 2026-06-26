"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const BIO_MAX = 280;

export default function OnboardingForm({ initialName = "", initialBio = "", callbackUrl = "/" }) {
  const router = useRouter();
  const { update } = useSession();

  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Something went wrong.");
        setIsLoading(false);
        return;
      }

      // Refresh the JWT so the proxy stops sending us back here.
      await update({ username: data.username, onboarded: true });
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 selection:bg-latent-crimson/30">
      <div className="max-w-md w-full bg-[#111111] border border-brand-border p-8 sm:p-12 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative rounded-md overflow-hidden">

        {/* Decorative Badge */}
        <div className="absolute top-0 right-0 bg-latent-gold text-[#0A0A0A] font-display font-black uppercase tracking-widest text-xs px-4 py-2 shadow-[0_0_15px_rgba(212,175,55,0.6)] rounded-bl-md">
          New Juror
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tighter uppercase text-white leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
              CLAIM YOUR<br /><span className="text-latent-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]">NAME</span>
            </h1>
            <p className="text-white/60 font-medium mt-4 leading-relaxed">
              This is the name the jury sees on the Prophet&apos;s Wall and beside your roasts. Pick well.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-display font-black uppercase tracking-widest text-xs text-white/40 mb-2">
                Display Name
              </label>
              <input
                type="text"
                placeholder="What should we call you?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                className="w-full bg-[#050505] text-white border border-brand-border p-4 font-medium rounded-sm focus:outline-none focus:border-latent-gold transition-colors"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block font-display font-black uppercase tracking-widest text-xs text-white/40 mb-2">
                Bio <span className="text-white/25">(Optional)</span>
              </label>
              <textarea
                placeholder="A line or two. Nobody asked, but the wall has space."
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                rows={3}
                maxLength={BIO_MAX}
                className="w-full bg-[#050505] text-white border border-brand-border p-4 font-medium rounded-sm focus:outline-none focus:border-latent-gold transition-colors resize-none"
              />
              <div className="mt-1 text-right font-mono text-[11px] text-white/30">
                {bio.length}/{BIO_MAX}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="w-full bg-latent-gold text-[#0A0A0A] hover:bg-white p-4 font-display font-black uppercase tracking-widest text-lg transition-all duration-300 rounded-sm disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Enter The Layer"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
