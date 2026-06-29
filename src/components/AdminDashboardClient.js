"use client";

import { useState } from "react";
import { updateEpisodeStatus, triggerRevelation, addContestantToEpisode, createEpisode } from "@/app/actions/admin";

export default function AdminDashboardClient({ initialEpisodes, initialRoasts, initialReportedPosts = [], panelMembers = [] }) {
  const [episodes, setEpisodes] = useState(initialEpisodes);
  const [roasts, setRoasts] = useState(initialRoasts);
  const [reportedPosts, setReportedPosts] = useState(initialReportedPosts);
  const [loadingAction, setLoadingAction] = useState(null);
  const [confirmingArchive, setConfirmingArchive] = useState(null);

  const moderatePost = async (postId, action) => {
    setLoadingAction(`moderate-${postId}`);
    const res = await fetch(`/api/admin/community/posts/${postId}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const json = await res.json();
    if (json.success) {
      setReportedPosts((posts) => posts.filter((p) => p.id !== postId));
    } else {
      alert("Error: " + (json.error || "Moderation failed."));
    }
    setLoadingAction(null);
  };
  
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [contestantForm, setContestantForm] = useState({ name: '', talent_type: '', bio: '', judge_average: 0, self_score: 0, peoples_verdict_weighted: 0 });
  const [episodeForm, setEpisodeForm] = useState({ season_number: 1, episode_number: 1, title: '', air_date: '', judge_ids: [] });

  const toggleJudge = (id) => setEpisodeForm((f) => ({
    ...f,
    judge_ids: f.judge_ids.includes(id) ? f.judge_ids.filter((j) => j !== id) : [...f.judge_ids, id],
  }));

  const handleStatusChange = async (episodeId, newStatus) => {
    setLoadingAction(`status-${episodeId}`);
    const res = await updateEpisodeStatus(episodeId, newStatus);
    if (res.success) {
      setEpisodes(eps => eps.map(e => {
        if (e.id !== episodeId) return e;
        const fallbackRevealAt = newStatus === "LIVE" && !e.voting_window_close
          ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
          : e.voting_window_close;
        return { ...e, status: newStatus, voting_window_close: fallbackRevealAt };
      }));
    } else {
      alert("Error: " + res.error);
    }
    setLoadingAction(null);
  };

  const handleArchiveToggle = async (episodeId, currentStatus) => {
    const nextStatus = currentStatus === "ARCHIVED" ? "REVEALED" : "ARCHIVED";
    const confirmKey = `${episodeId}:${nextStatus}`;

    if (confirmingArchive !== confirmKey) {
      setConfirmingArchive(confirmKey);
      return;
    }

    await handleStatusChange(episodeId, nextStatus);
    setConfirmingArchive(null);
  };

  const handleReveal = async (episodeId) => {
    setLoadingAction(`reveal-${episodeId}`);
    const res = await triggerRevelation(episodeId);
    if (res.success) {
      setEpisodes(eps => eps.map(e => e.id === episodeId ? { ...e, status: "REVEALED", is_revelation_triggered: true } : e));
      alert("Revelation Triggered! The Split-Flap boards are spinning.");
    } else {
      alert("Error: " + res.error);
    }
    setLoadingAction(null);
  };

  const handleAddContestant = async (e) => {
    e.preventDefault();
    if (!selectedEpisode) return alert("Select an episode first.");
    
    setLoadingAction('add-contestant');
    const res = await addContestantToEpisode(selectedEpisode, contestantForm);
    if (res.success) {
      alert("Contestant Added!");
      setContestantForm({ name: '', talent_type: '', bio: '', judge_average: 0, self_score: 0, peoples_verdict_weighted: 0 });
      // In a real app we'd fetch the new count, but for now we just increment locally
      setEpisodes(eps => eps.map(e => e.id === selectedEpisode ? { ...e, ContestantEpisodeAppearance: [...e.ContestantEpisodeAppearance, { id: 'new' }] } : e));
    } else {
      alert("Error: " + res.error);
    }
    setLoadingAction(null);
  };

  const handleCreateEpisode = async (e) => {
    e.preventDefault();
    setLoadingAction('create-episode');
    const res = await createEpisode(episodeForm);
    if (res.success) {
      alert("Episode Created!");
      // Simply reload the page to fetch the new episode data and relations cleanly
      window.location.reload();
    } else {
      alert("Error: " + res.error);
    }
    setLoadingAction(null);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-12">
      
      {/* Episodes Feed */}
      <div className="lg:col-span-2 space-y-8">
        <h3 className="text-2xl font-display font-black uppercase tracking-widest text-white border-b border-white/10 pb-2">
          Episode Switchboard
        </h3>
        
        <div className="space-y-6">
          {episodes.map(ep => (
            <div key={ep.id} className="bg-[#111111] border border-brand-border shadow-[0_0_20px_rgba(0,0,0,0.5)] p-6 rounded-md">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-3xl font-display font-black uppercase tracking-tighter text-white">S{ep.season_number}E{ep.episode_number} — {ep.title}</h4>
                  <div className="text-sm font-mono font-bold text-white/50 mt-1">
                    {ep.ContestantEpisodeAppearance?.length || 0} Contestants
                  </div>
                </div>
                <div className={`px-3 py-1 font-display font-black uppercase tracking-widest text-sm border rounded-sm ${
                  ep.status === 'LIVE' ? 'bg-latent-crimson/20 text-latent-crimson border-latent-crimson/50' : 
                  'bg-white/5 text-white/50 border-white/10'
                }`}>
                  {ep.status}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-white/10 border-dashed">
                <button
                  onClick={() => handleStatusChange(ep.id, 'UPCOMING')}
                  disabled={loadingAction || ep.status === 'UPCOMING'}
                  className="btn-ghost"
                >
                  Set Upcoming
                </button>
                <button
                  onClick={() => handleStatusChange(ep.id, 'LIVE')}
                  disabled={loadingAction || ep.status === 'LIVE'}
                  className="btn-danger"
                >
                  Go Live
                </button>
                <button
                  onClick={() => handleReveal(ep.id)}
                  disabled={loadingAction || ep.status === 'REVEALED'}
                  className="btn-primary"
                >
                  Trigger Reveal
                </button>
                <button
                  onClick={() => handleArchiveToggle(ep.id, ep.status)}
                  disabled={loadingAction || (ep.status !== 'REVEALED' && ep.status !== 'ARCHIVED')}
                  className="btn-ghost"
                >
                  {confirmingArchive === `${ep.id}:${ep.status === 'ARCHIVED' ? 'REVEALED' : 'ARCHIVED'}`
                    ? ep.status === 'ARCHIVED' ? 'Confirm Unarchive' : 'Confirm Archive'
                    : ep.status === 'ARCHIVED' ? 'Unarchive' : 'Archive'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar: Episode Creator, Lineup Manager & Moderation */}
      <div className="space-y-12">

        {/* Episode Creator */}
        <div className="bg-[#111111] text-white border border-brand-border shadow-[0_0_20px_rgba(0,0,0,0.5)] p-6 rounded-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-latent-gold" />
          <h3 className="text-xl font-display font-black uppercase tracking-widest text-white border-b border-white/10 pb-2 mb-6">
            Create Episode
          </h3>
          <form onSubmit={handleCreateEpisode} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-display font-black uppercase text-white/50 mb-1">Season</label>
                <input type="number" value={episodeForm.season_number} onChange={e => setEpisodeForm({...episodeForm, season_number: e.target.value})} className="w-full bg-[#050505] text-white border border-brand-border p-2 font-mono font-bold text-center rounded-sm focus:border-latent-gold outline-none" required min="1" />
              </div>
              <div>
                <label className="block text-xs font-display font-black uppercase text-white/50 mb-1">Episode</label>
                <input type="number" value={episodeForm.episode_number} onChange={e => setEpisodeForm({...episodeForm, episode_number: e.target.value})} className="w-full bg-[#050505] text-white border border-brand-border p-2 font-mono font-bold text-center rounded-sm focus:border-latent-gold outline-none" required min="1" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-display font-black uppercase text-white/50 mb-1">Title</label>
              <input type="text" value={episodeForm.title} onChange={e => setEpisodeForm({...episodeForm, title: e.target.value})} className="w-full bg-[#050505] text-white border border-brand-border p-2 font-mono font-bold rounded-sm focus:border-latent-gold outline-none" required placeholder="e.g. The Qualifiers" />
            </div>
            <div>
              <label className="block text-xs font-display font-black uppercase text-white/50 mb-1">Air Date</label>
              <input type="date" value={episodeForm.air_date} onChange={e => setEpisodeForm({...episodeForm, air_date: e.target.value})} className="w-full bg-[#050505] text-white border border-brand-border p-2 font-mono font-bold rounded-sm focus:border-latent-gold outline-none" />
              <p className="mt-1 text-[11px] font-mono text-white/30">Leave empty to default to now — editable later.</p>
            </div>
            <div>
              <label className="block text-xs font-display font-black uppercase text-white/50 mb-1">Judges on this episode</label>
              {panelMembers.length === 0 ? (
                <p className="text-[11px] font-mono text-white/30">No judges in the panel yet — add them in Hero Panel.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {panelMembers.map((j) => (
                    <label key={j.id} className="flex items-center gap-2 bg-[#050505] border border-brand-border p-2 rounded-sm cursor-pointer">
                      <input type="checkbox" checked={episodeForm.judge_ids.includes(j.id)} onChange={() => toggleJudge(j.id)} className="accent-latent-gold" />
                      <span className="font-mono text-xs text-white/80 truncate">{j.name || j.id}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button disabled={loadingAction === 'create-episode'} className="btn-primary mt-4 w-full">
              {loadingAction === 'create-episode' ? 'Initializing...' : 'Initialize Episode'}
            </button>
          </form>
        </div>
        
        {/* Lineup Manager */}
        <div className="bg-[#111111] text-white border border-brand-border shadow-[0_0_20px_rgba(0,0,0,0.5)] p-6 rounded-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-white/20" />
          <h3 className="text-xl font-display font-black uppercase tracking-widest text-white border-b border-white/10 pb-2 mb-6">
            Lineup Manager
          </h3>
          <form onSubmit={handleAddContestant} className="space-y-4">
            <div>
              <label className="block text-xs font-display font-black uppercase text-white/50 mb-1">Target Episode</label>
              <select 
                value={selectedEpisode || ""} 
                onChange={e => setSelectedEpisode(e.target.value)}
                className="w-full bg-[#050505] text-white border border-brand-border p-2 font-mono font-bold rounded-sm focus:border-latent-gold outline-none"
                required
              >
                <option value="" disabled>Select an Episode...</option>
                {episodes.map(ep => (
                  <option key={ep.id} value={ep.id}>S{ep.season_number}E{ep.episode_number}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-display font-black uppercase text-white/50 mb-1">Contestant Name</label>
              <input type="text" value={contestantForm.name} onChange={e => setContestantForm({...contestantForm, name: e.target.value})} className="w-full bg-[#050505] text-white border border-brand-border p-2 font-mono font-bold rounded-sm focus:border-latent-gold outline-none" required />
            </div>

            <div>
              <label className="block text-xs font-display font-black uppercase text-white/50 mb-1">Talent</label>
              <input type="text" value={contestantForm.talent_type} onChange={e => setContestantForm({...contestantForm, talent_type: e.target.value})} className="w-full bg-[#050505] text-white border border-brand-border p-2 font-mono font-bold rounded-sm focus:border-latent-gold outline-none" required />
            </div>

            {/* Latent Score (crowd verdict) is derived at reveal, not admin-set. */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-display font-black uppercase text-white/50 mb-1">Judge Avg</label>
                <input type="number" step="0.1" value={contestantForm.judge_average} onChange={e => setContestantForm({...contestantForm, judge_average: e.target.value})} className="w-full bg-[#050505] text-white border border-brand-border p-2 font-mono font-bold text-center rounded-sm focus:border-latent-gold outline-none" />
              </div>
              <div>
                <label className="block text-xs font-display font-black uppercase text-white/50 mb-1">Self Score</label>
                <input type="number" step="0.1" value={contestantForm.self_score} onChange={e => setContestantForm({...contestantForm, self_score: e.target.value})} className="w-full bg-[#050505] text-white border border-brand-border p-2 font-mono font-bold text-center rounded-sm focus:border-latent-gold outline-none" />
              </div>
            </div>

            <button disabled={loadingAction === 'add-contestant'} className="btn-ghost mt-4 w-full">
              {loadingAction === 'add-contestant' ? 'Adding...' : 'Add to Lineup'}
            </button>
          </form>
        </div>

        {/* Moderation Queue */}
        <div className="bg-[#050505] text-white border border-latent-crimson/30 shadow-[0_0_20px_rgba(139,30,45,0.2)] p-6 rounded-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-latent-crimson" />
          <h3 className="text-xl font-display font-black uppercase tracking-widest text-latent-crimson border-b border-latent-crimson/20 pb-2 mb-6 flex justify-between items-center">
            Moderation Queue
            <span className="text-white bg-latent-crimson px-2 py-0.5 rounded-full text-xs font-mono">{roasts.length}</span>
          </h3>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {roasts.map(r => (
              <div key={r.id} className="bg-[#111111] text-white p-4 border border-brand-border rounded-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-display font-black text-sm uppercase text-latent-gold">{r.User?.username}</span>
                  <span className="text-[10px] font-mono text-white/50">Target: {r.Contestant?.name}</span>
                </div>
                <p className="text-sm font-medium mb-4 text-white/80">&ldquo;{r.content}&rdquo;</p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-oracle-green/20 text-oracle-green border border-oracle-green/50 font-display font-black uppercase text-xs py-1.5 rounded-sm hover:bg-oracle-green hover:text-[#0A0A0A] transition-colors">Approve</button>
                  <button className="flex-1 bg-latent-crimson/20 text-latent-crimson border border-latent-crimson/50 font-display font-black uppercase text-xs py-1.5 rounded-sm hover:bg-latent-crimson hover:text-white transition-colors">Drop</button>
                </div>
              </div>
            ))}
            {roasts.length === 0 && (
              <div className="text-center font-mono font-bold text-white/30 py-8">Queue is clean.</div>
            )}
          </div>
        </div>

        {/* Reported Posts (The Green Room) */}
        <div className="bg-[#050505] text-white border border-latent-gold/30 shadow-[0_0_20px_rgba(212,175,55,0.15)] p-6 rounded-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-latent-gold" />
          <h3 className="text-xl font-display font-black uppercase tracking-widest text-latent-gold border-b border-latent-gold/20 pb-2 mb-6 flex justify-between items-center">
            Reported Posts
            <span className="text-[#0A0A0A] bg-latent-gold px-2 py-0.5 rounded-full text-xs font-mono">{reportedPosts.length}</span>
          </h3>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {reportedPosts.map((p) => (
              <div key={p.id} className="bg-[#111111] text-white p-4 border border-brand-border rounded-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-display font-black text-sm uppercase text-latent-gold">{p.User?.username || "Unknown"}</span>
                  <span className="text-[10px] font-mono text-latent-crimson">{p.report_count} {p.report_count === 1 ? "report" : "reports"}</span>
                </div>
                <p className="text-sm font-medium mb-4 text-white/80 break-words">&ldquo;{p.text}&rdquo;</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => moderatePost(p.id, "approve")}
                    disabled={loadingAction === `moderate-${p.id}`}
                    className="flex-1 bg-oracle-green/20 text-oracle-green border border-oracle-green/50 font-display font-black uppercase text-xs py-1.5 rounded-sm hover:bg-oracle-green hover:text-[#0A0A0A] transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => moderatePost(p.id, "remove")}
                    disabled={loadingAction === `moderate-${p.id}`}
                    className="flex-1 bg-latent-crimson/20 text-latent-crimson border border-latent-crimson/50 font-display font-black uppercase text-xs py-1.5 rounded-sm hover:bg-latent-crimson hover:text-white transition-colors disabled:opacity-50"
                  >
                    Remove Post
                  </button>
                </div>
              </div>
            ))}
            {reportedPosts.length === 0 && (
              <div className="text-center font-mono font-bold text-white/30 py-8">No reports.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
