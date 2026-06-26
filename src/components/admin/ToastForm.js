"use client";

import { useState } from "react";

// Wraps a <form> whose action is a server action and pops a brief success toast
// when it resolves. ponytail: inline toast, no toast lib for one admin screen.
export default function ToastForm({ action, className, children, message = "Saved" }) {
  const [show, setShow] = useState(false);

  return (
    <>
      <form
        className={className}
        action={async (formData) => {
          try {
            const res = await action(formData);
            if (res?.success === false) return; // action reported failure
          } catch {
            return; // server action threw; Next surfaces the error itself
          }
          setShow(true);
          setTimeout(() => setShow(false), 3000);
        }}
      >
        {children}
      </form>
      {show && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-latent-gold text-[#0A0A0A] font-display font-black uppercase tracking-widest text-sm px-5 py-3 rounded-md shadow-[0_0_25px_rgba(212,175,55,0.5)] animate-fade-in-up"
        >
          ✓ {message}
        </div>
      )}
    </>
  );
}
