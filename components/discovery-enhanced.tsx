'use client';

import { useState, useEffect } from 'react';
import { Track } from '@/lib/types';
import { Button, ActionIcon } from '@mantine/core';
import { Dice5, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DiscoveryButtonsProps {
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  selectedTrack: Track | null;
  iconOnly?: boolean;
}

export function SurpriseMeButton({ tracks, onPlayTrack, iconOnly }: DiscoveryButtonsProps) {
  const { toast } = useToast();

  const handleSurpriseMe = () => {
    if (tracks.length === 0) return;

    // Get a random track, preferring rare ones (rarity 8+)
    const rareTracks = tracks.filter(t => t.rarity >= 8);
    const pool = rareTracks.length > 0 ? rareTracks : tracks;
    const randomTrack = pool[Math.floor(Math.random() * pool.length)];

    onPlayTrack(randomTrack);

    toast({
      title: 'Surprise!',
      description: `Playing ${randomTrack.title} by ${randomTrack.artist}`,
      duration: 2000,
    });
  };

  if (iconOnly) {
    return (
      <ActionIcon
        onClick={handleSurpriseMe}
        variant="subtle"
        size="xl"
        className="bg-background border-2 border-primary/20 rounded-none hover:border-primary h-11 w-11 transition-all"
        color="gray"
        title="Surprise Me"
      >
        <Dice5 className="h-4 w-4 text-primary" />
      </ActionIcon>
    );
  }

  return (
    <Button
      onClick={handleSurpriseMe}
      variant="outline"
      size="sm"
      className="border-2 border-primary text-primary font-black uppercase tracking-tighter rounded-none hover:bg-primary hover:text-primary-foreground transition-all"
    >
      <Dice5 className="h-4 w-4 mr-2" />
      Surprise Me
    </Button>
  );
}

const RECENTLY_PLAYED_KEY = 'rare-grooves-recently-played';
const MAX_RECENT_TRACKS = 20;

export function useRecentlyPlayed() {
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);

  useEffect(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem(RECENTLY_PLAYED_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentTracks(parsed);
      } catch (e) {
        console.error('Failed to parse recently played:', e);
      }
    }
  }, []);

  const addToRecentlyPlayed = (track: Track) => {
    setRecentTracks(prev => {
      // Remove if already exists (move to top)
      const filtered = prev.filter(t => t.id !== track.id);
      // Add to beginning
      const updated = [track, ...filtered].slice(0, MAX_RECENT_TRACKS);
      // Save to localStorage
      localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentlyPlayed = () => {
    setRecentTracks([]);
    localStorage.removeItem(RECENTLY_PLAYED_KEY);
  };

  return { recentTracks, addToRecentlyPlayed, clearRecentlyPlayed };
}

interface RecentlyPlayedProps {
  recentTracks: Track[];
  onPlayTrack: (track: Track) => void;
  onClear: () => void;
}

export function RecentlyPlayed({ recentTracks, onPlayTrack, onClear }: RecentlyPlayedProps) {
  if (recentTracks.length === 0) return null;

  return (
    <div className="mb-12 border-t-2 border-primary/10 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-foreground flex items-center gap-3 uppercase tracking-tighter">
          <History className="h-6 w-6 text-primary" />
          Recently Spun
        </h3>
        <Button
          variant="subtle"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear
        </Button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {recentTracks.map((track) => (
          <button
            key={track.id}
            onClick={() => onPlayTrack(track)}
            className="flex-shrink-0 w-36 text-left group"
          >
            <div className="aspect-square bg-background border-2 border-primary/10 overflow-hidden mb-3 group-hover:border-primary transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.05)]">
              <img
                src={track.albumArt || '/placeholder.svg'}
                alt={track.album}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <p className="text-xs font-semibold text-foreground truncate mb-0.5">{track.title}</p>
            <p className="text-[10px] font-bold text-primary truncate uppercase tracking-wider">{track.artist}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
