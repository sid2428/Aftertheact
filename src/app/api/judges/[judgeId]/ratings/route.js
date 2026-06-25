import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { aggregateRatings } from "@/lib/judges";

// GET /api/judges/[judgeId]/ratings — public aggregate ratings for a judge
export async function GET(req, { params }) {
  const { judgeId } = await params;
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("JudgeRating")
      .select("score")
      .eq("judge_id", judgeId);
    if (error) throw error;
    return NextResponse.json({ success: true, data: aggregateRatings(data || []) });
  } catch (err) {
    console.error("judge ratings GET error:", err.message);
    return NextResponse.json({ success: false, error: "Failed to load ratings." }, { status: 500 });
  }
}
