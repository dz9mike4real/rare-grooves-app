import { NextRequest, NextResponse } from 'next/server';
import { fetchRareGrooveTracks } from '@/lib/jamendo-api';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);
  
  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }
  
  try {
    const tracks = await fetchRareGrooveTracks();
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('[v0] Jamendo API route error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks' },
      { status: 500 }
    );
  }
}
