'use client';

import { useState, useEffect } from 'react';

interface LoadingProgressProps {
  total: number;
  loaded: number;
  label?: string;
}

export function LoadingProgress({ total, loaded, label = 'Loading tracks' }: LoadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [displayLoaded, setDisplayLoaded] = useState(0);

  useEffect(() => {
    // Animate progress smoothly
    const targetProgress = total > 0 ? (loaded / total) * 100 : 0;
    const duration = 300;
    const startTime = Date.now();
    const startProgress = progress;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const easeOutQuart = 1 - Math.pow(1 - Math.min(elapsed / duration, 1), 4);
      const currentProgress = startProgress + (targetProgress - startProgress) * easeOutQuart;
      
      setProgress(currentProgress);
      setDisplayLoaded(Math.round(loaded * easeOutQuart));

      if (elapsed < duration) {
        requestAnimationFrame(animate);
      } else {
        setDisplayLoaded(loaded);
      }
    };

    requestAnimationFrame(animate);
  }, [loaded, total, progress]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-white/60">{label}</span>
        <span className="text-sm text-white/60">
          {displayLoaded} / {total}
        </span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#0a4d7f] to-[#1db954] transition-all duration-300 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="mt-2 text-xs text-white/40 text-center">
        {Math.round(progress)}%
      </div>
    </div>
  );
}
