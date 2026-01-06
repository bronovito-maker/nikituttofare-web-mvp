'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export function ClientAnimationWrapper({
  children,
  delay = 0,
  duration = 0.7,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
}) {
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
