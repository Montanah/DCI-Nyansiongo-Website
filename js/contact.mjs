import { ContactValidationError, createContactPayload } from './contact-validation.mjs';

const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');
const submitButton = form?.querySelector('button[type="submit"]');
const buttonLabel = document.getElementById('submitLabel');

if (form && status && submitButton && buttonLabel) {
  let pending = false;
  const loadVerification = initContactVerification(form);
  submitButton.disabled = false;

  const showStatus = (message, kind = '') => {
    status.textContent = message;
    status.className = `form-status${kind ? ` is-${kind}` : ''}`;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    loadVerification();
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

/* Load hCaptcha near the form or on keyboard/pointer interaction, never at the
   top of the homepage. Explicit rendering waits for the provider's ready callback. */
function initContactVerification(contactForm) {
  const container = contactForm.querySelector('.h-captcha');
  const notice = document.getElementById('verificationStatus');
  const retry = document.getElementById('retryVerification');
  let state = 'idle';
  let observer;
  let script;
  let timer;

  function failed() {
    if (state !== 'loading') return;
    window.clearTimeout(timer);
    state = 'failed';
    script?.removeEventListener('error', failed);
    script?.remove();
    notice.textContent = 'Verification could not load. Please retry, or contact us by email or phone.';
    retry.hidden = false;
  }

  window.onContactVerificationReady = () => {
    if (state === 'ready') return;
    try {
      window.hcaptcha.render(container, {
        sitekey: container.dataset.sitekey,
        size: container.dataset.size,
      });
      window.clearTimeout(timer);
      script?.removeEventListener('error', failed);
      state = 'ready';
      notice.textContent = '';
      retry.hidden = true;
      observer?.disconnect();
      contactForm.removeEventListener('focusin', load);
      contactForm.removeEventListener('pointerdown', load);
    } catch {
      failed();
    }
  };

  function load() {
    if (state === 'loading' || state === 'ready') return;
    state = 'loading';
    notice.textContent = 'Loading verification…';
    retry.hidden = true;
    script = document.createElement('script');
    script.async = true;
    script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit&onload=onContactVerificationReady&recaptchacompat=off';
    script.addEventListener('error', failed, { once: true });
    timer = window.setTimeout(failed, 15000);
    document.head.append(script);
  }

  retry.addEventListener('click', load);
  contactForm.addEventListener('focusin', load);
  contactForm.addEventListener('pointerdown', load, { passive: true });
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        load();
      }
    }, { rootMargin: '600px 0px' });
    observer.observe(contactForm);
  }
  return load;
}
