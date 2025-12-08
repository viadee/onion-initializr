#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

// Create target directory
const targetDir = path.join(
  __dirname,
  'dist',
  'node_modules',
  '@onion-initializr',
  'lib'
);
fs.mkdirSync(targetDir, { recursive: true });

// Copy lib dist to target
const sourceDir = path.join(__dirname, '..', 'lib', 'dist');

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src);

    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('Copying lib files...');
copyRecursive(sourceDir, targetDir);

// Fix package.json exports
require('./fix-lib-package');
console.log('Lib bundled successfully');
