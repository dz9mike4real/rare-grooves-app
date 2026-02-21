'use client';

import React, { memo } from "react"

import { Track } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { isFavorite, addFavorite, removeFavorite } from '@/lib/storage';
import { OptimizedTrackImage } from './optimized-image';

interface TrackCardProps {
  track: Track;
  onPlay: (track: Track) => void;
  isPlaying: boolean;
  onFavoriteToggle?: () => void;
  index?: number;
  isFocused?: boolean;
}

export const TrackCard = memo(function TrackCard({ track, onPlay, isPlaying, onFavoriteToggle, index, isFocused }: TrackCardProps) {
  const [isFav, setIsFav] = useState(false);
  const hasRealAudio = track.audioUrl?.startsWith('http');
  
  // Only prioritize first 8 visible images
  const isPriority = index !== undefined && index < 8;

  useEffect(() => {
    setIsFav(isFavorite(track.id));
  }, [track.id]);

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFav) {
      removeFavorite(track.id);
      setIsFav(false);
    } else {
      addFavorite(track.id);
      setIsFav(true);
      if (onFavoriteToggle) {
        onFavoriteToggle();
      }
    }
  };

  return (
    <Card 
      className={`group glass-card overflow-hidden hover-lift cursor-pointer transition-all duration-300 ${
        isPlaying ? 'playing-glow border-[#0a4d7f]/50' : ''
      } ${isFocused ? 'ring-2 ring-[#0a4d7f] ring-offset-2 ring-offset-[#121212]' : ''}`}
      onClick={() => onPlay(track)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPlay(track);
        }
      }}
      aria-label={`${track.title} by ${track.artist}${isPlaying ? ', currently playing' : ''}. Press Enter to play`}
    >
      <div className="relative aspect-square overflow-hidden rounded-t-xl">
        <OptimizedTrackImage
          src={track.albumArt || ''}
          alt={`Album art for ${track.album} by ${track.artist}`}
          artist={track.artist}
          fill
          className="object-cover group-hover:scale-110"
          priority={isPriority}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
          {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className={`transform scale-0 group-hover:scale-100 transition-transform duration-300 ${isPlaying ? 'scale-100' : ''}`}>
            <Button
              size="icon"
              className={`h-12 w-12 rounded-full shadow-2xl ${
                isPlaying ? 'gradient-bg' : 'bg-[#0a4d7f] hover:bg-[#1a7dbf]'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onPlay(track);
              }}
              aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6 text-white" />
              ) : (
                <Play className="h-6 w-6 text-white ml-1" />
              )}
            </Button>
          </div>
        </div>

        {/* Favorite Button - Always visible on hover */}
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-2 right-2 h-7 w-7 backdrop-blur-sm rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 ${
            isFav 
              ? 'bg-primary/80 hover:bg-primary' 
              : 'bg-black/40 dark:bg-black/40 hover:bg-primary/80'
          }`}
          onClick={handleFavoriteToggle}
          aria-label={isFav ? `Remove ${track.title} from favorites` : `Add ${track.title} to favorites`}
          aria-pressed={isFav}
        >
          <Heart className={`h-3.5 w-3.5 ${isFav ? 'fill-white text-white' : 'text-white/70'}`} />
        </Button>

        {/* Audio Source Badge - Only show if real */}
        {hasRealAudio && (
          <div className="absolute bottom-2 left-2">
            <Badge className="text-[10px] font-medium bg-green-600 text-white border-0 px-1.5 py-0">
              Real
            </Badge>
          </div>
        )}

      </div>

      {/* Track Info */}
      <div className="p-2">
        <h3 className="font-semibold text-foreground truncate text-sm leading-tight">{track.title}</h3>
        <p className="text-muted-foreground truncate text-xs mb-1.5">{track.artist}</p>
        
        <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
          <span className="capitalize truncate max-w-[60%]">{track.genre}</span>
          <span>{track.year}</span>
        </div>
        
        {track.bpm && track.key && (
          <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
            <span>{track.bpm} BPM</span>
            <span>{track.key}</span>
          </div>
        )}
      </div>
    </Card>
  );
});
