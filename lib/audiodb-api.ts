// TheAudioDB API - Free music metadata and album art
// Free API key: 123

interface AudioDBAlbum {
  idAlbum: string;
  strAlbum: string;
  strArtist: string;
  strArtistStripped: string;
  strAlbumThumb: string;
  strAlbumThumbHQ: string;
  strAlbumCDart: string;
  strAlbumSpine: string;
  strAlbumRelease: string;
  intYearReleased: string;
  strGenre: string;
  strLabel: string;
  strMood: string;
  strStyle: string;
  strReview: string;
}

interface AudioDBSearchResponse {
  albums?: AudioDBAlbum[];
}

const BASE_URL = 'https://www.theaudiodb.com/api/v1/json/123';

export async function searchTheAudioDB(artist: string, album?: string): Promise<{
  albumArt: string | null;
  year: string | null;
  genre: string | null;
  label: string | null;
} | null> {
  try {
    let url: string;
    
    if (album) {
      // Search by artist + album
      url = `${BASE_URL}/search.php?s=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}`;
    } else {
      // Search by artist only
      url = `${BASE_URL}/search.php?s=${encodeURIComponent(artist)}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data: AudioDBSearchResponse = await response.json();
    
    if (!data.albums || data.albums.length === 0) {
      return null;
    }
    
    // Find best matching album if album name provided
    let bestMatch = data.albums[0];
    
    if (album && data.albums.length > 1) {
      const albumLower = album.toLowerCase();
      const found = data.albums.find(a => 
        a.strAlbum?.toLowerCase().includes(albumLower) ||
        albumLower.includes(a.strAlbum?.toLowerCase() || '')
      );
      if (found) {
        bestMatch = found;
      }
    }
    
    // Get highest quality image available
    const albumArt = bestMatch.strAlbumThumbHQ || bestMatch.strAlbumThumb || null;
    
    if (!albumArt) {
      return null;
    }
    
    return {
      albumArt,
      year: bestMatch.intYearReleased || null,
      genre: bestMatch.strGenre || null,
      label: bestMatch.strLabel || null
    };
  } catch (error) {
    console.error('[v0] TheAudioDB error:', error);
    return null;
  }
}

// Get top albums for an artist
export async function getTopAlbums(artist: string): Promise<Array<{
  id: string;
  name: string;
  year: string;
  thumb: string;
}>> {
  try {
    const url = `${BASE_URL}/search.php?s=${encodeURIComponent(artist)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return [];
    }
    
    const data: AudioDBSearchResponse = await response.json();
    
    if (!data.albums) {
      return [];
    }
    
    return data.albums
      .filter(a => a.strAlbumThumb || a.strAlbumThumbHQ)
      .slice(0, 10)
      .map(a => ({
        id: a.idAlbum,
        name: a.strAlbum || '',
        year: a.intYearReleased || '',
        thumb: a.strAlbumThumbHQ || a.strAlbumThumb || ''
      }));
  } catch (error) {
    console.error('[v0] TheAudioDB getTopAlbums error:', error);
    return [];
  }
}
