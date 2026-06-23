import { getServiceSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request) {
  // Authentication for cron omitted for MVP brevity
  
  const supabase = getServiceSupabase();

  try {
    // 1. Fetch users who need Trust Score recalculation (e.g., active recently)
    // For MVP, fetch all users. In prod, chunk this or queue it.
    const { data: users } = await supabase.from("User").select("id, created_at, oracle_score");

    if (!users) return NextResponse.json({ success: true, message: "No users" });

    const updates = [];

    for (const user of users) {
      let score = 0.0;
      const signals = {};

      // A. Account Age (Max 0.15: 90 days)
      const daysOld = (new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24);
      const ageScore = Math.min(0.15, (Math.floor(daysOld / 30) * 0.05));
      score += ageScore;
      signals.age = ageScore;

      // B. Voting Behaviour Diversity (Max 0.20)
      // MVP: Assume standard baseline if they voted
      const diversityScore = 0.10; // Placeholder complex query
      score += diversityScore;
      signals.diversity = diversityScore;

      // C. Prediction Track Record (Max 0.20)
      const predScore = (user.oracle_score || 0) * 0.20;
      score += predScore;
      signals.prediction = predScore;

      // D. Activity Diversity (Max 0.15)
      const activityScore = 0.10; // Placeholder
      score += activityScore;
      signals.activity = activityScore;

      // E. Moderation History (Max 0.15)
      // Check ModerationLog for removals.
      const modScore = 0.15; // Assume clean for MVP
      score += modScore;
      signals.moderation = modScore;

      // F. Organic Social Validation (Max 0.15)
      const validationScore = 0.05; // Placeholder
      score += validationScore;
      signals.validation = validationScore;

      // Floor at 0.05
      const finalScore = Math.max(0.05, Math.min(1.0, score));

      updates.push({
        id: user.id,
        trust_score: finalScore,
        trust_score_signals: signals,
        trust_score_updated_at: new Date().toISOString()
      });
    }

    // Upsert all updates
    const { error } = await supabase.from("User").upsert(updates, { onConflict: "id" });
    if (error) throw error;

    return NextResponse.json({ success: true, processed: updates.length });

  } catch (error) {
    console.error("Trust Engine Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
