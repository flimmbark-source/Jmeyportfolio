(() => {
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('.pv2-gateway-link--ux') : null;
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    // A page can point the UX bumper elsewhere: <html data-ux-href="…">.
    window.location.href = document.documentElement.dataset.uxHref || '/ux';
  }, true);
})();
