import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, validateTrackParams } from '@/lib/rate-limit';
import { searchTheAudioDB } from '@/lib/audiodb-api';
import { searchDiscogs } from '@/lib/discogs-api';
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

  let albumCover: string | null = null;
  let previewUrl: string | null = null;

  // Step 1: Try Deezer first (best for music previews and covers)
  try {
    const deezerQuery = encodeURIComponent(`${sanitizedArtist} ${sanitizedTitle}`);
    const deezerResponse = await fetch(
      `https://api.deezer.com/search?q=${deezerQuery}&limit=5`
    );

    if (deezerResponse.ok) {
      const deezerData = await deezerResponse.json();
      
      if (deezerData.data && deezerData.data.length > 0) {
        // Find best match
        const bestMatch = deezerData.data.find((t: any) => {
          const searchTitle = sanitizedTitle.toLowerCase().split('(')[0].trim();
          const trackTitle = t.title_short?.toLowerCase() || t.title?.toLowerCase() || '';
          return trackTitle.includes(searchTitle) || searchTitle.includes(trackTitle);
        }) || deezerData.data[0];
        
        if (bestMatch) {
          // Get album cover (prefer xl, then big, then medium)
          albumCover = bestMatch.album?.cover_xl || bestMatch.album?.cover_big || bestMatch.album?.cover_medium || null;
          // Get audio preview
          previewUrl = bestMatch.preview || null;
          
          if (albumCover || previewUrl) {
            return NextResponse.json({
              previewUrl,
              albumCover,
              artist: bestMatch.artist?.name || sanitizedArtist,
              title: bestMatch.title || sanitizedTitle,
              album: bestMatch.album?.title || '',
              source: 'deezer'
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('[v0] Deezer API error:', error);
  }

  // Step 2: Try iTunes (good for mainstream music)
  try {
    const itunesQuery = encodeURIComponent(`${sanitizedArtist} ${sanitizedTitle}`);
    const itunesResponse = await fetch(
      `https://itunes.apple.com/search?term=${itunesQuery}&entity=song&limit=5`
    );

    if (itunesResponse.ok) {
      const itunesData = await itunesResponse.json();
      
      if (itunesData.results && itunesData.results.length > 0) {
        // Find best match
        const bestMatch = itunesData.results.find((t: any) => {
          const searchTitle = sanitizedTitle.toLowerCase().split('(')[0].trim();
          const trackTitle = t.trackName?.toLowerCase() || '';
          return trackTitle.includes(searchTitle) || searchTitle.includes(trackTitle);
        }) || itunesData.results[0];
        
        if (bestMatch) {
          // Get album cover
          if (bestMatch.artworkUrl100) {
            albumCover = bestMatch.artworkUrl100.replace('100x100', '600x600');
          }
          // Get audio preview
          previewUrl = bestMatch.previewUrl || null;
          
          if (albumCover || previewUrl) {
            return NextResponse.json({
              previewUrl,
              albumCover,
              artist: bestMatch.artistName || sanitizedArtist,
              title: bestMatch.trackName || sanitizedTitle,
              album: bestMatch.collectionName || '',
              source: 'itunes'
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('[v0] iTunes API error:', error);
  }

  // Step 3: Try Discogs (great for rare vinyls)
  try {
    const discogsData = await searchDiscogs(sanitizedArtist, sanitizedTitle);
    
    if (discogsData && discogsData.albumArt) {
      return NextResponse.json({
        previewUrl: null,
        albumCover: discogsData.albumArt,
        artist: sanitizedArtist,
        title: sanitizedTitle,
        album: '',
        year: discogsData.year || '',
        country: discogsData.country || '',
        source: 'discogs'
      });
    }
  } catch (error) {
    console.error('[v0] Discogs API error:', error);
  }

  // Step 4: Try TheAudioDB (good for classic/rare music)
  try {
    const audiodbData = await searchTheAudioDB(sanitizedArtist, sanitizedTitle);
    
    if (audiodbData && audiodbData.albumArt) {
      return NextResponse.json({
        previewUrl: null,
        albumCover: audiodbData.albumArt,
        artist: sanitizedArtist,
        title: sanitizedTitle,
        album: '',
        year: audiodbData.year || '',
        genre: audiodbData.genre || '',
        source: 'audiodb'
      });
    }
  } catch (error) {
    console.error('[v0] TheAudioDB API error:', error);
  }

  // Step 5: Try Last.fm for covers only
  try {
    const lastFmResponse = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=track.getinfo&artist=${encodeURIComponent(sanitizedArtist)}&track=${encodeURIComponent(sanitizedTitle)}&api_key=demo&format=json`
    );

    if (lastFmResponse.ok) {
      const lastFmData = await lastFmResponse.json();
      if (lastFmData.track?.album?.image) {
        const images = lastFmData.track.album.image;
        const largestImage = images[images.length - 1]?.['#text'];
        if (largestImage) {
          return NextResponse.json({
            previewUrl: null,
            albumCover: largestImage,
            artist: sanitizedArtist,
            title: sanitizedTitle,
            album: lastFmData.track.album?.title || '',
            source: 'lastfm'
          });
        }
      }
    }
  } catch (error) {
    console.error('[v0] Last.fm API error:', error);
  }

  return NextResponse.json({ 
    previewUrl: null, 
    albumCover: null,
    source: 'none'
  });
}
