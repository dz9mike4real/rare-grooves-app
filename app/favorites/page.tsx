'use client';

import { useState, useEffect } from 'react';
import { Track } from '@/lib/types';
import { Favorite } from '@/lib/types';
import { getFavorites } from '@/lib/storage';
import { loadRealAudioFromDeezer, rareTracks } from '@/lib/tracks-data';
import { TrackCard } from '@/components/track-card';
import { AudioPlayer } from '@/components/audio-player';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function FavoritesPage() {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [favoriteTracks, setFavoriteTracks] = useState<Track[]>([]);
  const [tracksWithCovers, setTracksWithCovers] = useState<Track[]>(rareTracks);
  const [isLoadingCovers, setIsLoadingCovers] = useState(true);

  useEffect(() => {
    const loadTracks = async () => {
      const tracksToUse = rareTracks;
      
      const tracksWithRealAudio = await loadRealAudioFromDeezer(tracksToUse);
      setTracksWithCovers(tracksWithRealAudio);
      setIsLoadingCovers(false);
    };
    loadTracks();
  }, []);

  useEffect(() => {
    if (!isLoadingCovers) {
      loadFavorites();
    }
  }, [isLoadingCovers]);

  const loadFavorites = () => {
    const favorites: Favorite[] = getFavorites();
    const tracks = favorites
      .map(fav => {
        const track = tracksWithCovers.find(t => t.id === fav.trackId);
        return track;
      })
      .filter((track): track is Track => track !== undefined)
      .sort((a, b) => {
        const favA = favorites.find(f => f.trackId === a.id);
        const favB = favorites.find(f => f.trackId === b.id);
        return (favB?.addedAt.getTime() || 0) - (favA?.addedAt.getTime() || 0);
      });
    
    setFavoriteTracks(tracks);
  };

  const handleTrackSelect = (track: Track) => {
    setSelectedTrack(track);
  };

  useEffect(() => {
    const handleStorageChange = () => {
      loadFavorites();
    };

    window.addEventListener('storage', handleStorageChange);
    
    const handleFavoritesUpdate = () => {
      loadFavorites();
    };
    
    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
    };
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      loadFavorites();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ff47e6]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-[#0a4d7f]/5 rounded-full blur-3xl" />
      </div>

      {/* Glass Header */}
      <header className="sticky top-0 z-50 glass">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button 
                variant="ghost" 
                size="icon"
                className="hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#ff47e6] to-[#0a4d7f]">
                <Heart className="h-5 w-5 text-white fill-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">My Favorites</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-40">
        {isLoadingCovers ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#ff47e6] to-[#0a4d7f] opacity-30 blur-2xl rounded-full" />
                <Heart className="h-16 w-16 text-[#ff47e6] mx-auto animate-pulse" />
              </div>
              <p className="text-white/60">Loading your favorites...</p>
            </div>
          </div>
        ) : favoriteTracks.length > 0 ? (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-5 w-5 text-[#ffcc00]" />
                <p className="text-white/60">
                  {favoriteTracks.length} {favoriteTracks.length === 1 ? 'track' : 'tracks'} saved
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {favoriteTracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  onPlay={handleTrackSelect}
                  isPlaying={selectedTrack?.id === track.id}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="glass-card p-12 rounded-full mb-6">
              <Heart className="h-20 w-20 text-white/20" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">No favorites yet</h2>
            <p className="text-white/50 max-w-md mb-8">
              Start discovering rare grooves and save your favorite tracks here by clicking the heart icon.
            </p>
            <Link href="/">
              <Button className="gradient-bg hover:opacity-90 px-8">
                Discover Tracks
              </Button>
            </Link>
          </div>
        )}
      </main>

      {/* Audio Player */}
      {selectedTrack && (
        <AudioPlayer
          track={selectedTrack}
          onClose={() => setSelectedTrack(null)}
        />
      )}
    </div>
  );
}
