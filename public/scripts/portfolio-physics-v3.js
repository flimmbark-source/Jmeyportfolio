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
  const TREE_WIDTH = 1120;
  const TREE_HEIGHT = 760;
  const TREE_CENTER = { x: 560, y: 380 };
  const GHOST_COLORS = ['#ff3366', '#7c3cff', '#00b894', '#ff9f1a', '#1597ff', '#e843d5', '#ff5f00'];

  const UPGRADES = [
    { id: 'speed-1', branch: 'velocity', depth: 1, x: 560, y: 282, title: 'Faster Drift', effect: '+20% speed', cost: 10, requires: [] },
    { id: 'speed-accel', branch: 'velocity', depth: 2, x: 455, y: 176, title: 'Acceleration', effect: '+25% speed floor', cost: 24, requires: ['speed-1'] },
    { id: 'speed-top', branch: 'velocity', depth: 2, x: 665, y: 176, title: 'Top Speed', effect: '+25% velocity cap', cost: 28, requires: ['speed-1'] },
    { id: 'speed-launch', branch: 'velocity', depth: 3, x: 455, y: 72, title: 'Quick Launch', effect: '+35% mouse impulse', cost: 62, requires: ['speed-accel'] },

    { id: 'bounce-1', branch: 'bounce', depth: 1, x: 668, y: 380, title: 'Better Bounces', effect: '+1 / bumper', cost: 8, requires: [] },
    { id: 'bounce-force', branch: 'bounce', depth: 2, x: 790, y: 302, title: 'Bumper Force', effect: '+18% rebound', cost: 20, requires: ['bounce-1'] },
    { id: 'bounce-value', branch: 'bounce', depth: 2, x: 790, y: 458, title: 'Bounce Value', effect: '+1 / bumper', cost: 24, requires: ['bounce-1'] },
    { id: 'bounce-combo', branch: 'bounce', depth: 3, x: 930, y: 458, title: 'Combo Bounce', effect: '+1 / bumper', cost: 58, requires: ['bounce-value'] },

    { id: 'walls-1', branch: 'walls', depth: 1, x: 452, y: 380, title: 'Wall Points', effect: '+1 / wall', cost: 14, requires: [] },
    { id: 'walls-force', branch: 'walls', depth: 2, x: 330, y: 302, title: 'Hard Walls', effect: '+18% rebound', cost: 30, requires: ['walls-1'] },
    { id: 'walls-value', branch: 'walls', depth: 2, x: 330, y: 458, title: 'Wall Value', effect: '+1 / wall', cost: 32, requires: ['walls-1'] },
    { id: 'walls-ricochet', branch: 'walls', depth: 3, x: 190, y: 302, title: 'Ricochet', effect: '+25% wall kick', cost: 70, requires: ['walls-force'] },

    { id: 'friction-1', branch: 'friction', depth: 1, x: 560, y: 478, title: 'Less Friction', effect: '−15% drag', cost: 12, requires: [] },
    { id: 'friction-glide', branch: 'friction', depth: 2, x: 455, y: 584, title: 'Glide', effect: '−20% drag', cost: 26, requires: ['friction-1'] },
    { id: 'friction-collision', branch: 'friction', depth: 2, x: 665, y: 584, title: 'Collision Keep', effect: '+8% collision energy', cost: 30, requires: ['friction-1'] },
    { id: 'friction-low', branch: 'friction', depth: 3, x: 455, y: 688, title: 'Low Drag', effect: '−30% drag', cost: 68, requires: ['friction-glide'] },
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
    let pointerImpulseMult = 1;
    let wallKickMult = 1;
    let damping = DAMPING;
    let speedFloorMult = 1;
    let collisionBoost = 1;

    if (hasUpgrade('speed-1')) speedMult *= 1.2;
    if (hasUpgrade('speed-accel')) speedFloorMult *= 1.25;
    if (hasUpgrade('speed-top')) maxSpeedMult *= 1.25;
    if (hasUpgrade('speed-launch')) pointerImpulseMult *= 1.35;

    if (hasUpgrade('bounce-1')) bumperValue += 1;
    if (hasUpgrade('bounce-force')) bumperKickMult *= 1.18;
    if (hasUpgrade('bounce-value')) bumperValue += 1;
    if (hasUpgrade('bounce-combo')) bumperValue += 1;

    if (hasUpgrade('walls-1')) wallValue += 1;
    if (hasUpgrade('walls-force')) wallKickMult *= 1.18;
    if (hasUpgrade('walls-value')) wallValue += 1;
    if (hasUpgrade('walls-ricochet')) wallKickMult *= 1.25;

    if (hasUpgrade('friction-1')) damping = 0.99942;
    if (hasUpgrade('friction-glide')) damping = 0.99967;
    if (hasUpgrade('friction-collision')) collisionBoost = 1.08;
    if (hasUpgrade('friction-low')) {
      damping = 0.99984;
      speedFloorMult *= 1.12;
    }

    return {
      bumperValue,
      wallValue,
      speedMult,
      maxSpeedMult,
      bumperKickMult,
      pointerImpulseMult,
      wallKickMult,
      damping,
      speedFloorMult,
      collisionBoost,
    };
  }

  function cheapestAvailableUpgrade() {
    return UPGRADES
      .filter((upgrade) => !purchased.has(upgrade.id) && upgradeUnlocked(upgrade))
      .sort((a, b) => a.cost - b.cost)[0] || null;
  }

  function refreshUpgradeCue() {
    if (!scoreCounter?.isConnected) return;
    const next = cheapestAvailableUpgrade();
    scoreCounter.classList.toggle('has-upgrade', Boolean(next && points >= next.cost));
  }

  function ensureFxLayer() {
    if (fxLayer?.isConnected) return fxLayer;
    fxLayer = document.createElement('div');
    fxLayer.setAttribute('aria-hidden', 'true');
    Object.assign(fxLayer.style, {
      position: 'fixed', inset: '0', pointerEvents: 'none', overflow: 'visible', zIndex: '6000',
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

  function makeUpgradeNode(upgrade) {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = `pv2-upgrade-node pv2-upgrade-node--${upgrade.branch} pv2-upgrade-node--depth-${upgrade.depth}`;
    node.dataset.upgradeId = upgrade.id;
    node.dataset.branch = upgrade.branch;
    node.style.setProperty('--node-x', `${upgrade.x}px`);
    node.style.setProperty('--node-y', `${upgrade.y}px`);
    node.innerHTML = `
      <span class="pv2-upgrade-node__branch" aria-hidden="true"></span>
      <span class="pv2-upgrade-node__copy">
        <strong class="pv2-upgrade-node__title">${upgrade.title}</strong>
        <span class="pv2-upgrade-node__effect">${upgrade.effect}</span>
      </span>
      <span class="pv2-upgrade-node__cost">${upgrade.cost}</span>
    `;
    node.addEventListener('click', () => buyUpgrade(upgrade.id));
    return node;
  }

  function parentPoint(upgrade) {
    if (!upgrade.requires.length) return TREE_CENTER;
    const parent = UPGRADES.find((item) => item.id === upgrade.requires[0]);
    return parent ? { x: parent.x, y: parent.y } : TREE_CENTER;
  }

  function curvedPath(start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      const mx = start.x + dx * .5;
      return `M ${start.x} ${start.y} C ${mx} ${start.y}, ${mx} ${end.y}, ${end.x} ${end.y}`;
    }
    const my = start.y + dy * .5;
    return `M ${start.x} ${start.y} C ${start.x} ${my}, ${end.x} ${my}, ${end.x} ${end.y}`;
  }

  function refreshUpgradeTree() {
    if (!upgradeTree?.isConnected) return;
    const pointsDisplay = upgradeOverlay?.querySelector('[data-upgrade-points]');
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
      button.setAttribute('aria-label', bought ? `${upgrade.title}, purchased` : `${upgrade.title}, ${upgrade.effect}, costs ${upgrade.cost} points`);
      const cost = button.querySelector('.pv2-upgrade-node__cost');
      if (cost) cost.textContent = bought ? '✓' : String(upgrade.cost);

      const connector = upgradeTree.querySelector(`[data-connector-to="${upgrade.id}"]`);
      if (connector) {
        connector.classList.toggle('is-live', unlocked || bought);
        connector.classList.toggle('is-bought', bought);
      }
    });
  }

  function buildUpgradeTree() {
    if (upgradeOverlay?.isConnected) return;

    upgradeOverlay = document.createElement('div');
    upgradeOverlay.className = 'pv2-upgrade-overlay';
    upgradeOverlay.innerHTML = `
      <section class="pv2-upgrade-panel" role="dialog" aria-modal="true" aria-label="Kinetic upgrade tree">
        <header class="pv2-upgrade-panel__header">
          <div class="pv2-upgrade-panel__titleblock">
            <div class="pv2-upgrade-panel__eyebrow">Incremental Tree</div>
            <h2>Kinetic upgrades</h2>
          </div>
          <div class="pv2-upgrade-legend" aria-label="Upgrade branches">
            <span class="pv2-upgrade-legend__item pv2-upgrade-legend__item--velocity">Velocity</span>
            <span class="pv2-upgrade-legend__item pv2-upgrade-legend__item--bounce">Bounce</span>
            <span class="pv2-upgrade-legend__item pv2-upgrade-legend__item--walls">Walls</span>
            <span class="pv2-upgrade-legend__item pv2-upgrade-legend__item--friction">Friction</span>
          </div>
          <div class="pv2-upgrade-panel__currency"><span data-upgrade-points>${points}</span><small>PTS</small></div>
          <button class="pv2-upgrade-close" type="button" aria-label="Close upgrades">×</button>
        </header>
        <div class="pv2-upgrade-scroll">
          <div class="pv2-upgrade-tree" style="--tree-width:${TREE_WIDTH}px;--tree-height:${TREE_HEIGHT}px">
            <svg class="pv2-upgrade-lines" viewBox="0 0 ${TREE_WIDTH} ${TREE_HEIGHT}" aria-hidden="true"></svg>
            <div class="pv2-upgrade-root" style="--node-x:${TREE_CENTER.x}px;--node-y:${TREE_CENTER.y}px">
              <span class="pv2-upgrade-root__ring" aria-hidden="true"></span>
              <span class="pv2-upgrade-root__eyebrow">ROOT</span>
              <strong>Kinetic<br>Basics</strong>
              <span class="pv2-upgrade-root__owned">OWNED</span>
            </div>
          </div>
        </div>
      </section>
    `;

    upgradeTree = upgradeOverlay.querySelector('.pv2-upgrade-tree');
    const lines = upgradeTree.querySelector('.pv2-upgrade-lines');

    UPGRADES.forEach((upgrade) => {
      const start = parentPoint(upgrade);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', curvedPath(start, { x: upgrade.x, y: upgrade.y }));
      path.setAttribute('data-connector-to', upgrade.id);
      path.setAttribute('data-branch', upgrade.branch);
      path.classList.add('pv2-upgrade-line', `pv2-upgrade-line--${upgrade.branch}`);
      lines.appendChild(path);
      upgradeTree.appendChild(makeUpgradeNode(upgrade));
    });

    upgradeOverlay.querySelector('.pv2-upgrade-close').addEventListener('click', closeUpgradeTree);
    upgradeOverlay.addEventListener('pointerdown', (event) => {
      if (event.target === upgradeOverlay) closeUpgradeTree();
    });
    document.body.appendChild(upgradeOverlay);
    refreshUpgradeTree();
  }

  function centerUpgradeScroll() {
    const scroller = upgradeOverlay?.querySelector('.pv2-upgrade-scroll');
    if (!scroller) return;
    scroller.scrollLeft = Math.max(0, TREE_CENTER.x - scroller.clientWidth / 2);
    scroller.scrollTop = Math.max(0, TREE_CENTER.y - scroller.clientHeight / 2);
  }

  function openUpgradeTree() {
    buildUpgradeTree();
    refreshUpgradeTree();
    upgradeOverlay.classList.add('is-open');
    document.documentElement.classList.add('pv2-upgrades-open');
    requestAnimationFrame(() => {
      centerUpgradeScroll();
      upgradeOverlay.querySelector('.pv2-upgrade-close')?.focus();
    });
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
    const node = upgradeTree?.querySelector(`[data-upgrade-id="${id}"]`);
    try {
      node?.animate([
        { transform: 'translate(-50%, -50%) scale(1)' },
        { transform: 'translate(-50%, -50%) scale(1.16)', offset: .45 },
        { transform: 'translate(-50%, -50%) scale(1)' },
      ], { duration: 260, easing: 'cubic-bezier(.2,.9,.25,1)' });
    } catch {}
  }

  function updateScore(delta, sourceId, impact) {
    points += delta;
    ensureScoreCounter();
    scoreValue.textContent = String(points);
    refreshUpgradeCue();
    refreshUpgradeTree();
    if (!reducedMotion()) {
      try {
        scoreCounter.animate([
          { transform: 'translateY(0) scale(1)' },
          { transform: 'translateY(0) scale(1.08)', offset: .42 },
          { transform: 'translateY(0) scale(1)' },
        ], { duration: 170, easing: 'cubic-bezier(.2,.9,.25,1)' });
      } catch {}
    }
    window.dispatchEvent(new CustomEvent('pv2:score-state', {
      detail: { points, delta, sourceId, impactX: impact?.x, impactY: impact?.y },
    }));
  }

  function pulseBumper(el) {
    if (!el?.isConnected) return;
    try {
      el.animate([
        { scale: '1', filter: 'brightness(1)' },
        { scale: '1.14', filter: 'brightness(.9)', offset: .22 },
        { scale: '.96', filter: 'brightness(1.04)', offset: .52 },
        { scale: '1.025', filter: 'brightness(.98)', offset: .76 },
        { scale: '1', filter: 'brightness(1)' },
      ], { duration: reducedMotion() ? 220 : 500, easing: 'cubic-bezier(.16,.88,.24,1)' });
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
    for (let i = 0; i < 8; i += 1) {
      const t = i / 7;
      const angle = impact.outward - Math.PI / 2 + t * Math.PI;
      const distance = 24 + Math.random() * 12;
      const length = 10 + Math.random() * 7;
      const line = document.createElement('span');
      Object.assign(line.style, {
        position: 'fixed', left: `${impact.x}px`, top: `${impact.y}px`, width: `${length}px`, height: '2.5px',
        background: 'rgba(24,24,24,.95)', transformOrigin: '0 50%', pointerEvents: 'none', opacity: '0',
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
      position: 'fixed', left: `${impact.x}px`, top: `${impact.y}px`, zIndex: '2', color,
      fontFamily: 'system-ui, sans-serif', fontSize: 'clamp(2.4rem, 3.4vw, 3.6rem)', fontWeight: '950',
      lineHeight: '.9', letterSpacing: '-.07em', whiteSpace: 'nowrap', pointerEvents: 'none',
      WebkitTextStroke: '1px rgba(255,255,255,.78)', textShadow: `0 2px 0 rgba(255,255,255,.95), 0 5px 18px ${color}66`,
      transformOrigin: '50% 100%', opacity: '0',
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
    const effects = currentEffects();
    const minY = stageTopLimit(stageRect);
    const maxX = Math.max(EDGE_PADDING, stageRect.width - body.w - EDGE_PADDING);
    const maxY = Math.max(minY, stageRect.height - body.h - EDGE_PADDING);
    let hit = null;
    if (body.x < EDGE_PADDING) { body.x = EDGE_PADDING; body.vx = Math.abs(body.vx) * effects.wallKickMult; hit = 'left'; }
    if (body.x > maxX) { body.x = maxX; body.vx = -Math.abs(body.vx) * effects.wallKickMult; hit = 'right'; }
    if (body.y < minY) { body.y = minY; body.vy = Math.abs(body.vy) * effects.wallKickMult; hit = 'top'; }
    if (body.y > maxY) { body.y = maxY; body.vy = -Math.abs(body.vy) * effects.wallKickMult; hit = 'bottom'; }
    if (hit && allowScore) scoreWallBounce(body, hit, stageRect);
  }

  function bodyRect(body) {
    return { x: body.x, y: body.y, w: body.w, h: body.h };
  }

  function resolveBodyPair(a, b) {
    if (!overlaps(bodyRect(a), bodyRect(b), BODY_GAP)) return false;
    const effects = currentEffects();
    const dx = (a.x + a.w / 2) - (b.x + b.w / 2) || .01;
    const dy = (a.y + a.h / 2) - (b.y + b.h / 2) || .01;
    const overlapX = (a.w + b.w) / 2 + BODY_GAP - Math.abs(dx);
    const overlapY = (a.h + b.h) / 2 + BODY_GAP - Math.abs(dy);
    if (overlapX < overlapY) {
      const sign = dx >= 0 ? 1 : -1;
      a.x += overlapX * .5 * sign;
      b.x -= overlapX * .5 * sign;
      const av = a.vx;
      a.vx = b.vx * effects.collisionBoost;
      b.vx = av * effects.collisionBoost;
    } else {
      const sign = dy >= 0 ? 1 : -1;
      a.y += overlapY * .5 * sign;
      b.y -= overlapY * .5 * sign;
      const av = a.vy;
      a.vy = b.vy * effects.collisionBoost;
      b.vy = av * effects.collisionBoost;
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
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
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

    const effects = currentEffects();
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
        const impulse = clamp(POINTER_MIN_IMPULSE + pointerSpeed * .24, POINTER_MIN_IMPULSE, POINTER_IMPULSE) * effects.pointerImpulseMult;
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
    const speedFloor = (reducedMotion() ? REDUCED_SPEED : NORMAL_SPEED) * effects.speedMult * effects.speedFloorMult;
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