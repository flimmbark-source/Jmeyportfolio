import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/scripts/portfolio-physics-v3.js', import.meta.url), 'utf8');

// Execute the production IIFE with its startup replaced by test hooks. The DOM
// double tracks writes/scheduling, not browser rendering time or compositing.
function fixture(width = 1280, reduce = false) {
  const frames = new Map();
  const events = [];
  let sequence = 0;
  let clock = 0;
  class Element {
    children = [];
    isConnected = false;
    dataset = {};
    className = '';
    innerHTML = '';
    writes = [];
    animations = [];
    rect = { left: 140, top: 120, width: 100, height: 100 };
    classes = new Set();
    classList = {
      add: (...names) => names.forEach(name => this.classes.add(name)),
      remove: (...names) => names.forEach(name => this.classes.delete(name)),
      contains: name => this.classes.has(name),
      toggle: (name, on) => {
        if (on ?? !this.classes.has(name)) this.classes.add(name);
        else this.classes.delete(name);
      },
    };
    style = new Proxy({
      setProperty: (key, value) => { this.writes.push([key, value]); this.style[key] = value; },
      removeProperty: key => { delete this.style[key]; },
    }, { set: (target, key, value) => { this.writes.push([key, value]); target[key] = value; return true; } });
    appendChild(child) { child.isConnected = true; this.children.push(child); return child; }
    remove() { this.isConnected = false; }
    setAttribute() {}
    addEventListener() {}
    matches() { return false; }
    querySelector(selector) {
      if (selector.includes('pv2-heat-halo')) return this.children.find(child => child.className === 'pv2-heat-halo') || null;
      return null;
    }
    getBoundingClientRect() {
      let { left, top, width, height } = this.rect;
      if (this.classes.has('is-physics-body')) {
        const values = this.style['--pv2-body-transform'].match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/);
        left = Number(values[1]); top = Number(values[2]);
      } else if (this.style.left) {
        left = parseFloat(this.style.left); top = parseFloat(this.style.top);
      }
      return { left, top, width, height, right: left + width, bottom: top + height };
    }
    animate() {
      const listeners = new Map();
      const animation = {
        addEventListener: (name, callback) => listeners.set(name, callback),
        finish: () => listeners.get('finish')?.(),
        cancel: () => listeners.get('cancel')?.(),
      };
      this.animations.push(animation);
      return animation;
    }
  }
  const body = new Element(); body.isConnected = true;
  const document = {
    body, documentElement: new Element(),
    createElement: () => new Element(), querySelector: () => null,
  };
  const window = {
    innerWidth: width,
    matchMedia: () => ({ matches: reduce }),
    dispatchEvent: event => events.push(event), setTimeout: () => 1,
  };
  const context = vm.createContext({
    document, window, console, performance: { now: () => clock },
    Image: class { decode() { return Promise.resolve(); } },
    MutationObserver: class {},
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    requestAnimationFrame: callback => { frames.set(++sequence, callback); return sequence; },
    cancelAnimationFrame: id => frames.delete(id),
    clearTimeout() {},
  });
  const startup = /  if \(document\.readyState === 'loading'\) document\.addEventListener\('DOMContentLoaded', start, \{ once: true \}\);\s*else start\(\);/;
  assert.match(source, startup);
  vm.runInContext(source.replace(startup, `
    ensureProjectProgressUI = () => {};
    refreshProjectProgressUI = () => {};
    spawnDetachedSmoke = () => {};
    updateExploreCue = () => {};
    setScoreVisible = () => {};
    setMotionToggleVisible = () => {};
    globalThis.api = {
      makeBody, renderBodyPosition, ensureHeatHalo, updateHeatVisual,
      tick, teardown, pointerNearBody, spawnPointGhost,
      queueScoreUiRefresh, updateScore, addIdlePoints,
      configureSimulation: (element, items) => { stage = element; bodies = items; lastTime = 0; },
      pause: (kind, on) => {
        if (kind === 'motion') motionStopped = on;
        if (kind === 'battle') battlePaused = on;
        if (kind === 'context') projectContextPaused = on;
        if (kind === 'levelup') activeProjectLevelUp = on ? {} : null;
      },
      setPointer: (x, y) => { pointer.x = x; pointer.y = y; },
      configureScore: (counter, value, overlay, refresh, cue) => {
        scoreCounter = counter; scoreValue = value; upgradeOverlay = overlay;
        ensureScoreCounter = () => scoreCounter;
        refreshUpgradeTree = refresh; refreshUpgradeCue = cue;
      },
      get points() { return points; },
      get ghosts() { return activePointGhosts; },
      get steps() { return ghostSteps; },
    };
  `), context);
  return {
    ...context.api, api: context.api, Element, body, frames, events,
    flush(time = clock + 16.667) {
      clock = time;
      const callbacks = [...frames.values()]; frames.clear();
      callbacks.forEach(callback => callback(clock));
    },
  };
}

