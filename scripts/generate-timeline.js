#!/usr/bin/env node
/* eslint-disable */
/**
 * Generate a timeline of files modified today
 * 
 * This script scans the repository for files that were modified today
 * and generates a chronological timeline showing:
 * - File path
 * - Modification time
 * - File size
 * - Git status (if applicable)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get today's date at midnight
function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// Format date to human-readable string
function formatTime(date) {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

// Format file size
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Get git status for a file
function getGitStatus(filePath) {
  try {
    const status = execSync(`git status --porcelain "${filePath}"`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    
    if (!status) return 'committed';
    const code = status.substring(0, 2).trim();
    if (code === 'M') return 'modified';
    if (code === 'A') return 'added';
    if (code === 'D') return 'deleted';
    if (code === '??') return 'untracked';
    if (code === 'R') return 'renamed';
    return status;
  } catch (err) {
    return 'unknown';
  }
}

// Recursively scan directory for files modified today
function scanDirectory(dir, todayStart, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(process.cwd(), fullPath);
    
    // Skip certain directories
    if (entry.isDirectory()) {
      if (['.git', 'node_modules', '.yarn', 'dist', 'build', 'coverage'].includes(entry.name)) {
        continue;
      }
      scanDirectory(fullPath, todayStart, results);
    } else {
      try {
        const stats = fs.statSync(fullPath);
        const mtime = new Date(stats.mtime);
        
        // Check if file was modified today
        if (mtime >= todayStart) {
          results.push({
            path: relativePath,
            mtime: mtime,
            size: stats.size,
            gitStatus: getGitStatus(fullPath)
          });
        }
      } catch (err) {
        // Skip files we can't read
      }
    }
  }
  
  return results;
}

// Main function
function generateTimeline() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           FILE MODIFICATION TIMELINE FOR TODAY            ');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const todayStart = getTodayStart();
  const today = new Date();
  console.log(`Scanning for files modified between:`);
  console.log(`  Start: ${formatTime(todayStart)}`);
  console.log(`  Now:   ${formatTime(today)}\n`);
  
  const rootDir = process.cwd();
  console.log(`Scanning directory: ${rootDir}\n`);
  
  const files = scanDirectory(rootDir, todayStart);
  
  if (files.length === 0) {
    console.log('No files were modified today.');
    return;
  }
  
  // Sort by modification time
  files.sort((a, b) => a.mtime - b.mtime);
  
  console.log(`Found ${files.length} file(s) modified today:\n`);
  console.log('───────────────────────────────────────────────────────────\n');
  
  files.forEach((file, index) => {
    console.log(`${index + 1}. ${file.path}`);
    console.log(`   Time:   ${formatTime(file.mtime)}`);
    console.log(`   Size:   ${formatSize(file.size)}`);
    console.log(`   Status: ${file.gitStatus}`);
    console.log('');
  });
  
  console.log('───────────────────────────────────────────────────────────');
  console.log(`\nTotal: ${files.length} file(s)\n`);
  
  // Also check git commits from today
  try {
    const todayStr = today.toISOString().split('T')[0];
    const commits = execSync(
      `git log --all --since="${todayStr} 00:00:00" --until="${todayStr} 23:59:59" --pretty=format:"%H|%ai|%an|%s" --name-status`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();
    
    if (commits) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('                  GIT COMMITS TODAY                        ');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      const lines = commits.split('\n');
      let currentCommit = null;
      
      for (const line of lines) {
        if (line.includes('|')) {
          const [hash, timestamp, author, message] = line.split('|');
          currentCommit = { hash: hash.substring(0, 8), timestamp, author, message, files: [] };
          console.log(`Commit: ${currentCommit.hash}`);
          console.log(`Author: ${currentCommit.author}`);
          console.log(`Date:   ${currentCommit.timestamp}`);
          console.log(`Message: ${currentCommit.message}`);
          console.log('');
        } else if (line.trim() && currentCommit) {
          const parts = line.trim().split('\t');
          if (parts.length >= 2) {
            console.log(`  ${parts[0]} ${parts[1]}`);
          }
        }
      }
      console.log('');
    }
  } catch (err) {
    // No commits today
  }
}

// Run the timeline generator
try {
  generateTimeline();
} catch (err) {
  console.error('Error generating timeline:', err.message);
  process.exit(1);
}
