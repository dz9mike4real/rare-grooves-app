#!/usr/bin/env node

/**
 * Script to download audio for all 200 tracks from Deezer
 * Run with: node scripts/download-all-tracks.js
 * 
 * Note: Deezer 30-second previews are free for personal/non-commercial use
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const AUDIO_DIR = path.join(__dirname, '../public/audio');
const METADATA_FILE = path.join(__dirname, '../lib/tracks-local.json');

// Ensure audio directory exists
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// All 200 tracks from tracks-data.ts
const ALL_TRACKS = [
  // Jazz tracks (35)
  { artist: 'Eddie Harris', title: 'Freedom Jazz Dance', genre: 'jazz' },
  { artist: 'Cannonball Adderley', title: 'Somethin\' Else', genre: 'jazz' },
  { artist: 'Miles Davis', title: 'So What', genre: 'jazz' },
  { artist: 'John Coltrane', title: 'Giant Steps', genre: 'jazz' },
  { artist: 'Herbie Hancock', title: 'Cantaloupe Island', genre: 'jazz' },
  { artist: 'Thelonious Monk', title: 'Round Midnight', genre: 'jazz' },
  { artist: 'Bill Evans', title: 'Peace Piece', genre: 'jazz' },
  { artist: 'Art Blakey', title: 'Moanin\'', genre: 'jazz' },
  { artist: 'Wes Montgomery', title: 'Four on Six', genre: 'jazz' },
  { artist: 'Charles Mingus', title: 'Goodbye Pork Pie Hat', genre: 'jazz' },
  { artist: 'Dave Brubeck', title: 'Take Five', genre: 'jazz' },
  { artist: 'Lee Morgan', title: 'The Sidewinder', genre: 'jazz' },
  { artist: 'Wayne Shorter', title: 'Footprints', genre: 'jazz' },
  { artist: 'Freddie Hubbard', title: 'Red Clay', genre: 'jazz' },
  { artist: 'McCoy Tyner', title: 'Fly With the Wind', genre: 'jazz' },
  { artist: 'Chick Corea', title: 'Spain', genre: 'jazz' },
  { artist: 'Weather Report', title: 'Birdland', genre: 'jazz' },
  { artist: 'Herbie Hancock', title: 'Chameleon', genre: 'jazz' },
  { artist: 'George Benson', title: 'Breezin\'', genre: 'jazz' },
  { artist: 'Stanley Clarke', title: 'School Days', genre: 'jazz' },
  { artist: 'Return to Forever', title: 'Spain', genre: 'jazz' },
  { artist: 'Al Di Meola', title: 'Mediterranean Sundance', genre: 'jazz' },
  { artist: 'John McLaughlin', title: 'My Goal Days', genre: 'jazz' },
  { artist: 'Pat Metheny', title: 'American Garage', genre: 'jazz' },
  { artist: 'Keith Jarrett', title: 'The Köln Concert', genre: 'jazz' },
  { artist: 'Ornette Coleman', title: 'Lonely Woman', genre: 'jazz' },
  { artist: 'Eric Dolphy', title: 'Out to Lunch', genre: 'jazz' },
  { artist: 'Pharoah Sanders', title: 'The Creator Has a Master Plan', genre: 'jazz' },
  { artist: 'Alice Coltrane', title: 'Journey to Satchidananda', genre: 'jazz' },
  { artist: 'Mahavishnu Orchestra', title: 'The Inner Mounting Flame', genre: 'jazz' },
  { artist: 'Lonnie Liston Smith', title: 'Expansions', genre: 'jazz' },
  { artist: 'Roy Ayers', title: 'Vibrations', genre: 'jazz' },
  { artist: 'Bob James', title: 'Nautilus', genre: 'jazz' },
  { artist: 'Lee Morgan', title: 'Search for the New Land', genre: 'jazz' },
  { artist: 'Jack McDuff', title: 'Hoodoo Man', genre: 'jazz' },
  
  // Funk tracks (37)
  { artist: 'James Brown', title: 'Sex Machine', genre: 'funk' },
  { artist: 'James Brown', title: 'Get Up (I Feel Like Being a) Sex Machine', genre: 'funk' },
  { artist: 'James Brown', title: 'Cold Sweat', genre: 'funk' },
  { artist: 'James Brown', title: 'Papa\'s Got a Brand New Bag', genre: 'funk' },
  { artist: 'James Brown', title: 'I Got You (I Feel Good)', genre: 'funk' },
  { artist: 'Parliament', title: 'Flash Light', genre: 'funk' },
  { artist: 'Parliament', title: 'Mothership Connection', genre: 'funk' },
  { artist: 'Parliament', title: 'Aqua Boogie', genre: 'funk' },
  { artist: 'Bootsy Collins', title: 'Bootzilla', genre: 'funk' },
  { artist: 'Bootsy Collins', title: 'Ahh... The Name Is Bootsy, Baby', genre: 'funk' },
  { artist: 'Maceo Parker', title: 'Soul Power', genre: 'funk' },
  { artist: 'The Meters', title: 'Cissy Strut', genre: 'funk' },
  { artist: 'The Meters', title: 'Africa', genre: 'funk' },
  { artist: 'The JB\'s', title: 'Pass the Peas', genre: 'funk' },
  { artist: 'The JB\'s', title: 'Doing It to Death', genre: 'funk' },
  { artist: 'Fred Wesley', title: 'House Party', genre: 'funk' },
  { artist: 'Bar-Kays', title: 'Soul Finger', genre: 'funk' },
  { artist: 'Ohio Players', title: 'Fire', genre: 'funk' },
  { artist: 'Ohio Players', title: 'Love Rollercoaster', genre: 'funk' },
  { artist: 'Kool & the Gang', title: 'Jungle Boogie', genre: 'funk' },
  { artist: 'Kool & the Gang', title: 'Ladies Night', genre: 'funk' },
  { artist: 'Earth Wind & Fire', title: 'September', genre: 'funk' },
  { artist: 'Earth Wind & Fire', title: 'Boogie Wonderland', genre: 'funk' },
  { artist: 'Earth Wind & Fire', title: 'Let Your Love Flow', genre: 'funk' },
  { artist: 'Cameo', title: 'Word Up', genre: 'funk' },
  { artist: 'Rick James', title: 'Super Freak', genre: 'funk' },
  { artist: 'Morris Day', title: 'The Bird', genre: 'funk' },
  { artist: 'Zapp', title: 'More Bounce to the Ounce', genre: 'funk' },
  { artist: 'Sly & the Family Stone', title: 'Everyday People', genre: 'funk' },
  { artist: 'Sly & the Family Stone', title: 'Thank You (Falettinme Be Mice Elf Agin)', genre: 'funk' },
  { artist: 'Tower of Power', title: 'What Is Hip', genre: 'funk' },
  { artist: 'Average White Band', title: 'Pick Up the Pieces', genre: 'funk' },
  { artist: 'War', title: 'Low Rider', genre: 'funk' },
  { artist: 'The Brothers Johnson', title: 'Strawberry Letter 23', genre: 'funk' },
  { artist: 'The Brothers Johnson', title: 'Get Off My Dash', genre: 'funk' },
  { artist: 'LTD', title: 'Back in Love Again', genre: 'funk' },
  
  // Soul tracks (35)
  { artist: 'Marvin Gaye', title: 'What\'s Going On', genre: 'soul' },
  { artist: 'Marvin Gaye', title: 'Sexual Healing', genre: 'soul' },
  { artist: 'Marvin Gaye', title: 'Let\'s Get It On', genre: 'soul' },
  { artist: 'Curtis Mayfield', title: 'Move On Up', genre: 'soul' },
  { artist: 'Curtis Mayfield', title: 'Superfly', genre: 'soul' },
  { artist: 'Aretha Franklin', title: 'Respect', genre: 'soul' },
  { artist: 'Aretha Franklin', title: 'Think', genre: 'soul' },
  { artist: 'Otis Redding', title: 'Sittin\' On The Dock Of The Bay', genre: 'soul' },
  { artist: 'Otis Redding', title: 'Try a Little Tenderness', genre: 'soul' },
  { artist: 'Sam Cooke', title: 'A Change Is Gonna Come', genre: 'soul' },
  { artist: 'Sam Cooke', title: 'You Send Me', genre: 'soul' },
  { artist: 'James Brown', title: 'Please, Please, Please', genre: 'soul' },
  { artist: 'Al Green', title: 'Let\'s Stay Together', genre: 'soul' },
  { artist: 'Al Green', title: 'Tired of Being Alone', genre: 'soul' },
  { artist: 'The Temptations', title: 'My Girl', genre: 'soul' },
  { artist: 'The Temptations', title: 'Papa Was a Rollin\' Stone', genre: 'soul' },
  { artist: 'Stevie Wonder', title: 'Superstition', genre: 'soul' },
  { artist: 'Stevie Wonder', title: 'Sir Duke', genre: 'soul' },
  { artist: 'Stevie Wonder', title: 'Living for the City', genre: 'soul' },
  { artist: 'Donny Hathaway', title: 'A Song For You', genre: 'soul' },
  { artist: 'Donny Hathaway', title: 'The Ghetto', genre: 'soul' },
  { artist: 'Roberta Flack', title: 'Killing Me Softly', genre: 'soul' },
  { artist: 'Roberta Flack', title: 'The Closer I Get to You', genre: 'soul' },
  { artist: 'Bill Withers', title: 'Ain\'t No Sunshine', genre: 'soul' },
  { artist: 'Bill Withers', title: 'Lean on Me', genre: 'soul' },
  { artist: 'Curtis Mayfield', title: 'Freddie\'s Dead', genre: 'soul' },
  { artist: 'The Stylistics', title: 'You Are Everything', genre: 'soul' },
  { artist: 'The Dramatics', title: 'In the Rain', genre: 'soul' },
  { artist: 'Harold Melvin', title: 'Wake Up Everybody', genre: 'soul' },
  { artist: 'The Spinners', title: 'I\'ll Be Around', genre: 'soul' },
  { artist: 'Gladys Knight', title: 'Midnight Train to Georgia', genre: 'soul' },
  { artist: 'Diana Ross', title: 'Upside Down', genre: 'soul' },
  { artist: 'Michael Jackson', title: 'Don\'t Stop \'Til You Get Enough', genre: 'soul' },
  { artist: 'Whitney Houston', title: 'I Wanna Dance With Somebody', genre: 'soul' },
  
  // R&B tracks (30)
  { artist: 'Bobby Caldwell', title: 'What You Won\'t Do for Love', genre: 'r&b' },
  { artist: 'The O\'Jays', title: 'Back Stabbers', genre: 'r&b' },
  { artist: 'The O\'Jays', title: 'Love Train', genre: 'r&b' },
  { artist: 'Sade', title: 'Smooth Operator', genre: 'r&b' },
  { artist: 'Sade', title: 'No Ordinary Love', genre: 'r&b' },
  { artist: 'Luther Vandross', title: 'Never Too Much', genre: 'r&b' },
  { artist: 'Luther Vandross', title: 'Any Love', genre: 'r&b' },
  { artist: 'Kenny G', title: 'Songbird', genre: 'r&b' },
  { artist: 'Anita Baker', title: 'Sweet Love', genre: 'r&b' },
  { artist: 'Anita Baker', title: 'Caught Up in the Rapture', genre: 'r&b' },
  { artist: 'New Edition', title: 'Candy Girl', genre: 'r&b' },
  { artist: 'Micheal Jackson', title: 'P.Y.T. (Pretty Young Thing)', genre: 'r&b' },
  { artist: 'Prince', title: '1999', genre: 'r&b' },
  { artist: 'Prince', title: 'Kiss', genre: 'r&b' },
  { artist: 'Prince', title: 'Raspberry Beret', genre: 'r&b' },
  { artist: 'Jamiroquai', title: 'Virtual Insanity', genre: 'r&b' },
  { artist: 'Erykah Badu', title: 'Next Lifetime', genre: 'r&b' },
  { artist: 'D\'Angelo', title: 'Brown Sugar', genre: 'r&b' },
  { artist: 'Lauryn Hill', title: 'Doo Wop (That Thing)', genre: 'r&b' },
  { artist: 'Maxwell', title: 'Ascension (Don\'t Ever Wonder)', genre: 'r&b' },
  { artist: 'India.Arie', title: 'Video', genre: 'r&b' },
  { artist: 'Anthony Hamilton', title: 'Charleston', genre: 'r&b' },
  { artist: 'Jill Scott', title: 'He Loves Me', genre: 'r&b' },
  { artist: 'Evanescence', title: 'Bring Me to Life', genre: 'r&b' },
  { artist: 'Amy Winehouse', title: 'Rehab', genre: 'r&b' },
  { artist: 'Adele', title: 'Rolling in the Deep', genre: 'r&b' },
  { artist: 'Frank Ocean', title: 'Channel Orange', genre: 'r&b' },
  { artist: 'The Weeknd', title: 'Often', genre: 'r&b' },
  { artist: 'Bruno Mars', title: 'Just the Way You Are', genre: 'r&b' },
  { artist: 'Usher', title: 'U Don\'t Have to Call', genre: 'r&b' },
  
  // Reggae tracks (34)
  { artist: 'Bob Marley', title: 'No Woman No Cry', genre: 'reggae' },
  { artist: 'Bob Marley', title: 'One Love', genre: 'reggae' },
  { artist: 'Bob Marley', title: 'Exodus', genre: 'reggae' },
  { artist: 'Bob Marley', title: 'Could You Be Loved', genre: 'reggae' },
  { artist: 'Bob Marley', title: 'Get Up Stand Up', genre: 'reggae' },
  { artist: 'Bob Marley', title: 'Redemption Song', genre: 'reggae' },
  { artist: 'Bob Marley', title: 'Is This Love', genre: 'reggae' },
  { artist: 'Bob Marley', title: 'Three Little Birds', genre: 'reggae' },
  { artist: 'Peter Tosh', title: 'Legalize It', genre: 'reggae' },
  { artist: 'Peter Tosh', title: 'Equal Rights', genre: 'reggae' },
  { artist: 'Peter Tosh', title: 'Get Up Stand Up', genre: 'reggae' },
  { artist: 'Jimmy Cliff', title: 'The Harder They Come', genre: 'reggae' },
  { artist: 'Jimmy Cliff', title: 'Many Rivers to Cross', genre: 'reggae' },
  { artist: 'Toots and the Maytals', title: 'Pressure Drop', genre: 'reggae' },
  { artist: 'Toots and the Maytals', title: 'Funky Kingston', genre: 'reggae' },
  { artist: 'Desmond Dekker', title: 'Israelites', genre: 'reggae' },
  { artist: 'Gregory Isaacs', title: 'Night Nurse', genre: 'reggae' },
  { artist: 'Barrington Levy', title: 'Here I Come', genre: 'reggae' },
  { artist: 'Sister Nancy', title: 'Bam Bam', genre: 'reggae' },
  { artist: 'UB40', title: 'Red Red Wine', genre: 'reggae' },
  { artist: 'Black Uhuru', title: 'What is Life', genre: 'reggae' },
  { artist: 'Dennis Brown', title: 'Money in My Pocket', genre: 'reggae' },
  { artist: 'Freddie McGregor', title: 'Big Ship', genre: 'reggae' },
  { artist: 'Shabba Ranks', title: 'Mr. Loverman', genre: 'reggae' },
  { artist: 'Chaka Demus', title: 'Murder She Wrote', genre: 'reggae' },
  { artist: 'Bounty Killer', title: 'Look', genre: 'reggae' },
  { artist: 'Sean Paul', title: 'Get Busy', genre: 'reggae' },
  { artist: 'Shaggy', title: 'It Wasn\'t Me', genre: 'reggae' },
  { artist: 'Damian Marley', title: 'Welcome to Jamrock', genre: 'reggae' },
  { artist: 'Konscious', title: 'Prodigal Son', genre: 'reggae' },
  { artist: 'Bob Marley', title: 'Stir It Up', genre: 'reggae' },
  { artist: 'Peter Tosh', title: 'Positive Vibration', genre: 'reggae' },
  { artist: 'Bob Marley', title: 'Small Axe', genre: 'reggae' },
  { artist: 'Jimmy Cliff', title: 'I Can See Clearly Now', genre: 'reggae' },
  
  // Afrobeat tracks (34)
  { artist: 'Fela Kuti', title: 'Zombie', genre: 'afrobeat' },
  { artist: 'Fela Kuti', title: 'Water No Get Enemy', genre: 'afrobeat' },
  { artist: 'Fela Kuti', title: 'Gentleman', genre: 'afrobeat' },
  { artist: 'Fela Kuti', title: 'Sorrow Tears and Blood', genre: 'afrobeat' },
  { artist: 'Fela Kuti', title: 'Coffin for Head of State', genre: 'afrobeat' },
  { artist: 'Fela Kuti', title: 'Expensive Shit', genre: 'afrobeat' },
  { artist: 'Fela Kuti', title: 'Roforofo Fight', genre: 'afrobeat' },
  { artist: 'Fela Kuti', title: 'Kalakuta Show', genre: 'afrobeat' },
  { artist: 'Fela Kuti', title: 'Jonson', genre: 'afrobeat' },
  { artist: 'Fela Kuti', title: 'Shakara', genre: 'afrobeat' },
  { artist: 'Tony Allen', title: 'Go Slow', genre: 'afrobeat' },
  { artist: 'Tony Allen', title: 'Asiko', genre: 'afrobeat' },
  { artist: 'Tony Allen', title: 'Moye', genre: 'afrobeat' },
  { artist: 'William Onyeabor', title: 'Fantastic Man', genre: 'afrobeat' },
  { artist: 'William Onyeabor', title: 'When the Going Is Smooth', genre: 'afrobeat' },
  { artist: 'William Onyeabor', title: 'Love Is a Music', genre: 'afrobeat' },
  { artist: 'Manu Dibango', title: 'Soul Makossa', genre: 'afrobeat' },
  { artist: 'Manu Dibango', title: 'Africa', genre: 'afrobeat' },
  { artist: 'Manu Dibango', title: 'Sweet Thing', genre: 'afrobeat' },
  { artist: 'BLO', title: 'Fire', genre: 'afrobeat' },
  { artist: 'BLO', title: 'Uhuru', genre: 'afrobeat' },
  { artist: 'BLO', title: 'Good People', genre: 'afrobeat' },
  { artist: 'Ebo Taylor', title: 'Afro-Soul Medley', genre: 'afrobeat' },
  { artist: 'Ebo Taylor', title: 'Love and Death', genre: 'afrobeat' },
  { artist: 'Orlando Julius', title: 'Drum Song', genre: 'afrobeat' },
  { artist: 'Orlando Julius', title: 'Super Afro Soul', genre: 'afrobeat' },
  { artist: 'Fela Kuti', title: 'Colonial Mentality', genre: 'afrobeat' },
  { artist: 'Fela Kuti', title: 'Mr. Follow Follow', genre: 'afrobeat' },
  { artist: 'Fela Kuti', title: 'Fela\'s Meditation', genre: 'afrobeat' },
  { artist: 'Fela Kuti', title: 'Coat of Arms', genre: 'afrobeat' },
  { artist: 'Fela Kuti', title: 'Original Fear', genre: 'afrobeat' },
  { artist: 'Tony Allen', title: 'Secret Agent', genre: 'afrobeat' },
  { artist: 'Burna Boy', title: 'Ye', genre: 'afrobeat' },
  { artist: 'Wizkid', title: 'Essence', genre: 'afrobeat' },
  { artist: 'Davido', title: 'If', genre: 'afrobeat' },
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
  console.log(`Starting download for all ${ALL_TRACKS} tracks...\n`);
  
  const downloadedTracks = [];
  let trackIndex = 1;
  
  // Load existing tracks to skip already downloaded
  let existingTracks = [];
  if (fs.existsSync(METADATA_FILE)) {
    try {
      existingTracks = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
      console.log(`Found ${existingTracks.length} existing tracks\n`);
    } catch (e) {
      console.log('No existing metadata file\n');
    }
  }
  
  // Create Set of already downloaded artist/title combinations
  const downloadedSet = new Set(
    existingTracks.map(t => `${t.artist.toLowerCase()}-${t.title.toLowerCase()}`)
  );
  
  for (const { artist, title, genre } of ALL_TRACKS) {
    const key = `${artist.toLowerCase()}-${title.toLowerCase()}`;
    
    // Skip if already downloaded
    if (downloadedSet.has(key)) {
      console.log(`[${trackIndex}/${ALL_TRACKS}] Skipping (already exists): ${artist} - ${title}`);
      trackIndex++;
      continue;
    }
    
    console.log(`[${trackIndex}/${ALL_TRACKS}] Searching: ${artist} - ${title} (${genre})`);
    
    try {
      const track = await searchDeezer(artist, title);
      
      if (!track) {
        console.log(`  Not found on Deezer`);
        trackIndex++;
        continue;
      }
      
      if (!track.preview) {
        console.log(`  No preview available`);
        trackIndex++;
        continue;
      }
      
      const filename = `sample-${trackIndex.toString().padStart(3, '0')}.mp3`;
      const filepath = path.join(AUDIO_DIR, filename);
      
      console.log(`  Downloading preview...`);
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
      
      // Rate limiting - be nice to Deezer
      await new Promise(r => setTimeout(r, 800));
      
    } catch (error) {
      console.error(`  Error:`, error.message);
      trackIndex++;
    }
  }
  
  // Merge with existing tracks
  const allTracks = [...existingTracks, ...downloadedTracks];
  
  // Save track metadata
  fs.writeFileSync(METADATA_FILE, JSON.stringify(allTracks, null, 2));
  
  // Count files
  const files = fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.mp3'));
  const totalSize = files.reduce((acc, f) => acc + fs.statSync(path.join(AUDIO_DIR, f)).size, 0);
  
  console.log(`\n========================================`);
  console.log(`Total tracks in metadata: ${allTracks.length}`);
  console.log(`Audio files: ${files.length}`);
  console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(console.error);
