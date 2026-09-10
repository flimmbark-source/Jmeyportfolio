(() => {
  const VIDEO_SRC = '/images/Screen Recording 2026-09-10 161604.mp4';
  let observer = null;

  function mountPreview() {
    const visual = document.querySelector('.pv2-focus .pv2-visual--letter-river.is-large');
    if (!visual || visual.querySelector('.pv2-letter-river-video')) return;

    const video = document.createElement('video');
    video.className = 'pv2-visual__media pv2-letter-river-video';
    video.src = VIDEO_SRC;
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

  function start() {
    mountPreview();
    observer = new MutationObserver(mountPreview);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
