'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Track } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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
  Youtube,
  Loader2,
  Keyboard
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
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [audioReady, setAudioReady] = useState(false);

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

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    const newVolume = value[0];
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
      <div className="fixed bottom-0 left-0 right-0 z-[60]">
        {/* Progress Bar at Top */}
        <div className="h-1 bg-white/10 cursor-pointer group">
          <div 
            className="h-full gradient-bg transition-all duration-100"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
        </div>
        
        {/* Main Player */}
        <div className="glass border-t border-border/50 bg-background/95 dark:bg-[#181818]/95 backdrop-blur-xl">
          <div className="container mx-auto px-3 sm:px-4 py-2">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Track Info */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 w-32 sm:w-48 md:w-56">
                <div className="relative h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src={track.albumArt || "/placeholder.svg"}
                    alt={track.album}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="flex items-end gap-0.5 h-3 sm:h-4">
                        <span className="w-0.5 sm:w-1 bg-[#0a4d7f] rounded-full animate-pulse" style={{ animationDelay: '0ms', height: '40%' }} />
                        <span className="w-0.5 sm:w-1 bg-[#0a4d7f] rounded-full animate-pulse" style={{ animationDelay: '150ms', height: '70%' }} />
                        <span className="w-0.5 sm:w-1 bg-[#0a4d7f] rounded-full animate-pulse" style={{ animationDelay: '300ms', height: '50%' }} />
                        <span className="w-0.5 sm:w-1 bg-[#0a4d7f] rounded-full animate-pulse" style={{ animationDelay: '450ms', height: '80%' }} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 hidden sm:block">
                  <h3 className="font-semibold text-xs sm:text-sm text-foreground line-clamp-1">
                    {track.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                    {track.artist}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex-1 flex flex-col items-center gap-1.5 sm:gap-2 max-w-lg mx-auto">
                <div className="flex items-center gap-3 sm:gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hidden sm:flex"
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipBackward}
                    disabled={!hasPrevious && !onPrevious}
                    className="h-9 w-9 sm:h-10 sm:w-10 text-foreground hover:text-primary disabled:text-muted-foreground/30"
                  >
                    <SkipBack className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>

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

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipForward}
                    disabled={!hasNext && !onNext}
                    className="h-9 w-9 sm:h-10 sm:w-10 text-foreground hover:text-primary disabled:text-muted-foreground/30"
                  >
                    <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hidden sm:flex"
                  >
                    <Repeat className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Progress Slider */}
                <div className="w-full flex items-center gap-2">
                  <span className="text-xs text-muted-foreground/70 w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="flex-1 cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground/70 w-10 tabular-nums">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Volume & Actions */}
              <div className="flex items-center gap-1 sm:gap-2 w-20 sm:w-28 md:w-36 flex-shrink-0">
                <div className="hidden md:flex items-center gap-1.5 w-24">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="flex-1"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFavoriteToggle}
                  className={`h-9 w-9 ${isFav ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Heart className={`h-4 w-4 ${isFav ? 'fill-primary' : ''}`} />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSampleCreator(true)}
                  className="h-9 w-9 text-muted-foreground hover:text-green-500"
                >
                  <Scissors className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowShareDialog(true)}
                  className="h-9 w-9 text-muted-foreground hover:text-foreground hidden sm:flex"
                >
                  <Share2 className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

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
