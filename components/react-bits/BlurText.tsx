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

  // SSR & Initial Hydration: Use CSS animation to ensure the browser
  // discovers and paints the element immediately without waiting for Framer Motion JS.
  return (
    <h1
      className={cn(
        "drop-shadow-sm opacity-0 animate-lcp-entry",
        className
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      {text}
    </h1>
  );
}
