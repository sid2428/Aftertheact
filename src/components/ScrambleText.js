"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";

export default function ScrambleText({ text, speed = 40, delay = 0, className = "" }) {
  const [displayText, setDisplayText] = useState(text);
  const [scrambling, setScrambling] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    let startDelay;
    const scramble = () => {
      setScrambling(true);
      let iteration = 0;
      clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        setDisplayText((prev) =>
          text
            .split("")
            .map((char, index) => {
              if (index < iteration) {
                return text[index];
              }
              return CHARS[Math.floor(Math.random() * CHARS.length)];
            })
            .join("")
        );

        if (iteration >= text.length) {
          clearInterval(timerRef.current);
          setScrambling(false);
        }
        
        iteration += 1 / 3; 
      }, speed);
    };

    if (delay > 0) {
      startDelay = setTimeout(scramble, delay);
    } else {
      scramble();
    }

    return () => {
      clearTimeout(startDelay);
      clearInterval(timerRef.current);
    };
  }, [text, speed, delay]);

  return (
    <motion.span 
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {displayText}
    </motion.span>
  );
}
