import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Admin Control Panel - AfterTheAct",
};

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isAdmin) {
    redirect("/admin-login");
  }

  return (
    <div className="min-h-screen bg-brand-gray flex flex-col selection:bg-broadcast-red/30">
      {/* Admin Subnav / Header */}
      <div className="bg-brand-black border-b-4 border-brand-black text-white px-6 py-4 shadow-[0px_8px_0px_0px_#0A0A0A] relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="font-display font-black text-2xl uppercase tracking-widest text-white flex items-center gap-3">
            <span className="w-3 h-3 bg-broadcast-red border-2 border-brand-black shadow-[2px_2px_0px_0px_#E53935] animate-pulse-fast"></span>
            Control Panel
          </h1>
          <div className="text-xs font-mono font-bold text-white/50 border-2 border-white/20 px-3 py-1 bg-brand-black shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
            SHOWRUNNER_ACCESS
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-12 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
