(() => {
  const MOBILE_BREAKPOINT = 720;
  const EDGE_PADDING = 16;
  const NAV_CLEARANCE = 10;
  const BODY_GAP = 10;
  const NORMAL_SPEED = 0.038;
  const REDUCED_SPEED = 0.012;
  const MOBILE_START_SPEED = 0.018;
  const MOBILE_UNARMED_BUMPER_KICK = 0.024;
  const POINTER_IMPULSE = 0.18;
  const POINTER_MIN_IMPULSE = 0.11;
  const HOME_PULL = 0.00000042;
  const DAMPING = 0.9992;
  const MAX_SPEED = 0.66;
  const REDUCED_MAX_SPEED = 0.08;
  const POINTER_COOLDOWN = 85;
  const BUMPER_KICK = 0.48;
  const WALL_SCORE_COOLDOWN = 220;
  // A flick's "armed" state is finite: after this it decays so a single flick
  // can't power a block off bumpers forever (player input / autoflick re-arm).
  const ARMED_DURATION = 3200;
  // A non-launch bumper contact reflects this fraction of the incoming speed
  // (floored by the gentle kick) so the block eases away and drag settles it,
  // rather than snapping to a fixed low speed in a single frame.
  const SOFT_BUMPER_RESTITUTION = 0.5;
  // --- Friction / heat mechanic --------------------------------------------
  // A block "heats" while it moves faster than the ambient drift. Heat runs
  // 0→1: as it climbs it adds drag and suppresses the drift floor, so a
  // launched block eases to a stop instead of snapping, and a full meter pays
  // out a "friction burn" before the block cools back into the ambient float.
  // Idle drift stays below HEAT_THRESHOLD, so only launched blocks ever settle.
  const HEAT_THRESHOLD = 0.06;      // floor for the heat-build speed cutoff (px/ms)
  const HEAT_MARGIN = 1.8;          // …but never below this ×the live drift floor,
                                    // so idle drift never heats however upgraded
  const FRICTION_GAIN = 0.0016;     // heat gained per (speed − threshold) per ms
  const FRICTION_RELIEF = 0.00045;  // heat shed per ms while below threshold
  const FRICTION_DAMP_BASE = 0.988; // extra per-ms damping, exponent-scaled by heat
  const FRICTION_REARM = 0.35;      // heat must fall below this before it can burn again
  const FRICTION_BURN_BASE = 6;     // base points for a full-meter burn (× upgrades)
  const FLICK_COOL = 0.6;           // heat a player flick sheds (wakes a settled block)
  const HEAT_MIN_VISIBLE = 0.04;    // below this the heat halo stays hidden
  const HEAT_TIERS = 5;             // box-shadow color steps (rewritten only on change)
  const TREE_WIDTH = 1240;
  const TREE_HEIGHT = 900;
  const TREE_CENTER = { x: 620, y: 450 };
  const GHOST_COLORS = ['#ff3366', '#7c3cff', '#00b894', '#ff9f1a', '#1597ff', '#e843d5', '#ff5f00'];
  const COMBO_WINDOW = 2200;
  const AUTO_FLICK_INTERVAL = 2600;
  const GRAVITY_ACCEL = 0.00007;
  // --- Bushido (double-click slice-time ability) ---------------------------
  const BUSHIDO_DURATION = 3000;   // slicing window (ms) — matches the red bar
  const BUSHIDO_COOLDOWN = 45000;  // ms before Bushido can be triggered again
  const BUSHIDO_MAX_CUTS = 6;      // per box, so piece counts stay bounded
  const BUSHIDO_SHATTER_MAX = 3000;// hard cap on the fling phase before settle
  const BUSHIDO_SETTLE_SPEED = 0.02; // px/ms — below this (all pieces) = settled
  // Mobile has a tiny stage, so blocks otherwise ping-pong forever. Extra drag
  // (damping raised to this power) and a lower drift floor let them settle.
  const MOBILE_DRAG_EXP = 2.6;
  const MOBILE_FLOOR_SCALE = 0.28;
  const TREE_ZOOM_MIN = 0.45;
  const TREE_ZOOM_MAX = 1.9;
  const TREE_DEFAULT_ZOOM = 1.18;

  // Genre labels flavor the incremental tree; `soon` marks nodes whose deeper
  // mechanic (the RPG Battle) is scaffolded in the tree now and wired later.
  const UPGRADES = [
    // ── Velocity (upward spine) ────────────────────────────────────────────
    { id: 'vel-1', branch: 'velocity', depth: 1, x: 620, y: 336, title: 'Faster Drift', effect: '+60% drift speed', icon: 'wind', cost: 10, requires: [] },
    { id: 'vel-accel', branch: 'velocity', depth: 2, x: 498, y: 236, title: 'Acceleration', effect: '+80% speed floor', icon: 'chevrons-up', cost: 24, requires: ['vel-1'] },
    { id: 'vel-cap', branch: 'velocity', depth: 2, x: 742, y: 236, title: 'Top Speed', effect: '+80% velocity cap', icon: 'gauge', cost: 28, requires: ['vel-1'] },
    { id: 'vel-launch', branch: 'velocity', depth: 3, x: 476, y: 132, title: 'Quick Launch', effect: '+110% flick impulse', icon: 'rocket', cost: 62, requires: ['vel-accel'] },
    { id: 'vel-momentum', branch: 'velocity', depth: 3, x: 742, y: 132, title: 'Momentum', effect: '+75% velocity cap', icon: 'trending', cost: 66, requires: ['vel-cap'] },
    { id: 'vel-overdrive', branch: 'velocity', depth: 4, x: 609, y: 44, title: 'Overdrive', effect: '+120% speed · +80% flick', icon: 'flame', cost: 180, requires: ['vel-launch', 'vel-momentum'] },

    // ── Bounce (rightward spine) ───────────────────────────────────────────
    { id: 'bounce-1', branch: 'bounce', depth: 1, x: 748, y: 450, title: 'Better Bounces', effect: '+1 / bumper', icon: 'bounce', cost: 8, requires: [] },
    { id: 'bounce-force', branch: 'bounce', depth: 2, x: 884, y: 360, title: 'Bumper Force', effect: '+70% rebound', icon: 'burst', cost: 20, requires: ['bounce-1'] },
    { id: 'bounce-value', branch: 'bounce', depth: 2, x: 884, y: 540, title: 'Bounce Value', effect: '+1 / bumper', icon: 'coin', cost: 24, requires: ['bounce-1'] },
    { id: 'bounce-charge', branch: 'bounce', depth: 3, x: 1052, y: 360, title: 'Kinetic Charge', effect: '+85% rebound', icon: 'bolt', cost: 58, requires: ['bounce-force'] },
    { id: 'bounce-combo', branch: 'bounce', depth: 3, x: 1052, y: 540, title: 'Combo Bounce', effect: '+2 / bumper', icon: 'layers', cost: 60, requires: ['bounce-value'] },
    { id: 'bounce-chain', branch: 'bounce', depth: 4, x: 1150, y: 450, title: 'Combo Chain', effect: 'Hits stack up to ×3', icon: 'link', cost: 190, requires: ['bounce-charge', 'bounce-combo'] },

    // ── Walls (leftward spine) ─────────────────────────────────────────────
    { id: 'walls-1', branch: 'walls', depth: 1, x: 492, y: 450, title: 'Wall Points', effect: '+1 / wall', icon: 'brick', cost: 30, requires: [] },
    { id: 'walls-hard', branch: 'walls', depth: 2, x: 356, y: 360, title: 'Hard Walls', effect: '+70% wall kick', icon: 'shield', cost: 30, requires: ['walls-1'] },
    { id: 'walls-value', branch: 'walls', depth: 2, x: 356, y: 540, title: 'Wall Value', effect: '+1 / wall', icon: 'coin', cost: 32, requires: ['walls-1'] },
    { id: 'walls-ricochet', branch: 'walls', depth: 3, x: 188, y: 360, title: 'Ricochet', effect: '+85% wall kick', icon: 'zigzag', cost: 70, requires: ['walls-hard'] },
    { id: 'walls-echo', branch: 'walls', depth: 3, x: 188, y: 540, title: 'Echo Walls', effect: '+2 / wall', icon: 'echo', cost: 74, requires: ['walls-value'] },

    // ── Friction (downward spine) ──────────────────────────────────────────
    { id: 'fric-1', branch: 'friction', depth: 1, x: 620, y: 564, title: 'Less Friction', effect: '−40% drag', icon: 'droplet', cost: 12, requires: [] },
    { id: 'fric-glide', branch: 'friction', depth: 2, x: 498, y: 664, title: 'Glide', effect: '−55% drag', icon: 'feather', cost: 26, requires: ['fric-1'] },
    { id: 'fric-keep', branch: 'friction', depth: 2, x: 742, y: 664, title: 'Collision Keep', effect: '+28% collision energy', icon: 'refresh', cost: 30, requires: ['fric-1'] },
    { id: 'fric-low', branch: 'friction', depth: 3, x: 476, y: 768, title: 'Low Drag', effect: '−65% drag', icon: 'snow', cost: 68, requires: ['fric-glide'] },
    { id: 'fric-perpetual', branch: 'friction', depth: 3, x: 742, y: 768, title: 'Perpetual Motion', effect: 'Near-zero drag', icon: 'infinity', cost: 150, requires: ['fric-keep'] },

    // ── Flux (genre-bending cross-branch tech) ─────────────────────────────
    { id: 'flux-crit', branch: 'flux', depth: 3, x: 300, y: 168, title: 'Critical Hit', effect: 'RPG · 15% ×5', icon: 'target', cost: 150, requires: ['vel-accel', 'walls-hard'] },
    { id: 'flux-battle', branch: 'flux', depth: 4, x: 150, y: 58, title: 'Critical Combo', effect: 'RPG · combo → Battle', icon: 'swords', cost: 320, requires: ['flux-crit'], soon: true },
    { id: 'flux-bushido', branch: 'flux', depth: 4, x: 120, y: 300, title: 'Bushido', effect: 'Dbl-click → slice time', icon: 'katana', cost: 280, requires: ['flux-crit'] },
    { id: 'flux-mult', branch: 'flux', depth: 3, x: 940, y: 168, title: 'Compound Interest', effect: 'Idle · ×2 points', icon: 'multiply', cost: 120, requires: ['vel-cap', 'bounce-force'] },
    { id: 'flux-idle', branch: 'flux', depth: 3, x: 940, y: 732, title: 'Idle Engine', effect: 'Idle · +2 / sec', icon: 'clock', cost: 110, requires: ['bounce-value', 'fric-keep'] },
    { id: 'flux-auto', branch: 'flux', depth: 4, x: 1064, y: 828, title: 'Autopilot', effect: 'Auto · flicks a block', icon: 'cpu', cost: 220, requires: ['flux-idle'] },
    { id: 'flux-gravity', branch: 'flux', depth: 3, x: 300, y: 732, title: 'Gravity Well', effect: 'Physics · fall + bounce', icon: 'gravity', cost: 90, requires: ['walls-value', 'fric-glide'] },
  ];

  const UPGRADE_BY_ID = new Map(UPGRADES.map((upgrade) => [upgrade.id, upgrade]));

  const ICONS = {
    wind: '<path d="M3 9h9a2.4 2.4 0 1 0-2.4-2.4"/><path d="M3 14h13a2.4 2.4 0 1 1-2.4 2.4"/><path d="M3 19h6"/>',
    'chevrons-up': '<path d="M6 14l6-6 6 6"/><path d="M6 20l6-6 6 6"/>',
    gauge: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 14l4-3"/><circle cx="12" cy="14" r="1.4" fill="currentColor" stroke="none"/>',
    rocket: '<path d="M12 3c3 1.6 4.6 5 4.6 8.6L14 15h-4l-2.6-3.4C7.4 8 9 4.6 12 3z"/><circle cx="12" cy="9" r="1.6"/><path d="M9.5 15l-2 4M14.5 15l2 4"/>',
    trending: '<path d="M3 17l6-6 4 4 8-8"/><path d="M16 7h5v5"/>',
    flame: '<path d="M12 3c1.2 3.6 4.6 5 4.6 9a4.6 4.6 0 0 1-9.2 0c0-2 1-3.2 2-4.2.6 2 2 2 2.6-4.8z"/>',
    bounce: '<circle cx="12" cy="6" r="2.4"/><path d="M4 20c1.6-3.4 4-3.4 5.6 0M13.4 20c1.6-3.4 4-3.4 5.6 0"/>',
    burst: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.6 2.6M15.4 15.4L18 18M18 6l-2.6 2.6M8.6 15.4L6 18"/>',
    coin: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>',
    bolt: '<path d="M13 2L4 14h6l-1 8 9-12h-6z"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
    link: '<path d="M9.5 12a3 3 0 0 1 0-4l2-2a3 3 0 0 1 4.2 4.2l-1 1"/><path d="M14.5 12a3 3 0 0 1 0 4l-2 2a3 3 0 0 1-4.2-4.2l1-1"/>',
    brick: '<rect x="3.5" y="6" width="17" height="12" rx="1"/><path d="M3.5 12h17M12 6v6M8 12v6M16 12v6"/>',
    shield: '<path d="M12 3l7 3v5c0 4-3 7-7 9-4-2-7-5-7-9V6z"/>',
    zigzag: '<path d="M3 8l5 4-5 4M10 8l5 4-5 4M17 8l4 4-4 4"/>',
    echo: '<circle cx="12" cy="12" r="2.2"/><path d="M6.5 12a5.5 5.5 0 0 1 11 0"/><path d="M3 12a9 9 0 0 1 18 0"/>',
    droplet: '<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/>',
    feather: '<path d="M20 4C11 4 6 9 6 16v4"/><path d="M6 20L16 10M9.5 13H15M11.5 11H16"/>',
    refresh: '<path d="M4 12a8 8 0 0 1 13.6-5.6L20 8"/><path d="M20 3v5h-5"/><path d="M20 12a8 8 0 0 1-13.6 5.6L4 16"/><path d="M4 21v-5h5"/>',
    snow: '<path d="M12 3v18M4.5 7l15 10M19.5 7l-15 10"/><path d="M9 4.5l3 2 3-2M9 19.5l3-2 3 2"/>',
    infinity: '<circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/>',
    multiply: '<path d="M6 6l12 12M18 6L6 18"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    swords: '<path d="M4 4l8 8M4 4l1 4 4 1M14 12l6 6-1 1-6-6M20 4l-8 8M20 4l-1 4-4 1M10 12l-6 6 1 1 6-6"/>',
    katana: '<path d="M20 3l-1.5 1.5M18.5 4.5L7 16M7 16l-3 4 4-3M7 16l1.4 1.4M5.6 17.4L4 20"/><path d="M8.4 17.4l1.6-1.6"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    cpu: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 7V4M14 7V4M10 20v-3M14 20v-3M7 10H4M7 14H4M20 10h-3M20 14h-3"/>',
    gravity: '<path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/>',
    core: '<circle cx="12" cy="12" r="3.4"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.4 5.4l2.1 2.1M16.5 16.5l2.1 2.1M18.6 5.4l-2.1 2.1M7.5 16.5l-2.1 2.1"/>',
  };

  function iconSvg(name) {
    const inner = ICONS[name] || ICONS.core;
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  }

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
  let effectsCache = null;   // currentEffects() memo; nulled when a purchase changes it
  let bumperGeom = null;     // cached stage-local bumper geometry; nulled on reflow
  let pointer = { x: -9999, y: -9999, t: 0 };
  let comboCount = 0;
  let comboExpire = 0;
  let idleBank = 0;
  let autoFlickTimer = 0;
  let battlePaused = false;
  let bushido = null;        // active Bushido session state (null when idle)
  let bushidoCooldownUntil = 0;   // performance.now() timestamp cooldown ends
  let bushidoBadge = null;        // persistent cooldown badge element
  let bushidoRing = null;         // the badge's progress ring <circle>
  let treeZoom = TREE_DEFAULT_ZOOM;
  let treePanX = 0;
  let treePanY = 0;
  let treeDrag = null;
  let suppressTreeClick = false;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  // One persistent MediaQueryList instead of rebuilding it on every call (this
  // is read several times per frame per body).
  const reducedMotionMQL = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  const reducedMotion = () => (reducedMotionMQL ? reducedMotionMQL.matches : false);

  function mark(state) {
    // Called every frame; skip the attribute write (and any CSS recalc it
    // triggers) when the state string hasn't actually changed.
    if (document.documentElement.dataset.pv2Physics !== state) {
      document.documentElement.dataset.pv2Physics = state;
    }
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

  // Fog-of-war reveal: a node shows only once it is bought, connects to the
  // centre (root) node, or connects to an already-bought upgrade.
  function upgradeVisible(upgrade) {
    if (purchased.has(upgrade.id)) return true;
    if (!upgrade.requires.length) return true;
    return upgrade.requires.some((id) => purchased.has(id));
  }

  function currentEffects() {
    // Effects only change when an upgrade is bought (buyUpgrade nulls the memo),
    // so cache the built object — it's read many times per frame otherwise.
    if (effectsCache) return effectsCache;
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
    let pointMult = 1;
    let critChance = 0;
    let critMult = 1;
    let comboEnabled = false;
    let comboStep = 0;
    let comboMax = 1;
    let idlePerSec = 0;
    let autoFlick = false;
    let gravity = 0;
    let frictionBurnMult = 1;

    // Velocity branch
    if (hasUpgrade('vel-1')) speedMult *= 1.6;
    if (hasUpgrade('vel-accel')) speedFloorMult *= 1.8;
    if (hasUpgrade('vel-cap')) maxSpeedMult *= 1.8;
    if (hasUpgrade('vel-launch')) pointerImpulseMult *= 2.1;
    if (hasUpgrade('vel-momentum')) maxSpeedMult *= 1.75;
    if (hasUpgrade('vel-overdrive')) { speedMult *= 2.2; pointerImpulseMult *= 1.8; }

    // Bounce branch
    if (hasUpgrade('bounce-1')) bumperValue += 1;
    if (hasUpgrade('bounce-force')) bumperKickMult *= 1.7;
    if (hasUpgrade('bounce-value')) bumperValue += 1;
    if (hasUpgrade('bounce-charge')) bumperKickMult *= 1.85;
    if (hasUpgrade('bounce-combo')) bumperValue += 2;
    if (hasUpgrade('bounce-chain')) { comboEnabled = true; comboStep = 0.25; comboMax = 3; }

    // Walls branch
    if (hasUpgrade('walls-1')) wallValue += 1;
    if (hasUpgrade('walls-hard')) wallKickMult *= 1.7;
    if (hasUpgrade('walls-value')) wallValue += 1;
    if (hasUpgrade('walls-ricochet')) wallKickMult *= 1.85;
    if (hasUpgrade('walls-echo')) wallValue += 2;

    // Friction branch (ordered weakest→strongest so the deepest drag wins).
    // Less drag = blocks stay fast longer = they heat faster (emergent), and
    // these nodes also scale the friction-burn payout so the branch has teeth.
    if (hasUpgrade('fric-1')) damping = 0.9997;
    if (hasUpgrade('fric-glide')) { damping = 0.99986; frictionBurnMult *= 1.4; }
    if (hasUpgrade('fric-keep')) { collisionBoost = 1.28; frictionBurnMult *= 1.5; }
    if (hasUpgrade('fric-low')) { damping = 0.99994; speedFloorMult *= 1.4; frictionBurnMult *= 1.8; }
    if (hasUpgrade('fric-perpetual')) { damping = 0.999985; speedFloorMult *= 1.6; frictionBurnMult *= 2; }

    // Flux branch (genre-bending)
    if (hasUpgrade('flux-mult')) pointMult *= 2;
    if (hasUpgrade('flux-crit')) { critChance = 0.15; critMult = 5; }
    if (hasUpgrade('flux-idle')) idlePerSec += 2;
    if (hasUpgrade('flux-auto')) autoFlick = true;
    if (hasUpgrade('flux-gravity')) gravity = GRAVITY_ACCEL;

    return (effectsCache = {
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
      pointMult,
      critChance,
      critMult,
      comboEnabled,
      comboStep,
      comboMax,
      idlePerSec,
      autoFlick,
      gravity,
      frictionBurnMult,
    });
  }

  function cheapestAvailableUpgrade() {
    return UPGRADES
      .filter((upgrade) => !upgrade.soon && !purchased.has(upgrade.id) && upgradeUnlocked(upgrade))
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
    refreshBushidoBadge();
    window.dispatchEvent(new CustomEvent('pv2:game-start', { detail: { points } }));
  }

  function makeUpgradeNode(upgrade) {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = `pv2-upgrade-node pv2-upgrade-node--${upgrade.branch} pv2-upgrade-node--depth-${upgrade.depth}`;
    if (upgrade.soon) node.classList.add('pv2-upgrade-node--soon');
    node.dataset.upgradeId = upgrade.id;
    node.dataset.branch = upgrade.branch;
    node.style.setProperty('--node-x', `${upgrade.x}px`);
    node.style.setProperty('--node-y', `${upgrade.y}px`);
    node.innerHTML = `
      <span class="pv2-upgrade-node__icon" aria-hidden="true">${iconSvg(upgrade.icon)}</span>
      <span class="pv2-upgrade-node__copy">
        <strong class="pv2-upgrade-node__title">${upgrade.title}</strong>
        <span class="pv2-upgrade-node__effect">${upgrade.effect}</span>
      </span>
      <span class="pv2-upgrade-node__cost">${upgrade.cost}</span>
    `;
    node.addEventListener('click', () => buyUpgrade(upgrade.id));
    return node;
  }

  function pointOf(id) {
    const upgrade = UPGRADE_BY_ID.get(id);
    return upgrade ? { x: upgrade.x, y: upgrade.y } : TREE_CENTER;
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
      const upgrade = UPGRADE_BY_ID.get(button.dataset.upgradeId);
      if (!upgrade) return;
      const soon = Boolean(upgrade.soon);
      const bought = purchased.has(upgrade.id);
      const unlocked = upgradeUnlocked(upgrade);
      const visible = upgradeVisible(upgrade);
      const affordable = !soon && unlocked && !bought && points >= upgrade.cost;
      button.classList.toggle('is-hidden', !visible);
      button.classList.toggle('is-bought', bought);
      button.classList.toggle('is-locked', !unlocked);
      button.classList.toggle('is-affordable', affordable);
      button.disabled = soon || bought || !unlocked || !affordable;
      button.setAttribute('aria-label', soon
        ? `${upgrade.title}, ${upgrade.effect}, coming soon`
        : bought
          ? `${upgrade.title}, purchased`
          : `${upgrade.title}, ${upgrade.effect}, costs ${upgrade.cost} points`);
      const cost = button.querySelector('.pv2-upgrade-node__cost');
      if (cost) cost.textContent = bought ? '✓' : soon ? 'SOON' : String(upgrade.cost);

      upgradeTree.querySelectorAll(`[data-connector-to="${upgrade.id}"]`).forEach((connector) => {
        const from = connector.getAttribute('data-connector-from');
        const parent = from === 'root' ? null : UPGRADE_BY_ID.get(from);
        const fromVisible = from === 'root' || (parent && upgradeVisible(parent));
        const parentLive = from === 'root' || purchased.has(from);
        connector.classList.toggle('is-hidden', !(visible && fromVisible));
        connector.classList.toggle('is-live', parentLive || unlocked || bought);
        connector.classList.toggle('is-bought', bought);
      });
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
            <span class="pv2-upgrade-legend__item pv2-upgrade-legend__item--flux">Flux</span>
          </div>
          <div class="pv2-upgrade-panel__currency"><span data-upgrade-points>${points}</span><small>PTS</small></div>
          <button class="pv2-upgrade-close" type="button" aria-label="Close upgrades">×</button>
        </header>
        <div class="pv2-upgrade-scroll">
          <div class="pv2-upgrade-tree" style="--tree-width:${TREE_WIDTH}px;--tree-height:${TREE_HEIGHT}px">
            <svg class="pv2-upgrade-lines" viewBox="0 0 ${TREE_WIDTH} ${TREE_HEIGHT}" aria-hidden="true"></svg>
            <div class="pv2-upgrade-root" style="--node-x:${TREE_CENTER.x}px;--node-y:${TREE_CENTER.y}px">
              <span class="pv2-upgrade-root__ring" aria-hidden="true"></span>
              <span class="pv2-upgrade-root__icon" aria-hidden="true">${iconSvg('core')}</span>
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
      const parents = upgrade.requires.length ? upgrade.requires : ['root'];
      parents.forEach((parentId) => {
        const start = parentId === 'root' ? TREE_CENTER : pointOf(parentId);
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', curvedPath(start, { x: upgrade.x, y: upgrade.y }));
        path.setAttribute('data-connector-to', upgrade.id);
        path.setAttribute('data-connector-from', parentId);
        path.setAttribute('data-branch', upgrade.branch);
        path.classList.add('pv2-upgrade-line', `pv2-upgrade-line--${upgrade.branch}`);
        lines.appendChild(path);
      });
      upgradeTree.appendChild(makeUpgradeNode(upgrade));
    });

    upgradeOverlay.querySelector('.pv2-upgrade-close').addEventListener('click', closeUpgradeTree);
    upgradeOverlay.addEventListener('pointerdown', (event) => {
      if (event.target === upgradeOverlay) closeUpgradeTree();
    });

    // Click-drag to pan, wheel to zoom, around the tree.
    const scroller = upgradeOverlay.querySelector('.pv2-upgrade-scroll');
    scroller.addEventListener('pointerdown', onTreePointerDown);
    scroller.addEventListener('pointermove', onTreePointerMove);
    scroller.addEventListener('pointerup', onTreePointerUp);
    scroller.addEventListener('pointercancel', onTreePointerUp);
    scroller.addEventListener('wheel', onTreeWheel, { passive: false });
    scroller.addEventListener('click', (event) => {
      if (suppressTreeClick) { event.stopPropagation(); event.preventDefault(); suppressTreeClick = false; }
    }, true);

    document.body.appendChild(upgradeOverlay);
    refreshUpgradeTree();
  }

  function treeViewport() {
    const el = upgradeOverlay?.querySelector('.pv2-upgrade-scroll');
    return el ? { el, w: el.clientWidth, h: el.clientHeight } : null;
  }

  function clampTreePan() {
    const vp = treeViewport();
    if (!vp) return;
    const sw = TREE_WIDTH * treeZoom;
    const sh = TREE_HEIGHT * treeZoom;
    const slack = 120 * treeZoom; // let the edges drift a little past the frame
    treePanX = sw <= vp.w ? (vp.w - sw) / 2 : clamp(treePanX, vp.w - sw - slack, slack);
    treePanY = sh <= vp.h ? (vp.h - sh) / 2 : clamp(treePanY, vp.h - sh - slack, slack);
  }

  function applyTreeTransform() {
    if (upgradeTree) upgradeTree.style.transform = `translate(${treePanX}px, ${treePanY}px) scale(${treeZoom})`;
  }

  function centerTreeOn(treeX, treeY) {
    const vp = treeViewport();
    if (!vp) return;
    treePanX = vp.w / 2 - treeX * treeZoom;
    treePanY = vp.h / 2 - treeY * treeZoom;
    clampTreePan();
    applyTreeTransform();
  }

  // Resets zoom and centres the view on the root when the tree opens.
  function centerUpgradeScroll() {
    treeZoom = window.innerWidth <= MOBILE_BREAKPOINT ? 1 : TREE_DEFAULT_ZOOM;
    centerTreeOn(TREE_CENTER.x, TREE_CENTER.y);
  }

  function onTreePointerDown(event) {
    if (event.button != null && event.button > 0) return; // primary / touch only
    if (!treeViewport()) return;
    // Don't capture yet: capturing on pointerdown would steal the click from a
    // node and break tap-to-buy. Capture only once an actual drag begins.
    treeDrag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, panX: treePanX, panY: treePanY, moved: false };
  }

  function onTreePointerMove(event) {
    if (!treeDrag || event.pointerId !== treeDrag.id) return;
    const dx = event.clientX - treeDrag.startX;
    const dy = event.clientY - treeDrag.startY;
    if (!treeDrag.moved && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
    if (!treeDrag.moved) {
      treeDrag.moved = true;
      const vp = treeViewport();
      try { vp?.el.setPointerCapture(event.pointerId); } catch {}
      vp?.el.classList.add('is-grabbing');
    }
    treePanX = treeDrag.panX + dx;
    treePanY = treeDrag.panY + dy;
    clampTreePan();
    applyTreeTransform();
  }

  function onTreePointerUp(event) {
    if (!treeDrag || event.pointerId !== treeDrag.id) return;
    const moved = treeDrag.moved;
    const vp = treeViewport();
    try { if (moved) vp?.el.releasePointerCapture(event.pointerId); } catch {}
    vp?.el.classList.remove('is-grabbing');
    treeDrag = null;
    // A drag shouldn't also register as a click that buys an upgrade.
    suppressTreeClick = moved;
    if (moved) window.setTimeout(() => { suppressTreeClick = false; }, 60);
  }

  function onTreeWheel(event) {
    const vp = treeViewport();
    if (!vp) return;
    event.preventDefault();
    const rect = vp.el.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const tx = (px - treePanX) / treeZoom;
    const ty = (py - treePanY) / treeZoom;
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    treeZoom = clamp(treeZoom * factor, TREE_ZOOM_MIN, TREE_ZOOM_MAX);
    treePanX = px - tx * treeZoom;
    treePanY = py - ty * treeZoom;
    clampTreePan();
    applyTreeTransform();
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
    const upgrade = UPGRADE_BY_ID.get(id);
    if (!upgrade || upgrade.soon || purchased.has(id) || !upgradeUnlocked(upgrade) || points < upgrade.cost) return;
    points -= upgrade.cost;
    purchased.add(id);
    effectsCache = null;
    ensureScoreCounter();
    scoreValue.textContent = String(points);
    refreshUpgradeCue();
    refreshUpgradeTree();
    refreshBushidoBadge();
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

  // Central scoring path: applies point multiplier, combo chain, and crit, then
  // updates the counter and spawns a floating ghost showing what was earned.
  function award(base, sourceId, impact, velocity) {
    const fx = currentEffects();
    let mult = fx.pointMult;
    let comboMult = 1;
    if (fx.comboEnabled) {
      const now = performance.now();
      comboCount = now <= comboExpire ? comboCount + 1 : 1;
      comboExpire = now + COMBO_WINDOW;
      comboMult = Math.min(fx.comboMax, 1 + fx.comboStep * (comboCount - 1));
      mult *= comboMult;
    }
    let crit = false;
    if (fx.critChance > 0 && Math.random() < fx.critChance) {
      crit = true;
      mult *= fx.critMult;
    }
    const gained = Math.max(1, Math.round(base * mult));
    updateScore(gained, sourceId, impact);
    spawnPointGhost(impact, gained, { crit, comboMult }, velocity);
  }

  function addIdlePoints(n) {
    if (n <= 0) return;
    points += n;
    ensureScoreCounter();
    scoreValue.textContent = String(points);
    refreshUpgradeCue();
    refreshUpgradeTree();
    window.dispatchEvent(new CustomEvent('pv2:score-state', {
      detail: { points, delta: n, sourceId: 'idle' },
    }));
  }

  // Warm ramp for the heat halo: amber when barely warm → deep orange at burn.
  function heatColor(f) {
    const g = Math.round(190 - f * 120);
    const b = Math.round(70 - f * 55);
    return `255, ${g}, ${b}`;
  }

  // The (expensive, blurred) box-shadow at a given heat tier, at full strength —
  // overall intensity is applied cheaply via opacity, so this string is only
  // rebuilt when a block crosses a tier boundary, not every frame.
  function heatShadow(f) {
    const c = heatColor(f);
    const ring = (1 + f * 2.5).toFixed(1);
    return `inset 0 0 0 ${ring}px rgba(${c},0.72), ` +
      `inset 0 0 ${(8 + f * 16).toFixed(0)}px rgba(${c},0.5), ` +
      `0 0 ${(6 + f * 14).toFixed(0)}px rgba(${c},0.5)`;
  }

  // Paint a block's heat ring from its friction (0→1). Center stays transparent
  // so the tile text is legible. Cost control: the blurred box-shadow is only
  // rewritten on a tier change; the smooth ramp rides on `opacity` (composited),
  // and both writes are skipped when the quantized value is unchanged.
  function updateHeatVisual(body) {
    const halo = body.halo;
    if (!halo) return;
    const f = body.friction;
    if (f < HEAT_MIN_VISIBLE) {
      if (body.heatOpacity !== 0) { halo.style.opacity = '0'; body.heatOpacity = 0; body.heatTier = -1; }
      return;
    }
    const tier = Math.min(HEAT_TIERS - 1, Math.floor(f * HEAT_TIERS));
    if (tier !== body.heatTier) {
      halo.style.boxShadow = heatShadow((tier + 0.5) / HEAT_TIERS);
      body.heatTier = tier;
    }
    const op = Math.round(f * 40) / 40; // quantize to ~0.025 to skip redundant writes
    if (op !== body.heatOpacity) { halo.style.opacity = String(op); body.heatOpacity = op; }
  }

  // Full meter → cash in a "friction burn" through the normal scoring path
  // (so point mult / combo / crit all apply) and flash the halo.
  function frictionBurn(body) {
    const effects = currentEffects();
    const rect = body.el.getBoundingClientRect();
    const impact = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    award(FRICTION_BURN_BASE * effects.frictionBurnMult, 'friction', impact, { vx: body.vx, vy: body.vy });
    window.dispatchEvent(new CustomEvent('pv2:friction-burn', { detail: { x: impact.x, y: impact.y } }));
    if (reducedMotion() || !body.halo) return;
    try {
      const rest = body.halo.style.boxShadow;
      body.halo.animate([
        { boxShadow: rest, transform: 'scale(1)' },
        { boxShadow: 'inset 0 0 0 3px rgba(255,240,205,.92), 0 0 42px 9px rgba(255,150,45,.78)', transform: 'scale(1.06)', offset: .3 },
        { boxShadow: rest, transform: 'scale(1)' },
      ], { duration: 520, easing: 'cubic-bezier(.16,.84,.3,1)' });
    } catch {}
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

  // Fraction of a 180° half-turn the number tumbles through before it stops
  // and pops. 0.75 * 180° = 135°.
  const GHOST_MIN_LAUNCH = 0.45;
  const GHOST_POP_SPEED = 0.06;
  // Per-millisecond friction applied to the launch velocity.
  const GHOST_FRICTION = 0.9925;
  // Safety cap on the drift/tumble phase (ms) in case angular speed is tiny.
  const GHOST_DRIFT_MAX_MS = 1500;

  // A short burst of straight lines radiating from a point, tinted in the
  // ghost's own color (plus a few white sparks). Used for the "pop".
  function spawnRadiatingLines(cx, cy, color) {
    const layer = ensureFxLayer();
    const burst = document.createElement('div');
    Object.assign(burst.style, {
      position: 'fixed', left: `${cx}px`, top: `${cy}px`, width: '0', height: '0',
      zIndex: '1', pointerEvents: 'none',
    });
    const count = 9;
    for (let i = 0; i < count; i++) {
      const angle = (360 / count) * i + (Math.random() * 12 - 6);
      const len = 15 + Math.random() * 11;
      const line = document.createElement('span');
      const lineColor = i % 3 === 0 ? 'rgba(255,255,255,.92)' : color;
      Object.assign(line.style, {
        position: 'absolute', left: '0', top: '0', width: '3px', height: `${len}px`,
        borderRadius: '3px', background: lineColor, transformOrigin: '50% 0%',
        boxShadow: `0 0 6px ${color}`, opacity: '0',
        transform: `rotate(${angle}deg) translateY(6px) scaleY(.2)`,
      });
      burst.appendChild(line);
      try {
        line.animate([
          { transform: `rotate(${angle}deg) translateY(6px) scaleY(.2)`, opacity: 0 },
          { transform: `rotate(${angle}deg) translateY(11px) scaleY(1)`, opacity: 1, offset: .32 },
          { transform: `rotate(${angle}deg) translateY(32px) scaleY(.55)`, opacity: 0 },
        ], { duration: 540, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
      } catch {}
    }
    layer.appendChild(burst);
    window.setTimeout(() => burst.remove(), 640);
  }

  function spawnPointGhost(impact, amount = 1, opts = {}, velocity = null) {
    if (!impact) return;
    const layer = ensureFxLayer();
    const ghost = document.createElement('span');
    const crit = Boolean(opts.crit);
    const comboMult = opts.comboMult || 1;
    const color = crit ? '#ffb300' : GHOST_COLORS[ghostColorIndex % GHOST_COLORS.length];
    ghostColorIndex += 1;
    const comboTag = comboMult > 1 ? `<sub style="font-size:.5em;font-weight:900;vertical-align:baseline;margin-left:.1em">×${comboMult.toFixed(2).replace(/\.?0+$/, '')}</sub>` : '';
    ghost.innerHTML = `${crit ? 'CRIT ' : ''}+${amount}${comboTag}`;
    Object.assign(ghost.style, {
      position: 'fixed', left: `${impact.x}px`, top: `${impact.y}px`, zIndex: '2', color,
      fontFamily: 'system-ui, sans-serif', fontSize: crit ? 'clamp(2.9rem, 4.2vw, 4.4rem)' : 'clamp(2.4rem, 3.4vw, 3.6rem)', fontWeight: '950',
      lineHeight: '.9', letterSpacing: '-.07em', whiteSpace: 'nowrap', pointerEvents: 'none',
      WebkitTextStroke: '1px rgba(255,255,255,.78)', textShadow: `0 2px 0 rgba(255,255,255,.95), 0 5px 18px ${color}66`,
      transformOrigin: '50% 50%', opacity: '0', willChange: 'transform, opacity',
    });
    layer.appendChild(ghost);

    // --- Energy proportional to how fast the game block was travelling. ---
    const motionReduced = reducedMotion();
    const motionScale = motionReduced ? 0.5 : 1;
    const vx0 = velocity && Number.isFinite(velocity.vx) ? velocity.vx : 0;
    const vy0 = velocity && Number.isFinite(velocity.vy) ? velocity.vy : 0;
    const blockSpeed = Math.hypot(vx0, vy0);
    // 0..1, with a small floor so a nearly-still block still animates.
    const energy = clamp(blockSpeed / (MAX_SPEED * 0.62), 0.16, 1);

    // Direction the block was heading (default: gentle upward if it was still).
    let dirX = 0, dirY = -1;
    if (blockSpeed > 1e-4) { dirX = vx0 / blockSpeed; dirY = vy0 / blockSpeed; }

    // Launch velocity (px/ms) in the block's travel direction.
    const launch = Math.max(GHOST_MIN_LAUNCH, (0.05 + energy * 0.45) * motionScale);
    let velX = dirX * launch;
    let velY = dirY * launch;

    let offX = 0, offY = 0, scale = 0.35, opacity = 0;
    let last = null, elapsed = 0;

    const paint = () => {
      ghost.style.opacity = String(opacity);
      ghost.style.transform =
        `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) scale(${scale})`;
    };
    paint();

    // Phase 2/3: the number stops, pops up with a burst of lines, holds for a
    // beat, then vanishes upwards.
    const popAndVanish = () => {
      const rect = ghost.getBoundingClientRect();
      spawnRadiatingLines(rect.left + rect.width / 2, rect.top + rect.height / 2, color);
      const tx = `calc(-50% + ${offX}px)`;
      try {
        const pop = ghost.animate([
          { transform: `translate(${tx}, calc(-50% + ${offY}px)) scale(1)`, opacity: 1 },
          { transform: `translate(${tx}, calc(-50% + ${offY - 18}px)) scale(1.34)`, opacity: 1, offset: .3 },
          { transform: `translate(${tx}, calc(-50% + ${offY - 9}px)) scale(1)`, opacity: 1, offset: .55 },
          { transform: `translate(${tx}, calc(-50% + ${offY - 9}px)) scale(1)`, opacity: 1, offset: .74 },
          { transform: `translate(${tx}, calc(-50% + ${offY - 82}px)) scale(.9)`, opacity: 0 },
        ], { duration: motionReduced ? 700 : 900, easing: 'cubic-bezier(.22,.9,.28,1)', fill: 'forwards' });
        pop.addEventListener('finish', () => ghost.remove(), { once: true });
      } catch {
        ghost.remove();
      }
    };

    // Phase 1: fling out with friction while tumbling, until the number has
    // swept 75% of a half-turn (135°).
    const step = (now) => {
      if (last == null) last = now;
      let dt = now - last;
      last = now;
      if (dt > 48) dt = 48; // clamp large gaps (e.g. tab switch)
      elapsed += dt;

      // Spawn-in ramp, then settle scale toward 1.
      if (elapsed < 130) {
        const t = elapsed / 130;
        opacity = Math.min(1, t * 1.3);
        scale = 0.35 + (1.12 - 0.35) * t;
      } else {
        opacity = 1;
        scale += (1 - scale) * Math.min(1, dt / 90);
      }

      // Friction slows the translation until the pop can take over.
      const damp = Math.pow(GHOST_FRICTION, dt);
      velX *= damp; velY *= damp;
      offX += velX * dt;
      offY += velY * dt;

      const nearingStop = elapsed > 100 && Math.hypot(velX, velY) <= GHOST_POP_SPEED;
      if (nearingStop || elapsed >= GHOST_DRIFT_MAX_MS) {
        paint();
        popAndVanish();
        return;
      }
      paint();
      requestAnimationFrame(step);
    };

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(step);
    } else {
      popAndVanish();
    }
  }

  function classString(slot) {
    const child = slot.querySelector('.pv2-project-tile');
    return `${slot.className} ${child?.className || ''}`;
  }

  function anchorFor(slot, width, height) {
    const classes = classString(slot);
    if (classes.includes('project-tile--top')) return { x: width * .50, y: height * .12 };
    if (classes.includes('project-tile--left')) return { x: width * .13, y: height * .44 };
    if (classes.includes('project-tile--right')) return { x: width * .87, y: height * .44 };
    if (classes.includes('project-tile--bottom-left')) return { x: width * .20, y: height * .80 };
    if (classes.includes('project-tile--bottom-right')) return { x: width * .80, y: height * .80 };
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
    award(effects.wallValue, `wall-${side}`, impact, { vx: body.vx, vy: body.vy });
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
    if (a.armed || b.armed) {
      const until = Math.max(a.armedUntil, b.armedUntil);
      a.armed = true; b.armed = true;
      a.armedUntil = until; b.armedUntil = until;
    }
    return true;
  }

  // Tight bounding box of an element's rendered text lines, so a wide, mostly
  // empty text block collides only where its words actually are.
  function textBounds(el) {
    try {
      const range = document.createRange();
      range.selectNodeContents(el);
      const rects = range.getClientRects();
      let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
      for (const r of rects) {
        if (r.width < 1 || r.height < 1) continue;
        left = Math.min(left, r.left);
        top = Math.min(top, r.top);
        right = Math.max(right, r.right);
        bottom = Math.max(bottom, r.bottom);
      }
      if (!Number.isFinite(left)) return el.getBoundingClientRect();
      return { left, top, right, bottom, width: right - left, height: bottom - top };
    } catch {
      return el.getBoundingClientRect();
    }
  }

  function unionTextBounds(selectors) {
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const r = textBounds(el);
      left = Math.min(left, r.left);
      top = Math.min(top, r.top);
      right = Math.max(right, r.right);
      bottom = Math.max(bottom, r.bottom);
    }
    if (!Number.isFinite(left)) return null;
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  }

  // Measure the bumpers' stage-LOCAL geometry. This is the expensive part —
  // querySelector + Range.getClientRects (forced layout) — so it runs only when
  // the cache is cold (init/resize/reflow), not every frame. Local coords are
  // scroll-stable because the bumpers scroll with the stage.
  function measureBumperGeom(stageRect) {
    // The statement collides against its heading + paragraph text, not the full
    // padded block (its eyebrow line and the empty corners are excluded).
    const candidates = [
      ['statement', document.querySelector('.pv2-overview__statement'), ['.pv2-overview__statement h1', '.pv2-overview__statement > p:last-child']],
      ['ux-work', document.querySelector('.pv2-gateway-link--ux'), null],
      ['all-games', document.querySelector('.pv2-gateway-link--unfinished'), null],
    ];
    return candidates
      .filter(([, el]) => el?.isConnected)
      .map(([id, el, textSels]) => {
        const rect = (textSels && unionTextBounds(textSels)) || el.getBoundingClientRect();
        return { id, el, x: rect.left - stageRect.left, y: rect.top - stageRect.top, w: rect.width, h: rect.height };
      });
  }

  function invalidateBumpers() { bumperGeom = null; }

  function bumperRects(stageRect) {
    if (!bumperGeom) bumperGeom = measureBumperGeom(stageRect);
    // Rebuild each caller's absolute `viewport` from cached local coords + the
    // current stageRect (cheap arithmetic, no layout), so scrolling stays exact.
    return bumperGeom.map((g) => {
      const left = stageRect.left + g.x;
      const top = stageRect.top + g.y;
      return { ...g, viewport: { left, top, right: left + g.w, bottom: top + g.h, width: g.w, height: g.h } };
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
    const isArmed = body.armed && now < body.armedUntil;
    // A bounce and a point are one and the same: a bumper only reacts to a
    // genuine armed strike during play. `entering` already dedupes a multi-frame
    // overlap, so a block that leaves and returns is a fresh strike — a tight
    // wall<->bumper loop therefore scores (and re-launches) every lap, which is
    // exactly the perpetual loop the speed / bounce upgrades are meant to enable.
    const poweredHit = entering && isArmed && gameActive;

    if (poweredHit) {
      const impact = impactPoint(body, bumper, horizontal);
      // Velocity is read before the bumper kick below flips it, so this is the
      // block's incoming travel direction — the way it was heading on impact.
      award(effects.bumperValue, bumper.id, impact, { vx: body.vx, vy: body.vy });
      pulseBumper(bumper.el);
      // Battle mode (portfolio-battle.js) listens for these to detect a
      // Critical Combo (5 bumper hits within 1s) and trigger a battle.
      window.dispatchEvent(new CustomEvent('pv2:bumper-hit', { detail: { id: bumper.id, x: impact.x, y: impact.y } }));
    } else if (gameActive) {
      // Mid-game a contact that doesn't score doesn't bounce either: the block
      // phases through so it can never be knocked back without a point. (Idle,
      // below, keeps bumpers solid so the resting layout stays tidy.)
      return true;
    }

    const softFloor = window.innerWidth <= MOBILE_BREAKPOINT ? MOBILE_UNARMED_BUMPER_KICK : NORMAL_SPEED * 1.8;
    // A scored strike = a fixed launch. The soft path only runs while idle, so
    // drifting blocks reflect gently off the text instead of stopping dead.
    if (horizontal) {
      const sign = dx >= 0 ? 1 : -1;
      body.x += Math.max(0, overlapX) * sign;
      body.vx = (poweredHit
        ? BUMPER_KICK * effects.bumperKickMult
        : Math.max(softFloor, Math.abs(body.vx) * SOFT_BUMPER_RESTITUTION)) * sign;
      if (poweredHit) body.vy *= 1.12;
    } else {
      const sign = dy >= 0 ? 1 : -1;
      body.y += Math.max(0, overlapY) * sign;
      body.vy = (poweredHit
        ? BUMPER_KICK * effects.bumperKickMult
        : Math.max(softFloor, Math.abs(body.vy) * SOFT_BUMPER_RESTITUTION)) * sign;
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
    const speed = reducedMotion()
      ? REDUCED_SPEED
      : window.innerWidth <= MOBILE_BREAKPOINT ? MOBILE_START_SPEED : NORMAL_SPEED;
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
      armed: false,
      armedUntil: 0,
      friction: 0,
      frictionSpent: false,
      halo: ensureHeatHalo(el),
      heatTier: -1,
      heatOpacity: 0,
    };
  }

  // A transparent-centered overlay pinned to the block; its glowing border is
  // the heat readout. Reused across re-inits so we never stack duplicates.
  function ensureHeatHalo(el) {
    let halo = el.querySelector(':scope > .pv2-heat-halo');
    if (halo) return halo;
    const tile = el.querySelector('.pv2-project-tile') || el;
    halo = document.createElement('div');
    halo.className = 'pv2-heat-halo';
    halo.setAttribute('aria-hidden', 'true');
    let radius = '16px';
    try { radius = getComputedStyle(tile).borderRadius || radius; } catch {}
    Object.assign(halo.style, {
      position: 'absolute', inset: '0', pointerEvents: 'none',
      borderRadius: radius, opacity: '0', zIndex: '3',
      transition: 'opacity 120ms linear', willChange: 'opacity',
    });
    el.appendChild(halo);
    return halo;
  }

  function collideWithPointer(event, pointerVx = 0, pointerVy = 0) {
    const now = performance.now();
    if (!stage || document.documentElement.classList.contains('pv2-upgrades-open')) return;

    const effects = currentEffects();
    for (const body of bodies) {
      const rect = body.el.getBoundingClientRect();
      const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (inside && !body.pointerInside && now - body.lastPointerHit >= POINTER_COOLDOWN) {
        let dx = pointerVx;
        let dy = pointerVy;
        let length = Math.hypot(dx, dy);
        if (length < .01) {
          dx = rect.left + rect.width / 2 - event.clientX;
          dy = rect.top + rect.height / 2 - event.clientY;
          length = Math.hypot(dx, dy) || 1;
        }
        const pointerSpeed = Math.hypot(pointerVx, pointerVy);
        const impulse = clamp(POINTER_MIN_IMPULSE + pointerSpeed * .24, POINTER_MIN_IMPULSE, POINTER_IMPULSE) * effects.pointerImpulseMult;
        body.vx += (dx / length) * impulse;
        body.vy += (dy / length) * impulse;
        body.lastPointerHit = now;
        body.armed = true;
        body.armedUntil = now + ARMED_DURATION;
        // A flick sheds heat, so a settled (fully-heated) block wakes and moves
        // again. Autopilot flicks (in tick) deliberately don't, letting an
        // idle-driven block keep heating toward a burn.
        body.friction = Math.max(0, body.friction - FLICK_COOL);
        spawnImpactLines(event, rect);
        activateGame();
      }
      body.pointerInside = inside;
    }
  }

  function handlePointerDown(event) {
    if (bushido) return;
    if (event.pointerType !== 'touch') return;
    pointer = { x: event.clientX, y: event.clientY, t: performance.now() };
    collideWithPointer(event);
  }

  function handlePointerMove(event) {
    if (bushido) return; // Bushido tracks the pointer itself for slicing
    const now = performance.now();
    const firstSample = pointer.x <= -9000;
    const dt = Math.max(8, now - pointer.t || 16);
    const pointerVx = firstSample ? 0 : (event.clientX - pointer.x) / dt;
    const pointerVy = firstSample ? 0 : (event.clientY - pointer.y) / dt;
    pointer = { x: event.clientX, y: event.clientY, t: now };
    if (firstSample) return;
    collideWithPointer(event, pointerVx, pointerVy);
  }

  function handlePointerEnd(event) {
    if (event.pointerType !== 'touch') return;
    pointer = { x: -9999, y: -9999, t: 0 };
    for (const body of bodies) body.pointerInside = false;
  }

  // ===================== Bushido: double-click slice time ==================
  // Slice-time ability. Double-clicking the work-area whitespace freezes the
  // games as white boxes; the player's mouse strokes across a box record cut
  // lines; when the timer ends the boxes become the real game blocks sliced
  // along those cuts, and the shards explode around the stage before the games
  // fade back in. Piece motion is a light particle sim (bounding-circle
  // collisions + visual spin), not a full rigid-body solver.

  // Signed area (shoelace) of a polygon given as [{x,y},…] — box-local px.
  function polyArea(pts) {
    let a = 0;
    for (let i = 0; i < pts.length; i += 1) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      a += p.x * q.y - q.x * p.y;
    }
    return Math.abs(a) / 2;
  }

  function polyCentroid(pts) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < pts.length; i += 1) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      const cross = p.x * q.y - q.x * p.y;
      a += cross; cx += (p.x + q.x) * cross; cy += (p.y + q.y) * cross;
    }
    if (Math.abs(a) < 1e-6) {
      const n = pts.length || 1;
      return { x: pts.reduce((s, p) => s + p.x, 0) / n, y: pts.reduce((s, p) => s + p.y, 0) / n };
    }
    a *= 0.5;
    return { x: cx / (6 * a), y: cy / (6 * a) };
  }

  // Split a convex polygon by the infinite line through a→b into ≤2 polygons.
  function splitPolygon(poly, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const side = (p) => (p.x - a.x) * dy - (p.y - a.y) * dx;
    const left = [], right = [];
    for (let i = 0; i < poly.length; i += 1) {
      const cur = poly[i], nxt = poly[(i + 1) % poly.length];
      const sc = side(cur), sn = side(nxt);
      if (sc >= 0) left.push(cur);
      if (sc <= 0) right.push(cur);
      if ((sc > 0 && sn < 0) || (sc < 0 && sn > 0)) {
        const t = sc / (sc - sn);
        const ip = { x: cur.x + t * (nxt.x - cur.x), y: cur.y + t * (nxt.y - cur.y) };
        left.push(ip); right.push(ip);
      }
    }
    const out = [];
    if (left.length >= 3 && polyArea(left) > 4) out.push(left);
    if (right.length >= 3 && polyArea(right) > 4) out.push(right);
    return out.length ? out : [poly];
  }

  // The persistent cooldown badge: a small ring with the katana icon + label.
  // The ring is full when ready; on activation it empties and fills clockwise
  // over the cooldown via an SVG stroke-dashoffset transition (pathLength=100).
  function ensureBushidoBadge() {
    if (bushidoBadge?.isConnected) return bushidoBadge;
    bushidoBadge = document.createElement('div');
    bushidoBadge.className = 'pv2-bushido-badge';
    bushidoBadge.setAttribute('aria-hidden', 'true');
    bushidoBadge.innerHTML =
      '<span class="pv2-bushido-badge__ring">'
      + '<svg viewBox="0 0 36 36">'
      + '<circle class="pv2-bushido-badge__track" cx="18" cy="18" r="15.5"></circle>'
      + '<circle class="pv2-bushido-badge__prog" cx="18" cy="18" r="15.5" pathLength="100" stroke-dasharray="100" stroke-dashoffset="0"></circle>'
      + '</svg>'
      + `<span class="pv2-bushido-badge__icon">${iconSvg('katana')}</span>`
      + '</span>'
      + '<span class="pv2-bushido-badge__label">Bushido</span>';
    bushidoRing = bushidoBadge.querySelector('.pv2-bushido-badge__prog');
    document.body.appendChild(bushidoBadge);
    return bushidoBadge;
  }

  function refreshBushidoBadge() {
    ensureBushidoBadge().classList.toggle('is-visible', hasUpgrade('flux-bushido') && gameActive);
  }

  function startBushidoCooldown(now) {
    bushidoCooldownUntil = now + BUSHIDO_COOLDOWN;
    if (!bushidoRing) return;
    // Empty the ring instantly, then let it refill over the cooldown window.
    bushidoRing.style.transition = 'none';
    bushidoRing.style.strokeDashoffset = '100';
    requestAnimationFrame(() => {
      if (!bushidoRing) return;
      bushidoRing.style.transition = `stroke-dashoffset ${BUSHIDO_COOLDOWN}ms linear`;
      bushidoRing.style.strokeDashoffset = '0';
    });
  }

  function pulseBushidoBadge() {
    refreshBushidoBadge();
    if (!bushidoBadge) return;
    bushidoBadge.classList.remove('is-denied');
    // Force reflow so re-adding the class restarts the animation.
    void bushidoBadge.offsetWidth;
    bushidoBadge.classList.add('is-denied');
    window.setTimeout(() => bushidoBadge?.classList.remove('is-denied'), 1000);
  }

  function handleBushidoDblClick(event) {
    if (battlePaused || !gameActive || !stage) return;
    if (!hasUpgrade('flux-bushido')) return;
    if (upgradeOverlay?.classList.contains('is-open')) return;
    // Leave real interactive targets alone; only the work-area whitespace arms it.
    if (event.target.closest?.('a, button, input, textarea, .pv2-score-counter, .pv2-upgrade-overlay, .pv2-bushido-badge')) return;
    const r = stage.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) return;
    if (bushido) return;                                   // already mid-ability
    if (performance.now() < bushidoCooldownUntil) { pulseBushidoBadge(); return; } // on cooldown
    startBushido();
  }

  function startBushido() {
    if (bushido || !stage || !gameActive || !bodies.length) return;
    refreshBushidoBadge();
    startBushidoCooldown(performance.now());
    const stageRect = stage.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.className = 'pv2-bushido-black';
    overlay.setAttribute('aria-hidden', 'true');
    stage.appendChild(overlay);

    const boxes = bodies.map((body) => {
      const el = document.createElement('div');
      el.className = 'pv2-bushido-box';
      el.style.left = `${body.x}px`;
      el.style.top = `${body.y}px`;
      el.style.width = `${body.w}px`;
      el.style.height = `${body.h}px`;
      overlay.appendChild(el);
      body.el.style.visibility = 'hidden'; // freeze + hide the real block
      return { body, x: body.x, y: body.y, w: body.w, h: body.h, el, inside: false, entry: null, cuts: [] };
    });

    const hud = document.createElement('div');
    hud.className = 'pv2-bushido-hud';
    hud.innerHTML = '<span class="pv2-bushido-hud__label">BUSHIDO</span>'
      + '<span class="pv2-bushido-hud__track"><span class="pv2-bushido-hud__fill"></span></span>';
    document.body.appendChild(hud);
    const fill = hud.querySelector('.pv2-bushido-hud__fill');
    requestAnimationFrame(() => {
      fill.style.transition = `width ${BUSHIDO_DURATION}ms linear`;
      fill.style.width = '0%';
    });

    document.documentElement.classList.add('pv2-bushido-on');
    bushido = { phase: 'slice', start: performance.now(), shatterStart: 0, stageRect, overlay, hud, boxes, pieces: [] };
    window.addEventListener('pointermove', bushidoPointerMove, { passive: true });
  }

  function drawCut(box, a, b) {
    const line = document.createElement('span');
    line.className = 'pv2-bushido-cut';
    line.style.width = `${Math.hypot(b.x - a.x, b.y - a.y)}px`;
    line.style.left = `${a.x}px`;
    line.style.top = `${a.y}px`;
    line.style.transform = `rotate(${Math.atan2(b.y - a.y, b.x - a.x)}rad)`;
    box.el.appendChild(line);
  }

  // Record a cut whenever the pointer crosses a box and leaves it: the chord
  // from where it entered to where it exited defines the slice line.
  function bushidoPointerMove(event) {
    if (!bushido || bushido.phase !== 'slice') return;
    const r = stage.getBoundingClientRect();
    const px = event.clientX - r.left;
    const py = event.clientY - r.top;
    for (const box of bushido.boxes) {
      const inside = px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h;
      if (inside && !box.inside) {
        box.inside = true;
        box.entry = { x: clamp(px - box.x, 0, box.w), y: clamp(py - box.y, 0, box.h) };
      } else if (!inside && box.inside) {
        box.inside = false;
        if (box.entry && box.cuts.length < BUSHIDO_MAX_CUTS) {
          const exit = { x: clamp(px - box.x, 0, box.w), y: clamp(py - box.y, 0, box.h) };
          if (Math.hypot(exit.x - box.entry.x, exit.y - box.entry.y) > 6) {
            box.cuts.push({ a: box.entry, b: exit });
            drawCut(box, box.entry, exit);
          }
        }
        box.entry = null;
      }
    }
  }

  // Slice window over: turn each white box into the real block, cut along the
  // recorded chords, and hand the shards outward velocities + spin.
  function endSlicing() {
    const stageRect = bushido.stageRect;
    const centerX = stageRect.width / 2, centerY = stageRect.height / 2;
    for (const box of bushido.boxes) {
      let polys = [[
        { x: 0, y: 0 }, { x: box.w, y: 0 }, { x: box.w, y: box.h }, { x: 0, y: box.h },
      ]];
      for (const cut of box.cuts) {
        const next = [];
        for (const poly of polys) for (const part of splitPolygon(poly, cut.a, cut.b)) next.push(part);
        polys = next;
      }
      box.el.remove();
      const boxCX = box.x + box.w / 2, boxCY = box.y + box.h / 2;
      for (const poly of polys) {
        const c = polyCentroid(poly);
        const area = polyArea(poly);
        const el = box.body.el.cloneNode(true);
        el.classList.add('pv2-bushido-piece');
        el.removeAttribute('data-node-id');
        Object.assign(el.style, {
          position: 'absolute', left: `${box.x}px`, top: `${box.y}px`,
          width: `${box.w}px`, height: `${box.h}px`, margin: '0', visibility: 'visible',
          transition: 'none', pointerEvents: 'none', opacity: '1',
          clipPath: `polygon(${poly.map((p) => `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`).join(',')})`,
          transformOrigin: `${c.x.toFixed(1)}px ${c.y.toFixed(1)}px`,
        });
        bushido.overlay.appendChild(el);
        const cx = box.x + c.x, cy = box.y + c.y;
        const ox = cx - boxCX, oy = cy - boxCY, ol = Math.hypot(ox, oy) || 1;
        const bx = boxCX - centerX, by = boxCY - centerY, bl = Math.hypot(bx, by) || 1;
        const speed = 0.18 + Math.random() * 0.32;
        bushido.pieces.push({
          el, cx, cy, homeCx: cx, homeCy: cy,
          vx: (ox / ol) * speed + (bx / bl) * 0.06 + (Math.random() - 0.5) * 0.12,
          vy: (oy / ol) * speed + (by / bl) * 0.06 + (Math.random() - 0.5) * 0.12,
          angle: 0, va: (Math.random() - 0.5) * (reducedMotion() ? 0.006 : 0.03),
          r: Math.max(6, 0.42 * Math.sqrt(Math.max(1, area))),
        });
      }
    }
    bushido.phase = 'shatter';
    bushido.shatterStart = performance.now();
    window.removeEventListener('pointermove', bushidoPointerMove);
  }

  function updateBushido(now, dt) {
    if (bushido.phase === 'slice') {
      if (now - bushido.start >= BUSHIDO_DURATION) endSlicing();
      return;
    }
    if (bushido.phase !== 'shatter') return;
    const { width: W, height: H } = bushido.stageRect;
    const bumpers = bumperRects(bushido.stageRect);
    const pieces = bushido.pieces;
    let maxSpeed = 0;
    for (const p of pieces) {
      p.vy += 0.00004 * dt;                 // faint gravity so shards settle low
      p.vx *= Math.pow(0.9975, dt);
      p.vy *= Math.pow(0.9975, dt);
      p.cx += p.vx * dt;
      p.cy += p.vy * dt;
      p.angle += p.va * dt;
      if (p.cx < p.r) { p.cx = p.r; p.vx = Math.abs(p.vx) * 0.62; p.va += 0.004; }
      else if (p.cx > W - p.r) { p.cx = W - p.r; p.vx = -Math.abs(p.vx) * 0.62; p.va -= 0.004; }
      if (p.cy < p.r) { p.cy = p.r; p.vy = Math.abs(p.vy) * 0.62; }
      else if (p.cy > H - p.r) { p.cy = H - p.r; p.vy = -Math.abs(p.vy) * 0.62; p.vx *= 0.92; }
      for (const bm of bumpers) {
        const nx = clamp(p.cx, bm.x, bm.x + bm.w);
        const ny = clamp(p.cy, bm.y, bm.y + bm.h);
        let ddx = p.cx - nx, ddy = p.cy - ny, d = Math.hypot(ddx, ddy);
        if (d < p.r) {
          if (d < 0.01) { ddx = p.cx - (bm.x + bm.w / 2); ddy = p.cy - (bm.y + bm.h / 2); d = Math.hypot(ddx, ddy) || 1; }
          const nxn = ddx / d, nyn = ddy / d;
          p.cx += nxn * (p.r - d); p.cy += nyn * (p.r - d);
          const vn = p.vx * nxn + p.vy * nyn;
          if (vn < 0) { p.vx -= 1.4 * vn * nxn; p.vy -= 1.4 * vn * nyn; p.va += (Math.random() - 0.5) * 0.01; }
        }
      }
      maxSpeed = Math.max(maxSpeed, Math.hypot(p.vx, p.vy));
    }
    for (let i = 0; i < pieces.length; i += 1) {
      for (let j = i + 1; j < pieces.length; j += 1) {
        const a = pieces[i], b = pieces[j];
        const ddx = b.cx - a.cx, ddy = b.cy - a.cy, d = Math.hypot(ddx, ddy), min = a.r + b.r;
        if (d < min && d > 0.01) {
          const nxn = ddx / d, nyn = ddy / d, push = (min - d) / 2;
          a.cx -= nxn * push; a.cy -= nyn * push;
          b.cx += nxn * push; b.cy += nyn * push;
          const rel = (b.vx - a.vx) * nxn + (b.vy - a.vy) * nyn;
          if (rel < 0) { const imp = rel * 0.5; a.vx += imp * nxn; a.vy += imp * nyn; b.vx -= imp * nxn; b.vy -= imp * nyn; }
        }
      }
    }
    for (const p of pieces) {
      p.el.style.transform = `translate(${(p.cx - p.homeCx).toFixed(2)}px, ${(p.cy - p.homeCy).toFixed(2)}px) rotate(${p.angle.toFixed(3)}rad)`;
    }
    const elapsed = now - bushido.shatterStart;
    if (elapsed > 500 && (maxSpeed < BUSHIDO_SETTLE_SPEED || elapsed > BUSHIDO_SHATTER_MAX)) finishBushido();
  }

  function finishBushido() {
    if (!bushido || bushido.phase === 'restore') return;
    bushido.phase = 'restore';
    const b = bushido;
    for (const p of b.pieces) { p.el.style.transition = 'opacity 600ms ease'; p.el.style.opacity = '0'; }
    b.overlay.style.transition = 'opacity 600ms ease';
    b.overlay.style.opacity = '0';
    if (b.hud) { b.hud.style.transition = 'opacity 400ms ease'; b.hud.style.opacity = '0'; }
    for (const box of b.boxes) {
      const el = box.body.el;
      el.style.visibility = 'visible';
      el.style.opacity = '0';
      el.style.transition = 'opacity 600ms ease';
      requestAnimationFrame(() => { el.style.opacity = '1'; });
    }
    window.setTimeout(() => {
      b.overlay.remove();
      b.hud?.remove();
      for (const box of b.boxes) { box.body.el.style.transition = ''; box.body.el.style.opacity = ''; }
      document.documentElement.classList.remove('pv2-bushido-on');
      if (bushido === b) bushido = null;
      lastTime = 0;
    }, 680);
  }

  // Tear down a Bushido session immediately (e.g. the stage is being rebuilt).
  function abortBushido() {
    if (!bushido) return;
    window.removeEventListener('pointermove', bushidoPointerMove);
    bushido.overlay?.remove();
    bushido.hud?.remove();
    for (const box of bushido.boxes) {
      box.body.el.style.visibility = '';
      box.body.el.style.transition = '';
      box.body.el.style.opacity = '';
    }
    document.documentElement.classList.remove('pv2-bushido-on');
    bushido = null;
  }

  function tick(now) {
    if (!stage) {
      mark('waiting');
      frame = 0;
      return;
    }

    // Freeze the simulation while a battle is on top, but keep the loop alive.
    if (battlePaused) {
      lastTime = now;
      frame = requestAnimationFrame(tick);
      return;
    }

    // Bushido runs its own particle sim in place of the normal simulation.
    if (bushido) {
      const bdt = clamp(lastTime ? now - lastTime : 16.667, 8, 32);
      lastTime = now;
      updateBushido(now, bdt);
      frame = requestAnimationFrame(tick);
      return;
    }

    const dt = clamp(lastTime ? now - lastTime : 16.667, 8, 32);
    lastTime = now;
    const stageRect = stage.getBoundingClientRect();
    const effects = currentEffects();
    const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
    const damping = mobile ? Math.pow(effects.damping, MOBILE_DRAG_EXP) : effects.damping;
    const speedFloor = (reducedMotion() ? REDUCED_SPEED : NORMAL_SPEED) * effects.speedMult * effects.speedFloorMult * (mobile ? MOBILE_FLOOR_SCALE : 1);
    // Heat only builds above the live drift floor, so ambient drift never heats
    // (and never self-settles) no matter how high upgrades push the floor.
    const heatThreshold = Math.max(HEAT_THRESHOLD, speedFloor * HEAT_MARGIN);
    const maxSpeed = (reducedMotion() ? REDUCED_MAX_SPEED : MAX_SPEED) * effects.maxSpeedMult;
    const t = now / 1000;

    // Idle Engine: passive points once unlocked (point multiplier also applies).
    if (gameActive && effects.idlePerSec > 0) {
      idleBank += effects.idlePerSec * effects.pointMult * (dt / 1000);
      if (idleBank >= 1) {
        const whole = Math.floor(idleBank);
        idleBank -= whole;
        addIdlePoints(whole);
      }
    }

    // Autopilot: periodically flick a random block so points keep flowing.
    if (gameActive && effects.autoFlick && bodies.length) {
      autoFlickTimer += dt;
      if (autoFlickTimer >= AUTO_FLICK_INTERVAL) {
        autoFlickTimer = 0;
        const body = bodies[Math.floor(Math.random() * bodies.length)];
        const angle = Math.random() * Math.PI * 2;
        const impulse = POINTER_IMPULSE * 0.85 * effects.pointerImpulseMult;
        body.vx += Math.cos(angle) * impulse;
        body.vy += Math.sin(angle) * impulse;
        body.armed = true;
        body.armedUntil = now + ARMED_DURATION;
      }
    }

    for (const body of bodies) {
      // Let a flick's armed state lapse so blocks eventually settle instead of
      // scoring off bumpers (and re-launching) indefinitely.
      if (body.armed && now >= body.armedUntil) body.armed = false;
      body.vx += (body.homeX - body.x) * HOME_PULL * dt;
      body.vy += (body.homeY - body.y) * HOME_PULL * dt;
      if (effects.gravity) body.vy += effects.gravity * dt;
      if (!reducedMotion()) {
        body.vx += Math.sin(t * .41 + body.phase) * .000014 * dt;
        body.vy += Math.cos(t * .37 + body.phase * 1.23) * .000014 * dt;
      }
      body.vx *= Math.pow(damping, dt);
      body.vy *= Math.pow(damping, dt);
      // Heat adds its own drag on top, growing as the meter fills.
      if (body.friction > 0) {
        const fDamp = Math.pow(FRICTION_DAMP_BASE, body.friction * dt);
        body.vx *= fDamp;
        body.vy *= fDamp;
      }
      const speed = Math.hypot(body.vx, body.vy);
      // Build heat while moving faster than the ambient drift, shed it below —
      // so idle blocks stay cool and only launched ones heat toward a stop.
      const heat = speed - heatThreshold;
      if (heat > 0) body.friction = Math.min(1, body.friction + heat * FRICTION_GAIN * dt);
      else body.friction = Math.max(0, body.friction - FRICTION_RELIEF * dt);
      if (body.friction >= 1 && !body.frictionSpent) {
        body.frictionSpent = true;
        if (gameActive && body.armed) frictionBurn(body);
      } else if (body.friction < FRICTION_REARM) {
        body.frictionSpent = false;
      }
      updateHeatVisual(body);
      // Heat suppresses the drift floor so a hot block can actually come to rest
      // (at full heat the floor is zero); it returns as the block cools.
      const effFloor = speedFloor * (1 - body.friction);
      if (speed < effFloor) {
        const angle = body.phase + t * .16;
        body.vx += Math.cos(angle) * (effFloor - speed) * .16;
        body.vy += Math.sin(angle) * (effFloor - speed) * .16;
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
    abortBushido();
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    for (const body of bodies) if (body.halo) body.halo.style.opacity = '0';
    bodies = [];
    invalidateBumpers();
    lastTime = 0;
    autoFlickTimer = 0;
    document.documentElement.classList.remove('pv2-physics-live');
    setScoreVisible(false);
  }

  // Position-only push that guarantees a freshly spawned block sits clear of
  // every text block (bumper), preferring whichever axis has room.
  function ejectFromBumpers(body, stageRect, bumpers) {
    const minY = stageTopLimit(stageRect);
    const maxX = Math.max(EDGE_PADDING, stageRect.width - body.w - EDGE_PADDING);
    const maxY = Math.max(minY, stageRect.height - body.h - EDGE_PADDING);
    for (let iter = 0; iter < 30; iter += 1) {
      let moved = false;
      for (const bumper of bumpers) {
        if (!overlaps(bodyRect(body), bumper, BODY_GAP)) continue;
        let dx = (body.x + body.w / 2) - (bumper.x + bumper.w / 2);
        let dy = (body.y + body.h / 2) - (bumper.y + bumper.h / 2);
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) dy = -1;
        const overlapX = (body.w + bumper.w) / 2 + BODY_GAP - Math.abs(dx);
        const overlapY = (body.h + bumper.h) / 2 + BODY_GAP - Math.abs(dy);
        // Take the shorter escape, but never one the walls can't fit.
        const canX = overlapX <= (dx >= 0 ? maxX - body.x : body.x - EDGE_PADDING) + 0.5;
        const preferX = overlapX < overlapY ? canX : false;
        if (preferX) body.x += (dx >= 0 ? 1 : -1) * overlapX;
        else body.y += (dy >= 0 ? 1 : -1) * overlapY;
        moved = true;
      }
      body.x = clamp(body.x, EDGE_PADDING, maxX);
      body.y = clamp(body.y, minY, maxY);
      if (!moved) break;
    }
  }

  function init() {
    teardown();
    stage = document.querySelector('.pv2-overview__stage');
    if (!stage) {
      mark('waiting-for-overview');
      return;
    }
    // offsetWidth 0 ⇒ the slot is display:none (e.g. tiles hidden on mobile),
    // so it can't be a physics body.
    const elements = [...stage.querySelectorAll('.pv2-float-slot')].filter((el) => el.querySelector('.pv2-project-tile') && el.offsetWidth > 0);
    if (!elements.length) { mark('waiting-for-bodies'); return; }

    // Switch CSS into floating-stage mode (desktop + mobile) before measuring so
    // the stage reports its play-area height rather than the static grid height.
    document.documentElement.classList.add('pv2-physics-live');

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

    // Final guarantee: no block starts overlapping a text block.
    const spawnBumpers = bumperRects(stageRect);
    for (const body of bodies) ejectFromBumpers(body, stageRect, spawnBumpers);

    for (const body of bodies) {
      body.homeX = body.x;
      body.homeY = body.y;
      body.contacts.clear();
      body.lastWallScore = -Infinity;
      body.el.style.left = `${body.x}px`;
      body.el.style.top = `${body.y}px`;
    }

    if (gameActive) setScoreVisible(true);
    refreshBushidoBadge();
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
    ensureBushidoBadge();
    refreshBushidoBadge();
    observer.observe(document.body, { childList: true, subtree: true });
    // Battle-mode bridge (portfolio-battle.js drives these).
    window.addEventListener('pv2:battle-pause', () => { battlePaused = true; });
    window.addEventListener('pv2:battle-resume', () => { battlePaused = false; lastTime = 0; });
    window.addEventListener('pv2:add-points', (event) => {
      const n = Math.max(0, Math.round(Number(event.detail?.n) || 0));
      if (n) { activateGame(); addIdlePoints(n); }
    });
    window.addEventListener('dblclick', handleBushidoDblClick);
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerEnd, { passive: true });
    window.addEventListener('pointercancel', handlePointerEnd, { passive: true });
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && upgradeOverlay?.classList.contains('is-open')) closeUpgradeTree();
    });
    window.addEventListener('resize', () => {
      invalidateBumpers();
      clearTimeout(mutationTimer);
      mutationTimer = window.setTimeout(init, 100);
      if (upgradeOverlay?.classList.contains('is-open')) { clampTreePan(); applyTreeTransform(); }
    });
    init();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();