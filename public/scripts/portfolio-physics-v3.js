(() => {
  const MOBILE_BREAKPOINT = 720;
  const EDGE_PADDING = 16;
  const NAV_CLEARANCE = 18;
  const BODY_GAP = 10;
  const NORMAL_SPEED = 0.038;
  const REDUCED_SPEED = 0.012;
  const POINTER_IMPULSE = 0.18;
  const POINTER_MIN_IMPULSE = 0.11;
  const HOME_PULL = 0.00000042;
  const DAMPING = 0.9992;
  const MAX_SPEED = 0.66;
  const REDUCED_MAX_SPEED = 0.08;
  const POINTER_COOLDOWN = 85;
  const BUMPER_KICK = 0.48;

  let frame = 0;
  let stage = null;
  let bodies = [];
  let lastTime = 0;
  let mutationTimer = 0;
  let scoreCounter = null;
  let scoreValue = null;
  let gameActive = false;
  let points = 0;
  let pointer = { x: -9999, y: -9999, t: 0 };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
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

  function updateScore(delta, bumperId, impact) {
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
    window.dispatchEvent(new CustomEvent('pv2:score', {
      detail: {
        points,
        delta,
        bumperId,
        impactX: impact?.x,
        impactY: impact?.y,
      },
    }));
  }

  function pulseBumper(el) {
    if (!el?.isConnected) return;
    el.animate([
      { scale: '1', filter: 'brightness(1)' },
      { scale: '1.13', filter: 'brightness(.9)', offset: 0.24 },
      { scale: '.965', filter: 'brightness(1.04)', offset: 0.55 },
      { scale: '1.025', filter: 'brightness(.98)', offset: 0.78 },
      { scale: '1', filter: 'brightness(1)' },
    ], {
      duration: reducedMotion() ? 180 : 440,
      easing: 'cubic-bezier(.16,.88,.24,1)',
    });
  }

  function classString(slot) {
    const child = slot.querySelector('.pv2-project-tile');
    return `${slot.className} ${child?.className || ''}`;
  }

  function anchorFor(slot, width, height) {
    const classes = classString(slot);
    if (classes.includes('project-tile--top')) return { x: width * .50, y: height * .13 };
    if (classes.includes('project-tile--left')) return { x: width * .14, y: height * .47 };
    if (classes.includes('project-tile--right')) return { x: width * .86, y: height * .46 };
    if (classes.includes('project-tile--bottom-left')) return { x: width * .31, y: height * .80 };
    if (classes.includes('project-tile--bottom-right')) return { x: width * .69, y: height * .80 };
    return { x: width * .5, y: height * .5 };
  }

  function stageTopLimit(stageRect) {
    const nav = document.querySelector('.pv2-nav');
    if (!nav) return EDGE_PADDING;
    return Math.max(EDGE_PADDING, nav.getBoundingClientRect().bottom - stageRect.top + NAV_CLEARANCE);
  }

  function constrain(body, stageRect) {
    const minY = stageTopLimit(stageRect);
    const maxX = Math.max(EDGE_PADDING, stageRect.width - body.w - EDGE_PADDING);
    const maxY = Math.max(minY, stageRect.height - body.h - EDGE_PADDING);
    if (body.x < EDGE_PADDING) { body.x = EDGE_PADDING; body.vx = Math.abs(body.vx); }
    if (body.x > maxX) { body.x = maxX; body.vx = -Math.abs(body.vx); }
    if (body.y < minY) { body.y = minY; body.vy = Math.abs(body.vy); }
    if (body.y > maxY) { body.y = maxY; body.vy = -Math.abs(body.vy); }
  }

  function bodyRect(body) {
    return { x: body.x, y: body.y, w: body.w, h: body.h };
  }

  function resolveBodyPair(a, b) {
    if (!overlaps(bodyRect(a), bodyRect(b), BODY_GAP)) return false;
    const dx = (a.x + a.w / 2) - (b.x + b.w / 2) || .01;
    const dy = (a.y + a.h / 2) - (b.y + b.h / 2) || .01;
    const overlapX = (a.w + b.w) / 2 + BODY_GAP - Math.abs(dx);
    const overlapY = (a.h + b.h) / 2 + BODY_GAP - Math.abs(dy);
    if (overlapX < overlapY) {
      const sign = dx >= 0 ? 1 : -1;
      a.x += overlapX * .5 * sign;
      b.x -= overlapX * .5 * sign;
      const av = a.vx; a.vx = b.vx; b.vx = av;
    } else {
      const sign = dy >= 0 ? 1 : -1;
      a.y += overlapY * .5 * sign;
      b.y -= overlapY * .5 * sign;
      const av = a.vy; a.vy = b.vy; b.vy = av;
    }
    if (a.armed || b.armed) { a.armed = true; b.armed = true; }
    return true;
  }

  function bumperRects(stageRect) {
    const candidates = [
      ['statement', document.querySelector('.pv2-overview__statement')],
      ['ux-work', document.querySelector('.pv2-gateway-link--ux')],
      ['all-games', document.querySelector('.pv2-gateway-link--unfinished')],
    ];
    return candidates
      .filter(([, el]) => el?.isConnected)
      .map(([id, el]) => {
        const rect = el.getBoundingClientRect();
        return {
          id,
          el,
          x: rect.left - stageRect.left,
          y: rect.top - stageRect.top,
          w: rect.width,
          h: rect.height,
          viewport: rect,
        };
      });
  }

  function impactPoint(body, bumper, horizontal) {
    const bodyCenterX = body.x + body.w / 2;
    const bodyCenterY = body.y + body.h / 2;
    if (horizontal) {
      const hitRight = bodyCenterX >= bumper.x + bumper.w / 2;
      return {
        x: hitRight ? bumper.viewport.right : bumper.viewport.left,
        y: clamp(bumper.viewport.top + (bodyCenterY - bumper.y), bumper.viewport.top, bumper.viewport.bottom),
      };
    }
    const hitBottom = bodyCenterY >= bumper.y + bumper.h / 2;
    return {
      x: clamp(bumper.viewport.left + (bodyCenterX - bumper.x), bumper.viewport.left, bumper.viewport.right),
      y: hitBottom ? bumper.viewport.bottom : bumper.viewport.top,
    };
  }

  function resolveBumper(body, bumper, entering) {
    if (!overlaps(bodyRect(body), bumper, 0)) return false;
    const dx = (body.x + body.w / 2) - (bumper.x + bumper.w / 2) || .01;
    const dy = (body.y + body.h / 2) - (bumper.y + bumper.h / 2) || .01;
    const overlapX = (body.w + bumper.w) / 2 - Math.abs(dx);
    const overlapY = (body.h + bumper.h) / 2 - Math.abs(dy);
    const horizontal = overlapX < overlapY;
    const poweredHit = entering && body.armed && gameActive;

    if (poweredHit) {
      pulseBumper(bumper.el);
      updateScore(1, bumper.id, impactPoint(body, bumper, horizontal));
    }

    const kick = poweredHit ? BUMPER_KICK : NORMAL_SPEED * 1.8;
    if (horizontal) {
      const sign = dx >= 0 ? 1 : -1;
      body.x += Math.max(0, overlapX) * sign;
      body.vx = kick * sign;
      if (poweredHit) body.vy *= 1.12;
    } else {
      const sign = dy >= 0 ? 1 : -1;
      body.y += Math.max(0, overlapY) * sign;
      body.vy = kick * sign;
      if (poweredHit) body.vx *= 1.12;
    }
    return true;
  }

  function makeBody(el, index, stageRect) {
    el.style.transform = '';
    el.style.removeProperty('--pv2-scroll-drift-y');
    const rect = el.getBoundingClientRect();
    const anchor = anchorFor(el, stageRect.width, stageRect.height);
    const minY = stageTopLimit(stageRect);
    const x = clamp(anchor.x - rect.width / 2, EDGE_PADDING, stageRect.width - rect.width - EDGE_PADDING);
    const y = clamp(anchor.y - rect.height / 2, minY, stageRect.height - rect.height - EDGE_PADDING);
    const angle = .55 + index * 1.19;
    const speed = reducedMotion() ? REDUCED_SPEED : NORMAL_SPEED;
    el.style.position = 'absolute';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transition = 'none';
    return {
      el, x, y, w: rect.width, h: rect.height,
      homeX: x, homeY: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      phase: index * 1.41 + .7,
      pointerInside: false,
      lastPointerHit: -Infinity,
      contacts: new Set(),
      armed: false,
    };
  }

  function handlePointerMove(event) {
    const now = performance.now();
    const dt = Math.max(8, now - pointer.t || 16);
    const mouseVx = (event.clientX - pointer.x) / dt;
    const mouseVy = (event.clientY - pointer.y) / dt;
    pointer = { x: event.clientX, y: event.clientY, t: now };
    if (!stage || window.innerWidth <= MOBILE_BREAKPOINT) return;

    for (const body of bodies) {
      const rect = body.el.getBoundingClientRect();
      const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (inside && !body.pointerInside && now - body.lastPointerHit >= POINTER_COOLDOWN) {
        let dx = mouseVx;
        let dy = mouseVy;
        let length = Math.hypot(dx, dy);
        if (length < .01) {
          dx = rect.left + rect.width / 2 - event.clientX;
          dy = rect.top + rect.height / 2 - event.clientY;
          length = Math.hypot(dx, dy) || 1;
        }
        const pointerSpeed = Math.hypot(mouseVx, mouseVy);
        const impulse = clamp(POINTER_MIN_IMPULSE + pointerSpeed * .24, POINTER_MIN_IMPULSE, POINTER_IMPULSE);
        body.vx += (dx / length) * impulse;
        body.vy += (dy / length) * impulse;
        body.lastPointerHit = now;
        body.armed = true;
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
    const stageRect = stage.getBoundingClientRect();
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
        const angle = body.phase + t * .16;
        body.vx += Math.cos(angle) * (speedFloor - speed) * .16;
        body.vy += Math.sin(angle) * (speedFloor - speed) * .16;
      }
      body.vx = clamp(body.vx, -maxSpeed, maxSpeed);
      body.vy = clamp(body.vy, -maxSpeed, maxSpeed);
      body.x += body.vx * dt;
      body.y += body.vy * dt;
      constrain(body, stageRect);
    }

    for (let pass = 0; pass < 2; pass += 1) {
      for (let i = 0; i < bodies.length; i += 1) {
        for (let j = i + 1; j < bodies.length; j += 1) resolveBodyPair(bodies[i], bodies[j]);
      }
    }

    const bumpers = bumperRects(stageRect);
    for (const body of bodies) {
      const nextContacts = new Set();
      for (const bumper of bumpers) {
        if (!overlaps(bodyRect(body), bumper, 0)) continue;
        const entering = !body.contacts.has(bumper.id);
        nextContacts.add(bumper.id);
        resolveBumper(body, bumper, entering);
      }
      body.contacts = nextContacts;
      constrain(body, stageRect);
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
    const elements = [...stage.querySelectorAll('.pv2-float-slot')].filter((el) => el.querySelector('.pv2-project-tile'));
    if (!elements.length) { mark('waiting-for-bodies'); return; }

    const stageRect = stage.getBoundingClientRect();
    bodies = elements.map((el, index) => makeBody(el, index, stageRect));
    for (let pass = 0; pass < 20; pass += 1) {
      for (let i = 0; i < bodies.length; i += 1) {
        for (let j = i + 1; j < bodies.length; j += 1) resolveBodyPair(bodies[i], bodies[j]);
      }
      const bumpers = bumperRects(stageRect);
      for (const body of bodies) {
        for (const bumper of bumpers) resolveBumper(body, bumper, false);
        constrain(body, stageRect);
      }
    }

    for (const body of bodies) {
      body.homeX = body.x;
      body.homeY = body.y;
      body.contacts.clear();
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
