"use client";

import { motion } from "framer-motion";

export function HeroStagger({ children }) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="text-center space-y-6 py-16 sm:py-24 border-b-4 border-brand-black">
      {/* We map over children to apply the item variant if needed, 
          but for simplicity we'll just wrap the block and let the children be simple DOM nodes 
          that are manually wrapped in motion.div if we want them staggered. */}
      {children}
    </motion.div>
  );
}

export function HeroItem({ children, className }) {
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };
  return <motion.div variants={item} className={className}>{children}</motion.div>;
}
