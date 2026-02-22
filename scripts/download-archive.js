#!/usr/bin/env node

/**
 * Download full tracks from Internet Archive
 * Run with: node scripts/download-archive.js [count]
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, '../public/audio');
const METADATA_FILE = path.join(__dirname, '../lib/tracks-local.json');

// Search queries for each genre
const SEARCH_QUERIES = [
  // Jazz
  { query: 'Miles Davis So What full album', genre: 'jazz', count: 3 },
  { query: 'John Coltrane jazz full album', genre: 'jazz', count: 3 },
  { query: 'Herbie Hancock full album', genre: 'jazz', count: 3 },
  // Funk
  { query: 'James Brown full album funk', genre: 'funk', count: 3 },
  { query: 'Parliament Funkadelic full album', genre: 'funk', count: 3 },
  { query: 'Meters funk full album', genre: 'funk', count: 3 },
  // Soul
  { query: 'Marvin Gaye full album soul', genre: 'soul', count: 3 },
  { query: 'Curtis Mayfield full album', genre: 'soul', count: 3 },
  { query: 'Aretha Franklin full album soul', genre: 'soul', count: 3 },
  // Reggae
  { query: 'Bob Marley full album reggae', genre: 'reggae', count: 3 },
  { query: 'Peter Tosh full album', genre: 'reggae', count: 3 },
  // Afrobeat
  { query: 'Fela Kuti afrobeat full album', genre: 'afrobeat', count: 3 },
];

function searchArchive(query) {
  return new Promise((resolve, reject) => {
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+mediatype:audio&fl[]=identifier&fl[]=title&fl[]=creator&output=json&limit=5`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.response.docs || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function downloadFromArchive(identifier, outputPath) {
  return new Promise((resolve, reject) => {
    // Get download URL
    const metadataUrl = `https://archive.org/metadata/${identifier}`;
    
    https.get(metadataUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        try {
          const json = JSON.parse(data);
          
          // Find MP3 file
          const mp3File = json.files?.find(f => f.format === 'VBR MP3' || f.format === 'MP3' || f.name?.endsWith('.mp3'));
          
          if (!mp3File) {
            resolve(null);
            return;
          }
          
          const downloadUrl = `https://archive.org/download/${identifier}/${mp3File.name}`;
          
          // Download the file
          const file = fs.createWriteStream(outputPath);
          https.get(downloadUrl, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
              // Handle redirect
              https.get(response.headers.location, (response2) => {
                response2.pipe(file);
                file.on('finish', () => {
                  file.close();
                  resolve(outputPath);
                });
              }).on('error', reject);
            } else if (response.statusCode === 200) {
              response.pipe(file);
              file.on('finish', () => {
                file.close();
                resolve(outputPath);
              });
            } else {
              reject(new Error(`HTTP ${response.statusCode}`));
            }
          }).on('error', reject);
          
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Searching Internet Archive for full albums...\n');
  
  const downloadedTracks = [];
  let trackIndex = 1;
  
  for (const { query, genre, count } of SEARCH_QUERIES) {
    console.log(`\n=== ${genre}: ${query} ===`);
    
    try {
      const results = await searchArchive(query);
      console.log(`Found ${results.length} results`);
      
      for (const result of results.slice(0, count)) {
        console.log(`  Trying: ${result.title}`);
        
        const filename = `archive-${trackIndex}.mp3`;
        const filepath = path.join(AUDIO_DIR, filename);
        
        try {
          await downloadFromArchive(result.identifier, filepath);
          
          if (fs.existsSync(filepath)) {
            const stats = fs.statSync(filepath);
            if (stats.size > 1000000) { // At least 1MB
              console.log(`    ✓ Downloaded: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
              
              downloadedTracks.push({
                localFilename: filename,
                title: result.title,
                artist: result.creator,
                album: result.title,
                genre: genre,
                year: null,
                duration: 300, // Estimate
                albumArt: '',
              });
              trackIndex++;
            } else {
              console.log(`    ✗ File too small`);
              fs.unlinkSync(filepath);
            }
          } else {
            console.log(`    ✗ Failed`);
          }
        } catch (e) {
          console.log(`    ✗ Error: ${e.message}`);
        }
        
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }
  
  console.log(`\n=== Results ===`);
  console.log(`Downloaded: ${downloadedTracks.length} tracks`);
  
  // Save metadata
  const metadata = require(METADATA_FILE);
  const updated = [...metadata, ...downloadedTracks];
  fs.writeFileSync(METADATA_FILE, JSON.stringify(updated, null, 2));
  console.log(`Saved to tracks-local.json`);
}

main().catch(console.error);
