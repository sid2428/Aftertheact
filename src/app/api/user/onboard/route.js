import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Display name: 2–30 chars, letters/numbers/spaces and a few mild separators.
const NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} ._'-]{1,29}$/u;
const BIO_MAX = 280; // matches the Contestant bio cap

// POST /api/user/onboard — save the user's chosen display name + bio.
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Sign in first." }, { status: 401 });
  }
  if (!UUID_RE.test(session.user.id)) {
    // Admin / non-DB accounts have no real row to update.
    return NextResponse.json({ success: false, error: "This account can't onboard." }, { status: 400 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  const bio = typeof body.bio === "string" ? body.bio.trim() : "";

  if (!NAME_RE.test(name)) {
    return NextResponse.json(
      { success: false, error: "Name must be 2–30 characters (letters, numbers, spaces)." },
      { status: 400 }
    );
  }
  if (bio.length > BIO_MAX) {
    return NextResponse.json(
      { success: false, error: `Bio must be ${BIO_MAX} characters or fewer.` },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from("User")
    .update({ username: name, bio: bio || null, onboarded: true })
    .eq("id", session.user.id);

  if (error) {
    // 23505 = unique_violation on the username column.
    if (error.code === "23505") {
      return NextResponse.json(
        { success: false, error: "That name is taken — try another." },
        { status: 409 }
      );
    }
    console.error("onboard update error:", error.message);
    return NextResponse.json({ success: false, error: "Couldn't save. Try again." }, { status: 500 });
  }

  // The leaderboard (Season Standing + Prophet's Wall) is ISR-cached (revalidate: 30),
  // so a name change wouldn't show until the cache expired. Force it now.
  revalidatePath("/leaderboard");

  return NextResponse.json({ success: true, username: name });
}
