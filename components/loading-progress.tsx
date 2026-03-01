'use client';

import { useState, useEffect, useRef } from 'react';

interface LoadingProgressProps {
  total: number;
  loaded: number;
  label?: string;
}

export function LoadingProgress({ total, loaded, label = 'Loading tracks' }: LoadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const targetProgress = total > 0 ? (loaded / total) * 100 : 0;
  const requestRef = useRef<number>(null);
  const previousTimeRef = useRef<number>(null);

  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        setProgress(prev => {
          const diff = targetProgress - prev;
          const step = diff * 0.1; // Smooth easing
          if (Math.abs(diff) < 0.1) return targetProgress;
          return prev + step;
        });
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [targetProgress]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-foreground/60">{label}</span>
        <span className="text-sm text-foreground/60">
          {loaded} / {total}
        </span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full gradient-bg transition-all duration-300 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="mt-2 text-xs text-foreground/40 text-center">
        {Math.round(progress)}%
      </div>
    </div>
  );
}
