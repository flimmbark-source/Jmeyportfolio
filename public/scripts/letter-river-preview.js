(() => {
  const PREVIEWS = [
    {
      selector: '.pv2-focus .pv2-visual--letter-river.is-large',
      className: 'pv2-letter-river-video',
      src: '/images/Screen Recording 2026-09-10 161604.mp4',
    },
    {
      selector: '.pv2-focus .pv2-visual--rotogo.is-large',
      className: 'pv2-rotogo-video',
      src: '/images/Screen Recording 2026-09-10 162158.mp4',
    },
    {
      selector: '.pv2-focus .pv2-visual--last-reading.is-large',
      className: 'pv2-last-reading-video',
      src: '/images/Screen Recording 2026-09-10 162450.mp4',
    },
    {
      selector: '.pv2-focus .pv2-visual--gig-duel.is-large',
      className: 'pv2-gig-duel-video',
      src: '/images/Screen Recording 2026-09-10 162707.mp4',
    },
  ];

  let observer = null;

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

  function mountPreview({ selector, className, src }) {
    const visual = document.querySelector(selector);
    if (!visual || visual.querySelector(`.${className}`)) return;

    const loader = addLoader(visual);
    const video = document.createElement('video');
    video.className = `pv2-visual__media ${className}`;
    video.src = src;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('aria-hidden', 'true');

    const ready = () => removeLoader(loader);
    video.addEventListener('canplay', ready, { once: true });
    video.addEventListener('loadeddata', ready, { once: true });
    video.addEventListener('error', ready, { once: true });

    visual.prepend(video);
    visual.querySelector('.pv2-visual__frame')?.classList.add('has-media');

    const play = video.play();
    if (play?.catch) play.catch(() => {});
  }

  function mountPreviews() {
    PREVIEWS.forEach(mountPreview);
  }

  function start() {
    mountPreviews();
    observer = new MutationObserver(mountPreviews);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
