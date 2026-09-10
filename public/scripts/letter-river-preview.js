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
  ];

  let observer = null;

  function mountPreview({ selector, className, src }) {
    const visual = document.querySelector(selector);
    if (!visual || visual.querySelector(`.${className}`)) return;

    const video = document.createElement('video');
    video.className = `pv2-visual__media ${className}`;
    video.src = src;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.setAttribute('aria-hidden', 'true');

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
