import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";

// POST /api/community/posts/[id]/report — flag a post (auth required)
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Sign in to report." }, { status: 401 });
  }
  const { id: postId } = await params;

  let reason = null;
  try {
    const body = await req.json();
    if (typeof body?.reason === "string") reason = body.reason.slice(0, 280);
  } catch {
    // reason is optional
  }

  try {
    const supabase = getServiceSupabase();
    const { error: insErr } = await supabase
      .from("PostReport")
      .insert({ post_id: postId, reporter_user_id: session.user.id, reason });

    if (insErr) {
      if (insErr.code === "23505") {
        return NextResponse.json({ success: true, data: { alreadyReported: true } });
      }
      throw insErr;
    }

    // Bump the denormalised report counter on the post.
    const { data: post } = await supabase
      .from("CommunityPost")
      .select("report_count")
      .eq("id", postId)
      .single();
    if (post) {
      await supabase
        .from("CommunityPost")
        .update({ report_count: (post.report_count || 0) + 1 })
        .eq("id", postId);
    }

    return NextResponse.json({ success: true, data: { reported: true } });
  } catch (err) {
    console.error("community report error:", err.message);
    return NextResponse.json({ success: false, error: "Failed to report." }, { status: 500 });
  }
}
