(() => {
  const MOBILE_BREAKPOINT = 720;
  const EDGE_PADDING = 16;
  const NAV_CLEARANCE = 18;
  const BODY_GAP = 10;
  const BUMPER_GAP = 2;
  const NORMAL_SPEED = 0.038;
  const REDUCED_SPEED = 0.012;
  const POINTER_IMPULSE = 0.16;
  const POINTER_MIN_IMPULSE = 0.095;
  const HOME_PULL = 0.00000042;
  const DAMPING = 0.9992;
  const MAX_SPEED = 0.34;
  const REDUCED_MAX_SPEED = 0.06;
  const BUMPER_COOLDOWN = 220;
  const POINTER_COOLDOWN = 90;

  let frame = 0;
  let stage = null;
  let bodies = [];
  let lastTime = 0;
  let mutationTimer = 0;
  let fxLayer = null;
  let scoreCounter = null;
  let scoreValue = null;
  let gameActive = false;
  let points = 0;
  let pointer = { x: -9999, y: -9999, px: -9999, py: -9999, t: 0 };

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

  function ensureFxLayer() {
    if (fxLayer?.isConnected) return fxLayer;
    fxLayer = document.createElement('div');
    fxLayer.setAttribute('aria-hidden', 'true');
    Object.assign(fxLayer.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      overflow: 'hidden',
      zIndex: '1200',
    });
    document.body.appendChild(fxLayer);
    return fxLayer;
  }

  function ensureScoreCounter() {
    if (scoreCounter?.isConnected) return scoreCounter;
    scoreCounter = document.createElement('div');
    scoreCounter.className = 'pv2-score-counter';
    scoreCounter.setAttribute('role', 'status');
    scoreCounter.setAttribute('aria-live', 'polite');
    scoreCounter.innerHTML = '<span class="pv2-score-counter__label">Points</span><strong class="pv2-score-counter__value">0</strong>';
    scoreValue = scoreCounter.querySelector('.pv2-score-counter__value');
    scoreValue.textContent = String(points);
    document.body.appendChild(scoreCounter);
    return scoreCounter;
  }

  function setScoreVisible(visible) {
    ensureScoreCounter().classList.toggle('is-visible', Boolean(visible));
  }

  function activateGame() {
    if (gameActive) return;
    gameActive = true;
    document.documentElement.classList.add('pv2-game-active');
    setScoreVisible(Boolean(stage?.isConnected));
    window.dispatchEvent(new CustomEvent('pv2:game-start', { detail: { points } }));
  }

  function updateScore(delta, bumperId) {
    points += delta;
    ensureScoreCounter();
    scoreValue.textContent = String(points);
    if (!reducedMotion()) {
      scoreCounter.animate([
        { transform: 'translateY(0) scale(1)' },
        { transform: 'translateY(0) scale(1.08)', offset: 0.42 },
        { transform: 'translateY(0) scale(1)' },
      ], { duration: 170, easing: 'cubic-bezier(.2,.9,.25,1)' });
    }
    window.dispatchEvent(new CustomEvent('pv2:score', { detail: { points, delta, bumperId } }));
  }

  function pointGhost(el, amount) {
    if (!el?.isConnected) return;
    const rect = el.getBoundingClientRect();
    const ghost = document.createElement('span');
    ghost.className = 'pv2-point-ghost';
    ghost.textContent = `+${amount}`;
    ghost.style.left = `${rect.left + rect.width / 2}px`;
    ghost.style.top = `${rect.top - 2}px`;
    ensureFxLayer().appendChild(ghost);
    const animation = ghost.animate([
      { opacity: 0, transform: 'translate(-50%, 2px) scale(.9)' },
      { opacity: 1, offset: .18, transform: 'translate(-50%, -5px) scale(1)' },
      { opacity: 0, transform: 'translate(-50%, -30px) scale(.96)' },
    ], { duration: reducedMotion() ? 1 : 520, easing: 'cubic-bezier(.2,.8,.25,1)' });
    animation.addEventListener('finish', () => ghost.remove(), { once: true });
  }

  function pulseBumper(el) {
    if (!el?.isConnected || reducedMotion()) return;
    el.animate([
      { transform: 'scale(1)', filter: 'brightness(1)' },
      { transform: 'scale(1.025)', filter: 'brightness(.96)', offset: .34 },
      { transform: 'scale(1)', filter: 'brightness(1)' },
    ], { duration: 240, easing: 'cubic-bezier(.2,.9,.25,1)' });
  }

  function registerBumperHit(body, bumper, now) {
    if (!gameActive || !bumper?.el) return;
    const last = body.lastBumperHits.get(bumper.id) || -Infinity;
    if (now - last < BUMPER_COOLDOWN) return;
    body.lastBumperHits.set(bumper.id, now);
    pulseBumper(bumper.el);
    pointGhost(bumper.el, 1);
    updateScore(1, bumper.id);
  }

  function impactBurst(x, y, targetRect) {
    if (window.innerWidth <= MOBILE_BREAKPOINT || reducedMotion() || !targetRect) return;
    const layer = ensureFxLayer();
    const lineCount = 6;
    const centerX = targetRect.left + targetRect.width / 2;
    const centerY = targetRect.top + targetRect.height / 2;
    const outwardAngle = Math.atan2(y - centerY, x - centerX);

    for (let i = 0; i < lineCount; i += 1) {
      const p = i / (lineCount - 1);
      const angle = outwardAngle - Math.PI / 2 + p * Math.PI + (Math.random() - .5) * .1;
      const distance = 11 + Math.random() * 10;
      const length = 6 + Math.random() * 5;
      const line = document.createElement('span');
      Object.assign(line.style, {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${length}px`,
        height: '1.5px',
        background: 'rgba(32,32,32,.76)',
        transformOrigin: '0 50%',
        opacity: '0',
      });
      layer.appendChild(line);
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const animation = line.animate([
        { opacity: 0, transform: `translate(0,-50%) rotate(${angle}rad) scaleX(.15)` },
        { opacity: .95, offset: .16, transform: `translate(${dx * .22}px,${dy * .22}px) rotate(${angle}rad) scaleX(1)` },
        { opacity: 0, transform: `translate(${dx}px,${dy}px) rotate(${angle}rad) scaleX(.42)` },
      ], { duration: 175 + Math.random() * 55, easing: 'cubic-bezier(.2,.9,.25,1)' });
      animation.addEventListener('finish', () => line.remove(), { once: true });
    }
  }

  function classString(slot) {
    const child = slot.querySelector('.pv2-project-tile');
    return `${slot.className} ${child?.className || ''}`;
  }

  function anchorFor(slot, width, height) {
    const c = classString(slot);
    if (c.includes('project-tile--top')) return { x: width * .50, y: height * .18 };
    if (c.includes('project-tile--left')) return { x: width * .14, y: height * .47 };
    if (c.includes('project-tile--right')) return { x: width * .86, y: height * .46 };
    if (c.includes('project-tile--bottom-left')) return { x: width * .31, y: height * .80 };
    if (c.includes('project-tile--bottom-right')) return { x: width * .69, y: height * .80 };
    return { x: width * .5, y: height * .5 };
  }

  function stageTopLimit(stageRect) {
    const nav = document.querySelector('.pv2-nav');
    if (!nav) return EDGE_PADDING;
    return Math.max(EDGE_PADDING, nav.getBoundingClientRect().bottom - stageRect.top + NAV_CLEARANCE);
  }

  function constrain(body, sr) {
    const minY = stageTopLimit(sr);
    const maxX = Math.max(EDGE_PADDING, sr.width - body.w - EDGE_PADDING);
    const maxY = Math.max(minY, sr.height - body.h - EDGE_PADDING);
    let bounced = false;
    if (body.x < EDGE_PADDING) { body.x = EDGE_PADDING; body.vx = Math.abs(body.vx); bounced = true; }
    if (body.x > maxX) { body.x = maxX; body.vx = -Math.abs(body.vx); bounced = true; }
    if (body.y < minY) { body.y = minY; body.vy = Math.abs(body.vy); bounced = true; }
    if (body.y > maxY) { body.y = maxY; body.vy = -Math.abs(body.vy); bounced = true; }
    return bounced;
  }

  function bodyRect(body) {
    return { x: body.x, y: body.y, w: body.w, h: body.h };
  }

  function resolveBodyPair(a, b) {
    if (!overlaps(bodyRect(a), bodyRect(b), BODY_GAP)) return;
    const dx = (a.x + a.w / 2) - (b.x + b.w / 2) || .01;
    const dy = (a.y + a.h / 2) - (b.y + b.h / 2) || .01;
    const overlapX = (a.w + b.w) / 2 + BODY_GAP - Math.abs(dx);
    const overlapY = (a.h + b.h) / 2 + BODY_GAP - Math.abs(dy);

    if (overlapX < overlapY) {
      const sign = dx >= 0 ? 1 : -1;
      a.x += overlapX * .5 * sign;
      b.x -= overlapX * .5 * sign;
      const av = a.vx;
      a.vx = b.vx;
      b.vx = av;
    } else {
      const sign = dy >= 0 ? 1 : -1;
      a.y += overlapY * .5 * sign;
      b.y -= overlapY * .5 * sign;
      const av = a.vy;
      a.vy = b.vy;
      b.vy = av;
    }
  }

  function bumperRects(sr) {
    const candidates = [
      ['statement', document.querySelector('.pv2-overview__statement')],
      ['ux-work', document.querySelector('.pv2-gateway-link--ux')],
      ['all-games', document.querySelector('.pv2-gateway-link--unfinished')],
    ];

    return candidates
      .filter(([, el]) => el?.isConnected)
      .map(([id, el]) => {
        const r = el.getBoundingClientRect();
        return {
          id,
          el,
          x: r.left - sr.left,
          y: r.top - sr.top,
          w: r.width,
          h: r.height,
        };
      });
  }

  function resolveBumper(body, bumper, now) {
    if (!overlaps(bodyRect(body), bumper, BUMPER_GAP)) return false;

    const dx = (body.x + body.w / 2) - (bumper.x + bumper.w / 2) || .01;
    const dy = (body.y + body.h / 2) - (bumper.y + bumper.h / 2) || .01;
    const overlapX = (body.w + bumper.w) / 2 + BUMPER_GAP - Math.abs(dx);
    const overlapY = (body.h + bumper.h) / 2 + BUMPER_GAP - Math.abs(dy);

    registerBumperHit(body, bumper, now);

    if (overlapX < overlapY) {
      const sign = dx >= 0 ? 1 : -1;
      body.x += overlapX * sign;
      body.vx = Math.max(Math.abs(body.vx), NORMAL_SPEED * 1.7) * sign;
    } else {
      const sign = dy >= 0 ? 1 : -1;
      body.y += overlapY * sign;
      body.vy = Math.max(Math.abs(body.vy), NORMAL_SPEED * 1.7) * sign;
    }
    return true;
  }

  function makeBody(el, index, sr) {
    el.style.transform = '';
    el.style.removeProperty('--pv2-scroll-drift-y');

    const rect = el.getBoundingClientRect();
    const anchor = anchorFor(el, sr.width, sr.height);
    const minY = stageTopLimit(sr);
    const x = clamp(anchor.x - rect.width / 2, EDGE_PADDING, sr.width - rect.width - EDGE_PADDING);
    const y = clamp(anchor.y - rect.height / 2, minY, sr.height - rect.height - EDGE_PADDING);
    const angle = .55 + index * 1.19;
    const speed = reducedMotion() ? REDUCED_SPEED : NORMAL_SPEED;

    el.style.position = 'absolute';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transition = 'none';

    return {
      el,
      target: el.querySelector('.pv2-project-tile') || el,
      x,
      y,
      w: rect.width,
      h: rect.height,
      homeX: x,
      homeY: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      phase: index * 1.41 + .7,
      pointerInside: false,
      lastPointerHit: -Infinity,
      lastBumperHits: new Map(),
    };
  }

  function handlePointerMove(event) {
    const now = performance.now();
    const dt = Math.max(8, now - pointer.t || 16);
    const vx = (event.clientX - pointer.x) / dt;
    const vy = (event.clientY - pointer.y) / dt;
    pointer = { x: event.clientX, y: event.clientY, px: pointer.x, py: pointer.y, t: now };

    if (!stage || window.innerWidth <= MOBILE_BREAKPOINT) return;

    for (const body of bodies) {
      const r = body.el.getBoundingClientRect();
      const inside = event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;

      if (inside && !body.pointerInside && now - body.lastPointerHit >= POINTER_COOLDOWN) {
        let dx = vx;
        let dy = vy;
        let len = Math.hypot(dx, dy);
        if (len < .01) {
          dx = r.left + r.width / 2 - event.clientX;
          dy = r.top + r.height / 2 - event.clientY;
          len = Math.hypot(dx, dy) || 1;
        }
        const pointerSpeed = Math.hypot(vx, vy);
        const impulse = clamp(POINTER_MIN_IMPULSE + pointerSpeed * .22, POINTER_MIN_IMPULSE, POINTER_IMPULSE);
        body.vx += (dx / len) * impulse;
        body.vy += (dy / len) * impulse;
        body.lastPointerHit = now;
        impactBurst(event.clientX, event.clientY, r);
        activateGame();
      }

      body.pointerInside = inside;
    }
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
    const speedFloor = reducedMotion() ? REDUCED_SPEED : NORMAL_SPEED;
    const maxSpeed = reducedMotion() ? REDUCED_MAX_SPEED : MAX_SPEED;
    const t = now / 1000;

    for (const body of bodies) {
      body.vx += (body.homeX - body.x) * HOME_PULL * dt;
      body.vy += (body.homeY - body.y) * HOME_PULL * dt;
      if (!reducedMotion()) {
        body.vx += Math.sin(t * .41 + body.phase) * .000014 * dt;
        body.vy += Math.cos(t * .37 + body.phase * 1.23) * .000014 * dt;
      }
      body.vx *= Math.pow(DAMPING, dt);
      body.vy *= Math.pow(DAMPING, dt);

      const speed = Math.hypot(body.vx, body.vy);
      if (speed < speedFloor) {
        const a = body.phase + t * .16;
        body.vx += Math.cos(a) * (speedFloor - speed) * .16;
        body.vy += Math.sin(a) * (speedFloor - speed) * .16;
      }

      body.vx = clamp(body.vx, -maxSpeed, maxSpeed);
      body.vy = clamp(body.vy, -maxSpeed, maxSpeed);
      body.x += body.vx * dt;
      body.y += body.vy * dt;
      constrain(body, sr);
    }

    for (let pass = 0; pass < 2; pass += 1) {
      for (let i = 0; i < bodies.length; i += 1) {
        for (let j = i + 1; j < bodies.length; j += 1) resolveBodyPair(bodies[i], bodies[j]);
      }
      const bumpers = bumperRects(sr);
      for (const body of bodies) {
        for (const bumper of bumpers) resolveBumper(body, bumper, now);
        constrain(body, sr);
      }
    }

    for (const body of bodies) {
      body.el.style.left = `${body.x.toFixed(2)}px`;
      body.el.style.top = `${body.y.toFixed(2)}px`;
    }

    mark(reducedMotion() ? 'running-reduced' : gameActive ? 'running-game' : 'running');
    frame = requestAnimationFrame(tick);
  }

  function teardown() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    bodies = [];
    lastTime = 0;
    setScoreVisible(false);
  }

  function init() {
    teardown();
    stage = document.querySelector('.pv2-overview__stage');
    if (!stage || window.innerWidth <= MOBILE_BREAKPOINT) {
      mark(window.innerWidth <= MOBILE_BREAKPOINT ? 'mobile-static' : 'waiting-for-overview');
      return;
    }

    // Only project images are dynamic game bodies. The text remains fixed and
    // is sampled directly from the DOM as scoring bumpers every frame.
    const elements = [...stage.querySelectorAll('.pv2-float-slot')]
      .filter((el) => el.querySelector('.pv2-project-tile'));
    if (!elements.length) { mark('waiting-for-bodies'); return; }

    const sr = stage.getBoundingClientRect();
    bodies = elements.map((el, i) => makeBody(el, i, sr));

    // Resolve any authored starting overlap without scoring. Rendering and
    // collision now use the exact same x/y values from this single simulation.
    for (let pass = 0; pass < 20; pass += 1) {
      for (let i = 0; i < bodies.length; i += 1) {
        for (let j = i + 1; j < bodies.length; j += 1) resolveBodyPair(bodies[i], bodies[j]);
      }
      const bumpers = bumperRects(sr);
      for (const body of bodies) {
        for (const bumper of bumpers) resolveBumper(body, bumper, performance.now());
        constrain(body, sr);
      }
    }

    for (const body of bodies) {
      body.homeX = body.x;
      body.homeY = body.y;
      body.el.style.left = `${body.x}px`;
      body.el.style.top = `${body.y}px`;
    }

    if (gameActive) setScoreVisible(true);
    mark('initialized');
    frame = requestAnimationFrame(tick);
  }

  const observer = new MutationObserver(() => {
    clearTimeout(mutationTimer);
    mutationTimer = window.setTimeout(() => {
      const hasOverview = Boolean(document.querySelector('.pv2-overview__stage'));
      if (hasOverview && (!stage || !stage.isConnected || !frame)) init();
      if (!hasOverview && stage) {
        teardown();
        stage = null;
        mark('inactive');
      }
    }, 40);
  });

  function start() {
    mark('script-loaded');
    ensureScoreCounter();
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('resize', () => {
      clearTimeout(mutationTimer);
      mutationTimer = window.setTimeout(init, 100);
    });
    init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();