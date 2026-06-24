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

  try {
    const supabase = getServiceSupabase();

    const { data: existing } = await supabase
      .from("CommunityPostLike")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    const { data: post } = await supabase
      .from("CommunityPost")
      .select("like_count")
      .eq("id", postId)
      .single();

    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found." }, { status: 404 });
    }

    let liked;
    let likeCount = post.like_count || 0;

    if (existing) {
      await supabase.from("CommunityPostLike").delete().eq("id", existing.id);
      likeCount = Math.max(0, likeCount - 1);
      liked = false;
    } else {
      const { error: insErr } = await supabase
        .from("CommunityPostLike")
        .insert({ post_id: postId, user_id: userId });
      // Ignore unique-violation races; treat as already liked.
      if (insErr && insErr.code !== "23505") throw insErr;
      likeCount = likeCount + 1;
      liked = true;
    }

    await supabase.from("CommunityPost").update({ like_count: likeCount }).eq("id", postId);
    return NextResponse.json({ success: true, data: { liked, likeCount } });
  } catch (err) {
    console.error("community like error:", err.message);
    return NextResponse.json({ success: false, error: "Failed to like." }, { status: 500 });
  }
}
