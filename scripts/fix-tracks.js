#!/usr/bin/env node

/**
 * Remove duplicate tracks from tracks-local.json, keeping first occurrence
 */

const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, '../public/audio');
const METADATA_FILE = path.join(__dirname, '../lib/tracks-local.json');

const tracks = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
console.log('Original tracks:', tracks.length);

// Remove duplicates based on localFilename, keeping first
const seen = new Set();
const uniqueTracks = tracks.filter(track => {
  if (seen.has(track.localFilename)) {
    return false;
  }
  seen.add(track.localFilename);
  return true;
});

console.log('Unique tracks:', uniqueTracks.length);

// Verify files exist
const files = new Set(fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.mp3')));
const validTracks = uniqueTracks.filter(t => files.has(t.localFilename));

console.log('Valid tracks with files:', validTracks.length);

// Save fixed metadata
fs.writeFileSync(METADATA_FILE, JSON.stringify(validTracks, null, 2));
console.log('Fixed - saved', validTracks.length, 'tracks');
