import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const contactSource = readFileSync(new URL('../js/contact.mjs', import.meta.url), 'utf8').replace(/^import[^\n]+\n/, '');
const analyticsSource = readFileSync(new URL('../js/analytics.js', import.meta.url), 'utf8');

function environment({ observer = true, idle = true, readyState = 'loading' } = {}) {
  const elements = new Map();
  const scripts = [];
  const observers = [];
  const timers = new Map();
  const idleTasks = [];
  const renders = [];
  let nextTimer = 0;
  const element = () => Object.assign(new EventTarget(), {
    textContent: '', hidden: false, dataset: { sitekey: 'public-test-key', size: 'compact' },
    remove() { this.removed = true; },
  });
  for (const id of ['contactForm', 'formStatus', 'submitLabel', 'verificationStatus', 'retryVerification']) elements.set(id, element());
  const form = elements.get('contactForm');
  form.querySelector = () => element();
  const window = Object.assign(new EventTarget(), {
    setTimeout(callback, delay) { const id = ++nextTimer; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    hcaptcha: { render(container, options) { renders.push({ container, options }); return 'widget-id'; } },
  });
  if (idle) window.requestIdleCallback = callback => idleTasks.push(callback);
  if (observer) window.IntersectionObserver = class {
    constructor(callback, options) { this.callback = callback; this.options = options; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
  };
  const document = {
    readyState, head: { append(script) { scripts.push(script); } },
    getElementById: id => elements.get(id), createElement: element,
  };
  // The browser global object and window must be the same object for gtag().
  Object.assign(window, { window, document, Date, IntersectionObserver: window.IntersectionObserver });
  if (!observer) delete window.IntersectionObserver;
  const context = vm.createContext(window);
  const runTimer = delay => {
    const entry = [...timers].find(([, timer]) => timer.delay === delay);
    assert.ok(entry, `Expected a ${delay} ms timer`);
    timers.delete(entry[0]); entry[1].callback();
  };
  return { context, window, elements, scripts, observers, renders, timers, idleTasks, runTimer };
}

test('CAPTCHA stays unloaded until the form approaches and renders only when its API is ready', () => {
  const e = environment();
  vm.runInContext(contactSource, e.context);
  assert.equal(e.scripts.length, 0);
  e.observers[0].callback([{ isIntersecting: false }]);
  assert.equal(e.scripts.length, 0);
  e.observers[0].callback([{ isIntersecting: true }]);
  assert.equal(e.scripts.length, 1);
  assert.match(e.scripts[0].src, /render=explicit&onload=onContactVerificationReady/);
  assert.equal(e.renders.length, 0);
  e.elements.get('contactForm').dispatchEvent(new Event('focusin'));
  assert.equal(e.scripts.length, 1);
  e.window.onContactVerificationReady();
  e.window.onContactVerificationReady();
  assert.equal(e.renders.length, 1);
  assert.equal(e.renders[0].options.size, 'compact');
  assert.equal(e.timers.size, 0);
  assert.equal(e.elements.get('verificationStatus').textContent, '');
});

for (const failure of ['network', 'timeout']) {
  test(`CAPTCHA ${failure} failure allows retry and does not duplicate a loaded widget`, () => {
    const e = environment();
    vm.runInContext(contactSource, e.context);
    e.elements.get('contactForm').dispatchEvent(new Event('focusin'));
    if (failure === 'network') e.scripts[0].dispatchEvent(new Event('error'));
    else e.runTimer(15000);
    assert.equal(e.elements.get('retryVerification').hidden, false);
    assert.match(e.elements.get('verificationStatus').textContent, /could not load/);
    e.elements.get('retryVerification').dispatchEvent(new Event('click'));
    assert.equal(e.scripts.length, 2);
    e.window.onContactVerificationReady();
    assert.equal(e.renders.length, 1);
    assert.equal(e.elements.get('retryVerification').hidden, true);
    e.elements.get('contactForm').dispatchEvent(new Event('pointerdown'));
    assert.equal(e.scripts.length, 2);
  });
}

test('CAPTCHA can load on keyboard interaction without IntersectionObserver', () => {
  const e = environment({ observer: false });
  vm.runInContext(contactSource, e.context);
  assert.equal(e.scripts.length, 0);
  e.elements.get('contactForm').dispatchEvent(new Event('focusin'));
  assert.equal(e.scripts.length, 1);
  e.window.onContactVerificationReady();
  assert.equal(e.renders.length, 1);
});

test('analytics waits for page load, the five-second delay, and an idle period', () => {
  const e = environment();
  vm.runInContext(analyticsSource, e.context);
  assert.equal(e.scripts.length, 0);
  assert.equal(e.timers.size, 0);
  assert.equal(e.window.dataLayer.length, 2);
  e.window.dispatchEvent(new Event('load'));
  e.runTimer(5000);
  assert.equal(e.scripts.length, 0);
  e.idleTasks[0]();
  assert.equal(e.scripts.length, 1);
  assert.match(e.scripts[0].src, /googletagmanager\.com\/gtag\/js\?id=G-6EZD4ZRZ76/);
  e.window.dispatchEvent(new Event('load'));
  assert.equal(e.timers.size, 0);
});

test('analytics also works after load and without requestIdleCallback', () => {
  const e = environment({ readyState: 'complete', idle: false });
  vm.runInContext(analyticsSource, e.context);
  assert.equal(e.scripts.length, 0);
  e.runTimer(5000);
  assert.equal(e.scripts.length, 1);
});
