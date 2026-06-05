document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const msgEl = document.getElementById('contact-form-message');

  function showMessage(text, type) {
    msgEl.textContent = text;
    msgEl.className = 'form-message ' + type;
    msgEl.style.display = 'block';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    msgEl.className = 'form-message';
    msgEl.textContent = '';
    msgEl.style.display = 'none';

    // Client-side check for required fields
    const required = ['name', 'email', 'phone', 'subject', 'description', 'artist', 'colorOrBw', 'spamAck'];
    for (const name of required) {
      const field = form.querySelector(`[name="${name}"]`);
      if (!field || !field.value.trim()) {
        showMessage('Please fill in all required fields (marked with *).', 'error');
        return;
      }
    }
    if (!form.querySelector('[name="hearAbout"]:checked')) {
      showMessage('Please let us know how you heard about us.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        body: new FormData(form)
      });
      const data = await response.json();

      if (data.success) {
        showMessage(
          "Request sent! We'll get back to you soon — please check your spam folder if you don't see our reply in your inbox.",
          'success'
        );
        form.reset();
      } else {
        showMessage(data.error || 'Something went wrong. Please try again.', 'error');
      }
    } catch {
      showMessage('Failed to send. Please call us at 401-369-7771.', 'error');
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Request';
  });
});
