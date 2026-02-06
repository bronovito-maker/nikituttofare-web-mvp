"use client";

import { cn } from "@/lib/utils";

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
}: BlurTextProps) {
  // SSR-safe: Pure CSS animation, no JS delay on mobile
  return (
    <h1
      className={cn(
        "drop-shadow-sm",
        // Desktop: animated entry
        "md:opacity-0 md:animate-lcp-entry",
        // Mobile: instant visibility (LCP optimization)
        "max-md:!opacity-100",
        className
      )}
      style={{
        // Only apply delay on desktop
        animationDelay: delay > 0 ? `${delay}s` : undefined
      }}
    >
      {text}
    </h1>
  );
}
