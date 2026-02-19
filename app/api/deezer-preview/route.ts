import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, validateTrackParams } from '@/lib/rate-limit';
import { INPUT } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);
  
  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }
  
  const searchParams = request.nextUrl.searchParams;
  const artist = searchParams.get('artist');
  const title = searchParams.get('title');
  
  const validation = validateTrackParams(artist, title);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }
  
  const sanitizedArtist = artist?.slice(0, INPUT.MAX_LENGTH) || '';
  const sanitizedTitle = title?.slice(0, INPUT.MAX_LENGTH) || '';

  // Step 1: Get release info from MusicBrainz
  let releaseId: string | null = null;
  let albumName = '';
  
  try {
    const mbQuery = encodeURIComponent(`artist:${sanitizedArtist} AND recording:${sanitizedTitle}`);
    const mbResponse = await fetch(
      `https://musicbrainz.org/ws/2/recording?query=${mbQuery}&fmt=json&limit=3`,
      { headers: { 'User-Agent': 'RareGrooves/1.0 (https://raregrooves.app)' } }
    );

    if (mbResponse.ok) {
      const mbData = await mbResponse.json();
      
      if (mbData.recordings && mbData.recordings.length > 0) {
        // Find best match
        const match = mbData.recordings.find((r: any) => 
          r.releases && r.releases.length > 0
        ) || mbData.recordings[0];
        
        if (match.releases && match.releases.length > 0) {
          releaseId = match.releases[0].id;
          albumName = match.releases[0].title;
        }
      }
    }
  } catch (error) {
    console.error('[v0] MusicBrainz error:', error);
  }

  // Step 2: Get cover art from Cover Art Archive
  let albumCover: string | null = null;
  
  if (releaseId) {
    try {
      const coverResponse = await fetch(
        `https://coverartarchive.org/release/${releaseId}/front-250`,
        { redirect: 'follow' }
      );
      
      if (coverResponse.ok) {
        albumCover = coverResponse.url;
      }
    } catch (error) {
      console.error('[v0] Cover Art Archive error:', error);
    }
  }

  // Step 3: Try to get audio preview from Deezer (fallback if no cover)
  let previewUrl: string | null = null;
  
  if (!albumCover) {
    try {
      const deezerQuery = encodeURIComponent(`${sanitizedArtist} ${sanitizedTitle}`);
      const deezerResponse = await fetch(
        `https://api.deezer.com/search?q=${deezerQuery}&limit=3`
      );

      if (deezerResponse.ok) {
        const deezerData = await deezerResponse.json();
        
        if (deezerData.data && deezerData.data.length > 0) {
          const bestMatch = deezerData.data.find((t: any) => 
            t.title.toLowerCase().includes(sanitizedTitle.toLowerCase().split('(')[0].trim())
          ) || deezerData.data[0];
          
          if (bestMatch.preview) {
            previewUrl = bestMatch.preview;
          }
          if (bestMatch.album?.cover_xl || bestMatch.album?.cover_big) {
            albumCover = bestMatch.album.cover_xl || bestMatch.album.cover_big;
          }
        }
      }
    } catch (error) {
      console.error('[v0] Deezer fallback error:', error);
    }
  }

  // If still no cover, try iTunes
  if (!albumCover) {
    try {
      const itunesQuery = encodeURIComponent(`${sanitizedArtist} ${sanitizedTitle}`);
      const itunesResponse = await fetch(
        `https://itunes.apple.com/search?term=${itunesQuery}&entity=song&limit=1`
      );

      if (itunesResponse.ok) {
        const itunesData = await itunesResponse.json();
        
        if (itunesData.results && itunesData.results.length > 0) {
          const result = itunesData.results[0];
          if (result.artworkUrl100) {
            albumCover = result.artworkUrl100.replace('100x100', '600x600');
          }
          if (result.previewUrl) {
            previewUrl = result.previewUrl;
          }
        }
      }
    } catch (error) {
      console.error('[v0] iTunes fallback error:', error);
    }
  }

  return NextResponse.json({
    previewUrl,
    albumCover,
    artist: sanitizedArtist,
    title: sanitizedTitle,
    album: albumName,
    source: albumCover ? 'musicbrainz' : 'fallback'
  });
}
