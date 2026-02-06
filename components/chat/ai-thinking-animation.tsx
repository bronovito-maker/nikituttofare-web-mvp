'use client';

import { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';

type AnimationType = 'dots' | 'wave' | 'shimmer' | 'pulse' | 'typing';

interface AIThinkingAnimationProps {
  variant?: AnimationType | 'random';
  interval?: number; // Milliseconds to switch animation (only for 'random')
}

export function AIThinkingAnimation({
  variant = 'random',
  interval = 4000
}: AIThinkingAnimationProps) {
  const [currentAnimation, setCurrentAnimation] = useState<AnimationType>('dots');

  // Alternate animations if variant is 'random'
  useEffect(() => {
    if (variant !== 'random') {
      setCurrentAnimation(variant);
      return;
    }

    const animations: AnimationType[] = ['dots', 'wave', 'shimmer', 'pulse', 'typing'];
    let currentIndex = 0;

    const intervalId = setInterval(() => {
      currentIndex = (currentIndex + 1) % animations.length;
      setCurrentAnimation(animations[currentIndex]);
    }, interval);

    return () => clearInterval(intervalId);
  }, [variant, interval]);

  return (
    <div className="flex items-start gap-3">
      {/* AI Avatar */}
      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
        <Bot className="w-4 h-4 text-white" />
      </div>

      {/* Thinking Bubble */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-md px-5 py-4 shadow-sm min-w-[120px]">
        {currentAnimation === 'dots' && <ThinkingDots />}
        {currentAnimation === 'wave' && <WaveBars />}
        {currentAnimation === 'shimmer' && <ShimmerEffect />}
        {currentAnimation === 'pulse' && <PulseRings />}
        {currentAnimation === 'typing' && <TypingEffect />}
      </div>
    </div>
  );
}

// Animation 1: Classic Thinking Dots (improved)
function ThinkingDots() {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <div className="w-2.5 h-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full animate-bounce-thinking"
           style={{ animationDelay: '0ms' }} />
      <div className="w-2.5 h-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full animate-bounce-thinking"
           style={{ animationDelay: '150ms' }} />
      <div className="w-2.5 h-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full animate-bounce-thinking"
           style={{ animationDelay: '300ms' }} />
      <style jsx>{`
        @keyframes bounce-thinking {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.7; }
          30% { transform: translateY(-8px); opacity: 1; }
        }
        .animate-bounce-thinking {
          animation: bounce-thinking 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Animation 2: Wave Bars (like audio visualizer)
function WaveBars() {
  return (
    <div className="flex items-center justify-center gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-full animate-wave-bar"
          style={{
            animationDelay: `${i * 100}ms`,
            height: '20px'
          }}
        />
      ))}
      <style jsx>{`
        @keyframes wave-bar {
          0%, 100% { transform: scaleY(0.5); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        .animate-wave-bar {
          animation: wave-bar 1.2s ease-in-out infinite;
          transform-origin: bottom;
        }
      `}</style>
    </div>
  );
}

// Animation 3: Shimmer Effect (like loading skeleton)
function ShimmerEffect() {
  return (
    <div className="relative w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div className="absolute inset-0 animate-shimmer-slide">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
      </div>
      <style jsx>{`
        @keyframes shimmer-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer-slide {
          animation: shimmer-slide 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Animation 4: Pulse Rings (concentric circles)
function PulseRings() {
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <div className="absolute w-3 h-3 bg-blue-500 rounded-full" />
      <div className="absolute w-6 h-6 border-2 border-blue-400 rounded-full animate-pulse-ring"
           style={{ animationDelay: '0ms' }} />
      <div className="absolute w-9 h-9 border-2 border-blue-300 rounded-full animate-pulse-ring"
           style={{ animationDelay: '400ms' }} />
      <div className="absolute w-12 h-12 border-2 border-blue-200 rounded-full animate-pulse-ring"
           style={{ animationDelay: '800ms' }} />
      <style jsx>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.5); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: scale(1); opacity: 0; }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s ease-out infinite;
        }
      `}</style>
    </div>
  );
}

// Animation 5: Typing Effect (like typewriter)
function TypingEffect() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
        Sto pensando
      </span>
      <span className="text-blue-500 font-bold w-4 text-left">
        {dots}
      </span>
    </div>
  );
}

// Export individual animations for direct use
export { ThinkingDots, WaveBars, ShimmerEffect, PulseRings, TypingEffect };
