"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 selection:bg-latent-crimson/30">
      <div className="max-w-md w-full bg-[#111111] border border-brand-border p-8 sm:p-12 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative rounded-md overflow-hidden">
        
        {/* Decorative Badge */}
        <div className="absolute top-0 right-0 bg-latent-crimson text-white font-display font-black uppercase tracking-widest text-xs px-4 py-2 shadow-[0_0_15px_rgba(139,30,45,0.8)] rounded-bl-md">
          Jury Duty
        </div>

        <div className="text-center space-y-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tighter uppercase text-white leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
              ENTER THE<br/><span className="text-latent-crimson drop-shadow-[0_0_10px_rgba(139,30,45,0.4)]">LAYER</span>
            </h1>
            <p className="text-white/60 font-medium mt-4 leading-relaxed">
              Authenticate to vote live, lock in predictions, and roast the acts. Your Oracle Score follows you everywhere.
            </p>
          </div>

          <div className="pt-4 relative z-10">
            <button
              onClick={() => signIn("google", { callbackUrl })}
              className="w-full flex items-center justify-center gap-4 bg-[#050505] text-white hover:bg-latent-gold hover:text-[#0A0A0A] border border-brand-border hover:border-latent-gold p-4 font-display font-black uppercase tracking-widest text-lg transition-all duration-300 group rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            >
              {/* Simple Google SVG Icon */}
              <svg className="w-6 h-6 shrink-0 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign In with Google
            </button>
          </div>
          
          <div className="pt-6 border-t border-brand-border">
            <p className="text-xs font-display font-bold uppercase tracking-widest text-white/40">
              Only Google login is supported for V1.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
