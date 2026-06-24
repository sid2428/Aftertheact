import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";

// POST /api/admin/community/posts/[id]/moderate — approve or remove a flagged post
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ success: false, error: "Admin only." }, { status: 403 });
  }
  const { id: postId } = await params;

  let action;
  try {
    ({ action } = await req.json());
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }
  if (action !== "approve" && action !== "remove") {
    return NextResponse.json({ success: false, error: "Unknown action." }, { status: 400 });
  }

  try {
    const supabase = getServiceSupabase();

    if (action === "approve") {
      // Clear the reports and reset the counter; the post stays visible.
      await supabase.from("PostReport").delete().eq("post_id", postId);
      await supabase.from("CommunityPost").update({ report_count: 0 }).eq("id", postId);
    } else {
      // Hide the post from the public feed.
      await supabase.from("CommunityPost").update({ moderation_status: "REMOVED" }).eq("id", postId);
    }

    return NextResponse.json({ success: true, data: { id: postId, action } });
  } catch (err) {
    console.error("community moderate error:", err.message);
    return NextResponse.json({ success: false, error: "Moderation failed." }, { status: 500 });
  }
}
