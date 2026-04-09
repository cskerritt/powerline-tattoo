document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('booking-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const msgEl = document.getElementById('book-form-message');
    msgEl.className = 'form-message';
    msgEl.textContent = '';
    msgEl.style.display = 'none';

    const name = form.querySelector('[name="name"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const idea = form.querySelector('[name="idea"]').value.trim();

    if (!name || !email || !idea) {
      msgEl.textContent = 'Please fill in your name, email, and tattoo idea.';
      msgEl.className = 'form-message error';
      msgEl.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const formData = new FormData(form);
      const response = await fetch('/api/book', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (data.success) {
        msgEl.textContent = 'Booking request sent! We\'ll be in touch within 1-2 business days.';
        msgEl.className = 'form-message success';
        form.reset();
      } else {
        msgEl.textContent = data.error || 'Something went wrong. Please try again.';
        msgEl.className = 'form-message error';
      }
    } catch {
      msgEl.textContent = 'Failed to send. Please call us at 401-369-7771 or email powerlinetattoo@gmail.com.';
      msgEl.className = 'form-message error';
    }

    msgEl.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Booking Request';
  });
});
