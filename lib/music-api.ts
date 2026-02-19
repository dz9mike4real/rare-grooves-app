import type { Track } from './types';

interface iTunesSearchResult {
  resultCount: number;
  results: Array<{
    trackId: number;
    artistName: string;
    trackName: string;
    collectionName: string;
    artworkUrl100: string;
    artworkUrl60: string;
    releaseDate: string;
    primaryGenreName: string;
    trackTimeMillis: number;
    collectionPrice?: number;
    country: string;
    artistViewUrl?: string;
    collectionViewUrl?: string;
    trackViewUrl?: string;
  }>;
}

// Fetch album artwork - prioritize MusicBrainz/Cover Art Archive
export async function fetchAlbumCover(artist: string, album: string): Promise<string | null> {
  // Step 1: Try MusicBrainz + Cover Art Archive (best for rare/classic music)
  try {
    const mbQuery = encodeURIComponent(`artist:${artist} AND release:${album}`);
    const mbResponse = await fetch(
      `https://musicbrainz.org/ws/2/release?query=${mbQuery}&fmt=json&limit=3`,
      { headers: { 'User-Agent': 'RareGrooves/1.0 (https://raregrooves.app)' } }
    );

    if (mbResponse.ok) {
      const mbData = await mbResponse.json();
      
      if (mbData.releases && mbData.releases.length > 0) {
        const releaseId = mbData.releases[0].id;
        
        // Try Cover Art Archive
        const coverResponse = await fetch(
          `https://coverartarchive.org/release/${releaseId}/front-250`,
          { redirect: 'follow' }
        );
        
        if (coverResponse.ok) {
          console.log('[v0] MusicBrainz cover found for:', artist, '-', album);
          return coverResponse.url;
        }
      }
    }
  } catch (err) {
    // Silent fail
  }

  // Step 2: Try iTunes
  try {
    const query = `${artist} ${album}`;
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=album&limit=1`;
    
    const response = await fetch(url);
    
    if (response.ok) {
      const data: iTunesSearchResult = await response.json();
      
      if (data.results && data.results.length > 0) {
        let artworkUrl = data.results[0].artworkUrl100;
        
        if (artworkUrl && typeof artworkUrl === 'string') {
          if (artworkUrl.includes('100x100bb')) {
            artworkUrl = artworkUrl.replace('100x100bb', '600x600bb');
          } else if (artworkUrl.includes('100x100')) {
            artworkUrl = artworkUrl.replace('100x100', '600x600');
          }
          
          console.log('[v0] iTunes cover found for:', artist, '-', album);
          return artworkUrl;
        }
      }
    }
  } catch (err) {
    // Silent fail
  }
  
  return null;
}

// Search for tracks and get real metadata including covers
export async function searchTrack(artist: string, track?: string): Promise<iTunesSearchResult['results'][0] | null> {
  try {
    const query = track ? `${artist} ${track}` : artist;
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=1`;
    
    const response = await fetch(url);
    const data: iTunesSearchResult = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0];
    }
    
    return null;
  } catch (error) {
    console.error('[v0] Error searching track:', error);
    return null;
  }
}

// Fetch covers for multiple tracks in batch
export async function enrichTracksWithCovers(tracks: Track[]): Promise<Track[]> {
  const enrichedTracks = await Promise.all(
    tracks.map(async (track) => {
      try {
        const coverUrl = await fetchAlbumCover(track.artist, track.album);
        return {
          ...track,
          albumArt: coverUrl || track.albumArt
        };
      } catch (error) {
        console.error(`[v0] Error enriching track ${track.id}:`, error);
        return track;
      }
    })
  );
  
  return enrichedTracks;
}

// Search iTunes by genre for discovery
export async function searchByGenre(genre: string, limit: number = 20): Promise<iTunesSearchResult['results']> {
  try {
    // Map our genres to iTunes search terms
    const genreTerms: Record<string, string> = {
      jazz: 'jazz',
      funk: 'funk soul',
      soul: 'soul music',
      rnb: 'r&b rhythm blues',
      reggae: 'reggae',
      afrobeat: 'afrobeat fela kuti'
    };
    
    const searchTerm = genreTerms[genre.toLowerCase()] || genre;
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&media=music&entity=song&limit=${limit}`;
    
    const response = await fetch(url);
    const data: iTunesSearchResult = await response.json();
    
    return data.results || [];
  } catch (error) {
    console.error('[v0] Error searching by genre:', error);
    return [];
  }
}
