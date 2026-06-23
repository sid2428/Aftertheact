"use client";

import { motion } from "framer-motion";

export default function RevelationSequence({ children, isRevealed }) {
  if (!isRevealed) {
    return <div className="grid md:grid-cols-2 gap-6">{children}</div>;
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.8 // Deliberate, dramatic stagger
      }
    }
  };

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="grid md:grid-cols-2 gap-6 bg-brand-black p-6 border-4 border-brand-black"
    >
      {/* We pass the children through. If we want each card to animate, we need to map them or assume children are wrapped in motion.div */}
      {children}
    </motion.div>
  );
}

export function RevelationItem({ children }) {
  const item = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", bounce: 0.4, duration: 1 } }
  };
  return <motion.div variants={item}>{children}</motion.div>;
}
