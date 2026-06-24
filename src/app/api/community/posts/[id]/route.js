import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";

// DELETE /api/community/posts/[id] — delete own post (or admin)
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Sign in required." }, { status: 401 });
  }
  const { id } = await params;

  try {
    const supabase = getServiceSupabase();
    const { data: post, error: fetchErr } = await supabase
      .from("CommunityPost")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (fetchErr || !post) {
      return NextResponse.json({ success: false, error: "Post not found." }, { status: 404 });
    }
    if (post.user_id !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ success: false, error: "Not your post." }, { status: 403 });
    }

    const { error } = await supabase.from("CommunityPost").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true, data: { id } });
  } catch (err) {
    console.error("community post DELETE error:", err.message);
    return NextResponse.json({ success: false, error: "Failed to delete." }, { status: 500 });
  }
}
