import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const artist = searchParams.get('artist');
  const title = searchParams.get('title');

  if (!artist || !title) {
    return NextResponse.json(
      { error: 'Artist and title are required' },
      { status: 400 }
    );
  }

  // Try iTunes Search API first (best for older music)
  try {
    const itunesQuery = encodeURIComponent(`${artist} ${title}`);
    const itunesResponse = await fetch(
      `https://itunes.apple.com/search?term=${itunesQuery}&entity=song&limit=5`
    );

    if (itunesResponse.ok) {
      const itunesData = await itunesResponse.json();
      
      if (itunesData.results && itunesData.results.length > 0) {
        // Find best match
        const bestMatch = itunesData.results.find((t: any) => 
          t.trackName?.toLowerCase().includes(title.toLowerCase().split('(')[0].trim()) ||
          title.toLowerCase().includes(t.trackName?.toLowerCase().split('(')[0].trim())
        ) || itunesData.results[0];
        
        if (bestMatch.artworkUrl100) {
          // Get higher resolution artwork
          const albumArt = bestMatch.artworkUrl100.replace('100x100', '600x600');
          return NextResponse.json({
            previewUrl: bestMatch.previewUrl || null,
            albumCover: albumArt,
            artist: bestMatch.artistName || artist,
            title: bestMatch.trackName || title,
            source: 'itunes'
          });
        }
      }
    }
  } catch (error) {
    console.error('[v0] iTunes API error:', error);
  }

  // Try Deezer second
  try {
    const query = encodeURIComponent(`${artist} ${title}`);
    const response = await fetch(
      `https://api.deezer.com/search?q=${query}&limit=3`
    );

    if (response.ok) {
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const bestMatch = data.data.find((t: any) => 
          t.title.toLowerCase().includes(title.toLowerCase().split('(')[0].trim()) ||
          title.toLowerCase().includes(t.title_short.toLowerCase())
        ) || data.data[0];
        
        if (bestMatch.album?.cover_xl || bestMatch.album?.cover_big) {
          return NextResponse.json({
            previewUrl: bestMatch.preview || null,
            albumCover: bestMatch.album?.cover_xl || bestMatch.album?.cover_big || null,
            artist: bestMatch.artist?.name || artist,
            title: bestMatch.title || title,
            source: 'deezer'
          });
        }
      }
    }
  } catch (error) {
    console.error('[v0] Deezer API error:', error);
  }

  // Try Last.fm
  try {
    const lastFmResponse = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=track.getinfo&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(title)}&api_key=demo&format=json`
    );

    if (lastFmResponse.ok) {
      const lastFmData = await lastFmResponse.json();
      if (lastFmData.track?.album?.image) {
        const images = lastFmData.track.album.image;
        // Get largest image (usually index 3)
        const largestImage = images[images.length - 1]?.['#text'];
        if (largestImage) {
          return NextResponse.json({
            previewUrl: null,
            albumCover: largestImage,
            artist: artist,
            title: title,
            source: 'lastfm'
          });
        }
      }
    }
  } catch (error) {
    console.error('[v0] Last.fm API error:', error);
  }

  // Try MusicBrainz + Cover Art Archive (slowest)
  try {
    const mbResponse = await fetch(
      `https://musicbrainz.org/ws/2/recording?query=artist:${encodeURIComponent(artist)} AND recording:${encodeURIComponent(title)}&fmt=json&limit=1`,
      { headers: { 'User-Agent': 'RareGrooves/1.0 (contact@example.com)' } }
    );

    if (mbResponse.ok) {
      const mbData = await mbResponse.json();
      if (mbData.recordings?.length > 0) {
        const recording = mbData.recordings[0];
        const releaseId = recording.releases?.[0]?.id;
        
        if (releaseId) {
          const coverResponse = await fetch(
            `https://coverartarchive.org/release/${releaseId}/front`,
            { redirect: 'follow' }
          );
          
          if (coverResponse.ok) {
            return NextResponse.json({
              previewUrl: null,
              albumCover: coverResponse.url,
              artist: artist,
              title: title,
              source: 'coverartarchive'
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('[v0] MusicBrainz API error:', error);
  }

  return NextResponse.json({ previewUrl: null, albumCover: null });
}
