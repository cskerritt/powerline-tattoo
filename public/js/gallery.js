document.addEventListener('DOMContentLoaded', () => {
  initFilters();
  initLightbox();
});

function initFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  const items = document.querySelectorAll('.masonry-item');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      items.forEach(item => {
        if (filter === 'all' || item.dataset.artist === filter) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxArtist = document.getElementById('lightbox-artist');
  const lightboxStyle = document.getElementById('lightbox-style');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const items = document.querySelectorAll('.masonry-item');
  let currentIndex = 0;

  function getVisibleItems() {
    return Array.from(items).filter(item => item.style.display !== 'none');
  }

  function openLightbox(index) {
    const visible = getVisibleItems();
    if (index < 0 || index >= visible.length) return;
    currentIndex = index;
    const item = visible[index];
    const img = item.querySelector('img');
    // Grid shows a small thumbnail; load the full-resolution original here.
    const fullSrc = img.dataset.full || img.src;

    // Cross-fade: briefly hide, swap once loaded, then fade back in.
    lightboxImg.classList.add('swapping');
    const loader = new Image();
    loader.onload = () => {
      lightboxImg.src = fullSrc;
      lightboxImg.classList.remove('swapping');
    };
    loader.src = fullSrc;

    lightboxArtist.textContent = item.dataset.artist || '';
    lightboxStyle.textContent = item.dataset.style || '';
    if (lightboxCounter) lightboxCounter.textContent = `${index + 1} / ${visible.length}`;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function navigate(direction) {
    const visible = getVisibleItems();
    currentIndex = (currentIndex + direction + visible.length) % visible.length;
    openLightbox(currentIndex);
  }

  items.forEach(item => {
    item.addEventListener('click', () => {
      const visible = getVisibleItems();
      const index = visible.indexOf(item);
      openLightbox(index);
    });
  });

  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.getElementById('lightbox-prev').addEventListener('click', (e) => {
    e.stopPropagation();
    navigate(-1);
  });
  document.getElementById('lightbox-next').addEventListener('click', (e) => {
    e.stopPropagation();
    navigate(1);
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });

  // Swipe support (mobile)
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(dx) > 50) navigate(dx < 0 ? 1 : -1);
  }, { passive: true });
}
