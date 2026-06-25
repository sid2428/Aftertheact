import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";

export const metadata = {
  title: "Admin Control Panel - AfterTheAct",
};

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isAdmin) {
    redirect("/admin-login");
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col selection:bg-latent-crimson/30">
      {/* Admin Subnav / Header */}
      <div className="bg-[#111111] border-b border-brand-border px-6 py-4 relative z-10 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="font-display font-black text-2xl uppercase tracking-widest text-white flex items-center gap-3">
            <span className="w-3 h-3 bg-latent-crimson rounded-full shadow-[0_0_10px_rgba(139,30,45,0.8)] animate-pulse-fast"></span>
            Control Panel
          </h1>
          <div className="flex items-center gap-6 font-display font-black uppercase text-sm text-white/60">
            <Link href="/admin" className="hover:text-latent-gold transition-colors">Switchboard</Link>
            <Link href="/admin/episodes" className="hover:text-latent-gold transition-colors">Episodes</Link>
            <Link href="/admin/contestants" className="hover:text-latent-gold transition-colors">Contestants</Link>
            <Link href="/admin/users" className="hover:text-latent-gold transition-colors">Users</Link>
            <Link href="/admin/panel" className="hover:text-latent-gold transition-colors">Panel</Link>
            <AdminLogoutButton />
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
