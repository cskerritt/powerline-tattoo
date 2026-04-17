/**
 * Behold Instagram Feed Integration
 * Fetches and renders Instagram posts from Behold's API.
 * Usage: Add a <div class="behold-feed" data-behold-id="FEED_ID" data-behold-count="8"></div>
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
    '.behold-feed-grid a {',
    '  position: relative;',
    '  display: block;',
    '  overflow: hidden;',
    '  border-radius: 4px;',
    '  aspect-ratio: 1;',
    '  background: var(--bg-card, #111);',
    '}',
    '.behold-feed-grid a img {',
    '  width: 100%;',
    '  height: 100%;',
    '  object-fit: cover;',
    '  display: block;',
    '  transition: transform 0.4s ease;',
    '}',
    '.behold-feed-grid a:hover img {',
    '  transform: scale(1.05);',
    '}',
    '.behold-feed-grid a::after {',
    '  content: "";',
    '  position: absolute;',
    '  inset: 0;',
    '  background: rgba(0,0,0,0.5);',
    '  opacity: 0;',
    '  transition: opacity 0.3s ease;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '}',
    '.behold-feed-grid a:hover::after {',
    '  opacity: 1;',
    '}',
    '.behold-feed-grid a .behold-ig-icon {',
    '  position: absolute;',
    '  top: 50%;',
    '  left: 50%;',
    '  transform: translate(-50%, -50%);',
    '  z-index: 2;',
    '  opacity: 0;',
    '  transition: opacity 0.3s ease;',
    '  pointer-events: none;',
    '}',
    '.behold-feed-grid a:hover .behold-ig-icon {',
    '  opacity: 1;',
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
    '}',
    '@media (max-width: 640px) {',
    '  .behold-feed-grid { grid-template-columns: repeat(2, 1fr); }',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  // Instagram SVG icon (white, 24x24)
  var igIconSvg = '<svg class="behold-ig-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="2" y="2" width="20" height="20" rx="5" stroke="white" stroke-width="1.5"/>' +
    '<circle cx="12" cy="12" r="5" stroke="white" stroke-width="1.5"/>' +
    '<circle cx="17.5" cy="6.5" r="1" fill="white"/>' +
    '</svg>';

  function initFeed(container) {
    var feedId = container.getAttribute('data-behold-id');
    if (!feedId) return;

    var maxPosts = parseInt(container.getAttribute('data-behold-count'), 10) || 8;

    // Show loading state
    container.innerHTML = '<div class="behold-feed-loading"><div class="behold-spinner"></div>Loading Instagram feed...</div>';

    fetch('https://feeds.behold.so/' + feedId)
      .then(function (res) {
        if (!res.ok) throw new Error('Feed request failed');
        return res.json();
      })
      .then(function (data) {
        var posts = [];

        // Behold API may return posts in different structures
        if (Array.isArray(data)) {
          posts = data;
        } else if (data && Array.isArray(data.posts)) {
          posts = data.posts;
        } else if (data && Array.isArray(data.media)) {
          posts = data.media;
        } else {
          // Try to find an array property
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

        posts.forEach(function (post) {
          var sizes = post.sizes || {};
          var imageUrl = (sizes.medium && sizes.medium.mediaUrl)
            || (sizes.large && sizes.large.mediaUrl)
            || (sizes.small && sizes.small.mediaUrl)
            || post.thumbnailUrl
            || '';
          var permalink = post.permalink || post.postUrl || '#';

          if (!imageUrl) return;

          var link = document.createElement('a');
          link.href = permalink;
          link.target = '_blank';
          link.rel = 'noopener';
          link.setAttribute('aria-label', 'View post on Instagram');

          var img = document.createElement('img');
          img.src = imageUrl;
          img.alt = post.caption ? post.caption.substring(0, 100) : 'Instagram post';
          img.loading = 'lazy';

          link.appendChild(img);
          link.insertAdjacentHTML('beforeend', igIconSvg);
          grid.appendChild(link);
        });

        container.innerHTML = '';
        container.appendChild(grid);
      })
      .catch(function () {
        // Fail silently — just remove loading state
        container.innerHTML = '';
      });
  }

  // Initialize all feed containers on the page
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
