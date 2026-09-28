import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, join, relative } from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));

export function htmlFiles(directory = root) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || ['node_modules', 'images', 'fonts', 'Audio Messages'].includes(entry.name)) return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? htmlFiles(path) : entry.name.endsWith('.html') ? [path] : [];
  });
}

export function contentPolicy(html) {
  const analytics = html.includes('/js/analytics.js');
  const contact = html.includes('id="contactForm"');
  const scripts = ["'self'"];
  // Keep JSON-LD inline for search engines, and allow only its exact content.
  for (const match of html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    scripts.push(`'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`);
  }
  const styles = ["'self'"];
  const images = ["'self'"];
  const connections = [];
  const frames = [];
  if (analytics) {
    scripts.push('https://www.googletagmanager.com');
    images.push('https://www.googletagmanager.com', 'https://*.google-analytics.com');
    connections.push('https://www.googletagmanager.com', 'https://*.google-analytics.com', 'https://*.google.com');
  }
  if (contact) {
    const captcha = ['https://hcaptcha.com', 'https://*.hcaptcha.com'];
    scripts.push(...captcha);
    styles.push(...captcha);
    connections.push('https://api.web3forms.com', ...captcha);
    frames.push('https://www.youtube-nocookie.com', 'https://www.google.com', ...captcha);
  }
  const directives = {
    'default-src': ["'none'"],
    'base-uri': ["'none'"],
    'object-src': ["'none'"],
    'script-src': scripts,
    'script-src-attr': ["'none'"],
    'style-src': styles,
    'style-src-attr': ["'none'"],
    'img-src': images,
    'font-src': ["'self'"],
    'media-src': ["'self'"],
    'connect-src': connections.length ? connections : ["'none'"],
    'frame-src': frames.length ? frames : ["'none'"],
    'form-action': contact ? ['https://api.web3forms.com/submit'] : ["'none'"],
    'upgrade-insecure-requests': [],
  };
  // frame-ancestors, HSTS, nosniff and Permissions-Policy require response
  // headers; putting them in a meta tag would provide no protection.
  return Object.entries(directives).map(([key, values]) => `${key}${values.length ? ` ${values.join(' ')}` : ''}`).join('; ');
}

export function secureHtml(html) {
  const withoutPolicy = html
    .replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*>/g, '')
    .replace(/\s*<meta name="referrer"[^>]*>/g, '');
  return withoutPolicy.replace('<meta charset="UTF-8">', `<meta charset="UTF-8">\n    <meta http-equiv="Content-Security-Policy" content="${contentPolicy(withoutPolicy)}">\n    <meta name="referrer" content="strict-origin-when-cross-origin">`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  for (const file of htmlFiles()) {
    const original = readFileSync(file, 'utf8');
    const updated = secureHtml(original);
    if (check && original !== updated) {
      console.error(`Security policy is missing or stale: ${relative(root, file)}`);
      process.exitCode = 1;
    } else if (!check) {
      writeFileSync(file, updated);
    }
  }
}
