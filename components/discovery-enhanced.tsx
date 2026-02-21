'use client';

import { useState, useEffect } from 'react';
import { Track } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dice5, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DiscoveryButtonsProps {
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  selectedTrack: Track | null;
}

export function SurpriseMeButton({ tracks, onPlayTrack }: DiscoveryButtonsProps) {
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
  
  return (
    <Button
      onClick={handleSurpriseMe}
      variant="outline"
      size="sm"
      className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
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
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          Recently Played
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground/60 hover:text-muted-foreground"
        >
          Clear
        </Button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {recentTracks.map((track) => (
          <button
            key={track.id}
            onClick={() => onPlayTrack(track)}
            className="flex-shrink-0 w-32 text-left group"
          >
            <div className="aspect-square rounded-lg bg-muted overflow-hidden mb-2 group-hover:ring-2 group-hover:ring-primary/50 transition-all">
              <img
                src={track.albumArt || '/placeholder.svg'}
                alt={track.album}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <p className="text-sm text-foreground truncate">{track.title}</p>
            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
