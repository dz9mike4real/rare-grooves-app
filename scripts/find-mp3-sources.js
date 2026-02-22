#!/usr/bin/env node

/**
 * Try to find MP3s from multiple sources
 * Run with: node scripts/find-mp3-sources.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const JAMENDO_CLIENT_ID = '4c8bc5e9';
const AUDIO_DIR = path.join(__dirname, '../public/audio');

// Test tracks from different genres
const TEST_TRACKS = [
  { artist: 'Miles Davis', title: 'So What' },
  { artist: 'James Brown', title: 'Sex Machine' },
  { artist: 'Bob Marley', title: 'No Woman No Cry' },
];

function searchJamendo(artist, title) {
  return new Promise((resolve) => {
    const query = encodeURIComponent(`${artist} ${title}`);
    const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=1&search=${query}&include=musicinfo`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.results && json.results.length > 0) {
            const track = json.results[0];
            resolve({
              source: 'jamendo',
              audioUrl: track.audio,
              title: track.name,
              artist: track.artist_name,
              album: track.album_name,
              duration: track.duration,
              image: track.image
            });
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function searchInternetArchive(artist, title) {
  return new Promise((resolve) => {
    const query = encodeURIComponent(`${artist} ${title}`);
    const url = `https://archive.org/advancedsearch.php?q=${query}+mediatype:audio&fl[]=identifier,title,creator&output=json&limit=1`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.response && json.response.docs && json.response.docs.length > 0) {
            const item = json.response.docs[0];
            // Get a download URL from the item
            const downloadUrl = `https://archive.org/download/${item.identifier}/${item.identifier}_vbr.mp3`;
            resolve({
              source: 'internetarchive',
              audioUrl: downloadUrl,
              title: item.title,
              artist: item.creator,
              identifier: item.identifier
            });
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function searchMusopen(artist, title) {
  return new Promise((resolve) => {
    // Musopen mostly has classical music
    const query = encodeURIComponent(`${artist} ${title}`);
    const url = `https://api.musopen.org/v1/composer/search?query=${query}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(null); // Musopen API is limited
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function testSources() {
  console.log('Testing MP3 sources...\n');
  
  for (const { artist, title } of TEST_TRACKS) {
    console.log(`\n=== ${artist} - ${title} ===`);
    
    // Try Jamendo
    console.log('Trying Jamendo...');
    const jamendo = await searchJamendo(artist, title);
    if (jamendo) {
      console.log('  ✓ Jamendo found!');
      console.log(`    URL: ${jamendo.audioUrl}`);
    } else {
      console.log('  ✗ Jamendo: Not found');
    }
    
    // Try Internet Archive
    console.log('Trying Internet Archive...');
    const ia = await searchInternetArchive(artist, title);
    if (ia) {
      console.log('  ✓ Internet Archive found!');
      console.log(`    URL: ${ia.audioUrl}`);
    } else {
      console.log('  ✗ Internet Archive: Not found');
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
}

testSources().catch(console.error);
