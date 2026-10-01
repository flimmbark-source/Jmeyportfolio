/**
 * Generates WebP derivatives for the large raster assets the portfolio ships.
 *
 * The sources in `public/images/` are full-resolution screenshots and museum
 * scans — the project artwork is a 1222px PNG rendered inside a 184px circle,
 * and the backdrops are 2000px JPEGs sitting behind a cream scrim at 0.675
 * opacity. Serving the originals made images ~100% of the page weight
 * (916 KiB on a phone, 2.4 MB on a desktop) for pixels nobody can see.
 *
 * Output goes to `public/images/derived/` (gitignored) and is rebuilt by the
 * `predev` / `prebuild` hooks, so the derivatives can never drift from their
 * sources. Anything already up to date is skipped, which keeps `npm run dev`
 * fast after the first run.
 */
import { mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, parse, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const imagesDir = join(repoRoot, 'public', 'images');
const derivedDir = join(imagesDir, 'derived');
const backgroundsDir = join(imagesDir, 'work-backgrounds');

let sharp;
try {
  ({ default: sharp } = await import('sharp'));
} catch {
  // sharp is an optional platform binary. A missing install must not break the
  // build: the CSS keeps the original files as the declared fallback.
  console.warn('[optimize-images] sharp unavailable — skipping derivative generation.');
  process.exit(0);
}

/**
 * Project artwork. Rendered as a circular crop at most 354px wide (the
 * single-column workshop card on a phone) and 184px on desktop, so 768px
 * covers a 2x display with room to spare.
 */
const ARTWORK_WIDTH = 768;
const artwork = [
  'rotogoscreen.png',
  'VenueRivalsscreen .png',
  'letterriverscreen.png',
  'Thelastreadingscreen.png',
  'oiz8uf.png',
];

/**
 * Backdrop paintings. Full-bleed `cover`, but behind a scrim and a saturation
 * filter, so they tolerate aggressive compression. Two widths let the phone
 * skip the desktop-sized file entirely.
 */
const BACKDROP_WIDTHS = [900, 1600];

/**
 * Gameplay previews shown on a focused project. The sources are phone screen
 * recordings — only ~350px wide, but encoded at about 1 Mbit/s, and with the
 * moov atom at the end of the file, so a browser had to download all 2.7 MB
 * before it could show a single frame. Re-encoding at CRF 28 holds SSIM above
 * 0.99 against the source while cutting roughly 80% of the bytes, and
 * `+faststart` lets playback begin immediately.
 */
const VIDEO_CRF = 28;

/**
 * Animated sources. The Café gameplay loop ships as a 2 MB GIF; animated WebP
 * keeps all 45 frames at roughly a seventh of the size, and every browser that
 * can render the rest of this site supports it.
 */
const ANIMATED_WIDTH = 600;
const animated = ['sRdmVj.gif'];

/** Derived names are slugified so a space in a source filename (there is one)
 *  never has to be URL-escaped at every CSS reference. */
function slug(name) {
  return parse(name).name.trim().replace(/[^a-zA-Z0-9._-]+/g, '-');
}

function isStale(source, target) {
  if (!existsSync(target)) return true;
  return statSync(source).mtimeMs > statSync(target).mtimeMs;
}

async function emit(source, target, transform) {
  if (!isStale(source, target)) return { skipped: true };
  mkdirSync(dirname(target), { recursive: true });
  // `animated` is required for the GIF, or sharp would keep only frame one.
  await transform(sharp(source, { animated: /\.(gif|webp)$/i.test(source) })).toFile(target);
  const from = statSync(source).size;
  const to = statSync(target).size;
  return { from, to };
}

const results = [];

for (const name of artwork) {
  const source = join(imagesDir, name);
  if (!existsSync(source)) {
    console.warn(`[optimize-images] missing source: ${name}`);
    continue;
  }
  const target = join(derivedDir, `${slug(name)}-${ARTWORK_WIDTH}.webp`);
  results.push([name, await emit(source, target, (img) =>
    img.resize({ width: ARTWORK_WIDTH, withoutEnlargement: true }).webp({ quality: 78, effort: 6 })
  )]);
}

for (const name of animated) {
  const source = join(imagesDir, name);
  if (!existsSync(source)) {
    console.warn(`[optimize-images] missing source: ${name}`);
    continue;
  }
  const target = join(derivedDir, `${slug(name)}-${ANIMATED_WIDTH}.webp`);
  results.push([name, await emit(source, target, (img) =>
    img.resize({ width: ANIMATED_WIDTH, withoutEnlargement: true }).webp({ quality: 70, effort: 4 })
  )]);
}

if (existsSync(backgroundsDir)) {
  for (const name of readdirSync(backgroundsDir).filter((f) => /\.(jpe?g|png)$/i.test(f))) {
    const source = join(backgroundsDir, name);
    for (const width of BACKDROP_WIDTHS) {
      const target = join(derivedDir, 'work-backgrounds', `${slug(name)}-${width}.webp`);
      results.push([`${name} @${width}`, await emit(source, target, (img) =>
        img.resize({ width, withoutEnlargement: true }).webp({ quality: 72, effort: 6 })
      )]);
    }
  }
}

// Videos: same codec, container and dimensions — just sane rate control, no
// audio track (every preview is muted) and a front-loaded index.
const ffmpegAvailable = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
if (!ffmpegAvailable) {
  console.warn('[optimize-images] ffmpeg unavailable — skipping video derivatives.');
} else {
  for (const name of readdirSync(imagesDir).filter((f) => /\.mp4$/i.test(f))) {
    const source = join(imagesDir, name);
    const target = join(derivedDir, `${slug(name)}.mp4`);
    if (!isStale(source, target)) {
      results.push([name, { skipped: true }]);
      continue;
    }
    mkdirSync(dirname(target), { recursive: true });
    const run = spawnSync('ffmpeg', [
      '-v', 'error', '-y', '-i', source,
      '-an',
      '-c:v', 'libx264', '-crf', String(VIDEO_CRF), '-preset', 'slow',
      '-pix_fmt', 'yuv420p', '-profile:v', 'high',
      '-movflags', '+faststart',
      target,
    ], { stdio: 'inherit' });
    if (run.status !== 0) {
      console.warn(`[optimize-images] ffmpeg failed for ${name} — leaving the source in place.`);
      continue;
    }
    results.push([name, { from: statSync(source).size, to: statSync(target).size }]);
  }
}

const written = results.filter(([, r]) => !r.skipped);
if (!written.length) {
  console.log(`[optimize-images] ${results.length} derivative(s) already up to date.`);
} else {
  const from = written.reduce((sum, [, r]) => sum + r.from, 0);
  const to = written.reduce((sum, [, r]) => sum + r.to, 0);
  const kib = (n) => `${(n / 1024).toFixed(0)} KiB`;
  console.log(
    `[optimize-images] wrote ${written.length} derivative(s): ` +
    `${kib(from)} -> ${kib(to)} (${(100 - (to / from) * 100).toFixed(0)}% smaller).`
  );
}
