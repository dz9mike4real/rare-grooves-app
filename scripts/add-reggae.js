#!/usr/bin/env node

/**
 * Add reggae tracks using iTunes Search API
 * Run with: node scripts/add-reggae.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const AUDIO_DIR = path.join(__dirname, '../public/audio');
const METADATA_FILE = path.join(__dirname, '../lib/tracks-local.json');

const existingTracks = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
const startIndex = existingTracks.length;

console.log(`Current tracks: ${startIndex}`);

const reggaeArtists = [
  'Bob Marley', 'Peter Tosh', 'Jimmy Cliff', 'Toots & The Maytals', 'Burning Spear',
  'Gregory Isaacs', 'Dennis Brown', 'Lee "Scratch" Perry', 'Bunny Wailer', 'Toots Hibbert',
  'Max Romeo', 'John Holt', 'The Heptones', 'Black Uhuru', 'Inner Circle',
  'Shabba Ranks', 'Freddie McGregor', 'Barrington Levy', 'Sister Nancy', 'Desmond Dekker',
  'Sean Paul', 'Shaggy', 'Damian Marley', 'Stephen Marley', 'Ziggy Marley',
  'Koffee', 'Protoje', 'Chronixx', 'Jah苗', 'Busy Signal', 'Mavado',
  'Bounty Killer', 'Vybz Kartel', 'Bob Andy', 'Pat Kelly', 'John Holt',
  'Ken Boothe', 'The Abyssinians', 'Sandy Denny', 'Delroy Wilson', 'U-Roy'
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (!url || !url.startsWith('http')) {
      reject(new Error('Invalid URL'));
      return;
    }
    
    const protocol = url.startsWith('https') ? https : require('http');
    
    const request = protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadFile(response.headers.location, dest)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed: ${response.statusCode}`));
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

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const shuffledArtists = shuffle(reggaeArtists);

const seen = new Set();
existingTracks.forEach(t => {
  seen.add((t.artist + ' - ' + t.title).toLowerCase());
});

async function searchTrack(artist, index) {
  const searchQuery = encodeURIComponent(artist);
  const url = `https://itunes.apple.com/search?term=${searchQuery}&entity=song&limit=10`;
  
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        try {
          const json = JSON.parse(data);
          if (json.results && json.results.length > 0) {
            for (const result of json.results) {
              if (!result.previewUrl) continue;
              
              const key = (result.artistName + ' - ' + result.trackName).toLowerCase();
              
              if (!seen.has(key)) {
                seen.add(key);
                const fileNum = String(startIndex + index + 1).padStart(3, '0');
                const localFilename = `sample-${fileNum}.mp3`;
                const filepath = path.join(AUDIO_DIR, localFilename);
                
                console.log(`[${index + 1}] Downloading: ${result.artistName} - ${result.trackName.substring(0, 35)}`);
                
                await downloadFile(result.previewUrl, filepath);
                
                const newTrack = {
                  localFilename,
                  title: result.trackName,
                  artist: result.artistName,
                  album: result.collectionName || 'Unknown Album',
                  genre: 'reggae',
                  year: result.releaseDate ? result.releaseDate.substring(0, 4) : null,
                  duration: Math.round(result.trackTimeMillis / 1000),
                  albumArt: result.artworkUrl100?.replace('100x100', '500x500') || ''
                };
                
                resolve(newTrack);
                return;
              }
            }
          }
          console.log(`[${index + 1}] No new preview for: ${artist}`);
          resolve(null);
        } catch (e) {
          console.log(`[${index + 1}] Error: ${e.message}`);
          resolve(null);
        }
        resolve(null);
      });
    }).on('error', (e) => {
      console.log(`[${index + 1}] Error: ${e.message}`);
      resolve(null);
    });
  });
}

async function main() {
  console.log(`Adding reggae tracks...\n`);
  
  const newTracks = [];
  
  for (let i = 0; i < shuffledArtists.length && newTracks.length < 50; i++) {
    const track = await searchTrack(shuffledArtists[i], newTracks.length);
    if (track) {
      newTracks.push(track);
    }
    await new Promise(r => setTimeout(r, 300));
  }
  
  const allTracks = [...existingTracks, ...newTracks];
  fs.writeFileSync(METADATA_FILE, JSON.stringify(allTracks, null, 2));
  
  const genres = {};
  allTracks.forEach(t => {
    genres[t.genre] = (genres[t.genre] || 0) + 1;
  });
  
  console.log(`\nDone! Added ${newTracks.length} reggae tracks. Total: ${allTracks.length}`);
  console.log('By genre:', genres);
}

main().catch(console.error);
