import { ImageResponse } from "next/og";
import { getServiceSupabase } from "@/lib/supabase";

// Per-episode share card (1200x630). A unique preview per URL beats one duplicated image
// across every link — better CTR when episodes get shared, and reads as real content.
export const alt = "India's Got Latent episode on AfterTheAct";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }) {
  const { id } = await params;
  let episode = null;
  try {
    const supabase = getServiceSupabase();
    const { data } = await supabase
      .from("Episode")
      .select("title, season_number, episode_number, status")
      .eq("id", id)
      .single();
    episode = data;
  } catch {
    // fall through to a generic card
  }

  const tag = episode ? `S${episode.season_number}E${episode.episode_number}` : "";
  const title = episode?.title || "India's Got Latent";
  const status = episode?.status === "LIVE" ? "VOTE NOW · LIVE" : episode?.status === "REVEALED" ? "THE VERDICT IS IN" : "THE LINEUP";

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
          <div style={{ fontSize: "30px", color: "#9a9a9a", fontWeight: 700, letterSpacing: "0.1em" }}>
            AFTERTHEACT · INDIA&apos;S GOT LATENT
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {tag ? (
            <div style={{ fontSize: "40px", color: "#E11D2A", fontWeight: 900, letterSpacing: "0.05em" }}>{tag}</div>
          ) : null}
          <div style={{ fontSize: "78px", color: "#ffffff", fontWeight: 900, lineHeight: 1.02, display: "flex" }}>
            {title.length > 40 ? title.slice(0, 40) + "…" : title}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#E11D2A", color: "#fff", fontSize: "28px", fontWeight: 800, padding: "10px 22px" }}>
            {status}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
