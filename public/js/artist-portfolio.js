// ============================================
// POWERLINE TATTOO — ARTIST PORTFOLIO LIGHTBOX
// Shared by every /artists/<name> page.
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const lbImg = document.getElementById('lightbox-img');
  const lbClose = document.getElementById('lightbox-close');
  const lbPrev = document.getElementById('lightbox-prev');
  const lbNext = document.getElementById('lightbox-next');
  const lbCounter = document.getElementById('lightbox-counter');
  const items = Array.from(document.querySelectorAll('.portfolio-item'));
  // Grid shows small thumbnails; the lightbox loads the full-resolution original.
  const srcs = items.map(i => {
    const img = i.querySelector('img');
    return img.dataset.full || img.src;
  });
  let currentIdx = 0;
  let lastFocused = null;

  function showLightbox() {
    const src = srcs[currentIdx];
    // Cross-fade between images
    lbImg.classList.add('swapping');
    const loader = new Image();
    loader.onload = () => {
      lbImg.src = src;
      lbImg.classList.remove('swapping');
    };
    loader.src = src;
    if (lbCounter) lbCounter.textContent = `${currentIdx + 1} / ${srcs.length}`;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function hideLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function navigate(direction) {
    currentIdx = (currentIdx + direction + srcs.length) % srcs.length;
    showLightbox();
  }

  // Make each thumbnail focusable and operable by keyboard (Enter / Space).
  items.forEach((item, i) => {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `View tattoo ${i + 1} of ${items.length} (open larger)`);
    const open = () => {
      lastFocused = item;
      currentIdx = i;
      showLightbox();
      if (lbClose) lbClose.focus();
    };
    item.addEventListener('click', open);
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        open();
      }
    });
  });

  lbClose.addEventListener('click', hideLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) hideLightbox(); });
  lbPrev.addEventListener('click', e => { e.stopPropagation(); navigate(-1); });
  lbNext.addEventListener('click', e => { e.stopPropagation(); navigate(1); });

  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') hideLightbox();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });

  // Trap Tab focus within the modal while it is open.
  lightbox.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !lightbox.classList.contains('active')) return;
    const focusables = [lbClose, lbPrev, lbNext].filter(Boolean);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!focusables.includes(document.activeElement)) { e.preventDefault(); first.focus(); }
  });

  // Swipe support (mobile)
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(dx) > 50) navigate(dx < 0 ? 1 : -1);
  }, { passive: true });
});
