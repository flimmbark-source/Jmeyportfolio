(() => {
  const MOBILE_BREAKPOINT = 720;
  const EDGE_PADDING = 16;
  const BOTTOM_EDGE_PADDING = 0;
  const NAV_CLEARANCE = 10;
  const BODY_GAP = 10;
  const NORMAL_SPEED = 0.038;
  const REDUCED_SPEED = 0.012;
  const MOBILE_START_SPEED = 0.018;
  const MOBILE_UNARMED_BUMPER_KICK = 0.0192;
  const POINTER_IMPULSE = 0.18;
  const POINTER_MIN_IMPULSE = 0.11;
  const HOME_PULL = 0.00000042;
  const DAMPING = 0.9992;
  const MAX_SPEED = 0.66;
  const REDUCED_MAX_SPEED = 0.08;
  const POINTER_COOLDOWN = 85;
  // Context hover: after the same 1s dwell used by the label, gently settle
  // the hovered sphere onto the pointer so the player can inspect it in place.
  const CONTEXT_HOVER_DELAY = 1000;
  const CONTEXT_HOVER_FOLLOW_SPEED = 0.0018;
  const CONTEXT_HOVER_RESPONSE_MS = 110;
  const CONTEXT_HOVER_RELEASE_PAD = 28;
  // --- "Click to Explore!" nudge -------------------------------------------
  // The spheres are the way into the actual work, but nothing on the stage says
  // so — the Points box gets a "Click to Spend" sticker and the projects get
  // nothing. This is the same sticker pointed at a random game sphere, shown
  // occasionally rather than permanently: it is an invitation, not a label, so
  // it appears a handful of times and then stops asking.
  const EXPLORE_CUE_FIRST_DELAY = 16000;
  const EXPLORE_CUE_MIN_GAP = 48000;
  const EXPLORE_CUE_MAX_GAP = 80000;
  const EXPLORE_CUE_VISIBLE = 5400;
  const EXPLORE_CUE_MAX_SHOWS = 4;
  // Distance from the sphere's edge to the sticker's box. The arrow is an
  // ::after hanging off the box, so it eats about 24px of this — the remainder
  // is the clearance between the arrow's tip and the sphere. Too small and the
  // tip lands on the artwork, where a dark arrow on a dark sphere disappears.
  const EXPLORE_CUE_GAP = 32;
  const EXPLORE_CUE_MARGIN = 8;   // px of viewport breathing room
  const BUMPER_KICK = 0.384;
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
  const HEAT_MARGIN = 0.05;         // …and always this much (px/ms) ABOVE the live
                                    // drift floor. Additive, not a multiplier, so the
                                    // "hot" window stays a constant width no matter how
                                    // high speed upgrades push the floor — idle drift
                                    // still sits just under it, but launches/bumper
                                    // kicks clear it and heat again (a ×margin scaled
                                    // with the floor and swallowed every launch speed).
  const FRICTION_GAIN = 0.0044;     // heat gained per (speed − threshold) per ms
  const FRICTION_RELIEF = 0.00045;  // heat shed per ms while below threshold
  const FRICTION_DAMP_BASE = 0.988; // extra per-ms damping, exponent-scaled by heat
  const FRICTION_REARM = 0.35;      // heat must fall below this before it can burn again
  const FRICTION_BURN_BASE = 6;     // base points for a full-meter burn (× upgrades)
  const FLICK_COOL = 0.05;           // heat a player flick sheds (wakes a settled block)
  const HEAT_MIN_VISIBLE = 0.02;    // below this the heat halo stays hidden
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


  // --- Per-project progression --------------------------------------------
  // Each portfolio sphere levels independently from powered bumper hits.
  // Project information is deterministic; the three upgrade offers are rolled.
  const PROJECT_REVEALS = {
    'get-to-the-cafe': {
      title: 'Get to the Café',
      reveals: [
        'I made this game to explore how disability can make an ordinary outing feel very different from what someone else sees.',
        'Unseen demands affect what we can do, whether we want them to or not.',
        'I wanted to question how easily we read someone\'s behaviour as personality or attitude when we cannot see what they\'re dealing with.',
        'I turned those demands into accumulating tasks so the player encounters the pressure through play.',
        'I built the game in three days for GMTK Game Jam 2026. What you take from it is yours to discover.',
      ],
    },
    'letter-river': {
      title: 'Letter River',
      reveals: [
        'Learning Hebrew letters and words frustrated me. I wanted an enjoyable way for adults to learn through play.',
        'Letters float across the phone screen. You drag each one into the box for the sound it makes.',
        'I chose a simple, active interaction that players could immerse themselves in.',
      ],
    },
    'last-reading': {
      title: 'The Last Reading',
      reveals: [
        'Tarot interests me because it can feel deeply personal and mystical, reflecting something of the person interpreting it.',
        'I\'ve spent much of my life learning to recognise patterns I couldn\'t initially understand. I love that experience in games.',
        'The Last Reading explores finding meaning in incomplete information.',
        'I\'m developing a tarot horror roguelike where recognising patterns helps you play and uncover the story.',
        'I\'m still exploring how to weave mystery through its mechanics and narrative.',
      ],
    },
    rotogo: {
      title: 'Rotogo',
      reveals: [
        'Rotogo was the first game I made that people really enjoyed playing and felt offered them something different.',
        'It began as a physical game and became my first serious attempt to build a game with AI.',
        'Player research taught me to reduce mental load and make decisions quick and easy.',
        'The project helped me understand how research can shape a compelling product and its position in the market.',
      ],
    },
    'gig-duel': {
      title: 'Venue Rivals',
      reveals: [
        'Party House drew me in with simple rules, layered complexity, and room to take my time.',
        'I started Venue Rivals as something to occupy my mind and practise building with AI without requiring too much mental effort.',
        'I brought that inspiration to mobile, where friends can battle competing parties. The mobile game and friend battles are fully playable.',
      ],
    },
  };

  const PROJECT_UPGRADES = [
    { id: 'project-speed', title: 'Faster Drift', effect: '+15% drift speed', rarity: 'common', icon: 'wind', weight: 7, maxStacks: 4 },
    { id: 'project-cap', title: 'Top Speed', effect: '+20% velocity cap', rarity: 'common', icon: 'gauge', weight: 7, maxStacks: 4 },
    { id: 'project-launch', title: 'Quick Launch', effect: '+20% flick force', rarity: 'common', icon: 'rocket', weight: 7, maxStacks: 4 },
    { id: 'project-bounce', title: 'Better Bounce', effect: '+20% bumper rebound', rarity: 'common', icon: 'bounce', weight: 7, maxStacks: 4 },
    { id: 'project-walls', title: 'Hard Walls', effect: '+20% wall rebound', rarity: 'common', icon: 'shield', weight: 7, maxStacks: 4 },
    { id: 'project-glide', title: 'Glide', effect: '−15% drag', rarity: 'common', icon: 'feather', weight: 7, maxStacks: 4 },
    { id: 'project-keep', title: 'Kinetic Keep', effect: '+15% collision energy retained', rarity: 'common', icon: 'refresh', weight: 7, maxStacks: 4 },
    { id: 'project-value', title: 'Bumper Value', effect: '+1 point from this project\'s bumper hits', rarity: 'common', icon: 'coin', weight: 7, maxStacks: 3 },
    { id: 'project-learner', title: 'Fast Learner', effect: '+25% EXP from bumper hits', rarity: 'uncommon', icon: 'bolt', weight: 3, maxStacks: 3 },
    { id: 'project-echo', title: 'Echo Hit', effect: 'Every third bumper hit grants +1 EXP', rarity: 'uncommon', icon: 'echo', weight: 3, maxStacks: 1 },
    { id: 'project-shared', title: 'Shared Momentum', effect: 'Project collisions can grant both projects EXP', rarity: 'uncommon', icon: 'link', weight: 3, maxStacks: 1 },
    { id: 'project-second-wind', title: 'Second Wind', effect: 'First bumper after 5s without one grants +1 EXP', rarity: 'rare', icon: 'flame', weight: .8, maxStacks: 1 },
    { id: 'project-auto', title: 'Autopilot', effect: 'Occasionally launches itself', rarity: 'rare', icon: 'cpu', weight: .8, maxStacks: 1 },
    { id: 'project-gravity', title: 'Gravity Well', effect: 'This project gains its own gravity', rarity: 'rare', icon: 'gravity', weight: .8, maxStacks: 1 },
    { id: 'project-chain', title: 'Chain Reaction', effect: 'Bumper hits kick the nearest project', rarity: 'rare', icon: 'layers', weight: .8, maxStacks: 1 },
    { id: 'project-mentor', title: 'Mentor', effect: 'When this project levels, the lowest-level project gains EXP', rarity: 'rare', icon: 'target', weight: .8, maxStacks: 1 },
  ];

  // Genre labels flavor the incremental tree. The `soon` flag (none set now)
  // still greys a node out and blocks its purchase, kept for any future
  // scaffold-ahead node; every listed node currently affects the block game.
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
    { id: 'flux-crit', branch: 'flux', depth: 3, x: 300, y: 168, title: 'Critical Hit', effect: '15% crit · ×5 points', icon: 'target', cost: 150, requires: ['vel-accel', 'walls-hard'] },
    { id: 'flux-battle', branch: 'flux', depth: 4, x: 150, y: 58, title: 'Critical Combo', effect: '30% crit · chains ×4', icon: 'swords', cost: 320, requires: ['flux-crit'] },
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

  function mechanicThemeForUpgrade(upgrade) {
    const text = ((upgrade?.title || '') + ' ' + (upgrade?.effect || '')).toLowerCase();

    // Order matters: value/multiplier and energy phrases contain words like
    // "bumper", "wall" and "collision", but should use their own taxonomy icon.
    if (/×\s*(2|5)|multiply|compound interest/.test(text)) return 'multiplier';
    if (/\+\s*\d+(?:\.\d+)?\s*\/\s*(bumper|wall)|\bpoints?\b|\bvalue\b/.test(text)) return 'value';
    if (/near-zero drag|perpetual motion/.test(text)) return 'zero-drag';
    if (/collision energy|energy retained|collision keep|kinetic keep/.test(text)) return 'collision';
    if (/speed floor|acceleration/.test(text)) return 'speed-floor';
    if (/velocity cap|top speed|momentum/.test(text)) return 'velocity-cap';
    if (/flick force|flick impulse|\bflick\b|quick launch|\blaunch|\bkick\b/.test(text)) return 'launch';
    if (/hits? stack|\bstack\b|combo|chain/.test(text)) return 'stack';
    if (/\bdrag\b|friction|\bglide\b/.test(text)) return 'friction';
    if (/bumper|bounce|rebound|ricochet/.test(text)) return 'bounce';
    if (/critical|\bcrit\b|\bhit\b/.test(text)) return 'impact';
    if (/drift speed|\bspeed\b/.test(text)) return 'speed';
    return 'neutral';
  }

  const MECHANIC_ART = {
    speed: '/icons/mechanics/speed.webp',
    'speed-floor': '/icons/mechanics/speed-floor.webp',
    'velocity-cap': '/icons/mechanics/velocity-cap.webp',
    launch: '/icons/mechanics/launch.webp',
    bounce: '/icons/mechanics/bounce.webp',
    impact: '/icons/mechanics/impact.webp',
    stack: '/icons/mechanics/stack.webp',
    friction: '/icons/mechanics/friction.webp',
    'zero-drag': '/icons/mechanics/zero-drag.webp',
    collision: '/icons/mechanics/collision.webp',
    value: '/icons/mechanics/value.webp',
    multiplier: '/icons/mechanics/multiplier.webp',
  };

  function iconSvg(name, theme = 'neutral') {
    const inner = ICONS[name] || ICONS.core;
    return `<svg class="pv2-mechanic-icon pv2-mechanic-icon--${theme}" data-mechanic="${theme}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  }

  function upgradeIconMarkup(upgrade, theme = mechanicThemeForUpgrade(upgrade)) {
    const src = MECHANIC_ART[theme];
    if (src) {
      return `<img class="pv2-mechanic-art" src="${src}" alt="" draggable="false" decoding="async">`;
    }
    return iconSvg(upgrade.icon, theme);
  }

  function projectXpTarget(level) {
    return Math.max(4, Math.round(level * (level + 1) * 2));
  }

  function formatProjectXp(value) {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }

  function projectStateFor(id) {
    if (!projectProgressState.has(id)) {
      projectProgressState.set(id, {
        level: 1, xp: 0, upgrades: new Map(), bumperHits: 0,
        lastBumperAt: -Infinity, lastSharedXpAt: -Infinity, autoTimer: 0,
        // Memoized projectEffects() result; cleared when an upgrade is chosen.
        effectsCache: null,
        // The yellow bar lags the real xp: it holds what has been banked, and
        // catches up to the white read-out once the bumping stops.
        shownXp: 0, shownLevel: 1,
        xpCommitTimer: 0, xpResetTimer: 0, xpShowFull: false,
      });
    }
    return projectProgressState.get(id);
  }

  function projectUpgradeCount(body, id) {
    return body.projectState?.upgrades?.get(id) || 0;
  }

  // Read once per body in tick(), twice more per body from constrain(), and
  // once per candidate pair in the two collision passes — on the order of a
  // hundred times a frame. The values only change when a project upgrade is
  // chosen, so memoize on the body's own state and let that purchase path
  // invalidate it.
  function projectEffects(body) {
    const state = body.projectState;
    if (!state) return buildProjectEffects(body);
    if (!state.effectsCache) state.effectsCache = buildProjectEffects(body);
    return state.effectsCache;
  }

  function invalidateProjectEffects(body) {
    if (body?.projectState) body.projectState.effectsCache = null;
  }

  function buildProjectEffects(body) {
    const count = (id) => projectUpgradeCount(body, id);
    return {
      speedMult: 1 + count('project-speed') * .15,
      maxSpeedMult: 1 + count('project-cap') * .20,
      pointerImpulseMult: 1 + count('project-launch') * .20,
      bumperKickMult: 1 + count('project-bounce') * .20,
      wallKickMult: 1 + count('project-walls') * .20,
      dragExponent: Math.max(.35, 1 - count('project-glide') * .15),
      collisionBoostMult: 1 + count('project-keep') * .15,
      bumperPointBonus: count('project-value'),
      expMult: 1 + count('project-learner') * .25,
      echo: count('project-echo') > 0,
      sharedMomentum: count('project-shared') > 0,
      secondWind: count('project-second-wind') > 0,
      autoFlick: count('project-auto') > 0,
      gravity: count('project-gravity') > 0 ? GRAVITY_ACCEL : 0,
      chainReaction: count('project-chain') > 0,
      mentor: count('project-mentor') > 0,
    };
  }

  function ensureProjectProgressUI(body) {
    let el = body.el.querySelector(':scope > .pv2-project-progress');
    if (!el) {
      el = document.createElement('div');
      el.className = 'pv2-project-progress';
      el.setAttribute('aria-hidden', 'true');
      // Three strokes, painted in this order: the empty track, the white
      // "just earned" read-out, then the committed yellow over the top of it.
      // What stays visible as white is the gap between the two — the XP that
      // has landed but has not been banked yet.
      el.innerHTML =
        '<div class="pv2-project-progress__level">LV. <strong>1</strong></div>'
        + '<svg class="pv2-project-progress__arc" viewBox="0 0 100 30" preserveAspectRatio="none">'
        + '<path class="pv2-project-progress__track" d="M5 25 Q50 2 95 25" pathLength="100"></path>'
        + '<path class="pv2-project-progress__pending" d="M5 25 Q50 2 95 25" pathLength="100"></path>'
        + '<path class="pv2-project-progress__fill" d="M5 25 Q50 2 95 25" pathLength="100"></path>'
        + '</svg>'
        + '<div class="pv2-project-progress__exp">0 / 1 EXP</div>';
      body.el.appendChild(el);
    }
    body.progressEl = el;
    refreshProjectProgressUI(body);
    return el;
  }

  // How long the white read-out waits for the next bump before the yellow is
  // allowed to catch up to it.
  const XP_COMMIT_DELAY = 500;
  // Roughly the yellow stroke's CSS transition, so a filled bar is seen full
  // before it resets onto the next level.
  const XP_FULL_HOLD = 430;

  function setProgressStroke(path, ratio, instant) {
    if (!path) return;
    // `is-instant` kills the stroke's transition. Setting it in the same frame
    // as the offset means the browser only ever computes the end state, so no
    // forced reflow is needed to suppress the animation.
    path.classList.toggle('is-instant', Boolean(instant));
    path.style.strokeDashoffset = String(100 - clamp(ratio, 0, 1) * 100);
    if (instant) requestAnimationFrame(() => path.classList.remove('is-instant'));
  }

  // The yellow's value. It can sit a whole level behind the white one during
  // the brief "bar is full" beat, in which case it simply reads as full.
  function committedXpRatio(state) {
    if (state.xpShowFull) return 1;
    if (state.shownLevel < state.level) return 1;
    return clamp(state.shownXp / projectXpTarget(state.shownLevel), 0, 1);
  }

  // Bank the white read-out: the yellow animates from wherever it is up to it.
  function commitProjectXp(projectId) {
    const state = projectProgressState.get(projectId);
    if (!state) return;
    state.xpCommitTimer = 0;
    state.shownXp = state.xp;
    state.shownLevel = state.level;
    const body = liveProjectBody(projectId);
    if (body) refreshProjectProgressUI(body);
  }

  function scheduleProjectXpCommit(body) {
    const state = body.projectState;
    if (state.xpCommitTimer) window.clearTimeout(state.xpCommitTimer);
    state.xpCommitTimer = window.setTimeout(() => commitProjectXp(body.projectId), XP_COMMIT_DELAY);
  }

  // A level-up is the other trigger: the white read-out has run off the end of
  // the bar, so there is nothing to wait for. Hold both strokes full for a beat
  // — otherwise xp wrapping onto the next level would snap the bar backwards
  // before anyone saw it fill — then reset onto the new level.
  function flashProjectXpFull(body) {
    const state = body.projectState;
    if (state.xpCommitTimer) { window.clearTimeout(state.xpCommitTimer); state.xpCommitTimer = 0; }
    if (state.xpResetTimer) window.clearTimeout(state.xpResetTimer);
    state.xpShowFull = true;
    refreshProjectProgressUI(body);
    state.xpResetTimer = window.setTimeout(() => {
      state.xpResetTimer = 0;
      state.xpShowFull = false;
      state.shownXp = state.xp;
      state.shownLevel = state.level;
      const live = liveProjectBody(body.projectId);
      // `true` so the empty bar appears rather than unwinding backwards.
      if (live) refreshProjectProgressUI(live, false, true);
    }, XP_FULL_HOLD);
  }

  function refreshProjectProgressUI(body, flash = false, instant = false) {
    if (!body?.projectState) return;
    const el = body.progressEl || ensureProjectProgressUI(body);
    const state = body.projectState;
    const target = projectXpTarget(state.level);
    const ratio = state.xpShowFull ? 1 : clamp(state.xp / target, 0, 1);
    const level = el.querySelector('.pv2-project-progress__level strong');
    const exp = el.querySelector('.pv2-project-progress__exp');
    const fill = el.querySelector('.pv2-project-progress__fill');
    const pending = el.querySelector('.pv2-project-progress__pending');
    if (level) level.textContent = String(state.level);
    if (exp) exp.textContent = formatProjectXp(state.xp) + ' / ' + target + ' EXP';
    // White tracks the real xp with no easing at all — it is the immediate
    // "that bump landed" feedback, and carries no CSS transition, so it needs
    // none of setProgressStroke's machinery. Yellow only moves on a commit.
    if (pending) pending.style.strokeDashoffset = String(100 - clamp(ratio, 0, 1) * 100);
    setProgressStroke(fill, committedXpRatio(state), instant);
    if (flash) {
      el.classList.remove('is-exp-flash');
      void el.offsetWidth;
      el.classList.add('is-exp-flash');
      if (body.progressHideTimer) window.clearTimeout(body.progressHideTimer);
      body.progressHideTimer = window.setTimeout(() => {
        el?.classList.remove('is-exp-flash');
        body.progressHideTimer = 0;
      }, 6800);
    }
  }

  function projectReveal(body, level) {
    const meta = PROJECT_REVEALS[body.projectId];
    if (!meta) return { title: body.projectId || 'Project', text: 'A project in the interactive portfolio.' };
    const index = Math.max(0, level - 2);
    return {
      title: meta.title,
      text: meta.reveals[index] || ('You have discovered everything about ' + meta.title + ' available from the Playground.'),
    };
  }

  function weightedProjectChoice(pool) {
    const total = pool.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    for (const item of pool) {
      roll -= item.weight;
      if (roll <= 0) return item;
    }
    return pool[pool.length - 1];
  }

  function rollProjectUpgrades(body, count = 3) {
    const available = PROJECT_UPGRADES.filter((upgrade) => projectUpgradeCount(body, upgrade.id) < upgrade.maxStacks);
    const pool = available.slice();
    const choices = [];
    while (choices.length < count && pool.length) {
      const picked = weightedProjectChoice(pool);
      choices.push(picked);
      pool.splice(pool.indexOf(picked), 1);
    }
    return choices;
  }

  function spawnProjectLevelFanfare(body, level) {
    const rect = body.el.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'pv2-project-levelup-fanfare';
    el.style.left = (rect.left + rect.width / 2) + 'px';
    el.style.top = (rect.top + rect.height / 2) + 'px';
    el.style.setProperty('--pv2-level-label-y', (-rect.height / 2 - 34) + 'px');
    const rays = Array.from({ length: 12 }, (_, index) =>
      '<i class="pv2-project-levelup-fanfare__ray" style="--ray:' + index + '"></i>'
    ).join('');
    el.innerHTML =
      '<span class="pv2-project-levelup-fanfare__burst" aria-hidden="true">'
      + '<i class="pv2-project-levelup-fanfare__ring pv2-project-levelup-fanfare__ring--a"></i>'
      + '<i class="pv2-project-levelup-fanfare__ring pv2-project-levelup-fanfare__ring--b"></i>'
      + rays
      + '</span>'
      + '<span class="pv2-project-levelup-fanfare__copy">'
      + '<strong><span>LEVEL</span><span>UP!</span></strong>'
      + '</span>';
    document.body.appendChild(el);
    window.setTimeout(() => el.remove(), reducedMotion() ? 320 : 1900);
  }

  function playgroundIsVisible() {
    const overview = document.querySelector('.pv2-overview__stage');
    return Boolean(
      overview
      && overview.isConnected
      && overview.getClientRects().length
      && overview.offsetWidth > 0
      && overview.offsetHeight > 0
    );
  }

  function liveProjectBody(projectId) {
    return bodies.find((body) => body.projectId === projectId && body.el?.isConnected) || null;
  }

  function queueProjectLevelUp(body, level) {
    projectLevelQueue.push({
      projectId: body.projectId,
      level,
      sequence: ++projectLevelSequence,
      choiceCommitted: false,
    });
    if (!activeProjectLevelUp && playgroundIsVisible()) openNextProjectLevelUp();
  }

  function openNextProjectLevelUp() {
    // Level-up encounters belong to the Playground. If another portfolio view
    // is active, leave the event queued and present it when the Playground
    // mounts again.
    if (activeProjectLevelUp || !projectLevelQueue.length || !playgroundIsVisible()) return;

    const queued = projectLevelQueue[0];
    const body = liveProjectBody(queued.projectId);
    // React may have mounted the overview before physics has rebuilt its body
    // list. Keep the event at the head of the queue until init() resolves it.
    if (!body) return;

    projectLevelQueue.shift();
    const event = { ...queued, body };
    activeProjectLevelUp = event;
    document.documentElement.classList.add('pv2-project-levelup-open');
    event.body.el.classList.add('is-project-leveling');
    spawnProjectLevelFanfare(event.body, event.level);
    window.setTimeout(() => {
      if (activeProjectLevelUp === event && playgroundIsVisible()) buildProjectLevelUpDialog(event);
    }, reducedMotion() ? 0 : 1450);
  }

  function positionProjectLevelUpDialog(overlay, body) {
    const panel = overlay.querySelector('.pv2-project-levelup__panel');
    if (!panel || !body?.el?.isConnected) return;
    const sphere = body.el.getBoundingClientRect();
    const navBottom = document.querySelector('.pv2-nav')?.getBoundingClientRect().bottom || 72;
    const pad = window.innerWidth <= MOBILE_BREAKPOINT
      ? 24
      : Math.max(48, Math.min(72, window.innerWidth * .045));
    const gap = window.innerWidth <= MOBILE_BREAKPOINT ? 16 : 26;
    const panelRect = panel.getBoundingClientRect();
    const minTop = navBottom + Math.max(16, pad * .45);
    const maxTop = Math.max(minTop, window.innerHeight - pad - panelRect.height);

    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      const viewport = window.visualViewport;
      const viewportTop = viewport?.offsetTop || 0;
      const viewportHeight = viewport?.height || window.innerHeight;
      const viewportBottom = viewportTop + viewportHeight;
      const sphereCenterY = sphere.top + sphere.height / 2;
      const availableWidth = window.innerWidth - pad * 2;
      const left = pad + Math.max(0, (availableWidth - panelRect.width) / 2);
      const safeTop = Math.max(minTop, viewportTop + 12);
      const safeBottom = viewportBottom - Math.max(18, pad);
      let side = sphereCenterY < viewportTop + viewportHeight / 2 ? 'mobile-bottom' : 'mobile-top';
      let top = side === 'mobile-bottom'
        ? safeBottom - panelRect.height
        : safeTop;
      if (top < safeTop) {
        top = safeTop;
        side = 'mobile-top';
      }
      panel.style.left = left.toFixed(1) + 'px';
      panel.style.top = top.toFixed(1) + 'px';
      panel.dataset.side = side;
      return;
    }

    let side = 'right';
    let left = sphere.right + gap;
    let top = clamp(sphere.top + sphere.height / 2 - panelRect.height / 2, minTop, maxTop);

    if (left + panelRect.width > window.innerWidth - pad) {
      side = 'left';
      left = sphere.left - gap - panelRect.width;
    }
    if (left < pad) {
      side = 'below';
      left = clamp(sphere.left + sphere.width / 2 - panelRect.width / 2, pad, window.innerWidth - pad - panelRect.width);
      top = sphere.bottom + gap;
      if (top + panelRect.height > window.innerHeight - pad) {
        side = 'above';
        top = sphere.top - gap - panelRect.height;
      }
      top = clamp(top, minTop, maxTop);
    }

    panel.style.left = left.toFixed(1) + 'px';
    panel.style.top = top.toFixed(1) + 'px';
    panel.dataset.side = side;
  }

  function buildProjectLevelUpDialog(event) {
    const body = event.body;
    const reveal = projectReveal(body, event.level);
    const choices = rollProjectUpgrades(body, 3);
    projectLevelUpOverlay?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'pv2-project-levelup-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'pv2-project-levelup-title');
    overlay.innerHTML =
      '<section class="pv2-project-levelup__panel">'
      + '<div class="pv2-project-levelup__header">'
      + '<div class="pv2-project-levelup__reward-title"><span>LEVEL</span><span>UP!</span></div>'
      + '<span class="pv2-project-levelup__level">LV. ' + event.level + '</span>'
      + '</div>'
      + '<div class="pv2-project-levelup__project-info">'
      + '<p class="pv2-project-levelup__project-label">Project</p>'
      + '<h2 id="pv2-project-levelup-title">' + reveal.title + '</h2>'
      + '<p class="pv2-project-levelup__reveal">' + reveal.text + '</p>'
      + '</div>'
      + '<div class="pv2-project-levelup__rule" aria-hidden="true"></div>'
      + '<p class="pv2-project-levelup__choose">Choose one</p>'
      + '<div class="pv2-project-levelup__choices"></div>'
      + '</section>';

    const list = overlay.querySelector('.pv2-project-levelup__choices');
    for (const upgrade of choices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pv2-project-levelup__choice';
      button.dataset.rarity = upgrade.rarity;
      const mechanicTheme = mechanicThemeForUpgrade(upgrade);
      button.dataset.mechanic = mechanicTheme;
      if (MECHANIC_ART[mechanicTheme]) button.classList.add('has-art-icon');
      const rarity = upgrade.rarity === 'common' ? '' : '<small>' + upgrade.rarity.toUpperCase() + '</small>';
      button.innerHTML =
        '<span class="pv2-project-levelup__choice-icon" aria-hidden="true">' + upgradeIconMarkup(upgrade, mechanicTheme) + '</span>'
        + '<span class="pv2-project-levelup__choice-copy">' + rarity
        + '<strong>' + upgrade.title + '</strong><span>' + upgrade.effect + '</span></span>'
        + '<span class="pv2-project-levelup__choice-arrow" aria-hidden="true">›</span>';
      button.addEventListener('click', () => chooseProjectUpgrade(event, upgrade, button));
      list?.appendChild(button);
    }

    document.body.appendChild(overlay);
    projectLevelUpOverlay = overlay;
    positionProjectLevelUpDialog(overlay, body);
    const reposition = () => {
      if (projectLevelUpOverlay === overlay && body.el?.isConnected) {
        positionProjectLevelUpDialog(overlay, body);
      }
    };
    overlay._pv2Reposition = reposition;
    window.addEventListener('resize', reposition);
    window.visualViewport?.addEventListener('resize', reposition);
    window.visualViewport?.addEventListener('scroll', reposition);
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    window.setTimeout(() => overlay.querySelector('.pv2-project-levelup__choice')?.focus(), reducedMotion() ? 0 : 420);
  }

  function chooseProjectUpgrade(event, upgrade, button) {
    if (activeProjectLevelUp !== event || !event.body?.projectState) return;
    event.choiceCommitted = true;
    const upgrades = event.body.projectState.upgrades;
    upgrades.set(upgrade.id, (upgrades.get(upgrade.id) || 0) + 1);
    invalidateProjectEffects(event.body);
    button?.classList.add('is-selected');
    const arrow = button?.querySelector('.pv2-project-levelup__choice-arrow');
    if (arrow) arrow.textContent = '✓';
    projectLevelUpOverlay?.classList.add('is-confirming');
    event.body.el.classList.add('is-project-upgrade-applied');
    projectLevelUpOverlay?.querySelectorAll('.pv2-project-levelup__choice').forEach((choice) => {
      choice.disabled = true;
      if (choice !== button) choice.classList.add('is-rejected');
    });
    window.setTimeout(() => event.body?.el?.classList.remove('is-project-upgrade-applied'), reducedMotion() ? 60 : 820);
    window.setTimeout(() => finishProjectLevelUp(event), reducedMotion() ? 60 : 900);
  }

  function finishProjectLevelUp(event) {
    if (activeProjectLevelUp !== event) return;
    projectLevelUpOverlay?.classList.remove('is-open');
    const overlay = projectLevelUpOverlay;
    if (overlay?._pv2Reposition) {
      window.removeEventListener('resize', overlay._pv2Reposition);
      window.visualViewport?.removeEventListener('resize', overlay._pv2Reposition);
      window.visualViewport?.removeEventListener('scroll', overlay._pv2Reposition);
    }
    projectLevelUpOverlay = null;
    event.body?.el?.classList.remove('is-project-leveling');
    activeProjectLevelUp = null;
    document.documentElement.classList.remove('pv2-project-levelup-open');
    lastTime = 0;
    window.setTimeout(() => overlay?.remove(), reducedMotion() ? 0 : 240);
    window.setTimeout(openNextProjectLevelUp, reducedMotion() ? 0 : 270);
  }

  function suspendProjectLevelUp() {
    const active = activeProjectLevelUp;
    if (active?.body?.el) {
      active.body.el.classList.remove('is-project-leveling');
      active.body.el.classList.remove('is-project-upgrade-applied');
    }

    if (active && !active.choiceCommitted) {
      const alreadyQueued = projectLevelQueue.some((event) =>
        event.sequence === active.sequence
        || (event.projectId === active.projectId && event.level === active.level)
      );
      if (!alreadyQueued) {
        projectLevelQueue.unshift({
          projectId: active.projectId,
          level: active.level,
          sequence: active.sequence,
          choiceCommitted: false,
        });
      }
    }

    activeProjectLevelUp = null;
    projectLevelUpOverlay?.remove();
    projectLevelUpOverlay = null;
    document.documentElement.classList.remove('pv2-project-levelup-open');
  }

  function mentorLowestProject(body) {
    const others = bodies.filter((candidate) => candidate !== body && candidate.projectState);
    if (!others.length) return;
    others.sort((a, b) => a.projectState.level - b.projectState.level || a.projectState.xp - b.projectState.xp);
    signalProjectTarget(body, others[0], 'mentor');
    addProjectXp(others[0], 1, 'mentor');
  }

  function addProjectXp(body, amount, source = 'bumper') {
    if (!body?.projectState || amount <= 0) return;
    const state = body.projectState;
    state.xp += amount;
    let leveled = false;
    for (let guard = 0; guard < 8; guard += 1) {
      const target = projectXpTarget(state.level);
      if (state.xp + 1e-6 < target) break;
      state.xp -= target;
      state.level += 1;
      leveled = true;
      queueProjectLevelUp(body, state.level);
      if (projectEffects(body).mentor && source !== 'mentor') mentorLowestProject(body);
    }
    refreshProjectProgressUI(body, source === 'bumper');
    // Two ways the yellow is allowed to catch up: the white read-out ran off
    // the end of the bar (a level-up), or the bumping stopped for half a second.
    if (leveled) flashProjectXpFull(body);
    else scheduleProjectXpCommit(body);
    window.dispatchEvent(new CustomEvent('pv2:project-xp', {
      detail: { id: body.projectId, level: state.level, xp: state.xp, amount, source, leveled },
    }));
  }


  function signalProjectTarget(sourceBody, targetBody, kind = 'chain') {
    if (!sourceBody?.el?.isConnected || !targetBody?.el?.isConnected) return;

    const sourceRect = sourceBody.el.getBoundingClientRect();
    const targetRect = targetBody.el.getBoundingClientRect();
    const sx = sourceRect.left + sourceRect.width / 2;
    const sy = sourceRect.top + sourceRect.height / 2;
    const tx = targetRect.left + targetRect.width / 2;
    const ty = targetRect.top + targetRect.height / 2;
    const dx = tx - sx;
    const dy = ty - sy;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    const layer = ensureFxLayer();
    const line = document.createElement('div');
    line.className = 'pv2-project-target-link pv2-project-target-link--' + kind;
    line.style.left = sx + 'px';
    line.style.top = sy + 'px';
    line.style.width = distance + 'px';
    line.style.transform = 'rotate(' + angle + 'deg)';

    const impact = document.createElement('div');
    impact.className = 'pv2-project-target-impact pv2-project-target-impact--' + kind;
    impact.style.left = tx + 'px';
    impact.style.top = ty + 'px';
    impact.style.width = Math.max(54, targetRect.width * .72) + 'px';
    impact.style.height = Math.max(54, targetRect.height * .72) + 'px';

    layer.append(line, impact);

    const visual = targetBody.el.querySelector('.pv2-visual');
    if (!reducedMotion() && visual) {
      try {
        visual.animate([
          { transform: 'scale(1)', filter: 'brightness(1)' },
          { transform: 'scale(.94)', filter: 'brightness(1.04)', offset: .16 },
          { transform: 'scale(1.11)', filter: 'brightness(1.28) saturate(1.18)', offset: .38 },
          { transform: 'scale(1)', filter: 'brightness(1)' },
        ], { duration: 560, easing: 'cubic-bezier(.16,.84,.3,1)' });
      } catch {}
    }

    window.setTimeout(() => {
      line.remove();
      impact.remove();
    }, reducedMotion() ? 180 : 700);
  }

  function kickNearestProject(sourceBody, now) {
    let nearest = null, best = Infinity;
    const sx = sourceBody.x + sourceBody.w / 2;
    const sy = sourceBody.y + sourceBody.h / 2;
    for (const candidate of bodies) {
      if (candidate === sourceBody) continue;
      const dx = candidate.x + candidate.w / 2 - sx;
      const dy = candidate.y + candidate.h / 2 - sy;
      const d = Math.hypot(dx, dy);
      if (d < best) { best = d; nearest = candidate; }
    }
    if (!nearest) return;
    signalProjectTarget(sourceBody, nearest, 'chain');
    const dx = nearest.x + nearest.w / 2 - sx;
    const dy = nearest.y + nearest.h / 2 - sy;
    const length = Math.hypot(dx, dy) || 1;
    nearest.vx += (dx / length) * .13;
    nearest.vy += (dy / length) * .13;
    nearest.armed = true;
    nearest.armedUntil = Math.max(nearest.armedUntil, now + 1400);
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
  let activeSmokeParticles = 0;
  let upgradeOverlay = null;
  let upgradeTree = null;
  const purchased = new Set();
  let effectsCache = null;   // currentEffects() memo; nulled when a purchase changes it
  let bumperGeom = null;     // cached stage-local bumper geometry; nulled on reflow
  let pointer = { x: -9999, y: -9999, t: 0 };
  let comboCount = 0;
  let comboExpire = 0;
  let critComboCount = 0;
  let critComboExpire = 0;
  let idleBank = 0;
  let autoFlickTimer = 0;
  let battlePaused = false;
  let projectContextPaused = false;
  let motionStopped = false; // user-toggled via the "Stop motion" button
  let motionToggle = null;   // the toggle button element
  let exploreCue = null;          // the "Click to Explore!" sticker element
  let exploreCueBox = null;       // its inner box (owns the entrance animation)
  let exploreCueBody = null;      // the sphere it currently points at
  let exploreCueHideAt = 0;       // performance.now() when it should go away
  let exploreCueNextAt = 0;       // …and when the next one may appear
  let exploreCueShows = 0;        // how many times it has been shown this visit
  let exploreCueDismissed = false;// the visitor opened a project — stop asking
  let exploreCueW = 0;            // measured once per show, not per frame
  let exploreCueH = 0;
  let exploreCueFlipped = false;
  let exploreCueTransform = '';   // last transform written, to skip no-op writes
  let bushido = null;        // active Bushido session state (null when idle)
  let bushidoCooldownUntil = 0;   // performance.now() timestamp cooldown ends
  let bushidoBadge = null;        // persistent cooldown badge element
  let bushidoRing = null;         // the badge's progress ring <circle>
  let treeZoom = TREE_DEFAULT_ZOOM;
  let treePanX = 0;
  let treePanY = 0;
  let treeDrag = null;
  let suppressTreeClick = false;
  const projectProgressState = new Map();
  const projectLevelQueue = [];
  let activeProjectLevelUp = null;
  let projectLevelUpOverlay = null;
  let projectLevelSequence = 0;

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
    let critCombo = false;
    let critComboStep = 0;
    let critComboMax = 1;
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

    // Flux branch (genre-bending). The "RPG" crit nodes apply to the block game
    // itself: any scored hit (bumper, wall, friction burn) can crit, and Critical
    // Combo makes back-to-back crits escalate.
    if (hasUpgrade('flux-mult')) pointMult *= 2;
    if (hasUpgrade('flux-crit')) { critChance = 0.15; critMult = 5; }
    if (hasUpgrade('flux-battle')) { critChance = 0.3; critMult = Math.max(critMult, 5); critCombo = true; critComboStep = 0.6; critComboMax = 4; }
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
      critCombo,
      critComboStep,
      critComboMax,
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
    const affordable = Boolean(next && points >= next.cost);
    const wasAffordable = scoreCounter.classList.contains('has-upgrade');
    scoreCounter.classList.toggle('has-upgrade', affordable);
    if (affordable && !wasAffordable) scoreCounter.classList.remove('spend-cue-seen');
    if (!affordable) scoreCounter.classList.remove('spend-cue-seen');
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
    scoreCounter.innerHTML = '<span class="pv2-score-counter__label">Points</span><strong class="pv2-score-counter__value">0</strong><span class="pv2-score-spend-cue" aria-hidden="true">Click to Spend</span>';
    scoreValue = scoreCounter.querySelector('.pv2-score-counter__value');
    scoreValue.textContent = String(points);
    scoreCounter.addEventListener('click', () => {
      scoreCounter.classList.add('spend-cue-seen');
      openUpgradeTree();
    });
    scoreCounter.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        scoreCounter.classList.add('spend-cue-seen');
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

  const MOTION_ICON_PAUSE = '<path d="M8 5v14M16 5v14"/>';
  const MOTION_ICON_PLAY = '<path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none"/>';

  function ensureMotionToggle() {
    if (motionToggle?.isConnected) return motionToggle;
    motionToggle = document.createElement('button');
    motionToggle.type = 'button';
    motionToggle.className = 'pv2-motion-toggle';
    motionToggle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${MOTION_ICON_PAUSE}</svg>`;
    motionToggle.addEventListener('click', () => setMotionStopped(!motionStopped));
    document.body.appendChild(motionToggle);
    refreshMotionToggle();
    return motionToggle;
  }

  function refreshMotionToggle() {
    if (!motionToggle?.isConnected) return;
    const label = motionStopped ? 'Resume motion' : 'Stop motion';
    motionToggle.setAttribute('aria-label', label);
    motionToggle.title = label;
    motionToggle.setAttribute('aria-pressed', String(motionStopped));
    motionToggle.classList.toggle('is-stopped', motionStopped);
    const svg = motionToggle.querySelector('svg');
    if (svg) svg.innerHTML = motionStopped ? MOTION_ICON_PLAY : MOTION_ICON_PAUSE;
  }

  function setMotionStopped(stopped) {
    motionStopped = Boolean(stopped);
    if (!motionStopped) lastTime = 0;
    refreshMotionToggle();
  }

  function setMotionToggleVisible(visible) {
    ensureMotionToggle().classList.toggle('is-visible', Boolean(visible));
  }

  // ===================== "Click to Explore!" nudge =========================
  // Lives in the page (not inside .pv2-float-slot) and is positioned by
  // transform each frame while it is up. The stage clips its overflow, so a
  // sticker parented to a sphere near an edge would be cut in half; tracking
  // from outside also lets it flip sides and stay inside the viewport as the
  // sphere drifts.
  function ensureExploreCue() {
    if (exploreCue?.isConnected) return exploreCue;
    exploreCue = document.createElement('div');
    exploreCue.className = 'pv2-explore-cue';
    exploreCue.setAttribute('aria-hidden', 'true');
    exploreCue.innerHTML = '<span class="pv2-explore-cue__box">Click to Explore!</span>';
    exploreCueBox = exploreCue.querySelector('.pv2-explore-cue__box');
    document.body.appendChild(exploreCue);
    return exploreCue;
  }

  function hideExploreCue() {
    exploreCueBody = null;
    exploreCueHideAt = 0;
    if (exploreCue?.isConnected) exploreCue.classList.remove('is-visible');
  }

  // Stop for good once the visitor has opened a project: they have found the
  // door, so continuing to point at it would just be nagging.
  function dismissExploreCue() {
    exploreCueDismissed = true;
    hideExploreCue();
  }

  function scheduleNextExploreCue(now) {
    exploreCueNextAt = now + EXPLORE_CUE_MIN_GAP
      + Math.random() * (EXPLORE_CUE_MAX_GAP - EXPLORE_CUE_MIN_GAP);
  }

  function exploreCueBlocked() {
    return Boolean(
      exploreCueDismissed
      || !stage?.isConnected
      || !bodies.length
      || battlePaused
      || projectContextPaused
      || activeProjectLevelUp
      || bushido
      || document.documentElement.classList.contains('pv2-upgrades-open')
      || !playgroundIsVisible()
    );
  }

  function showExploreCue(now) {
    // Never point at the same sphere twice running — part of the invitation is
    // that it keeps gesturing at different pieces of work.
    const candidates = bodies.filter((body) => body.el?.isConnected && body !== exploreCueBody);
    const pool = candidates.length ? candidates : bodies.filter((body) => body.el?.isConnected);
    if (!pool.length) return false;

    const cue = ensureExploreCue();
    exploreCueBody = pool[Math.floor(Math.random() * pool.length)];
    cue.classList.remove('is-flipped');
    cue.classList.add('is-visible');
    // One layout read per appearance, so the per-frame tracking needs none.
    // offsetWidth/Height, not getBoundingClientRect: the box is mid entrance
    // animation at this point (it starts at scale(.78) and carries a resting
    // tilt), and a transformed bounding box would measure the sticker ~20%
    // narrower than it ends up — which parked it on top of the sphere.
    exploreCueW = exploreCueBox.offsetWidth;
    exploreCueH = exploreCueBox.offsetHeight;
    exploreCueFlipped = false;
    exploreCueHideAt = now + EXPLORE_CUE_VISIBLE;
    exploreCueShows += 1;
    // Names the sphere the sticker is pointing at, so what it is aimed at is
    // inspectable rather than something you have to infer from coordinates.
    cue.dataset.target = exploreCueBody.projectId || '';
    return true;
  }

  function positionExploreCue(stageRect) {
    const body = exploreCueBody;
    if (!body || !exploreCue) return;
    const centerX = stageRect.left + body.x + body.w / 2;
    const centerY = stageRect.top + body.y + body.h / 2;
    const reach = body.w / 2 + EXPLORE_CUE_GAP;

    // Prefer the left of the sphere (matching the Points sticker), and flip
    // only when that would run off the screen. The 10px of hysteresis stops it
    // oscillating while a sphere hovers right on the threshold.
    let left = centerX - reach - exploreCueW;
    const flipThreshold = EXPLORE_CUE_MARGIN + (exploreCueFlipped ? 10 : 0);
    const flipped = left < flipThreshold;
    if (flipped) left = centerX + reach;
    if (flipped !== exploreCueFlipped) {
      exploreCueFlipped = flipped;
      exploreCue.classList.toggle('is-flipped', flipped);
    }

    const maxLeft = window.innerWidth - exploreCueW - EXPLORE_CUE_MARGIN;
    const minTop = Math.max(EXPLORE_CUE_MARGIN, (navBottom === null || navBottom === -Infinity ? 0 : navBottom) + EXPLORE_CUE_MARGIN);
    const maxTop = window.innerHeight - exploreCueH - EXPLORE_CUE_MARGIN;
    left = clamp(left, EXPLORE_CUE_MARGIN, Math.max(EXPLORE_CUE_MARGIN, maxLeft));
    const top = clamp(centerY - exploreCueH / 2, minTop, Math.max(minTop, maxTop));
    // Skip the write when nothing moved. It matters most while motion is
    // stopped: there, tick() reads the stage rect each frame, and a write that
    // changed nothing would still invalidate layout for the next read.
    const next = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
    if (next !== exploreCueTransform) {
      exploreCue.style.transform = next;
      exploreCueTransform = next;
    }
  }

  // Called once per frame from tick(), after the bodies have been written, so
  // it reuses that frame's stageRect and performs no layout reads of its own.
  function updateExploreCue(now, stageRect) {
    if (exploreCueBody) {
      if (now >= exploreCueHideAt || exploreCueBlocked() || !exploreCueBody.el?.isConnected) {
        hideExploreCue();
        scheduleNextExploreCue(now);
        return;
      }
      positionExploreCue(stageRect);
      return;
    }

    if (exploreCueDismissed || exploreCueShows >= EXPLORE_CUE_MAX_SHOWS) return;
    if (!exploreCueNextAt) {
      exploreCueNextAt = now + EXPLORE_CUE_FIRST_DELAY;
      return;
    }
    if (now < exploreCueNextAt) return;
    if (exploreCueBlocked()) {
      // Try again shortly rather than burning this slot while something else
      // is on top of the stage.
      exploreCueNextAt = now + 4000;
      return;
    }
    if (showExploreCue(now)) positionExploreCue(stageRect);
    else exploreCueNextAt = now + 4000;
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
    const mechanicTheme = mechanicThemeForUpgrade(upgrade);
    node.dataset.mechanic = mechanicTheme;
    if (MECHANIC_ART[mechanicTheme]) node.classList.add('has-art-icon');
    node.style.setProperty('--node-x', `${upgrade.x}px`);
    node.style.setProperty('--node-y', `${upgrade.y}px`);
    node.innerHTML = `
      <span class="pv2-upgrade-node__icon" aria-hidden="true">${upgradeIconMarkup(upgrade, mechanicTheme)}</span>
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
    if (activeProjectLevelUp || projectContextPaused) return;
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
    const now = performance.now();
    let mult = fx.pointMult;
    let comboMult = 1;
    if (fx.comboEnabled) {
      comboCount = now <= comboExpire ? comboCount + 1 : 1;
      comboExpire = now + COMBO_WINDOW;
      comboMult = Math.min(fx.comboMax, 1 + fx.comboStep * (comboCount - 1));
      mult *= comboMult;
    }
    let crit = false;
    if (fx.critChance > 0 && Math.random() < fx.critChance) {
      crit = true;
      mult *= fx.critMult;
      // Critical Combo: back-to-back crits within the combo window escalate.
      if (fx.critCombo) {
        critComboCount = now <= critComboExpire ? critComboCount + 1 : 1;
        critComboExpire = now + COMBO_WINDOW;
        mult *= Math.min(fx.critComboMax, 1 + fx.critComboStep * (critComboCount - 1));
      }
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

  // Smoke becomes a world-space particle the instant it is created. It no
  // longer lives inside the moving sphere DOM, so the sphere can continue
  // travelling while the puff drifts and fades independently.
  function spawnDetachedSmoke(body, now, stageRect) {
    if (reducedMotion() || body.friction < .12 || now < body.smokeNextAt) return;

    const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
    const maxParticles = mobile ? 10 : 22;
    if (activeSmokeParticles >= maxParticles) {
      body.smokeNextAt = now + 180;
      return;
    }

    const heat = clamp(body.friction, 0, 1);
    const cadence = (mobile ? 620 : 430) - heat * (mobile ? 180 : 150);
    body.smokeNextAt = now + cadence + Math.random() * (mobile ? 170 : 130);

    const puff = document.createElement('span');
    puff.className = 'pv2-detached-smoke';
    const diameter = (mobile ? 11 : 15) + heat * (mobile ? 8 : 14);
    const startX = stageRect.left + body.x + body.w * (.34 + Math.random() * .32);
    const startY = stageRect.top + body.y + body.w * (.08 + Math.random() * .10);
    const drift = (Math.random() - .5) * (mobile ? 42 : 72);
    const rise = (mobile ? 52 : 78) + Math.random() * (mobile ? 34 : 58) + heat * 26;
    const spin = (Math.random() - .5) * 90;
    const duration = (mobile ? 1500 : 1800) + Math.random() * 900;

    Object.assign(puff.style, {
      left: startX.toFixed(1) + 'px',
      top: startY.toFixed(1) + 'px',
      width: diameter.toFixed(1) + 'px',
      height: diameter.toFixed(1) + 'px',
      '--pv2-smoke-drift-x': drift.toFixed(1) + 'px',
      '--pv2-smoke-rise': rise.toFixed(1) + 'px',
      '--pv2-smoke-spin': spin.toFixed(1) + 'deg',
      '--pv2-smoke-alpha': (0.26 + heat * .34).toFixed(2),
      '--pv2-smoke-duration': duration.toFixed(0) + 'ms',
    });

    activeSmokeParticles += 1;
    ensureFxLayer().appendChild(puff);
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      puff.remove();
      activeSmokeParticles = Math.max(0, activeSmokeParticles - 1);
    };
    puff.addEventListener('animationend', cleanup, { once: true });
    window.setTimeout(cleanup, duration + 120);
  }

  // Friction now reads as heat on the sphere itself: low values start as faint
  // smoke/glow, then the perimeter catches fire and grows more turbulent.
  function updateHeatVisual(body, now, stageRect) {
    const f = body.friction;
    if (!body.halo && f < HEAT_MIN_VISIBLE) return;
    const halo = body.halo || (body.halo = ensureHeatHalo(body.el));
    if (f < HEAT_MIN_VISIBLE) {
      // Already cold and already zeroed: nothing to write. Without this a
      // settled block kept setting the same three custom properties every
      // frame, each one invalidating style for its subtree.
      if (body.heatOpacity === 0) return;
      halo.style.setProperty('--pv2-heat', '0');
      halo.style.setProperty('--pv2-flame-opacity', '0');
      halo.style.opacity = '0';
      // A cold sphere should not be paying for ~40 infinite CSS animations,
      // two blurred layers and a blend mode. `is-cold` takes the fire and
      // smoke out of the render tree entirely until it heats up again.
      halo.classList.add('is-cold');
      body.heatOpacity = 0;
      body.heatTier = -1;
      // This branch just overwrote the live properties with 0, so the memo has
      // to go too — otherwise reheating to the same value would skip the write
      // and leave the halo blank.
      body.heatValue = -1;
      return;
    }

    if (body.heatOpacity === 0) halo.classList.remove('is-cold');

    const tier = Math.min(HEAT_TIERS - 1, Math.floor(f * HEAT_TIERS));
    if (tier !== body.heatTier) {
      halo.style.setProperty('--pv2-heat-rgb', heatColor((tier + .5) / HEAT_TIERS));
      body.heatTier = tier;
    }

    const heat = Math.round(clamp(f, 0, 1) * 100) / 100;
    // These are all derived from `heat`, so one comparison gates all five.
    if (heat !== body.heatValue) {
      const flame = Math.round(Math.pow(clamp((f - .02) / .38, 0, 1), .45) * 100) / 100;
      halo.style.setProperty('--pv2-heat', String(heat));
      halo.style.setProperty('--pv2-flame-opacity', String(flame));
      halo.style.setProperty('--pv2-flame-scale', String(.9 + heat * .65));
      body.heatValue = heat;
    }

    spawnDetachedSmoke(body, now, stageRect);

    const op = Math.round(Math.min(1, .65 + Math.sqrt(f) * .35) * 40) / 40;
    if (op !== body.heatOpacity) {
      halo.style.opacity = String(op);
      body.heatOpacity = op;
    }
  }

  // Full meter → cash in a "friction burn" through the normal scoring path
  // (so point mult / combo / crit all apply) and flash the halo.
  function frictionBurn(body, stageRect) {
    const effects = currentEffects();
    const impact = {
      x: stageRect.left + body.x + body.w / 2,
      y: stageRect.top + body.y + body.h / 2,
    };
    award(FRICTION_BURN_BASE * effects.frictionBurnMult, 'friction', impact, { vx: body.vx, vy: body.vy });
    window.dispatchEvent(new CustomEvent('pv2:friction-burn', { detail: { x: impact.x, y: impact.y } }));
    if (reducedMotion()) return;
    if (!body.halo) body.halo = ensureHeatHalo(body.el);
    try {
      body.halo.animate([
        { transform: 'scale(1)', filter: 'brightness(1) saturate(1)' },
        { transform: 'scale(1.12)', filter: 'brightness(1.5) saturate(1.55)', offset: .28 },
        { transform: 'scale(1.025)', filter: 'brightness(1.15) saturate(1.2)', offset: .62 },
        { transform: 'scale(1)', filter: 'brightness(1) saturate(1)' },
      ], { duration: 720, easing: 'cubic-bezier(.16,.84,.3,1)' });
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

  // querySelector + getBoundingClientRect forces a synchronous layout, and this
  // runs twice per body per frame from constrain() — interleaved with the style
  // writes at the end of tick(), which made every frame thrash layout. The nav
  // is a fixed-height bar, so its viewport bottom only moves on resize/reflow;
  // cache it and let invalidateBumpers() (already called from resize and
  // init) clear it alongside the bumper geometry.
  let navBottom = null;

  function stageTopLimit(stageRect) {
    if (navBottom === null) {
      const nav = document.querySelector('.pv2-nav');
      navBottom = nav ? nav.getBoundingClientRect().bottom : -Infinity;
    }
    if (navBottom === -Infinity) return EDGE_PADDING;
    return Math.max(EDGE_PADDING, navBottom - stageRect.top + NAV_CLEARANCE);
  }

  // stageRect is already the stage's viewport rect, so there is nothing to
  // re-measure here — the extra getBoundingClientRect was another forced layout
  // on every scoring wall bounce.
  function wallImpact(body, side, stageRect) {
    const rect = stageRect;
    if (side === 'left') return { x: rect.left + EDGE_PADDING, y: rect.top + body.y + body.h / 2 };
    if (side === 'right') return { x: rect.left + stageRect.width - EDGE_PADDING, y: rect.top + body.y + body.h / 2 };
    if (side === 'top') return { x: rect.left + body.x + body.w / 2, y: rect.top + stageTopLimit(stageRect) };
    return { x: rect.left + body.x + body.w / 2, y: rect.top + stageRect.height - BOTTOM_EDGE_PADDING };
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
    const projectFx = projectEffects(body);
    const minY = stageTopLimit(stageRect);
    const maxX = Math.max(EDGE_PADDING, stageRect.width - body.w - EDGE_PADDING);
    const maxY = Math.max(minY, stageRect.height - body.h - BOTTOM_EDGE_PADDING);
    let hit = null;
    if (body.x < EDGE_PADDING) { body.x = EDGE_PADDING; body.vx = Math.abs(body.vx) * effects.wallKickMult * projectFx.wallKickMult; hit = 'left'; }
    if (body.x > maxX) { body.x = maxX; body.vx = -Math.abs(body.vx) * effects.wallKickMult * projectFx.wallKickMult; hit = 'right'; }
    if (body.y < minY) { body.y = minY; body.vy = Math.abs(body.vy) * effects.wallKickMult * projectFx.wallKickMult; hit = 'top'; }
    if (body.y > maxY) { body.y = maxY; body.vy = -Math.abs(body.vy) * effects.wallKickMult * projectFx.wallKickMult; hit = 'bottom'; }
    if (hit && allowScore) scoreWallBounce(body, hit, stageRect);
  }

  function bodyRect(body) {
    return { x: body.x, y: body.y, w: body.w, h: body.h };
  }

  function resolveBodyPair(a, b) {
    if (!overlaps(bodyRect(a), bodyRect(b), BODY_GAP)) return false;
    const effects = currentEffects();
    const aProject = projectEffects(a);
    const bProject = projectEffects(b);
    const dx = (a.x + a.w / 2) - (b.x + b.w / 2) || .01;
    const dy = (a.y + a.h / 2) - (b.y + b.h / 2) || .01;
    const overlapX = (a.w + b.w) / 2 + BODY_GAP - Math.abs(dx);
    const overlapY = (a.h + b.h) / 2 + BODY_GAP - Math.abs(dy);
    if (overlapX < overlapY) {
      const sign = dx >= 0 ? 1 : -1;
      a.x += overlapX * .5 * sign;
      b.x -= overlapX * .5 * sign;
      const av = a.vx;
      a.vx = b.vx * effects.collisionBoost * aProject.collisionBoostMult;
      b.vx = av * effects.collisionBoost * bProject.collisionBoostMult;
    } else {
      const sign = dy >= 0 ? 1 : -1;
      a.y += overlapY * .5 * sign;
      b.y -= overlapY * .5 * sign;
      const av = a.vy;
      a.vy = b.vy * effects.collisionBoost * aProject.collisionBoostMult;
      b.vy = av * effects.collisionBoost * bProject.collisionBoostMult;
    }
    if (a.armed || b.armed) {
      const until = Math.max(a.armedUntil, b.armedUntil);
      a.armed = true; b.armed = true;
      a.armedUntil = until; b.armedUntil = until;
    }
    if ((aProject.sharedMomentum || bProject.sharedMomentum) && (a.armed || b.armed)) {
      const now = performance.now();
      if (now - a.projectState.lastSharedXpAt > 900 && now - b.projectState.lastSharedXpAt > 900) {
        a.projectState.lastSharedXpAt = now;
        b.projectState.lastSharedXpAt = now;
        if (aProject.sharedMomentum) signalProjectTarget(a, b, 'shared');
        if (bProject.sharedMomentum) signalProjectTarget(b, a, 'shared');
        addProjectXp(a, .5, 'shared-momentum');
        addProjectXp(b, .5, 'shared-momentum');
      }
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

  function invalidateBumpers() { bumperGeom = null; navBottom = null; }

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
    const projectFx = projectEffects(body);
    const dx = (body.x + body.w / 2) - (bumper.x + bumper.w / 2) || .01;
    const dy = (body.y + body.h / 2) - (bumper.y + bumper.h / 2) || .01;
    const overlapX = (body.w + bumper.w) / 2 - Math.abs(dx);
    const overlapY = (body.h + bumper.h) / 2 - Math.abs(dy);
    const horizontal = overlapX < overlapY;
    const now = performance.now();
    const isArmed = body.armed && now < body.armedUntil;
    // Blocks always physically hit a bumper — they never slide on top of it.
    // A *scored* strike (an armed block on a fresh contact) also pays points and
    // launches at full power; `entering` dedupes a multi-frame overlap, so a
    // block that leaves and returns is a fresh strike and a tight wall<->bumper
    // loop scores every lap. Any other contact (unarmed / idle drift) still
    // bounces, just gently and without points.
    const poweredHit = entering && isArmed && gameActive;

    if (poweredHit) {
      const impact = impactPoint(body, bumper, horizontal);
      // Velocity is read before the bumper kick below flips it, so this is the
      // block's incoming travel direction — the way it was heading on impact.
      award(effects.bumperValue + projectFx.bumperPointBonus, bumper.id, impact, { vx: body.vx, vy: body.vy });
      pulseBumper(bumper.el);
      const state = body.projectState;
      let xpGain = 1;
      state.bumperHits += 1;
      if (projectFx.echo && state.bumperHits % 3 === 0) xpGain += 1;
      if (projectFx.secondWind && now - state.lastBumperAt >= 5000) xpGain += 1;
      state.lastBumperAt = now;
      addProjectXp(body, xpGain * projectFx.expMult, 'bumper');
      if (projectFx.chainReaction) kickNearestProject(body, now);
      // Battle mode (portfolio-battle.js) listens for these to detect a
      // Critical Combo (5 bumper hits within 1s) and trigger a battle.
      window.dispatchEvent(new CustomEvent('pv2:bumper-hit', { detail: { id: bumper.id, x: impact.x, y: impact.y } }));
    }

    const softFloor = window.innerWidth <= MOBILE_BREAKPOINT ? MOBILE_UNARMED_BUMPER_KICK : NORMAL_SPEED * 1.8;
    // A scored strike = a fixed launch. Otherwise reflect a fraction of the
    // incoming speed (never below the gentle floor) so the block bounces off the
    // bumper and eases away instead of gliding over it or stopping dead.
    if (horizontal) {
      const sign = dx >= 0 ? 1 : -1;
      body.x += Math.max(0, overlapX) * sign;
      body.vx = (poweredHit
        ? BUMPER_KICK * effects.bumperKickMult * projectFx.bumperKickMult
        : Math.max(softFloor, Math.abs(body.vx) * SOFT_BUMPER_RESTITUTION)) * sign;
      if (poweredHit) body.vy *= 1.12;
    } else {
      const sign = dy >= 0 ? 1 : -1;
      body.y += Math.max(0, overlapY) * sign;
      body.vy = (poweredHit
        ? BUMPER_KICK * effects.bumperKickMult * projectFx.bumperKickMult
        : Math.max(softFloor, Math.abs(body.vy) * SOFT_BUMPER_RESTITUTION)) * sign;
      if (poweredHit) body.vx *= 1.12;
    }
    return true;
  }

  function makeBody(el, index, stageRect) {
    // Inherit the tile's authored/solved on-page position. Recomputing a second
    // physics-only anchor here made freshly mounted tiles appear to launch from
    // a shared origin before settling into the composition.
    const rect = el.getBoundingClientRect();
    const minY = stageTopLimit(stageRect);
    const x = clamp(rect.left - stageRect.left, EDGE_PADDING, stageRect.width - rect.width - EDGE_PADDING);
    const y = clamp(rect.top - stageRect.top, minY, stageRect.height - rect.height - BOTTOM_EDGE_PADDING);
    el.style.transform = '';
    el.style.removeProperty('--pv2-scroll-drift-y');
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
    const projectId = el.dataset.nodeId || ('project-' + index);
    const projectState = projectStateFor(projectId);
    const body = {
      el, x, y, w: rect.width, h: rect.height,
      projectId, projectState,
      homeX: x, homeY: y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      phase: index * 1.41 + .7,
      pointerInside: false,
      contextHoverSince: 0,
      contextHoverActive: false,
      lastPointerHit: -Infinity,
      lastWallScore: -Infinity,
      contacts: new Set(),
      armed: false,
      armedUntil: 0,
      friction: 0,
      frictionSpent: false,
      halo: null,
      heatTier: -1,
      heatOpacity: 0,
      heatValue: -1,
      smokeNextAt: 0,
      // Last values written to style.left/top, so tick() can skip no-op writes.
      lastLeft: NaN,
      lastTop: NaN,
      progressEl: null,
      progressHideTimer: 0,
    };
    ensureProjectProgressUI(body);
    return body;
  }

  // Heat conforms to the circular project visual. Smoke and flame sprites sit
  // around its perimeter and are driven by friction via CSS variables.
  function ensureHeatHalo(el) {
    let halo = el.querySelector(':scope > .pv2-heat-halo');
    if (!halo) {
      halo = document.createElement('div');
      halo.className = 'pv2-heat-halo';
      halo.setAttribute('aria-hidden', 'true');

      // Deterministic jitter, so the licks keep their identity across repaints
      // but no two are alike. Eight evenly spaced, identical lozenges is what
      // made the old effect read as a clock face rather than as fire.
      const noise = (index, salt) => {
        const v = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
        return v - Math.floor(v);                    // 0..1
      };
      const span = (index, salt, min, max) => min + noise(index, salt) * (max - min);

      // A lick of flame. Two things make this read as fire rather than as a
      // sunburst: every lick points UP the screen regardless of where on the
      // rim it is rooted, and licks are longest over the top of the sphere,
      // tapering to nothing at the sides. Flames rise; they do not radiate.
      const flame = (index, count) => {
        // Spread across the full rim, then weight by how high up the sphere the
        // root sits. Spawning only on the top arc leaves a visible seam.
        const angle = (Math.PI * 2 * (index + span(index, 1, -.3, .3)) / count) - Math.PI / 2;
        const radial = 47 + span(index, 2, -2.5, 2.5);
        const x = 50 + Math.cos(angle) * radial;
        const y = 50 + Math.sin(angle) * radial;
        // 1 at the top of the sphere, 0 at the bottom.
        const upness = (1 - Math.sin(angle)) / 2;
        const reach = Math.pow(upness, 1.25);
        if (reach < .08) return '';                 // the underside only smoulders
        return '<span class="pv2-heat-flame" style="'
          + '--i:' + index
          + ';--x:' + x.toFixed(2) + '%'
          + ';--y:' + y.toFixed(2) + '%'
          + ';--len:' + (reach * span(index, 4, .74, 1.3)).toFixed(3)
          + ';--wid:' + span(index, 5, .76, 1.28).toFixed(3)
          + ';--dur:' + span(index, 6, 340, 720).toFixed(0) + 'ms'
          + ';--delay:-' + span(index, 7, 0, 1100).toFixed(0) + 'ms'
          + ';--lean:' + span(index, 3, -13, 13).toFixed(1) + 'deg'
          + ';--sway:' + span(index, 8, -10, 10).toFixed(1) + 'deg'
          + '"></span>';
      };

      // Smoke ignores the rim angle: it is the one part of this that obeys
      // gravity, so every puff rises up the screen no matter where on the
      // sphere it was born.
      const smokePuff = (index, count) => {
        // Spread across the top of the sphere only — that is where the flames
        // are, and smoke leaves from their tips.
        const angle = -Math.PI / 2 + (index + span(index, 11, -.35, .35) - (count - 1) / 2)
          * (Math.PI * 1.15 / count);
        const radial = 46 + span(index, 12, -5, 5);
        const x = 50 + Math.cos(angle) * radial;
        const y = 50 + Math.sin(angle) * radial - span(index, 18, 6, 22);
        return '<span class="pv2-heat-smoke" style="'
          + '--i:' + index
          + ';--x:' + x.toFixed(2) + '%'
          + ';--y:' + y.toFixed(2) + '%'
          + ';--size:' + span(index, 13, .72, 1.45).toFixed(3)
          + ';--dur:' + span(index, 14, 1900, 3200).toFixed(0) + 'ms'
          + ';--delay:-' + span(index, 15, 0, 3000).toFixed(0) + 'ms'
          + ';--drift:' + span(index, 16, -46, 46).toFixed(0) + '%'
          + ';--spin:' + span(index, 17, -70, 70).toFixed(0) + 'deg'
          + '"></span>';
      };

      const mobileHeat = window.innerWidth <= MOBILE_BREAKPOINT;
      const FLAMES = mobileHeat ? 10 : 20;
      const flames = Array.from({ length: FLAMES }, (_, i) => flame(i, FLAMES)).join('');
      halo.innerHTML = '<span class="pv2-heat-glow"></span>'
        + '<span class="pv2-heat-core"></span>'
        + '<span class="pv2-heat-fire">' + flames + '</span>';
      el.appendChild(halo);
    }

    // The physics body includes captions/interaction space; measure the actual
    // rendered sphere so the heat effect never becomes a square around it.
    const visual = el.querySelector('.pv2-visual');
    const hostRect = el.getBoundingClientRect();
    const visualRect = visual?.getBoundingClientRect();
    const left = visualRect ? visualRect.left - hostRect.left : 0;
    const top = visualRect ? visualRect.top - hostRect.top : 0;
    const width = visualRect?.width || hostRect.width;
    const height = visualRect?.height || width;
    Object.assign(halo.style, {
      position: 'absolute',
      left: left + 'px',
      top: top + 'px',
      width: width + 'px',
      height: height + 'px',
      pointerEvents: 'none',
      borderRadius: '50%',
      opacity: halo.style.opacity || '0',
      zIndex: '3',
      transition: 'opacity 120ms linear',
      willChange: 'opacity, filter, transform',
      overflow: 'visible',
    });
    return halo;
  }

  // The stage only moves on scroll or resize, so one measurement per frame is
  // plenty — pointermove can fire several times between frames.
  let pointerStageRectCache = null;
  let pointerStageRectAt = -1;

  function pointerStageRect() {
    const now = performance.now();
    if (!pointerStageRectCache || now - pointerStageRectAt > 16) {
      pointerStageRectCache = stage.getBoundingClientRect();
      pointerStageRectAt = now;
    }
    return pointerStageRectCache;
  }

  function pointerNearBody(body, stageRect, pad = 0) {
    if (pointer.x <= -9000 || pointer.y <= -9000) return false;
    const x = pointer.x - stageRect.left;
    const y = pointer.y - stageRect.top;
    return x >= body.x - pad
      && x <= body.x + body.w + pad
      && y >= body.y - pad
      && y <= body.y + body.h + pad;
  }

  function setContextHoverActive(body, active) {
    if (body.contextHoverActive === active) return;
    body.contextHoverActive = active;
    body.el.classList.toggle('is-context-hover-active', active);
  }

  function updateContextHover(body, now, stageRect) {
    const directlyHovered = body.el.matches(':hover');
    const hovering = directlyHovered
      || (body.contextHoverActive && pointerNearBody(body, stageRect, CONTEXT_HOVER_RELEASE_PAD));

    if (!hovering || projectContextPaused || activeProjectLevelUp) {
      body.contextHoverSince = 0;
      setContextHoverActive(body, false);
      return false;
    }

    if (!body.contextHoverSince) body.contextHoverSince = now;
    if (!body.contextHoverActive && now - body.contextHoverSince >= CONTEXT_HOVER_DELAY) {
      setContextHoverActive(body, true);
    }
    return body.contextHoverActive;
  }

  function collideWithPointer(event, pointerVx = 0, pointerVy = 0) {
    const now = performance.now();
    if (!stage || activeProjectLevelUp || projectContextPaused || document.documentElement.classList.contains('pv2-upgrades-open')) return;

    const effects = currentEffects();
    // Derive each body's viewport box from the simulation state plus one cached
    // stage rect, instead of calling getBoundingClientRect() per body. Pointer
    // moves arrive faster than frames, and each of those reads forced a layout
    // in the middle of the write-heavy animation loop.
    const stageRect = pointerStageRect();
    for (const body of bodies) {
      const rect = {
        left: stageRect.left + body.x,
        top: stageRect.top + body.y,
        right: stageRect.left + body.x + body.w,
        bottom: stageRect.top + body.y + body.h,
        width: body.w,
        height: body.h,
      };
      const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (inside && body.contextHoverActive) {
        body.pointerInside = true;
        continue;
      }
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
        const impulse = clamp(POINTER_MIN_IMPULSE + pointerSpeed * .24, POINTER_MIN_IMPULSE, POINTER_IMPULSE) * effects.pointerImpulseMult * projectEffects(body).pointerImpulseMult;
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
    if (battlePaused || projectContextPaused || motionStopped || activeProjectLevelUp || !gameActive || !stage) return;
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

    // Freeze the simulation but keep the loop alive. A battle, a context panel
    // or a level-up owns the screen, so the sticker would hang over whatever is
    // on top — drop it.
    if (battlePaused || projectContextPaused || activeProjectLevelUp) {
      lastTime = now;
      if (exploreCueBody) { hideExploreCue(); scheduleNextExploreCue(now); }
      frame = requestAnimationFrame(tick);
      return;
    }

    // "Stop motion" is different: nothing covers the stage, the spheres are
    // simply still, and the invitation is easier to act on than ever — so the
    // cue keeps running. Nothing in this branch writes style, so the rect read
    // is a clean one the browser can serve from its cached layout.
    if (motionStopped) {
      lastTime = now;
      updateExploreCue(now, stage.getBoundingClientRect());
      frame = requestAnimationFrame(tick);
      return;
    }

    // Bushido runs its own particle sim in place of the normal simulation.
    if (bushido) {
      if (exploreCueBody) { hideExploreCue(); scheduleNextExploreCue(now); }
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
    const heatThreshold = Math.max(HEAT_THRESHOLD, speedFloor + HEAT_MARGIN);
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
      const projectFx = projectEffects(body);
      const bodySpeedFloor = speedFloor * projectFx.speedMult;
      const bodyMaxSpeed = maxSpeed * projectFx.maxSpeedMult;
      const bodyHeatThreshold = Math.max(HEAT_THRESHOLD, bodySpeedFloor + HEAT_MARGIN);
      const bodyDamping = Math.pow(damping, projectFx.dragExponent);
      const contextHoverActive = updateContextHover(body, now, stageRect);
      if (contextHoverActive && !reducedMotion()) {
        const minY = stageTopLimit(stageRect);
        const targetX = clamp(
          pointer.x - stageRect.left - body.w / 2,
          EDGE_PADDING,
          Math.max(EDGE_PADDING, stageRect.width - body.w - EDGE_PADDING)
        );
        const targetY = clamp(
          pointer.y - stageRect.top - body.h / 2,
          minY,
          Math.max(minY, stageRect.height - body.h - BOTTOM_EDGE_PADDING)
        );
        const desiredVx = (targetX - body.x) * CONTEXT_HOVER_FOLLOW_SPEED;
        const desiredVy = (targetY - body.y) * CONTEXT_HOVER_FOLLOW_SPEED;
        const response = 1 - Math.exp(-dt / CONTEXT_HOVER_RESPONSE_MS);
        body.vx += (desiredVx - body.vx) * response;
        body.vy += (desiredVy - body.vy) * response;
        body.friction = Math.max(0, body.friction - FRICTION_RELIEF * dt * 2);
        updateHeatVisual(body, now, stageRect);
        body.x += body.vx * dt;
        body.y += body.vy * dt;
        constrain(body, stageRect, false);
        continue;
      }
      if (gameActive && projectFx.autoFlick) {
        body.projectState.autoTimer += dt;
        if (body.projectState.autoTimer >= 7000) {
          body.projectState.autoTimer = 0;
          const angle = Math.random() * Math.PI * 2;
          const impulse = POINTER_IMPULSE * .72 * effects.pointerImpulseMult * projectFx.pointerImpulseMult;
          body.vx += Math.cos(angle) * impulse;
          body.vy += Math.sin(angle) * impulse;
          body.armed = true;
          body.armedUntil = now + ARMED_DURATION;
        }
      }
      // Let a flick's armed state lapse so blocks eventually settle instead of
      // scoring off bumpers (and re-launching) indefinitely.
      if (body.armed && now >= body.armedUntil) body.armed = false;
      body.vx += (body.homeX - body.x) * HOME_PULL * dt;
      body.vy += (body.homeY - body.y) * HOME_PULL * dt;
      if (effects.gravity || projectFx.gravity) body.vy += (effects.gravity + projectFx.gravity) * dt;
      if (!reducedMotion()) {
        body.vx += Math.sin(t * .41 + body.phase) * .000014 * dt;
        body.vy += Math.cos(t * .37 + body.phase * 1.23) * .000014 * dt;
      }
      body.vx *= Math.pow(bodyDamping, dt);
      body.vy *= Math.pow(bodyDamping, dt);
      // Heat adds its own drag on top, growing as the meter fills.
      if (body.friction > 0) {
        const fDamp = Math.pow(FRICTION_DAMP_BASE, body.friction * dt);
        body.vx *= fDamp;
        body.vy *= fDamp;
      }
      const speed = Math.hypot(body.vx, body.vy);
      // Build heat while moving faster than the ambient drift, shed it below —
      // so idle blocks stay cool and only launched ones heat toward a stop.
      const heat = speed - bodyHeatThreshold;
      if (heat > 0) body.friction = Math.min(1, body.friction + heat * FRICTION_GAIN * dt);
      else body.friction = Math.max(0, body.friction - FRICTION_RELIEF * dt);
      if (body.friction >= 1 && !body.frictionSpent) {
        body.frictionSpent = true;
        if (gameActive && body.armed) frictionBurn(body, stageRect);
      } else if (body.friction < FRICTION_REARM) {
        body.frictionSpent = false;
      }
      updateHeatVisual(body, now, stageRect);
      // Heat suppresses the drift floor so a hot block can actually come to rest
      // (at full heat the floor is zero); it returns as the block cools.
      const effFloor = bodySpeedFloor * (1 - body.friction);
      if (speed < effFloor) {
        const angle = body.phase + t * .16;
        body.vx += Math.cos(angle) * (effFloor - speed) * .16;
        body.vy += Math.sin(angle) * (effFloor - speed) * .16;
      }
      body.vx = clamp(body.vx, -bodyMaxSpeed, bodyMaxSpeed);
      body.vy = clamp(body.vy, -bodyMaxSpeed, bodyMaxSpeed);
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
      // Quantize to a tenth of a pixel and skip the write when nothing moved:
      // a settled or paused block otherwise re-laid itself out every frame, and
      // toFixed(2) built two throwaway strings per body per frame for precision
      // no display can show.
      const left = Math.round(body.x * 10) / 10;
      const top = Math.round(body.y * 10) / 10;
      if (left !== body.lastLeft) {
        body.el.style.left = `${left}px`;
        body.lastLeft = left;
      }
      if (top !== body.lastTop) {
        body.el.style.top = `${top}px`;
        body.lastTop = top;
      }
    }

    updateExploreCue(now, stageRect);

    mark(reducedMotion() ? 'running-reduced' : gameActive ? 'running-game' : 'running');
    frame = requestAnimationFrame(tick);
  }

  function teardown() {
    abortBushido();
    suspendProjectLevelUp();
    hideExploreCue();
    // A resize or rotation lands here mid-countdown, usually with the next slot
    // already in the past — let the new layout settle before asking again.
    if (exploreCueNextAt) exploreCueNextAt = performance.now() + 6000;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    for (const body of bodies) {
      if (body.halo) body.halo.style.opacity = '0';
      body.el.classList.remove('is-context-hover-active');
    }
    bodies = [];
    invalidateBumpers();
    lastTime = 0;
    autoFlickTimer = 0;
    document.documentElement.classList.remove('pv2-physics-live');
    setScoreVisible(false);
    setMotionToggleVisible(false);
  }

  // Position-only push that guarantees a freshly spawned block sits clear of
  // every text block (bumper), preferring whichever axis has room.
  function ejectFromBumpers(body, stageRect, bumpers) {
    const minY = stageTopLimit(stageRect);
    const maxX = Math.max(EDGE_PADDING, stageRect.width - body.w - EDGE_PADDING);
    const maxY = Math.max(minY, stageRect.height - body.h - BOTTOM_EDGE_PADDING);
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
      // A cold render after (re)init: no pending xp is in flight, so both
      // strokes jump straight to the stored value.
      body.projectState.shownXp = body.projectState.xp;
      body.projectState.shownLevel = body.projectState.level;
      refreshProjectProgressUI(body, false, true);
      body.el.style.left = `${body.x}px`;
      body.el.style.top = `${body.y}px`;
      body.lastLeft = NaN;
      body.lastTop = NaN;
    }

    if (gameActive) setScoreVisible(true);
    setMotionToggleVisible(true);
    refreshBushidoBadge();
    mark('initialized');
    frame = requestAnimationFrame(tick);
    openNextProjectLevelUp();
  }

  const observer = new MutationObserver(() => {
    const hasOverview = Boolean(document.querySelector('.pv2-overview__stage'));
    // Heat halos, XP UI and other gameplay children mutate inside the React
    // root too. If the live stage is still healthy, none of those mutations
    // require a teardown/re-init check.
    if (hasOverview && stage?.isConnected && frame) return;
    if (!hasOverview && !stage && !activeProjectLevelUp) return;

    clearTimeout(mutationTimer);
    mutationTimer = window.setTimeout(() => {
      const overviewNow = Boolean(document.querySelector('.pv2-overview__stage'));
      if (overviewNow && (!stage || !stage.isConnected || !frame)) whenHydrated(init);
      if (!overviewNow && stage) {
        teardown();
        stage = null;
        mark('inactive');
      } else if (!overviewNow && activeProjectLevelUp) {
        suspendProjectLevelUp();
      }
    }, 40);
  });

  // React owns .pv2-float-slot. This script repositions those same elements and
  // injects progress UI into them, so running before hydration left the DOM
  // different from what React's server HTML described — React threw the markup
  // away and re-rendered the whole portfolio on every load (hydration error
  // #418), which also wiped the injected nodes and forced a physics re-init.
  // RelationalPortfolio raises `pv2:hydrated` once it has mounted; until then
  // the simulation stays off the DOM.
  let hydrated = document.documentElement.classList.contains('pv2-hydrated');

  function whenHydrated(run) {
    if (hydrated) { run(); return; }
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      hydrated = true;
      clearTimeout(timer);
      window.removeEventListener('pv2:hydrated', go);
      run();
    };
    // Fallback: if hydration never happens (the React bundle failed to load, or
    // JS is partly blocked) the floating game should still come up.
    const timer = window.setTimeout(go, 2000);
    window.addEventListener('pv2:hydrated', go, { once: true });
  }

  function start() {
    mark('script-loaded');
    ensureScoreCounter();
    ensureMotionToggle();
    ensureFxLayer();
    ensureBushidoBadge();
    refreshBushidoBadge();
    const portfolioRoot = document.getElementById('portfolio-v2') || document.body;
    observer.observe(portfolioRoot, { childList: true, subtree: true });
    // Battle-mode bridge (portfolio-battle.js drives these).
    window.addEventListener('pv2:battle-pause', () => { battlePaused = true; });
    window.addEventListener('pv2:battle-resume', () => { battlePaused = false; lastTime = 0; });
    window.addEventListener('pv2:project-context-pause', () => {
      projectContextPaused = true;
      dismissExploreCue();
    });
    window.addEventListener('pv2:project-context-resume', () => { projectContextPaused = false; lastTime = 0; });
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
    // Mobile browsers fire `resize` every time the URL bar slides in or out,
    // which is constantly. A full init() tears the simulation down and respawns
    // every block at a fresh home position, so reacting to those made the game
    // visibly reset itself while the visitor was just moving a finger. Only a
    // real geometry change — a rotation, or a window actually being resized —
    // warrants a rebuild; the stage itself is sized in `svh`, so URL-bar
    // movement no longer changes the play area at all.
    let lastViewportW = window.innerWidth;
    let lastViewportH = window.innerHeight;
    const URL_BAR_SLACK = 140;

    window.addEventListener('resize', () => {
      invalidateBumpers();
      if (upgradeOverlay?.classList.contains('is-open')) { clampTreePan(); applyTreeTransform(); }

      const widthChanged = window.innerWidth !== lastViewportW;
      const heightDelta = Math.abs(window.innerHeight - lastViewportH);
      lastViewportW = window.innerWidth;
      lastViewportH = window.innerHeight;
      if (!widthChanged && heightDelta <= URL_BAR_SLACK) return;

      clearTimeout(mutationTimer);
      mutationTimer = window.setTimeout(() => whenHydrated(init), 100);
    });
    whenHydrated(init);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();