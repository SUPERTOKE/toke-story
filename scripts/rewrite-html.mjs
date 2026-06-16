import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'public', 'index.source.html');
const htmlPath = path.join(root, 'public', 'index.html');
const manifestPath = path.join(__dirname, 'asset-manifest.json');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
let html = fs.readFileSync(
  fs.existsSync(sourcePath) ? sourcePath : htmlPath,
  'utf8'
);

const urlToLocal = new Map();

for (const img of manifest.images) {
  const basePatterns = [
    img.downloadUrl.replace('?format=2500w', ''),
    img.downloadUrl,
  ];
  const keyParts = img.key.split('/');
  const filename = keyParts.slice(1).join('/');
  const id = keyParts[0];

  const patterns = [
    `https://images.squarespace-cdn.com/content/v1/685577e303bbde70a27b41f7/${id}/${encodeURIComponent(filename)}`,
    `https://images.squarespace-cdn.com/content/v1/685577e303bbde70a27b41f7/${id}/${filename.replace(/ /g, '+')}`,
    `https://images.squarespace-cdn.com/content/v1/685577e303bbde70a27b41f7/${id}/${filename}`,
    `//images.squarespace-cdn.com/content/v1/685577e303bbde70a27b41f7/${id}/${encodeURIComponent(filename)}`,
    `//images.squarespace-cdn.com/content/v1/685577e303bbde70a27b41f7/${id}/${filename.replace(/ /g, '+')}`,
    `//images.squarespace-cdn.com/content/v1/685577e303bbde70a27b41f7/${id}/${filename}`,
  ];

  for (const p of patterns) {
    urlToLocal.set(p, `/images/${img.localName}`);
  }
}

const cssMap = Object.fromEntries(
  manifest.css.map((c) => [c.url, `/css/${c.localName}`])
);

function replaceImageUrls(text) {
  let out = text;
  const entries = [...urlToLocal.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of entries) {
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(escaped + '(\\?[^"\'\\s]*)?', 'g'), to);
  }
  return out;
}

html = replaceImageUrls(html);

for (const [from, to] of Object.entries(cssMap)) {
  html = html.split(from).join(to);
}

if (manifest.favicon) {
  html = html.replace(
    /href="https:\/\/images\.squarespace-cdn\.com[^"]+favicon\.ico[^"]*"/g,
    'href="/favicon.ico"'
  );
}

html = html.replace(
  /<link rel="preconnect" href="https:\/\/images\.squarespace-cdn\.com">/,
  ''
);

html = html.replace(
  /<link rel="canonical" href="[^"]*"/,
  '<link rel="canonical" href="https://story.mctoken.xyz/"'
);
html = html.replace(
  /content="https:\/\/www\.story\.mctoken\.xyz"/g,
  'content="https://story.mctoken.xyz/"'
);
html = html.replace(
  /content="http:\/\/static1\.squarespace\.com\/static\/685577e303bbde70a27b41f7\/t\/685579cd3cb58d57ac82534e\/[^"]+"/g,
  'content="https://story.mctoken.xyz/images/pfp.png"'
);

html = html.replace(/id="floatingCart"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, '');
html = html.replace(/<div id="floatingCart"[\s\S]*?<\/div>\s*/, '');

html = html.replace(
  /<a href="\/cart"[\s\S]*?<\/a>/g,
  ''
);

const scriptsToRemove = [
  'user-account-core',
  'squarespace-forms',
  'form-rendering-utils',
  'announcement-bar',
  'popup-overlay',
  'performance-f7cbe26473d968a0',
  'visitor-site-error-reporter',
  'extract-css-runtime',
  'extract-css-moment-js-vendor',
  'cldr-resource-pack',
  'common-vendors-stable',
  'common-vendors-cd42d853',
  'common-aacadd118573f5e5',
];

for (const fragment of scriptsToRemove) {
  const re = new RegExp(
    `<script[^>]*src="[^"]*${fragment}[^"]*"[^>]*>\\s*</script>`,
    'gi'
  );
  html = html.replace(re, '');
  const re2 = new RegExp(
    `<script>\\(function\\(rollups, name\\)[\\s\\S]*?${fragment}[\\s\\S]*?</script>`,
    'gi'
  );
  html = html.replace(re2, '');
}

html = html.replace(
  /<link rel="stylesheet"[^>]*user-account-core[^>]*>/gi,
  ''
);

html = html.replace(
  /<script data-name="static-context">[\s\S]*?<\/script>/,
  '<script data-name="static-context">Static = window.Static || {};</script>'
);

html = html.replace(
  /<script type="text\/javascript">SQUARESPACE_ROLLUPS[\s\S]*?<\/script>/,
  ''
);

const localCssLinks = [
  ...new Set(manifest.css.map((c) => `/css/${c.localName}`)),
]
  .map((href) => `<link rel="stylesheet" href="${href}">`)
  .join('\n    ');

if (!html.includes('/css/site.css')) {
  html = html.replace('</head>', `    ${localCssLinks}\n  </head>`);
}

const headerFix = `    <link rel="stylesheet" href="/css/header-fix.css">
    <script src="/js/header-fix.js" defer></script>`;

html = html.replace(/\s*<link rel="stylesheet" href="\/css\/fixes\.css">\s*/g, '\n');
html = html.replace(/\s*<link rel="stylesheet" href="\/css\/header-fix\.css">[\s\S]*?<\/script>\s*/g, '\n');

if (!html.includes('/css/header-fix.css')) {
  html = html.replace('</head>', `${headerFix}\n  </head>`);
}

html = html.replace(
  /<img elementtiming="nbf-header-logo-desktop" src="\/images\/pfp\.png"/g,
  '<img elementtiming="nbf-header-logo-desktop" src="/images/pfp.webp"'
);

fs.writeFileSync(htmlPath, html);
console.log('Rewrote public/index.html');
