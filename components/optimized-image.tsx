'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  artist: string;
}

// Generate a tiny blur placeholder
function generateBlurPlaceholder(artist: string): string {
  const hash = artist.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const hue = Math.abs(hash % 360);
  
  // Create a 20x20 SVG for blur
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><rect fill="hsl(${hue},60%,35%)" width="20" height="20"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function OptimizedTrackImage({
  src,
  alt,
  fill = true,
  width,
  height,
  className = '',
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
  artist
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Start loading 200px before visible
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Generate colored placeholder
  const blurDataURL = generateBlurPlaceholder(artist);

  // If error, show placeholder
  if (hasError) {
    return (
      <div 
        className={`bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center ${className}`}
        style={{ width: fill ? '100%' : width, height: fill ? '100%' : height }}
      >
        <span className="text-4xl font-bold text-white/30">
          {artist.substring(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width: fill ? '100%' : width, height: fill ? '100%' : height }}
    >
      {/* Loading placeholder */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 animate-pulse"
          style={{
            background: `linear-gradient(135deg, hsl(${Math.abs(artist.charCodeAt(0) % 360)}, 60%, 30%), hsl(${(Math.abs(artist.charCodeAt(0) % 360) + 60) % 360}, 50%, 25%))`
          }}
        />
      )}
      
      {/* Actual image - only load when in view */}
      {isInView && (
        <Image
          src={src}
          alt={alt}
          fill={fill}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          className={`object-cover transition-all duration-500 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'} ${className}`}
          sizes={sizes}
          priority={priority}
          placeholder="blur"
          blurDataURL={blurDataURL}
          quality={85}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}
