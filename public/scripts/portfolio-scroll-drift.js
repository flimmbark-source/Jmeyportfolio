(() => {
  const MOBILE_BREAKPOINT = 720;
  const NAV_CLEARANCE = 18;
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
      // Each project resists page-scroll movement by a different amount.
      counter: 0.82 + ((index * 0.073) % 0.14),
      // Very slow randomized-feeling catch-up speeds.
      follow: 0.008 + ((index * 0.0047) % 0.014),
    }));
    lastScrollY = window.scrollY;
  }

  function tick() {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      for (const item of items) item.el.style.transform = '';
      frame = requestAnimationFrame(tick);
      return;
    }

    const scrollY = window.scrollY;
    const delta = scrollY - lastScrollY;
    lastScrollY = scrollY;

    if (Math.abs(delta) > 0.01) {
      for (const item of items) {
        // Scrolling down moves document content upward. Positive translateY
        // cancels most of that immediate movement so the tile visibly trails.
        item.targetLag += delta * item.counter;
        item.targetLag = Math.max(-MAX_LAG, Math.min(MAX_LAG, item.targetLag));
      }
    }

    const minTop = navBottom();
    for (const item of items) {
      item.targetLag += (0 - item.targetLag) * item.follow;
      item.lag += (item.targetLag - item.lag) * 0.16;

      item.el.style.transform = `translate3d(0, ${item.lag.toFixed(2)}px, 0)`;

      // Keep the visual body below the fixed navigation even while lagging.
      const rect = item.el.getBoundingClientRect();
      if (rect.top < minTop) {
        const correction = minTop - rect.top;
        item.lag += correction;
        item.targetLag = Math.max(item.targetLag, item.lag);
        item.el.style.transform = `translate3d(0, ${item.lag.toFixed(2)}px, 0)`;
      }
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
