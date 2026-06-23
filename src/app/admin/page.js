import { getServiceSupabase } from "@/lib/supabase";

export default async function AdminDashboard() {
  const supabase = getServiceSupabase();
  
  // Basic stats
  const { count: userCount } = await supabase.from('User').select('*', { count: 'exact', head: true });
  const { count: episodeCount } = await supabase.from('Episode').select('*', { count: 'exact', head: true });
  const { count: roastCount } = await supabase.from('Roast').select('*', { count: 'exact', head: true });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Platform Overview</h1>
        <p className="text-neutral-400 mt-2">V1 operational status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Registered Users" value={userCount || 0} />
        <StatCard title="Episodes Tracked" value={episodeCount || 0} />
        <StatCard title="Total Roasts" value={roastCount || 0} />
      </div>
      
      {/* Moderation Queue Alert Placeholder */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Pending Moderation</h2>
        <p className="text-neutral-400 text-sm">Queue is empty. The internet is surprisingly well-behaved today.</p>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
      <div className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-2">{title}</div>
      <div className="text-4xl font-black text-white">{value}</div>
    </div>
  );
}
