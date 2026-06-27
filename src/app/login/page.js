"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(0); // 0: enter email, 1: enter otp, 2: admin login
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Tick down the resend cooldown.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const sendOtp = async () => {
    if (!email) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        if (data.retryAfter) setCooldown(data.retryAfter);
      } else {
        setStep(1);
        setCooldown(15); // matches server COOLDOWN_SEC
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    sendOtp();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setIsLoading(true);
    setError("");

    // redirect: false so a wrong code lands back here with the form state
    // intact instead of a full-page bounce to /login?error=CredentialsSignin
    // that this page never reads.
    const result = await signIn("email-otp", {
      email,
      otp,
      callbackUrl,
      redirect: false,
    });

    if (result?.error) {
      setError("Incorrect or expired OTP. Please check the code and try again.");
      setIsLoading(false);
    } else if (result?.ok) {
      router.push(result.url || callbackUrl);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminUsername || !adminPassword) return;
    setIsLoading(true);
    setError("");

    const result = await signIn("admin-login", {
      username: adminUsername,
      password: adminPassword,
      callbackUrl: "/admin",
      redirect: true,
    });

    if (result?.error) {
      setError("Invalid admin credentials");
      setIsLoading(false);
    }
  };

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

          <div className="pt-4 relative z-10 space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            
            {step === 0 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#050505] text-white border border-brand-border p-4 font-medium rounded-sm focus:outline-none focus:border-latent-gold transition-colors"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-latent-gold text-[#0A0A0A] hover:bg-white p-4 font-display font-black uppercase tracking-widest text-lg transition-all duration-300 rounded-sm disabled:opacity-50"
                >
                  {isLoading ? "Sending..." : "Send OTP"}
                </button>
              </form>
            ) : step === 1 ? (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <p className="text-sm text-white/60">Sent to {email}</p>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-[#050505] text-white border border-brand-border p-4 font-medium rounded-sm focus:outline-none focus:border-latent-gold transition-colors text-center tracking-[0.5em] text-xl"
                  required
                  maxLength={6}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-latent-gold text-[#0A0A0A] hover:bg-white p-4 font-display font-black uppercase tracking-widest text-lg transition-all duration-300 rounded-sm disabled:opacity-50"
                >
                  {isLoading ? "Verifying..." : "Verify & Login"}
                </button>
                <div className="flex items-center justify-between gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="text-xs text-white/40 hover:text-white uppercase tracking-wider"
                  >
                    Use a different email
                  </button>
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={isLoading || cooldown > 0}
                    className="text-xs text-white/40 hover:text-white uppercase tracking-wider disabled:opacity-40 disabled:hover:text-white/40"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <input
                  type="text"
                  placeholder="Username"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full bg-[#050505] text-white border border-brand-border p-4 font-medium rounded-sm focus:outline-none focus:border-latent-gold transition-colors"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-[#050505] text-white border border-brand-border p-4 font-medium rounded-sm focus:outline-none focus:border-latent-gold transition-colors"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-latent-crimson text-white hover:bg-red-700 p-4 font-display font-black uppercase tracking-widest text-lg transition-all duration-300 rounded-sm disabled:opacity-50"
                >
                  {isLoading ? "Authenticating..." : "Enter Switchboard"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="text-xs text-white/40 hover:text-white uppercase tracking-wider mt-2 w-full text-center"
                >
                  Back to User Login
                </button>
              </form>
            )}

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-brand-border"></div>
              <span className="flex-shrink-0 mx-4 text-white/40 text-xs font-display uppercase tracking-widest">or</span>
              <div className="flex-grow border-t border-brand-border"></div>
            </div>

            <button
              onClick={() => signIn("google", { callbackUrl })}
              className="w-full flex items-center justify-center gap-4 bg-[#050505] text-white hover:bg-[#111] border border-brand-border hover:border-white/20 p-4 font-display font-black uppercase tracking-widest text-sm transition-all duration-300 group rounded-sm shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            >
              <svg className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign In with Google
            </button>
            
            {step !== 2 && (
              <button
                onClick={() => setStep(2)}
                className="w-full text-center text-[10px] uppercase tracking-widest text-white/20 hover:text-white/60 transition-colors mt-8"
              >
                Admin Access
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// useSearchParams() requires a Suspense boundary so the page can be statically
// rendered (CSR bailout otherwise). The form hydrates on the client.
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh]" />}>
      <LoginForm />
    </Suspense>
  );
}
