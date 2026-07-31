# Note copy button

Replace:

- `public/index.html`
- `public/js/main.js`
- `public/css/styles.css`

Then run:

```bash
python3 scripts/build_site.py
```

No package, CDN, icon font, or internet connection is required. The icon is inline SVG and the clipboard code includes a fallback for browsers that do not expose `navigator.clipboard`.
