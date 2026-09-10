(() => {
  const MOBILE_BREAKPOINT = 720;
  const NAV_CLEARANCE = 18;
  const EDGE_PADDING = 16;
  const DESKTOP_MAX_LAG = 260;
  const MOBILE_MAX_LAG = 120;

  let items = [];
  let lastScrollY = window.scrollY;
  let frame = 0;
  let observer = null;

  function isMobile() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

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
        // Fully cancel the immediate document movement so wheel/touch scroll
        // does not create a visible snap. Mobile uses the same principle but
        // with a shorter trail so the stacked layout remains easy to navigate.
        counter: 1,
        desktopFollow: 0.0035 + ((index * 0.0021) % 0.0065),
        mobileFollow: 0.008 + ((index * 0.0027) % 0.008),
      }));
    lastScrollY = window.scrollY;
  }

  function applyScrollDelta(delta) {
    if (Math.abs(delta) <= 0.01) return;

    const maxLag = isMobile() ? MOBILE_MAX_LAG : DESKTOP_MAX_LAG;
    for (const item of items) {
      const compensation = delta * item.counter;
      item.targetLag += compensation;
      item.lag += compensation;
      item.targetLag = Math.max(-maxLag, Math.min(maxLag, item.targetLag));
      item.lag = Math.max(-maxLag, Math.min(maxLag, item.lag));
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
    const mobile = isMobile();
    const maxLag = mobile ? MOBILE_MAX_LAG : DESKTOP_MAX_LAG;
    const minTop = navBottom();
    const maxBottom = window.innerHeight - EDGE_PADDING;

    for (const item of items) {
      const follow = mobile ? item.mobileFollow : item.desktopFollow;
      item.targetLag += (0 - item.targetLag) * follow;
      item.lag += (item.targetLag - item.lag) * (mobile ? 0.11 : 0.08);
      item.lag = Math.max(-maxLag, Math.min(maxLag, item.lag));

      item.el.style.setProperty('--pv2-scroll-drift-y', `${item.lag.toFixed(2)}px`);

      if (!mobile) {
        // Desktop pieces live in a viewport-like composition, so keep them
        // fully visible while they trail the scroll.
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
      // On mobile we deliberately do not clamp every card into the viewport:
      // the cards are a vertical document flow and offscreen cards must remain
      // offscreen until the user naturally scrolls to them.
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
