# Note Builder sidebar button

Replace these existing files:

- `public/index.html`
- `public/js/main.js`
- `public/css/styles.css`

Then run:

```bash
python3 scripts/build_site.py
```

This change:

- Adds a **Builder** button next to the centered **Notes** heading.
- Links to `./tools/note-builder/`.
- Removes Note Builder from only the Tools dropdown.
- Keeps Note Builder available to global search and other generated site features.
- Adds no new runtime CSS or JavaScript files.
