# Rare Grooves - Features & API Integration Guide

## Current Features

### Music Discovery
- **Genre Filtering**: Browse tracks by jazz, funk, soul, R&B, reggae, and afrobeat
- **Rarity System**: Tracks are rated on a 1-10 rarity scale
- **Search**: Find tracks by title, artist, or album
- **Track Metadata**: View album art, BPM, key, year, label, and duration

### Audio Playback
- **Full-featured Player**: Play/pause, skip forward/backward, volume control
- **Seek Controls**: Navigate through tracks with precision
- **Persistent Player**: Bottom-mounted player remains accessible while browsing

### Sample Creation
- **8-Second Samples**: Create exactly 8-second samples from any point in a track
- **Preview Samples**: Listen to your sample before saving/exporting
- **Sample Management**: Save samples with metadata (start time, duration, track info)
- **Export Functionality**: Framework ready for Web Audio API integration

### Favorites System
- **Save Tracks**: Add tracks to your favorites collection
- **Favorites Page**: Dedicated page to view all saved tracks
- **Local Storage**: Favorites persist across sessions
- **Real-time Updates**: Favorites update instantly across the app

### Social Sharing
- **Multiple Share Options**: Email, WhatsApp, Twitter/X
- **Copy Link**: Quick copy-to-clipboard functionality
- **Native Share API**: Uses device's native sharing when available
- **Rich Share Content**: Includes track title, artist, album, and genre info

## API Integration Opportunities

The app is designed to work with music APIs. Here are recommended services:

### Music Data APIs

#### 1. Last.fm API
- **Best for**: Track metadata, album art, similar tracks
- **Free tier**: Available
- **Integration points**:
  - Track search and discovery
  - Album artwork
  - Artist information
  - Genre tagging

#### 2. Spotify Web API
- **Best for**: Audio playback, track previews, recommendations
- **Free tier**: Available (30-second previews)
- **Integration points**:
  - Track playback (30s previews)
  - Advanced recommendation engine
  - Rich metadata
  - Official album art

#### 3. Discogs API
- **Best for**: Rare vinyl records, release information
- **Free tier**: Available
- **Integration points**:
  - Vinyl pressing details
  - Rarity ratings
  - Label information
  - Release year accuracy

#### 4. MusicBrainz API
- **Best for**: Open-source music metadata
- **Free tier**: Completely free
- **Integration points**:
  - Comprehensive metadata
  - Recording relationships
  - Genre classifications

### Audio Processing

#### Web Audio API (Built-in)
- **Use for**: Sample extraction, audio manipulation
- **Implementation**:
  - Extract exact 8-second segments
  - Apply effects/filters
  - Generate waveforms
  - Export to WAV/MP3

### Recommended Implementation Flow

1. **Search**: Use Last.fm or Spotify for track discovery
2. **Metadata**: Pull from Discogs for rarity/vinyl info
3. **Playback**: Use Spotify preview URLs (30s) or link to external services
4. **Samples**: Process with Web Audio API
5. **Export**: Convert to downloadable audio files

## Data Structure

Current mock data includes:
- 12 rare tracks across all genres
- High-quality album art (Unsplash)
- Realistic metadata (BPM, key, year, label)
- Rarity ratings (7-10 range)

## Future Enhancement Ideas

### Database Integration
- User accounts (Supabase Auth)
- Cloud-saved favorites and samples
- User-generated playlists
- Community features (ratings, comments)

### Advanced Features
- Waveform visualization
- AI-powered recommendations
- Collaborative playlists
- Sample sharing marketplace
- DJ mixing tools
- Vinyl pressing finder

### Audio Enhancements
- Equalizer controls
- Pitch/tempo adjustment
- Loop creation
- Multi-track sampling
- Audio effects (reverb, delay, etc.)

## Technical Notes

### Current Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui components
- Local storage for persistence

### Performance Optimizations
- Image optimization with Next.js Image
- Component-level code splitting
- Lazy loading for dialogs
- Efficient re-renders with proper state management

### Browser Compatibility
- Modern browsers with Web Audio API support
- Progressive enhancement for native share
- Fallback UI for unsupported features
