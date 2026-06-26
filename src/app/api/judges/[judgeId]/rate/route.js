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

  const score = validateRatingScore(body.score);
  if (score === null) {
    return NextResponse.json({ success: false, error: "Score must be 1–10." }, { status: 400 });
  }
  const comment = typeof body.comment === "string" ? body.comment.slice(0, 200) : null;
  // One rating per (judge, user, episode) — a judge recurring across episodes is
  // rated once in each, so the episode is required.
  const episodeId = typeof body.episodeId === "string" ? body.episodeId : null;
  if (!episodeId) {
    return NextResponse.json({ success: false, error: "Pick an episode to rate within." }, { status: 400 });
  }

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
    // Insert, not upsert: one rating per (judge, user, episode) and it can't be
    // changed. The unique constraint rejects a second attempt.
    const { error } = await supabase.from("JudgeRating").insert({
      judge_id: judgeId,
      user_id: userId,
      episode_id: episodeId,
      harshness_score: score,
      accuracy_score: score,
      entertainment_score: score,
      comment,
    });
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "You've already locked your verdict for this judge this episode." },
          { status: 409 }
        );
      }
      throw error;
    }

    // Final score = every rating for this judge across ALL episodes, trust-weighted.
    const { data: rows } = await supabase
      .from("JudgeRating")
      .select("harshness_score, accuracy_score, entertainment_score, User(trust_score)")
      .eq("judge_id", judgeId);

    const mappedRows = (rows || []).map(r => ({
      score: (r.harshness_score + r.accuracy_score + r.entertainment_score) / 3,
      trust: r.User?.trust_score ?? 0,
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
