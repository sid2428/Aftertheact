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

  const score = validateRatingScore(body.score);
  if (score === null) {
    return NextResponse.json({ success: false, error: "Score must be 1–10." }, { status: 400 });
  }
  const comment = typeof body.comment === "string" ? body.comment.slice(0, 200) : null;

  // Ratings are keyed to a real User row (user_id is a UUID FK). The admin
  // "Showrunner" account isn't a User, so it can't store a rating.
  const userId = session.user.id;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || "")) {
    return NextResponse.json(
      { success: false, error: "Sign in with a regular account to rate — the admin account can't." },
      { status: 403 }
    );
  }

  try {
    const supabase = getServiceSupabase();
    const { error } = await supabase.from("JudgeRating").upsert(
      {
        judge_id: judgeId,
        user_id: userId,
        harshness_score: score,
        accuracy_score: score,
        entertainment_score: score,
        comment,
      },
      { onConflict: "judge_id,user_id" }
    );
    if (error) throw error;

    const { data: rows } = await supabase
      .from("JudgeRating")
      .select("harshness_score, accuracy_score, entertainment_score")
      .eq("judge_id", judgeId);

    const mappedRows = (rows || []).map(r => ({
      score: (r.harshness_score + r.accuracy_score + r.entertainment_score) / 3
    }));

    return NextResponse.json({ success: true, data: aggregateRatings(mappedRows) });
  } catch (err) {
    console.error("judge rate error:", err.message, err.details || "");
    // Surface the real cause so a missing migration / schema mismatch is obvious.
    return NextResponse.json(
      { success: false, error: err.message || "Failed to submit rating." },
      { status: 500 }
    );
  }
}
