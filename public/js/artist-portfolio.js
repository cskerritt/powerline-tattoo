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
  }

  function navigate(direction) {
    currentIdx = (currentIdx + direction + srcs.length) % srcs.length;
    showLightbox();
  }

  items.forEach((item, i) => {
    item.addEventListener('click', () => {
      currentIdx = i;
      showLightbox();
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
