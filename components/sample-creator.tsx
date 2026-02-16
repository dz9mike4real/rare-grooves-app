'use client';

import React from "react"

import { useState, useEffect, useRef } from 'react';
import { Track } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Play, Pause, Download, Check } from 'lucide-react';
import { saveSample } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface SampleCreatorProps {
  track: Track;
  currentTime: number;
  duration: number;
  onClose: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export function SampleCreator({ track, currentTime, duration, onClose, audioRef }: SampleCreatorProps) {
  const SAMPLE_DURATION = 8; // 8 seconds
  const [startTime, setStartTime] = useState(Math.max(0, currentTime - 4));
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      // Cleanup AudioContext on unmount
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const endTime = Math.min(startTime + SAMPLE_DURATION, duration);

  const handleStartTimeChange = (value: number[]) => {
    const newStart = value[0];
    // Ensure sample doesn't exceed track duration
    if (newStart + SAMPLE_DURATION <= duration) {
      setStartTime(newStart);
    } else {
      setStartTime(Math.max(0, duration - SAMPLE_DURATION));
    }
  };

  const previewSample = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPreviewPlaying) {
      audio.pause();
      setIsPreviewPlaying(false);
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      return;
    }

    audio.currentTime = startTime;
    audio.play().catch(() => {
      setIsPreviewPlaying(false);
    });
    setIsPreviewPlaying(true);

    // Auto-stop after 8 seconds
    previewTimeoutRef.current = setTimeout(() => {
      audio.pause();
      setIsPreviewPlaying(false);
    }, SAMPLE_DURATION * 1000);
  };

  const handleSaveSample = () => {
    saveSample({
      trackId: track.id,
      startTime,
      duration: SAMPLE_DURATION
    });

    setIsSaved(true);
    toast({
      title: 'Sample saved',
      description: `8-second sample from "${track.title}" has been saved.`,
    });

    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const handleExportSample = async () => {
    if (isExporting) return; // Prevent multiple simultaneous exports
    
    const audio = audioRef.current;
    if (!audio || !audio.src) {
      toast({
        title: 'Error',
        description: 'No audio source available to export.',
        variant: 'destructive'
      });
      return;
    }

    setIsExporting(true);
    
    try {
      console.log('[v0] Starting sample export...');
      console.log('[v0] Audio source:', audio.src);
      console.log('[v0] Sample range:', startTime, 'to', endTime, 'seconds');
      
      // Fetch the audio file with CORS mode
      let audioBlob: Blob;
      try {
        const response = await fetch(audio.src, { mode: 'cors' });
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.status}`);
        }
        audioBlob = await response.blob();
      } catch (fetchError) {
        console.error('[v0] CORS or fetch error:', fetchError);
        toast({
          title: 'Export unavailable',
          description: 'This track cannot be exported due to security restrictions. Try tracks with generated audio or download from external sources.',
          variant: 'destructive'
        });
        return;
      }
      
      console.log('[v0] Fetched audio blob, size:', audioBlob.size, 'bytes');
      
      // Create AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Calculate sample frames
      const sampleRate = audioBuffer.sampleRate;
      const startFrame = Math.floor(startTime * sampleRate);
      const endFrame = Math.floor(endTime * sampleRate);
      const frameCount = endFrame - startFrame;
      
      // Create new buffer for the sample
      const sampleBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        frameCount,
        sampleRate
      );
      
      // Copy the audio data
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const sampleData = sampleBuffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
          sampleData[i] = channelData[startFrame + i];
        }
      }
      
      // Convert to WAV format
      const wavBlob = bufferToWave(sampleBuffer, sampleRate);
      
      // Create download link with better browser compatibility
      const url = URL.createObjectURL(wavBlob);
      const filename = `${track.artist.replace(/[^a-z0-9]/gi, '_')} - ${track.title.replace(/[^a-z0-9]/gi, '_')}_Sample.wav`;
      
      // Try direct download first
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      console.log('[v0] Sample exported successfully, WAV blob size:', wavBlob.size, 'bytes');
      console.log('[v0] Download triggered for:', filename);
      
      // Cleanup after a delay
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);
      
      toast({
        title: 'Sample exported',
        description: `8-second WAV sample (${(wavBlob.size / 1024 / 1024).toFixed(1)}MB) downloading now. Check your Downloads folder.`,
      });
      
      handleSaveSample();
    } catch (error) {
      console.error('[v0] Export error:', error);
      toast({
        title: 'Export failed',
        description: 'Unable to export sample. This may be due to audio format issues or browser restrictions.',
        variant: 'destructive'
      });
    } finally {
      // Close AudioContext
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setIsExporting(false);
    }
  };

  // Convert AudioBuffer to WAV format
  const bufferToWave = (buffer: AudioBuffer, sampleRate: number): Blob => {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);
    
    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, buffer.numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * buffer.numberOfChannels * 2, true);
    view.setUint16(32, buffer.numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);
    
    // Write audio data
    const channels = [];
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }
    
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create 8-Second Sample</DialogTitle>
          <DialogDescription>
            Select the start point for your sample. The sample will be exactly 8 seconds long.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Track Info */}
          <div className="space-y-1">
            <p className="font-semibold text-sm text-balance">{track.title}</p>
            <p className="text-sm text-muted-foreground">{track.artist}</p>
          </div>

          {/* Sample Range */}
          <div className="space-y-2">
            <Label>Sample Start Time</Label>
            <Slider
              value={[startTime]}
              max={Math.max(0, duration - SAMPLE_DURATION)}
              step={0.1}
              onValueChange={handleStartTimeChange}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Start: {formatTime(startTime)}</span>
              <span>End: {formatTime(endTime)}</span>
            </div>
          </div>

          {/* Sample Duration Display */}
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sample Duration</span>
              <span className="text-sm font-semibold text-primary">8 seconds</span>
            </div>
          </div>

          {/* Preview & Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={previewSample}
            >
              {isPreviewPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Preview
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Preview Sample
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleSaveSample}
              disabled={isSaved}
            >
              {isSaved ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Saved
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>

          {/* Export Button */}
          <Button
            type="button"
            className="w-full"
            onClick={handleExportSample}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export Sample'}
          </Button>

          <p className="text-xs text-muted-foreground text-center text-pretty">
            Exported samples can be used in your music production. Make sure to respect copyright laws.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
