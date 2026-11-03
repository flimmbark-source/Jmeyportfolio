import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// The threshold homepage. The screen is three columns the visitor never sees
// as columns: the statement in the middle (neutral, nothing happens there),
// UX to the left and Play to the right. Each door has one job — choosing a
// world — so each is a single click target. Hovering or focusing a door
// lights its column, shades its outer edge and shows a glimpse of where it
// leads; it does not offer a menu of projects.
//
//   UX   → a fan of real interface screens from the work on /ux, sliding in
//          from the left edge. Clicking fades the page out and goes to /ux.
//   Play → the playground's own spheres, ghosted in where they float
//          (RelationalPortfolio, via onPeek). Clicking continues the arrival
//          in place, carrying them from ghost to solid.
//
// Look and feel: portfolio-threshold.css. The middle column is not an element:
// the gate lets the pointer through there.

// Real interface screens only — screenshots and design files from the work
// on /ux — never illustrations. Back to front: left, right, front.
const UX_GLIMPSE = [
  { src: '/images/Home_Screen.png', label: 'Letter River' },
  { src: '/images/Bridge_Builder.png', label: 'Letter River' },
  { src: '/images/earth-hero.png', label: 'Earth Hero' },
];


// The doors follow the statement rather than waiting it out. The statement's
// own fade is 2.12s (RelationalPortfolio INTRO.statementFade), so at 0.75s it
// is about three-quarters in: the sentence still clearly leads, but the
// visitor can act at ~1.55s instead of ~2.7s. Dropping this much below 0.75
// puts the doors against a sentence that is only a quarter visible, and they
// win.
const DOOR_DELAY = 0.75;
const DOOR_FADE = 0.8;
const LEAVE_FADE = 0.5;
const EASE = [0.22, 1, 0.36, 1];

export default function ThresholdGate({ reducedMotion, onPlay, onPeek = () => {}, links = [], homeHref = '/', uxHref = '/ux' }) {
  const UX_HREF = uxHref;
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // UX is a full page load; fetch it while the visitor is deciding.
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = UX_HREF;
    document.head.appendChild(link);
    return () => link.remove();
  }, [UX_HREF]);

  useEffect(() => {
    // The playground's nav and spheres are on the page but hidden (or only
    // ghosted) while the threshold is up. Keep them out of the tab order, and
    // tell the physics script not to let the pointer move them, so keyboard
    // focus goes name → Resume → Contact → UX → Play.
    const root = document.documentElement;
    const hidden = [...document.querySelectorAll('.pv2-nav, .pv2-overview__stage, .pv2-credit-drawer, .pv2-score-counter, .pv2-motion-toggle')];
    hidden.forEach((el) => el.setAttribute('inert', ''));
    root.classList.add('pv2-threshold-open');
    return () => {
      hidden.forEach((el) => el.removeAttribute('inert'));
      root.classList.remove('pv2-threshold-open');
    };
  }, []);

  const goUX = () => {
    if (reducedMotion) {
      window.location.assign(UX_HREF);
      return;
    }
    setLeaving(true);
  };

  const play = () => {
    onPlay();
  };

  return (
    <motion.div
      className="pv2-threshold"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: reducedMotion ? 0 : 0.6, ease: EASE } }}
      transition={reducedMotion ? { duration: 0 } : { duration: DOOR_FADE, delay: DOOR_DELAY, ease: EASE }}
    >
      {/* The same links as the playground's nav, in the same places, so when
          Play releases that nav it fades in around them without anything
          moving. */}
      <header className="pv2-threshold__frame">
        <a href={homeHref} className="pv2-threshold__name">Jacob Meyerkopf</a>
        <nav aria-label="Site navigation" className="pv2-threshold__quick">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={link.href === homeHref ? 'page' : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </header>

      <div className="pv2-threshold__door pv2-threshold__door--ux">
        <button
          type="button"
          className="pv2-threshold__hit"
          aria-label="UX work: professional portfolio"
          onClick={goUX}
        />
        <div className="pv2-threshold__glimpse" aria-hidden="true">
          {UX_GLIMPSE.map((screen, index) => (
            <span key={screen.src} className="pv2-threshold__screen" style={{ '--i': index }}>
              <img src={screen.src} alt="" decoding="async" />
            </span>
          ))}
        </div>
        <div className="pv2-threshold__content" aria-hidden="true">
          <span className="pv2-threshold__eyebrow">Professional work</span>
          <span className="pv2-threshold__title">
            <span>←</span> UX Work
          </span>
          <span className="pv2-threshold__sub">Selected work</span>
        </div>
      </div>

      <div
        className="pv2-threshold__door pv2-threshold__door--play"
        onMouseEnter={() => onPeek(true)}
        onMouseLeave={() => onPeek(false)}
        onFocus={() => onPeek(true)}
        onBlur={() => onPeek(false)}
      >
        <button
          type="button"
          className="pv2-threshold__hit"
          aria-label="Play: games and interactive work"
          onClick={play}
        />
        <div className="pv2-threshold__content" aria-hidden="true">
          <span className="pv2-threshold__eyebrow">Playground</span>
          <span className="pv2-threshold__title">
            Play <span>→</span>
          </span>
        </div>
      </div>

      {leaving && (
        <motion.div
          className="pv2-threshold__veil"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: LEAVE_FADE, ease: EASE }}
          onAnimationComplete={() => window.location.assign(UX_HREF)}
        />
      )}
    </motion.div>
  );
}
