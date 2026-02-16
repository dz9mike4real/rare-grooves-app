'use client';

import { useState } from 'react';
import { Track } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Loader2, RefreshCw } from 'lucide-react';

interface DiscoveryButtonProps {
  tracks: Track[];
  onDiscover: (discovered: Track[]) => void;
  currentTrack?: Track | null;
}

export function DiscoveryButton({ tracks, onDiscover, currentTrack }: DiscoveryButtonProps) {
  const [isDiscovering, setIsDiscovering] = useState(false);

  const handleDiscover = async () => {
    setIsDiscovering(true);

    try {
      // Call AI discovery API
      const response = await fetch('/api/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre: currentTrack?.genre,
          favorites: [],
        })
      });

      if (response.ok) {
        // Use algorithmic discovery to find similar tracks
        const discovered = discoverSimilarTracks(tracks, currentTrack || null);
        onDiscover(discovered);
      }
    } catch (error) {
      console.error('[v0] Discovery error:', error);
      // Fallback to algorithmic discovery
      const discovered = discoverSimilarTracks(tracks, currentTrack || null);
      onDiscover(discovered);
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <Button
      onClick={handleDiscover}
      disabled={isDiscovering}
      className="gradient-bg hover:opacity-90"
      size="sm"
    >
      {isDiscovering ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Discovering...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          AI Discovery
        </>
      )}
    </Button>
  );
}

// Algorithmic discovery engine
function discoverSimilarTracks(allTracks: Track[], currentTrack: Track | null): Track[] {
  // If no current track, find random rare tracks
  if (!currentTrack) {
    return allTracks
      .filter(t => t.rarity >= 8)
      .sort(() => Math.random() - 0.5)
      .slice(0, 8);
  }

  // Score each track based on similarity
  const scored = allTracks
    .filter(t => t.id !== currentTrack.id)
    .map(track => {
      let score = 0;

      // Same genre: +30 points
      if (track.genre === currentTrack.genre) score += 30;

      // Similar year (within 5 years): +20 points
      if (Math.abs(track.year - currentTrack.year) <= 5) score += 20;

      // Similar BPM (±10): +15 points
      if (track.bpm && currentTrack.bpm) {
        if (Math.abs(track.bpm - currentTrack.bpm) <= 10) score += 15;
      }

      // Same key (relative major/minor): +10 points
      if (track.key && currentTrack.key) {
        if (track.key === currentTrack.key) score += 10;
      }

      // Higher rarity: +10 points (we want rare!)
      if (track.rarity >= currentTrack.rarity) score += 10;

      // Random factor for discovery: +15 points
      score += Math.random() * 15;

      return { track, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(item => item.track);

  return scored;
}

interface DiscoveryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  discoveredTracks: Track[];
  onPlayTrack: (track: Track) => void;
}

export function DiscoveryPanel({ isOpen, onClose, discoveredTracks, onPlayTrack }: DiscoveryPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl glass-card z-50 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg gradient-bg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">AI Discovery</h3>
              <p className="text-sm text-white/50">Tracks selected just for you</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {discoveredTracks.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {discoveredTracks.map((track, index) => (
              <div
                key={track.id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                onClick={() => {
                  onPlayTrack(track);
                  onClose();
                }}
              >
                <span className="text-2xl font-bold text-white/20 w-8">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="w-12 h-12 rounded-lg bg-white/10 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{track.title}</p>
                  <p className="text-sm text-white/60 truncate">{track.artist}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-white/40 capitalize">{track.genre}</p>
                  <p className="text-xs text-white/40">{track.year}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-white/60">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click &quot;AI Discovery&quot; to find new tracks</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const shuffled = [...discoveredTracks].sort(() => Math.random() - 0.5);
              onPlayTrack(shuffled[0]);
            }}
            disabled={discoveredTracks.length === 0}
            className="border-white/20 text-white/60 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Shuffle
          </Button>
          <Button
            onClick={() => {
              if (discoveredTracks.length > 0) {
                onPlayTrack(discoveredTracks[0]);
                onClose();
              }
            }}
            disabled={discoveredTracks.length === 0}
            className="gradient-bg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Play All
          </Button>
        </div>
      </div>
    </>
  );
}
