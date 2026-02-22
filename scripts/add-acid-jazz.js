#!/usr/bin/env node

/**
 * Add tracks from Legends of Acid Jazz series
 * Run with: node scripts/add-acid-jazz.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const AUDIO_DIR = path.join(__dirname, '../public/audio');
const METADATA_FILE = path.join(__dirname, '../lib/tracks-local.json');

const existingTracks = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
const startIndex = existingTracks.length;

console.log(`Current tracks: ${startIndex}`);

const acidJazzSearchTerms = [
  'Legends of Acid Jazz', 'Acid Jazz', 'Mighty Sides', 'Funk Soul',
  'Soul Jazz', 'Jazz Funk', 'Rare Grooves', 'Big Beat', 'Stereolab',
  'Brand New Second Hand', 'James Taylor Quartet', 'The Cinematic Orchestra',
  'Ninja Tune', 'Mojo', 'The Herbaliser', 'DJ Shadow', '2 Many DJ',
  'Bobby Brown', 'Joe Tex', 'The Righteous Brothers', 'Sam & Dave',
  'Wilson Pickett', 'James Brown', 'Charles Wright', 'Dyke & The Blazers',
  'The Meters', 'The Watts Prophets', 'The Soul Searchers', 'Gil Scott-Heron',
  'Curtis Mayfield', 'The Impressions', 'The Falcons', 'Joe Simon',
  'The Staple Singers', 'Mavis Staples', 'Patti LaBelle', 'The Blue Notes',
  'Johnny Hammond', 'Lou Donaldson', 'Donny Hathaway', 'The Brothers Johnson',
  'Kashif', 'Evelyn King', 'Shalamar', 'The Whispers', 'Midnight Star',
  'The Deele', 'Chery', 'Cheri', 'Murphy', 'Sade', 'Shuggie Otis'
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

const shuffledSearchTerms = shuffle(acidJazzSearchTerms);

const seen = new Set();
existingTracks.forEach(t => {
  seen.add((t.artist + ' - ' + t.title).toLowerCase());
});

async function searchTrack(searchTerm, index) {
  const searchQuery = encodeURIComponent(searchTerm);
  const url = `https://api.deezer.com/search?q=${searchQuery}&limit=8`;
  
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        try {
          const json = JSON.parse(data);
          if (json.data && json.data.length > 0) {
            for (const result of json.data) {
              const key = (result.artist.name + ' - ' + result.title).toLowerCase();
              
              if (result.preview && !seen.has(key)) {
                seen.add(key);
                const fileNum = String(startIndex + index + 1).padStart(3, '0');
                const localFilename = `sample-${fileNum}.mp3`;
                const filepath = path.join(AUDIO_DIR, localFilename);
                
                console.log(`[${index + 1}] Downloading: ${result.artist.name} - ${result.title.substring(0, 35)}`);
                
                await downloadFile(result.preview, filepath);
                
                const newTrack = {
                  localFilename,
                  title: result.title,
                  artist: result.artist.name,
                  album: result.album?.title || 'Unknown Album',
                  genre: 'jazz',
                  year: null,
                  duration: 30,
                  albumArt: result.album?.cover_medium || result.artist?.picture_medium || ''
                };
                
                resolve(newTrack);
                return;
              }
            }
          }
          console.log(`[${index + 1}] No new preview for: ${searchTerm}`);
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
  const targetTotal = 250;
  const toAdd = targetTotal - existingTracks.length;
  
  if (toAdd <= 0) {
    console.log('Already at target!');
    return;
  }
  
  console.log(`Adding ${toAdd} more acid jazz tracks to reach ${targetTotal}...\n`);
  
  const newTracks = [];
  
  for (let i = 0; i < shuffledSearchTerms.length && newTracks.length < toAdd; i++) {
    const track = await searchTrack(shuffledSearchTerms[i], newTracks.length);
    if (track) {
      newTracks.push(track);
    }
    await new Promise(r => setTimeout(r, 500));
  }
  
  const allTracks = [...existingTracks, ...newTracks];
  fs.writeFileSync(METADATA_FILE, JSON.stringify(allTracks, null, 2));
  
  console.log(`\nDone! Added ${newTracks.length} tracks. Total: ${allTracks.length}`);
}

main().catch(console.error);
