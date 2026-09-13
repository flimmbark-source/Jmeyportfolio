(() => {
  const MOBILE_BREAKPOINT = 720;
  const STYLE_ID = 'pv2-contact-fx-style';
  const bound = new WeakSet();

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .pv2-impact-line {
        position: fixed;
        z-index: 5000;
        width: var(--impact-length, 14px);
        height: 2.5px;
        left: var(--impact-x);
        top: var(--impact-y);
        background: rgba(24, 24, 24, .95);
        transform-origin: 0 50%;
        pointer-events: none;
        animation: pv2ImpactLine 1500ms cubic-bezier(.16,.84,.24,1) forwards;
      }

      @keyframes pv2ImpactLine {
        0% {
          opacity: 0;
          transform: translate(0, -50%) rotate(var(--impact-angle)) scaleX(.2);
        }
        6% {
          opacity: 1;
          transform: translate(calc(var(--impact-dx) * .12), calc(var(--impact-dy) * .12 - 50%)) rotate(var(--impact-angle)) scaleX(1);
        }
        78% {
          opacity: .9;
        }
        100% {
          opacity: 0;
          transform: translate(var(--impact-dx), calc(var(--impact-dy) - 50%)) rotate(var(--impact-angle)) scaleX(.55);
        }
      }
    `;
    document.head.appendChild(style);
  }

  function nearestEdgePoint(event, rect) {
    const x = Math.max(rect.left, Math.min(rect.right, event.clientX));
    const y = Math.max(rect.top, Math.min(rect.bottom, event.clientY));
    const distances = [
      { edge: 'left', value: Math.abs(event.clientX - rect.left) },
      { edge: 'right', value: Math.abs(rect.right - event.clientX) },
      { edge: 'top', value: Math.abs(event.clientY - rect.top) },
      { edge: 'bottom', value: Math.abs(rect.bottom - event.clientY) },
    ];
    distances.sort((a, b) => a.value - b.value);
    const edge = distances[0].edge;

    if (edge === 'left') return { x: rect.left, y, outward: Math.PI };
    if (edge === 'right') return { x: rect.right, y, outward: 0 };
    if (edge === 'top') return { x, y: rect.top, outward: -Math.PI / 2 };
    return { x, y: rect.bottom, outward: Math.PI / 2 };
  }

  function burst(event, tile) {
    if (window.innerWidth <= MOBILE_BREAKPOINT) return;
    const rect = tile.getBoundingClientRect();
    const impact = nearestEdgePoint(event, rect);
    const count = 8;

    for (let i = 0; i < count; i += 1) {
      const t = i / (count - 1);
      const angle = impact.outward - Math.PI / 2 + t * Math.PI;
      const distance = 24 + Math.random() * 12;
      const line = document.createElement('span');
      line.className = 'pv2-impact-line';
      line.style.setProperty('--impact-x', `${impact.x}px`);
      line.style.setProperty('--impact-y', `${impact.y}px`);
      line.style.setProperty('--impact-angle', `${angle}rad`);
      line.style.setProperty('--impact-dx', `${Math.cos(angle) * distance}px`);
      line.style.setProperty('--impact-dy', `${Math.sin(angle) * distance}px`);
      line.style.setProperty('--impact-length', `${10 + Math.random() * 7}px`);
      line.addEventListener('animationend', () => line.remove(), { once: true });
      document.body.appendChild(line);
    }
  }

  function bindTiles() {
    document.querySelectorAll('.pv2-overview .pv2-project-tile').forEach((tile) => {
      if (bound.has(tile)) return;
      bound.add(tile);
      tile.addEventListener('pointerenter', (event) => burst(event, tile));
    });
  }

  function forceStatementCenter() {
    const statement = document.querySelector('.pv2-overview__statement');
    if (!statement) return;
    statement.style.setProperty('position', 'absolute', 'important');
    statement.style.setProperty('left', '50%', 'important');
    statement.style.setProperty('top', '50%', 'important');
    statement.style.setProperty('right', 'auto', 'important');
    statement.style.setProperty('bottom', 'auto', 'important');
    statement.style.setProperty('transform', 'translate(-50%, -50%)', 'important');
  }

  function refresh() {
    ensureStyles();
    bindTiles();
    forceStatementCenter();
  }

  function start() {
    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', forceStatementCenter);

    let frames = 0;
    const settle = () => {
      forceStatementCenter();
      frames += 1;
      if (frames < 45) requestAnimationFrame(settle);
    };
    requestAnimationFrame(settle);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
