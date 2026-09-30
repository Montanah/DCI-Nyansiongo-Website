# Deliverance Church International Nyansiongo

A static HTML, CSS, and JavaScript website hosted on GitHub Pages.

## Local preview

From this directory, run:

```sh
npx serve . -l 5500
```

Open `http://localhost:5500` in Cursor's browser or any web browser. Keep the
terminal running and refresh the browser after making changes. Stop the server
with Ctrl+C. This project has no npm development script or build step.

## Pages and assets

- `index.html`: welcome, weekly programs, past events, featured sermons, and contact.
- `aboutus/index.html`: church history, sister branches, and pastors.
- `sermons/index.html`: searchable archive with the original audio recordings.
- `articles/index.html`: the complete seven-part teaching series.
- `css/base.css` and `js/script.js`: shared styles and interactions.
- `css/home.css`, `css/about.css`, `css/sermons.css`, and `css/articles.css`: page styles.
- `fonts/`: locally served DM Sans and Instrument Serif, with their OFL licenses.

The contact form uses Web3Forms. YouTube and Google Maps are lazy-loaded external
embeds. Contact-form UI tests should mock the provider response rather than send
messages. A successful local preview does not verify email delivery.

## Loading performance

The shared logo and homepage images use compressed WebP assets in
`images/optimized/`. Posters have responsive sizes and intrinsic dimensions;
their original files remain available, including the linked 2026 theme poster.
Footer icons are small, lazy-loaded SVG files in `images/icons/`.

The contact form loads hCaptcha within 600px of the form or when a visitor
interacts with it. The provider's ready callback renders the widget; a failed
or timed-out download offers a retry. A valid verification token is still required
before sending. YouTube and Maps load within 400px of their frames; the existing
YouTube channel and directions links also work without JavaScript.

Analytics is queued immediately, then downloaded during an idle period starting
five seconds after page load (with a two-second idle timeout). Visits that end
before it loads may not be recorded. The measurement ID and privacy settings
are unchanged.

To regenerate display images, install the WebP `cwebp` command and run
`node scripts/optimize-images.mjs`. Generated files are committed; deployment
still needs no npm installation or build step.

The September 2026 check reduced the logo from 297,884 to 9,962 bytes and the
six largest poster variants from 3,080,659 to 547,752 bytes (the smaller variants
total 221,596 bytes). All six SVG footer icons together are 2,037 bytes.

One cold-cache local Chromium comparison at 390px, 1.6 Mbps, 150ms latency, and
4x CPU slowdown measured the main image appearing at 3.38s before versus 1.62s
after. This is a preview measurement, not a production performance guarantee.
Browser checks covered 320px, 390px, and 1440px layouts, image selection, carousel,
navigation, sermon search, CAPTCHA download failure/retry, and mocked contact
submissions. The real CAPTCHA widget was also checked using a local response
override at the production hostname; no real message was sent.

## Security

Browser security policies are included directly in every HTML entry point.
The contact form requires hCaptcha and uses bounded, allowlisted fields.
See [SECURITY.md](SECURITY.md) for the required Web3Forms dashboard activation,
GitHub Pages header limitations, and Google Maps key restrictions.

Run the automated checks without installing packages:

```sh
node scripts/security-policy.mjs --check
node --test tests/*.test.mjs
```

After editing the inline JSON-LD or resource allowlists, run
`node scripts/security-policy.mjs` to refresh the policies before committing.
