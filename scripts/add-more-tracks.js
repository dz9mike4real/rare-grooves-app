#!/usr/bin/env node

/**
 * Add more tracks (jazz, funk, r&b, soul, afrobeat only)
 * Run with: node scripts/add-more-tracks.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const AUDIO_DIR = path.join(__dirname, '../public/audio');
const METADATA_FILE = path.join(__dirname, '../lib/tracks-local.json');

const existingTracks = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
const startIndex = existingTracks.length;

console.log(`Current tracks: ${startIndex}`);

const genreArtists = {
  jazz: [
    'Cannonball Adderley', 'Bill Evans', 'Oscar Peterson', 'Freddie Hubbard',
    'McCoy Tyner', 'Bobby Hutcherson', 'Joe Henderson', 'Stanley Clarke',
    'Return to Forever', 'Weather Report', 'Spyro Gyra', 'Dave Koz',
    'George Benson', 'Al Jarreau', 'Kenny Barron', 'Ron Carter',
    'Wynton Marsalis', 'Joshua Redman', 'Diana Krall', 'Norah Jones'
  ],
  funk: [
    'Maceo Parker', 'Bootsy Collins', 'Parliament', 'The Meters', 'The J.B.\'s',
    'Fred Wesley', 'Bar-Kays', 'Ohio Players', 'Kool & The Gang', 'Earth Wind & Fire',
    'Cameo', 'Zapp', 'Sly & The Family Stone', 'Tower Of Power', 'Average White Band',
    'War', 'The Brothers Johnson', 'L.T.D.', 'The Gap Band', 'Shotgun'
  ],
  soul: [
    'Curtis Mayfield', 'Marvin Gaye', 'Sam Cooke', 'Otis Redding', 'Aretha Franklin',
    'Al Green', 'Bobby Womack', 'Donny Hathaway', 'Roberta Flacks', 'Nina Simone',
    'The Temptations', 'Stevie Wonder', 'Bill Withers', 'The Stylistics', 'The Dramatics',
    'Harold Melvin & The Blue Notes', 'The Spinners', 'Gladys Knight', 'Diana Ross', 'Whitney Houston'
  ],
  'r&b': [
    'Ray Charles', 'Stevie Wonder', 'Michael Jackson', 'Prince', 'Bobby Brown',
    'New Edition', 'Jodeci', 'Bell Biv DeVoe', 'Ralph Tresvant', 'Johnny Gill',
    'After 7', 'Tony Toni Tone', 'En Vogue', 'Boyz II Men', 'All-4-One',
    'Jagged Edge', 'Aaliyah', 'Jill Scott', 'Erykah Badu', 'D\'Angelo'
  ],
  afrobeat: [
    'Tony Allen', 'Seun Kuti', 'Antibalas', 'Miriam Makeba', 'King Sunny Ade',
    'Victor Uwaifo', 'Burna Boy', 'Wizkid', 'Davido', 'Femi Kuti',
    'Baba Maal', 'Manu Dibango', 'Fela Kuti & Egypt 80', 'Baba Commandant', 'Samba'
  ]
};

const allSearchTerms = [];
Object.entries(genreArtists).forEach(([genre, artists]) => {
  artists.forEach(artist => {
    allSearchTerms.push({ genre, artist });
  });
});

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

const shuffledSearchTerms = shuffle(allSearchTerms);

const seen = new Set();
existingTracks.forEach(t => {
  seen.add((t.artist + ' - ' + t.title).toLowerCase());
});

async function searchTrack(searchTerm, index) {
  const searchQuery = encodeURIComponent(searchTerm.artist);
  const url = `https://api.deezer.com/search?q=${searchQuery}&limit=5`;
  
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        try {
          const json = JSON.parse(data);
          if (json.data && json.data.length > 0) {
            const result = json.data[0];
            const key = (result.artist.name + ' - ' + result.title).toLowerCase();
            
            if (result.preview && !seen.has(key)) {
              seen.add(key);
              const fileNum = String(startIndex + index + 1).padStart(3, '0');
              const localFilename = `sample-${fileNum}.mp3`;
              const filepath = path.join(AUDIO_DIR, localFilename);
              
              console.log(`[${index + 1}] Downloading: ${result.artist.name} - ${result.title.substring(0, 30)}`);
              
              await downloadFile(result.preview, filepath);
              
              const newTrack = {
                localFilename,
                title: result.title,
                artist: result.artist.name,
                album: result.album?.title || 'Unknown Album',
                genre: searchTerm.genre,
                year: null,
                duration: 30,
                albumArt: result.album?.cover_medium || result.artist?.picture_medium || ''
              };
              
              resolve(newTrack);
              return;
            }
          }
          console.log(`[${index + 1}] No new preview for: ${searchTerm.artist}`);
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
  
  console.log(`Adding ${toAdd} more tracks to reach ${targetTotal}...\n`);
  
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
