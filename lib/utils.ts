import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hasRealAudioUrl(audioUrl: string | undefined): boolean {
  return !!(audioUrl && (audioUrl.startsWith('http') || audioUrl.startsWith('https')))
}
