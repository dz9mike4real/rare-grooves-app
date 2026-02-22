// Jamendo API integration for real, legal music tracks
// Jamendo provides Creative Commons licensed music with full-length streaming

import { Genre } from './types';

const JAMENDO_CLIENT_ID = '4c8bc5e9'; // Public demo client ID for v0 testing

export interface JamendoTrack {
  id: string;
  name: string;
  artist_name: string;
  album_name: string;
  duration: number;
  audio: string;
  audiodownload: string;
  image: string;
  album_image: string;
  releasedate: string;
}

export interface JamendoSearchResponse {
  headers: {
    status: string;
    code: number;
    results_count: number;
  };
  results: JamendoTrack[];
}

/**
 * Search Jamendo for tracks by genre
 * @param genres - Array of genres: 'jazz', 'funk', 'soul', etc.
 * @param limit - Number of results (default 50)
 */
export async function searchJamendoByGenre(
  genres: string[],
  limit = 50
): Promise<JamendoTrack[]> {
  try {
    const genreQuery = genres.join('+');
    const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=${limit}&tags=${genreQuery}&audioformat=mp32&include=musicinfo`;
    
    console.log('[v0] Fetching real tracks from Jamendo API:', genreQuery);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Jamendo API error: ${response.status}`);
    }
    
    const data: JamendoSearchResponse = await response.json();
    console.log('[v0] Jamendo returned', data.results.length, 'real tracks');
    
    return data.results;
  } catch (error) {
    console.error('[v0] Jamendo API error:', error);
    return [];
  }
}

/**
 * Fetch curated tracks for rare groove genres
 */
export async function fetchRareGrooveTracks(): Promise<JamendoTrack[]> {
  const tracks: JamendoTrack[] = [];
  
  // Fetch tracks for each genre
  const genres = [
    ['jazz', 'jazzfunk'],
    ['funk', 'soul'],
    ['soul', 'rnb'],
    ['reggae', 'dub'],
    ['afrobeat', 'worldmusic']
  ];
  
  for (const genreGroup of genres) {
    const genreTracks = await searchJamendoByGenre(genreGroup, 10);
    tracks.push(...genreTracks);
  }
  
  return tracks;
}

/**
 * Get streaming audio URL for a Jamendo track
 */
export function getJamendoAudioUrl(trackId: string): string {
  return `https://mp3d.jamendo.com/?trackid=${trackId}&format=mp32&from=app-${JAMENDO_CLIENT_ID}`;
}

/**
 * Convert Jamendo track to our Track format
 */
export function convertJamendoTrack(jamendoTrack: JamendoTrack, genre: string, rarity: number) {
  return {
    id: jamendoTrack.id,
    title: jamendoTrack.name,
    artist: jamendoTrack.artist_name,
    album: jamendoTrack.album_name,
    genre: genre as Genre,
    year: new Date(jamendoTrack.releasedate).getFullYear(),
    duration: jamendoTrack.duration,
    rarity: rarity,
    albumArt: jamendoTrack.album_image || jamendoTrack.image,
    audioUrl: jamendoTrack.audio || getJamendoAudioUrl(jamendoTrack.id),
    label: 'Jamendo',
    bpm: 120,
    key: 'C Major'
  };
}
