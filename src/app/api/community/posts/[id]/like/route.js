import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";

// POST /api/community/posts/[id]/like — toggle like (auth required)
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Sign in to like." }, { status: 401 });
  }
  const { id: postId } = await params;
  const userId = session.user.id;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ success: false, error: "Admin accounts cannot react to posts." }, { status: 403 });
  }

  try {
    const supabase = getServiceSupabase();

    // Independent reads — run them together.
    const [{ data: existing }, { data: post }] = await Promise.all([
      supabase
        .from("CommunityPostLike")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("CommunityPost")
        .select("user_id")
        .eq("id", postId)
        .single(),
    ]);

    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found." }, { status: 404 });
    }

    let liked;
    if (existing) {
      await supabase.from("CommunityPostLike").delete().eq("id", existing.id);
      liked = false;
    } else {
      const { error: insErr } = await supabase
        .from("CommunityPostLike")
        .insert({ post_id: postId, user_id: userId });
      // Ignore unique-violation races; treat as already liked.
      if (insErr && insErr.code !== "23505") throw insErr;
      liked = true;
    }

    // Atomic counter — no read-modify-write race; returns the clamped new count.
    const { data: likeCount } = await supabase.rpc("adjust_post_likes", { p_post_id: postId, p_delta: liked ? 1 : -1 });
    // Reddit-style: the author's karma (and latent points) update immediately,
    // +1 on a like, -1 on an unlike. O(1), no scans.
    if (post.user_id) await supabase.rpc("adjust_user_karma", { p_user_id: post.user_id, p_delta: liked ? 1 : -1 });
    return NextResponse.json({ success: true, data: { liked, likeCount: likeCount ?? 0 } });
  } catch (err) {
    console.error("community like error:", err.message);
    return NextResponse.json({ success: false, error: "Failed to like." }, { status: 500 });
  }
}
