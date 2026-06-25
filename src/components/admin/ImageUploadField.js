"use client";

import { useState } from "react";

// ponytail: plain <input type="file"> + object-URL preview, no cropper/dropzone lib needed for one field.
export default function ImageUploadField({ name, label, defaultImage, inputClassName }) {
  const [preview, setPreview] = useState(defaultImage || "");

  return (
    <div>
      {label && <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">{label}</label>}
      {preview && (
        <img src={preview} alt="" className="w-16 h-16 object-cover rounded border border-neutral-700 mb-2" />
      )}
      <input
        type="file"
        name={name}
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) setPreview(URL.createObjectURL(file));
        }}
        className={inputClassName || "block w-full text-sm text-neutral-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-rose-600 file:text-white file:font-bold file:text-xs file:uppercase hover:file:bg-rose-500"}
      />
    </div>
  );
}
