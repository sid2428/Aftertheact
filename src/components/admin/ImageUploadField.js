"use client";

import { useState, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";

const MAX_BYTES = 5 * 1024 * 1024;

// Drag-and-drop upload zone with click-to-browse fallback and a live preview
// (spec P1.2). react-dropzone drives the UX; the selected file is mirrored into
// a hidden named <input type="file"> so the existing server actions keep
// receiving it via FormData unchanged.
export default function ImageUploadField({ name, label, defaultImage }) {
  const [preview, setPreview] = useState(defaultImage || "");
  const [error, setError] = useState("");
  const hiddenInputRef = useRef(null);

  const onDrop = useCallback((accepted, rejected) => {
    setError("");
    if (rejected?.length) {
      const tooBig = rejected[0]?.errors?.some((e) => e.code === "file-too-large");
      setError(tooBig ? "Image too large (max 5MB)." : "Use JPG, PNG, WEBP, or GIF.");
      return;
    }
    const file = accepted?.[0];
    if (!file) return;

    // Mirror the file into the hidden form input the server action reads.
    try {
      const dt = new DataTransfer();
      dt.items.add(file);
      if (hiddenInputRef.current) hiddenInputRef.current.files = dt.files;
    } catch {
      setError("This browser can't attach the file. Try a different one.");
      return;
    }
    setPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [], "image/gif": [] },
    maxFiles: 1,
    maxSize: MAX_BYTES,
    multiple: false,
  });

  return (
    <div>
      {label && (
        <label className="mb-1 block font-display text-xs uppercase tracking-widest text-white/50">{label}</label>
      )}

      <div
        {...getRootProps()}
        className={`flex cursor-pointer items-center gap-3 rounded-sm border border-dashed p-3 transition-colors ${
          isDragActive ? "border-latent-gold bg-latent-gold/5" : "border-white/15 hover:border-latent-gold/50"
        }`}
      >
        {/* react-dropzone's own input (handles browse + drop) */}
        <input {...getInputProps()} />

        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-brand-border bg-[#050505]">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="font-number text-2xl text-white/20">+</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="font-display text-xs uppercase tracking-widest text-white/70">
            {isDragActive ? "Drop to upload" : preview ? "Replace image" : "Drag & drop or click"}
          </div>
          <div className="font-number text-[11px] text-white/30">JPG · PNG · WEBP · GIF · max 5MB</div>
        </div>
      </div>

      {/* Hidden named input the form actually submits. */}
      <input
        ref={hiddenInputRef}
        type="file"
        name={name}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />

      {error && <p className="mt-1 font-display text-[11px] uppercase tracking-widest text-latent-crimson">{error}</p>}
    </div>
  );
}
