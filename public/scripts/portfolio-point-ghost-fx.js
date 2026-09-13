(() => {
  const STYLE_ID = 'pv2-point-ghost-v3-style';
  const palette = ['#ff3366', '#7c3cff', '#00b894', '#ff9f1a', '#1597ff', '#e843d5', '#ff5f00'];
  let colorIndex = 0;

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .pv2-point-ghost-v3 {
        position: fixed;
        z-index: 5400;
        left: var(--ghost-x);
        top: var(--ghost-y);
        color: var(--ghost-color);
        font-family: system-ui, sans-serif;
        font-size: clamp(2.15rem, 3vw, 3.2rem);
        font-weight: 950;
        line-height: .9;
        letter-spacing: -.07em;
        white-space: nowrap;
        pointer-events: none;
        transform-origin: 50% 100%;
        -webkit-text-stroke: 1px rgba(255,255,255,.72);
        text-shadow:
          0 2px 0 rgba(255,255,255,.9),
          0 5px 18px color-mix(in srgb, var(--ghost-color) 42%, transparent),
          0 0 2px color-mix(in srgb, var(--ghost-color) 78%, black);
        animation: pv2PointGhostV3 4800ms linear forwards;
      }

      @keyframes pv2PointGhostV3 {
        0% {
          opacity: 0;
          transform: translate(-50%, 4px) scale(.35);
        }
        7% {
          opacity: 1;
          transform: translate(-50%, -26px) scale(1.38);
        }
        15% {
          opacity: 1;
          transform: translate(-50%, -34px) scale(1);
        }
        67% {
          opacity: 1;
          transform: translate(-50%, -38px) scale(1);
        }
        82% {
          opacity: 1;
          transform: translate(-50%, -46px) scale(1.02);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -118px) scale(.94);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .pv2-point-ghost-v3 {
          animation-duration: 3200ms;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function bumperFor(id) {
    if (id === 'statement') return document.querySelector('.pv2-overview__statement');
    if (id === 'ux-work') return document.querySelector('.pv2-gateway-link--ux');
    if (id === 'all-games') return document.querySelector('.pv2-gateway-link--unfinished');
    return null;
  }

  function spawn(detail) {
    ensureStyles();
    const bumper = bumperFor(detail?.bumperId);
    const rect = bumper?.getBoundingClientRect();
    const x = Number.isFinite(detail?.impactX) ? detail.impactX : rect ? rect.left + rect.width / 2 : null;
    const y = Number.isFinite(detail?.impactY) ? detail.impactY : rect ? rect.top : null;
    if (x == null || y == null) return;

    const ghost = document.createElement('span');
    ghost.className = 'pv2-point-ghost-v3';
    ghost.textContent = `+${detail?.delta ?? 1}`;
    ghost.style.setProperty('--ghost-x', `${x}px`);
    ghost.style.setProperty('--ghost-y', `${y - 4}px`);
    ghost.style.setProperty('--ghost-color', palette[colorIndex % palette.length]);
    colorIndex += 1;
    document.body.appendChild(ghost);
    ghost.addEventListener('animationend', () => ghost.remove(), { once: true });
  }

  function start() {
    ensureStyles();
    window.addEventListener('pv2:score', (event) => spawn(event.detail));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
