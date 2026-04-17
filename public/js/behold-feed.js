/**
 * Behold Instagram Feed Integration
 * Fetches and renders Instagram posts from Behold's API.
 * Clicking a thumbnail opens a lightbox (stays on the website).
 *
 * Usage: <div class="behold-feed" data-behold-id="FEED_ID" data-behold-count="8"></div>
 * Options:
 *   data-behold-count   — max posts to show (default 8)
 *   data-behold-columns — grid columns: 2, 3, or 4 (default 4)
 */
(function () {
  'use strict';

  // Inject styles once
  var style = document.createElement('style');
  style.textContent = [
    '.behold-feed-grid {',
    '  display: grid;',
    '  grid-template-columns: repeat(4, 1fr);',
    '  gap: 8px;',
    '}',
    '.behold-feed-grid.behold-cols-3 {',
    '  grid-template-columns: repeat(3, 1fr);',
    '}',
    '.behold-feed-grid.behold-cols-2 {',
    '  grid-template-columns: repeat(2, 1fr);',
    '}',
    '.behold-feed-item {',
    '  position: relative;',
    '  display: block;',
    '  overflow: hidden;',
    '  border-radius: 4px;',
    '  aspect-ratio: 1;',
    '  background: var(--bg-card, #111);',
    '  cursor: pointer;',
    '}',
    '.behold-feed-item img {',
    '  width: 100%;',
    '  height: 100%;',
    '  object-fit: cover;',
    '  display: block;',
    '  transition: transform 0.4s ease;',
    '}',
    '.behold-feed-item:hover img {',
    '  transform: scale(1.05);',
    '}',
    '.behold-feed-loading {',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  padding: 3rem 0;',
    '  color: var(--text-muted, #888);',
    '  font-size: 0.875rem;',
    '}',
    '.behold-feed-loading .behold-spinner {',
    '  width: 20px;',
    '  height: 20px;',
    '  border: 2px solid var(--border, #222);',
    '  border-top-color: var(--accent, #c9a84c);',
    '  border-radius: 50%;',
    '  animation: behold-spin 0.8s linear infinite;',
    '  margin-right: 10px;',
    '}',
    '@keyframes behold-spin {',
    '  to { transform: rotate(360deg); }',
    '}',
    '.instagram-feed-section {',
    '  padding: 60px 0 40px;',
    '  background: var(--bg, #0a0a0a);',
    '}',
    '.instagram-feed-section .section-header {',
    '  text-align: center;',
    '  margin-bottom: 2rem;',
    '}',
    '.instagram-feed-section .section-header .label {',
    '  display: inline-block;',
    '  font-family: var(--font-heading, "Montserrat", sans-serif);',
    '  font-size: 0.75rem;',
    '  font-weight: 700;',
    '  letter-spacing: 0.12em;',
    '  text-transform: uppercase;',
    '  color: var(--accent, #c9a84c);',
    '  margin-bottom: 0.75rem;',
    '}',
    '.instagram-feed-section .section-header h3 {',
    '  font-family: var(--font-heading, "Montserrat", sans-serif);',
    '  font-size: clamp(1.25rem, 3vw, 1.75rem);',
    '  font-weight: 700;',
    '  color: var(--text, #f5f5f5);',
    '  margin-top: 0.5rem;',
    '}',
    '@media (max-width: 1024px) {',
    '  .behold-feed-grid { grid-template-columns: repeat(3, 1fr); }',
    '  .behold-feed-grid.behold-cols-3 { grid-template-columns: repeat(3, 1fr); }',
    '  .behold-feed-grid.behold-cols-2 { grid-template-columns: repeat(2, 1fr); }',
    '}',
    '@media (max-width: 640px) {',
    '  .behold-feed-grid { grid-template-columns: repeat(2, 1fr); }',
    '  .behold-feed-grid.behold-cols-3 { grid-template-columns: repeat(2, 1fr); }',
    '}',
    '',
    '/* Behold lightbox */',
    '.behold-lightbox {',
    '  position: fixed;',
    '  inset: 0;',
    '  z-index: 9999;',
    '  background: rgba(0,0,0,0.92);',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  opacity: 0;',
    '  pointer-events: none;',
    '  transition: opacity 0.3s ease;',
    '}',
    '.behold-lightbox.active {',
    '  opacity: 1;',
    '  pointer-events: auto;',
    '}',
    '.behold-lightbox img {',
    '  max-width: 90vw;',
    '  max-height: 90vh;',
    '  object-fit: contain;',
    '  border-radius: 4px;',
    '}',
    '.behold-lightbox-close {',
    '  position: absolute;',
    '  top: 20px;',
    '  right: 24px;',
    '  background: none;',
    '  border: none;',
    '  color: #fff;',
    '  font-size: 2.5rem;',
    '  cursor: pointer;',
    '  line-height: 1;',
    '  z-index: 10;',
    '}',
    '.behold-lightbox-nav {',
    '  position: absolute;',
    '  top: 50%;',
    '  transform: translateY(-50%);',
    '  background: none;',
    '  border: none;',
    '  color: #fff;',
    '  font-size: 2.5rem;',
    '  cursor: pointer;',
    '  padding: 20px;',
    '  z-index: 10;',
    '}',
    '.behold-lightbox-prev { left: 8px; }',
    '.behold-lightbox-next { right: 8px; }'
  ].join('\n');
  document.head.appendChild(style);

  // Build shared lightbox element
  var lightboxEl = document.createElement('div');
  lightboxEl.className = 'behold-lightbox';
  lightboxEl.innerHTML =
    '<button class="behold-lightbox-close" aria-label="Close">&times;</button>' +
    '<button class="behold-lightbox-nav behold-lightbox-prev" aria-label="Previous">&#8592;</button>' +
    '<img src="" alt="Instagram post">' +
    '<button class="behold-lightbox-nav behold-lightbox-next" aria-label="Next">&#8594;</button>';
  document.body.appendChild(lightboxEl);

  var lbImg = lightboxEl.querySelector('img');
  var lbClose = lightboxEl.querySelector('.behold-lightbox-close');
  var lbPrev = lightboxEl.querySelector('.behold-lightbox-prev');
  var lbNext = lightboxEl.querySelector('.behold-lightbox-next');
  var allImages = []; // [{src, alt}]
  var currentIdx = 0;

  function openLightbox(idx) {
    currentIdx = idx;
    lbImg.src = allImages[idx].src;
    lbImg.alt = allImages[idx].alt;
    lightboxEl.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightboxEl.classList.remove('active');
    document.body.style.overflow = '';
  }
  function navigate(dir) {
    currentIdx = (currentIdx + dir + allImages.length) % allImages.length;
    openLightbox(currentIdx);
  }

  lbClose.addEventListener('click', closeLightbox);
  lightboxEl.addEventListener('click', function (e) { if (e.target === lightboxEl) closeLightbox(); });
  lbPrev.addEventListener('click', function (e) { e.stopPropagation(); navigate(-1); });
  lbNext.addEventListener('click', function (e) { e.stopPropagation(); navigate(1); });
  document.addEventListener('keydown', function (e) {
    if (!lightboxEl.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });

  function initFeed(container) {
    var feedId = container.getAttribute('data-behold-id');
    if (!feedId) return;

    var maxPosts = parseInt(container.getAttribute('data-behold-count'), 10) || 8;
    var cols = container.getAttribute('data-behold-columns');

    // Show loading state
    container.innerHTML = '<div class="behold-feed-loading"><div class="behold-spinner"></div>Loading Instagram feed...</div>';

    fetch('https://feeds.behold.so/' + feedId)
      .then(function (res) {
        if (!res.ok) throw new Error('Feed request failed');
        return res.json();
      })
      .then(function (data) {
        var posts = [];

        if (Array.isArray(data)) {
          posts = data;
        } else if (data && Array.isArray(data.posts)) {
          posts = data.posts;
        } else if (data && Array.isArray(data.media)) {
          posts = data.media;
        } else {
          var keys = Object.keys(data || {});
          for (var i = 0; i < keys.length; i++) {
            if (Array.isArray(data[keys[i]]) && data[keys[i]].length > 0) {
              posts = data[keys[i]];
              break;
            }
          }
        }

        posts = posts.slice(0, maxPosts);

        if (posts.length === 0) {
          container.innerHTML = '';
          return;
        }

        var grid = document.createElement('div');
        grid.className = 'behold-feed-grid';
        if (cols === '3') grid.className += ' behold-cols-3';
        if (cols === '2') grid.className += ' behold-cols-2';

        // Track starting index in global allImages for this feed
        var startIndex = allImages.length;

        posts.forEach(function (post, i) {
          var sizes = post.sizes || {};
          var thumbUrl = (sizes.medium && sizes.medium.mediaUrl)
            || (sizes.small && sizes.small.mediaUrl)
            || post.thumbnailUrl
            || '';
          // Use largest available for lightbox
          var fullUrl = (sizes.large && sizes.large.mediaUrl)
            || (sizes.original && sizes.original.mediaUrl)
            || (sizes.medium && sizes.medium.mediaUrl)
            || thumbUrl;
          var altText = post.caption ? post.caption.substring(0, 100) : 'Instagram post';

          if (!thumbUrl) return;

          // Register in global images array
          allImages.push({ src: fullUrl, alt: altText });
          var imgIndex = startIndex + i;

          var item = document.createElement('div');
          item.className = 'behold-feed-item';
          item.setAttribute('role', 'button');
          item.setAttribute('tabindex', '0');
          item.setAttribute('aria-label', 'View image: ' + altText);

          var img = document.createElement('img');
          img.src = thumbUrl;
          img.alt = altText;
          img.loading = 'lazy';

          item.appendChild(img);
          item.addEventListener('click', (function (idx) {
            return function () { openLightbox(idx); };
          })(imgIndex));

          grid.appendChild(item);
        });

        container.innerHTML = '';
        container.appendChild(grid);
      })
      .catch(function () {
        container.innerHTML = '';
      });
  }

  function init() {
    var containers = document.querySelectorAll('.behold-feed[data-behold-id]');
    containers.forEach(initFeed);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
