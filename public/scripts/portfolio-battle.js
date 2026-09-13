/*
 * Battle mode (SCAFFOLD / preview).
 *
 * The RPG genre-bend teased by the "Critical Combo" upgrade node. A Critical
 * Combo — 5 powered bumper hits within 1 second — dissolves the floating
 * overview into a classic turn-based battle: the game blocks are your party
 * (each its own class), the text blocks (UI / Systems / Workshop) are the
 * boss. Dealing damage generates points.
 *
 * This is a foundation, gated behind a preview flag so it isn't live for
 * visitors yet. The combat here is intentionally minimal — the class kits and
 * the synergy system are the next design pass (see docs/battle-mode.md).
 *
 * Enable:  visit with ?battle=1  (persists), disable with ?battle=0
 * Trigger: land a Critical Combo, or press "b" on the work page while enabled.
 */
(() => {
  const params = new URLSearchParams(location.search);
  if (params.has('battle')) {
    try { localStorage.setItem('pv2-battle', params.get('battle') === '0' ? '0' : '1'); } catch {}
  }
  let enabled = false;
  try { enabled = localStorage.getItem('pv2-battle') === '1'; } catch {}
  if (!enabled) return;

  // Class kits are placeholders, keyed by game block. Easy to expand per game.
  const CLASSES = {
    'get-to-the-cafe': { name: 'Barista', role: 'Tempo', hp: 34, atk: 7 },
    'letter-river': { name: 'Scribe', role: 'Caster', hp: 28, atk: 9 },
    'last-reading': { name: 'Reader', role: 'Warden', hp: 42, atk: 5 },
    'rotogo': { name: 'Striker', role: 'Brawler', hp: 30, atk: 10 },
    'gig-duel': { name: 'Duelist', role: 'Burst', hp: 26, atk: 12 },
  };
  const COMBO_WINDOW = 1000;
  const COMBO_COUNT = 5;

  const hits = [];
  let inBattle = false;
  let overlay = null;
  let state = null;

  const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
  const addPoints = (n) => { if (n > 0) emit('pv2:add-points', { n }); };
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const randInt = (min, max) => Math.floor(min + Math.random() * (max - min + 1));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  window.addEventListener('pv2:bumper-hit', () => {
    if (inBattle) return;
    const now = performance.now();
    hits.push(now);
    while (hits.length && now - hits[0] > COMBO_WINDOW) hits.shift();
    if (hits.length >= COMBO_COUNT) { hits.length = 0; startBattle('Critical Combo!'); }
  });

  window.addEventListener('keydown', (event) => {
    const typing = /^(input|textarea|select)$/i.test(document.activeElement?.tagName || '');
    if (!typing && event.key.toLowerCase() === 'b' && !inBattle && document.querySelector('.pv2-overview__stage')) {
      startBattle('Critical Combo!');
    } else if (event.key === 'Escape' && inBattle) {
      endBattle();
    }
  });

  function collectParty() {
    return [...document.querySelectorAll('.pv2-overview__stage .pv2-float-slot[data-node-id]')]
      .filter((el) => el.offsetWidth > 0 && el.querySelector('.pv2-project-tile'))
      .map((el) => {
        const id = el.dataset.nodeId;
        const kit = CLASSES[id] || {
          name: el.querySelector('.pv2-project-tile__caption strong')?.textContent?.trim() || id,
          role: 'Fighter', hp: 30, atk: 8,
        };
        return { id, name: kit.name, role: kit.role, atk: kit.atk, maxHp: kit.hp, hp: kit.hp, alive: true, acted: false };
      });
  }

  function startBattle(banner) {
    if (inBattle) return;
    const party = collectParty();
    if (!party.length) return;
    inBattle = true;
    emit('pv2:battle-pause');
    document.documentElement.classList.add('pv2-battle-active');
    const boss = { name: 'The Portfolio', parts: ['UI', 'Systems', 'Workshop'], atk: 9, maxHp: 60 + party.length * 26 };
    boss.hp = boss.maxHp;
    state = { party, boss, round: 1, actedThisRound: 0, phase: 'player', over: false, log: [banner || 'Battle start!'] };
    buildOverlay();
    render();
  }

  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'pv2-battle';
    overlay.innerHTML = `
      <div class="pv2-battle__flash" aria-hidden="true"></div>
      <section class="pv2-battle__stage" role="dialog" aria-modal="true" aria-label="Battle">
        <header class="pv2-battle__topbar">
          <span class="pv2-battle__eyebrow">Critical Combo · Battle (preview)</span>
          <button class="pv2-battle__flee" type="button">Flee ✕</button>
        </header>
        <div class="pv2-battle__boss" data-boss></div>
        <div class="pv2-battle__log" data-log aria-live="polite"></div>
        <div class="pv2-battle__party" data-party></div>
        <div class="pv2-battle__controls" data-controls></div>
      </section>
    `;
    overlay.querySelector('.pv2-battle__flee').addEventListener('click', endBattle);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('is-open'));
  }

  function hpBar(cur, max) {
    const pct = clamp(Math.round((cur / max) * 100), 0, 100);
    return `<span class="pv2-battle__hp"><span class="pv2-battle__hp-fill" style="width:${pct}%"></span></span>`;
  }

  function render() {
    if (!overlay || !state) return;
    const { party, boss } = state;

    overlay.querySelector('[data-boss]').innerHTML = `
      <div class="pv2-battle__boss-parts">${boss.parts.map((p) => `<span>${p}</span>`).join('')}</div>
      <strong class="pv2-battle__boss-name">${boss.name}</strong>
      ${hpBar(boss.hp, boss.maxHp)}
      <span class="pv2-battle__hp-num">${Math.max(0, boss.hp)} / ${boss.maxHp}</span>
    `;

    overlay.querySelector('[data-log]').textContent = state.log[state.log.length - 1] || '';

    const partyEl = overlay.querySelector('[data-party]');
    partyEl.innerHTML = party.map((m, i) => `
      <button class="pv2-battle__fighter${m.alive ? '' : ' is-down'}${state.phase === 'player' && m.alive && !m.acted ? ' is-ready' : ''}"
        type="button" data-idx="${i}" ${state.phase === 'player' && m.alive && !m.acted ? '' : 'disabled'}>
        <span class="pv2-battle__fighter-role">${m.role}</span>
        <strong class="pv2-battle__fighter-name">${m.name}</strong>
        ${hpBar(m.hp, m.maxHp)}
        <span class="pv2-battle__hp-num">${Math.max(0, m.hp)}/${m.maxHp}</span>
      </button>
    `).join('');
    partyEl.querySelectorAll('[data-idx]').forEach((btn) => {
      btn.addEventListener('click', () => playerAttack(Number(btn.dataset.idx)));
    });

    const controls = overlay.querySelector('[data-controls]');
    if (state.over) {
      controls.innerHTML = `<button class="pv2-battle__end" type="button">Return to work →</button>`;
      controls.querySelector('.pv2-battle__end').addEventListener('click', endBattle);
    } else if (state.phase === 'player') {
      const ready = party.some((m) => m.alive && !m.acted);
      controls.innerHTML = `<span class="pv2-battle__turn">Round ${state.round} · your move</span>
        <button class="pv2-battle__endturn" type="button">${ready ? 'End turn' : 'Enemy turn →'}</button>`;
      controls.querySelector('.pv2-battle__endturn').addEventListener('click', enemyTurn);
    } else {
      controls.innerHTML = `<span class="pv2-battle__turn">Enemy turn…</span>`;
    }
  }

  function log(message) {
    state.log.push(message);
    if (overlay) overlay.querySelector('[data-log]').textContent = message;
  }

  function floatNumber(target, text, kind) {
    if (!overlay || !target) return;
    const host = overlay.querySelector(target);
    if (!host) return;
    const tag = document.createElement('span');
    tag.className = `pv2-battle__pop pv2-battle__pop--${kind}`;
    tag.textContent = text;
    host.appendChild(tag);
    tag.addEventListener('animationend', () => tag.remove(), { once: true });
  }

  function playerAttack(idx) {
    if (state.over || state.phase !== 'player') return;
    const m = state.party[idx];
    if (!m || !m.alive || m.acted) return;
    m.acted = true;
    state.actedThisRound += 1;
    let dmg = m.atk + randInt(-1, 2);
    let synergy = false;
    if (state.actedThisRound >= 2) { dmg += 2; synergy = true; } // placeholder synergy
    state.boss.hp = Math.max(0, state.boss.hp - dmg);
    const earned = Math.max(1, Math.round(dmg * 0.5));
    addPoints(earned);
    floatNumber('[data-boss]', `-${dmg}`, 'dmg');
    log(`${m.name} hits for ${dmg}${synergy ? ' (Synergy!)' : ''} · +${earned} pts`);
    if (state.boss.hp <= 0) return victory();
    if (!state.party.some((p) => p.alive && !p.acted)) enemyTurn();
    else render();
  }

  function enemyTurn() {
    if (state.over) return;
    state.phase = 'enemy';
    render();
    const alive = state.party.filter((p) => p.alive);
    const target = alive[randInt(0, alive.length - 1)];
    window.setTimeout(() => {
      if (!state || state.over) return;
      const dmg = state.boss.atk + randInt(-2, 2);
      target.hp = Math.max(0, target.hp - dmg);
      floatNumber(`[data-party] [data-idx="${state.party.indexOf(target)}"]`, `-${dmg}`, 'hurt');
      log(`${state.boss.name} strikes ${target.name} for ${dmg}.`);
      if (target.hp <= 0) target.alive = false;
      if (!state.party.some((p) => p.alive)) return defeat();
      state.round += 1;
      state.actedThisRound = 0;
      state.phase = 'player';
      state.party.forEach((p) => { p.acted = false; });
      render();
    }, reduced() ? 250 : 700);
  }

  function victory() {
    state.over = true;
    state.phase = 'done';
    const bonus = state.boss.maxHp;
    addPoints(bonus);
    log(`Victory! The Portfolio falls. +${bonus} bonus points.`);
    overlay.classList.add('is-victory');
    render();
  }

  function defeat() {
    state.over = true;
    state.phase = 'done';
    log('Your party is down. The Portfolio stands.');
    overlay.classList.add('is-defeat');
    render();
  }

  function endBattle() {
    if (!inBattle) return;
    inBattle = false;
    hits.length = 0;
    if (overlay) {
      overlay.classList.remove('is-open');
      const done = () => { overlay?.remove(); overlay = null; };
      if (reduced()) done();
      else { overlay.addEventListener('transitionend', done, { once: true }); window.setTimeout(done, 400); }
    }
    document.documentElement.classList.remove('pv2-battle-active');
    emit('pv2:battle-resume');
    state = null;
  }
})();
