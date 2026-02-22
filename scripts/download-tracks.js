#!/usr/bin/env node

/**
 * Script to fetch real audio tracks from Jamendo and download them locally
 * Run with: node scripts/download-tracks.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const JAMENDO_CLIENT_ID = '4c8bc5e9';
const AUDIO_DIR = path.join(__dirname, '../public/audio');

// Genre mappings for Jamendo
const GENRE_MAPPING = [
  { genres: ['jazz', 'jazzfunk'], genre: 'jazz', limit: 10 },
  { genres: ['funk', 'soul'], genre: 'funk', limit: 10 },
  { genres: ['soul', 'rnb'], genre: 'soul', limit: 8 },
  { genres: ['reggae', 'dub'], genre: 'reggae', limit: 8 },
  { genres: ['afrobeat', 'worldmusic', 'african'], genre: 'afrobeat', limit: 8 },
];

// Ensure audio directory exists
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  console.log('Created audio directory:', AUDIO_DIR);
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadFile(response.headers.location, dest)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const file = fs.createWriteStream(dest);
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(dest);
      });
    });
    
    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

async function fetchJamendoTracks(genreQuery, limit) {
  const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=${limit}&tags=${genreQuery}&audioformat=mp32&include=musicinfo`;
  
  console.log(`Fetching Jamendo tracks for: ${genreQuery}...`);
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.results || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function downloadTrack(track, genre, index) {
  if (!track.audio || !track.audio.startsWith('http')) {
    console.log(`  Skipping ${track.name} - no audio available`);
    return null;
  }
  
  const filename = `sample-${genre}-${index + 1}.mp3`;
  const filepath = path.join(AUDIO_DIR, filename);
  
  // Check if already downloaded
  if (fs.existsSync(filepath)) {
    console.log(`  Already exists: ${filename}`);
    return { filename, track };
  }
  
  console.log(`  Downloading: ${track.name} by ${track.artist_name}`);
  
  try {
    await downloadFile(track.audio, filepath);
    console.log(`  Saved: ${filename}`);
    return { filename, track };
  } catch (error) {
    console.error(`  Failed to download ${track.name}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('Starting track download from Jamendo...\n');
  
  const allTracks = [];
  let trackIndex = 1;
  
  for (const { genres, genre, limit } of GENRE_MAPPING) {
    const genreQuery = genres.join(',');
    console.log(`\n=== Processing ${genre} (${genreQuery}) ===`);
    
    try {
      const tracks = await fetchJamendoTracks(genreQuery, limit);
      console.log(`Found ${tracks.length} tracks`);
      
      for (let i = 0; i < tracks.length; i++) {
        const result = await downloadTrack(tracks[i], genre, i);
        
        if (result) {
          allTracks.push({
            localFilename: result.filename,
            title: result.track.name,
            artist: result.track.artist_name,
            album: result.track.album_name,
            duration: result.track.duration,
            genre: genre,
            year: new Date(result.track.releasedate).getFullYear(),
            albumArt: result.track.album_image || result.track.image,
          });
        }
        
        // Rate limiting - be nice to Jamendo
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (error) {
      console.error(`Error fetching ${genre}:`, error.message);
    }
  }
  
  // Save track metadata
  const metadataPath = path.join(__dirname, '../lib/tracks-local.json');
  fs.writeFileSync(metadataPath, JSON.stringify(allTracks, null, 2));
  console.log(`\nSaved metadata for ${allTracks.length} tracks to ${metadataPath}`);
  console.log(`Audio files saved to: ${AUDIO_DIR}`);
}

main().catch(console.error);
