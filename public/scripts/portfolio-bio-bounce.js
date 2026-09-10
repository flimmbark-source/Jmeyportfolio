(() => {
  const MOBILE_BREAKPOINT = 720;
  const GAP = 18;
  const SPRING_BACK = 0.08;
  const DAMPING = 0.82;
  const BOUNCE_KICK = 1.8;

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

  function stateFor(el) {
    let state = states.get(el);
    if (!state) {
      state = { x: 0, y: 0, vx: 0, vy: 0 };
      states.set(el, state);
    }
    return state;
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

      el.style.transform = `translate(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px)`;
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
