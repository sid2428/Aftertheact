"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NoticePopup({ notice }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (notice) {
      setShow(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setShow(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-2 border-oracle-gold bg-[#120f02] p-5 font-mono font-black text-oracle-gold min-w-[320px]"
        >
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="mb-1 block font-display text-[10px] font-black uppercase tracking-[0.2em] text-oracle-gold/70">System Broadcast</span>
              <div className="text-sm tracking-wide">{notice}</div>
            </div>
            <button
              onClick={() => setShow(false)}
              className="text-oracle-gold/50 hover:text-white transition-colors p-1"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
