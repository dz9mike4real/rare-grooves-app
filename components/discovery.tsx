'use client';

import { useState } from 'react';
import { Track } from '@/lib/types';
import { Button, ActionIcon } from '@mantine/core';
import { Sparkles, X, Loader2, RefreshCw } from 'lucide-react';
import { DISCOVERY } from '@/lib/constants';

interface DiscoveryButtonProps {
  tracks: Track[];
  onDiscover: (discovered: Track[]) => void;
  currentTrack?: Track | null;
  iconOnly?: boolean;
}

export function DiscoveryButton({ tracks, onDiscover, currentTrack, iconOnly }: DiscoveryButtonProps) {
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

      // Use algorithmic discovery as primary/fallback
      // We always use local discovery for now as it's faster and reliable
      const discovered = discoverSimilarTracks(tracks, currentTrack || null);
      onDiscover(discovered);
    } catch (error) {
      console.error('[v0] Discovery error:', error);
      // Fallback to algorithmic discovery
      const discovered = discoverSimilarTracks(tracks, currentTrack || null);
      onDiscover(discovered);
    } finally {
      setIsDiscovering(false);
    }
  };

  if (iconOnly) {
    return (
      <ActionIcon
        onClick={handleDiscover}
        disabled={isDiscovering}
        variant="subtle"
        size="xl"
        className="bg-background border-2 border-primary/20 rounded-none hover:border-primary h-11 w-11 transition-all"
        color="gray"
        title="Discover Similar"
      >
        {isDiscovering ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <Sparkles className="h-4 w-4 text-foreground" />
        )}
      </ActionIcon>
    );
  }

  return (
    <Button
      onClick={handleDiscover}
      disabled={isDiscovering}
      className="gradient-bg hover:opacity-90 border-0"
      size="sm"
    >
      {isDiscovering ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Finding similar...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          Discover Similar
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
      .filter(t => t.rarity >= DISCOVERY.MIN_RARITY)
      .sort(() => Math.random() - 0.5)
      .slice(0, DISCOVERY.MAX_RESULTS);
  }

  // Score each track based on similarity
  const scored = allTracks
    .filter(t => t.id !== currentTrack.id)
    .map(track => {
      let score = 0;

      // Same genre: +30 points
      if (track.genre === currentTrack.genre) score += DISCOVERY.SCORE_SAME_GENRE;

      // Similar year (within 5 years): +20 points
      if (Math.abs(track.year - currentTrack.year) <= DISCOVERY.YEAR_THRESHOLD) score += DISCOVERY.SCORE_SIMILAR_YEAR;

      // Similar BPM (±10): +15 points
      if (track.bpm && currentTrack.bpm) {
        if (Math.abs(track.bpm - currentTrack.bpm) <= DISCOVERY.BPM_THRESHOLD) score += DISCOVERY.SCORE_SIMILAR_BPM;
      }

      // Same key (relative major/minor): +10 points
      if (track.key && currentTrack.key) {
        if (track.key === currentTrack.key) score += DISCOVERY.SCORE_SAME_KEY;
      }

      // Higher rarity: +10 points (we want rare!)
      if (track.rarity >= currentTrack.rarity) score += DISCOVERY.SCORE_HIGHER_RARITY;

      // Random factor for discovery: +15 points
      score += Math.random() * DISCOVERY.SCORE_RANDOM_FACTOR;

      return { track, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, DISCOVERY.MAX_RESULTS)
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
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        role="button"
        tabIndex={-1}
        aria-label="Close discovery panel"
      />

      {/* Panel */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-background border-4 border-primary z-50 p-8 shadow-[12px_12px_0px_rgba(0,85,164,0.3)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="discovery-title"
        aria-describedby="discovery-description"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary text-primary-foreground" aria-hidden="true">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 id="discovery-title" className="text-3xl font-black tracking-tighter uppercase leading-none">AI Selection</h3>
              <p id="discovery-description" className="text-xs font-bold text-primary uppercase tracking-widest mt-1">Rare records picked for you</p>
            </div>
          </div>
          <ActionIcon
            variant="subtle"
            size="xl"
            radius="xl"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground h-11 w-11"
            aria-label="Close discovery panel"
          >
            <X className="h-5 w-5" />
          </ActionIcon>
        </div>

        {discoveredTracks.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto" role="listbox" aria-label="Discovered tracks">
            {discoveredTracks.map((track, index) => (
              <div
                key={track.id}
                role="option"
                aria-selected="false"
                className="flex items-center gap-4 p-4 border-2 border-primary/5 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
                onClick={() => {
                  onPlayTrack(track);
                  onClose();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPlayTrack(track);
                    onClose();
                  }
                }}
                tabIndex={0}
              >
                <span className="text-2xl font-bold text-muted-foreground/30 w-8" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="w-12 h-12 bg-primary/10 flex-shrink-0 border border-primary/20" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{track.title}</p>
                  <p className="text-xs font-bold text-primary truncate uppercase tracking-wider">{track.artist}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-muted-foreground capitalize">{track.genre}</p>
                  <p className="text-xs font-medium text-muted-foreground">{track.year}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-primary/20" role="status">
            <Sparkles className="h-16 w-16 mx-auto mb-4 text-primary opacity-20" aria-hidden="true" />
            <p className="font-bold uppercase tracking-widest text-xs">No records found in this crate</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const shuffled = [...discoveredTracks].sort(() => Math.random() - 0.5);
              onPlayTrack(shuffled[0]);
            }}
            disabled={discoveredTracks.length === 0}
            className="border-2 border-primary text-primary font-black uppercase tracking-tighter rounded-none hover:bg-primary hover:text-primary-foreground transition-colors"
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
            className="bg-primary text-primary-foreground border-0 font-black uppercase tracking-tighter rounded-none hover:opacity-90 transition-opacity px-8"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Play All
          </Button>
        </div>
      </div>
    </>
  );
}
