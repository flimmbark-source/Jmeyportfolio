// A light layer over the existing Motion transitions. It never owns a
// physics body's transform, position, pointer capture, or click behavior.
export function installPortfolioPolish() {
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const selector = '[data-polish]';
  const properties = ['--polish-x', '--polish-y', '--polish-dx', '--polish-dy'];
  let active = null;
  let frame = 0;
  let lastTime = 0;
  let targetX = 0.5;
  let targetY = 0.5;
  let pointerX = 0;
  let pointerY = 0;
  let pointerDirty = false;
  let x = 0.5;
  let y = 0.5;
  let suspended = false;

  const allowed = () => finePointer.matches && !reducedMotion.matches && !suspended &&
    !document.hidden && !document.querySelector('.pv2-motion-toggle[aria-pressed="true"]');

  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    pointerDirty = false;
    if (!active) return;
    active.removeAttribute('data-polish-active');
    properties.forEach((property) => active.style.removeProperty(property));
    active = null;
  }

  function paint(time) {
    frame = 0;
    if (!active?.isConnected || !allowed()) return reset();
    // Coalesce high-frequency pointer events into one layout read per frame.
    if (pointerDirty) {
      const rect = active.getBoundingClientRect();
      if (!rect.width || !rect.height) return reset();
      targetX = Math.max(0, Math.min(1, (pointerX - rect.left) / rect.width));
      targetY = Math.max(0, Math.min(1, (pointerY - rect.top) / rect.height));
      pointerDirty = false;
    }
    // Time-based damping gives the same restrained response at 60/120 Hz.
    const dt = lastTime ? Math.min(time - lastTime, 40) : 16;
    const blend = 1 - Math.exp(-dt / 55);
    lastTime = time;
    x += (targetX - x) * blend;
    y += (targetY - y) * blend;
    active.style.setProperty('--polish-x', `${(x * 100).toFixed(2)}%`);
    active.style.setProperty('--polish-y', `${(y * 100).toFixed(2)}%`);
    active.style.setProperty('--polish-dx', (x - 0.5).toFixed(4));
    active.style.setProperty('--polish-dy', (y - 0.5).toFixed(4));
    if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.001) {
      frame = requestAnimationFrame(paint);
    } else {
      lastTime = 0;
    }
  }

  function onMove(event) {
    if (event.pointerType !== 'mouse' || event.buttons || !allowed()) return reset();
    const surface = event.target instanceof Element ? event.target.closest(selector) : null;
    if (!surface) return reset();
    if (active !== surface) {
      reset();
      active = surface;
      x = 0.5;
      y = 0.5;
      active.setAttribute('data-polish-active', '');
    }
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerDirty = true;
    if (!frame) frame = requestAnimationFrame(paint);
  }

  function onOut(event) {
    if (active && (!(event.relatedTarget instanceof Node) || !active.contains(event.relatedTarget))) reset();
  }

  function onPageHide() { suspended = true; reset(); }
  function onPageShow() { suspended = false; }

  // Delegation also covers React's project switches without a subtree
  // MutationObserver or binding handlers to the game's particle nodes.
  document.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerout', onOut, { passive: true });
  document.addEventListener('pointerdown', reset, { passive: true });
  document.addEventListener('pointercancel', reset, { passive: true });
  document.addEventListener('scroll', reset, { passive: true, capture: true });
  document.addEventListener('visibilitychange', reset);
  document.addEventListener('keydown', reset);
  window.addEventListener('blur', reset);
  window.addEventListener('resize', reset, { passive: true });
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);
  finePointer.addEventListener('change', reset);
  reducedMotion.addEventListener('change', reset);

  return () => {
    reset();
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerout', onOut);
    document.removeEventListener('pointerdown', reset);
    document.removeEventListener('pointercancel', reset);
    document.removeEventListener('scroll', reset, true);
    document.removeEventListener('visibilitychange', reset);
    document.removeEventListener('keydown', reset);
    window.removeEventListener('blur', reset);
    window.removeEventListener('resize', reset);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('pageshow', onPageShow);
    finePointer.removeEventListener('change', reset);
    reducedMotion.removeEventListener('change', reset);
  };
}
