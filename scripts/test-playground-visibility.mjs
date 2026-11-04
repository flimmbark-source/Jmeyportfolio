import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/scripts/portfolio-physics-v3.js', import.meta.url), 'utf8');
const definition = source.slice(source.indexOf('  function playgroundIsVisible()'), source.indexOf('  function liveProjectBody('));
function visible({ gate = false, hidden = false, absent = false, connected = true, inert = false, rects = 1, width = 800, height = 600 } = {}) {
  const stage = { isConnected: connected, closest: () => inert ? {} : null, getClientRects: () => Array(rects), offsetWidth: width, offsetHeight: height };
  return vm.runInNewContext(`${definition}\nplaygroundIsVisible()`, { document: { hidden, documentElement: { classList: { contains: () => gate } }, querySelector: () => absent ? null : stage } });
}
test('mounted stage behind entry gate never invites exploration', () => assert.equal(visible({ gate: true }), false));
test('active playground can show its cue', () => assert.equal(visible(), true));
test('non-playground pages, hidden tabs and inactive stages suppress the cue', () => {
  for (const state of [{ absent: true }, { hidden: true }, { connected: false }, { inert: true }, { rects: 0 }, { width: 0 }, { height: 0 }]) assert.equal(visible(state), false);
});
