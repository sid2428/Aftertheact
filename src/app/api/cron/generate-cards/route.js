import { getServiceSupabase } from "@/lib/supabase";
import sharp from "sharp";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { searchParams } = new URL(req.url);
  const episodeId = searchParams.get("episodeId");

  if (!episodeId) return NextResponse.json({ error: "No episode ID" }, { status: 400 });

  const supabase = getServiceSupabase();

  try {
    const { data: appearances } = await supabase
      .from("ContestantEpisodeAppearance")
      .select("*, Contestant(*), Episode(*)")
      .eq("episode_id", episodeId);

    if (!appearances) return NextResponse.json({ success: true, message: "No contestants to generate" });

    // Note: To fully implement sharp text overlays, an SVG wrapper is standard in Node.
    // For V1 MVP, we establish the pipeline here:
    for (const app of appearances) {
      const svgText = `
        <svg width="1200" height="630">
          <style>
            .title { fill: white; font-size: 80px; font-weight: bold; font-family: sans-serif; }
            .score { fill: #f43f5e; font-size: 140px; font-weight: 900; font-family: sans-serif; }
            .subtitle { fill: #a3a3a3; font-size: 40px; font-family: sans-serif; }
          </style>
          <rect width="100%" height="100%" fill="#0a0a0a" />
          <text x="60" y="150" class="title">${app.Contestant.name}</text>
          <text x="60" y="220" class="subtitle">${app.Contestant.talent_type} • S${app.Episode.season_number}E${app.Episode.episode_number}</text>
          <text x="60" y="450" class="score">${app.latent_score?.toFixed(1)}/10</text>
          <text x="60" y="550" class="subtitle">LATENT SCORE</text>
          ${app.controversy_flag ? '<text x="900" y="150" fill="#f97316" font-size="40" font-weight="bold">CONTROVERSY</text>' : ''}
        </svg>
      `;

      const buffer = await sharp(Buffer.from(svgText))
        .png()
        .toBuffer();

      const fileName = `ep${app.Episode.episode_number}_${app.Contestant.slug}_1200x630.png`;

      await supabase.storage
        .from("share-cards")
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: true
        });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Card Gen Error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
