# Repo note viewer fix

Replace only these existing files:

- `public/js/main.js`
- `public/css/styles.css`

Remove the previously added files and their HTML tags if they are still present:

- `public/js/note-route-boot.js`
- `public/css/note-viewer-fixes.css`

No change to `public/index.html` or `public/js/tool-base.js` is required for this fix.

The updated `main.js` opens the `?note=...` route after the generated notes manifest has loaded. The updated `styles.css` keeps the language label inside the code-window header on narrow screens.
