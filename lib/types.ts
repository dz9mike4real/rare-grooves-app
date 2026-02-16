export type Genre = 'jazz' | 'funk' | 'soul' | 'r&b' | 'reggae' | 'afrobeat';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: Genre;
  year: number;
  duration: number;
  rarity: number;
  albumArt: string;
  audioUrl: string;
  youtubeUrl?: string;
  label?: string;
  bpm?: number;
  key?: string;
}

export interface Sample {
  id: string;
  trackId: string;
  startTime: number;
  duration: number;
  createdAt: Date;
}

export interface Favorite {
  trackId: string;
  addedAt: Date;
}
