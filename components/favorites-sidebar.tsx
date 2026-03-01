'use client';

import React, { useState, useEffect } from 'react';
import { Track } from '@/lib/types';
import { Favorite } from '@/lib/types';
import { getFavorites, removeFavorite } from '@/lib/storage';
import { Button, ActionIcon } from '@mantine/core';
import { X, Play, Trash2, Heart } from 'lucide-react';
import Image from 'next/image';

interface FavoritesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  currentlyPlayingId?: string;
}

export function FavoritesSidebar({ isOpen, onClose, tracks, onPlayTrack, currentlyPlayingId }: FavoritesSidebarProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
  }, [isOpen]);

  useEffect(() => {
    const handleStorageChange = () => {
      setFavorites(getFavorites());
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('favoritesUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favoritesUpdated', handleStorageChange);
    };
  }, []);

  const handleRemoveFavorite = (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFavorite(trackId);
    setFavorites(getFavorites());
    window.dispatchEvent(new Event('favoritesUpdated'));
  };

  const favoriteTracks = tracks.filter(track =>
    favorites.some(fav => fav.trackId === track.id)
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-background border-l-4 border-primary z-[80] transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary">
              <Heart className="h-4 w-4 text-primary-foreground fill-primary-foreground" />
            </div>
            <h2 className="text-lg font-black text-foreground uppercase tracking-tighter">Favorites</h2>
            <span className="text-sm font-bold text-primary">({favoriteTracks.length})</span>
          </div>
          <ActionIcon
            variant="subtle"
            size="xl"
            radius="xl"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground h-11 w-11"
          >
            <X className="h-5 w-5" />
          </ActionIcon>
        </div>

        {/* Favorites List */}
        <div className="overflow-y-auto h-[calc(100%-140px)]">
          {favoriteTracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <Heart className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">No favorites yet</p>
              <p className="text-muted-foreground text-xs mt-1">
                Tap the heart on any track to add it here
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {favoriteTracks.map((track) => (
                <div
                  key={track.id}
                  className={`group flex items-center gap-3 p-3 border-b border-primary/5 hover:bg-primary/5 cursor-pointer transition-colors ${currentlyPlayingId === track.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                    }`}
                  onClick={() => onPlayTrack(track)}
                >
                  <div className="relative w-12 h-12 overflow-hidden flex-shrink-0 border border-primary/10">
                    <Image
                      src={track.albumArt || '/placeholder.svg'}
                      alt={track.title}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                    {currentlyPlayingId === track.id && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="flex items-end gap-0.5 h-3">
                          <span className="w-0.5 bg-[#0a4d7f] rounded-full animate-pulse" style={{ animationDelay: '0ms', height: '40%' }} />
                          <span className="w-0.5 bg-[#0a4d7f] rounded-full animate-pulse" style={{ animationDelay: '150ms', height: '70%' }} />
                          <span className="w-0.5 bg-[#0a4d7f] rounded-full animate-pulse" style={{ animationDelay: '300ms', height: '50%' }} />
                          <span className="w-0.5 bg-[#0a4d7f] rounded-full animate-pulse" style={{ animationDelay: '450ms', height: '80%' }} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${currentlyPlayingId === track.id ? 'text-primary' : 'text-foreground'
                      }`}>
                      {track.title}
                    </p>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider truncate">{track.artist}</p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ActionIcon
                      variant="subtle"
                      size="xl"
                      radius="xl"
                      className="text-muted-foreground hover:text-destructive h-11 w-11"
                      onClick={(e) => handleRemoveFavorite(track.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      size="xl"
                      radius="xl"
                      className="text-muted-foreground hover:text-foreground h-11 w-11"
                    >
                      <Play className="h-4 w-4 ml-0.5" />
                    </ActionIcon>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {favoriteTracks.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2 border-primary/20 bg-background">
            <Button
              className="w-full bg-primary text-primary-foreground hover:opacity-90 border-0 font-black uppercase tracking-tighter rounded-none"
              onClick={() => {
                if (favoriteTracks.length > 0) {
                  onPlayTrack(favoriteTracks[0]);
                }
              }}
              leftSection={<Play className="h-4 w-4" />}
            >
              Play All
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
