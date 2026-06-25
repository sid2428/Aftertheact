import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";

const REPLY_SELECT = `id, text, created_at, User ( id, username, avatar_url )`;

// GET /api/community/posts/[id]/replies — public
export async function GET(req, { params }) {
  const { id: postId } = await params;
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("CommunityPostReply")
      .select(REPLY_SELECT)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("community replies GET error:", err.message);
    return NextResponse.json({ success: false, error: "Failed to load replies." }, { status: 500 });
  }
}

// POST /api/community/posts/[id]/replies — add reply (auth required)
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Sign in to reply." }, { status: 401 });
  }
  const { id: postId } = await params;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(session.user.id)) {
    return NextResponse.json({ success: false, error: "Admin accounts cannot reply." }, { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ success: false, error: "Write a reply first." }, { status: 400 });
  }
  if (text.length > 200) {
    return NextResponse.json({ success: false, error: "Keep replies under 200 characters." }, { status: 400 });
  }

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("CommunityPostReply")
      .insert({ post_id: postId, user_id: session.user.id, text })
      .select(REPLY_SELECT)
      .single();
    if (error) throw error;

    // Best-effort reply_count bump.
    const { data: post } = await supabase
      .from("CommunityPost")
      .select("reply_count")
      .eq("id", postId)
      .single();
    if (post) {
      await supabase
        .from("CommunityPost")
        .update({ reply_count: (post.reply_count || 0) + 1 })
        .eq("id", postId);
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("community replies POST error:", err.message);
    return NextResponse.json({ success: false, error: "Failed to reply." }, { status: 500 });
  }
}