function simulation(f) {
  const stage = new f.Element();
  stage.rect = { left: 0, top: 0, width: 900, height: 650 };
  const el = new f.Element(); el.isConnected = true;
  const body = f.makeBody(el, 0, stage.getBoundingClientRect());
  f.configureSimulation(stage, [body]);
  return { stage, body, el };
}

test('sphere placement, pointer bounds and resize teardown preserve screen coordinates', () => {
  const f = fixture(); const { body, el } = simulation(f);
  assert.equal(el.getBoundingClientRect().left, 140);
  assert.equal(el.getBoundingClientRect().top, 120);
  body.x = 225.36; body.y = 308.74;
  el.writes.length = 0;
  f.renderBodyPosition(body);
  assert.equal(el.getBoundingClientRect().left, 225.4);
  assert.equal(el.getBoundingClientRect().top, 308.7);
  assert.equal(el.writes.filter(([key]) => key === 'left' || key === 'top').length, 0);
  const writes = el.writes.length;
  f.renderBodyPosition(body);
  assert.equal(el.writes.length, writes, 'settled bodies must not write styles');
  f.setPointer(260, 350);
  assert.equal(f.pointerNearBody(body, { left: 0, top: 0 }), true);
  f.teardown();
  assert.equal(el.classList.contains('is-physics-body'), false);
  assert.equal(el.getBoundingClientRect().left, 225.4);
  assert.equal(el.getBoundingClientRect().top, 308.7);
  const rebuilt = f.makeBody(el, 0, { width: 900, height: 650, left: 0, top: 0 });
  assert.equal(rebuilt.x, 225.4);
  assert.equal(rebuilt.y, 308.7);
});

test('live simulation reflects at walls using transforms and freezes in every pause state', () => {
  const f = fixture(); const { body, el } = simulation(f);
  body.x = 783; body.vx = .5; body.vy = 0;
  el.writes.length = 0;
  f.tick(16.667); f.frames.clear();
  assert.ok(body.x <= 784 && body.vx < 0, 'right wall must reflect the sphere');
  assert.equal(el.writes.filter(([key]) => key === 'left' || key === 'top').length, 0);
  for (const kind of ['motion', 'battle', 'context', 'levelup']) {
    const x = body.x, y = body.y;
    f.pause(kind, true); f.tick(33.334); f.frames.clear();
    assert.equal(body.x, x); assert.equal(body.y, y);
    f.pause(kind, false);
  }
});

