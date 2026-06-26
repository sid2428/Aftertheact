"use client";

import { useState, useRef } from "react";
import ImageUploadField from "@/components/admin/ImageUploadField";

const inputClass = "w-full bg-[#050505] text-white border border-brand-border p-2 font-mono font-bold rounded-sm focus:border-latent-gold outline-none";

const blank = { id: "", name: "", image: "", descriptor: "", instagram_handle: "", bio: "", tags: [], show_in_hero: true };

export default function JudgesManager({ initialJudges, maxPanel, defaultTags }) {
  const [judges, setJudges] = useState(initialJudges);
  const [editing, setEditing] = useState(blank); // blank = "add new" form
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef(null);

  const isEdit = !!editing.id;
  const full = judges.length >= maxPanel;

  const startEdit = (j) => {
    setError("");
    setEditing(j);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const resetForm = () => {
    setEditing(blank);
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch(isEdit ? `/api/judges/${editing.id}` : "/api/judges", {
      method: isEdit ? "PUT" : "POST",
      body: fd,
    });
    const json = await res.json();
    setBusy(false);
    if (!json.success) {
      setError(json.error || "Save failed.");
      return;
    }
    setJudges((list) =>
      isEdit ? list.map((j) => (j.id === json.data.id ? json.data : j)) : [...list, json.data]
    );
    resetForm();
  };

  const remove = async (j) => {
    if (!confirm(`Delete judge "${j.name || j.id}"? Their past ratings stay but they leave the panel.`)) return;
    setBusy(true);
    const res = await fetch(`/api/judges/${j.id}`, { method: "DELETE" });
    const json = await res.json();
    setBusy(false);
    if (!json.success) {
      setError(json.error || "Delete failed.");
      return;
    }
    setJudges((list) => list.filter((x) => x.id !== j.id));
    if (editing.id === j.id) resetForm();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Existing judges */}
      <div className="bg-[#111111] border border-brand-border rounded-md divide-y divide-brand-border">
        {judges.length === 0 && (
          <p className="p-6 text-white/40 font-mono text-sm">No judges yet. Add one below.</p>
        )}
        {judges.map((j) => (
          <div key={j.id} className="flex items-center gap-4 p-4">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-sm border border-brand-border bg-[#050505]">
              {j.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={j.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-white/20">?</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display font-black uppercase text-white truncate">{j.name || j.id}</div>
              <div className="font-mono text-xs text-white/40 truncate">
                {j.descriptor || "—"}{j.show_in_hero === false ? " · hidden from hero" : ""}
              </div>
            </div>
            <button onClick={() => startEdit(j)} disabled={busy} className="font-display font-black uppercase text-xs text-latent-gold hover:underline disabled:opacity-40">Edit</button>
            <button onClick={() => remove(j)} disabled={busy} className="font-display font-black uppercase text-xs text-latent-crimson hover:underline disabled:opacity-40">Delete</button>
          </div>
        ))}
      </div>

      {/* Add / edit form. key forces ImageUploadField to reset its preview when
          the editing target changes. */}
      <form
        ref={formRef}
        key={editing.id || "new"}
        onSubmit={submit}
        className="bg-[#111111] border border-brand-border p-6 rounded-md space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="font-display font-black text-white/40 text-lg uppercase tracking-widest">
            {isEdit ? `Edit ${editing.name || editing.id}` : "Add Judge"}
          </div>
          {isEdit && (
            <button type="button" onClick={resetForm} className="font-mono text-xs text-white/50 hover:text-white">+ Add new instead</button>
          )}
        </div>

        <input type="hidden" name="existing_image" defaultValue={editing.image || ""} />
        <div className="grid sm:grid-cols-2 gap-3">
          <input name="name" defaultValue={editing.name} placeholder="Name" className={inputClass} required />
          <input name="descriptor" defaultValue={editing.descriptor} placeholder="Descriptor (e.g. The Wildcard)" className={inputClass} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3 items-start">
          <ImageUploadField name="image" defaultImage={editing.image || ""} />
          <input name="instagram" defaultValue={editing.instagram_handle} placeholder="@instagram_handle" className={inputClass} />
        </div>
        <textarea name="bio" defaultValue={editing.bio} placeholder="Short bio (1–2 sentences)" rows={2} className={inputClass} />
        <input name="tags" defaultValue={(editing.tags && editing.tags.length ? editing.tags : defaultTags).join(", ")} placeholder="Vibe tags, comma-separated" className={inputClass} />
        <label className="flex items-center gap-2 text-white/70 font-mono text-sm select-none">
          <input type="checkbox" name="show_in_hero" defaultChecked={editing.show_in_hero !== false} className="h-4 w-4 accent-latent-gold" />
          Show this judge&apos;s photo on the homepage hero
        </label>

        {error && <p className="font-display text-xs uppercase tracking-widest text-latent-crimson">{error}</p>}
        {!isEdit && full && (
          <p className="font-mono text-xs text-white/40">Panel is full ({maxPanel}). Delete a judge to add another.</p>
        )}

        <button
          disabled={busy || (!isEdit && full)}
          className="bg-latent-gold text-[#0A0A0A] px-6 py-2 font-display font-black uppercase rounded-sm hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all disabled:opacity-40"
        >
          {busy ? "Saving…" : isEdit ? "Save Judge" : "Add Judge"}
        </button>
      </form>
    </div>
  );
}
