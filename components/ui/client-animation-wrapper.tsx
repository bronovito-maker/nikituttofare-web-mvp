import { m } from 'framer-motion';
import { ReactNode, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ClientAnimationWrapperProps {
  readonly children: ReactNode;
  readonly delay?: number;
  duration?: number;
  readonly className?: string;
}

export function ClientAnimationWrapper({
  children,
  delay = 0,
  duration = 0.7,
  className,
}: ClientAnimationWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fallback for SSR - show content immediately without animation
  if (!isMounted) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </m.div>
  );
}
