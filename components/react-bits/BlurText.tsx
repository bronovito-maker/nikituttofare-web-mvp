"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
}

export function BlurText({
  text,
  className,
  delay = 0,
  duration = 1,
}: BlurTextProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fallback for SSR - show text immediately without animation
  if (!isMounted) {
    return (
      <h1 className={cn("drop-shadow-sm", className)}>
        {text}
      </h1>
    );
  }

  return (
    <motion.h1
      initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
      animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
      transition={{ duration: duration, delay: delay, ease: "easeOut" }}
      className={cn("drop-shadow-sm", className)}
    >
      {text}
    </motion.h1>
  );
}
