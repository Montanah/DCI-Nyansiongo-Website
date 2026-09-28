import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { contentPolicy, htmlFiles, root, secureHtml } from '../scripts/security-policy.mjs';
import { ContactValidationError, createContactPayload, FIELD_LIMITS } from '../js/contact-validation.mjs';

for (const path of htmlFiles()) {
  const name = relative(root, path);
  const html = readFileSync(path, 'utf8');
  test(`${name}: restrictive CSP precedes resources and stays synchronized`, () => {
    assert.equal(html, secureHtml(html));
    const index = html.indexOf('http-equiv="Content-Security-Policy"');
    assert.ok(index > -1 && index < html.search(/<link|<script|http-equiv="refresh"/));
    const policy = contentPolicy(html);
    assert.match(policy, /default-src 'none'/);
    assert.match(policy, /base-uri 'none'/);
    assert.match(policy, /object-src 'none'/);
    assert.match(policy, /script-src-attr 'none'/);
    assert.match(policy, /style-src-attr 'none'/);
    assert.doesNotMatch(policy, /unsafe-inline|unsafe-eval|frame-ancestors|report-uri/);
    assert.ok(!/script-src[^;]*(?:data:|blob:|\shttps:;)/.test(policy));
  });

  test(`${name}: no executable inline scripts, handlers, or mixed-content assets`, () => {
    for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (match[1].includes('type="application/ld+json"')) {
        assert.doesNotThrow(() => JSON.parse(match[2]));
      } else {
        assert.match(match[1], /src="(?:\/|https:\/\/)/);
        assert.equal(match[2].trim(), '');
      }
    }
    assert.doesNotMatch(html, /\son[a-z]+\s*=/i);
    assert.doesNotMatch(html, /(?:src|href|action)\s*=\s*["'](?:http:|javascript:|data:text\/html)/i);
    for (const match of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
      assert.match(match[0], /rel="[^"]*noopener/);
      assert.match(match[0], /rel="[^"]*noreferrer/);
    }
  });
}

test('third-party privileges are restricted to the contact page', () => {
  const home = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const about = readFileSync(new URL('../aboutus/index.html', import.meta.url), 'utf8');
  assert.match(contentPolicy(home), /connect-src[^;]*https:\/\/api\.web3forms\.com/);
  assert.doesNotMatch(contentPolicy(about), /web3forms|hcaptcha/);
  for (const iframe of home.matchAll(/<iframe\b[^>]*>/g)) {
    assert.match(iframe[0], /sandbox="/);
    assert.match(iframe[0], /referrerpolicy="strict-origin-when-cross-origin"/);
    assert.doesNotMatch(iframe[0], /allow-top-navigation|allow-forms|clipboard-write|accelerometer|gyroscope|web-share/);
  }
  assert.match(home, /https:\/\/www\.youtube-nocookie\.com\/embed\//);
});

test('contact form uses POST, a honeypot, CAPTCHA, and bounded fields', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<form id="contactForm" action="https:\/\/api\.web3forms\.com\/submit" method="POST">/);
  assert.match(html, /type="checkbox" name="botcheck" hidden/);
  assert.match(html, /class="h-captcha" data-sitekey="[^"]+" data-size="compact"/);
  assert.match(html, /type="submit" disabled/);
  for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
    const id = field[0].toUpperCase() + field.slice(1);
    assert.ok(html.includes(`id="${id}" maxlength="${limit}"`));
  }
});

function validForm(overrides = {}) {
  const form = new FormData();
  const fields = {
    access_key: 'public-form-identifier-for-tests',
    name: '  Jane Example  ',
    email: 'jane@example.com',
    phone: '+254 700 000 000',
    message: 'Please share information about your Sunday service.\nThank you.',
    'h-captcha-response': 'mock-token-not-valid-at-the-provider',
    ...overrides,
  };
  for (const [field, value] of Object.entries(fields)) form.set(field, value);
  return form;
}

test('allowed text is trimmed and unrelated/injected provider fields are omitted', () => {
  const payload = createContactPayload(validForm({
    redirect: 'https://attacker.invalid/',
    subject: 'Attacker supplied subject',
    ccemail: 'attacker@example.com',
    attachment: 'injected-file',
    message: '<img src=x onerror=alert(1)>\nA literal message, not HTML.',
  }));
  assert.deepEqual(Object.keys(payload).sort(), ['access_key','subject','name','email','phone','message','botcheck','h-captcha-response'].sort());
  assert.equal(payload.name, 'Jane Example');
  assert.equal(payload.subject, 'New message from the church website');
  // This module does not render user text as HTML or claim to sanitize an email.
  assert.match(payload.message, /^<img/);
});

test('honeypot and absent verification tokens are rejected before a request', () => {
  for (const overrides of [{botcheck:'on'}, {'h-captcha-response':''}, {'h-captcha-response':' '.repeat(10)}, {'h-captcha-response':'x'.repeat(32769)}]) {
    assert.throws(() => createContactPayload(validForm(overrides)), ContactValidationError);
  }
});

test('empty, oversized and control-character input is rejected', () => {
  for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
    for (const value of ['   ', 'x'.repeat(limit+1), 'text\u0000text']) {
      assert.throws(() => createContactPayload(validForm({[field]:value})), error => error.field === field);
    }
  }
  assert.throws(() => createContactPayload(validForm({name:'Name\r\nBcc: attacker@example.com'})), error => error.field === 'name');
  const file = new FormData();
  for (const [key, value] of validForm()) file.set(key,value);
  file.set('message', new Blob(['file data']), 'file.txt');
  assert.throws(() => createContactPayload(file), error => error.field === 'message');
});

test('source never writes HTML strings or logs contact data', () => {
  for (const file of ['script.js','analytics.js','contact.mjs','contact-validation.mjs']) {
    const source = readFileSync(new URL(`../js/${file}`, import.meta.url),'utf8');
    assert.doesNotMatch(source, /innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\s*\(|new Function|console\.(?:log|info|debug)/);
  }
});
