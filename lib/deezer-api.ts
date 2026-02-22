// Deezer API integration for fetching real music previews
// Deezer provides 30-second preview URLs without authentication

/**
 * Search for a track on Deezer and get both audio and album cover
 * Uses server-side API route to avoid CORS issues
 */
export async function searchDeezerTrack(
  artist: string,
  title: string
): Promise<{ previewUrl: string | null; albumCover: string | null }> {
  try {
    const params = new URLSearchParams({ artist, title });
    const response = await fetch(`/api/deezer-preview?${params}`);

    if (!response.ok) {
      return { previewUrl: null, albumCover: null };
    }

    const data = await response.json();

    if (data.previewUrl) {
      console.log('[v0] Found Deezer data for:', artist, '-', title);
      return {
        previewUrl: data.previewUrl,
        albumCover: data.albumCover
      };
    }

    return { previewUrl: null, albumCover: null };
  } catch (error) {
    console.error('[v0] Error fetching from Deezer:', error);
    return { previewUrl: null, albumCover: null };
  }
}

/**
 * Get album cover from Deezer
 * Uses server-side API route to avoid CORS issues
 */
export async function getDeezerAlbumCover(
  artist: string,
  album: string
): Promise<string | null> {
  try {
    const params = new URLSearchParams({ artist, title: album });
    const response = await fetch(`/api/deezer-preview?${params}`);

    if (!response.ok) return null;

    const data = await response.json();

    if (data.albumCover) {
      return data.albumCover;
    }

    return null;
  } catch (error) {
    console.error('[v0] Error fetching album cover from Deezer:', error);
    return null;
  }
}
