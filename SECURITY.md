# Website security

This is a public static site on GitHub Pages. It has no application server,
user accounts, database, or private session cookies. Contact messages go directly
to Web3Forms. Public HTML, JavaScript, media, and browser integration identifiers
are downloadable by design.

## Implemented in the site

- Every HTML entry point, including the two legacy redirects, has an early
  Content Security Policy (CSP) that denies resources by default and allows the
  sources used by that page. Inline event handlers, executable inline scripts,
  `eval`, plugin objects, unapproved frames/connections, and injected base URLs
  are blocked. Local styles, fonts, images, and sermon audio remain available.
- Analytics initialization is in an external script. The home page's JSON-LD
  is allowed by its exact SHA-256 hash. Google advertising personalization and
  Google signals are disabled. The script and endpoint allowlists still trust
  the specified analytics and CAPTCHA providers; CSP does not make a compromised
  permitted provider safe.
- Referrers use `strict-origin-when-cross-origin`, so cross-origin requests omit
  page paths and queries. This retains the origin needed by YouTube and Maps.
- YouTube uses its privacy-enhanced embed. Both media embeds are sandboxed;
  clipboard, motion sensors, automatic top-level navigation, and form submission
  permissions are not granted. User-initiated external links can open a new tab.
- The contact form uses POST and a fixed HTTPS endpoint. The payload contains
  only approved fields; extra provider options or redirect fields injected into
  the DOM are not forwarded. Fields have length and control-character checks.
  User text and provider errors are never inserted as HTML.
- The form includes hCaptcha and a honeypot, blocks duplicate concurrent requests,
  omits credentials, rejects fetch redirects, and stops waiting after 15 seconds.
  CAPTCHA tokens are cleared after every attempt. Rate-limit and failure messages
  preserve the visitor's input. The form cannot submit if JavaScript fails.
- Automated checks protect the CSP, field allowlist, and safe rendering behavior.
  GitHub Actions dependencies are pinned to commits; workflow tokens are read-only
  and checkout does not persist credentials. Dependabot checks Action updates.

Client-side checks are not server-side rate limiting or spam enforcement. A caller
can bypass the browser entirely. Follow the provider setup below before treating
CAPTCHA as enforced.

## Required Web3Forms setup

The hCaptcha widget uses Web3Forms' documented public integration sitekey. It
needs no new hCaptcha account. **Enable hCaptcha in the existing form's Web3Forms
dashboard under its spam/CAPTCHA settings.** Their documentation currently calls
this setting "Block Spam". This makes a valid token mandatory on the server;
adding the widget alone is insufficient. This account setting was not changed or
verified from this checkout.

If your Web3Forms plan supports domain restrictions, allow only the site's actual
production hostnames. This is an additional provider feature, not a substitute for
CAPTCHA. The Web3Forms `access_key` is a public form identifier, not a server secret;
moving it into frontend JavaScript or a frontend environment variable would not
hide it.

The hCaptcha API does not accept `localhost` or `127.0.0.1` as supplied hostnames.
The normal local preview still works, but real CAPTCHA verification requires a
development hostname or the deployed site. Automated contact tests should mock
both verification and the Web3Forms response. They must not send real mail.

Sources:
- [Web3Forms hCaptcha integration and activation](https://docs.web3forms.com/getting-started/customizations/spam-protection/hcaptcha)
- [Web3Forms public access keys](https://docs.web3forms.com/getting-started/faq)
- [Web3Forms domain restrictions](https://docs.web3forms.com/getting-started/pro-features/restrict-to-domain)
- [hCaptcha local development](https://docs.hcaptcha.com/#local-development)

## Hosting and Google Maps settings

On 25 September 2026, the public HTTP URL redirected to HTTPS, and the GitHub Pages
API confirmed `https_enforced: true` with `main` as the published branch. Keep
**Settings → Pages → Enforce HTTPS** enabled.

The Google Maps embed uses a browser API key. In Google Cloud, confirm that its
website/referrer restrictions permit only the intended production hostnames and
that its API restrictions permit Maps Embed API only. These account-side key
restrictions were not inspected or changed. Do not add server credentials to this
repository. Real secrets belong in their provider's server-side configuration.

The live response did not include HSTS, X-Content-Type-Options, Permissions-Policy,
X-Frame-Options, or a CSP response header when checked. The HTML policy works on
GitHub Pages, but HTML meta tags cannot implement those response-header controls
or CSP `frame-ancestors`. There is intentionally no misleading `_headers` file
that would be ignored by the current GitHub Pages host.

If a reverse proxy/CDN with response-header controls is added, configure these
headers on all site responses:

```http
Content-Security-Policy: frame-ancestors 'none'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=()
Strict-Transport-Security: max-age=31536000
```

The `frame-ancestors` response policy is enforced alongside the page's resource
policy. This prevents other sites from framing the church website; it does not
prevent the church page from embedding its approved video and map. Do not add
HSTS `includeSubDomains` or `preload` without checking all subdomains first.
No proxy/CDN configuration, DNS migration, or production deployment was performed
as part of the source changes. Recheck real response headers after deployment.

References:
- [CSP and meta delivery](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy)
- [frame-ancestors requires an HTTP response header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors)
- [GitHub Pages HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- [Restrict Google Maps API keys](https://developers.google.com/maps/api-security-best-practices)

## Maintaining and checking the protections

Run with Node.js 24 (no npm installation is needed):

```sh
node scripts/security-policy.mjs --check
node --test tests/security.test.mjs
node --check js/script.js
node --check js/analytics.js
node --check js/contact.mjs
node --check js/contact-validation.mjs
```

If JSON-LD, page types, or resource dependencies change, update the generator if
needed, regenerate the HTML policies, then rerun checks:

```sh
node scripts/security-policy.mjs
```

The generator is a development tool; browsers enforce the generated HTML policy
without a build step. Development documentation, scripts, and tests are excluded
from the GitHub Pages/Jekyll output by `_config.yml`.

Before publishing, check browser CSP violation events, menus and the event
carousel, sermon search/audio, the video and map, and the CAPTCHA widget. Verify
that an inline script and an unapproved form destination are blocked. Test missing
CAPTCHA, honeypot, duplicate submit, success, rejection, rate limiting, timeout,
and network failure using intercepted responses. A local mock cannot prove real
mail delivery or provider-side CAPTCHA enforcement.
