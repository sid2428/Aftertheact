import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redis } from "@/lib/upstash";

// DELETE /api/community/reset-ratelimit — clears a user's post rate-limit key.
// Admin-only: a self-serve reset lets any user clear their own limit between
// posts and defeat the 10-posts/hour spam guard. Admins can reset themselves or
// pass ?userId= to reset a specific user.
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Sign in first." }, { status: 401 });
  }
  if (!session.user.isAdmin) {
    return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get("userId") || session.user.id;
  const key = `community:post:ratelimit:${targetId}`;
  await redis.del(key);
  return NextResponse.json({ success: true, message: "Rate limit cleared." });
}
