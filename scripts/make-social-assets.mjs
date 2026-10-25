// Generates the favicon, apple-touch icon and default social card.
//
// Run with `npm run make:social` after changing the palette or the card copy.
// The output is committed, so a build never depends on this script.
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const BG = '#f7f6f2';
const INK = '#242424';
const MUTED = '#6f6c67';

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${INK}"/>
  <text x="32" y="44" text-anchor="middle"
        font-family="Inter, Helvetica, Arial, sans-serif"
        font-size="30" font-weight="700" fill="${BG}">JM</text>
</svg>`;

// Inter is not installed system-wide here, so the card is drawn with shapes and
// the generic sans stack rather than depending on a font file resolving.
const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BG}"/>
  <circle cx="1010" cy="150" r="190" fill="#e9e6dd"/>
  <circle cx="1120" cy="470" r="120" fill="#efece4"/>
  <circle cx="905" cy="405" r="74" fill="#e4e0d5"/>
  <rect x="0" y="0" width="1200" height="8" fill="${INK}"/>
  <text x="80" y="208" font-family="Helvetica, Arial, sans-serif"
        font-size="26" font-weight="600" letter-spacing="4" fill="${MUTED}">JACOB MEYERKOPF</text>
  <text x="80" y="300" font-family="Helvetica, Arial, sans-serif"
        font-size="62" font-weight="700" fill="${INK}">Interactive Researcher</text>
  <text x="80" y="374" font-family="Helvetica, Arial, sans-serif"
        font-size="62" font-weight="700" fill="${INK}">&amp; Product Designer</text>
  <rect x="80" y="424" width="88" height="4" fill="${INK}"/>
  <text x="80" y="492" font-family="Helvetica, Arial, sans-serif"
        font-size="29" fill="${MUTED}">Interactive systems for overstimulation,</text>
  <text x="80" y="534" font-family="Helvetica, Arial, sans-serif"
        font-size="29" fill="${MUTED}">learning and complex workflows.</text>
</svg>`;

await mkdir('public', { recursive: true });
await writeFile('public/favicon.svg', favicon);
await sharp(Buffer.from(favicon)).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(card)).png().toFile('public/og-default.png');
console.log('favicon.svg, apple-touch-icon.png, og-default.png written to public/');
