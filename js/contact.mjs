import { ContactValidationError, createContactPayload } from './contact-validation.mjs';

const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');
const submitButton = form?.querySelector('button[type="submit"]');
const buttonLabel = document.getElementById('submitLabel');

if (form && status && submitButton && buttonLabel) {
  let pending = false;
  submitButton.disabled = false;

  const showStatus = (message, kind = '') => {
    status.textContent = message;
    status.className = `form-status${kind ? ` is-${kind}` : ''}`;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;

    let payload;
    try {
      payload = createContactPayload(new FormData(form));
    } catch (error) {
      if (error instanceof ContactValidationError) {
        showStatus(error.message, 'error');
        const field = form.elements.namedItem(error.field);
        if (field && error.field !== 'botcheck') field.focus();
      } else {
        showStatus('Your message could not be sent. Please contact us by phone or email.', 'error');
      }
      return;
    }

    pending = true;
    submitButton.disabled = true;
    buttonLabel.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    showStatus('Sending…');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        credentials: 'omit',
        redirect: 'error',
        cache: 'no-store',
        referrerPolicy: 'strict-origin-when-cross-origin',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 429) {
        showStatus('Too many messages have been sent recently. Please wait a few minutes or contact us by phone.', 'error');
        return;
      }

      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error('Submission was not accepted');
      showStatus("Thank you! We've received your message and will be in touch soon.", 'success');
      form.reset();
    } catch (error) {
      showStatus(error.name === 'AbortError'
        ? 'The request timed out, so we could not confirm delivery. Please contact us by phone or email.'
        : 'Sorry, your message could not be sent. Please complete the check again and retry, or contact us by phone or email.', 'error');
    } finally {
      window.clearTimeout(timeout);
      pending = false;
      submitButton.disabled = false;
      buttonLabel.textContent = 'Send message';
      form.removeAttribute('aria-busy');
      // Tokens expire and are single-use, including after a failed request.
      const tokenField = form.elements.namedItem('h-captcha-response');
      if (tokenField) tokenField.value = '';
      if (typeof window.hcaptcha?.reset === 'function') window.hcaptcha.reset();
    }
  });
}
