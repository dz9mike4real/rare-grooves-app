# Rare Grooves - Music Discovery App

## Overview
A Next.js music discovery app for finding rare jazz, funk, soul, R&B, afrobeat, and reggae tracks with 30-second audio previews.

**Live URL:** https://rare-grooves-app.vercel.app

## Tech Stack
- Next.js 16 (App Router)
- React
- TypeScript
- Tailwind CSS

## Key Files
- `lib/tracks-local.json` - Track metadata (331 tracks with title, artist, album, genre, albumArt, localFilename)
- `public/audio/` - MP3 preview files
- `components/audio-player.tsx` - Audio playback component
- `app/page.tsx` - Main page with genre filtering

## Genres & Track Count
- jazz: 74
- funk: 59
- soul: 48
- r&b: 60
- afrobeat: 49
- reggae: 41

## Adding More Tracks

### Option 1: iTunes Search API (Recommended)
Uses Apple's iTunes API to fetch 30-second preview URLs. No auth required.

```bash
node scripts/add-itunes-tracks.js
```

Edit `scripts/add-itunes-tracks.js` to modify:
- Target total (currently 300)
- Artist list by genre
- Genre mapping

### Option 2: Deezer API
```bash
node scripts/redownload-tracks.js
```

## Removing Duplicates
```bash
node -e "
const fs = require('fs');
const tracks = JSON.parse(fs.readFileSync('lib/tracks-local.json', 'utf8'));
const seen = new Set();
const unique = tracks.filter(t => {
  const key = (t.artist + ' - ' + t.title).toLowerCase();
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
fs.writeFileSync('lib/tracks-local.json', JSON.stringify(unique, null, 2));
console.log('Unique:', unique.length);
"
```

## Filtering by Genre
The app filters tracks client-side in `app/page.tsx`. Genre is stored in each track's `genre` field in `tracks-local.json`.

## Audio Playback
- Tracks use local files in `/audio/` directory
- Filename format: `sample-001.mp3`, `sample-002.mp3`, etc.
- Audio player handles play/pause, progress, and track navigation

## Common Issues
1. **Track mismatch**: Re-download tracks with fresh API calls
2. **Missing audio files**: Check that localFilename in JSON matches files in public/audio/
3. **Genre filtering not working**: Clear browser cache or hard refresh

## Deployment
Deployed on Vercel - push to main branch triggers automatic deployment.

## Notes
- iTunes API provides more reliable previews than Deezer
- Audio files are large - consider Git LFS for future growth
- All tracks are for personal/non-commercial use
