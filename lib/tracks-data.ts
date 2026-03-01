import { Track } from './types';
import localDataRaw from './tracks-local.json';

interface LocalTrackData {
  localFilename: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: number | null;
  duration: number;
  albumArt: string;
}

export let rareTracks: Track[] = [];

let localTracks: Track[] | null = null;

export const getLocalTracks = (): Track[] => {
  if (localTracks) {
    return localTracks;
  }

  try {
    const localData = localDataRaw as LocalTrackData[];

    localTracks = localData.map((track, index) => ({
      id: `local-${index + 1}`,
      title: track.title,
      artist: track.artist,
      album: track.album,
      genre: track.genre as Track['genre'],
      year: track.year || 1970,
      duration: track.duration,
      rarity: Math.max(1, 10 - Math.floor(index / 3)),
      albumArt: track.albumArt,
      audioUrl: `/audio/${track.localFilename}`,
      label: 'iTunes Preview',
    }));

    return localTracks;
  } catch (error) {
    console.error('[v0] Failed to load local tracks:', error);
    return [];
  }
};
