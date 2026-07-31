# Note Builder and note-viewer fixes

## 1. Replace the Note Builder

Copy the complete folder:

public/tools/note-builder/

## 2. Replace the note route helper

Copy:

public/js/note-route-boot.js

into the existing `public/js/` folder.

In `public/index.html`, keep it immediately before the existing deferred
`main.js` script:

```html
<script src="./js/note-route-boot.js"></script>
<script src="./js/main.js" defer></script>
```

The corrected helper no longer writes `Loading note…` into the viewer, so it
cannot overwrite a note that `main.js` has already rendered.

## 3. Add the responsive note-viewer stylesheet

Copy:

public/css/note-viewer-fixes.css

into the existing `public/css/` folder, then add this after the normal site
stylesheets in `public/index.html`:

```html
<link rel="stylesheet" href="./css/note-viewer-fixes.css">
```

This keeps the language label, including `Bash`, inside the viewer header on
small screens.

## 4. Rebuild

```bash
python3 scripts/build_site.py
```

## Included Note Builder fixes

- Editor textarea remains dark in dark mode.
- Editor text and placeholder remain readable in both themes.
- Save button uses a stable blue background with white text in both themes.
- Copy button remains available.
- Saved `.txt` files are UTF-8 with Linux LF (`\n`) line endings.
