(() => {
  const MOBILE_BREAKPOINT = 720;
  const NAV_CLEARANCE = 18;
  const EDGE_PADDING = 16;
  const MAX_LAG = 260;

  let items = [];
  let lastScrollY = window.scrollY;
  let frame = 0;
  let observer = null;

  function navBottom() {
    const nav = document.querySelector('.pv2-nav');
    return nav ? nav.getBoundingClientRect().bottom + NAV_CLEARANCE : NAV_CLEARANCE;
  }

  function shouldDrift(el) {
    // Project cards and the Professional Work / UX gateway should all trail the
    // bio on scroll. Keep Workshop / Unfinished anchored in place.
    if (el.querySelector('.pv2-gateway-link--unfinished')) return false;
    return true;
  }

  function setup() {
    items = [...document.querySelectorAll('.pv2-float-slot')]
      .filter(shouldDrift)
      .map((el, index) => ({
        el,
        lag: 0,
        targetLag: 0,
        // Cancel the document's immediate scroll movement entirely so there is
        // no visible snap. The visible movement happens only through the slow
        // catch-up below.
        counter: 1,
        // Very slow, slightly different rates so each block follows the bio
        // with its own weight rather than moving as a rigid group.
        follow: 0.0035 + ((index * 0.0021) % 0.0065),
      }));
    lastScrollY = window.scrollY;
  }

  function applyScrollDelta(delta) {
    if (window.innerWidth <= MOBILE_BREAKPOINT || Math.abs(delta) <= 0.01) return;

    for (const item of items) {
      const compensation = delta * item.counter;
      item.targetLag += compensation;
      item.lag += compensation;
      item.targetLag = Math.max(-MAX_LAG, Math.min(MAX_LAG, item.targetLag));
      item.lag = Math.max(-MAX_LAG, Math.min(MAX_LAG, item.lag));
      item.el.style.setProperty('--pv2-scroll-drift-y', `${item.lag.toFixed(2)}px`);
    }
  }

  function onScroll() {
    const scrollY = window.scrollY;
    const delta = scrollY - lastScrollY;
    lastScrollY = scrollY;
    applyScrollDelta(delta);
  }

  function tick() {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      for (const item of items) item.el.style.removeProperty('--pv2-scroll-drift-y');
      frame = requestAnimationFrame(tick);
      return;
    }

    const minTop = navBottom();
    const maxBottom = window.innerHeight - EDGE_PADDING;

    for (const item of items) {
      item.targetLag += (0 - item.targetLag) * item.follow;
      item.lag += (item.targetLag - item.lag) * 0.08;

      item.el.style.setProperty('--pv2-scroll-drift-y', `${item.lag.toFixed(2)}px`);

      // Keep every drifting block visible while it slowly catches up.
      const rect = item.el.getBoundingClientRect();
      if (rect.top < minTop) {
        const correction = minTop - rect.top;
        item.lag += correction;
        item.targetLag = Math.max(item.targetLag, item.lag);
      }
      if (rect.bottom > maxBottom) {
        const correction = rect.bottom - maxBottom;
        item.lag -= correction;
        item.targetLag = Math.min(item.targetLag, item.lag);
      }

      item.el.style.setProperty('--pv2-scroll-drift-y', `${item.lag.toFixed(2)}px`);
    }

    frame = requestAnimationFrame(tick);
  }

  function start() {
    setup();
    observer = new MutationObserver(() => {
      const current = [...document.querySelectorAll('.pv2-float-slot')].filter(shouldDrift).length;
      if (current !== items.length) setup();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    frame = requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
