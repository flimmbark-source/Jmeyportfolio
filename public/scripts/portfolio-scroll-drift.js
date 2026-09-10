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

  function setup() {
    items = [...document.querySelectorAll('.pv2-float-slot:not(.pv2-float-slot--gateway)')].map((el, index) => ({
      el,
      lag: 0,
      targetLag: 0,
      counter: 0.82 + ((index * 0.073) % 0.14),
      follow: 0.008 + ((index * 0.0047) % 0.014),
    }));
    lastScrollY = window.scrollY;
  }

  function tick() {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      for (const item of items) item.el.style.removeProperty('--pv2-scroll-drift-y');
      frame = requestAnimationFrame(tick);
      return;
    }

    const scrollY = window.scrollY;
    const delta = scrollY - lastScrollY;
    lastScrollY = scrollY;

    if (Math.abs(delta) > 0.01) {
      for (const item of items) {
        item.targetLag += delta * item.counter;
        item.targetLag = Math.max(-MAX_LAG, Math.min(MAX_LAG, item.targetLag));
      }
    }

    const minTop = navBottom();
    const maxBottom = window.innerHeight - EDGE_PADDING;

    for (const item of items) {
      item.targetLag += (0 - item.targetLag) * item.follow;
      item.lag += (item.targetLag - item.lag) * 0.16;

      item.el.style.setProperty('--pv2-scroll-drift-y', `${item.lag.toFixed(2)}px`);

      // Clamp the drift itself so the visible block cannot leave the viewport.
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
      const current = document.querySelectorAll('.pv2-float-slot:not(.pv2-float-slot--gateway)').length;
      if (current !== items.length) setup();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    frame = requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
