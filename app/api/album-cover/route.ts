import { NextResponse } from 'next/server';
import { fetchAlbumCover } from '@/lib/music-api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get('artist');
  const album = searchParams.get('album');
  
  if (!artist || !album) {
    return NextResponse.json(
      { error: 'Artist and album parameters are required' },
      { status: 400 }
    );
  }
  
  try {
    const coverUrl = await fetchAlbumCover(artist, album);
    
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
