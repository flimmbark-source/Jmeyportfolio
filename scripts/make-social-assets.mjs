// Generates the favicon, apple-touch icon and default social card.
//
// Run with `npm run make:social` after changing the palette or the card copy.
// The output is committed, so a build never depends on this script.
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const PAPER = '#f4f2ec';
const INK = '#1a1917';
const MUTED = '#5c574f';
const ACCENT = '#8c3a1f';

// The card is built on one of the site's own painting backdrops rather than
// decorative shapes, so a shared link looks like the site it points at.
const PAINTING = 'public/images/work-backgrounds/landers-peak.jpg';

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${INK}"/>
  <text x="32" y="45" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="31" font-weight="700" fill="${PAPER}">JM</text>
</svg>`;

// librsvg resolves system fonts only, and the site's faces are self-hosted
// woff2, so the card is set in a serif/sans stack that is present here and
// echoes the Fraunces/Atkinson pairing rather than pretending to be it.
const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="wash" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${PAPER}" stop-opacity="0.97"/>
      <stop offset="52%"  stop-color="${PAPER}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${PAPER}" stop-opacity="0.38"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#wash)"/>
  <rect x="0" y="0" width="1200" height="7" fill="${INK}"/>
  <text x="84" y="196" font-family="Georgia, serif" font-size="25"
        font-weight="700" letter-spacing="3.4" fill="${ACCENT}">JACOB MEYERKOPF</text>
  <text x="84" y="296" font-family="Georgia, 'Times New Roman', serif"
        font-size="67" font-weight="700" fill="${INK}">Interactive Researcher</text>
  <text x="84" y="376" font-family="Georgia, 'Times New Roman', serif"
        font-size="67" font-weight="700" fill="${INK}">&amp; Product Designer</text>
  <rect x="84" y="424" width="78" height="3" fill="${ACCENT}"/>
  <text x="84" y="488" font-family="Helvetica, Arial, sans-serif" font-size="27"
        fill="${MUTED}">Interactive systems for overstimulation,</text>
  <text x="84" y="526" font-family="Helvetica, Arial, sans-serif" font-size="27"
        fill="${MUTED}">learning and complex workflows.</text>
</svg>`;

await writeFile('public/favicon.svg', favicon);
await sharp(Buffer.from(favicon)).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(PAINTING)
  .resize(1200, 630, { fit: 'cover', position: 'attention' })
  .composite([{ input: Buffer.from(overlay) }])
  .png()
  .toFile('public/og-default.png');

console.log('favicon.svg, apple-touch-icon.png, og-default.png written to public/');
