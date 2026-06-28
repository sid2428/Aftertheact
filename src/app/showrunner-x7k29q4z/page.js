import ShowrunnerLoginForm from "@/components/ShowrunnerLoginForm";

// Secret, unlinked entry point for the Showrunner control panel. The path acts
// as the "unique uid" gate — it isn't referenced anywhere in the UI, sitemap, or
// robots.txt. Reaching it still requires the one-time code AND the id/password.
export const metadata = {
  title: "Showrunner",
  robots: { index: false, follow: false },
};

export default function ShowrunnerLoginPage() {
  return <ShowrunnerLoginForm />;
}
