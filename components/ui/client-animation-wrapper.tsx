'use client';

import { motion } from 'framer-motion';
import { ReactNode, useState, useEffect } from 'react';

interface ClientAnimationWrapperProps {
  readonly children: ReactNode;
  readonly delay?: number;
  duration?: number;
}

export function ClientAnimationWrapper({
  children,
  delay = 0,
  duration = 0.7,
}: ClientAnimationWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fallback for SSR - show content immediately without animation
  if (!isMounted) {
    return <div>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
