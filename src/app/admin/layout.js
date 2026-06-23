import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const supabase = getServiceSupabase();
  const { data: userProfile } = await supabase
    .from("User")
    .select("is_admin")
    .eq("id", session.user.id)
    .single();

  if (!userProfile?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white font-sans">
        <div className="text-center">
          <h1 className="text-4xl font-black text-rose-500 mb-4">403 Forbidden</h1>
          <p className="text-neutral-400">You are not an admin. The internet is watching.</p>
          <Link href="/" className="mt-6 inline-block text-rose-400 hover:underline">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-neutral-900 border-r border-neutral-800 p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-black tracking-widest text-rose-500">ADMIN CONTROL</h2>
          <p className="text-xs text-neutral-500 mt-1">Platform operations</p>
        </div>
        <nav className="flex flex-col gap-2">
          <Link href="/admin" className="px-3 py-2 rounded-lg hover:bg-neutral-800 text-sm font-semibold">Dashboard</Link>
          <Link href="/admin/episodes" className="px-3 py-2 rounded-lg hover:bg-neutral-800 text-sm font-semibold">Episodes</Link>
          <Link href="/admin/contestants" className="px-3 py-2 rounded-lg hover:bg-neutral-800 text-sm font-semibold">Contestants</Link>
          <Link href="/admin/moderation" className="px-3 py-2 rounded-lg hover:bg-neutral-800 text-sm font-semibold">Moderation Queue</Link>
        </nav>
        <div className="mt-auto">
          <button className="w-full px-3 py-2 bg-red-950/30 text-red-500 border border-red-500/30 rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-colors">
            Emergency Mode
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
