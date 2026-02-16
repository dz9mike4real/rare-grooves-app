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
  // Check if we're in the browser
  if (typeof window === 'undefined') return '';

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const numberOfChannels = 2;
    const length = Math.min(duration, 30) * sampleRate; // Cap at 30 seconds for demo
    
    const audioBuffer = audioContext.createBuffer(
      numberOfChannels,
      length,
      sampleRate
    );

    // Generate unique patterns based on track properties
    const seed = trackId.charCodeAt(0) + trackId.charCodeAt(trackId.length - 1);
    const baseFreq = 200 + (seed % 400); // Base frequency varies by track
    const beatsPerSecond = bpm / 60;

    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      
      for (let i = 0; i < length; i++) {
        const time = i / sampleRate;
        
        // Create genre-specific patterns
        let sample = 0;
        
        if (genre === 'jazz') {
          // Jazz: Complex harmonics with swing rhythm
          const swing = Math.sin(time * beatsPerSecond * Math.PI * 2) * 0.3;
          sample += Math.sin(time * baseFreq * Math.PI * 2) * 0.3;
          sample += Math.sin(time * baseFreq * 1.5 * Math.PI * 2) * 0.2;
          sample += Math.sin(time * baseFreq * 2.5 * Math.PI * 2) * 0.1 * swing;
        } else if (genre === 'funk') {
          // Funk: Rhythmic bass with syncopation
          const beat = Math.floor(time * beatsPerSecond * 4) % 4;
          const bassline = Math.sin(time * baseFreq * 0.5 * Math.PI * 2);
          const accent = beat === 0 || beat === 2 ? 1.2 : 0.8;
          sample = bassline * 0.4 * accent;
          sample += Math.sin(time * baseFreq * 2 * Math.PI * 2) * 0.1;
        } else if (genre === 'soul' || genre === 'r&b') {
          // Soul/R&B: Smooth melodic lines with warmth
          sample += Math.sin(time * baseFreq * Math.PI * 2) * 0.35;
          sample += Math.sin(time * baseFreq * 0.5 * Math.PI * 2) * 0.25;
          sample += Math.sin(time * baseFreq * 3 * Math.PI * 2) * 0.05;
          // Add subtle vibrato
          const vibrato = Math.sin(time * 5 * Math.PI * 2) * 0.05;
          sample *= 1 + vibrato;
        } else if (genre === 'reggae') {
          // Reggae: Off-beat emphasis (skank)
          const beat = (time * beatsPerSecond * 4) % 1;
          const offbeat = beat > 0.5 ? 1 : 0.3;
          sample += Math.sin(time * baseFreq * 0.5 * Math.PI * 2) * 0.3 * offbeat;
          sample += Math.sin(time * baseFreq * 2 * Math.PI * 2) * 0.2;
        } else if (genre === 'afrobeat') {
          // Afrobeat: Polyrhythmic percussion-like patterns
          const rhythm1 = Math.sin(time * beatsPerSecond * 4 * Math.PI * 2);
          const rhythm2 = Math.sin(time * beatsPerSecond * 3 * Math.PI * 2);
          sample += Math.sin(time * baseFreq * Math.PI * 2) * 0.3;
          sample += (rhythm1 + rhythm2) * 0.15;
        }
        
        // Add some subtle noise for texture
        const noise = (Math.random() - 0.5) * 0.02;
        sample += noise;
        
        // Apply envelope (fade in/out)
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

    // Convert to WAV blob
    const wavBlob = audioBufferToWav(audioBuffer);
    const url = URL.createObjectURL(wavBlob);
    
    audioContext.close();
    return url;
  } catch (error) {
    console.error('[v0] Error generating demo audio:', error);
    return '';
  }
};

// Convert AudioBuffer to WAV format
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const length = buffer.length * buffer.numberOfChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);
  const channels: Float32Array[] = [];
  let offset = 0;
  let pos = 0;

  // Write WAV header
  setUint32(0x46464952); // "RIFF"
  setUint32(36 + length); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(buffer.numberOfChannels);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels); // avg. bytes/sec
  setUint16(buffer.numberOfChannels * 2); // block-align
  setUint16(16); // 16-bit
  setUint32(0x61746164); // "data" - chunk
  setUint32(length); // chunk length

  // Write interleaved data
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < buffer.length) {
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      const sample = Math.max(-1, Math.min(1, channels[i][pos]));
      view.setInt16(
        44 + offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      );
      offset += 2;
    }
    pos++;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

// Cache for generated audio URLs
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

// Clean up cached URLs when needed
export const clearAudioCache = () => {
  for (const url of audioCache.values()) {
    URL.revokeObjectURL(url);
  }
  audioCache.clear();
};
