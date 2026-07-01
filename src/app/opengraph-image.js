import { ImageResponse } from "next/og";

// Site-wide social share card (1200x630). Rendered once at build time and cached.
// A branded card (not the bare logo) makes links look trustworthy in WhatsApp/IG/Reddit
// previews, which is what stops link-scanners from treating shares as spam.
export const alt = "AfterTheAct — India's Got Latent fan voting & scores";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#080808",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ width: "28px", height: "28px", background: "#E11D2A" }} />
          <div style={{ fontSize: "32px", color: "#ffffff", fontWeight: 800, letterSpacing: "0.1em" }}>
            AFTERTHEACT
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "82px", color: "#ffffff", fontWeight: 900, lineHeight: 1.02 }}>
            India&apos;s Got Latent
          </div>
          <div style={{ fontSize: "82px", color: "#E11D2A", fontWeight: 900, lineHeight: 1.02 }}>
            Fan Verdicts.
          </div>
        </div>

        <div style={{ fontSize: "30px", color: "#9a9a9a" }}>
          Vote every act · Live crowd scores · Rate the judges
        </div>
      </div>
    ),
    { ...size }
  );
}
