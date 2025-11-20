(() => {
  const layer = document.querySelector('[data-parallax-layer]');
  if (!layer) return;

  const speed = 0.18;
  let ticking = false;

  const updateLayer = () => {
    const offset = window.scrollY * speed;
    layer.style.transform = `translate3d(0, ${offset}px, 0)`;
    ticking = false;
  };

  const handleScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateLayer);
      ticking = true;
    }
  };

  updateLayer();
  window.addEventListener('scroll', handleScroll, { passive: true });
})();