test('heat sprites are bounded, tier painting is stable and cold spheres reheat', () => {
  for (const [width, max] of [[1280, 12], [390, 6]]) {
    const f = fixture(width); const { body } = simulation(f);
    body.friction = .31;
    f.updateHeatVisual(body, 100, {});
    const halo = body.halo;
    const flames = (halo.innerHTML.match(/class="pv2-heat-flame"/g) || []).length;
    assert.ok(flames > 0 && flames <= max);
    halo.writes.length = 0;
    body.friction = .32; f.updateHeatVisual(body, 116, {});
    assert.equal(halo.writes.some(([key]) => key === '--pv2-heat-tier' || key === '--pv2-heat-rgb'), false);
    body.friction = 0; f.updateHeatVisual(body, 132, {});
    assert.equal(halo.classList.contains('is-cold'), true);
    halo.writes.length = 0; f.updateHeatVisual(body, 148, {});
    assert.equal(halo.writes.length, 0);
    body.friction = .32; f.updateHeatVisual(body, 164, {});
    assert.equal(halo.classList.contains('is-cold'), false);
    assert.equal(halo.style['--pv2-heat'], '0.32');
    const heat = .32;
    const oldWidth = 11 + heat * 5;
    const oldHeight = (22 + heat * 22) * (.9 + heat * .65);
    assert.ok(Math.abs(16 * Number(halo.style['--pv2-flame-width']) - oldWidth) < 1e-9);
    assert.ok(Math.abs(44 * Number(halo.style['--pv2-flame-scale']) - oldHeight) < 1e-9);
  }
});

test('burst scoring preserves every event and total but paints once and skips a closed tree', () => {
  const f = fixture();
  const counter = new f.Element(), value = {}, overlay = new f.Element();
  let refreshes = 0, cues = 0;
  f.configureScore(counter, value, overlay, () => refreshes++, () => cues++);
  for (let i = 0; i < 100; i++) f.updateScore(2, 'bumper', { x: 20, y: 30 });
  f.addIdlePoints(7);
  assert.equal(f.api.points, 207);
  assert.equal(f.events.length, 101);
  assert.equal(f.events[99].detail.points, 200);
  assert.equal(f.events[100].detail.sourceId, 'idle');
  assert.equal(f.frames.size, 1);
  f.flush();
  assert.equal(value.textContent, '207');
  assert.equal(refreshes, 0); assert.equal(cues, 1);
  assert.equal(counter.animations.length, 1);
  overlay.classList.add('is-open');
  f.updateScore(3, 'wall'); f.updateScore(4, 'wall'); f.flush();
  assert.equal(value.textContent, '214'); assert.equal(refreshes, 1);
});

test('score popups share a scheduler, obey mobile/desktop budgets and release on finish/cancel', () => {
  for (const [width, limit] of [[1280, 8], [390, 4]]) {
    const f = fixture(width);
    for (let i = 0; i < 100; i++) f.spawnPointGhost({ x: i, y: 150 }, i + 1);
    assert.equal(f.api.ghosts.size, limit);
    assert.equal(f.api.steps.size, limit);
    assert.equal(f.frames.size, 1);
    for (let i = 0; i < 110 && f.frames.size; i++) f.flush();
    assert.equal(f.api.steps.size, 0);
    assert.equal(f.frames.size, 0);
    for (const ghost of [...f.api.ghosts.keys()]) ghost.animations.at(-1).finish();
    assert.equal(f.api.ghosts.size, 0);
    f.spawnPointGhost({ x: 20, y: 150 });
    for (let i = 0; i < 110 && f.frames.size; i++) f.flush();
    [...f.api.ghosts.keys()][0].animations.at(-1).cancel();
    assert.equal(f.api.ghosts.size, 0);
    f.spawnPointGhost({ x: 20, y: 150 });
    [...f.api.ghosts.keys()][0].remove(); f.flush();
    assert.equal(f.api.ghosts.size, 0); assert.equal(f.frames.size, 0);
  }
});

test('reduced motion suppresses the score pulse and teardown cancels popup work', () => {
  const f = fixture(1280, true); const counter = new f.Element();
  f.configureScore(counter, {}, new f.Element(), () => {}, () => {});
  f.updateScore(1, 'bumper'); f.flush();
  assert.equal(counter.animations.length, 0);
  simulation(f);
  f.spawnPointGhost({ x: 100, y: 100 });
  f.teardown();
  assert.equal(f.api.ghosts.size, 0); assert.equal(f.api.steps.size, 0);
  assert.equal(f.frames.size, 0);
});
