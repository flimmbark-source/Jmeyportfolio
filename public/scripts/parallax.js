(() => {
  const layer = document.querySelector('[data-parallax-layer]');
  if (!layer) return;

  const speed = 1; // Use full scroll range to reveal the entire background image
  let ticking = false;
  let maxScroll = document.documentElement.scrollHeight - window.innerHeight;

  const updateMaxScroll = () => {
    maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  };

  const updateLayer = () => {
    const scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    const offset = Math.min(scrollProgress * 100 * speed, 100);
    layer.style.backgroundPosition = `center ${offset}%`;
    ticking = false;
  };

  const handleScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateLayer);
      ticking = true;
    }
  };

  updateLayer();
  window.addEventListener('resize', () => {
    updateMaxScroll();
    updateLayer();
  });
  window.addEventListener('scroll', handleScroll, { passive: true });
})();
