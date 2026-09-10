(() => {
  const MOBILE_BREAKPOINT = 720;
  const EDGE_PADDING = 14;
  const BODY_GAP = 12;
  const MAX_SPEED = 0.42;
  const DAMPING = 0.996;
  const HOME_PULL = 0.000012;
  const POINTER_IMPULSE = 0.055;

  let animationFrame = 0;
  let resizeObserver = null;
  let bodies = [];
  let stage = null;
  let statement = null;
  let lastTime = 0;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function rectsOverlap(a, b, gap = 0) {
    return !(
      a.x + a.w + gap <= b.x ||
      b.x + b.w + gap <= a.x ||
      a.y + a.h + gap <= b.y ||
      b.y + b.h + gap <= a.y
    );
  }

  function getStatementRect() {
    if (!statement || !stage) return null;
    const sr = statement.getBoundingClientRect();
    const pr = stage.getBoundingClientRect();
    return {
      x: sr.left - pr.left,
      y: sr.top - pr.top,
      w: sr.width,
      h: sr.height,
    };
  }

  function clearInlinePosition(el) {
    el.style.left = '';
    el.style.top = '';
    el.style.right = '';
    el.style.bottom = '';
  }

  function preferredCenter(el, stageRect) {
    const className = el.className;
    let px = 0.5;
    let py = 0.5;

    if (className.includes('project-tile--top')) { px = 0.50; py = 0.16; }
    else if (className.includes('project-tile--left')) { px = 0.15; py = 0.48; }
    else if (className.includes('project-tile--right')) { px = 0.84; py = 0.47; }
    else if (className.includes('project-tile--bottom-left')) { px = 0.34; py = 0.78; }
    else if (className.includes('project-tile--bottom-right')) { px = 0.66; py = 0.78; }
    else if (className.includes('gateway-link--ux')) { px = 0.08; py = 0.22; }
    else if (className.includes('gateway-link--unfinished')) { px = 0.88; py = 0.78; }

    return { x: stageRect.width * px, y: stageRect.height * py };
  }

  function seedBody(el, index, stageRect) {
    const r = el.getBoundingClientRect();
    const home = preferredCenter(el, stageRect);
    const w = r.width;
    const h = r.height;
    const x = clamp(home.x - w / 2, EDGE_PADDING, stageRect.width - w - EDGE_PADDING);
    const y = clamp(home.y - h / 2, EDGE_PADDING, stageRect.height - h - EDGE_PADDING);
    const angle = (index / Math.max(1, bodies.length + 1)) * Math.PI * 2;

    clearInlinePosition(el);
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    const body = {
      el,
      x,
      y,
      w,
      h,
      vx: Math.cos(angle + 0.7) * 0.035,
      vy: Math.sin(angle + 0.7) * 0.035,
      homeX: x,
      homeY: y,
      hovered: false,
    };

    const onEnter = (event) => {
      body.hovered = true;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = cx - event.clientX;
      let dy = cy - event.clientY;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      body.vx += dx * POINTER_IMPULSE;
      body.vy += dy * POINTER_IMPULSE;
    };

    const onLeave = () => { body.hovered = false; };
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
    body.cleanup = () => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
    };

    return body;
  }

  function separateBodies(a, b) {
    if (!rectsOverlap(a, b, BODY_GAP)) return;

    const acx = a.x + a.w / 2;
    const acy = a.y + a.h / 2;
    const bcx = b.x + b.w / 2;
    const bcy = b.y + b.h / 2;
    let dx = acx - bcx;
    let dy = acy - bcy;

    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) dx = 1;

    const overlapX = (a.w + b.w) / 2 + BODY_GAP - Math.abs(dx);
    const overlapY = (a.h + b.h) / 2 + BODY_GAP - Math.abs(dy);

    if (overlapX < overlapY) {
      const push = overlapX / 2;
      const sign = dx >= 0 ? 1 : -1;
      a.x += push * sign;
      b.x -= push * sign;
      const av = a.vx;
      a.vx = b.vx * 0.72;
      b.vx = av * 0.72;
    } else {
      const push = overlapY / 2;
      const sign = dy >= 0 ? 1 : -1;
      a.y += push * sign;
      b.y -= push * sign;
      const av = a.vy;
      a.vy = b.vy * 0.72;
      b.vy = av * 0.72;
    }
  }

  function separateFromStatement(body, obstacle) {
    if (!obstacle || !rectsOverlap(body, obstacle, BODY_GAP + 18)) return;

    const bcX = body.x + body.w / 2;
    const bcY = body.y + body.h / 2;
    const ocX = obstacle.x + obstacle.w / 2;
    const ocY = obstacle.y + obstacle.h / 2;
    const dx = bcX - ocX;
    const dy = bcY - ocY;
    const overlapX = (body.w + obstacle.w) / 2 + BODY_GAP + 18 - Math.abs(dx);
    const overlapY = (body.h + obstacle.h) / 2 + BODY_GAP + 18 - Math.abs(dy);

    if (overlapX < overlapY) {
      const sign = dx >= 0 ? 1 : -1;
      body.x += overlapX * sign;
      body.vx += sign * 0.018;
    } else {
      const sign = dy >= 0 ? 1 : -1;
      body.y += overlapY * sign;
      body.vy += sign * 0.018;
    }
  }

  function constrain(body, width, height) {
    const maxX = Math.max(EDGE_PADDING, width - body.w - EDGE_PADDING);
    const maxY = Math.max(EDGE_PADDING, height - body.h - EDGE_PADDING);

    if (body.x < EDGE_PADDING) { body.x = EDGE_PADDING; body.vx = Math.abs(body.vx) * 0.72; }
    if (body.x > maxX) { body.x = maxX; body.vx = -Math.abs(body.vx) * 0.72; }
    if (body.y < EDGE_PADDING) { body.y = EDGE_PADDING; body.vy = Math.abs(body.vy) * 0.72; }
    if (body.y > maxY) { body.y = maxY; body.vy = -Math.abs(body.vy) * 0.72; }
  }

  function tick(now) {
    if (!stage || window.innerWidth <= MOBILE_BREAKPOINT || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dt = clamp(lastTime ? now - lastTime : 16, 8, 34);
    lastTime = now;
    const sr = stage.getBoundingClientRect();
    const obstacle = getStatementRect();

    for (const body of bodies) {
      body.vx += (body.homeX - body.x) * HOME_PULL * dt;
      body.vy += (body.homeY - body.y) * HOME_PULL * dt;
      body.vx *= Math.pow(DAMPING, dt);
      body.vy *= Math.pow(DAMPING, dt);
      body.vx = clamp(body.vx, -MAX_SPEED, MAX_SPEED);
      body.vy = clamp(body.vy, -MAX_SPEED, MAX_SPEED);
      body.x += body.vx * dt;
      body.y += body.vy * dt;
      separateFromStatement(body, obstacle);
      constrain(body, sr.width, sr.height);
    }

    for (let pass = 0; pass < 2; pass += 1) {
      for (let i = 0; i < bodies.length; i += 1) {
        for (let j = i + 1; j < bodies.length; j += 1) separateBodies(bodies[i], bodies[j]);
      }
      for (const body of bodies) constrain(body, sr.width, sr.height);
    }

    for (const body of bodies) {
      body.el.style.left = `${body.x}px`;
      body.el.style.top = `${body.y}px`;
    }

    animationFrame = requestAnimationFrame(tick);
  }

  function teardown() {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = null;
    bodies.forEach((body) => body.cleanup?.());
    bodies = [];
    lastTime = 0;
  }

  function init() {
    teardown();
    stage = document.querySelector('.pv2-overview__stage');
    statement = document.querySelector('.pv2-overview__statement');
    if (!stage || !statement || window.innerWidth <= MOBILE_BREAKPOINT || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const elements = [...stage.querySelectorAll('.pv2-project-tile, .pv2-gateway-link')];
    if (!elements.length) return;

    const sr = stage.getBoundingClientRect();
    bodies = elements.map((el, index) => seedBody(el, index, sr));

    // Resolve the initial composition before the first visible physics frame.
    const obstacle = getStatementRect();
    for (let pass = 0; pass < 12; pass += 1) {
      bodies.forEach((body) => separateFromStatement(body, obstacle));
      for (let i = 0; i < bodies.length; i += 1) {
        for (let j = i + 1; j < bodies.length; j += 1) separateBodies(bodies[i], bodies[j]);
      }
      bodies.forEach((body) => constrain(body, sr.width, sr.height));
    }
    bodies.forEach((body) => {
      body.homeX = body.x;
      body.homeY = body.y;
      body.el.style.left = `${body.x}px`;
      body.el.style.top = `${body.y}px`;
    });

    resizeObserver = new ResizeObserver(() => {
      const next = stage.getBoundingClientRect();
      bodies.forEach((body) => {
        const r = body.el.getBoundingClientRect();
        body.w = r.width;
        body.h = r.height;
        body.x = clamp(body.x, EDGE_PADDING, Math.max(EDGE_PADDING, next.width - body.w - EDGE_PADDING));
        body.y = clamp(body.y, EDGE_PADDING, Math.max(EDGE_PADDING, next.height - body.h - EDGE_PADDING));
      });
    });
    resizeObserver.observe(stage);
    resizeObserver.observe(statement);

    animationFrame = requestAnimationFrame(tick);
  }

  let mutationTimer = 0;
  const observer = new MutationObserver(() => {
    clearTimeout(mutationTimer);
    mutationTimer = window.setTimeout(() => {
      if (document.querySelector('.pv2-overview__stage')) init();
      else teardown();
    }, 80);
  });

  function start() {
    observer.observe(document.body, { childList: true, subtree: true });
    init();
    window.addEventListener('resize', () => {
      clearTimeout(mutationTimer);
      mutationTimer = window.setTimeout(init, 120);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
