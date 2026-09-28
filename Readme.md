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

## Security

Browser security policies are included directly in every HTML entry point.
The contact form requires hCaptcha and uses bounded, allowlisted fields.
See [SECURITY.md](SECURITY.md) for the required Web3Forms dashboard activation,
GitHub Pages header limitations, and Google Maps key restrictions.

Run the automated checks without installing packages:

```sh
node scripts/security-policy.mjs --check
node --test tests/security.test.mjs
```

After editing the inline JSON-LD or resource allowlists, run
`node scripts/security-policy.mjs` to refresh the policies before committing.
