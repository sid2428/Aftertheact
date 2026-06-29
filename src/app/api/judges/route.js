import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getPanelMembers, upsertPanelMember } from "@/lib/panel";
import { judgeFromForm } from "@/lib/judgeForm";

export const revalidate = 0;

function refreshJudgePages() {
  revalidatePath("/admin/panel");
  revalidatePath("/panel");
  revalidatePath("/");
}

// GET /api/judges — list all panel judges
export async function GET() {
  return NextResponse.json({ success: true, data: await getPanelMembers() });
}

// POST /api/judges — create a judge (multipart form, with optional image)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ success: false, error: "Admin only." }, { status: 403 });
  }
  try {
    const member = await judgeFromForm(await req.formData());
    const saved = await upsertPanelMember(member);
    refreshJudgePages();
    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
