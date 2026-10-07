import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/scripts/portfolio-polish.js', import.meta.url), 'utf8');

function fixture({ fine = true, reduce = false, stopped = false } = {}) {
  class Events {
    listeners = new Map();
    addEventListener(name, listener) {
      if (!this.listeners.has(name)) this.listeners.set(name, new Set());
      this.listeners.get(name).add(listener);
    }
    removeEventListener(name, listener) { this.listeners.get(name)?.delete(listener); }
    emit(name, event = {}) { this.listeners.get(name)?.forEach((listener) => listener(event)); }
  }
  class Element {
    isConnected = true;
    attributes = new Map();
    values = new Map([['left', '120px'], ['top', '80px'], ['transform', 'translate(-50%, -50%)']]);
    style = {
      setProperty: (key, value) => this.values.set(key, value),
      removeProperty: (key) => this.values.delete(key),
    };
    setAttribute(key, value) { this.attributes.set(key, value); }
    removeAttribute(key) { this.attributes.delete(key); }
    closest() { return this; }
    contains(element) { return element === this; }
    getBoundingClientRect() { return { left: 100, top: 100, width: 200, height: 200 }; }
  }
  const document = new Events();
  document.hidden = false;
  document.querySelector = () => stopped ? {} : null;
  const window = new Events();
  const pointer = Object.assign(new Events(), { matches: fine });
  const motion = Object.assign(new Events(), { matches: reduce });
  const frames = new Map();
  let sequence = 0;
  let clock = 0;
  const context = vm.createContext({
    document, window, Element, Node: Element,
    matchMedia: (query) => query.includes('reduced-motion') ? motion : pointer,
    requestAnimationFrame: (callback) => { frames.set(++sequence, callback); return sequence; },
    cancelAnimationFrame: (id) => frames.delete(id),
  });
  vm.runInContext(source.replace('export function', 'function'), context);
  const dispose = vm.runInContext('installPortfolioPolish()', context);
  const surface = new Element();
  const move = (overrides = {}) => document.emit('pointermove', {
    target: surface, pointerType: 'mouse', buttons: 0, clientX: 280, clientY: 120, ...overrides,
  });
  const settle = () => {
    let count = 0;
    while (frames.size) {
      assert.ok(++count < 100, 'must stop rendering after the pointer settles');
      const callbacks = [...frames.values()];
      frames.clear();
      clock += 16;
      callbacks.forEach((callback) => callback(clock));
    }
  };
  return { document, window, pointer, motion, frames, surface, move, settle, dispose, Element };
}

test('pointer light settles, preserves physics geometry, and leaves no idle loop', () => {
  const f = fixture();
  f.move();
  f.settle();
  assert.ok(parseFloat(f.surface.values.get('--polish-x')) > 89);
  assert.ok(parseFloat(f.surface.values.get('--polish-y')) < 11);
  assert.equal(f.surface.values.get('left'), '120px');
  assert.equal(f.surface.values.get('top'), '80px');
  assert.equal(f.surface.values.get('transform'), 'translate(-50%, -50%)');
  assert.equal(f.frames.size, 0);
});

test('reduced motion, coarse pointers, touch events, and Stop motion suppress tracking', () => {
  for (const options of [{ reduce: true }, { fine: false }, { stopped: true }]) {
    const f = fixture(options);
    f.move();
    assert.equal(f.frames.size, 0);
    assert.equal(f.surface.attributes.size, 0);
  }
  const f = fixture();
  f.move({ pointerType: 'touch' });
  assert.equal(f.frames.size, 0);
});

test('dragging and keyboard use clear the pointer treatment', () => {
  for (const event of ['pointerdown', 'pointercancel', 'keydown']) {
    const f = fixture();
    f.move();
    f.settle();
    f.document.emit(event);
    assert.equal(f.surface.attributes.size, 0);
    assert.equal(f.surface.values.has('--polish-x'), false);
  }
  const f = fixture();
  f.move({ buttons: 1 });
  assert.equal(f.frames.size, 0);
});

test('a live reduced-motion preference change immediately clears an active effect', () => {
  const f = fixture();
  f.move();
  f.motion.matches = true;
  f.motion.emit('change');
  assert.equal(f.frames.size, 0);
  assert.equal(f.surface.attributes.size, 0);
  f.move();
  assert.equal(f.frames.size, 0);
});

test('new React surfaces work and detached surfaces release animation state', () => {
  const f = fixture();
  f.move();
  const next = new f.Element();
  f.move({ target: next });
  assert.equal(f.surface.attributes.size, 0);
  next.isConnected = false;
  f.settle();
  assert.equal(next.attributes.size, 0);
  assert.equal(f.frames.size, 0);
});

test('pointer exit and hidden pages cancel pending frames', () => {
  const f = fixture();
  f.move();
  f.document.emit('pointerout', { relatedTarget: null });
  assert.equal(f.frames.size, 0);
  f.move();
  f.document.hidden = true;
  f.document.emit('visibilitychange');
  f.move();
  assert.equal(f.frames.size, 0);
});

test('cleanup releases every listener and pending frame', () => {
  const f = fixture();
  f.move();
  f.dispose();
  for (const target of [f.document, f.window, f.pointer, f.motion]) {
    assert.equal([...target.listeners.values()].reduce((total, set) => total + set.size, 0), 0);
  }
  assert.equal(f.frames.size, 0);
});
