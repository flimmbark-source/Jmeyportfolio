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
  const BUMPER_SCORE_COOLDOWN = 360;
  const WALL_SCORE_COOLDOWN = 220;
  const GHOST_COLORS = ['#ff3366', '#7c3cff', '#00b894', '#ff9f1a', '#1597ff', '#e843d5', '#ff5f00'];

  const UPGRADES = [
    { id: 'bounce-1', tier: 0, title: 'Better Bounces', cost: 5, desc: '+1 point per text bounce', requires: [] },
    { id: 'speed-1', tier: 1, title: 'Faster Drift', cost: 12, desc: '+25% movement speed', requires: ['bounce-1'] },
    { id: 'walls-1', tier: 1, title: 'Wall Points', cost: 16, desc: 'Wall bounces earn +1 point', requires: ['bounce-1'] },
    { id: 'bounce-2', tier: 2, title: 'More Bounce', cost: 28, desc: '+1 point per text bounce', requires: ['speed-1'] },
    { id: 'velocity-1', tier: 2, title: 'More Velocity', cost: 32, desc: '+30% top speed and harder bumper kicks', requires: ['speed-1'] },
    { id: 'walls-2', tier: 2, title: 'Harder Walls', cost: 36, desc: '+1 point per wall bounce', requires: ['walls-1'] },
    { id: 'bounce-3', tier: 3, title: 'Bounce Value', cost: 65, desc: '+2 points per text bounce', requires: ['bounce-2'] },
    { id: 'friction-1', tier: 3, title: 'Less Friction', cost: 55, desc: 'Blocks keep their speed much longer', requires: ['velocity-1'] },
    { id: 'walls-3', tier: 3, title: 'Wall Value', cost: 70, desc: '+2 points per wall bounce', requires: ['walls-2'] },
    { id: 'momentum-1', tier: 4, title: 'Momentum', cost: 110, desc: '+25% movement speed and +20% top speed', requires: ['bounce-3', 'friction-1'] },
  ];

  let frame = 0;
  let stage = null;
  let bodies = [];
  let lastTime = 0;
  let mutationTimer = 0;
  let scoreCounter = null;
  let scoreValue = null;
  let gameActive = false;
  let points = 0;
  let ghostColorIndex = 0;
  let fxLayer = null;
  let upgradeOverlay = null;
  let upgradeTree = null;
  const purchased = new Set();
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

  function hasUpgrade(id) {
    return purchased.has(id);
  }

  function upgradeUnlocked(upgrade) {
    return upgrade.requires.every((id) => purchased.has(id));
  }

  function currentEffects() {
    let bumperValue = 1;
    let wallValue = 0;
    let speedMult = 1;
    let maxSpeedMult = 1;
    let bumperKickMult = 1;
    let damping = DAMPING;

    if (hasUpgrade('bounce-1')) bumperValue += 1;
    if (hasUpgrade('bounce-2')) bumperValue += 1;
    if (hasUpgrade('bounce-3')) bumperValue += 2;
    if (hasUpgrade('walls-1')) wallValue += 1;
    if (hasUpgrade('walls-2')) wallValue += 1;
    if (hasUpgrade('walls-3')) wallValue += 2;
    if (hasUpgrade('speed-1')) speedMult *= 1.25;
    if (hasUpgrade('velocity-1')) {
      maxSpeedMult *= 1.3;
      bumperKickMult *= 1.3;
    }
    if (hasUpgrade('friction-1')) damping = 0.99972;
    if (hasUpgrade('momentum-1')) {
      speedMult *= 1.25;
      maxSpeedMult *= 1.2;
    }

    return { bumperValue, wallValue, speedMult, maxSpeedMult, bumperKickMult, damping };
  }

  function lowestAffordableUpgrade() {
    return UPGRADES
      .filter((upgrade) => !purchased.has(upgrade.id) && upgradeUnlocked(upgrade))
      .sort((a, b) => a.cost - b.cost)[0] || null;
  }

  function refreshUpgradeCue() {
    if (!scoreCounter?.isConnected) return;
    const next = lowestAffordableUpgrade();
    scoreCounter.classList.toggle('has-upgrade', Boolean(next && points >= next.cost));
  }

  function ensureFxLayer() {
    if (fxLayer?.isConnected) return fxLayer;
    fxLayer = document.createElement('div');
    fxLayer.setAttribute('aria-hidden', 'true');
    Object.assign(fxLayer.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      overflow: 'visible',
      zIndex: '6000',
    });
    document.body.appendChild(fxLayer);
    return fxLayer;
  }

  function ensureScoreCounter() {
    if (scoreCounter?.isConnected) return scoreCounter;
    scoreCounter = document.createElement('div');
    scoreCounter.className = 'pv2-score-counter';
    scoreCounter.setAttribute('role', 'button');
    scoreCounter.setAttribute('tabindex', '0');
    scoreCounter.setAttribute('aria-label', 'Open upgrades');
    scoreCounter.innerHTML = '<span class="pv2-score-counter__label">Points</span><strong class="pv2-score-counter__value">0</strong>';
    scoreValue = scoreCounter.querySelector('.pv2-score-counter__value');
    scoreValue.textContent = String(points);
    scoreCounter.addEventListener('click', openUpgradeTree);
    scoreCounter.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openUpgradeTree();
      }
    });
    document.body.appendChild(scoreCounter);
    refreshUpgradeCue();
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

  function refreshUpgradeTree() {
    if (!upgradeTree?.isConnected) return;
    const pointsDisplay = upgradeTree.querySelector('[data-upgrade-points]');
    if (pointsDisplay) pointsDisplay.textContent = String(points);

    upgradeTree.querySelectorAll('[data-upgrade-id]').forEach((button) => {
      const upgrade = UPGRADES.find((item) => item.id === button.dataset.upgradeId);
      if (!upgrade) return;
      const bought = purchased.has(upgrade.id);
      const unlocked = upgradeUnlocked(upgrade);
      const affordable = unlocked && !bought && points >= upgrade.cost;
      button.classList.toggle('is-bought', bought);
      button.classList.toggle('is-locked', !unlocked);
      button.classList.toggle('is-affordable', affordable);
      button.disabled = bought || !unlocked || !affordable;
      button.setAttribute('aria-label', bought ? `${upgrade.title}, purchased` : `${upgrade.title}, costs ${upgrade.cost} points`);
      const cost = button.querySelector('.pv2-upgrade-node__cost');
      if (cost) cost.textContent = bought ? 'BOUGHT' : `${upgrade.cost} PTS`;
    });
  }

  function buildUpgradeTree() {
    if (upgradeOverlay?.isConnected) return;

    upgradeOverlay = document.createElement('div');
    upgradeOverlay.className = 'pv2-upgrade-overlay';
    upgradeOverlay.innerHTML = `
      <section class="pv2-upgrade-panel" role="dialog" aria-modal="true" aria-label="Incremental upgrade tree">
        <header class="pv2-upgrade-panel__header">
          <div>
            <div class="pv2-upgrade-panel__eyebrow">Incremental Tree</div>
            <h2>Make the blocks go brrr.</h2>
          </div>
          <div class="pv2-upgrade-panel__currency"><span data-upgrade-points>${points}</span> points</div>
          <button class="pv2-upgrade-close" type="button" aria-label="Close upgrades">×</button>
        </header>
        <div class="pv2-upgrade-tree"></div>
      </section>
    `;

    upgradeTree = upgradeOverlay.querySelector('.pv2-upgrade-tree');
    const maxTier = Math.max(...UPGRADES.map((upgrade) => upgrade.tier));
    for (let tier = 0; tier <= maxTier; tier += 1) {
      const row = document.createElement('div');
      row.className = 'pv2-upgrade-tier';
      row.dataset.tier = String(tier);
      const tierUpgrades = UPGRADES.filter((upgrade) => upgrade.tier === tier);
      tierUpgrades.forEach((upgrade) => {
        const node = document.createElement('button');
        node.type = 'button';
        node.className = 'pv2-upgrade-node';
        node.dataset.upgradeId = upgrade.id;
        node.innerHTML = `
          <span class="pv2-upgrade-node__title">${upgrade.title}</span>
          <span class="pv2-upgrade-node__desc">${upgrade.desc}</span>
          <span class="pv2-upgrade-node__cost">${upgrade.cost} PTS</span>
        `;
        node.addEventListener('click', () => buyUpgrade(upgrade.id));
        row.appendChild(node);
      });
      upgradeTree.appendChild(row);
      if (tier < maxTier) {
        const connector = document.createElement('div');
        connector.className = 'pv2-upgrade-connector';
        connector.setAttribute('aria-hidden', 'true');
        upgradeTree.appendChild(connector);
      }
    }

    upgradeOverlay.querySelector('.pv2-upgrade-close').addEventListener('click', closeUpgradeTree);
    upgradeOverlay.addEventListener('pointerdown', (event) => {
      if (event.target === upgradeOverlay) closeUpgradeTree();
    });
    document.body.appendChild(upgradeOverlay);
    refreshUpgradeTree();
  }

  function openUpgradeTree() {
    buildUpgradeTree();
    refreshUpgradeTree();
    upgradeOverlay.classList.add('is-open');
    document.documentElement.classList.add('pv2-upgrades-open');
    requestAnimationFrame(() => upgradeOverlay.querySelector('.pv2-upgrade-close')?.focus());
  }

  function closeUpgradeTree() {
    if (!upgradeOverlay?.isConnected) return;
    upgradeOverlay.classList.remove('is-open');
    document.documentElement.classList.remove('pv2-upgrades-open');
    scoreCounter?.focus();
  }

  function buyUpgrade(id) {
    const upgrade = UPGRADES.find((item) => item.id === id);
    if (!upgrade || purchased.has(id) || !upgradeUnlocked(upgrade) || points < upgrade.cost) return;
    points -= upgrade.cost;
    purchased.add(id);
    ensureScoreCounter();
    scoreValue.textContent = String(points);
    refreshUpgradeCue();
    refreshUpgradeTree();
    try {
      scoreCounter.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(.94)', offset: .42 },
        { transform: 'scale(1)' },
      ], { duration: 180, easing: 'ease-out' });
    } catch {}
  }

  function updateScore(delta, bumperId, impact) {
    points += delta;
    ensureScoreCounter();
    scoreValue.textContent = String(points);
    refreshUpgradeCue();
    refreshUpgradeTree();
    if (!reducedMotion()) {
      try {
        scoreCounter.animate([
          { transform: 'translateY(0) scale(1)' },
          { transform: 'translateY(0) scale(1.08)', offset: 0.42 },
          { transform: 'translateY(0) scale(1)' },
        ], { duration: 170, easing: 'cubic-bezier(.2,.9,.25,1)' });
      } catch {}
    }
    window.dispatchEvent(new CustomEvent('pv2:score-state', {
      detail: { points, delta, bumperId, impactX: impact?.x, impactY: impact?.y },
    }));
  }

  function pulseBumper(el) {
    if (!el?.isConnected) return;
    try {
      el.animate([
        { scale: '1', filter: 'brightness(1)' },
        { scale: '1.14', filter: 'brightness(.9)', offset: 0.22 },
        { scale: '.96', filter: 'brightness(1.04)', offset: 0.52 },
        { scale: '1.025', filter: 'brightness(.98)', offset: 0.76 },
        { scale: '1', filter: 'brightness(1)' },
      ], {
        duration: reducedMotion() ? 220 : 500,
        easing: 'cubic-bezier(.16,.88,.24,1)',
      });
    } catch {}
  }

  function nearestEdgePoint(event, rect) {
    const x = clamp(event.clientX, rect.left, rect.right);
    const y = clamp(event.clientY, rect.top, rect.bottom);
    const options = [
      { edge: 'left', d: Math.abs(event.clientX - rect.left) },
      { edge: 'right', d: Math.abs(rect.right - event.clientX) },
      { edge: 'top', d: Math.abs(event.clientY - rect.top) },
      { edge: 'bottom', d: Math.abs(rect.bottom - event.clientY) },
    ].sort((a, b) => a.d - b.d);
    const edge = options[0].edge;
    if (edge === 'left') return { x: rect.left, y, outward: Math.PI };
    if (edge === 'right') return { x: rect.right, y, outward: 0 };
    if (edge === 'top') return { x, y: rect.top, outward: -Math.PI / 2 };
    return { x, y: rect.bottom, outward: Math.PI / 2 };
  }

  function spawnImpactLines(event, rect) {
    if (window.innerWidth <= MOBILE_BREAKPOINT || !rect) return;
    const layer = ensureFxLayer();
    const impact = nearestEdgePoint(event, rect);
    const count = 8;

    for (let i = 0; i < count; i += 1) {
      const t = i / (count - 1);
      const angle = impact.outward - Math.PI / 2 + t * Math.PI;
      const distance = 24 + Math.random() * 12;
      const length = 10 + Math.random() * 7;
      const line = document.createElement('span');
      Object.assign(line.style, {
        position: 'fixed',
        left: `${impact.x}px`,
        top: `${impact.y}px`,
        width: `${length}px`,
        height: '2.5px',
        background: 'rgba(24,24,24,.95)',
        transformOrigin: '0 50%',
        pointerEvents: 'none',
        opacity: '0',
      });
      layer.appendChild(line);
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      try {
        const animation = line.animate([
          { opacity: 0, transform: `translate(0,-50%) rotate(${angle}rad) scaleX(.2)` },
          { opacity: 1, offset: .08, transform: `translate(${dx * .12}px,calc(${dy * .12}px - 50%)) rotate(${angle}rad) scaleX(1)` },
          { opacity: .9, offset: .78, transform: `translate(${dx * .68}px,calc(${dy * .68}px - 50%)) rotate(${angle}rad) scaleX(.86)` },
          { opacity: 0, transform: `translate(${dx}px,calc(${dy}px - 50%)) rotate(${angle}rad) scaleX(.55)` },
        ], { duration: 375, easing: 'linear', fill: 'forwards' });
        animation.addEventListener('finish', () => line.remove(), { once: true });
      } catch {
        line.style.opacity = '1';
        window.setTimeout(() => line.remove(), 375);
      }
    }
  }

  function spawnPointGhost(impact, amount = 1) {
    if (!impact) return;
    const layer = ensureFxLayer();
    const ghost = document.createElement('span');
    const color = GHOST_COLORS[ghostColorIndex % GHOST_COLORS.length];
    ghostColorIndex += 1;
    ghost.textContent = `+${amount}`;
    Object.assign(ghost.style, {
      position: 'fixed',
      left: `${impact.x}px`,
      top: `${impact.y}px`,
      zIndex: '2',
      color,
      fontFamily: 'system-ui, sans-serif',
      fontSize: 'clamp(2.4rem, 3.4vw, 3.6rem)',
      fontWeight: '950',
      lineHeight: '.9',
      letterSpacing: '-.07em',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      WebkitTextStroke: '1px rgba(255,255,255,.78)',
      textShadow: `0 2px 0 rgba(255,255,255,.95), 0 5px 18px ${color}66`,
      transformOrigin: '50% 100%',
      opacity: '0',
    });
    layer.appendChild(ghost);

    try {
      const animation = ghost.animate([
        { opacity: 0, transform: 'translate(-50%, 2px) scale(.3)' },
        { opacity: 1, offset: .06, transform: 'translate(-50%, -30px) scale(1.42)' },
        { opacity: 1, offset: .15, transform: 'translate(-50%, -38px) scale(1)' },
        { opacity: 1, offset: .68, transform: 'translate(-50%, -42px) scale(1)' },
        { opacity: 1, offset: .82, transform: 'translate(-50%, -50px) scale(1.03)' },
        { opacity: 0, transform: 'translate(-50%, -126px) scale(.94)' },
      ], { duration: reducedMotion() ? 1600 : 2400, easing: 'linear', fill: 'forwards' });
      animation.addEventListener('finish', () => ghost.remove(), { once: true });
    } catch {
      ghost.style.opacity = '1';
      ghost.style.transform = 'translate(-50%, -40px)';
      window.setTimeout(() => ghost.remove(), 2400);
    }
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

  function wallImpact(body, side, stageRect) {
    const rect = stage.getBoundingClientRect();
    if (side === 'left') return { x: rect.left + EDGE_PADDING, y: rect.top + body.y + body.h / 2 };
    if (side === 'right') return { x: rect.left + stageRect.width - EDGE_PADDING, y: rect.top + body.y + body.h / 2 };
    if (side === 'top') return { x: rect.left + body.x + body.w / 2, y: rect.top + stageTopLimit(stageRect) };
    return { x: rect.left + body.x + body.w / 2, y: rect.top + stageRect.height - EDGE_PADDING };
  }

  function scoreWallBounce(body, side, stageRect) {
    const effects = currentEffects();
    if (!gameActive || !body.armed || effects.wallValue <= 0) return;
    const now = performance.now();
    if (now - body.lastWallScore < WALL_SCORE_COOLDOWN) return;
    body.lastWallScore = now;
    const impact = wallImpact(body, side, stageRect);
    updateScore(effects.wallValue, `wall-${side}`, impact);
    spawnPointGhost(impact, effects.wallValue);
  }

  function constrain(body, stageRect, allowScore = true) {
    const minY = stageTopLimit(stageRect);
    const maxX = Math.max(EDGE_PADDING, stageRect.width - body.w - EDGE_PADDING);
    const maxY = Math.max(minY, stageRect.height - body.h - EDGE_PADDING);
    let hit = null;
    if (body.x < EDGE_PADDING) { body.x = EDGE_PADDING; body.vx = Math.abs(body.vx); hit = 'left'; }
    if (body.x > maxX) { body.x = maxX; body.vx = -Math.abs(body.vx); hit = 'right'; }
    if (body.y < minY) { body.y = minY; body.vy = Math.abs(body.vy); hit = 'top'; }
    if (body.y > maxY) { body.y = maxY; body.vy = -Math.abs(body.vy); hit = 'bottom'; }
    if (hit && allowScore) scoreWallBounce(body, hit, stageRect);
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
        return { id, el, x: rect.left - stageRect.left, y: rect.top - stageRect.top, w: rect.width, h: rect.height, viewport: rect };
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
    const effects = currentEffects();
    const dx = (body.x + body.w / 2) - (bumper.x + bumper.w / 2) || .01;
    const dy = (body.y + body.h / 2) - (bumper.y + bumper.h / 2) || .01;
    const overlapX = (body.w + bumper.w) / 2 - Math.abs(dx);
    const overlapY = (body.h + bumper.h) / 2 - Math.abs(dy);
    const horizontal = overlapX < overlapY;
    const now = performance.now();
    const lastBumperHit = body.bumperHits.get(bumper.id) ?? -Infinity;
    const poweredHit = entering && body.armed && gameActive && now - lastBumperHit >= BUMPER_SCORE_COOLDOWN;

    if (poweredHit) {
      body.bumperHits.set(bumper.id, now);
      const impact = impactPoint(body, bumper, horizontal);
      updateScore(effects.bumperValue, bumper.id, impact);
      spawnPointGhost(impact, effects.bumperValue);
      pulseBumper(bumper.el);
    }

    const kick = poweredHit ? BUMPER_KICK * effects.bumperKickMult : NORMAL_SPEED * 1.8;
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
      lastWallScore: -Infinity,
      contacts: new Set(),
      bumperHits: new Map(),
      armed: false,
    };
  }

  function handlePointerMove(event) {
    const now = performance.now();
    const dt = Math.max(8, now - pointer.t || 16);
    const mouseVx = (event.clientX - pointer.x) / dt;
    const mouseVy = (event.clientY - pointer.y) / dt;
    pointer = { x: event.clientX, y: event.clientY, t: now };
    if (!stage || window.innerWidth <= MOBILE_BREAKPOINT || document.documentElement.classList.contains('pv2-upgrades-open')) return;

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
        spawnImpactLines(event, rect);
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
    const effects = currentEffects();
    const speedFloor = (reducedMotion() ? REDUCED_SPEED : NORMAL_SPEED) * effects.speedMult;
    const maxSpeed = (reducedMotion() ? REDUCED_MAX_SPEED : MAX_SPEED) * effects.maxSpeedMult;
    const t = now / 1000;

    for (const body of bodies) {
      body.vx += (body.homeX - body.x) * HOME_PULL * dt;
      body.vy += (body.homeY - body.y) * HOME_PULL * dt;
      if (!reducedMotion()) {
        body.vx += Math.sin(t * .41 + body.phase) * .000014 * dt;
        body.vy += Math.cos(t * .37 + body.phase * 1.23) * .000014 * dt;
      }
      body.vx *= Math.pow(effects.damping, dt);
      body.vy *= Math.pow(effects.damping, dt);
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
      constrain(body, stageRect, true);
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
      constrain(body, stageRect, true);
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
        constrain(body, stageRect, false);
      }
    }

    for (const body of bodies) {
      body.homeX = body.x;
      body.homeY = body.y;
      body.contacts.clear();
      body.bumperHits.clear();
      body.lastWallScore = -Infinity;
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
    ensureFxLayer();
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && upgradeOverlay?.classList.contains('is-open')) closeUpgradeTree();
    });
    window.addEventListener('resize', () => {
      clearTimeout(mutationTimer);
      mutationTimer = window.setTimeout(init, 100);
    });
    init();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();