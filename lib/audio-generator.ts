/**
 * Generate procedural audio for demo tracks
 * Creates unique audio patterns based on track metadata
 */

export const generateDemoAudio = async (
  trackId: string,
  genre: string,
  bpm: number,
  duration: number
): Promise<string> => {
  if (typeof window === 'undefined') return '';

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const numberOfChannels = 2;
    const length = Math.min(duration || 30, 30) * sampleRate;
    
    const audioBuffer = audioContext.createBuffer(
      numberOfChannels,
      length,
      sampleRate
    );

    const seed = trackId.charCodeAt(0) + trackId.charCodeAt(trackId.length - 1);
    const baseFreq = 220 + (seed % 220);
    const beatsPerSecond = bpm / 60;

    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      
      for (let i = 0; i < length; i++) {
        const time = i / sampleRate;
        let sample = 0;
        
        if (genre === 'jazz') {
          const swing = Math.sin(time * beatsPerSecond * Math.PI * 2) * 0.3;
          sample += Math.sin(time * baseFreq * Math.PI * 2) * 0.3;
          sample += Math.sin(time * baseFreq * 1.5 * Math.PI * 2) * 0.2;
        } else if (genre === 'funk') {
          const beat = Math.floor(time * beatsPerSecond * 4) % 4;
          const bassline = Math.sin(time * baseFreq * 0.5 * Math.PI * 2);
          const accent = beat === 0 || beat === 2 ? 1.2 : 0.8;
          sample = bassline * 0.4 * accent;
          sample += Math.sin(time * baseFreq * 2 * Math.PI * 2) * 0.1;
        } else if (genre === 'soul' || genre === 'r&b') {
          sample += Math.sin(time * baseFreq * Math.PI * 2) * 0.35;
          sample += Math.sin(time * baseFreq * 0.5 * Math.PI * 2) * 0.25;
        } else if (genre === 'reggae') {
          const beat = (time * beatsPerSecond * 4) % 1;
          const offbeat = beat > 0.5 ? 1 : 0.3;
          sample += Math.sin(time * baseFreq * 0.5 * Math.PI * 2) * 0.3 * offbeat;
          sample += Math.sin(time * baseFreq * 2 * Math.PI * 2) * 0.2;
        } else if (genre === 'afrobeat') {
          const rhythm1 = Math.sin(time * beatsPerSecond * 4 * Math.PI * 2);
          const rhythm2 = Math.sin(time * beatsPerSecond * 3 * Math.PI * 2);
          sample += Math.sin(time * baseFreq * Math.PI * 2) * 0.3;
          sample += (rhythm1 + rhythm2) * 0.15;
        } else {
          sample = Math.sin(time * baseFreq * Math.PI * 2) * 0.3;
        }
        
        const noise = (Math.random() - 0.5) * 0.02;
        sample += noise;
        
        const fadeInTime = 0.1;
        const fadeOutTime = 0.5;
        const trackDuration = length / sampleRate;
        
        if (time < fadeInTime) {
          sample *= time / fadeInTime;
        } else if (time > trackDuration - fadeOutTime) {
          sample *= (trackDuration - time) / fadeOutTime;
        }
        
        channelData[i] = Math.max(-1, Math.min(1, sample));
      }
    }

    const wavBlob = encodeWAV(audioBuffer);
    const url = URL.createObjectURL(wavBlob);
    
    await audioContext.close();
    return url;
  } catch (error) {
    console.error('[v0] Error generating demo audio:', error);
    return '';
  }
};

function encodeWAV(buffer: AudioBuffer): Blob {
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataLength = buffer.length * blockAlign;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;
  
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);
  
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);
  
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
  if (url) {
    audioCache.set(trackId, url);
  }
  return url;
};

export const clearAudioCache = () => {
  for (const url of audioCache.values()) {
    URL.revokeObjectURL(url);
  }
  audioCache.clear();
};
