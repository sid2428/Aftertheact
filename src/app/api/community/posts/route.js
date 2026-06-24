import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";
import { redis } from "@/lib/upstash";

const POST_SELECT = `
  id, text, like_count, reply_count, created_at, contestant_tag, episode_tag,
  User ( id, username, avatar_url ),
  Contestant ( id, name ),
  Episode ( id, season_number, episode_number, title )
`;

// GET /api/community/posts?page=N&limit=20 — paginated visible feed
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("CommunityPost")
      .select(POST_SELECT)
      .eq("moderation_status", "VISIBLE")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("community posts GET error:", err.message);
    return NextResponse.json({ success: false, error: "Failed to load feed." }, { status: 500 });
  }
}

// POST /api/community/posts — create a post (auth required, rate limited)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Sign in to post." }, { status: 401 });
  }
  const userId = session.user.id;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ success: false, error: "Say something first." }, { status: 400 });
  }
  if (text.length > 280) {
    return NextResponse.json({ success: false, error: "Keep it under 280 characters." }, { status: 400 });
  }
  const contestantTag = body.contestantTag || null;
  const episodeTag = body.episodeTag || null;

  try {
    // Sliding-window rate limit: max 10 posts/user/hour.
    const rlKey = `community:post:ratelimit:${userId}`;
    const count = await redis.incr(rlKey);
    if (count === 1) {
      await redis.expire(rlKey, 3600);
    }
    if (count > 10) {
      return NextResponse.json(
        { success: false, error: "You're posting too fast. Try again later." },
        { status: 429 }
      );
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("CommunityPost")
      .insert({
        user_id: userId,
        text,
        contestant_tag: contestantTag,
        episode_tag: episodeTag,
        moderation_status: "VISIBLE",
      })
      .select(POST_SELECT)
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("community posts POST error:", err.message);
    return NextResponse.json({ success: false, error: "Failed to post." }, { status: 500 });
  }
}
