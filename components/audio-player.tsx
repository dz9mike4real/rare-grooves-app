'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Track } from '@/lib/types';
import { ActionIcon, Slider } from '@mantine/core';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Scissors,
  X,
  Heart,
  Share2,
  Shuffle,
  Repeat,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Image from 'next/image';
import { isFavorite, addFavorite, removeFavorite } from '@/lib/storage';
import { SampleCreator } from './sample-creator';
import { ShareDialog } from './share-dialog';

interface AudioPlayerProps {
  track: Track;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export function AudioPlayer({ track, onClose, onNext, onPrevious, hasNext, hasPrevious }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [showSampleCreator, setShowSampleCreator] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showKeyboardHelp] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [audioReady, setAudioReady] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setIsFav(isFavorite(track.id));
  }, [track.id]);

  useEffect(() => {
    setAudioUrl(track.audioUrl);
    setIsLoadingAudio(false);
  }, [track.audioUrl]);

  // Load audio when URL changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    setAudioReady(false);
    audio.load();
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handleCanPlay = () => setAudioReady(true);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioUrl]);

  // Handle play/pause - toggle state only for now
  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case 'ArrowRight':
          if (e.shiftKey && onNext) {
            onNext();
          } else {
            // Seek forward 10 seconds
            const audio = audioRef.current;
            if (audio) audio.currentTime = Math.min(duration, audio.currentTime + 10);
          }
          break;
        case 'ArrowLeft':
          if (e.shiftKey && onPrevious) {
            onPrevious();
          } else {
            // Seek backward 10 seconds
            const audio = audioRef.current;
            if (audio) audio.currentTime = Math.max(0, audio.currentTime - 10);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.1));
          break;
        case 'KeyM':
          setIsMuted(prev => !prev);
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [duration, onNext, onPrevious, onClose]);

  // Update volume when volume state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Play/pause audio when isPlaying changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl || !audioReady) return;

    if (isPlaying) {
      audio.play().catch(err => console.error('[v0] Play error:', err));
    } else {
      audio.pause();
    }
  }, [isPlaying, audioUrl, audioReady]);

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = value;
      setCurrentTime(value);
    }
  };

  const handleVolumeChange = (value: number) => {
    const audio = audioRef.current;
    const newVolume = value;
    if (audio) {
      audio.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isMuted) {
        audio.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        audio.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const skipBackward = () => {
    if (onPrevious && hasPrevious) {
      onPrevious();
    } else {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = Math.max(0, audio.currentTime - 10);
      }
    }
  };

  const skipForward = () => {
    if (onNext && hasNext) {
      onNext();
    } else {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = Math.min(duration, audio.currentTime + 10);
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFavoriteToggle = () => {
    if (isFav) {
      removeFavorite(track.id);
      setIsFav(false);
    } else {
      addFavorite(track.id);
      setIsFav(true);
    }
  };

  return (
    <>
      <div className={`fixed bottom-[76px] md:bottom-6 left-1/2 -translate-x-1/2 z-[60] group/player transition-all duration-300 ${isCollapsed ? 'w-[calc(100%-1rem)] max-w-sm' : 'w-[calc(100%-1rem)] max-w-4xl'}`}>
        {isCollapsed ? (
          /* Collapsed Mini Bar */
          <div className="glass-card overflow-hidden transition-all duration-300 border-2 border-primary/20 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]" style={{ borderRadius: '5px' }}>
            {/* Thin progress indicator */}
            <div className="h-0.5 w-full bg-primary/10 relative">
              <div
                className="absolute left-0 top-0 h-full gradient-bg"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>
            <div className="px-3 py-2 flex items-center gap-2">
              <div className="relative h-8 w-8 flex-shrink-0 rounded-md overflow-hidden">
                <Image
                  src={track.albumArt || "/placeholder.svg"}
                  alt={track.album}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
              <div className="min-w-0 max-w-[140px]">
                <p className="font-semibold text-xs text-foreground truncate">{track.title}</p>
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider truncate">{track.artist}</p>
              </div>
              <button
                type="button"
                onClick={togglePlayPause}
                className="h-9 w-9 rounded-full gradient-bg hover:opacity-90 flex items-center justify-center flex-shrink-0"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 text-white" />
                ) : (
                  <Play className="h-4 w-4 text-white ml-0.5" />
                )}
              </button>
              <ActionIcon
                variant="subtle"
                size="xl"
                radius="xl"
                onClick={() => setIsCollapsed(false)}
                className="text-muted-foreground hover:text-foreground h-11 w-11"
                aria-label="Expand player"
              >
                <ChevronUp className="h-4 w-4" />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                size="xl"
                radius="xl"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground h-11 w-11"
                aria-label="Close player"
              >
                <X className="h-4 w-4" />
              </ActionIcon>
            </div>
          </div>
        ) : (
          /* Full Player */
          <div className="glass-card overflow-hidden transition-all duration-300 border-2 border-primary/20 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]" style={{ borderRadius: '5px' }}>

            {/* Progress Bar at Top Edge */}
            <div className="h-1 w-full bg-primary/10 cursor-pointer group/progress relative">
              <div
                className="absolute left-0 top-0 h-full gradient-bg transition-all duration-100"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>

            <div className="px-3 sm:px-6 py-2 sm:py-3">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
                {/* Track Info & Mobile Header */}
                <div className="flex items-center justify-between w-full sm:w-48 md:w-56 flex-shrink-0">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="relative h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 rounded-[10px] overflow-hidden shadow-lg">
                      <Image
                        src={track.albumArt || "/placeholder.svg"}
                        alt={track.album}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                      {isPlaying && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                          <div className="flex items-end gap-0.5 h-3 sm:h-4">
                            <span className="w-0.5 sm:w-1 bg-[#0a4d7f] rounded-full animate-pulse" style={{ animationDelay: '0ms', height: '40%' }} />
                            <span className="w-0.5 sm:w-1 bg-[#0a4d7f] rounded-full animate-pulse" style={{ animationDelay: '150ms', height: '70%' }} />
                            <span className="w-0.5 sm:w-1 bg-[#0a4d7f] rounded-full animate-pulse" style={{ animationDelay: '300ms', height: '50%' }} />
                            <span className="w-0.5 sm:w-1 bg-[#0a4d7f] rounded-full animate-pulse" style={{ animationDelay: '450ms', height: '80%' }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-xs sm:text-sm text-foreground line-clamp-1">
                        {track.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wider line-clamp-1">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  {/* Collapse & Close (Mobile Top Right) */}
                  <div className="flex sm:hidden items-center flex-shrink-0 ml-2">
                    <ActionIcon
                      variant="subtle"
                      size="lg"
                      radius="xl"
                      onClick={() => setIsCollapsed(true)}
                      className="text-muted-foreground hover:text-foreground h-11 w-11"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      size="lg"
                      radius="xl"
                      onClick={onClose}
                      className="text-muted-foreground hover:text-foreground h-11 w-11"
                    >
                      <X className="h-5 w-5" />
                    </ActionIcon>
                  </div>
                </div>

                {/* Controls */}
                {/* Controls */}
                <div className="flex-1 flex flex-col items-center gap-1.5 sm:gap-2 w-full max-w-lg mx-auto">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <ActionIcon
                      variant="subtle"
                      size="xl"
                      radius="xl"
                      className="text-muted-foreground hover:text-foreground hidden sm:flex h-11 w-11"
                    >
                      <Shuffle className="h-4 w-4" />
                    </ActionIcon>

                    <ActionIcon
                      variant="subtle"
                      size="xl"
                      radius="xl"
                      onClick={skipBackward}
                      disabled={!hasPrevious && !onPrevious}
                      className="text-foreground hover:text-primary disabled:text-muted-foreground/30"
                    >
                      <SkipBack className="h-4 w-4 sm:h-5 sm:w-5" />
                    </ActionIcon>

                    <button
                      type="button"
                      onClick={togglePlayPause}
                      disabled={isLoadingAudio}
                      className="h-11 w-11 sm:h-12 sm:w-12 rounded-full gradient-bg hover:opacity-90 flex items-center justify-center disabled:opacity-50"
                    >
                      {isLoadingAudio ? (
                        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-white animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      ) : (
                        <Play className="h-5 w-5 sm:h-6 sm:w-6 text-white ml-0.5" />
                      )}
                    </button>

                    <ActionIcon
                      variant="subtle"
                      size="xl"
                      radius="xl"
                      onClick={skipForward}
                      disabled={!hasNext && !onNext}
                      className="text-foreground hover:text-primary disabled:text-muted-foreground/30"
                    >
                      <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
                    </ActionIcon>

                    <ActionIcon
                      variant="subtle"
                      size="xl"
                      radius="xl"
                      className="text-muted-foreground hover:text-foreground hidden sm:flex h-11 w-11"
                    >
                      <Repeat className="h-4 w-4" />
                    </ActionIcon>
                  </div>

                  {/* Progress Controls (Hidden for Pill) */}
                  <div className="w-full flex sm:hidden items-center gap-2 mt-1">
                    <Slider
                      value={currentTime}
                      max={duration || 100}
                      step={0.1}
                      onChange={handleSeek}
                      className="flex-1 cursor-pointer"
                      label={null}
                      color="gray"
                      size="sm"
                    />
                  </div>
                  <div className="w-full hidden sm:flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
                    <Slider
                      value={currentTime}
                      max={duration || 100}
                      step={0.1}
                      onChange={handleSeek}
                      className="flex-1 cursor-pointer"
                      label={null}
                      color="gray"
                      size="sm"
                    />
                    <span className="text-xs text-muted-foreground w-10 tabular-nums">{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Volume & Actions */}
                <div className="flex items-center justify-center sm:justify-end gap-1 sm:gap-2 w-full sm:w-auto flex-shrink-0 mt-2 sm:mt-0">
                  <div className="hidden md:flex items-center gap-1.5 w-24">
                    <ActionIcon
                      variant="subtle"
                      size="xl"
                      radius="xl"
                      onClick={toggleMute}
                      className="text-muted-foreground hover:text-foreground h-11 w-11"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </ActionIcon>
                    <Slider
                      value={isMuted ? 0 : volume}
                      max={1}
                      step={0.01}
                      onChange={handleVolumeChange}
                      className="flex-1"
                      label={null}
                      color="gray"
                      size="sm"
                    />
                  </div>

                  <ActionIcon
                    variant="subtle"
                    size="xl"
                    radius="xl"
                    onClick={handleFavoriteToggle}
                    className={`h-11 w-11 ${isFav ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Heart className={`h-4 w-4 ${isFav ? 'fill-primary' : ''}`} />
                  </ActionIcon>

                  <ActionIcon
                    variant="subtle"
                    size="xl"
                    radius="xl"
                    onClick={() => setShowSampleCreator(true)}
                    className="text-muted-foreground hover:text-green-500 h-11 w-11"
                  >
                    <Scissors className="h-4 w-4" />
                  </ActionIcon>

                  <ActionIcon
                    variant="subtle"
                    size="xl"
                    radius="xl"
                    onClick={() => setShowShareDialog(true)}
                    className="text-muted-foreground hover:text-foreground hidden sm:flex h-11 w-11"
                  >
                    <Share2 className="h-4 w-4" />
                  </ActionIcon>

                  {/* Collapse & Close (Desktop Bottom Right) */}
                  <div className="hidden sm:flex items-center">
                    <ActionIcon
                      variant="subtle"
                      size="xl"
                      radius="xl"
                      onClick={() => setIsCollapsed(true)}
                      className="text-muted-foreground hover:text-foreground h-11 w-11"
                      aria-label="Collapse player"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </ActionIcon>

                    <ActionIcon
                      variant="subtle"
                      size="xl"
                      radius="xl"
                      onClick={onClose}
                      className="text-muted-foreground hover:text-foreground h-11 w-11"
                      aria-label="Close player"
                    >
                      <X className="h-4 w-4" />
                    </ActionIcon>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        {showKeyboardHelp && (
          <div className="absolute bottom-full right-0 mb-2 p-4 glass rounded-lg shadow-xl w-64">
            <h4 className="text-sm font-semibold text-foreground mb-2">Keyboard Shortcuts</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li><kbd className="bg-muted px-1.5 py-0.5 rounded">Space</kbd> Play/Pause</li>
              <li><kbd className="bg-muted px-1.5 py-0.5 rounded">←</kbd> / <kbd className="bg-muted px-1.5 py-0.5 rounded">→</kbd> Seek ±10s</li>
              <li><kbd className="bg-muted px-1.5 py-0.5 rounded">Shift</kbd>+<kbd className="bg-muted px-1.5 py-0.5 rounded">→</kbd> Next track</li>
              <li><kbd className="bg-muted px-1.5 py-0.5 rounded">Shift</kbd>+<kbd className="bg-muted px-1.5 py-0.5 rounded">←</kbd> Previous</li>
              <li><kbd className="bg-muted px-1.5 py-0.5 rounded">↑</kbd> / <kbd className="bg-muted px-1.5 py-0.5 rounded">↓</kbd> Volume</li>
              <li><kbd className="bg-muted px-1.5 py-0.5 rounded">M</kbd> Mute</li>
              <li><kbd className="bg-muted px-1.5 py-0.5 rounded">Esc</kbd> Close player</li>
            </ul>
          </div>
        )}

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={audioUrl || undefined}
          preload="auto"
          onCanPlay={() => console.log('[v0] Audio can play')}
          onError={(e) => console.log('[v0] Audio error:', e)}
        />
      </div>

      {/* Sample Creator Dialog */}
      {showSampleCreator && (
        <SampleCreator
          track={track}
          currentTime={currentTime}
          duration={duration}
          onClose={() => setShowSampleCreator(false)}
          audioRef={audioRef}
        />
      )}

      {/* Share Dialog */}
      {showShareDialog && (
        <ShareDialog
          track={track}
          onClose={() => setShowShareDialog(false)}
        />
      )}
    </>
  );
}
