import { NextRequest, NextResponse } from 'next/server';
import { RATE_LIMIT, INPUT } from './constants';

// Simple in-memory rate limiter with cleanup
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = RATE_LIMIT.WINDOW_MS;
const CLEANUP_INTERVAL = 60 * 60 * 1000; // Clean up every hour

// Periodic cleanup of expired rate limit entries
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(ip);
      }
    }
  }, CLEANUP_INTERVAL);
}

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT.MAX_REQUESTS) {
    return false;
  }
  
  record.count++;
  return true;
}

export function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>\"\'%;()&+]/g, '') // Remove dangerous chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .slice(0, INPUT.MAX_LENGTH); // Limit length
}

export function validateTrackParams(artist: string | null, title: string | null): { valid: boolean; error?: string } {
  if (!artist || !title) {
    return { valid: false, error: 'Artist and title are required' };
  }
  
  const sanitizedArtist = sanitizeInput(artist);
  const sanitizedTitle = sanitizeInput(title);
  
  if (sanitizedArtist.length < 1 || sanitizedTitle.length < 1) {
    return { valid: false, error: 'Invalid artist or title' };
  }
  
  return { valid: true };
}

export function validateAlbumParams(artist: string | null, album: string | null): { valid: boolean; error?: string } {
  if (!artist || !album) {
    return { valid: false, error: 'Artist and album are required' };
  }
  
  const sanitizedArtist = sanitizeInput(artist);
  const sanitizedAlbum = sanitizeInput(album);
  
  if (sanitizedArtist.length < 1 || sanitizedAlbum.length < 1) {
    return { valid: false, error: 'Invalid artist or album' };
  }
  
  return { valid: true };
}
