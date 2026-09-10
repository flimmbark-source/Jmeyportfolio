(() => {
  const MOBILE_BREAKPOINT = 720;
  const GAP = 18;
  const EDGE_PADDING = 16;
  const NAV_CLEARANCE = 18;
  const SPRING_BACK = 0.018;
  const DAMPING = 0.88;
  const BOUNCE_KICK = 0.22;

  const states = new WeakMap();
  let frame = 0;

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function overlaps(a, b, gap = 0) {
    return !(
      a.right + gap <= b.left ||
      a.left >= b.right + gap ||
      a.bottom + gap <= b.top ||
      a.top >= b.bottom + gap
    );
  }

  function navBottom() {
    const nav = document.querySelector('.pv2-nav');
    return nav ? nav.getBoundingClientRect().bottom + NAV_CLEARANCE : EDGE_PADDING;
  }

  function stateFor(el) {
    let state = states.get(el);
    if (!state) {
      state = { x: 0, y: 0, vx: 0, vy: 0 };
      states.set(el, state);
    }
    return state;
  }

  function applyTransform(el, state) {
    el.style.transform = `translate3d(${state.x.toFixed(2)}px, calc(${state.y.toFixed(2)}px + var(--pv2-scroll-drift-y, 0px)), 0)`;
  }

  function clampToViewport(el, state) {
    applyTransform(el, state);
    const rect = el.getBoundingClientRect();
    const minTop = navBottom();
    const maxRight = window.innerWidth - EDGE_PADDING;
    const maxBottom = window.innerHeight - EDGE_PADDING;

    if (rect.left < EDGE_PADDING) {
      state.x += EDGE_PADDING - rect.left;
      state.vx = Math.abs(state.vx) * 0.25;
    }
    if (rect.right > maxRight) {
      state.x -= rect.right - maxRight;
      state.vx = -Math.abs(state.vx) * 0.25;
    }
    if (rect.top < minTop) {
      state.y += minTop - rect.top;
      state.vy = Math.abs(state.vy) * 0.25;
    }
    if (rect.bottom > maxBottom) {
      state.y -= rect.bottom - maxBottom;
      state.vy = -Math.abs(state.vy) * 0.25;
    }

    applyTransform(el, state);
  }

  function tick() {
    const statement = document.querySelector('.pv2-overview__statement');
    const stage = document.querySelector('.pv2-overview__stage');

    if (!statement || !stage || window.innerWidth <= MOBILE_BREAKPOINT) {
      frame = requestAnimationFrame(tick);
      return;
    }

    const obstacle = statement.getBoundingClientRect();
    const slots = [...stage.querySelectorAll('.pv2-float-slot')];

    for (const el of slots) {
      const state = stateFor(el);
      const rect = el.getBoundingClientRect();

      if (overlaps(rect, obstacle, GAP)) {
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const ox = obstacle.left + obstacle.width / 2;
        const oy = obstacle.top + obstacle.height / 2;
        const dx = cx - ox || 0.01;
        const dy = cy - oy || 0.01;

        const pushLeft = rect.right + GAP - obstacle.left;
        const pushRight = obstacle.right + GAP - rect.left;
        const pushUp = rect.bottom + GAP - obstacle.top;
        const pushDown = obstacle.bottom + GAP - rect.top;
        const overlapX = Math.min(pushLeft, pushRight);
        const overlapY = Math.min(pushUp, pushDown);

        if (overlapX < overlapY) {
          const dir = dx >= 0 ? 1 : -1;
          state.x += overlapX * dir;
          state.vx = dir * BOUNCE_KICK;
        } else {
          const dir = dy >= 0 ? 1 : -1;
          state.y += overlapY * dir;
          state.vy = dir * BOUNCE_KICK;
        }
      } else if (!reducedMotion()) {
        state.vx += -state.x * SPRING_BACK;
        state.vy += -state.y * SPRING_BACK;
      } else {
        state.vx = 0;
        state.vy = 0;
      }

      state.vx *= DAMPING;
      state.vy *= DAMPING;
      state.x += state.vx;
      state.y += state.vy;

      if (Math.abs(state.x) < 0.05 && Math.abs(state.vx) < 0.05) {
        state.x = 0;
        state.vx = 0;
      }
      if (Math.abs(state.y) < 0.05 && Math.abs(state.vy) < 0.05) {
        state.y = 0;
        state.vy = 0;
      }

      clampToViewport(el, state);
    }

    frame = requestAnimationFrame(tick);
  }

  function start() {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
