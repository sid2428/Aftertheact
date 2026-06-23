import { getServiceSupabase } from "@/lib/supabase";
import Link from "next/link";
import { HeroStagger, HeroItem, FloatingScoreCard } from "@/components/HomeClientWrapper";
import DivergenceSeismograph from "@/components/DivergenceSeismograph";

export const revalidate = 60;

export default async function Home() {
  const supabase = getServiceSupabase();
  const { data: episodes } = await supabase
    .from("Episode")
    .select("*")
    .order("season_number", { ascending: false })
    .order("episode_number", { ascending: false })
    .limit(10);

  return (
    <div className="bg-[#0A0A0A] min-h-screen">
      
      {/* Cinematic Hero Section */}
      <div className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden px-6">
        
        {/* Background Gradients & Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-latent-gold/5 via-[#0A0A0A]/80 to-[#0A0A0A] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-latent-gold/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Floating Score Cards (Parallax/Motion) */}
        <FloatingScoreCard delay={0.2} x="-35vw" y="-15vh" title="People's Verdict" value="8.7" />
        <FloatingScoreCard delay={0.4} x="25vw" y="-20vh" title="Judge Score" value="4.2" variant="crimson" />
        <FloatingScoreCard delay={0.6} x="-30vw" y="15vh" title="Top Pick" value="Raju Sharma" variant="gold" />
        <FloatingScoreCard delay={0.8} x="28vw" y="10vh" variant="crimson">
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-latent-crimson mb-1">Prediction Locked</div>
          <div className="text-xl font-display font-black uppercase text-white">Result: Disaster</div>
        </FloatingScoreCard>

        {/* Hero Content Stagger */}
        <HeroStagger>
          <HeroItem>
            <h1 className="text-6xl sm:text-8xl md:text-[9rem] font-display font-black tracking-tighter uppercase leading-[0.85] text-center drop-shadow-2xl">
              <span className="text-white">AFTER</span><span className="text-gradient-gold">THE</span><span className="text-white">ACT</span>
            </h1>
          </HeroItem>
          
          <HeroItem>
            <p className="text-xl sm:text-3xl text-white/70 max-w-2xl mx-auto font-medium mt-6 leading-snug text-center">
              The show ends.<br/><span className="text-white">The receipts begin.</span>
            </p>
          </HeroItem>
          
          <HeroItem className="pt-10 flex flex-col sm:flex-row justify-center gap-6 relative z-20">
            <Link href="/api/auth/signin" className="bg-gradient-to-r from-latent-gold to-[#B8860B] text-[#0A0A0A] font-display font-black uppercase tracking-widest px-10 py-5 hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all rounded-sm">
              Join the Jury
            </Link>
            <Link href="/scoreboard" className="glass-panel text-white font-display font-black uppercase tracking-widest px-10 py-5 hover:bg-white/10 transition-colors rounded-sm">
              Explore Scoreboard
            </Link>
          </HeroItem>

          <HeroItem className="pt-20 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 text-center max-w-4xl mx-auto border-t border-white/10 mt-16 pt-12">
            <div>
              <div className="text-4xl font-display font-black text-latent-gold mb-1">43,281</div>
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-white/50">Predictions Logged</div>
            </div>
            <div>
              <div className="text-4xl font-display font-black text-white mb-1">8,214</div>
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-white/50">Public Verdicts</div>
            </div>
            <div>
              <div className="text-4xl font-display font-black text-latent-crimson mb-1">1,902</div>
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-latent-crimson/70">Legendary Ls</div>
            </div>
          </HeroItem>
        </HeroStagger>
      </div>

      {/* Divergence & Episodes Feed */}
      <section className="max-w-7xl mx-auto p-6 sm:p-12 mt-12 mb-32 space-y-24 relative z-20">
        
        {/* Live Controversy Meter */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <div className="w-3 h-3 rounded-full bg-latent-crimson animate-pulse-fast" />
            <h2 className="text-2xl font-display font-black uppercase tracking-widest text-white">Live Controversy Meter</h2>
          </div>
          <div className="glass-panel p-6 rounded-md">
            <DivergenceSeismograph divergenceValue={2.45} history={[0.5, 1.2, -0.8, 2.1, 3.5, 1.8, 0.2, -1.5, 2.45]} />
          </div>
        </div>

        {/* Episode Directory */}
        <div className="space-y-8">
          <div className="flex justify-between items-end border-b border-white/10 pb-4">
            <h2 className="text-2xl font-display font-black uppercase tracking-widest text-white">Episode Directory</h2>
          </div>
        
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {episodes && episodes.map(ep => (
              <Link key={ep.id} href={`/episode/${ep.id}`} className="group block bg-[#111111] border border-white/10 hover:border-latent-gold/50 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] transition-all relative overflow-hidden rounded-md">
                
                <div className="p-6 relative z-10 flex flex-col h-full justify-between min-h-[200px]">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="font-display font-black text-5xl text-white/5 group-hover:text-white/10 transition-colors">
                        E{ep.episode_number}
                      </div>
                      <span className={`px-2 py-1 text-[10px] font-display font-black uppercase tracking-widest rounded-sm ${
                        ep.status === 'LIVE' ? 'bg-latent-crimson/20 text-latent-crimson border border-latent-crimson/50 animate-pulse-fast' : 
                        ep.status === 'UPCOMING' ? 'bg-white/5 text-white/50 border border-white/10' :
                        'bg-white/10 text-white border border-white/20'
                      }`}>
                        {ep.status}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-display font-black uppercase leading-tight mb-2 text-white">S{ep.season_number} — {ep.title}</h3>
                    <div className="text-sm font-mono font-bold text-white/40">Air: {new Date(ep.air_date).toLocaleDateString()}</div>
                  </div>
                  
                  <div className={`mt-8 text-sm font-display font-black uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-2 transition-transform ${ep.status === 'LIVE' ? 'text-latent-crimson' : 'text-latent-gold'}`}>
                    {ep.status === 'LIVE' ? 'Vote Now' : ep.status === 'UPCOMING' ? 'Predict Now' : 'View Results'}
                    <span>→</span>
                  </div>
                </div>
              </Link>
            ))}
            
            {(!episodes || episodes.length === 0) && (
              <div className="col-span-full py-16 text-center text-white/30 font-display font-black uppercase tracking-widest text-xl border border-dashed border-white/10 rounded-md">
                No episodes logged. The acts are still preparing their sob stories. 🎻😭
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
