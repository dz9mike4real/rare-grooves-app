import { describe, it, expect } from 'vitest'
import { hasRealAudioUrl } from '../lib/utils'

describe('hasRealAudioUrl', () => {
  it('returns true for http URLs', () => {
    expect(hasRealAudioUrl('http://example.com/audio.mp3')).toBe(true)
  })

  it('returns true for https URLs', () => {
    expect(hasRealAudioUrl('https://example.com/audio.mp3')).toBe(true)
  })

  it('returns false for relative URLs', () => {
    expect(hasRealAudioUrl('/audio/sample1.mp3')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(hasRealAudioUrl('')).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(hasRealAudioUrl(undefined)).toBe(false)
  })

  it('returns false for null', () => {
    expect(hasRealAudioUrl(undefined)).toBe(false)
  })
})
