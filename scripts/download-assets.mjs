import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const manifestPath = path.join(__dirname, 'asset-manifest.json');
const imagesDir = path.join(root, 'public', 'images');
const cssDir = path.join(root, 'public', 'css');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

fs.mkdirSync(imagesDir, { recursive: true });
fs.mkdirSync(cssDir, { recursive: true });

async function download(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    return 'skipped';
  }
  let lastError;
  for (const tryUrl of [url, url.replace('%2B', '+'), url.replace(/\?format=\d+w/, '')]) {
    try {
      const res = await fetch(tryUrl, {
        headers: { 'User-Agent': 'toke-story-mirror/1.0' },
        redirect: 'follow',
      });
      if (!res.ok) {
        lastError = new Error(`${res.status} ${tryUrl}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buf);
      return 'downloaded';
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error(`fetch failed ${url}`);
}

let ok = 0;
let skip = 0;
let fail = 0;

for (const img of manifest.images) {
  const dest = path.join(imagesDir, img.localName);
  try {
    const status = await download(img.downloadUrl, dest);
    if (status === 'skipped') skip++;
    else ok++;
    process.stdout.write('.');
  } catch (err) {
    fail++;
    console.error(`\nFailed ${img.localName}: ${err.message}`);
  }
}

for (const sheet of manifest.css) {
  const dest = path.join(cssDir, sheet.localName);
  try {
    const status = await download(sheet.url, dest);
    if (status === 'skipped') skip++;
    else ok++;
    process.stdout.write('c');
  } catch (err) {
    fail++;
    console.error(`\nFailed CSS ${sheet.localName}: ${err.message}`);
  }
}

if (manifest.favicon) {
  const dest = path.join(root, 'public', manifest.favicon.localName);
  try {
    await download(manifest.favicon.url, dest);
    process.stdout.write('f');
  } catch (err) {
    fail++;
    console.error(`\nFailed favicon: ${err.message}`);
  }
}

console.log(`\nDone: ${ok} downloaded, ${skip} skipped, ${fail} failed`);

if (fail > 0) process.exit(1);
