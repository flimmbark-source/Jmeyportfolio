import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// The threshold homepage. The screen is three columns the visitor never sees
// as columns: the statement in the middle (neutral, nothing happens there),
// UX to the left and Play to the right. Hovering or focusing a side lights its
// column, shades its outer edge and reveals what is behind it, each item a
// direct link. Clicking the column itself: Play continues the playground's
// arrival in place; UX fades the page out and goes to /ux.
//
// Look and feel: portfolio-threshold.css. The middle column is not an element:
// the gate lets the pointer through there, so the statement underneath is
// exactly what it is on the playground.

// The case studies the UX door reveals, in order. The first is the lead and
// gets the large image. Titles and labels are the ones /ux uses for its
// Selected work. When the Earth Hero case study has a page, it goes first.
const UX_CASE_STUDIES = [
  { title: 'Letter River', detail: 'A guided Hebrew-learning prototype', href: '/letter-river', image: '/images/derived/letterriverscreen-768.webp' },
  { title: 'IDL', detail: 'Improving a SolidWorks workflow', href: '/idl', image: '/images/derived/idl-case-study-768.webp' },
  { title: 'AI Archiving Assistant', detail: 'Reviewing AI-suggested tags', href: '/ai-archiving', image: '/images/derived/ai-archiver-768.webp' },
];

// The same artwork the playground's spheres use (portfolio-v2-overrides.css).
const GAME_ART = {
  'get-to-the-cafe': '/images/derived/oiz8uf-768.webp',
  'letter-river': '/images/derived/letterriverscreen-768.webp',
  'last-reading': '/images/derived/Thelastreadingscreen-768.webp',
  rotogo: '/images/derived/rotogoscreen-768.webp',
  'gig-duel': '/images/derived/VenueRivalsscreen-768.webp',
};

const UX_HREF = '/ux';
const RESUME_HREF = '/resume/Jacob_Meyerkopf_Product_UX_Resume.pdf';

// The doors fade in once the statement has had the screen to itself
// (RelationalPortfolio INTRO.statement is 1.82s).
const DOOR_DELAY = 1.6;
const DOOR_FADE = 1.1;
const LEAVE_FADE = 0.5;
const EASE = [0.22, 1, 0.36, 1];

export default function ThresholdGate({ reducedMotion, games = [], onPlay, onOpenGame }) {
  const [leavingTo, setLeavingTo] = useState(null);

  useEffect(() => {
    // UX is a full page load; fetch it while the visitor is deciding.
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = UX_HREF;
    document.head.appendChild(link);
    return () => link.remove();
  }, []);

  useEffect(() => {
    // The playground's nav and spheres are on the page but invisible while the
    // threshold is up. Keep them out of the tab order so keyboard focus goes
    // name → Resume → Contact → UX → Play, and give them back on the way out.
    const hidden = [...document.querySelectorAll('.pv2-nav, .pv2-overview__stage, .pv2-credit-drawer')];
    hidden.forEach((el) => el.setAttribute('inert', ''));
    return () => hidden.forEach((el) => el.removeAttribute('inert'));
  }, []);

  // Leaving for a separate page fades the site's ground colour up first.
  const leaveFor = (href) => (event) => {
    if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1)) return;
    if (event) event.preventDefault();
    if (reducedMotion) {
      window.location.assign(href);
      return;
    }
    setLeavingTo(href);
  };

  const openGame = (id) => (event) => {
    if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1)) return;
    if (event) event.preventDefault();
    onOpenGame(id);
  };

  return (
    <motion.div
      className="pv2-threshold"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: reducedMotion ? 0 : 0.6, ease: EASE } }}
      transition={reducedMotion ? { duration: 0 } : { duration: DOOR_FADE, delay: DOOR_DELAY, ease: EASE }}
    >
      {/* The minimum frame: who this is, the resume, a way to get in touch.
          Sits exactly where the playground's nav will fade in. */}
      <header className="pv2-threshold__frame">
        <a href="/" className="pv2-threshold__name">Jacob Meyerkopf</a>
        <nav aria-label="Quick links" className="pv2-threshold__quick">
          <a href={RESUME_HREF}>Resume</a>
          <a href="/contact">Contact</a>
        </nav>
      </header>

      <div className="pv2-threshold__door pv2-threshold__door--ux">
        <button
          type="button"
          className="pv2-threshold__hit"
          aria-label="UX work: professional case studies"
          onClick={leaveFor(UX_HREF)}
        />
        <div className="pv2-threshold__content">
          <span className="pv2-threshold__eyebrow">Professional work</span>
          <span className="pv2-threshold__title">
            <span aria-hidden="true">←</span> UX Work
          </span>
          <span className="pv2-threshold__count">{UX_CASE_STUDIES.length} case studies</span>
          <ul className="pv2-threshold__list pv2-threshold__cases" aria-label="Case studies">
            {UX_CASE_STUDIES.map((study, index) => (
              <li key={study.href} className={index === 0 ? 'is-lead' : undefined} style={{ '--i': index }}>
                <a href={study.href} onClick={leaveFor(study.href)}>
                  <span className="pv2-threshold__thumb">
                    <img src={study.image} alt="" decoding="async" />
                  </span>
                  <strong>{study.title}</strong>
                  {index === 0 && <span className="pv2-threshold__detail">{study.detail}</span>}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="pv2-threshold__door pv2-threshold__door--play">
        <button
          type="button"
          className="pv2-threshold__hit"
          aria-label="Play: games and interactive work"
          onClick={onPlay}
        />
        <div className="pv2-threshold__content">
          <span className="pv2-threshold__eyebrow">Playground</span>
          <span className="pv2-threshold__title">
            Play <span aria-hidden="true">→</span>
          </span>
          <ul className="pv2-threshold__list pv2-threshold__games" aria-label="Games">
            {games.map((game, index) => (
              <li key={game.id} style={{ '--i': index }}>
                <a href={`?project=${game.id}`} onClick={openGame(game.id)}>
                  <span className="pv2-threshold__orb">
                    {GAME_ART[game.id] && <img src={GAME_ART[game.id]} alt="" decoding="async" />}
                  </span>
                  <strong>{game.title}</strong>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {leavingTo && (
        <motion.div
          className="pv2-threshold__veil"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: LEAVE_FADE, ease: EASE }}
          onAnimationComplete={() => window.location.assign(leavingTo)}
        />
      )}
    </motion.div>
  );
}
