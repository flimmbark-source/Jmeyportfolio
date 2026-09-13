(() => {
  const STYLE_ID = 'pv2-point-ghost-v2-style';
  const palette = ['#ff5c7a', '#6d5dfc', '#00a67e', '#f59e0b', '#0ea5e9', '#d946ef'];
  let colorIndex = 0;

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .pv2-point-ghost-v2 {
        position: fixed;
        z-index: 5200;
        left: var(--ghost-x);
        top: var(--ghost-y);
        color: var(--ghost-color);
        font: 850 1.45rem/1 system-ui, sans-serif;
        letter-spacing: -.04em;
        white-space: nowrap;
        pointer-events: none;
        text-shadow:
          0 1px 0 rgba(255,255,255,.95),
          0 3px 14px color-mix(in srgb, var(--ghost-color) 28%, transparent);
        transform-origin: 50% 100%;
        animation: pv2PointGhostV2 2700ms cubic-bezier(.18,.8,.22,1) forwards;
      }

      @keyframes pv2PointGhostV2 {
        0% {
          opacity: 0;
          transform: translate(-50%, 8px) scale(.45);
        }
        10% {
          opacity: 1;
          transform: translate(-50%, -20px) scale(1.28);
        }
        20% {
          opacity: 1;
          transform: translate(-50%, -26px) scale(1);
        }
        68% {
          opacity: 1;
          transform: translate(-50%, -31px) scale(1);
        }
        82% {
          opacity: .94;
          transform: translate(-50%, -39px) scale(1.02);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -78px) scale(.96);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .pv2-point-ghost-v2 {
          animation-duration: 1700ms;
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
    const bumper = bumperFor(detail?.bumperId);
    if (!bumper?.isConnected) return;

    ensureStyles();
    const rect = bumper.getBoundingClientRect();
    const ghost = document.createElement('span');
    ghost.className = 'pv2-point-ghost-v2';
    ghost.textContent = `+${detail?.delta ?? 1}`;
    ghost.style.setProperty('--ghost-x', `${rect.left + rect.width / 2}px`);
    ghost.style.setProperty('--ghost-y', `${rect.top - 8}px`);
    ghost.style.setProperty('--ghost-color', palette[colorIndex % palette.length]);
    colorIndex += 1;
    document.body.appendChild(ghost);
    ghost.addEventListener('animationend', () => ghost.remove(), { once: true });
  }

  function start() {
    ensureStyles();
    window.addEventListener('pv2:score', (event) => spawn(event.detail));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();