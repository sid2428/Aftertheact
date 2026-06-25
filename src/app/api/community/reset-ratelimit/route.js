import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redis } from "@/lib/upstash";

// DELETE /api/community/reset-ratelimit — clears your own post rate-limit key.
// Dev/testing escape hatch; harmless in prod (users can only reset themselves).
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Sign in first." }, { status: 401 });
  }
  const key = `community:post:ratelimit:${session.user.id}`;
  await redis.del(key);
  return NextResponse.json({ success: true, message: "Rate limit cleared. You can post again." });
}
