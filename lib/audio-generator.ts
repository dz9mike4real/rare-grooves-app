/**
 * Generate procedural audio for demo tracks
 * Uses Web Audio API to create audio patterns
 */

export const generateDemoAudio = async (
  trackId: string,
  genre: string,
  bpm: number,
  duration: number
): Promise<string> => {
  if (typeof window === 'undefined') return '';

  try {
    const getAudioContext = () => {
      if (typeof window === 'undefined') return null;
      return (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    };
    const AudioContextClass = getAudioContext();
    if (!AudioContextClass) {
      throw new Error('Web Audio API not supported');
    }
    const audioContext = new AudioContextClass();
    const sampleRate = audioContext.sampleRate;
    const numChannels = 2;
    const length = Math.min(duration || 30, 30) * sampleRate;
    
    const buffer = audioContext.createBuffer(numChannels, length, sampleRate);

    const seed = trackId.charCodeAt(0) + trackId.charCodeAt(trackId.length - 1);
    const baseFreq = 220 + (seed % 220);
    const beatsPerSec = (bpm || 120) / 60;

    for (let ch = 0; ch < numChannels; ch++) {
      const data = buffer.getChannelData(ch);
      
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        let sample = 0;
        
        // Different patterns based on genre
        switch (genre) {
          case 'jazz':
            sample = Math.sin(t * baseFreq * Math.PI * 2) * 0.3;
            sample += Math.sin(t * baseFreq * 1.5 * Math.PI * 2) * 0.2;
            sample += Math.sin(t * baseFreq * 2 * Math.PI * 2) * 0.1;
            break;
          case 'funk':
            const beat = Math.floor(t * beatsPerSec * 4) % 4;
            const accent = (beat === 0 || beat === 2) ? 1.5 : 0.7;
            sample = Math.sin(t * baseFreq * 0.5 * Math.PI * 2) * accent * 0.3;
            break;
          case 'soul':
          case 'r&b':
            sample = Math.sin(t * baseFreq * Math.PI * 2) * 0.35;
            sample += Math.sin(t * baseFreq * 0.5 * Math.PI * 2) * 0.2;
            break;
          case 'reggae':
            const offbeat = ((t * beatsPerSec * 4) % 1) > 0.5 ? 1 : 0.4;
            sample = Math.sin(t * baseFreq * 0.5 * Math.PI * 2) * offbeat * 0.3;
            break;
          case 'afrobeat':
            sample = Math.sin(t * baseFreq * Math.PI * 2) * 0.25;
            sample += Math.sin(t * beatsPerSec * 8 * Math.PI * 2) * 0.15;
            break;
          default:
            sample = Math.sin(t * baseFreq * Math.PI * 2) * 0.3;
        }
        
        // Add envelope
        const fadeIn = Math.min(1, t / 0.1);
        const fadeOut = Math.min(1, (length / sampleRate - t) / 0.5);
        sample *= fadeIn * fadeOut;
        
        data[i] = Math.max(-0.8, Math.min(0.8, sample));
      }
    }

    // Convert to WAV
    const wavBlob = bufferToWav(buffer);
    const url = URL.createObjectURL(wavBlob);
    
    setTimeout(() => audioContext.close(), 1000);
    return url;
  } catch (e) {
    console.error('[v0] Audio gen error:', e);
    return '';
  }
};

function bufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  const dataLength = buffer.length * blockAlign;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;
  
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);
  
  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, 'WAVE');
  
  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  
  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);
  
  // Interleave channels and write
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// Cache
const audioCache = new Map<string, string>();

export const getCachedOrGenerateAudio = async (
  trackId: string,
  genre: string,
  bpm: number,
  duration: number
): Promise<string> => {
  if (audioCache.has(trackId)) {
    return audioCache.get(trackId)!;
  }
  const url = await generateDemoAudio(trackId, genre, bpm, duration);
  if (url) audioCache.set(trackId, url);
  return url;
};

export const clearAudioCache = () => {
  audioCache.forEach(url => URL.revokeObjectURL(url));
  audioCache.clear();
};
