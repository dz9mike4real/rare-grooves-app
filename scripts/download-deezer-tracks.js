#!/usr/bin/env node

/**
 * Script to fetch real audio tracks from Deezer and download them locally
 * Run with: node scripts/download-deezer-tracks.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const AUDIO_DIR = path.join(__dirname, '../public/audio');

// Ensure audio directory exists
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  console.log('Created audio directory:', AUDIO_DIR);
}

// Sample tracks to search for (representative tracks from each genre)
const TRACKS_TO_FETCH = [
  // Jazz
  { artist: 'Miles Davis', title: 'So What', genre: 'jazz' },
  { artist: 'John Coltrane', title: 'A Love Supreme', genre: 'jazz' },
  { artist: 'Herbie Hancock', title: 'Cantaloupe Island', genre: 'jazz' },
  { artist: 'Thelonious Monk', title: 'Round Midnight', genre: 'jazz' },
  { artist: 'Dave Brubeck', title: 'Take Five', genre: 'jazz' },
  // Funk
  { artist: 'James Brown', title: 'Sex Machine', genre: 'funk' },
  { artist: 'Parliament', title: 'Flash Light', genre: 'funk' },
  { artist: 'Bootsy Collins', title: 'Bootzilla', genre: 'funk' },
  { artist: 'Maceo Parker', title: 'Soul Power', genre: 'funk' },
  { artist: 'The Meters', title: 'Cissy Strut', genre: 'funk' },
  // Soul
  { artist: 'Marvin Gaye', title: 'What\'s Going On', genre: 'soul' },
  { artist: 'Curtis Mayfield', title: 'Move On Up', genre: 'soul' },
  { artist: 'Aretha Franklin', title: 'Respect', genre: 'soul' },
  { artist: 'Otis Redding', title: 'Sittin\' On The Dock Of The Bay', genre: 'soul' },
  { artist: 'Sam Cooke', title: 'A Change Is Gonna Come', genre: 'soul' },
  // R&B
  { artist: 'Donny Hathaway', title: 'A Song For You', genre: 'r&b' },
  { artist: 'Al Green', title: 'Let\'s Stay Together', genre: 'r&b' },
  { artist: 'Stevie Wonder', title: 'Superstition', genre: 'r&b' },
  { artist: 'Roberta Flack', title: 'Killing Me Softly', genre: 'r&b' },
  { artist: 'Sade', title: 'Smooth Operator', genre: 'r&b' },
  // Reggae
  { artist: 'Bob Marley', title: 'No Woman No Cry', genre: 'reggae' },
  { artist: 'Peter Tosh', title: 'Legalize It', genre: 'reggae' },
  { artist: 'Jimmy Cliff', title: 'The Harder They Come', genre: 'reggae' },
  { artist: 'Toots Maytals', title: 'Pressure Drop', genre: 'reggae' },
  { artist: 'Burning Spear', title: 'Slavery Days', genre: 'reggae' },
  // Afrobeat
  { artist: 'Fela Kuti', title: 'Zombie', genre: 'afrobeat' },
  { artist: 'Fela Kuti', title: 'Water No Get Enemy', genre: 'afrobeat' },
  { artist: 'Tony Allen', title: 'Go Slow', genre: 'afrobeat' },
  { artist: 'William Onyeabor', title: 'Fantastic Man', genre: 'afrobeat' },
  { artist: 'Manu Dibango', title: 'Soul Makossa', genre: 'afrobeat' },
];

async function searchDeezer(artist, title) {
  const query = encodeURIComponent(`${artist} ${title}`);
  const url = `https://api.deezer.com/search?q=${query}&limit=1`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data && json.data.length > 0) {
            resolve(json.data[0]);
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (!url || !url.startsWith('http')) {
      reject(new Error('Invalid URL'));
      return;
    }
    
    const protocol = url.startsWith('https') ? https : require('http');
    
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

async function main() {
  console.log('Starting track download from Deezer...\n');
  
  const downloadedTracks = [];
  let trackIndex = 1;
  
  for (const { artist, title, genre } of TRACKS_TO_FETCH) {
    console.log(`\n[${trackIndex}/${TRACKS_TO_FETCH.length}] Searching: ${artist} - ${title} (${genre})`);
    
    try {
      const track = await searchDeezer(artist, title);
      
      if (!track) {
        console.log(`  Not found on Deezer`);
        continue;
      }
      
      if (!track.preview) {
        console.log(`  No preview available`);
        continue;
      }
      
      const filename = `sample-${trackIndex.toString().padStart(3, '0')}.mp3`;
      const filepath = path.join(AUDIO_DIR, filename);
      
      console.log(`  Downloading preview from Deezer...`);
      await downloadFile(track.preview, filepath);
      
      const stats = fs.statSync(filepath);
      console.log(`  Saved: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      
      downloadedTracks.push({
        localFilename: filename,
        title: track.title || title,
        artist: track.artist?.name || artist,
        album: track.album?.title || '',
        genre: genre,
        year: track.release_date ? new Date(track.release_date).getFullYear() : null,
        duration: track.duration || 0,
        albumArt: track.album?.cover_big || track.album?.cover_medium || track.album?.cover || '',
      });
      
      trackIndex++;
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (error) {
      console.error(`  Error:`, error.message);
    }
  }
  
  // Save track metadata
  const metadataPath = path.join(__dirname, '../lib/tracks-local.json');
  fs.writeFileSync(metadataPath, JSON.stringify(downloadedTracks, null, 2));
  console.log(`\n========================================`);
  console.log(`Saved ${downloadedTracks.length} tracks to ${metadataPath}`);
  console.log(`Audio files saved to: ${AUDIO_DIR}`);
  console.log(`Total size: ${(fs.readdirSync(AUDIO_DIR).reduce((acc, f) => acc + fs.statSync(path.join(AUDIO_DIR, f)).size, 0) / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(console.error);
