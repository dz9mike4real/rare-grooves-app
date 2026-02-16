'use client';

import { useState, useEffect, useRef } from 'react';
import { Track } from '@/lib/types';
import { Card } from '@/components/ui/card';
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
  Youtube
} from 'lucide-react';
import Image from 'next/image';
import { isFavorite, addFavorite, removeFavorite } from '@/lib/storage';
import { SampleCreator } from './sample-creator';
import { ShareDialog } from './share-dialog';
import { getCachedOrGenerateAudio } from '@/lib/audio-generator';

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
  const [isLoadingAudio, setIsLoadingAudio] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string>('');

  useEffect(() => {
    setIsFav(isFavorite(track.id));
  }, [track.id]);

  useEffect(() => {
    const loadAudio = async () => {
      if (track.audioUrl && track.audioUrl.startsWith('http')) {
        console.log('[v0] Using real audio preview from Deezer for:', track.title);
        setAudioUrl(track.audioUrl);
        setIsLoadingAudio(false);
      } else {
        console.log('[v0] Generating fallback demo audio for:', track.title);
        setIsLoadingAudio(true);
        const url = await getCachedOrGenerateAudio(
          track.id,
          track.genre,
          track.bpm || 120,
          track.duration
        );
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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl || isLoadingAudio) return;

    if (isPlaying) {
      audio.play().catch((error) => {
        console.log('[v0] Audio play error:', error);
        setIsPlaying(false);
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

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

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
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Progress Bar at Top */}
        <div className="h-1 bg-white/10 cursor-pointer group">
          <div 
            className="h-full gradient-bg transition-all duration-100"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
        </div>
        
        {/* Main Player */}
        <div className="glass border-t border-white/10 bg-[#181818]/95 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Track Info */}
              <div className="flex items-center gap-3 flex-shrink-0 w-64">
                <div className="relative h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src={track.albumArt || "/placeholder.svg"}
                    alt={track.album}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="flex items-end gap-0.5 h-4">
                        <span className="w-1 bg-[#0a4d7f] rounded-full animate-pulse" style={{ animationDelay: '0ms', height: '40%' }} />
                        <span className="w-1 bg-[#0a4d7f] rounded-full animate-pulse" style={{ animationDelay: '150ms', height: '70%' }} />
                        <span className="w-1 bg-[#0a4d7f] rounded-full animate-pulse" style={{ animationDelay: '300ms', height: '50%' }} />
                        <span className="w-1 bg-[#0a4d7f] rounded-full animate-pulse" style={{ animationDelay: '450ms', height: '80%' }} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-white line-clamp-1">
                    {track.title}
                  </h3>
                  <p className="text-sm text-white/60 line-clamp-1">
                    {track.artist}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/60 hover:text-white"
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipBackward}
                    disabled={!hasPrevious && !onPrevious}
                    className="h-10 w-10 text-white hover:text-[#0a4d7f] disabled:text-white/20 disabled:hover:text-white/20"
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>

                  <Button
                    size="icon"
                    onClick={togglePlayPause}
                    className="h-12 w-12 rounded-full gradient-bg hover:opacity-90 transition-opacity"
                    disabled={isLoadingAudio}
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6 text-white" />
                    ) : (
                      <Play className="h-6 w-6 text-white ml-1" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipForward}
                    disabled={!hasNext && !onNext}
                    className="h-10 w-10 text-white hover:text-[#0a4d7f] disabled:text-white/20 disabled:hover:text-white/20"
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/60 hover:text-white"
                  >
                    <Repeat className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Progress Slider */}
                <div className="w-full max-w-md flex items-center gap-2">
                  <span className="text-xs text-white/50 w-10 text-right">{formatTime(currentTime)}</span>
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="flex-1 cursor-pointer [&_[role=slider]]:bg-[#0a4d7f] [&_[role=slider]]:border-[#0a4d7f]"
                  />
                  <span className="text-xs text-white/50 w-10">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Volume & Actions */}
              <div className="flex items-center gap-2 w-64 justify-end">
                <div className="hidden md:flex items-center gap-2 w-32">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="h-8 w-8 text-white/60 hover:text-white"
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
                    className="flex-1 [&_[role=slider]]:bg-white/30 [&_[role=slider]]:border-white/30 [&_[role=slider]]:w-3 [&_[role=slider]]:h-3"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFavoriteToggle}
                  className={`h-9 w-9 ${isFav ? 'text-[#0d6efd]' : 'text-white/60 hover:text-white'}`}
                >
                  <Heart className={`h-4 w-4 ${isFav ? 'fill-[#0d6efd]' : ''}`} />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSampleCreator(true)}
                  className="h-9 w-9 text-white/60 hover:text-[#1db954]"
                >
                  <Scissors className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowShareDialog(true)}
                  className="h-9 w-9 text-white/60 hover:text-white"
                >
                  <Share2 className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="h-9 w-9 text-white/60 hover:text-[#FF0000]"
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
                  onClick={onClose}
                  className="h-9 w-9 text-white/40 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio ref={audioRef} src={audioUrl || undefined} preload="metadata" />
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
