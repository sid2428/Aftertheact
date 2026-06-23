"use client";

import { useState } from "react";
import { updateEpisodeStatus, triggerRevelation, addContestantToEpisode, createEpisode } from "@/app/actions/admin";

export default function AdminDashboardClient({ initialEpisodes, initialRoasts }) {
  const [episodes, setEpisodes] = useState(initialEpisodes);
  const [roasts, setRoasts] = useState(initialRoasts);
  const [loadingAction, setLoadingAction] = useState(null);
  
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [contestantForm, setContestantForm] = useState({ name: '', talent_type: '', bio: '', judge_average: 0, latent_score: 0, peoples_verdict_weighted: 0 });
  const [episodeForm, setEpisodeForm] = useState({ season_number: 1, episode_number: 1, title: '' });

  const handleStatusChange = async (episodeId, newStatus) => {
    setLoadingAction(`status-${episodeId}`);
    const res = await updateEpisodeStatus(episodeId, newStatus);
    if (res.success) {
      setEpisodes(eps => eps.map(e => e.id === episodeId ? { ...e, status: newStatus } : e));
    } else {
      alert("Error: " + res.error);
    }
    setLoadingAction(null);
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
      setContestantForm({ name: '', talent_type: '', bio: '', judge_average: 0, latent_score: 0, peoples_verdict_weighted: 0 });
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
        <h3 className="text-2xl font-display font-black uppercase tracking-widest text-brand-black border-b-4 border-brand-black pb-2">
          Episode Switchboard
        </h3>
        
        <div className="space-y-6">
          {episodes.map(ep => (
            <div key={ep.id} className="bg-white border-4 border-brand-black shadow-[8px_8px_0px_0px_#0A0A0A] p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-3xl font-display font-black uppercase tracking-tighter">S{ep.season_number}E{ep.episode_number} — {ep.title}</h4>
                  <div className="text-sm font-mono font-bold text-brand-black/50 mt-1">
                    {ep.ContestantEpisodeAppearance?.length || 0} Contestants
                  </div>
                </div>
                <div className={`px-3 py-1 font-display font-black uppercase tracking-widest text-sm border-2 ${
                  ep.status === 'LIVE' ? 'bg-broadcast-red text-white border-brand-black' : 
                  'bg-brand-gray text-brand-black border-brand-black'
                }`}>
                  {ep.status}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t-4 border-brand-black border-dashed">
                <button 
                  onClick={() => handleStatusChange(ep.id, 'UPCOMING')}
                  disabled={loadingAction || ep.status === 'UPCOMING'}
                  className="px-4 py-2 bg-brand-gray border-2 border-brand-black font-display font-black uppercase text-sm hover:bg-brand-black hover:text-white disabled:opacity-50 transition-colors"
                >
                  Set Upcoming
                </button>
                <button 
                  onClick={() => handleStatusChange(ep.id, 'LIVE')}
                  disabled={loadingAction || ep.status === 'LIVE'}
                  className="px-4 py-2 bg-brand-gray border-2 border-brand-black font-display font-black uppercase text-sm hover:bg-broadcast-red hover:text-white hover:border-brand-black disabled:opacity-50 transition-colors"
                >
                  Go Live
                </button>
                <button 
                  onClick={() => handleReveal(ep.id)}
                  disabled={loadingAction || ep.status === 'REVEALED'}
                  className="px-4 py-2 bg-brand-black text-white border-2 border-brand-black font-display font-black uppercase text-sm hover:bg-broadcast-red disabled:opacity-50 transition-colors shadow-[4px_4px_0px_0px_#E53935]"
                >
                  Trigger Reveal
                </button>
                <button 
                  onClick={() => handleStatusChange(ep.id, 'ARCHIVED')}
                  disabled={loadingAction || ep.status === 'ARCHIVED'}
                  className="px-4 py-2 bg-brand-gray border-2 border-brand-black font-display font-black uppercase text-sm hover:bg-brand-black hover:text-white disabled:opacity-50 transition-colors"
                >
                  Archive
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar: Episode Creator, Lineup Manager & Moderation */}
      <div className="space-y-12">

        {/* Episode Creator */}
        <div className="bg-brand-black text-white border-4 border-brand-black shadow-[8px_8px_0px_0px_#0A0A0A] p-6">
          <h3 className="text-xl font-display font-black uppercase tracking-widest text-white border-b-4 border-white/20 pb-2 mb-6">
            Create Episode
          </h3>
          <form onSubmit={handleCreateEpisode} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-display font-black uppercase text-white/70 mb-1">Season</label>
                <input type="number" value={episodeForm.season_number} onChange={e => setEpisodeForm({...episodeForm, season_number: e.target.value})} className="w-full bg-brand-gray text-brand-black border-2 border-brand-black p-2 font-mono font-bold text-center" required min="1" />
              </div>
              <div>
                <label className="block text-xs font-display font-black uppercase text-white/70 mb-1">Episode</label>
                <input type="number" value={episodeForm.episode_number} onChange={e => setEpisodeForm({...episodeForm, episode_number: e.target.value})} className="w-full bg-brand-gray text-brand-black border-2 border-brand-black p-2 font-mono font-bold text-center" required min="1" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-display font-black uppercase text-white/70 mb-1">Title</label>
              <input type="text" value={episodeForm.title} onChange={e => setEpisodeForm({...episodeForm, title: e.target.value})} className="w-full bg-brand-gray text-brand-black border-2 border-brand-black p-2 font-mono font-bold" required placeholder="e.g. The Qualifiers" />
            </div>
            <button disabled={loadingAction === 'create-episode'} className="w-full bg-white text-brand-black py-3 font-display font-black uppercase tracking-widest mt-4 hover:bg-broadcast-red hover:text-white transition-colors border-2 border-transparent">
              {loadingAction === 'create-episode' ? 'Initializing...' : 'Initialize Episode'}
            </button>
          </form>
        </div>
        
        {/* Lineup Manager */}
        <div className="bg-white border-4 border-brand-black shadow-[8px_8px_0px_0px_#0A0A0A] p-6">
          <h3 className="text-xl font-display font-black uppercase tracking-widest text-brand-black border-b-4 border-brand-black pb-2 mb-6">
            Lineup Manager
          </h3>
          <form onSubmit={handleAddContestant} className="space-y-4">
            <div>
              <label className="block text-xs font-display font-black uppercase text-brand-black mb-1">Target Episode</label>
              <select 
                value={selectedEpisode || ""} 
                onChange={e => setSelectedEpisode(e.target.value)}
                className="w-full bg-brand-gray border-2 border-brand-black p-2 font-mono font-bold"
                required
              >
                <option value="" disabled>Select an Episode...</option>
                {episodes.map(ep => (
                  <option key={ep.id} value={ep.id}>S{ep.season_number}E{ep.episode_number}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-display font-black uppercase text-brand-black mb-1">Contestant Name</label>
              <input type="text" value={contestantForm.name} onChange={e => setContestantForm({...contestantForm, name: e.target.value})} className="w-full border-2 border-brand-black p-2 font-mono font-bold" required />
            </div>

            <div>
              <label className="block text-xs font-display font-black uppercase text-brand-black mb-1">Talent</label>
              <input type="text" value={contestantForm.talent_type} onChange={e => setContestantForm({...contestantForm, talent_type: e.target.value})} className="w-full border-2 border-brand-black p-2 font-mono font-bold" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-display font-black uppercase text-brand-black mb-1">Judge Avg</label>
                <input type="number" step="0.1" value={contestantForm.judge_average} onChange={e => setContestantForm({...contestantForm, judge_average: e.target.value})} className="w-full border-2 border-brand-black p-2 font-mono font-bold text-center" />
              </div>
              <div>
                <label className="block text-xs font-display font-black uppercase text-brand-black mb-1">Latent Score</label>
                <input type="number" step="0.1" value={contestantForm.latent_score} onChange={e => setContestantForm({...contestantForm, latent_score: e.target.value})} className="w-full border-2 border-brand-black p-2 font-mono font-bold text-center text-broadcast-red" />
              </div>
            </div>

            <button disabled={loadingAction === 'add-contestant'} className="w-full bg-brand-black text-white py-3 font-display font-black uppercase tracking-widest mt-4 hover:bg-broadcast-red transition-colors shadow-[4px_4px_0px_0px_#0A0A0A]">
              {loadingAction === 'add-contestant' ? 'Adding...' : 'Add to Lineup'}
            </button>
          </form>
        </div>

        {/* Moderation Queue */}
        <div className="bg-brand-black border-4 border-brand-black shadow-[8px_8px_0px_0px_#E53935] p-6 text-white">
          <h3 className="text-xl font-display font-black uppercase tracking-widest text-broadcast-red border-b-4 border-brand-black/50 pb-2 mb-6 flex justify-between">
            Moderation Queue
            <span className="text-white bg-broadcast-red px-2 py-0.5 rounded-full text-sm">{roasts.length}</span>
          </h3>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {roasts.map(r => (
              <div key={r.id} className="bg-brand-gray text-brand-black p-3 border-2 border-white">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-display font-black text-sm uppercase">{r.User?.username}</span>
                  <span className="text-[10px] font-mono text-brand-black/50">Target: {r.Contestant?.name}</span>
                </div>
                <p className="text-sm font-medium mb-3">"{r.content}"</p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-oracle-green text-brand-black font-display font-black uppercase text-xs py-1 border-2 border-brand-black">Approve</button>
                  <button className="flex-1 bg-broadcast-red text-white font-display font-black uppercase text-xs py-1 border-2 border-brand-black">Drop</button>
                </div>
              </div>
            ))}
            {roasts.length === 0 && (
              <div className="text-center font-mono font-bold text-white/50 py-8">Queue is clean.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
