/**
 * Prepares build output for GitHub Pages deployment.
 * 1. Creates 404.html fallback for SPA routing on GitHub Pages
 * 2. Creates .nojekyll file so Jekyll does not ignore assets
 * 3. Copies compiled dist files to docs/ folder so user can deploy via "Deploy from branch -> /docs"
 */
const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');
const docsDir = path.resolve(__dirname, '..', 'docs');

if (!fs.existsSync(distDir)) {
  console.error('[prepare-pages] dist directory does not exist! Run vite build first.');
  process.exit(1);
}

// 1. Copy index.html to 404.html in dist
const indexHtmlPath = path.join(distDir, 'index.html');
const notFoundHtmlPath = path.join(distDir, '404.html');
if (fs.existsSync(indexHtmlPath)) {
  fs.copyFileSync(indexHtmlPath, notFoundHtmlPath);
  console.log('[prepare-pages] Created dist/404.html for SPA routing');
}

// 2. Create .nojekyll in dist
const noJekyllPath = path.join(distDir, '.nojekyll');
fs.writeFileSync(noJekyllPath, '');
console.log('[prepare-pages] Created dist/.nojekyll');

// 3. Mirror dist into docs folder for GitHub Pages "docs" branch deployment option
try {
  if (fs.existsSync(docsDir)) {
    fs.rmSync(docsDir, { recursive: true, force: true });
  }
  fs.cpSync(distDir, docsDir, { recursive: true });
  console.log('[prepare-pages] Successfully synchronized docs/ directory for GitHub Pages');
} catch (err) {
  console.warn('[prepare-pages] Note: Could not copy to docs folder:', err.message);
}
