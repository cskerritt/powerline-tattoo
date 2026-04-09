document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const msgEl = document.getElementById('contact-form-message');
    msgEl.className = 'form-message';
    msgEl.textContent = '';
    msgEl.style.display = 'none';

    const name = form.querySelector('[name="name"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const message = form.querySelector('[name="message"]').value.trim();

    if (!name || !email || !message) {
      msgEl.textContent = 'Please fill in all fields.';
      msgEl.className = 'form-message error';
      msgEl.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });
      const data = await response.json();

      if (data.success) {
        msgEl.textContent = 'Message sent! We\'ll get back to you soon.';
        msgEl.className = 'form-message success';
        form.reset();
      } else {
        msgEl.textContent = data.error || 'Something went wrong. Please try again.';
        msgEl.className = 'form-message error';
      }
    } catch {
      msgEl.textContent = 'Failed to send. Please call us at 401-369-7771.';
      msgEl.className = 'form-message error';
    }

    msgEl.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Message';
  });
});
