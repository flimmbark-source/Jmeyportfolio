(() => {
  const MOBILE_BREAKPOINT = 720;
  const EDGE_PADDING = 16;
  const BODY_GAP = 16;
  const STATEMENT_GAP = 30;
  const NORMAL_SPEED = 0.09;
  const REDUCED_SPEED = 0.028;
  const POINTER_IMPULSE = 0.07;
  const HOME_PULL = 0.0000011;
  const DAMPING = 0.9995;

  let frame = 0;
  let stage = null;
  let statement = null;
  let bodies = [];
  let lastTime = 0;
  let mutationTimer = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mark(state) {
    document.documentElement.dataset.pv2Physics = state;
  }

  function overlaps(a, b, gap = 0) {
    return !(
      a.x + a.w + gap <= b.x ||
      b.x + b.w + gap <= a.x ||
      a.y + a.h + gap <= b.y ||
      b.y + b.h + gap <= a.y
    );
  }

  function statementRect() {
    if (!stage || !statement) return null;
    const s = statement.getBoundingClientRect();
    const p = stage.getBoundingClientRect();
    return { x: s.left - p.left, y: s.top - p.top, w: s.width, h: s.height };
  }

  function classString(slot) {
    const child = slot.querySelector('.pv2-project-tile, .pv2-gateway-link');
    return `${slot.className} ${child?.className || ''}`;
  }

  function anchorFor(slot, width, height) {
    const c = classString(slot);
    let x = 0.5;
    let y = 0.5;
    if (c.includes('project-tile--top')) { x = 0.50; y = 0.13; }
    else if (c.includes('project-tile--left')) { x = 0.14; y = 0.47; }
    else if (c.includes('project-tile--right')) { x = 0.86; y = 0.46; }
    else if (c.includes('project-tile--bottom-left')) { x = 0.31; y = 0.80; }
    else if (c.includes('project-tile--bottom-right')) { x = 0.69; y = 0.80; }
    else if (c.includes('gateway-link--ux')) { x = 0.08; y = 0.20; }
    else if (c.includes('gateway-link--unfinished')) { x = 0.90; y = 0.78; }
    return { x: width * x, y: height * y };
  }

  function constrain(body, width, height) {
    const maxX = Math.max(EDGE_PADDING, width - body.w - EDGE_PADDING);
    const maxY = Math.max(EDGE_PADDING, height - body.h - EDGE_PADDING);
    if (body.x < EDGE_PADDING) { body.x = EDGE_PADDING; body.vx = Math.abs(body.vx); }
    if (body.x > maxX) { body.x = maxX; body.vx = -Math.abs(body.vx); }
    if (body.y < EDGE_PADDING) { body.y = EDGE_PADDING; body.vy = Math.abs(body.vy); }
    if (body.y > maxY) { body.y = maxY; body.vy = -Math.abs(body.vy); }
  }

  function separate(a, b) {
    if (!overlaps(a, b, BODY_GAP)) return;
    const dx = (a.x + a.w / 2) - (b.x + b.w / 2) || 0.01;
    const dy = (a.y + a.h / 2) - (b.y + b.h / 2) || 0.01;
    const overlapX = (a.w + b.w) / 2 + BODY_GAP - Math.abs(dx);
    const overlapY = (a.h + b.h) / 2 + BODY_GAP - Math.abs(dy);
    if (overlapX < overlapY) {
      const sign = dx >= 0 ? 1 : -1;
      const push = Math.max(0, overlapX) / 2;
      a.x += push * sign;
      b.x -= push * sign;
      const av = a.vx;
      a.vx = b.vx;
      b.vx = av;
    } else {
      const sign = dy >= 0 ? 1 : -1;
      const push = Math.max(0, overlapY) / 2;
      a.y += push * sign;
      b.y -= push * sign;
      const av = a.vy;
      a.vy = b.vy;
      b.vy = av;
    }
  }

  function separateStatement(body, obstacle) {
    if (!obstacle || !overlaps(body, obstacle, STATEMENT_GAP)) return;
    const dx = (body.x + body.w / 2) - (obstacle.x + obstacle.w / 2) || 0.01;
    const dy = (body.y + body.h / 2) - (obstacle.y + obstacle.h / 2) || 0.01;
    const overlapX = (body.w + obstacle.w) / 2 + STATEMENT_GAP - Math.abs(dx);
    const overlapY = (body.h + obstacle.h) / 2 + STATEMENT_GAP - Math.abs(dy);
    if (overlapX < overlapY) {
      const sign = dx >= 0 ? 1 : -1;
      body.x += overlapX * sign;
      body.vx = Math.abs(body.vx) * sign;
    } else {
      const sign = dy >= 0 ? 1 : -1;
      body.y += overlapY * sign;
      body.vy = Math.abs(body.vy) * sign;
    }
  }

  function makeBody(el, index, stageRect) {
    const rect = el.getBoundingClientRect();
    const anchor = anchorFor(el, stageRect.width, stageRect.height);
    const w = rect.width;
    const h = rect.height;
    const x = clamp(anchor.x - w / 2, EDGE_PADDING, stageRect.width - w - EDGE_PADDING);
    const y = clamp(anchor.y - h / 2, EDGE_PADDING, stageRect.height - h - EDGE_PADDING);
    const angle = 0.55 + index * 1.19;
    const speed = reducedMotion() ? REDUCED_SPEED : NORMAL_SPEED;

    el.style.position = 'absolute';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transition = 'none';

    const body = {
      el, x, y, w, h,
      homeX: x,
      homeY: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      phase: index * 1.41 + 0.7,
      target: el.querySelector('.pv2-project-tile, .pv2-gateway-link') || el,
    };

    body.enter = (event) => {
      const r = body.el.getBoundingClientRect();
      let dx = r.left + r.width / 2 - event.clientX;
      let dy = r.top + r.height / 2 - event.clientY;
      const len = Math.hypot(dx, dy) || 1;
      body.vx += (dx / len) * POINTER_IMPULSE;
      body.vy += (dy / len) * POINTER_IMPULSE;
    };
    body.target.addEventListener('pointerenter', body.enter);
    return body;
  }

  function tick(now) {
    if (!stage || window.innerWidth <= MOBILE_BREAKPOINT) {
      mark(window.innerWidth <= MOBILE_BREAKPOINT ? 'mobile-static' : 'waiting');
      frame = 0;
      return;
    }

    const dt = clamp(lastTime ? now - lastTime : 16.667, 8, 32);
    lastTime = now;
    const sr = stage.getBoundingClientRect();
    const obstacle = statementRect();
    const speedFloor = reducedMotion() ? REDUCED_SPEED : NORMAL_SPEED;
    const t = now / 1000;

    for (const body of bodies) {
      body.vx += (body.homeX - body.x) * HOME_PULL * dt;
      body.vy += (body.homeY - body.y) * HOME_PULL * dt;

      // Continual, low-amplitude directional variation keeps these as real moving bodies.
      body.vx += Math.sin(t * 0.41 + body.phase) * 0.000035 * dt;
      body.vy += Math.cos(t * 0.37 + body.phase * 1.23) * 0.000035 * dt;
      body.vx *= Math.pow(DAMPING, dt);
      body.vy *= Math.pow(DAMPING, dt);

      const speed = Math.hypot(body.vx, body.vy);
      if (speed < speedFloor) {
        const a = body.phase + t * 0.16;
        body.vx += Math.cos(a) * (speedFloor - speed) * 0.18;
        body.vy += Math.sin(a) * (speedFloor - speed) * 0.18;
      }

      const maxSpeed = reducedMotion() ? 0.055 : 0.18;
      body.vx = clamp(body.vx, -maxSpeed, maxSpeed);
      body.vy = clamp(body.vy, -maxSpeed, maxSpeed);
      body.x += body.vx * dt;
      body.y += body.vy * dt;
      separateStatement(body, obstacle);
      constrain(body, sr.width, sr.height);
    }

    for (let pass = 0; pass < 2; pass += 1) {
      for (let i = 0; i < bodies.length; i += 1) {
        for (let j = i + 1; j < bodies.length; j += 1) separate(bodies[i], bodies[j]);
      }
      bodies.forEach((b) => constrain(b, sr.width, sr.height));
    }

    for (const body of bodies) {
      body.el.style.left = `${body.x.toFixed(2)}px`;
      body.el.style.top = `${body.y.toFixed(2)}px`;
    }

    mark(reducedMotion() ? 'running-reduced' : 'running');
    frame = requestAnimationFrame(tick);
  }

  function teardown() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    for (const body of bodies) body.target.removeEventListener('pointerenter', body.enter);
    bodies = [];
    lastTime = 0;
  }

  function init() {
    teardown();
    stage = document.querySelector('.pv2-overview__stage');
    statement = document.querySelector('.pv2-overview__statement');
    if (!stage || !statement) { mark('waiting-for-overview'); return; }
    if (window.innerWidth <= MOBILE_BREAKPOINT) { mark('mobile-static'); return; }

    const elements = [...stage.querySelectorAll('.pv2-float-slot')];
    if (!elements.length) { mark('waiting-for-bodies'); return; }

    const sr = stage.getBoundingClientRect();
    bodies = elements.map((el, i) => makeBody(el, i, sr));
    const obstacle = statementRect();

    // Resolve initial collisions before letting the bodies drift.
    for (let pass = 0; pass < 16; pass += 1) {
      bodies.forEach((body) => separateStatement(body, obstacle));
      for (let i = 0; i < bodies.length; i += 1) {
        for (let j = i + 1; j < bodies.length; j += 1) separate(bodies[i], bodies[j]);
      }
      bodies.forEach((body) => constrain(body, sr.width, sr.height));
    }

    for (const body of bodies) {
      body.homeX = body.x;
      body.homeY = body.y;
      body.el.style.left = `${body.x}px`;
      body.el.style.top = `${body.y}px`;
    }

    mark('initialized');
    frame = requestAnimationFrame(tick);
  }

  const observer = new MutationObserver(() => {
    clearTimeout(mutationTimer);
    mutationTimer = window.setTimeout(() => {
      const hasOverview = Boolean(document.querySelector('.pv2-overview__stage'));
      if (hasOverview && (!stage || !stage.isConnected || !frame)) init();
      if (!hasOverview && stage) { teardown(); stage = null; statement = null; mark('inactive'); }
    }, 50);
  });

  function start() {
    mark('script-loaded');
    observer.observe(document.body, { childList: true, subtree: true });
    init();
    window.addEventListener('resize', () => {
      clearTimeout(mutationTimer);
      mutationTimer = window.setTimeout(init, 120);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
