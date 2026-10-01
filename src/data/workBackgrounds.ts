/**
 * Candidate backdrops for the work page (the portfolio overview).
 *
 * One entry is picked at random every time the overview is opened — on first
 * load, and again whenever the visitor comes back from a project or the
 * playground. Drop a new file in `public/images/work-backgrounds/` and add a
 * line below to put it in the rotation; nothing else needs to change.
 */
export interface WorkBackground {
  /** Path under `public/`, served from the site root. */
  src: string;
  /**
   * `object-position` for the image. The backdrop is cropped to `cover`,
   * so this decides which part of the painting survives on narrow screens.
   */
  position: string;
}

/** Widths produced by `scripts/optimize-images.mjs` for every backdrop. */
const DERIVED_WIDTHS = [900, 1600] as const;

/**
 * `srcset` over the generated WebP derivatives, so a phone fetches the 900px
 * file (~35 KiB) instead of the 2000px source JPEG (~400 KiB). The backdrop is
 * full-bleed, which is why `sizes` is a flat `100vw`.
 */
export function workBackgroundSrcSet(background: WorkBackground): string {
  const name = background.src.split('/').pop()!.replace(/\.[^.]+$/, '');
  return DERIVED_WIDTHS
    .map((width) => `/images/derived/work-backgrounds/${name}-${width}.webp ${width}w`)
    .join(', ');
}

export const workBackgrounds: WorkBackground[] = [
  { src: '/images/work-backgrounds/bronze-lamp-boat.jpg', position: 'center' },
  { src: '/images/work-backgrounds/fur-traders.jpg', position: 'center 60%' },
  { src: '/images/work-backgrounds/at-the-seaside.jpg', position: 'center 65%' },
  { src: '/images/work-backgrounds/landers-peak.jpg', position: 'center 55%' },
  { src: '/images/work-backgrounds/gulf-stream.jpg', position: 'center 60%' },
  // Portrait and square sources: a wide viewport crops these hard, so the
  // position keeps the subject in frame rather than a band of empty ground.
  // painted-cabinet.jpg is cropped to the painted panel — the full cabinet
  // shot left its studio backdrop showing as hard vertical seams.
  { src: '/images/work-backgrounds/painted-cabinet.jpg', position: 'center' },
  { src: '/images/work-backgrounds/silver-coffee-pot.jpg', position: 'center 45%' },
  { src: '/images/work-backgrounds/rococo-room.jpg', position: 'center 40%' },
  { src: '/images/work-backgrounds/terracotta-allegory.jpg', position: 'center 45%' },
];

/** Index of the last pick, so the same backdrop never shows twice in a row. */
let lastPickedIndex = -1;

export function pickWorkBackground(): WorkBackground | null {
  if (workBackgrounds.length === 0) return null;
  if (workBackgrounds.length === 1) return workBackgrounds[0];

  let index = lastPickedIndex;
  while (index === lastPickedIndex) {
    index = Math.floor(Math.random() * workBackgrounds.length);
  }
  lastPickedIndex = index;
  return workBackgrounds[index];
}
