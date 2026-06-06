// ============================================
// POWERLINE TATTOO — GOOGLE REVIEWS (5-star)
// Replaces the static testimonials with live
// 5-star Google reviews from /api/reviews.
// Falls back to the hardcoded cards on error.
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('testimonials-grid');
  if (!grid) return;

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  try {
    const res = await fetch('/api/reviews');
    if (!res.ok) return; // keep fallback cards
    const data = await res.json();
    if (!data.reviews || !data.reviews.length) return; // keep fallback cards

    grid.innerHTML = data.reviews.slice(0, 6).map(r => `
      <div class="testimonial visible">
        <div class="testimonial-rating" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p>${escapeHtml(r.text)}</p>
        <div class="testimonial-author">
          ${r.photo ? `<img class="testimonial-avatar" src="${encodeURI(r.photo)}" alt="" referrerpolicy="no-referrer" loading="lazy">` : ''}
          <span class="testimonial-name">${escapeHtml(r.author)}</span>
          ${r.time ? `<span class="testimonial-time">${escapeHtml(r.time)}</span>` : ''}
        </div>
      </div>
    `).join('');

    // Google attribution (required when displaying Google reviews)
    const attrib = document.getElementById('testimonials-attribution');
    if (attrib) {
      const ratingTxt = data.rating ? `${data.rating.toFixed(1)} ★` : '';
      const totalTxt = data.total ? ` from ${data.total.toLocaleString()} reviews` : '';
      attrib.innerHTML = `Reviews from <a href="${data.mapsUri ? encodeURI(data.mapsUri) : 'https://www.google.com/maps'}" target="_blank" rel="noopener noreferrer">Google</a>${ratingTxt ? ` &middot; ${ratingTxt}${totalTxt}` : ''}`;
      attrib.style.display = 'block';
    }
  } catch {
    // Network/error: keep the fallback cards already in the HTML.
  }
});
