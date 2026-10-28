import { useEffect, useState } from 'react';

interface CountUpOptions {
  duration?: number;
  startTrigger?: boolean;
  decimals?: number;
}

export function useCountUp(target: number, options: CountUpOptions = {}): number {
  const { duration = 1400, startTrigger = true, decimals = 0 } = options;
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!startTrigger) return;

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target);
      return;
    }

    if (target === 0) {
      setCount(0);
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function: easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentVal = ease * target;
      
      setCount(Number(currentVal.toFixed(decimals)));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [target, duration, startTrigger, decimals]);

  return count;
}
