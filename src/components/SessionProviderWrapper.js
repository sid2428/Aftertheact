"use client";

import { SessionProvider } from "next-auth/react";

// Thin client boundary so client components (e.g. the onboarding form) can call
// useSession().update() to refresh the JWT without a full re-login.
export default function SessionProviderWrapper({ children, session }) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
