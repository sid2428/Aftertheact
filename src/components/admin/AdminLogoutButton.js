"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLogoutButton() {
  const [confirm, setConfirm] = useState(false);

  return (
    <>
      <button onClick={() => setConfirm(true)} className="hover:text-latent-crimson transition-colors">Logout</button>

      <AnimatePresence>
        {confirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
            onClick={() => setConfirm(false)}
          >
            <div onClick={(e) => e.stopPropagation()} className="bg-[#111111] border border-latent-crimson/30 rounded-md p-6 max-w-sm w-full text-center">
              <div className="font-display font-black uppercase tracking-widest text-white mb-2">Sign out of the Control Panel?</div>
              <p className="text-white/50 text-sm mb-6">You&apos;ll need to sign back in to manage the show.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => signOut({ callbackUrl: "/admin-login" })} className="bg-latent-crimson text-white font-display font-black uppercase text-xs tracking-widest px-5 py-2.5 rounded-sm">Sign Out</button>
                <button onClick={() => setConfirm(false)} className="glass-panel text-white font-display font-black uppercase text-xs tracking-widest px-5 py-2.5 rounded-sm">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
