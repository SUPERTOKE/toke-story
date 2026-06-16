import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'public', 'index.source.html');
const htmlPath = fs.existsSync(sourcePath)
  ? sourcePath
  : path.join(root, 'public', 'index.html');
const manifestPath = path.join(__dirname, 'asset-manifest.json');

const html = fs.readFileSync(htmlPath, 'utf8');

function toAbsolute(url) {
  if (!url || url.startsWith('data:')) return null;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('http')) return url;
  return null;
}

function imageKey(url) {
  const abs = toAbsolute(url);
  if (!abs) return null;
  const match = abs.match(
    /images\.squarespace-cdn\.com\/content\/v1\/[^/]+\/([^/]+)\/([^?]+)/
  );
  if (!match) return null;
  return `${match[1]}/${decodeURIComponent(match[2])}`;
}

function slugify(name) {
  return name
    .replace(/\+/g, '-')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function extFromName(name) {
  const dot = name.lastIndexOf('.');
  if (dot > 0) return name.slice(dot).toLowerCase();
  return '';
}

function localFileName(filename) {
  const ext = extFromName(filename);
  const stem = ext ? filename.slice(0, -ext.length) : filename;
  const base = slugify(stem);
  return ext ? `${base}${ext}` : `${base}.png`;
}

function buildImageUrl(id, filename) {
  const segment = filename.includes(' ')
    ? encodeURIComponent(filename)
    : filename.replace(/ /g, '+');
  return `https://images.squarespace-cdn.com/content/v1/685577e303bbde70a27b41f7/${id}/${segment}`;
}

const imageKeys = new Map();

for (const match of html.matchAll(
  /https?:\/\/images\.squarespace-cdn\.com\/content\/v1\/[^"'\s)]+/g
)) {
  const key = imageKey(match[0]);
  if (!key) continue;
  const [, id, filename] = key.match(/^([^/]+)\/(.+)$/) ?? [];
  const downloadUrl = `${buildImageUrl(id, filename)}?format=2500w`;
  const localName = localFileName(filename);
  if (!imageKeys.has(key)) {
    imageKeys.set(key, { key, downloadUrl, localName, variants: [] });
  }
}

for (const match of html.matchAll(
  /\/\/images\.squarespace-cdn\.com\/content\/v1\/[^"'\s)]+/g
)) {
  const key = imageKey(`https:${match[0]}`);
  if (!key) continue;
  const [, id, filename] = key.match(/^([^/]+)\/(.+)$/) ?? [];
  const downloadUrl = `${buildImageUrl(id, filename)}?format=2500w`;
  const localName = localFileName(filename);
  if (!imageKeys.has(key)) {
    imageKeys.set(key, { key, downloadUrl, localName, variants: [] });
  }
}

const cssFromHtml = [
  ...html.matchAll(/href="(https:\/\/static1\.squarespace\.com[^"]+\.css[^"]*)"/g),
  ...html.matchAll(/href="(https:\/\/definitions\.sqspcdn\.com[^"]+\.css)"/g),
];

const cssFiles = [];
const seenCss = new Set();

for (const [, url] of cssFromHtml) {
  if (seenCss.has(url)) continue;
  seenCss.add(url);
  let localName;
  if (url.includes('versioned-site-css') && url.includes('site.css')) {
    localName = 'site.css';
  } else if (url.includes('/vta/') && url.endsWith('static.css')) {
    localName = 'template.css';
  } else if (url.includes('website.components.html')) {
    localName = 'components-html.css';
  } else if (url.includes('website.components.quote')) {
    localName = 'components-quote.css';
  } else if (url.includes('website.components.imageFluid')) {
    localName = 'components-image-fluid.css';
  } else {
    localName = `component-${cssFiles.length}.css`;
  }
  cssFiles.push({ url, localName });
}

const faviconMatch = html.match(
  /href="(https:\/\/images\.squarespace-cdn\.com[^"]+favicon\.ico[^"]*)"/
);
const favicon = faviconMatch
  ? {
      url: faviconMatch[1].replace(/\?format=\d+w/, ''),
      localName: 'favicon.ico',
    }
  : null;

// Fix keys where filename used + instead of space in decode
for (const img of imageKeys.values()) {
  const decoded = img.key.split('/').slice(1).join('/').replace(/\+/g, ' ');
  img.localName = localFileName(decoded);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  images: [...imageKeys.values()].sort((a, b) => a.localName.localeCompare(b.localName)),
  css: cssFiles,
  favicon,
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(
  `Manifest: ${manifest.images.length} images, ${manifest.css.length} stylesheets` +
    (favicon ? ', favicon' : '')
);
