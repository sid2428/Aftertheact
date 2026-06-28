import Script from "next/script";

// GA4 via the built-in next/script (no @next/third-parties dependency needed).
// Gated on NEXT_PUBLIC_GA_ID: renders nothing until the env var is set, so dev/preview
// and any deploy without the var load zero analytics. GA4 anonymizes IPs by default.
// ponytail: no consent banner here — add one if DPDP consent becomes a requirement.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function GoogleAnalytics() {
  if (!GA_ID) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
