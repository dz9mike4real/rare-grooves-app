import { NextResponse } from 'next/server';
import { fetchAlbumCover } from '@/lib/music-api';
import { checkRateLimit, getClientIp, validateAlbumParams } from '@/lib/rate-limit';
import { INPUT } from '@/lib/constants';

export async function GET(request: Request) {
  const clientIp = getClientIp(request);
  
  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }
  
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get('artist');
  const album = searchParams.get('album');
  
  const validation = validateAlbumParams(artist, album);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }
  
  const sanitizedArtist = artist?.slice(0, INPUT.MAX_LENGTH) || '';
  const sanitizedAlbum = album?.slice(0, INPUT.MAX_LENGTH) || '';
  
  try {
    const coverUrl = await fetchAlbumCover(sanitizedArtist, sanitizedAlbum);
    
    if (!coverUrl) {
      return NextResponse.json(
        { error: 'Album cover not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ coverUrl });
  } catch (error) {
    console.error('[v0] API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch album cover' },
      { status: 500 }
    );
  }
}
