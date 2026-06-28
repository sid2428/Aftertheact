import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import OnboardingForm from "@/components/OnboardingForm";

export const metadata = {
  title: "Claim Your Name | After The Act",
  description: "Pick the name the jury will know you by.",
  robots: { index: false, follow: false },
};

const TEMP_USERNAME = /^u_[0-9a-f]{8}$/;

export default async function OnboardingPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/onboarding");
  }

  // Already has a real name? Nothing to do here.
  const { data: profile } = await getServiceSupabase()
    .from("User")
    .select("username, bio, onboarded")
    .eq("id", session.user.id)
    .single();

  const { callbackUrl } = await searchParams;
  const dest = typeof callbackUrl === "string" && callbackUrl.startsWith("/") ? callbackUrl : "/";

  if (profile?.onboarded) {
    redirect(dest);
  }

  // Pre-fill nothing if it's still the temp name; otherwise keep what they had.
  const initialName = profile && !TEMP_USERNAME.test(profile.username) ? profile.username : "";

  return (
    <OnboardingForm initialName={initialName} initialBio={profile?.bio || ""} callbackUrl={dest} />
  );
}
