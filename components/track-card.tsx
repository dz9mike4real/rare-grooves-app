'use client';

import React, { memo } from "react"

import { Track } from '@/lib/types';
import { Card, ActionIcon, Badge } from '@mantine/core';
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
      className={`group bg-background border-2 border-primary/20 overflow-hidden hover:border-primary cursor-pointer transition-all duration-300 rounded-none shadow-[4px_4px_0px_rgba(0,0,0,0.1)] ${isPlaying ? 'border-primary ring-2 ring-primary/20' : ''
        } ${isFocused ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : ''}`}
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
      <div className="relative aspect-square overflow-hidden">
        <OptimizedTrackImage
          src={track.albumArt || ''}
          alt={`Album art for ${track.album} by ${track.artist}`}
          artist={track.artist}
          fill
          className="object-cover group-hover:scale-110"
          priority={isPriority}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 bg-black/5 backdrop-blur-[2px]">
          <div className={`transform scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 ease-out ${isPlaying ? 'scale-100 opacity-100' : ''}`}>
            <ActionIcon
              size="xl"
              radius="xl"
              className="h-14 w-14 shadow-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white z-30 transition-all hover:scale-105"
              onClick={() => onPlay(track)}
              aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6 text-white" />
              ) : (
                <Play className="h-6 w-6 text-white ml-1" />
              )}
            </ActionIcon>
          </div>
        </div>

        <ActionIcon
          variant="subtle"
          size="xl"
          radius="xl"
          className={`absolute top-1 right-1 backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 z-20 h-11 w-11 ${isFav
            ? 'bg-primary/80 hover:bg-primary'
            : 'bg-black/40 dark:bg-black/40 hover:bg-primary/80'
            }`}
          onClick={handleFavoriteToggle}
          aria-label={isFav ? `Remove ${track.title} from favorites` : `Add ${track.title} to favorites`}
          aria-pressed={isFav}
        >
          <Heart className={`h-4 w-4 ${isFav ? 'fill-white text-white' : 'text-white/70'}`} />
        </ActionIcon>

        {/* Audio Source Badge - Only show if real */}
        {hasRealAudio && (
          <div className="absolute bottom-2 left-2">
            <Badge color="green" size="xs" variant="filled" className="px-1.5 py-0 font-medium tracking-tight">
              Real
            </Badge>
          </div>
        )}

      </div>

      {/* Track Info */}
      <div className="p-4 border-t-2 border-primary/10">
        <h3 className="font-semibold text-foreground truncate text-sm leading-tight mb-0.5">{track.title}</h3>
        <p className="text-primary font-bold truncate text-[10px] uppercase tracking-wider mb-2">{track.artist}</p>

        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground capitalize border-t border-primary/5 pt-2">
          <span className="truncate max-w-[60%]">{track.genre}</span>
          <span>{track.year}</span>
        </div>
      </div>
    </Card>
  );
});
