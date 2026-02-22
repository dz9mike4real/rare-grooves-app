#!/usr/bin/env node

/**
 * Download full MP3s from YouTube for tracks in tracks-local.json
 * Uses yt-dlp (must be installed: brew install yt-dlp)
 * 
 * Run with: node scripts/download-youtube.js [count]
 * Example: node scripts/download-youtube.js 10 (download first 10)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, '../public/audio');
const METADATA_FILE = path.join(__dirname, '../lib/tracks-local.json');

const tracks = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
console.log(`Total tracks: ${tracks.length}`);

// Get existing full MP3s (those starting with full-)
const existingFiles = new Set(fs.readdirSync(AUDIO_DIR).filter(f => f.startsWith('full-') && f.endsWith('.mp3')));
console.log(`Existing full MP3s: ${existingFiles.size}`);

// Filter to tracks without full MP3s - download all if none exist yet
const tracksNeedingDownload = tracks;

console.log(`Tracks to process: ${tracksNeedingDownload.length}`);

const maxDownloads = process.argv[2] ? parseInt(process.argv[2]) : 3;
const tracksToDownload = tracksNeedingDownload.slice(0, maxDownloads);

console.log(`\nWill download ${tracksToDownload.length} tracks...\n`);

let downloaded = 0;
let failed = 0;

async function downloadTrack(track, index) {
  const searchQuery = `${track.artist} ${track.title} audio`;
  const outputFile = path.join(AUDIO_DIR, `full-${index + 1}.mp3`);
  
  console.log(`[${index + 1}/${tracksToDownload.length}] Searching: ${track.artist} - ${track.title}`);
  
  try {
    // Search and download best audio
    const cmd = `yt-dlp --extract-audio --audio-format mp3 --audio-quality 0 \
      --output "${outputFile}" \
      --search "${searchQuery}" \
      --default-search "ytsearch1" \
      --no-download \
      --skip-download \
      --get-url 2>/dev/null || echo "NO_RESULT"`;
    
    // First, let's just do a simple download
    // Try with --no-warnings and --quiet to reduce output
    const dlCmd = `yt-dlp \
      --extract-audio \
      --audio-format mp3 \
      --audio-quality 0 \
      --output "${outputFile}" \
      --yes-playlist \
      --no-warnings \
      --user-agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
      "ytsearch1:${searchQuery}" 2>&1`;
    
    execSync(dlCmd, { stdio: 'pipe' });
    
    // Check if file was created
    if (fs.existsSync(outputFile)) {
      const stats = fs.statSync(outputFile);
      console.log(`  ✓ Downloaded: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
      // Update the metadata
      track.localFilename = `full-${index + 1}.mp3`;
      downloaded++;
    } else {
      console.log(`  ✗ Failed to download`);
      failed++;
    }
    
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    failed++;
  }
  
  // Rate limit to avoid issues
  await new Promise(r => setTimeout(r, 2000));
}

async function main() {
  for (let i = 0; i < tracksToDownload.length; i++) {
    await downloadTrack(tracksToDownload[i], i);
  }
  
  console.log(`\n=== Results ===`);
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Failed: ${failed}`);
  
  // Save updated metadata
  fs.writeFileSync(METADATA_FILE, JSON.stringify(tracks, null, 2));
}

main().catch(console.error);
