// Discogs API - Best for rare vinyl releases
// Requires API key (free from discogs.com/settings/developers)

interface DiscogsRelease {
  id: number;
  title: string;
  year: string;
  country: string;
  cover_image: string;
  thumb: string;
  resource_url: string;
  type: string;
  format: string[];
  label: string[];
  genre: string[];
  style: string[];
}

interface DiscogsSearchResponse {
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    items: number;
  };
  results: DiscogsRelease[];
}

const BASE_URL = 'https://api.discogs.com';

export async function searchDiscogs(
  artist: string,
  album?: string
): Promise<{
  albumArt: string | null;
  year: string | null;
  country: string | null;
  label: string | null;
} | null> {
  try {
    const apiKey = process.env.DISCOGS_API_KEY;
    const apiSecret = process.env.DISCOGS_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      console.log('[v0] Discogs API key not configured');
      return null;
    }

    // Build search query
    let query = artist;
    if (album) {
      query = `${artist} ${album}`;
    }
    
    const url = `${BASE_URL}/database/search?q=${encodeURIComponent(query)}&type=release&per_page=5`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Discogs key=${apiKey},secret=${apiSecret}`,
        'User-Agent': 'RareGrooves/1.0 (https://raregrooves.app)'
      }
    });

    if (!response.ok) {
      console.log('[v0] Discogs API error:', response.status);
      return null;
    }

    const data: DiscogsSearchResponse = await response.json();

    if (!data.results || data.results.length === 0) {
      return null;
    }

    // Find best match
    let bestMatch = data.results[0];
    
    if (album && data.results.length > 1) {
      const albumLower = album.toLowerCase();
      const found = data.results.find(r => 
        r.title.toLowerCase().includes(albumLower)
      );
      if (found) {
        bestMatch = found;
      }
    }

    // Get cover image
    const albumArt = bestMatch.cover_image || bestMatch.thumb || null;
    
    if (!albumArt) {
      return null;
    }

    return {
      albumArt,
      year: bestMatch.year || null,
      country: bestMatch.country || null,
      label: bestMatch.label?.[0] || null
    };
  } catch (error) {
    console.error('[v0] Discogs error:', error);
    return null;
  }
}

// Get release details by ID
export async function getDiscogsRelease(releaseId: number): Promise<{
  albumArt: string | null;
  year: string | null;
  country: string | null;
  label: string | null;
  tracklist: Array<{ position: string; title: string; duration: string }>;
} | null> {
  try {
    const apiKey = process.env.DISCOGS_API_KEY;
    const apiSecret = process.env.DISCOGS_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      return null;
    }

    const url = `${BASE_URL}/releases/${releaseId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Discogs key=${apiKey},secret=${apiSecret}`,
        'User-Agent': 'RareGrooves/1.0 (https://raregrooves.app)'
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return {
      albumArt: data.images?.[0]?.uri || data.images?.[0]?.resource_url || null,
      year: data.year || null,
      country: data.country || null,
      label: data.labels?.[0]?.name || null,
      tracklist: data.tracklist?.map((t: any) => ({
        position: t.position || '',
        title: t.title || '',
        duration: t.duration || ''
      })) || []
    };
  } catch (error) {
    console.error('[v0] Discogs getRelease error:', error);
    return null;
  }
}
