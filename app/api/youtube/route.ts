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

  try {
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${title}`.trim())}`;
    
    return NextResponse.json({
      searchUrl: youtubeSearchUrl,
      message: 'Search YouTube for full version'
    });
  } catch (error) {
    console.error('[v0] YouTube search error:', error);
    return NextResponse.json({ error: 'Failed to search YouTube' }, { status: 500 });
  }
}
