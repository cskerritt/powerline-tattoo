document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initAccordion();
});

function initTabs() {
  const buttons = Array.from(document.querySelectorAll('.tab-btn'));
  const panels = Array.from(document.querySelectorAll('.tab-panel'));
  if (!buttons.length) return;

  buttons.forEach((btn, i) => {
    const target = btn.dataset.tab;
    if (!btn.id) btn.id = target + '-tab';
    btn.setAttribute('aria-controls', target);
    const panel = document.getElementById(target);
    if (panel) {
      panel.setAttribute('aria-labelledby', btn.id);
      panel.setAttribute('tabindex', '0');
    }

    function activate() {
      buttons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
        b.setAttribute('tabindex', '-1');
      });
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      btn.setAttribute('tabindex', '0');
      const p = document.getElementById(target);
      if (p) p.classList.add('active');
    }

    btn.addEventListener('click', activate);

    // Arrow-key navigation per the ARIA tabs pattern.
    btn.addEventListener('keydown', (e) => {
      let idx = null;
      if (e.key === 'ArrowRight') idx = (i + 1) % buttons.length;
      else if (e.key === 'ArrowLeft') idx = (i - 1 + buttons.length) % buttons.length;
      else if (e.key === 'Home') idx = 0;
      else if (e.key === 'End') idx = buttons.length - 1;
      if (idx !== null) {
        e.preventDefault();
        buttons[idx].focus();
        buttons[idx].click();
      }
    });
  });

  // Roving tabindex: only the selected tab is in the tab order.
  buttons.forEach(b => b.setAttribute('tabindex', b.classList.contains('active') ? '0' : '-1'));
}

function initAccordion() {
  const items = document.querySelectorAll('.accordion-item');

  items.forEach((item, i) => {
    const header = item.querySelector('.accordion-header');
    const body = item.querySelector('.accordion-body');
    if (!header || !body) return;

    // Expose the header as a real, keyboard-operable control.
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-expanded', 'false');
    if (!body.id) body.id = 'accordion-body-' + i;
    header.setAttribute('aria-controls', body.id);

    function toggle() {
      const isOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.accordion-item.open').forEach(openItem => {
        openItem.classList.remove('open');
        const ob = openItem.querySelector('.accordion-body');
        if (ob) ob.style.maxHeight = '0';
        const oh = openItem.querySelector('.accordion-header');
        if (oh) oh.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
        header.setAttribute('aria-expanded', 'true');
      }
    }

    header.addEventListener('click', toggle);
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        toggle();
      }
    });
  });
}
