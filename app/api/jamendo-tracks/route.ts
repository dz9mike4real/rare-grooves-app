import { NextResponse } from 'next/server';
import { fetchRareGrooveTracks } from '@/lib/jamendo-api';

export const runtime = 'edge';

export async function GET() {
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
