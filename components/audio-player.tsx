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
import { getCachedOrGenerateAudio } from '@/lib/audio-generator';
import { hasRealAudioUrl } from '@/lib/utils';

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

  useEffect(() => {
    setIsFav(isFavorite(track.id));
  }, [track.id]);

  useEffect(() => {
    const loadAudio = async () => {
      if (hasRealAudioUrl(track.audioUrl)) {
        console.log('[v0] Using real audio URL:', track.audioUrl);
        setAudioUrl(track.audioUrl);
        setIsLoadingAudio(false);
      } else {
        console.log('[v0] Generating demo audio for:', track.title, 'genre:', track.genre);
        setIsLoadingAudio(true);
        const url = await getCachedOrGenerateAudio(
          track.id,
          track.genre,
          track.bpm || 120,
          track.duration
        );
        console.log('[v0] Generated audio URL:', url);
        setAudioUrl(url);
        setIsLoadingAudio(false);
      }
    };
    
    loadAudio();
  }, [track.id, track.genre, track.bpm, track.duration, track.title, track.audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl || isLoadingAudio) {
      console.log('[v0] Play blocked:', { hasAudio: !!audio, audioUrl: !!audioUrl, isLoadingAudio });
      return;
    }

    console.log('[v0] Attempting to play, isPlaying:', isPlaying);
    if (isPlaying) {
      audio.play().then(() => {
        console.log('[v0] Audio playing successfully');
      }).catch((error) => {
        console.log('[v0] Audio play error:', error);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, audioUrl, isLoadingAudio]);

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

  const togglePlayPause = useCallback(() => {
    console.log('[v0] togglePlayPause clicked, current isPlaying:', isPlaying);
    setIsPlaying(prev => !prev);
  }, []);

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
          <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Track Info */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 w-auto sm:w-48 md:w-64">
                <div className="relative h-10 w-10 sm:h-14 sm:w-14 flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
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
              <div className="flex-1 flex flex-col items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-2 sm:gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground hidden sm:flex"
                  >
                    <Shuffle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipBackward}
                    disabled={!hasPrevious && !onPrevious}
                    className="h-8 w-8 sm:h-10 sm:w-10 text-foreground hover:text-primary disabled:text-muted-foreground/30 disabled:hover:text-muted-foreground/30"
                  >
                    <SkipBack className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Play button clicked!');
                      togglePlayPause();
                    }}
                    disabled={isLoadingAudio}
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-full gradient-bg hover:opacity-90 flex items-center justify-center disabled:opacity-50 z-50 relative"
                  >
                    {isLoadingAudio ? (
                      <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-white animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    ) : (
                      <Play className="h-5 w-5 sm:h-6 sm:w-6 text-white ml-0.5 sm:ml-1" />
                    )}
                  </button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipForward}
                    disabled={!hasNext && !onNext}
                    className="h-8 w-8 sm:h-10 sm:w-10 text-foreground hover:text-primary disabled:text-muted-foreground/30 disabled:hover:text-muted-foreground/30"
                  >
                    <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground hidden sm:flex"
                  >
                    <Repeat className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                
                {/* Progress Slider */}
                <div className="w-full max-w-[200px] sm:max-w-md flex items-center gap-1 sm:gap-2">
                  <span className="text-[10px] sm:text-xs text-muted-foreground/60 w-8 sm:w-10 text-right">{formatTime(currentTime)}</span>
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="flex-1 cursor-pointer [&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_[role=slider]]:w-2 sm:[&_[role=slider]]:w-3 [&_[role=slider]]:h-2 sm:[&_[role=slider]]:h-3"
                  />
                  <span className="text-[10px] sm:text-xs text-muted-foreground/60 w-8 sm:w-10">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Volume & Actions */}
              <div className="flex items-center gap-1 sm:gap-2 w-auto sm:w-48 md:w-64 justify-end">
                <div className="hidden md:flex items-center gap-2 w-32">
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
                    className="flex-1 [&_[role=slider]]:bg-muted-foreground/30 [&_[role=slider]]:border-muted-foreground/30 [&_[role=slider]]:w-3 [&_[role=slider]]:h-3"
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
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                >
                  <Share2 className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="h-9 w-9 text-muted-foreground hover:text-red-500"
                >
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${track.artist} ${track.title}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Youtube className="h-4 w-4" />
                  </a>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                  className="h-9 w-9 text-muted-foreground/60 hover:text-foreground"
                  aria-label="Keyboard shortcuts"
                >
                  <Keyboard className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-9 w-9 text-muted-foreground/60 hover:text-foreground"
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
        <audio ref={audioRef} src={audioUrl || undefined} preload="auto" />
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
