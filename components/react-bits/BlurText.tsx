"use client";

import { motion } from "framer-motion";
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
  duration = 1,
}: BlurTextProps) {
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
