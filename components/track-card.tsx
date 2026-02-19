'use client';

import React, { memo } from "react"

import { Track } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Heart, Clock, Disc } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { isFavorite, addFavorite, removeFavorite } from '@/lib/storage';
import Image from 'next/image';

function getPlaceholderArt(artist: string): string {
  let hash = 0;
  for (let i = 0; i < artist.length; i++) {
    hash = artist.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hue},70%,45%)"/>
        <stop offset="100%" stop-color="hsl(${(hue+60)%360},60%,30%)"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#g)"/>
    <text x="50%" y="50%" font-family="Arial" font-size="100" fill="white" text-anchor="middle" dy=".35em" opacity="0.4">${artist.substring(0,2).toUpperCase()}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

interface TrackCardProps {
  track: Track;
  onPlay: (track: Track) => void;
  isPlaying: boolean;
  onFavoriteToggle?: () => void;
}

export const TrackCard = memo(function TrackCard({ track, onPlay, isPlaying, onFavoriteToggle }: TrackCardProps) {
  const [isFav, setIsFav] = useState(false);
  const hasRealAudio = track.audioUrl?.startsWith('http');
  
  const albumArt = useMemo(() => {
    if (!track.albumArt || track.albumArt.includes('unsplash.com')) {
      return getPlaceholderArt(track.artist);
    }
    return track.albumArt;
  }, [track.albumArt, track.artist]);

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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card 
      className={`group glass-card overflow-hidden hover-lift cursor-pointer transition-all duration-300 ${
        isPlaying ? 'playing-glow border-[#0a4d7f]/50' : ''
      }`}
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
        <Image
          src={albumArt}
          alt={`Album art for ${track.album} by ${track.artist}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className={`transform scale-0 group-hover:scale-100 transition-transform duration-300 ${isPlaying ? 'scale-100' : ''}`}>
            <Button
              size="icon"
              className={`h-14 w-14 rounded-full shadow-2xl ${
                isPlaying ? 'gradient-bg' : 'bg-[#0a4d7f] hover:bg-[#1a7dbf]'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onPlay(track);
              }}
              aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
            >
              {isPlaying ? (
                <Pause className="h-7 w-7 text-white" />
              ) : (
                <Play className="h-7 w-7 text-white ml-1" />
              )}
            </Button>
          </div>
        </div>

        {/* Rarity Badge */}
        <div className="absolute top-3 left-3">
          <Badge 
            className={`${
              track.rarity >= 9 
                ? 'bg-gradient-to-r from-[#0a4d7f] to-[#0d6efd] text-white border-0' 
                : 'bg-[#1db954] text-white border-0'
            } font-semibold text-xs shadow-lg`}
            aria-label={`Rarity: ${track.rarity >= 9 ? 'Ultra Rare' : 'Rare'}`}
          >
            {track.rarity >= 9 ? 'Ultra Rare' : 'Rare'}
          </Badge>
        </div>

        {/* Audio Source Badge */}
        <div className="absolute bottom-3 right-3">
          <Badge 
            className={`text-xs font-medium ${
              hasRealAudio 
                ? 'bg-[#1db954]/80 text-white border-0' 
                : 'bg-white/20 text-white/80 border-0'
            }`}
            aria-label={hasRealAudio ? 'Real audio preview available' : 'Demo audio'}
          >
            {hasRealAudio ? 'Real' : 'Demo'}
          </Badge>
        </div>

        {/* Favorite Button - Always visible */}
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-3 right-3 h-9 w-9 backdrop-blur-sm rounded-full transition-all duration-300 ${
            isFav 
              ? 'bg-[#0d6efd]/80 hover:bg-[#0d6efd]' 
              : 'bg-black/40 hover:bg-black/60 opacity-100'
          }`}
          onClick={handleFavoriteToggle}
          aria-label={isFav ? `Remove ${track.title} from favorites` : `Add ${track.title} to favorites`}
          aria-pressed={isFav}
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isFav 
                ? 'fill-white text-white' 
                : 'text-white'
            }`}
          />
        </Button>

        {/* Playing Indicator */}
        {isPlaying && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1" role="status" aria-label="Now playing">
            <div className="flex items-end gap-0.5 h-4">
              <span className="w-1 h-1 bg-[#0a4d7f] rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-2 bg-[#0a4d7f] rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-3 bg-[#0a4d7f] rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              <span className="w-1 h-2 bg-[#0a4d7f] rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-white line-clamp-1 text-base">{track.title}</h3>
        <p className="text-white/60 line-clamp-1 text-sm">{track.artist}</p>
        
        <div className="flex items-center justify-between text-xs text-white/40 pt-2 border-t border-white/10">
          <span className="capitalize flex items-center gap-1">
            <Disc className="h-3 w-3" aria-hidden="true" />
            {track.genre}
          </span>
          <span>{track.year}</span>
        </div>
        
        {track.bpm && track.key && (
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>{track.bpm} BPM</span>
            <span>{track.key}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1 text-xs text-white/40">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {formatDuration(track.duration)}
        </div>
      </div>
    </Card>
  );
});
