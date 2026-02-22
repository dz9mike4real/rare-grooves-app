#!/usr/bin/env node

/**
 * Add tracks using iTunes Search API
 * Run with: node scripts/add-itunes-tracks.js
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
    'Miles Davis', 'John Coltrane', 'Herbie Hancock', 'Thelonious Monk', 'Dave Brubeck',
    'Chet Baker', 'Art Blakey', 'Charles Mingus', 'Wayne Shorter', 'Cannonball Adderley',
    'Bill Evans', 'Oscar Peterson', 'Sarah Vaughan', 'Ella Fitzgerald', 'Freddie Hubbard',
    'McCoy Tyner', 'Keith Jarrett', 'Lee Morgan', 'Dexter Gordon', 'Sonny Rollins',
    'Joe Henderson', 'Stan Getz', 'Wes Montgomery', 'Jimmy Smith', 'Grant Green',
    'Kenny Burrell', 'Jackie McLean', 'Curtis Fuller', 'Freddie Redd', 'Bobby Hutcherson'
  ],
  funk: [
    'James Brown', 'Maceo Parker', 'Parliament', 'Booker T', 'The Meters',
    'Lee Dorsey', 'The Bar-Kays', 'Isaac Hayes', 'Kool & The Gang', 'Ohio Players',
    'Earth Wind & Fire', 'Cameo', 'Zapp', 'Bootsy Collins', 'The J.B.\'s',
    'Fred Wesley', 'Sly & The Family Stone', 'Tower Of Power', 'Average White Band', 'War',
    'The Brothers Johnson', 'L.T.D.', 'The Gap Band', 'The Whispers', 'Midnight Star'
  ],
  soul: [
    'Curtis Mayfield', 'Marvin Gaye', 'Sam Cooke', 'Otis Redding', 'Aretha Franklin',
    'Al Green', 'Bobby Womack', 'Donny Hathaway', 'Roberta Flack', 'Nina Simone',
    'The Temptations', 'Stevie Wonder', 'Bill Withers', 'The Stylistics', 'The Dramatics',
    'Harold Melvin & The Blue Notes', 'The Spinners', 'Gladys Knight', 'Diana Ross', 'Whitney Houston',
    'James Brown', 'Joe Tex', 'The Staple Singers', 'Patti LaBelle', 'The O\'Jays'
  ],
  'r&b': [
    'Ray Charles', 'Stevie Wonder', 'Michael Jackson', 'Prince', 'Bobby Brown',
    'New Edition', 'Jodeci', 'Bell Biv DeVoe', 'Ralph Tresvant', 'Johnny Gill',
    'After 7', 'Tony Toni Tone', 'En Vogue', 'Boyz II Men', 'All-4-One',
    'Jagged Edge', 'Aaliyah', 'Jill Scott', 'Erykah Badu', 'D\'Angelo',
    'Maxwell', 'Musiq Soulchild', 'India.Arie', 'Kenny G', 'Luther Vandross'
  ],
  afrobeat: [
    'Fela Kuti', 'Tony Allen', 'Seun Kuti', 'Antibalas', 'Miriam Makeba',
    'King Sunny Ade', 'Victor Uwaifo', 'Burna Boy', 'Wizkid', 'Davido',
    'Femi Kuti', 'Baba Maal', 'Manu Dibango', 'Orchestre Poly-Rythmo', 'Baba Commandant',
    'Samba', 'Bembe Segue', 'Lagos', 'Sauti Sol', 'Davido'
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
                  genre: searchTerm.genre,
                  year: result.releaseDate ? result.releaseDate.substring(0, 4) : null,
                  duration: Math.round(result.trackTimeMillis / 1000),
                  albumArt: result.artworkUrl100?.replace('100x100', '500x500') || ''
                };
                
                resolve(newTrack);
                return;
              }
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
  const targetTotal = 300;
  const toAdd = targetTotal - existingTracks.length;
  
  if (toAdd <= 0) {
    console.log('Already at target! Run with --remove-reggae to remove reggae tracks.');
    return;
  }
  
  console.log(`Adding ${toAdd} more tracks to reach ${targetTotal} using iTunes API...\n`);
  
  const newTracks = [];
  
  for (let i = 0; i < shuffledSearchTerms.length && newTracks.length < toAdd; i++) {
    const track = await searchTrack(shuffledSearchTerms[i], newTracks.length);
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
  
  console.log(`\nDone! Added ${newTracks.length} tracks. Total: ${allTracks.length}`);
  console.log('By genre:', genres);
}

main().catch(console.error);
