// ============================================
// POWERLINE TATTOO — MAIN JS
// ============================================

// --- Nav HTML ---
function getNavHTML(activePage) {
  const links = [
    { href: '/', label: 'Home', id: 'home' },
    { href: '/artists', label: 'Artists', id: 'artists' },
    { href: '/gallery', label: 'Gallery', id: 'gallery' },
    { href: '/info', label: 'Info', id: 'info' },
    { href: '/about', label: 'About', id: 'about' },
    { href: '/contact', label: 'Contact', id: 'contact' }
  ];

  const navLinks = links.map(l =>
    `<li><a href="${l.href}" class="${l.id === activePage ? 'active' : ''}">${l.label}</a></li>`
  ).join('');

  return `
    <nav class="nav" id="main-nav">
      <div class="nav-inner">
        <a href="/" class="nav-logo"><img src="/images/logo/powerline-logo.png" alt="Powerline Tattoo" style="height: 50px;"></a>
        <ul class="nav-links">${navLinks}</ul>
        <a href="/book" class="nav-book">Book Now</a>
        <button class="nav-hamburger" id="nav-hamburger" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div><!-- /.nav-inner -->
    </nav>
    <div class="nav-overlay" id="nav-overlay">
      ${links.map(l => `<a href="${l.href}">${l.label}</a>`).join('')}
      <a href="/book" class="nav-book">Book Now</a>
    </div>
  `;
}

// --- Footer HTML ---
function getFooterHTML() {
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="/" class="nav-logo"><img src="/images/logo/powerline-logo.png" alt="Powerline Tattoo" style="height: 50px;"></a>
            <p>New England's premier custom tattoo studio. Appointment only — no walk-ins.</p>
          </div>
          <div class="footer-col">
            <h4>Navigate</h4>
            <a href="/">Home</a>
            <a href="/artists">Artists</a>
            <a href="/gallery">Gallery</a>
            <a href="/book">Book Now</a>
          </div>
          <div class="footer-col">
            <h4>Info</h4>
            <a href="/info">FAQ</a>
            <a href="/info">Aftercare</a>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
          </div>
          <div class="footer-col">
            <h4>Contact</h4>
            <a href="tel:4013697771">401-369-7771</a>
            <a href="mailto:powerlinetattoo@gmail.com">powerlinetattoo@gmail.com</a>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 8px;">706 Reservoir Ave<br>Cranston, RI 02910</p>
          </div>
        </div>
        <div class="footer-bottom">
          <span>&copy; 2026 Powerline Tattoo. All rights reserved.</span>
          <div class="footer-social">
            <a href="https://instagram.com/powerlinetattoo" target="_blank" rel="noopener" aria-label="Instagram">&#9679; Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}

// --- Inject Nav & Footer ---
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page || 'home';

  // Insert nav at start of body
  document.body.insertAdjacentHTML('afterbegin', getNavHTML(page));

  // Insert footer at end of body
  document.body.insertAdjacentHTML('beforeend', getFooterHTML());

  // Scroll progress bar
  document.body.insertAdjacentHTML('afterbegin', '<div class="scroll-progress" id="scroll-progress"></div>');

  initMobileMenu();
  initScrollNav();
  initScrollReveal();
  initScrollProgress();
  initStatCounters();

  // Page-load fade-in
  requestAnimationFrame(() => document.body.classList.add('loaded'));
});

// --- Mobile Menu ---
function initMobileMenu() {
  const hamburger = document.getElementById('nav-hamburger');
  const overlay = document.getElementById('nav-overlay');
  if (!hamburger || !overlay) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    overlay.classList.toggle('open');
    document.body.style.overflow = overlay.classList.contains('open') ? 'hidden' : '';
  });

  // Close on link click
  overlay.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// --- Scroll Nav (transparent → solid) ---
function initScrollNav() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  function checkScroll() {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', checkScroll, { passive: true });
  checkScroll();
}

// --- Scroll Progress Bar ---
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;

  function update() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = pct + '%';
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

// --- Animated Stat Counters ---
function initStatCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (!counters.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animate(el) {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    if (prefersReduced) {
      el.textContent = target.toLocaleString() + suffix;
      return;
    }
    const duration = 1600;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = value.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

// --- Scroll Reveal ---
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  reveals.forEach(el => observer.observe(el));
}
