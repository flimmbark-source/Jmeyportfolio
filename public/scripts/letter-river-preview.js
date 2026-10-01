(() => {
  // Prefer build-generated, fast-start derivatives. If the build environment
  // lacks ffmpeg, fall back to the original H.264 MP4s rather than leaving a
  // blank detail view.
  const PREVIEWS = [
    {
      selector: '.pv2-focus .pv2-visual--letter-river.is-large, .pv2-project-context-panel__media .pv2-visual--letter-river.is-large',
      className: 'pv2-letter-river-video',
      src: '/images/derived/Screen-Recording-2026-09-10-161604.mp4',
      fallbackSrc: '/images/Screen Recording 2026-09-10 161604.mp4',
    },
    {
      selector: '.pv2-focus .pv2-visual--rotogo.is-large, .pv2-project-context-panel__media .pv2-visual--rotogo.is-large',
      className: 'pv2-rotogo-video',
      src: '/images/derived/Screen-Recording-2026-09-10-162158.mp4',
      fallbackSrc: '/images/Screen Recording 2026-09-10 162158.mp4',
    },
    {
      selector: '.pv2-focus .pv2-visual--last-reading.is-large, .pv2-project-context-panel__media .pv2-visual--last-reading.is-large',
      className: 'pv2-last-reading-video',
      src: '/images/derived/Screen-Recording-2026-09-10-162450.mp4',
      fallbackSrc: '/images/Screen Recording 2026-09-10 162450.mp4',
    },
    {
      selector: '.pv2-focus .pv2-visual--gig-duel.is-large, .pv2-project-context-panel__media .pv2-visual--gig-duel.is-large',
      className: 'pv2-gig-duel-video',
      src: '/images/derived/Screen-Recording-2026-09-10-162707.mp4',
      fallbackSrc: '/images/Screen Recording 2026-09-10 162707.mp4',
    },
  ];

  let observer = null;
  let mountQueued = false;

  function addLoader(visual) {
    if (visual.querySelector('.pv2-media-loader')) return visual.querySelector('.pv2-media-loader');
    const loader = document.createElement('div');
    loader.className = 'pv2-media-loader';
    loader.setAttribute('aria-hidden', 'true');
    loader.innerHTML = '<span></span><span></span><span></span>';
    visual.appendChild(loader);
    return loader;
  }

  function removeLoader(loader) {
    if (!loader?.isConnected) return;
    loader.classList.add('is-done');
    window.setTimeout(() => loader.remove(), 180);
  }

  function mountPreview({ selector, className, src, fallbackSrc }) {
    const visual = document.querySelector(selector);
    if (!visual || visual.querySelector('.' + className)) return;

    const loader = addLoader(visual);
    const frame = visual.querySelector('.pv2-visual__frame');
    const video = document.createElement('video');
    video.className = 'pv2-visual__media ' + className;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.setAttribute('aria-hidden', 'true');

    let usingFallback = false;
    let isReady = false;

    const markReady = () => {
      if (isReady) return;
      isReady = true;
      visual.classList.add('is-video-ready');
      frame?.classList.add('has-media');
      removeLoader(loader);
    };

    const playCurrent = () => {
      const play = video.play();
      if (play?.catch) play.catch(() => {});
    };

    const fail = () => {
      if (!usingFallback && fallbackSrc) {
        usingFallback = true;
        video.src = fallbackSrc;
        video.load();
        playCurrent();
        return;
      }
      visual.classList.remove('is-video-ready');
      frame?.classList.remove('has-media');
      removeLoader(loader);
      video.remove();
    };

    video.addEventListener('canplay', markReady, { once: true });
    video.addEventListener('loadeddata', markReady, { once: true });
    video.addEventListener('error', fail);

    visual.prepend(video);
    video.src = src;
    playCurrent();
  }

  function mountPreviews() {
    PREVIEWS.forEach(mountPreview);
  }

  function queueMountPreviews() {
    if (mountQueued) return;
    mountQueued = true;
    requestAnimationFrame(() => {
      mountQueued = false;
      mountPreviews();
    });
  }

  function start() {
    mountPreviews();
    observer = new MutationObserver(queueMountPreviews);
    // The relevant React views all live here. Watching document.body caused
    // every gameplay FX node to trigger four full-page selector scans.
    const root = document.getElementById('portfolio-v2') || document.body;
    observer.observe(root, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
