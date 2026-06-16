/**
 * Minimal header behavior: transparent at top, solid on scroll (scroll-back style).
 */
(function () {
  const header = document.getElementById('header');
  if (!header) return;

  const shrinkAt = 80;

  function update() {
    if (window.scrollY > shrinkAt) {
      header.classList.add('shrink');
    } else {
      header.classList.remove('shrink');
    }
  }

  update();
  window.addEventListener('scroll', update, { passive: true });
})();
