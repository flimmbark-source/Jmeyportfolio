import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// The threshold homepage. The screen is three columns the visitor never sees
// as columns: the statement in the middle (neutral, nothing happens there),
// UX to the left and Play to the right. Hovering or focusing a side lights its
// column and shades its outer edge. Play continues the playground's arrival
// in place; UX fades the page out and goes to /ux.
//
// The columns' look lives in portfolio-threshold.css. The middle column is
// not an element at all: the gate is pointer-transparent there, so the
// statement underneath is exactly what it is on the playground.

// The doors fade in once the statement has had the screen to itself
// (RelationalPortfolio INTRO.statement is 1.82s).
const DOOR_DELAY = 1.6;
const DOOR_FADE = 1.1;
const LEAVE_FADE = 0.5;

export default function ThresholdGate({ reducedMotion, onPlay, uxHref = '/ux' }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // UX is a full page load; fetch it while the visitor is deciding.
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = uxHref;
    document.head.appendChild(link);
    return () => link.remove();
  }, [uxHref]);

  const goUX = () => {
    if (reducedMotion) {
      window.location.assign(uxHref);
      return;
    }
    setLeaving(true);
  };

  return (
    <motion.div
      className="pv2-threshold"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: reducedMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] } }}
      transition={reducedMotion
        ? { duration: 0 }
        : { duration: DOOR_FADE, delay: DOOR_DELAY, ease: [0.22, 1, 0.3, 1] }}
    >
      <button
        type="button"
        className="pv2-threshold__door pv2-threshold__door--ux"
        aria-label="UX work: professional case studies"
        onClick={goUX}
      >
        <span className="pv2-threshold__label">
          <span className="pv2-threshold__eyebrow">Professional work</span>
          <span className="pv2-threshold__title">
            <span aria-hidden="true">←</span> UX Work
          </span>
        </span>
      </button>

      <button
        type="button"
        className="pv2-threshold__door pv2-threshold__door--play"
        aria-label="Play: games and interactive work"
        onClick={onPlay}
      >
        <span className="pv2-threshold__label">
          <span className="pv2-threshold__eyebrow">Playground</span>
          <span className="pv2-threshold__title">
            Play <span aria-hidden="true">→</span>
          </span>
        </span>
      </button>

      {leaving && (
        <motion.div
          className="pv2-threshold__veil"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: LEAVE_FADE, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={() => window.location.assign(uxHref)}
        />
      )}
    </motion.div>
  );
}
