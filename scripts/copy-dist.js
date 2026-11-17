const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../apps/web/dist');
const dest = path.resolve(__dirname, '../dist');

try {
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
    console.log('[copy-dist] Successfully synced apps/web/dist to root dist/ for Vercel monorepo deployment.');
  } else {
    console.log('[copy-dist] Note: apps/web/dist not found yet, skipping copy.');
  }
} catch (err) {
  console.error('[copy-dist] Error copying dist:', err);
}
