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
  // Admin accounts use a non-UUID id ("admin-master"). The DB column is UUID,
  // so treat non-UUID ids as anonymous (null) to avoid a cast error.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const dbUserId = UUID_RE.test(userId) ? userId : null;

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
    // Rate limit: max 10 posts/user/hour.
    // SET NX EX sets the key with TTL only if it doesn't exist — ensures the
    // TTL is always set even if expire() failed in a prior call.
    const rlKey = `community:post:ratelimit:${userId || "anon"}`;
    await redis.set(rlKey, 0, { nx: true, ex: 3600 });
    const count = await redis.incr(rlKey);
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
        user_id: dbUserId,
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
    return NextResponse.json({ success: false, error: err.message || "Failed to post." }, { status: 500 });
  }
}
