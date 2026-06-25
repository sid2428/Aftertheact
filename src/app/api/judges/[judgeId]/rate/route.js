import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";
import { aggregateRatings, validateRatingScore } from "@/lib/judges";
import { getPanelMembers } from "@/lib/panel";

// POST /api/judges/[judgeId]/rate — submit/update a cumulative judge rating
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Sign in to rate." }, { status: 401 });
  }
  const { judgeId } = await params;
  if (!judgeId) {
    return NextResponse.json({ success: false, error: "Unknown judge." }, { status: 400 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const overall = validateRatingScore(body.overall);
  if (overall === null) {
    return NextResponse.json({ success: false, error: "Overall score must be 1–10." }, { status: 400 });
  }
  const episodeId = typeof body.episodeId === "string" && body.episodeId ? body.episodeId : null;
  if (!episodeId) {
    return NextResponse.json({ success: false, error: "Pick an episode to rate this judge for." }, { status: 400 });
  }

  const members = await getPanelMembers();
  const judge = members.find((m) => m.id === judgeId);
  if (!judge) {
    return NextResponse.json({ success: false, error: "Unknown judge." }, { status: 404 });
  }
  const tag = typeof body.tag === "string" && judge.tags.includes(body.tag) ? body.tag : null;
  if (!tag) {
    return NextResponse.json({ success: false, error: "Pick one of the listed tags." }, { status: 400 });
  }
  const comment = typeof body.comment === "string" ? body.comment.slice(0, 200) : null;

  try {
    const supabase = getServiceSupabase();
    const { error } = await supabase.from("JudgeRating").upsert(
      {
        judge_id: judgeId,
        user_id: session.user.id,
        episode_id: episodeId,
        overall_score: overall,
        tag,
        comment,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "judge_id,user_id,episode_id" }
    );
    if (error) throw error;

    const { data: rows } = await supabase
      .from("JudgeRating")
      .select("overall_score, tag")
      .eq("judge_id", judgeId)
      .eq("episode_id", episodeId);

    return NextResponse.json({ success: true, data: aggregateRatings(rows || []) });
  } catch (err) {
    console.error("judge rate error:", err.message);
    return NextResponse.json({ success: false, error: "Failed to submit rating." }, { status: 500 });
  }
}
