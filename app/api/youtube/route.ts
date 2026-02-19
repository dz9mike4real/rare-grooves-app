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

  try {
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${sanitizedArtist} ${sanitizedTitle}`.trim())}`;
    
    return NextResponse.json({
      searchUrl: youtubeSearchUrl,
      message: 'Search YouTube for full version'
    });
  } catch (error) {
    console.error('[v0] YouTube search error:', error);
    return NextResponse.json({ error: 'Failed to search YouTube' }, { status: 500 });
  }
}
