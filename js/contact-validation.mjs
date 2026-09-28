export const FIELD_LIMITS = Object.freeze({
  name: 120,
  email: 254,
  phone: 40,
  message: 5000,
});

export class ContactValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.name = 'ContactValidationError';
    this.field = field;
  }
}

/* These checks protect the UI. Provider-side CAPTCHA/spam checks remain essential:
   a direct API caller can bypass any code running in a visitor's browser. */
export function createContactPayload(formData) {
  if (formData.get('botcheck')) {
    throw new ContactValidationError('botcheck', 'Your message could not be sent. Please contact us by phone or email.');
  }

  const fields = {};
  for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
    const raw = formData.get(field);
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (!value || value.length > limit) {
      throw new ContactValidationError(field, `Please enter your ${field} (up to ${limit} characters).`);
    }
    // Keep newlines in messages, but not in single-line fields or mail headers.
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(value)
      || (field !== 'message' && /[\r\n]/u.test(value))) {
      throw new ContactValidationError(field, `Please remove unsupported characters from your ${field}.`);
    }
    fields[field] = value;
  }

  const token = formData.get('h-captcha-response');
  if (typeof token !== 'string' || !token.trim() || token.length > 32768) {
    throw new ContactValidationError('captcha', 'Please complete the “I am human” check before sending your message.');
  }

  const accessKey = formData.get('access_key');
  if (typeof accessKey !== 'string' || !accessKey.trim()) {
    throw new ContactValidationError('configuration', 'The contact form is unavailable. Please contact us by phone or email.');
  }

  // Explicit allowlist: never forward injected fields, redirect destinations,
  // custom subjects, file attachments, or provider options from the DOM.
  return {
    access_key: accessKey.trim(),
    subject: 'New message from the church website',
    ...fields,
    botcheck: '',
    'h-captcha-response': token.trim(),
  };
}
