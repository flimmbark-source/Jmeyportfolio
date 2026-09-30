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
   * `background-position` for the image. The backdrop is cropped to `cover`,
   * so this decides which part of the painting survives on narrow screens.
   */
  position: string;
}

export const workBackgrounds: WorkBackground[] = [
  { src: '/images/work-backgrounds/bronze-lamp-boat.jpg', position: 'center' },
  { src: '/images/work-backgrounds/fur-traders.jpg', position: 'center 60%' },
  { src: '/images/work-backgrounds/at-the-seaside.jpg', position: 'center 65%' },
  { src: '/images/work-backgrounds/landers-peak.jpg', position: 'center 55%' },
  { src: '/images/work-backgrounds/gulf-stream.jpg', position: 'center 60%' },
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
