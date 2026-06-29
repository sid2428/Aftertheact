import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { upsertPanelMember, deletePanelMember } from "@/lib/panel";
import { judgeFromForm } from "@/lib/judgeForm";

export const revalidate = 0;

function refreshJudgePages() {
  revalidatePath("/admin/panel");
  revalidatePath("/panel");
  revalidatePath("/");
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return !!session?.user?.isAdmin;
}

// PUT /api/judges/[judgeId] — update a judge (multipart form, with optional image)
export async function PUT(req, { params }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Admin only." }, { status: 403 });
  }
  const { judgeId } = await params;
  try {
    const member = await judgeFromForm(await req.formData());
    const saved = await upsertPanelMember({ ...member, id: judgeId });
    refreshJudgePages();
    return NextResponse.json({ success: true, data: saved });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

// DELETE /api/judges/[judgeId] — remove a judge
export async function DELETE(req, { params }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Admin only." }, { status: 403 });
  }
  const { judgeId } = await params;
  try {
    await deletePanelMember(judgeId);
    refreshJudgePages();
    return NextResponse.json({ success: true, data: { id: judgeId } });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
