import Link from "next/link";

export const metadata = {
  alternates: { canonical: "/terms" },
  title: "Terms & Privacy | AfterTheAct",
  description:
    "How AfterTheAct collects, uses, and protects your data, and the terms for using the platform — written to comply with India's Digital Personal Data Protection Act, 2023.",
};

// Plain server component — static legal copy. Last reviewed 27 June 2026.
const LAST_UPDATED = "27 June 2026";

function Section({ id, title, children }) {
  return (
    <section id={id} className="space-y-4 scroll-mt-28">
      <h2 className="font-display text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-white/70 sm:text-base">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-white selection:bg-broadcast-red/30">
      {/* Hero */}
      <section className="border-b-4 border-broadcast-red bg-[#080808] px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h1 className="border-b-8 border-white/15 pb-4 font-display text-5xl font-black uppercase tracking-tight text-white sm:text-7xl">
            Terms &amp; Privacy
          </h1>
          <p className="mt-4 font-mono text-xs font-black uppercase tracking-widest text-white/45">
            Last updated {LAST_UPDATED} · Governed by the laws of India
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <div className="space-y-12">
          <p className="text-sm leading-relaxed text-white/60 sm:text-base">
            AfterTheAct (&quot;the Platform&quot;, &quot;we&quot;, &quot;us&quot;) is an independent fan-community
            site. It is not affiliated with, endorsed by, or connected to any official
            production. These Terms and this Privacy Policy together govern your use of the
            Platform. By creating an account or signing in, you confirm that you have read,
            understood, and agree to them. If you do not agree, please do not use the Platform.
          </p>

          <Section id="data-we-collect" title="1. Data We Collect">
            <p>
              We follow a strict principle of <strong className="text-white">data minimisation</strong> —
              we collect only what is necessary to operate the Platform, and nothing more. The
              personal data we process is limited to:
            </p>
            <ul className="list-disc space-y-2 pl-6 marker:text-broadcast-red">
              <li>
                <strong className="text-white">Email address</strong> — used to sign you in via a
                one-time password (OTP), or supplied by Google if you choose Google sign-in. It is
                your account identifier and the channel for essential service notices.
              </li>
              <li>
                <strong className="text-white">Basic Google profile data</strong> (name, profile
                image, Google account ID) — only if you sign in with Google, and only as needed to
                create and display your account.
              </li>
              <li>
                <strong className="text-white">Display name and optional avatar</strong> — the
                public identity you choose for the leaderboards, votes, and posts.
              </li>
              <li>
                <strong className="text-white">Activity on the Platform</strong> — your votes,
                predictions, scores, and posts, which are the core function of the site.
              </li>
              <li>
                <strong className="text-white">Minimal technical data</strong> — a session token to
                keep you logged in, and short-lived security logs (such as timestamps) needed to
                prevent abuse.
              </li>
            </ul>
            <p>
              We do <strong className="text-white">not</strong> collect your phone number, postal
              address, payment details, government identifiers, precise location, or any sensitive
              personal data. We do not run third-party advertising or tracking profiles, and we do
              not buy or sell personal data.
            </p>
          </Section>

          <Section id="purpose-and-consent" title="2. Purpose &amp; Lawful Basis">
            <p>
              In line with the <strong className="text-white">Digital Personal Data Protection Act,
              2023 (DPDP Act)</strong>, we process your personal data on the basis of your free,
              specific, informed, and unambiguous <strong className="text-white">consent</strong>,
              which you give by ticking the consent box at sign-in. We use your data only to:
            </p>
            <ul className="list-disc space-y-2 pl-6 marker:text-broadcast-red">
              <li>authenticate you and keep your account secure;</li>
              <li>operate platform features — voting, predictions, leaderboards, and posts;</li>
              <li>display your chosen public identity to other users;</li>
              <li>maintain the integrity of the community and prevent abuse;</li>
              <li>send essential service-related communications.</li>
            </ul>
            <p>
              We will not use your data for any new purpose without first seeking your consent.
            </p>
          </Section>

          <Section id="retention" title="3. How Long We Keep It">
            <p>
              We retain personal data only for as long as your account is active or as needed to
              provide the Platform. If you delete your account, we will erase or irreversibly
              anonymise your personal data within a reasonable period, except where retention is
              required by law. Public contributions (such as votes already counted) may remain in
              aggregated or anonymised form that no longer identifies you.
            </p>
          </Section>

          <Section id="your-rights" title="4. Your Rights">
            <p>As a Data Principal under the DPDP Act, you have the right to:</p>
            <ul className="list-disc space-y-2 pl-6 marker:text-broadcast-red">
              <li>access a summary of the personal data we hold about you;</li>
              <li>request correction, completion, or updating of your data;</li>
              <li>request erasure of your data and withdraw your consent at any time;</li>
              <li>nominate another person to exercise your rights in the event of death or incapacity;</li>
              <li>raise a grievance and have it addressed (see Section 8).</li>
            </ul>
            <p>
              Withdrawing consent is as easy as giving it. Once you withdraw consent, we will stop
              the related processing, though this will not affect processing already carried out
              lawfully. To exercise any right, contact our Grievance Officer below.
            </p>
          </Section>

          <Section id="security" title="5. Security">
            <p>
              We apply reasonable technical and organisational safeguards to protect your data
              against unauthorised access, disclosure, or loss. Access is restricted to what is
              necessary to run the Platform. No method of transmission or storage is perfectly
              secure, but in the event of a personal data breach we will act and notify as required
              under the DPDP Act.
            </p>
          </Section>

          <Section id="sharing" title="6. Sharing &amp; Processors">
            <p>
              We do not sell or rent your personal data. We share it only with service providers
              (Data Processors) that help us run the Platform — for example, our authentication and
              hosting providers — under contractual obligations to protect it and use it solely on
              our instructions. We may disclose data where required by law or to protect the rights
              and safety of our users.
            </p>
          </Section>

          <Section id="children" title="7. Children">
            <p>
              The Platform is intended for users aged 18 and above. In keeping with the DPDP Act, we
              do not knowingly process the personal data of a child (a person under 18) without
              verifiable consent of a parent or lawful guardian, and we do not undertake tracking,
              behavioural monitoring, or targeted advertising directed at children. If you believe a
              child has provided us data, please contact us so we can remove it.
            </p>
          </Section>

          <Section id="grievance" title="8. Grievance Officer">
            <p>
              In accordance with the DPDP Act and the Information Technology Act, 2000, you may
              contact our Grievance Officer with any questions, requests, or complaints about your
              data:
            </p>
            <div className="border-l-4 border-broadcast-red bg-brand-panel px-5 py-4 font-mono text-sm text-white/70">
              <p>Grievance Officer, AfterTheAct</p>
              <p>
                Email:{" "}
                <a href="mailto:privacy@aftertheact.app" className="text-latent-gold hover:underline">
                  privacy@aftertheact.app
                </a>
              </p>
              <p className="mt-2 text-white/45">
                We aim to acknowledge requests promptly and resolve them within the timelines
                prescribed under applicable Indian law.
              </p>
            </div>
          </Section>

          <Section id="use-of-platform" title="9. Acceptable Use">
            <p>
              You agree to use the Platform lawfully and respectfully. You must not post unlawful,
              abusive, defamatory, or infringing content, attempt to disrupt or gain unauthorised
              access to the service, or use it to harass others. We may suspend or remove accounts
              that breach these Terms or applicable law.
            </p>
          </Section>

          <Section id="changes" title="10. Changes &amp; Governing Law">
            <p>
              We may update these Terms or this Privacy Policy from time to time. Material changes
              will be notified on this page with a revised &quot;last updated&quot; date, and where the law
              requires, we will seek fresh consent. These Terms are governed by the laws of India,
              and the courts at our principal place of business in India shall have jurisdiction over
              any disputes.
            </p>
          </Section>

          <p className="border-t border-brand-border pt-8 text-xs leading-relaxed text-white/40">
            Disclaimer: AfterTheAct is a fan-community project and is not affiliated with any
            official production. This document is provided to explain our data practices in good
            faith and does not constitute legal advice.
          </p>

          <div className="pt-2">
            <Link
              href="/login"
              className="inline-block rounded-sm bg-latent-gold px-6 py-3 font-display font-black uppercase tracking-widest text-[#0A0A0A] transition-colors hover:bg-white"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
