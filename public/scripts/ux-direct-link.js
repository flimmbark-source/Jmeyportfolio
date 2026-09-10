(() => {
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('.pv2-gateway-link--ux') : null;
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    window.location.href = '/ux';
  }, true);
})();
