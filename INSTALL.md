# Note Builder

## 1. Install the tool

Copy this complete folder into the site:

public/tools/note-builder/

Then rebuild the generated manifests:

python3 scripts/build_site.py

## 2. Install the tool-to-note navigation fix

Copy:

public/js/note-route-boot.js

into the site's existing:

public/js/

Then add this script in `public/index.html` before the existing deferred
`main.js` script:

```html
<script src="./js/note-route-boot.js"></script>
<script src="./js/main.js" defer></script>
```

`note-route-boot.js` only handles the initial display state. The existing
`main.js` continues loading and rendering the requested note normally.

## Note Builder behaviour

- Two-pane layout
- Available-note list on the left
- Search matches note titles only
- Double-click or press Enter to insert a note
- Drag a note into the editor to insert it
- The same note can be inserted repeatedly
- One blank line is inserted between notes
- The combined document is a normal editable textarea
- Live character and line counts
- Draft text and filename are saved in localStorage
- Copy-to-clipboard button
- Save button uses the browser save-location picker when supported
- Other browsers use their normal download-location behaviour
- UTF-8 `.txt` output
- All downloaded line endings are explicitly normalized to Linux LF (`\n`)
