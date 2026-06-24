import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";
import { aggregateRatings, validateRatingScore } from "@/lib/judges";

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

  const harshness = validateRatingScore(body.harshness);
  const accuracy = validateRatingScore(body.accuracy);
  const entertainment = validateRatingScore(body.entertainment);
  if (harshness === null || accuracy === null || entertainment === null) {
    return NextResponse.json({ success: false, error: "Each score must be 1–10." }, { status: 400 });
  }
  const comment = typeof body.comment === "string" ? body.comment.slice(0, 200) : null;

  try {
    const supabase = getServiceSupabase();
    const { error } = await supabase.from("JudgeRating").upsert(
      {
        judge_id: judgeId,
        user_id: session.user.id,
        harshness_score: harshness,
        accuracy_score: accuracy,
        entertainment_score: entertainment,
        comment,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "judge_id,user_id" }
    );
    if (error) throw error;

    const { data: rows } = await supabase
      .from("JudgeRating")
      .select("harshness_score, accuracy_score, entertainment_score")
      .eq("judge_id", judgeId);

    return NextResponse.json({ success: true, data: aggregateRatings(rows || []) });
  } catch (err) {
    console.error("judge rate error:", err.message);
    return NextResponse.json({ success: false, error: "Failed to submit rating." }, { status: 500 });
  }
}
