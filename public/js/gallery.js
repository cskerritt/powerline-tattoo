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
        if (filter === 'all' || item.dataset.style === filter) {
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
    lightboxImg.src = item.querySelector('img').src;
    lightboxArtist.textContent = item.dataset.artist || '';
    lightboxStyle.textContent = item.dataset.style || '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
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
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });
}
