#!/usr/bin/env node

/**
 * Re-download tracks with better matching
 * Run with: node scripts/redownload-tracks.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const AUDIO_DIR = path.join(__dirname, '../public/audio');
const METADATA_FILE = path.join(__dirname, '../lib/tracks-local.json');

const tracks = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
console.log(`Total tracks to re-download: ${tracks.length}`);

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

async function searchAndDownload(track, index) {
  const searchQuery = encodeURIComponent(`${track.artist} ${track.title}`);
  const url = `https://api.deezer.com/search?q=${searchQuery}&limit=1`;
  
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        try {
          const json = JSON.parse(data);
          if (json.data && json.data.length > 0) {
            const result = json.data[0];
            
            if (result.preview) {
              const filepath = path.join(AUDIO_DIR, track.localFilename);
              
              console.log(`[${index + 1}/${tracks.length}] Re-downloading: ${track.artist} - ${track.title.substring(0, 25)}`);
              
              await downloadFile(result.preview, filepath);
              console.log(`  Saved: ${track.localFilename}`);
            } else {
              console.log(`[${index + 1}/${tracks.length}] No preview: ${track.artist}`);
            }
          } else {
            console.log(`[${index + 1}/${tracks.length}] Not found: ${track.artist}`);
          }
        } catch (e) {
          console.log(`[${index + 1}/${tracks.length}] Error: ${e.message}`);
        }
        resolve();
      });
    }).on('error', (e) => {
      console.log(`[${index + 1}/${tracks.length}] Error: ${e.message}`);
      resolve();
    });
  });
}

async function main() {
  console.log('Re-downloading all tracks with fresh Deezer previews...\n');
  
  for (let i = 0; i < tracks.length; i++) {
    await searchAndDownload(tracks[i], i);
    await new Promise(r => setTimeout(r, 500)); // Rate limit
  }
  
  console.log('\nDone!');
}

main().catch(console.error);
